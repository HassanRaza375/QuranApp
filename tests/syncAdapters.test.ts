// Phase 17C: each synced key becomes records and comes back in its exact legacy shape (app/lib/sync/adapters.ts), unknown fields survive, raw keys stay raw,
// and a key that must never sync never appears in a record.
import { describe, expect, it } from "vitest";
import { ADAPTERS, SYNCED_KEYS, settingAcceptable, type Adapter } from "../app/lib/sync/adapters";
import { NEVER_KEYS } from "../app/lib/sync/inventory";
import type { Category } from "../app/lib/sync/namespaces";
import { NAMESPACES, validateOp } from "../app/lib/sync/namespaces";
import { projectAll } from "../app/lib/sync/engine";
import type { Payload } from "../app/lib/sync/merge";
import { FULL, mapStore, NEVER_MARK } from "./fakes/syncStorage";

const ALL = new Set<Category>(["library", "progress", "settings"]);
const parse = (s: string | null) => (s === null ? null : JSON.parse(s));

function copyThroughRecords(src: Record<string, string>) {
  const from = mapStore(src);
  const to = mapStore();
  for (const a of ADAPTERS) a.apply(to, a.project(from));
  return { from, to };
}

describe("every record that is projected is acceptable to the server", () => {
  it("passes its namespace's schema and key rule, and is under the record cap", () => {
    const records = projectAll(mapStore(FULL), ALL);
    expect(records.size).toBeGreaterThan(45);
    const bad: string[] = [];
    for (const [id, p] of records) {
      const [ns, key] = [id.slice(0, id.indexOf("|")), id.slice(id.indexOf("|") + 1)];
      const why = validateOp(ns, key, p);
      if (why) bad.push(`${id}: ${why}`);
    }
    expect(bad).toEqual([]);
  });
  it("uses only namespaces the server knows", () => {
    for (const id of projectAll(mapStore(FULL), ALL).keys()) expect(NAMESPACES[id.slice(0, id.indexOf("|"))], id).toBeTruthy();
  });
});

