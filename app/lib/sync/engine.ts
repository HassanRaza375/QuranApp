// Phase 17C: one sync round, as pure logic over injected pieces (storage, the saved state, the server), so the unit tests run whole conversations between
// two "devices" and a fake server with no browser. The shape of a round: pull what changed on the server, project this device's records, merge each record
// by its namespace's rule (merge.ts), write the changes into storage, push what the server does not have, and save the state. A push the server refuses as
// stale (another device got there first) starts the round again, at most a few times.
import { ADAPTERS, settingAcceptable, type Adapter, type Store } from "./adapters";
import { hashOf, mergeRecord, type Payload } from "./merge";
import { categoryOf, NAMESPACES, validateOp, type Category } from "./namespaces";

export interface RemoteRecord {
  namespace: string;
  recordKey: string;
  payload: Payload;
  revision: string;
}
export interface PushOp {
  namespace: string;
  recordKey: string;
  baseRevision: string;
  payload: Payload;
}
export interface PushResult {
  namespace: string;
  recordKey: string;
  status: "ok" | "stale" | "invalid" | "limit";
  revision?: string;
}

export class SyncHttpError extends Error {
  constructor(readonly status: number) {
    super(`sync request failed with ${status}`);
  }
}

export interface Api {
  pull(since: string, limit: number): Promise<{ records: RemoteRecord[]; next: string; more: boolean }>;
  push(ops: PushOp[]): Promise<PushResult[]>;
}

export interface SyncState {
  /** the server revision this device has pulled up to */
  cursor: string;
  /** id (`namespace|recordKey`) -> the revision and hash this device and the server last agreed on */
  records: Record<string, { rev: string; hash: string }>;
  /** payloads the server refused, by id, so the same bytes are not sent again */
  rejected: Record<string, string>;
  deviceId: string;
  lastSyncedAt: number | null;
  /** the categories this device has pulled in full. Turning one on pulls from the start again; turning one off forgets it. */
  synced: Category[];
  /** this device has already merged data with the account once (the first merge takes a snapshot for Undo; later ones do not) */
  merged: boolean;
}
export const emptyState = (deviceId: string): SyncState => ({ cursor: "0", records: {}, rejected: {}, deviceId, lastSyncedAt: null, synced: [], merged: false });

export interface StateStore {
  load(): Promise<SyncState>;
  save(s: SyncState): Promise<void>;
}

export interface EngineDeps {
  store: Store;
  state: StateStore;
  api: Api;
  /** which categories to sync; read again at the start of each round (the account's toggles can change in a round) */
  categories: () => ReadonlySet<Category>;
  /** called once, before the first time remote data is written on a device that has never synced: keep the local values so the user can Undo */
  snapshot?: (keys: string[]) => void | Promise<void>;
  /** the storage keys that were rewritten (so open pages can reload them) */
  onChanged?: (keys: string[]) => void;
  /** extra adapters (the account's category toggles) */
  extra?: Adapter[];
  /** after the first merge on a device, write what the account had but do NOT push yet: the person has an Undo window, and Undo must leave the account as it was */
  holdFirstPush?: boolean;
}

export interface SyncReport {
  status: "ok" | "unauthorized" | "unavailable";
  rounds: number;
  pulled: number;
  pushed: number;
  written: number;
  /** only on the first round that wrote remote data into a device that had never synced: how many records came from each side */
  firstMerge?: { fromDevice: number; fromAccount: number };
  /** the first merge wrote data and the push was held back (see `holdFirstPush`) */
  held?: boolean;
}

const idOf = (ns: string, key: string) => `${ns}|${key}`;
const splitId = (id: string): [string, string] => {
  const i = id.indexOf("|");
  return [id.slice(0, i), id.slice(i + 1)];
};
const MAX_ROUNDS = 4;
const PUSH_CHUNK = 200;
const PUSH_BYTES = 200 * 1024;

export function projectAll(store: Store, cats: ReadonlySet<Category>, extra: Adapter[] = []): Map<string, Payload> {
  const out = new Map<string, Payload>();
  for (const a of [...ADAPTERS, ...extra]) {
    if (a.category !== "account" && !cats.has(a.category)) continue;
    for (const [k, p] of a.project(store)) out.set(idOf(a.ns, k), p);
  }
  return out;
}

