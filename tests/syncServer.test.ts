// Phase 17C: the server's sync rules (server/utils/syncHandlers.ts, app/lib/sync/namespaces.ts) over the in-memory repository: validation, caps, stale pushes,
// revisions, tombstones, paging, and that a user only ever sees their own rows.
import { describe, expect, it } from "vitest";
import { LIMITS, NAMESPACES, NAMESPACE_NAMES, validateOp } from "../app/lib/sync/namespaces";
import { parseRevision, pull, push, type PushOpIn } from "../server/utils/syncHandlers";
import { memoryRepo } from "./fakes/syncRepo";

const op = (namespace: string, recordKey: string, payload: unknown, baseRevision: string | number = "0"): PushOpIn => ({ namespace, recordKey, baseRevision, payload });
const item = (k: string, base: string | number = "0", addedAt = 1) => op("library.item", k, { addedAt }, base);

describe("namespaces and payload schemas", () => {
  it("every namespace has a category, a merge rule and a schema", () => {
    for (const n of NAMESPACE_NAMES) {
      expect(["library", "progress", "settings", "account"]).toContain(NAMESPACES[n]!.category);
      expect(NAMESPACES[n]!.merge).toBeTruthy();
      expect(NAMESPACES[n]!.schema).toBeTruthy();
    }
  });
  it("refuses an unknown namespace (including inherited object names), a long or empty key, and a bad key for the namespace", () => {
    expect(validateOp("nope", "k", {})).toBe("namespace");
    expect(validateOp("constructor", "k", {})).toBe("namespace");
    expect(validateOp("__proto__", "k", {})).toBe("namespace");
    expect(validateOp("library.item", "", { addedAt: 1 })).toBe("key");
    expect(validateOp("library.item", "x".repeat(129), { addedAt: 1 })).toBe("key");
    expect(validateOp("progress.readSurah", "0", { completedAt: 1 })).toBe("key");
    expect(validateOp("progress.readSurah", "115", { completedAt: 1 })).toBe("key");
    expect(validateOp("progress.readSurah", "114", { completedAt: 1 })).toBeNull();
    expect(validateOp("progress.goalLog", "yesterday", { ayahs: [] })).toBe("key");
    expect(validateOp("progress.pin", "somewhere", {})).toBe("key");
  });
  it("accepts a tombstone (null) for any namespace and key that is allowed", () => {
    expect(validateOp("library.item", "ayah:1:1", null)).toBeNull();
  });
  it("is strict where it should be: no unknown fields, no wrong types, ranges hold", () => {
    expect(validateOp("library.item", "a", { addedAt: 1, extra: 1 })).toBe("payload");
    expect(validateOp("library.item", "a", { addedAt: -1 })).toBe("payload");
    expect(validateOp("library.item", "a", { addedAt: 1.5 })).toBe("payload");
    expect(validateOp("progress.lastRead", "singleton", { surahNo: 0, ayahNo: 1, updatedAt: 1 })).toBe("payload");
    expect(validateOp("progress.lastRead", "singleton", { surahNo: 115, ayahNo: 1, updatedAt: 1 })).toBe("payload");
    expect(validateOp("progress.lastRead", "singleton", { surahNo: 2, ayahNo: 1, updatedAt: 1, legacyField: "kept" })).toBeNull(); // legacy objects keep unknown fields
    expect(validateOp("progress.goal", "g", { id: "g", type: "forever", status: "active" })).toBe("payload");
    expect(validateOp("progress.goal", "g", { id: "g", type: "custom", status: "active" })).toBeNull();
    expect(validateOp("progress.fast", "2027-02-09", { status: "feasted" })).toBe("payload");
    expect(validateOp("progress.fast", "2027-02-30x", { status: "fasted" })).toBe("key");
    expect(validateOp("progress.goalLog", "2026-11-02", { ayahs: ["1:1", "bad"] })).toBe("payload");
    expect(validateOp("progress.goalLog", "2026-11-02", { ayahs: new Array(6237).fill("1:1") })).toBe("payload");
    expect(validateOp("library.meta", "a", { note: "x".repeat(10_001), tags: [], collectionIds: [], updatedAt: 1 })).toBe("payload");
    expect(validateOp("library.meta", "a", { note: "ok", tags: new Array(51).fill("t"), collectionIds: [], updatedAt: 1 })).toBe("payload");
    expect(validateOp("library.collection", "c", { id: "c", name: "", description: "", createdAt: 1 })).toBe("payload");
    expect(validateOp("settings", "fiqh", { raw: "sunni" })).toBeNull();
    expect(validateOp("settings", "fiqh", { raw: "sunni", v: 1 })).toBe("payload");
    expect(validateOp("account.categories", "singleton", { library: true, progress: false, settings: true })).toBeNull();
    expect(validateOp("account.categories", "other", { library: true, progress: false, settings: true })).toBe("key");
  });
  it("caps one record at 16 KB", () => {
    expect(validateOp("progress.hifzWords", "1:1", { "0": { pad: "x".repeat(17_000) } })).toBe("size");
  });
});