describe("round trip: project, then apply into an empty storage, gives the same legacy values", () => {
  const { from, to } = copyThroughRecords(FULL);
  const sameJson = (k: string) => expect(parse(to.get(k)), k).toEqual(parse(from.get(k)));

  it("whole-value keys come back deeply equal, unknown fields included", () => {
    for (const k of [
      "quran:library:v1",
      "quran:reading-progress:v1",
      "quran:read-surahs:v1",
      "quran:pins:v1",
      "quran:reading-goals:v1",
      "quran:hifz:v2",
      "quran:hifz-words:v1",
      "quran:tasbeeh:v1",
      "quran:story-progress:v1",
      "quran:persons-study:v1",
      "quran:ramadan:v1",
      "quran:reminders:v1",
      "reciter",
      "quran:bookmarks:v1",
      "quran:bookmarks:added-at:v1",
    ]) {
      // keys that carry fields the adapters do not own (an unknown top-level field of an object that is not a map) are checked below
      if (["quran:read-surahs:v1", "quran:hifz:v2", "quran:ramadan:v1", "quran:reading-goals:v1"].includes(k)) continue;
      sameJson(k);
    }
  });
  it("a settings object comes back with the fields it owns (fields this device keeps to itself, such as updatedAt, are not synced)", () => {
    const owned: Record<string, string[]> = {
      "quran:fiqh-prefs:v1": ["marjaId", "lang"],
      "quran:accessibility:v1": ["reducedMotion", "highContrast", "largeTouchTargets", "arabicFontScale"],
      "quran:audio-prefs:v1": ["playbackRate", "repeatOne", "autoAdvance"],
      "quran:player-prefs:v1": ["followAyah"],
      "quran:reader-prefs:v1": ["translation", "transliteration"],
      "quran:verse-layout:v1": ["order"],
      "quran:hijri-adjust:v1": ["days"],
      "quran:prayer-calc:v1": ["sunniMethod", "jafariMethod", "asr"],
      "quran:calendar-prefs:v1": ["first"],
    };
    for (const [k, fields] of Object.entries(owned)) {
      const a = parse(from.get(k));
      const b = parse(to.get(k));
      for (const f of fields) expect(b[f], `${k}.${f}`).toEqual(a[f]);
      expect(Object.keys(b).sort(), k).toEqual(fields.slice().sort());
    }
  });
  it("raw keys stay raw strings, never JSON-wrapped", () => {
    for (const k of ["prayerFiqh", "themeMode", "translationDefaultLang", "tafsirDefaultAuthor"]) expect(to.get(k), k).toBe(from.get(k));
    expect(to.get("prayerFiqh")).toBe("jafari");
  });
  it("the saved items keep their order (oldest first) and their times", () => {
    expect(parse(to.get("quran:bookmarks:v1"))).toEqual(["ayah:2:255", "surah:18", "person:ibrahim"]);
    expect(parse(to.get("quran:bookmarks:added-at:v1"))).toEqual({ "ayah:2:255": 1000, "surah:18": 2000, "person:ibrahim": 3000 });
  });
  it("only the owned entries travel: a read-surahs, goals, Hifz and Ramadan record keeps its own entries", () => {
    expect(parse(to.get("quran:read-surahs:v1")).surahs).toEqual(parse(from.get("quran:read-surahs:v1")).surahs);
    const g = parse(to.get("quran:reading-goals:v1"));
    expect(g.goals).toEqual(parse(from.get("quran:reading-goals:v1")).goals);
    expect(g.activeGoalId).toBe("g1");
    expect(g.dailyLog).toEqual({ "2026-11-02": ["1:1", "1:2"] });
    const h = parse(to.get("quran:hifz:v2"));
    expect(h.targets).toEqual([{ id: "t1", surahNo: 67 }]);
    expect(h.activity).toEqual([{ date: "2026-11-02", newAyahs: 2, revisions: 1 }]);
    const r = parse(to.get("quran:ramadan:v1"));
    expect(r.startOverride).toBe("2027-02-08");
    expect(r.fastingLog).toEqual({ "2027-02-09": "fasted", "2027-02-10": "missed" });
  });
  it("prayerSettings travels without notificationsEnabled (notification permission is the browser's)", () => {
    expect(parse(to.get("prayerSettings"))).toEqual({ enabledPrayers: ["fajr", "maghrib"], reminderOffset: 10 });
  });
});

describe("unknown fields are kept when a record is applied over existing data", () => {
  it("a goal change keeps the key's other goals and its unknown top-level fields", () => {
    const s = mapStore(FULL);
    const goals = ADAPTERS.find((a) => a.ns === "progress.goal")!;
    goals.apply(s, new Map<string, Payload>([["g2", { id: "g2", type: "custom", status: "paused", note: "new" }]]));
    const g = parse(s.get("quran:reading-goals:v1"));
    expect(g.goals.map((x: { id: string }) => x.id)).toEqual(["g1", "g2"]);
    expect(g.other).toEqual({ a: 1 });
    expect(g.dailyLog).toEqual({ "2026-11-02": ["1:1", "1:2"] });
    expect(g.goals[0].legacyField).toBe(1);
  });
  it("a setting change keeps the other fields of the same key", () => {
    const s = mapStore(FULL);
    const adapter = ADAPTERS.find((a) => a.project(mapStore()).has("accessibility.highContrast"))!;
    adapter.apply(s, new Map<string, Payload>([["accessibility.highContrast", { v: true }]]));
    expect(parse(s.get("quran:accessibility:v1"))).toEqual({ reducedMotion: true, highContrast: true, largeTouchTargets: true, arabicFontScale: 1.2, other: 1 });
  });
  it("a removal removes only that entry", () => {
    const s = mapStore(FULL);
    ADAPTERS.find((a) => a.ns === "progress.fast")!.apply(s, new Map<string, Payload>([["2027-02-10", null]]));
    expect(parse(s.get("quran:ramadan:v1")).fastingLog).toEqual({ "2027-02-09": "fasted" });
    expect(parse(s.get("quran:ramadan:v1")).extra).toBe(1);
  });
  it("removing a saved item removes it from the list and the times, and the note record is separate", () => {
    const s = mapStore(FULL);
    ADAPTERS.find((a) => a.ns === "library.item")!.apply(s, new Map<string, Payload>([["ayah:2:255", null]]));
    expect(parse(s.get("quran:bookmarks:v1"))).toEqual(["surah:18", "person:ibrahim"]);
    expect(parse(s.get("quran:library:v1")).itemMeta["ayah:2:255"].note).toBe("a note"); // Phase 6: removing an item keeps its note
  });
  it("a damaged value is treated as absent and replaced by the next write", () => {
    const s = mapStore({ "quran:tasbeeh:v1": "{broken" });
    const a = ADAPTERS.find((x) => x.ns === "progress.tasbeeh")!;
    expect(a.project(s).size).toBe(0);
    a.apply(s, new Map<string, Payload>([["c9", { count: 1, target: 33, cycles: 0, lifetime: 1 }]]));
    expect(parse(s.get("quran:tasbeeh:v1"))).toEqual({ c9: { count: 1, target: 33, cycles: 0, lifetime: 1 } });
  });
});

