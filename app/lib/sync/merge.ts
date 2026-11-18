// Phase 17C: combining one record's three versions. Pure, so the unit tests can run it on random histories.
//   base   = what this device and the server last agreed on (a hash; undefined = this device never synced the record)
//   local  = what the device has now (null = the record is absent: a removal)
//   remote = what the server has (null = a tombstone or no record)
// The server never merges: a stale push is refused, the device pulls, merges here, and pushes again. Client clocks are never compared.
import type { MergeKind } from "./namespaces";

export type Payload = Record<string, unknown> | null;

/** Canonical JSON: keys sorted at every level, so two equal values always give the same text. */
export function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(",")}}`;
}

/** A fast 53-bit string hash (cyrb53). Not secret and not for security: it only tells "changed" from "same". */
function cyrb53(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const ABSENT = "∅";
export const hashOf = (p: Payload | undefined): string => (p == null ? ABSENT : cyrb53(stable(p)));

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const nums = (a: unknown, b: unknown): number => Math.max(typeof a === "number" ? a : 0, typeof b === "number" ? b : 0);
const unionSorted = <T extends string | number>(a: unknown, b: unknown): T[] => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])] as T[])].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));

/** Two edits of the same record, combined by the namespace's rule. `preferRemote` is true the first time a device meets a record. */
export function conflict(kind: MergeKind, local: Payload, remote: Payload, preferRemote: boolean): Payload {
  const winner = preferRemote ? remote : local;
  switch (kind) {
    case "lww":
      return winner;
    case "presence": {
      // an add on any device wins over a removal it has not seen
      if (local === null) return remote;
      if (remote === null) return local;
      if (typeof local.addedAt === "number" && typeof remote.addedAt === "number") return { ...winner, addedAt: Math.min(local.addedAt, remote.addedAt) };
      return winner;
    }
    case "dayLog":
      return local && remote ? { ...local, ayahs: unionSorted<string>(local.ayahs, remote.ayahs) } : (local ?? remote);
    case "story":
      return local && remote
        ? { ...(winner as Record<string, unknown>), read: unionSorted<number>(local.read, remote.read), updatedAt: nums(local.updatedAt, remote.updatedAt) }
        : (local ?? remote);
    case "tasbeeh":
      return local && remote ? { ...(winner as Record<string, unknown>), lifetime: nums(local.lifetime, remote.lifetime) } : (local ?? remote);
    case "activity": {
      if (!local || !remote) return local ?? remote;
      const out: Record<string, unknown> = { ...remote, ...local };
      for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) if (typeof local[k] === "number" || typeof remote[k] === "number") out[k] = nums(local[k], remote[k]);
      return out;
    }
    case "words": {
      if (!local || !remote) return local ?? remote;
      const out: Record<string, unknown> = {};
      for (const i of new Set([...Object.keys(local), ...Object.keys(remote)])) {
        const a = local[i];
        const b = remote[i];
        if (!isObj(a) || !isObj(b)) {
          out[i] = a ?? b;
          continue;
        }
        const last = [a.last, b.last].filter((x): x is string => typeof x === "string").sort().pop() ?? null;
        out[i] = { ...b, ...a, slipDays: unionSorted<string>(a.slipDays, b.slipDays), cleanDays: unionSorted<string>(a.cleanDays, b.cleanDays), last };
      }
      return out;
    }
  }
}

export interface Merged {
  /** what the device should hold, and what the server should end up with */
  value: Payload;
  /** true when the server does not already have `value` */
  push: boolean;
  /** true when the device's copy has to be rewritten */
  write: boolean;
}

/**
 * One record: the decision after a pull. `remote` is `undefined` when the pull did not mention the record (the server's copy is unchanged since `base`).
 */
export function mergeRecord(kind: MergeKind, base: string | undefined, local: Payload, remote: Payload | undefined): Merged {
  const hb = base ?? ABSENT;
  const hl = hashOf(local);
  const localChanged = hl !== hb;
  if (remote === undefined) return { value: local, push: localChanged, write: false };
  const hr = hashOf(remote);
  const remoteChanged = hr !== hb;
  if (hl === hr) return { value: local, push: false, write: false };
  if (!localChanged) return { value: remote, push: false, write: true };
  if (!remoteChanged) return { value: local, push: true, write: false };
  const value = conflict(kind, local, remote, base === undefined);
  const hv = hashOf(value);
  return { value, push: hv !== hr, write: hv !== hl };
}
