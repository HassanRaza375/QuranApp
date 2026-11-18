// Phase 17C: the Prisma repository's queries are all scoped by the user id (checked with a recording client; no database).
import { describe, expect, it } from "vitest";
import { txFor } from "../server/utils/syncRepo";

function recorder() {
  const calls: { op: string; arg: unknown }[] = [];
  const rec = (op: string, ret: unknown = null) => async (arg: unknown) => {
    calls.push({ op, arg });
    return ret;
  };
  const db = {
    syncCursor: { upsert: rec("cursor.upsert"), update: rec("cursor.update") },
    syncRecord: { findUnique: rec("record.findUnique"), upsert: rec("record.upsert") },
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push({ op: "raw", arg: { sql: strings.join("?"), values } });
      return [{ revision: 3n, bytes: 10 }];
    },
  };
  return { db: db as never, calls };
}

describe("the Prisma sync repository is scoped by user", () => {
  it("locks and updates only the user's cursor row", async () => {
    const { db, calls } = recorder();
    const tx = txFor(db);
    expect(await tx.lockCursor("u1")).toEqual({ revision: 3n, bytes: 10 });
    await tx.setCursor("u1", 5n, 20);
    expect(calls[0]).toMatchObject({ op: "cursor.upsert", arg: { where: { userId: "u1" } } });
    const raw = calls[1]!.arg as { sql: string; values: unknown[] };
    expect(raw.sql).toContain('WHERE "userId" = ?');
    expect(raw.sql).toContain("FOR UPDATE");
    expect(raw.values).toEqual(["u1"]);
    expect(calls[2]).toMatchObject({ op: "cursor.update", arg: { where: { userId: "u1" }, data: { revision: 5n, bytes: 20 } } });
  });
  it("reads and writes a record by its user, namespace and key together", async () => {
    const { db, calls } = recorder();
    const tx = txFor(db);
    await tx.record("u1", "library.item", "a");
    await tx.put("u1", { namespace: "library.item", recordKey: "a", payload: { addedAt: 1 }, revision: 2n, deleted: false, bytes: 12 });
    await tx.put("u1", { namespace: "library.item", recordKey: "b", payload: null, revision: 3n, deleted: true, bytes: 0 });
    expect(calls[0]!.arg).toEqual({ where: { userId_namespace_recordKey: { userId: "u1", namespace: "library.item", recordKey: "a" } } });
    const upsert = calls[1]!.arg as { where: unknown; create: { userId: string; deletedAt: unknown } };
    expect(upsert.where).toEqual({ userId_namespace_recordKey: { userId: "u1", namespace: "library.item", recordKey: "a" } });
    expect(upsert.create.userId).toBe("u1");
    expect(upsert.create.deletedAt).toBeNull();
    const tomb = calls[2]!.arg as { create: { deletedAt: unknown } };
    expect(tomb.create.deletedAt).toBeInstanceOf(Date);
  });
});