describe("never", () => {
  it("no record carries anything from a key that never syncs, or notificationsEnabled", () => {
    const text = JSON.stringify([...projectAll(mapStore(FULL), ALL)]);
    expect(text).not.toContain(NEVER_MARK);
    expect(text).not.toContain("notificationsEnabled");
    expect(text).not.toContain("31.5"); // coordinates
    expect(text).not.toContain("wifiOnly");
    expect(text).not.toContain("vibrate");
  });
  it("no adapter reads or writes a key in the never list", () => {
    for (const a of ADAPTERS) for (const k of a.keys) expect(NEVER_KEYS, `${a.ns} touches ${k}`).not.toContain(k);
    expect(SYNCED_KEYS.some((k) => NEVER_KEYS.includes(k))).toBe(false);
  });
  it("applying every record never creates a key outside the synced keys", () => {
    const { to } = copyThroughRecords(FULL);
    for (const k of to.map.keys()) expect(SYNCED_KEYS, k).toContain(k);
  });
  it("a category that is off projects nothing from its keys", () => {
    const s = mapStore(FULL);
    expect([...projectAll(s, new Set<Category>(["library"])).keys()].every((id) => id.startsWith("library."))).toBe(true);
    expect(projectAll(s, new Set<Category>()).size).toBe(0);
  });
});

describe("settings that arrive from the account are checked before they are written", () => {
  it("accepts the legal values and refuses the others", () => {
    expect(settingAcceptable("fiqh", { raw: "sunni" })).toBe(true);
    expect(settingAcceptable("fiqh", { raw: "shia" })).toBe(false); // the prototype's value never reaches storage
    expect(settingAcceptable("theme", { raw: "purple" })).toBe(false);
    expect(settingAcceptable("verseLayout", { v: "tr" })).toBe(true);
    expect(settingAcceptable("accessibility.arabicFontScale", { v: 99 })).toBe(false);
    expect(settingAcceptable("hijriAdjust", { v: 2 })).toBe(true);
    expect(settingAcceptable("hijriAdjust", { v: 2.5 })).toBe(false);
    expect(settingAcceptable("theme", null)).toBe(true); // a removal is fine
    expect(settingAcceptable("somethingNew", { v: 1 })).toBe(true);
  });
});

describe("every adapter is complete", () => {
  it("has a namespace, a category matching it, and at least one key", () => {
    const seen = new Set<string>();
    for (const a of ADAPTERS as Adapter[]) {
      expect(NAMESPACES[a.ns]).toBeTruthy();
      expect(a.keys.length).toBeGreaterThan(0);
      expect(NAMESPACES[a.ns]!.category).toBe(a.category);
      if (a.ns !== "settings") {
        expect(seen.has(a.ns), `${a.ns} is owned by two adapters`).toBe(false);
        seen.add(a.ns);
      }
    }
  });
});
