// Phase 10: recent searches in the legacy format, and the LEGACY code (app/composables/useSearchHistory.ts, vendored, unmodified) run on what
// the revamp writes and the other way round. A rollback to the legacy app must lose nothing and must not break on our data.
import { afterEach, describe, expect, it } from "vitest";
import { addHistory, clearHistory, HISTORY_KEY, HISTORY_MAX, readHistory, removeHistory, withEntry, writeHistory } from "../app/lib/searchHistory";
import { setStorageBackend } from "../app/lib/storage";
import { loadLegacySearchHistory } from "../scripts/lib/legacy-search-history.mjs";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

/** The legacy `$storage` wrapper's behaviour over a map. */
const legacyStorage = (data: Map<string, string>) => ({
  get: (k: string, d: unknown) => (data.has(k) ? JSON.parse(data.get(k)!) : d),
  set: (k: string, v: unknown) => void data.set(k, JSON.stringify(v)),
});

describe("history", () => {
  it("adds newest first, trims, ignores empty, and de-duplicates without regard to case", () => {
    setStorageBackend(memoryStore());
    expect(addHistory("  mercy ")).toEqual(["mercy"]);
    expect(addHistory("patience")).toEqual(["patience", "mercy"]);
    expect(addHistory("MERCY")).toEqual(["MERCY", "patience"]);
    expect(addHistory("   ")).toEqual(["MERCY", "patience"]);
    expect(readHistory()).toEqual(["MERCY", "patience"]);
  });

  it("keeps 15 at most (the legacy limit)", () => {
    setStorageBackend(memoryStore());
    for (let i = 1; i <= 20; i++) addHistory(`query ${i}`);
    expect(HISTORY_MAX).toBe(15);
    const list = readHistory();
    expect(list).toHaveLength(15);
    expect(list[0]).toBe("query 20");
    expect(list.at(-1)).toBe("query 6");
  });

  it("removes one entry or all, and an Undo can put the list back", () => {
    setStorageBackend(memoryStore());
    for (const q of ["c", "b", "a"]) addHistory(q);
    const before = readHistory();
    expect(removeHistory("b")).toEqual(["a", "c"]);
    writeHistory(before); // what Undo does
    expect(readHistory()).toEqual(before);
    expect(clearHistory()).toEqual([]);
    expect(readHistory()).toEqual([]);
  });

  it("reads damaged data as far as it can and never throws", () => {
    for (const [raw, want] of [["not json", []], ['{"a":1}', []], ['[1,null,"ok",{"q":"x"},"  ","Ok"]', ["ok"]], ["null", []], ['"text"', []]] as const) {
      setStorageBackend(memoryStore({ [HISTORY_KEY]: raw }));
      expect(readHistory(), raw).toEqual(want);
    }
    setStorageBackend(memoryStore({}, true)); // storage refuses writes
    expect(() => addHistory("x")).not.toThrow();
  });

  it("withEntry is pure", () => {
    const list = ["a", "b"];
    expect(withEntry(list, "B")).toEqual(["B", "a"]);
    expect(list).toEqual(["a", "b"]);
  });
});

describe("legacy parity (the legacy useSearchHistory run beside ours)", () => {
  it("the legacy code reads what the revamp wrote, and writes what the revamp reads", async () => {
    const data = new Map<string, string>();
    const mine = memoryStore();
    setStorageBackend(mine);
    for (const q of ["patience", "Mercy", "ayatul kursi", "mercy"]) addHistory(q);
    data.set(HISTORY_KEY, mine.data.get(HISTORY_KEY)!);

    const legacy = (await loadLegacySearchHistory(legacyStorage(data))).useSearchHistory();
    legacy.load();
    expect(legacy.history.value).toEqual(["mercy", "ayatul kursi", "patience"]); // the legacy parser accepts our strings

    legacy.addToHistory("Gratitude"); // the legacy page adds one
    legacy.removeFromHistory("patience");
    mine.data.set(HISTORY_KEY, data.get(HISTORY_KEY)!);
    expect(readHistory()).toEqual(["Gratitude", "mercy", "ayatul kursi"]);
  });

  it("every step leaves the same stored list whether the legacy code or the revamp does it", async () => {
    const data = new Map<string, string>();
    const mine = memoryStore();
    setStorageBackend(mine);
    const legacy = (await loadLegacySearchHistory(legacyStorage(data))).useSearchHistory();
    legacy.load();
    const steps = ["noor", "Noor", "sabr", "  rahma ", "tawakkul", "sabr"];
    for (let i = 1; i <= 20; i++) steps.push(`topic ${i}`);
    for (const q of steps) {
      legacy.addToHistory(q);
      addHistory(q);
      expect(JSON.parse(mine.data.get(HISTORY_KEY)!), q).toEqual(JSON.parse(data.get(HISTORY_KEY)!));
    }
    legacy.removeFromHistory("topic 7");
    removeHistory("topic 7");
    expect(JSON.parse(mine.data.get(HISTORY_KEY)!)).toEqual(JSON.parse(data.get(HISTORY_KEY)!));
    legacy.clearHistory();
    clearHistory();
    expect(JSON.parse(mine.data.get(HISTORY_KEY)!)).toEqual(JSON.parse(data.get(HISTORY_KEY)!));
  });

  it("the prototype's object format would break the legacy code (why the format is fixed as strings)", async () => {
    const data = new Map([[HISTORY_KEY, JSON.stringify([{ id: 1, q: "patience", at: 1 }])]]);
    const legacy = (await loadLegacySearchHistory(legacyStorage(data))).useSearchHistory();
    legacy.load();
    expect(() => legacy.addToHistory("mercy")).toThrow(); // q.toLowerCase is not a function
  });
});