export async function syncOnce(deps: EngineDeps): Promise<SyncReport> {
  const report: SyncReport = { status: "ok", rounds: 0, pulled: 0, pushed: 0, written: 0 };
  const adapters = [...ADAPTERS, ...(deps.extra ?? [])];
  let state = await deps.state.load();
  let snapshotted = false;

  try {
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      report.rounds = round;
      const cats = deps.categories();
      state = { ...state, synced: state.synced.filter((c) => cats.has(c)) };
      const needsFullPull = [...cats].some((c) => !state.synced.includes(c));
      const inScope = (ns: string) => {
        const c = categoryOf(ns);
        return c === "account" || (c !== null && cats.has(c));
      };

      // 1. pull everything after the cursor
      const remote = new Map<string, RemoteRecord>();
      let cursor = needsFullPull ? "0" : state.cursor;
      for (;;) {
        const page = await deps.api.pull(cursor, 500);
        for (const r of page.records) remote.set(idOf(r.namespace, r.recordKey), r);
        report.pulled += page.records.length;
        cursor = page.next;
        if (!page.more) break;
      }

      // 2. what this device has now
      const local = projectAll(deps.store, cats, deps.extra);

      // 3. merge each record
      const ids = new Set<string>([...local.keys(), ...[...remote.keys()].filter((id) => inScope(splitId(id)[0])), ...Object.keys(state.records).filter((id) => inScope(splitId(id)[0]))]);
      const changes = new Map<string, Map<string, Payload>>(); // ns -> key -> value
      const ops: PushOp[] = [];
      const bases = { ...state.records };
      let markMerged = false;
      let fromDevice = 0;
      let fromAccount = 0;
      for (const id of ids) {
        const [ns, key] = splitId(id);
        const def = NAMESPACES[ns];
        if (!def || !inScope(ns)) continue;
        const r = remote.get(id);
        let remotePayload: Payload | undefined = r ? r.payload : undefined;
        if (r && r.payload !== null && validateOp(ns, key, r.payload) !== null) remotePayload = undefined; // a record that fails its own schema is ignored, never written
        const m = mergeRecord(def.merge, state.records[id]?.hash, local.get(id) ?? null, remotePayload);
        if (m.write && !(ns === "settings" && !settingAcceptable(key, m.value))) {
          if (!changes.has(ns)) changes.set(ns, new Map());
          changes.get(ns)!.set(key, m.value);
          if (def.category !== "account" && (m.value !== null || local.get(id) != null)) fromAccount++;
        }
        if (m.push) {
          if (m.value === null && !state.records[id] && !r) continue; // nothing was ever there
          if (state.rejected[id] === hashOf(m.value)) continue;
          ops.push({ namespace: ns, recordKey: key, baseRevision: r?.revision ?? state.records[id]?.rev ?? "0", payload: m.value });
          if (def.category !== "account" && m.value !== null) fromDevice++;
        } else if (r && remotePayload !== undefined) {
          bases[id] = { rev: r.revision, hash: hashOf(m.value) };
        }
      }

      // 4. write what the server had into this device (once a snapshot of the local values exists, for Undo)
      if (changes.size) {
        const keys = new Set<string>();
        for (const a of adapters) if (changes.has(a.ns)) for (const k of a.keys) keys.add(k);
        const dataChange = [...changes.keys()].some((ns) => categoryOf(ns) !== "account");
        if (dataChange && !state.merged && !snapshotted) {
          snapshotted = true;
          markMerged = true;
          await deps.snapshot?.([...keys]);
          report.firstMerge = { fromDevice, fromAccount };
        }
        const rewritten: string[] = [];
        for (const a of adapters) {
          const ch = changes.get(a.ns);
          if (!ch) continue;
          // an adapter only receives the records it owns (several settings adapters share the `settings` namespace)
          const own = new Map<string, Payload>();
          const mine = a.project(deps.store);
          for (const [k, v] of ch) if (ownedBy(a, k, mine)) own.set(k, v);
          rewritten.push(...a.apply(deps.store, own));
          report.written += own.size;
        }
        if (rewritten.length) deps.onChanged?.([...new Set(rewritten)]);
      }
      state = { ...state, cursor, records: bases, synced: [...cats], merged: state.merged || markMerged };
      // the first data merge can come in a later round (a second device first follows the account's toggles, then merges), so this is not tied to round 1
      if (deps.holdFirstPush && markMerged) {
        report.held = true;
        state.lastSyncedAt = Date.now();
        await deps.state.save(state);
        break;
      }

      // 5. push what the server does not have
      let stale = false;
      for (let i = 0; i < ops.length; ) {
        let bytes = 0;
        const chunk: PushOp[] = [];
        while (i < ops.length && chunk.length < PUSH_CHUNK && bytes < PUSH_BYTES) {
          bytes += JSON.stringify(ops[i]).length;
          chunk.push(ops[i++]!);
        }
        const results = await deps.api.push(chunk);
        for (const res of results) {
          const id = idOf(res.namespace, res.recordKey);
          const op = chunk.find((o) => o.namespace === res.namespace && o.recordKey === res.recordKey);
          if (res.status === "ok" && op) {
            state.records[id] = { rev: res.revision ?? "0", hash: hashOf(op.payload) };
            report.pushed++;
          } else if (res.status === "stale") stale = true;
          else if (op) state.rejected[id] = hashOf(op.payload);
        }
      }
      state.lastSyncedAt = Date.now();
      await deps.state.save(state);
      if (!stale && !categoriesChanged(cats, deps.categories())) break;
    }
  } catch (e) {
    await deps.state.save(state).catch(() => undefined);
    const status = e instanceof SyncHttpError ? e.status : 0;
    report.status = status === 401 ? "unauthorized" : "unavailable";
  }
  return report;
}

const categoriesChanged = (a: ReadonlySet<Category>, b: ReadonlySet<Category>) => a.size !== b.size || [...a].some((c) => !b.has(c));

/** Does this adapter own record `key` of its namespace? Adapters that share a namespace (the settings) own different record names. */
function ownedBy(a: Adapter, key: string, mine: Map<string, Payload>): boolean {
  if (a.ns !== "settings") return true;
  return mine.has(key) || SETTING_OWNERS.get(key) === a;
}
const SETTING_OWNERS = new Map<string, Adapter>();
for (const a of ADAPTERS) {
  if (a.ns !== "settings") continue;
  // every settings adapter has exactly one record name; project an empty store to learn it
  const probe = new Map<string, string>();
  const names = a.project({ get: (k) => probe.get(k) ?? null, set: () => undefined, remove: () => undefined });
  for (const n of names.keys()) SETTING_OWNERS.set(n, a);
}
