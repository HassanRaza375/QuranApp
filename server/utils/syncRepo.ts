// Phase 17C: the Prisma implementation of `SyncRepo`. Every query is scoped by `userId` (tests/syncRepo.test.ts checks that with a recording client).
import { Prisma } from "../generated/prisma/client";
import { useDb } from "./db";
import type { Row, SyncRepo, Tx } from "./syncHandlers";

type Db = Pick<Prisma.TransactionClient, "syncRecord" | "syncCursor" | "$queryRaw">;

const toRow = (r: { namespace: string; recordKey: string; payload: unknown; revision: bigint; deletedAt: Date | null; bytes: number }): Row => ({
  namespace: r.namespace,
  recordKey: r.recordKey,
  payload: r.payload ?? null,
  revision: r.revision,
  deleted: r.deletedAt !== null,
  bytes: r.bytes,
});

export const txFor = (db: Db): Tx => ({
  async lockCursor(userId) {
    await db.syncCursor.upsert({ where: { userId }, create: { userId }, update: {} });
    const rows = await db.$queryRaw<{ revision: bigint; bytes: number }[]>`SELECT "revision", "bytes" FROM "SyncCursor" WHERE "userId" = ${userId} FOR UPDATE`;
    return { revision: BigInt(rows[0]?.revision ?? 0), bytes: Number(rows[0]?.bytes ?? 0) };
  },
  async record(userId, namespace, recordKey) {
    const r = await db.syncRecord.findUnique({ where: { userId_namespace_recordKey: { userId, namespace, recordKey } } });
    return r ? toRow(r) : null;
  },
  async put(userId, row) {
    const payload = row.payload === null ? Prisma.DbNull : (row.payload as Prisma.InputJsonValue);
    const fields = { payload, revision: row.revision, deletedAt: row.deleted ? new Date() : null, bytes: row.bytes, schemaVer: 1 };
    await db.syncRecord.upsert({
      where: { userId_namespace_recordKey: { userId, namespace: row.namespace, recordKey: row.recordKey } },
      create: { userId, namespace: row.namespace, recordKey: row.recordKey, ...fields },
      update: fields,
    });
  },
  async setCursor(userId, revision, bytes) {
    await db.syncCursor.update({ where: { userId }, data: { revision, bytes } });
  },
});

export const prismaSyncRepo = (): SyncRepo => {
  const db = () => useDb();
  return {
    transaction: (_userId, fn) => db().$transaction(async (t) => fn(txFor(t)), { timeout: 15_000, maxWait: 5_000 }),
    async since(userId, since, limit) {
      const rows = await db().syncRecord.findMany({ where: { userId, revision: { gt: since } }, orderBy: { revision: "asc" }, take: limit });
      return rows.map(toRow);
    },
    async removeAll(userId) {
      const r = await db().$transaction([db().syncRecord.deleteMany({ where: { userId } }), db().syncCursor.deleteMany({ where: { userId } })]);
      return { removed: r[0].count };
    },
    async usage(userId) {
      const [c, n] = await Promise.all([db().syncCursor.findUnique({ where: { userId } }), db().syncRecord.count({ where: { userId, deletedAt: null } })]);
      return { revision: c?.revision ?? 0n, bytes: c?.bytes ?? 0, records: n };
    },
  };
};