describe("push", () => {
  it("accepts valid ops with rising revisions, and refuses invalid ones without stopping the rest", async () => {
    const repo = memoryRepo();
    const r = await push(repo, "u1", [item("a"), op("nope", "k", {}), item("b"), item("a")]); // the last repeats "a" in one request
    expect(r.results.map((x) => x.status)).toEqual(["ok", "invalid", "ok", "invalid"]);
    expect(r.results.filter((x) => x.status === "ok").map((x) => x.revision)).toEqual(["1", "2"]);
    expect(r.revision).toBe("2");
  });
  it("revisions keep rising across requests and users have their own counters", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a")]);
    await push(repo, "u2", [item("a")]);
    const r = await push(repo, "u1", [item("b")]);
    expect(r.results[0]!.revision).toBe("2");
    expect((await push(repo, "u2", [item("b")])).results[0]!.revision).toBe("2");
  });
  it("two pushes at once are ordered by the cursor: no revision is used twice", async () => {
    const repo = memoryRepo();
    const [x, y] = await Promise.all([push(repo, "u1", [item("a"), item("b")]), push(repo, "u1", [item("c"), item("d")])]);
    const revs = [...x.results, ...y.results].map((r) => r.revision).sort();
    expect(revs).toEqual(["1", "2", "3", "4"]);
  });
  it("refuses a stale op (the record moved on since the device saw it) and applies the rest", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a")]); // revision 1
    await push(repo, "u1", [item("a", "1", 2)]); // revision 2
    const r = await push(repo, "u1", [item("a", "1", 3), item("fresh")]);
    expect(r.results.map((x) => x.status)).toEqual(["stale", "ok"]);
    const ok = await push(repo, "u1", [item("a", "2", 4)]);
    expect(ok.results[0]!.status).toBe("ok");
  });
  it("a removal is a tombstone: it keeps its revision, its payload is null, and later ops are checked against it", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a")]);
    const t = await push(repo, "u1", [op("library.item", "a", null, "1")]);
    expect(t.results[0]!.status).toBe("ok");
    const p = await pull(repo, "u1", 0n, 500);
    expect(p.records).toEqual([{ namespace: "library.item", recordKey: "a", payload: null, revision: "2", deleted: true }]);
    expect((await push(repo, "u1", [item("a", "1")])).results[0]!.status).toBe("stale");
  });
  it("rejects a revision that is not a number", async () => {
    const r = await push(memoryRepo(), "u1", [op("library.item", "a", { addedAt: 1 }, "abc"), op("library.item", "b", { addedAt: 1 }, "-1")]);
    expect(r.results.map((x) => x.status)).toEqual(["invalid", "invalid"]);
    expect(parseRevision("12")).toBe(12n);
    expect(parseRevision(7)).toBe(7n);
    expect(parseRevision("1e3")).toBeNull();
    expect(parseRevision("99999999999999999999")).toBeNull();
  });
  it("stops an account at its byte allowance, but a removal always works", async () => {
    const repo = memoryRepo();
    repo.cursors.set("u1", { revision: 0n, bytes: LIMITS.userBytes - 20 });
    const r = await push(repo, "u1", [op("library.meta", "a", { note: "this is more than twenty bytes of note text", tags: [], collectionIds: [], updatedAt: 1 })]);
    expect(r.results[0]!.status).toBe("limit");
    repo.rows.set("u1\u0000library.item\u0000z", { namespace: "library.item", recordKey: "z", payload: { addedAt: 1 }, revision: 1n, deleted: false, bytes: 12 });
    repo.cursors.set("u1", { revision: 1n, bytes: LIMITS.userBytes });
    expect((await push(repo, "u1", [op("library.item", "z", null, "1")])).results[0]!.status).toBe("ok");
    expect(repo.cursors.get("u1")!.bytes).toBe(LIMITS.userBytes - 12);
  });
  it("replacing a record counts only the difference in bytes", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a")]);
    const b1 = repo.cursors.get("u1")!.bytes;
    await push(repo, "u1", [item("a", "1", 99999)]);
    expect(repo.cursors.get("u1")!.bytes).toBeGreaterThan(b1);
    expect(repo.cursors.get("u1")!.bytes).toBeLessThan(b1 + 10);
  });
});

describe("pull", () => {
  it("returns records after a cursor, oldest first, and pages", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", ["a", "b", "c", "d", "e"].map((k) => item(k)));
    const first = await pull(repo, "u1", 0n, 2);
    expect(first.records.map((r) => r.recordKey)).toEqual(["a", "b"]);
    expect(first).toMatchObject({ next: "2", more: true });
    const rest = await pull(repo, "u1", 2n, 500);
    expect(rest.records.map((r) => r.recordKey)).toEqual(["c", "d", "e"]);
    expect(rest).toMatchObject({ next: "5", more: false });
    const none = await pull(repo, "u1", 5n, 500);
    expect(none).toEqual({ records: [], next: "5", more: false });
  });
  it("never returns another user's records", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("mine")]);
    await push(repo, "u2", [item("theirs")]);
    expect((await pull(repo, "u1", 0n, 500)).records.map((r) => r.recordKey)).toEqual(["mine"]);
    expect((await pull(repo, "u2", 0n, 500)).records.map((r) => r.recordKey)).toEqual(["theirs"]);
  });
  it("clamps the page size", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a")]);
    expect((await pull(repo, "u1", 0n, 0)).records).toHaveLength(1);
    expect((await pull(repo, "u1", 0n, 99999)).records).toHaveLength(1);
  });
});

describe("remove all", () => {
  it("removes every record and the counter of that user only", async () => {
    const repo = memoryRepo();
    await push(repo, "u1", [item("a"), item("b")]);
    await push(repo, "u2", [item("a")]);
    expect(await repo.removeAll("u1")).toEqual({ removed: 2 });
    expect((await pull(repo, "u1", 0n, 500)).records).toEqual([]);
    expect((await pull(repo, "u2", 0n, 500)).records).toHaveLength(1);
    expect((await repo.usage("u1")).records).toBe(0);
    expect((await push(repo, "u1", [item("a")])).results[0]!.revision).toBe("1"); // the counter starts over
  });
});
