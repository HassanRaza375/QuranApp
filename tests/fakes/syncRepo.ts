// An in-memory `SyncRepo` (server/utils/syncHandlers.ts): the same rules as the Prisma one, with no database. Used by the unit tests and by the browser tests' fake sync server.
import type { Row, SyncRepo, Tx } from "../../server/utils/syncHandlers";

export interface MemoryRepo extends SyncRepo {
  rows: Map<string, Row>;
  cursors: Map<string, { revision: bigint; bytes: number }>;
}

export function memoryRepo(): MemoryRepo {
  const rows = new Map<string, Row>();
  const cursors = new Map<string, { revision: bigint; bytes: number }>();
  const key = (u: string, n: string, k: string) => `${u}\u0000${n}\u0000${k}`;
  let chain: Promise<unknown> = Promise.resolve();
  return {
    rows,
    cursors,
    // transactions run one after another, as the row lock on SyncCursor orders them in the real database
    transaction<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
      const run = async () => {
        const tx: Tx = {
          async lockCursor(u) {
            if (!cursors.has(u)) cursors.set(u, { revision: 0n, bytes: 0 });
            return { ...cursors.get(u)! };
          },
          async record(u, n, k) {
            const r = rows.get(key(u, n, k));
            return r ? { ...r } : null;
          },
          async put(u, row) {
            rows.set(key(u, row.namespace, row.recordKey), { ...row, payload: row.payload === null ? null : JSON.parse(JSON.stringify(row.payload)) });
          },
          async setCursor(u, revision, bytes) {
            cursors.set(u, { revision, bytes });
          },
        };
        return fn(tx);
      };
      const result = chain.then(run, run) as Promise<T>;
      chain = result.catch(() => undefined);
      void userId;
      return result;
    },
    async since(userId, since, limit) {
      return [...rows.entries()]
        .filter(([k, r]) => k.startsWith(`${userId}\u0000`) && r.revision > since)
        .map(([, r]) => ({ ...r }))
        .sort((a, b) => (a.revision < b.revision ? -1 : 1))
        .slice(0, limit);
    },
    async removeAll(userId) {
      let removed = 0;
      for (const k of [...rows.keys()]) {
        if (!k.startsWith(`${userId}\u0000`)) continue;
        rows.delete(k);
        removed++;
      }
      cursors.delete(userId);
      return { removed };
    },
    async usage(userId) {
      const c = cursors.get(userId);
      const records = [...rows.entries()].filter(([k, r]) => k.startsWith(`${userId}\u0000`) && !r.deleted).length;
      return { revision: c?.revision ?? 0n, bytes: c?.bytes ?? 0, records };
    },
  };
}
