// Phase 17C: what the sync routes do, over a small repository interface (`SyncRepo`), so the unit tests run the real rules against an in-memory fake with no
// database. Every call is for ONE user, whose id the route took from the session. The server never interprets a payload beyond its schema: merging happens on
// the device, which pulls, merges and pushes again after a stale refusal.
import { LIMITS, payloadBytes, validateOp } from "../../app/lib/sync/namespaces";

export interface Row {
  namespace: string;
  recordKey: string;
  payload: unknown | null;
  revision: bigint;
  deleted: boolean;
  bytes: number;
}

export interface Tx {
  /** the user's revision counter and bytes, with the row locked for this transaction (two devices' pushes are ordered by it) */
  lockCursor(userId: string): Promise<{ revision: bigint; bytes: number }>;
  record(userId: string, namespace: string, recordKey: string): Promise<Row | null>;
  put(userId: string, row: Row): Promise<void>;
  setCursor(userId: string, revision: bigint, bytes: number): Promise<void>;
}

export interface SyncRepo {
  transaction<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T>;
  /** records with a revision above `since`, oldest first, at most `limit` */
  since(userId: string, since: bigint, limit: number): Promise<Row[]>;
  removeAll(userId: string): Promise<{ removed: number }>;
  usage(userId: string): Promise<{ revision: bigint; bytes: number; records: number }>;
}

export interface PushOpIn {
  namespace: string;
  recordKey: string;
  baseRevision: string | number;
  payload: unknown | null;
}
export interface PushResultOut {
  namespace: string;
  recordKey: string;
  status: "ok" | "stale" | "invalid" | "limit";
  revision?: string;
}

export const parseRevision = (v: unknown): bigint | null => {
  const s = typeof v === "number" && Number.isInteger(v) && v >= 0 ? String(v) : typeof v === "string" ? v : "";
  return /^\d{1,18}$/.test(s) ? BigInt(s) : null;
};

export async function pull(repo: SyncRepo, userId: string, since: bigint, limit: number) {
  const n = Math.max(1, Math.min(limit, LIMITS.pullLimit));
  const rows = await repo.since(userId, since, n + 1);
  const page = rows.slice(0, n);
  const next = page.length ? page[page.length - 1]!.revision : since;
  return {
    records: page.map((r) => ({ namespace: r.namespace, recordKey: r.recordKey, payload: r.deleted ? null : r.payload, revision: r.revision.toString(), deleted: r.deleted })),
    next: next.toString(),
    more: rows.length > n,
  };
}

export async function push(repo: SyncRepo, userId: string, ops: PushOpIn[]): Promise<{ results: PushResultOut[]; revision: string }> {
  return repo.transaction(userId, async (tx) => {
    const cur = await tx.lockCursor(userId);
    let revision = cur.revision;
    let bytes = cur.bytes;
    const results: PushResultOut[] = [];
    const seen = new Set<string>();
    for (const op of ops) {
      const base = parseRevision(op.baseRevision);
      const id = `${op.namespace}|${op.recordKey}`;
      if (base === null || validateOp(op.namespace, op.recordKey, op.payload) !== null || seen.has(id)) {
        results.push({ namespace: op.namespace, recordKey: op.recordKey, status: "invalid" });
        continue;
      }
      seen.add(id);
      const existing = await tx.record(userId, op.namespace, op.recordKey);
      // optimistic check: the record has moved on since the device last saw it
      if (existing && existing.revision > base) {
        results.push({ namespace: op.namespace, recordKey: op.recordKey, status: "stale" });
        continue;
      }
      const size = op.payload === null ? 0 : payloadBytes(op.payload);
      const next = bytes - (existing?.bytes ?? 0) + size;
      if (size > 0 && next > LIMITS.userBytes) {
        results.push({ namespace: op.namespace, recordKey: op.recordKey, status: "limit" });
        continue;
      }
      revision += 1n;
      bytes = next;
      await tx.put(userId, { namespace: op.namespace, recordKey: op.recordKey, payload: op.payload, revision, deleted: op.payload === null, bytes: size });
      results.push({ namespace: op.namespace, recordKey: op.recordKey, status: "ok", revision: revision.toString() });
    }
    if (revision !== cur.revision || bytes !== cur.bytes) await tx.setCursor(userId, revision, bytes);
    return { results, revision: revision.toString() };
  });
}
