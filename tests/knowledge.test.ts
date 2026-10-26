// Phase 12: the knowledge modules' data and shared logic, on the REAL vendored legacy data. The integrity checks here are permanent: every ayah reference
// is inside the real ayah counts, every cross-link resolves, the legacy validators pass, and nothing in the shaped entries says "verified" or "reviewed".
import { describe, expect, it } from "vitest";
import { QURAN_COMMANDS } from "@legacy/data/quranCommands";
import { QURAN_DUAS } from "@legacy/data/quranDuas";
import { QURAN_EVENTS } from "@legacy/data/quranEvents";
import { QURAN_COMMUNITIES } from "@legacy/data/quranPeoples";
import { QURAN_PERSONS } from "@legacy/data/quranPersons";
import { QURAN_PLACES } from "@legacy/data/quranPlaces";
import { QURAN_SIGNS } from "@legacy/data/quranSigns";
import { QURAN_STORIES } from "@legacy/data/quranStories";
import { QURAN_THEMES } from "@legacy/data/quranThemes";
import { validateCommunityDataset } from "@legacy/utils/peoplesValidate";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { peoplesAdapter } from "../app/lib/knowledge/peoples";
import { linksFor } from "../app/lib/knowledge/graph";
import { bookmarkKey, hrefFor, KNOWLEDGE_READY, MODULES, MODULE_ORDER } from "../app/lib/knowledge/modules";
import { coversAyah, parseAyahQuery, passageLabel, playableAyahs, threadPositions } from "../app/lib/knowledge/refs";

const COUNTS = SURAH_ROWS.map((s) => s.ayahs);
const DATASETS: Record<string, { id: string }[]> = {
  peoples: QURAN_COMMUNITIES,
  places: QURAN_PLACES,
  themes: QURAN_THEMES,
  duas: QURAN_DUAS,
  events: QURAN_EVENTS,
  signs: QURAN_SIGNS,
  commands: QURAN_COMMANDS,
};

describe("the seven datasets (real data, vendored)", () => {
  it("have the entries the audit counted", () => {
    expect(Object.fromEntries(Object.entries(DATASETS).map(([k, v]) => [k, v.length]))).toEqual({ peoples: 14, places: 16, themes: 42, duas: 38, events: 40, signs: 14, commands: 18 });
    for (const [name, list] of Object.entries(DATASETS)) expect(new Set(list.map((e) => e.id)).size, `${name}: ids are unique`).toBe(list.length);
  });

  it("every ayah reference is inside the real ayah counts", () => {
    const bad: string[] = [];
    let refs = 0;
    const walk = (o: unknown, where: string) => {
      if (Array.isArray(o)) return o.forEach((x) => walk(x, where));
      if (o && typeof o === "object") {
        const r = o as { surahNumber?: number; ayahNumber?: number; ayahStart?: number; ayahEnd?: number };
        if (r.surahNumber !== undefined) {
          refs++;
          const lo = r.ayahStart ?? r.ayahNumber ?? 0;
          const hi = r.ayahEnd ?? r.ayahNumber ?? 0;
          const n = COUNTS[r.surahNumber - 1];
          if (!n || lo < 1 || hi < lo || hi > n) bad.push(`${where}: ${JSON.stringify(r)}`);
        }
        Object.values(o).forEach((v) => walk(v, where));
      }
    };
    for (const [name, list] of Object.entries(DATASETS)) for (const e of list) walk(e, `${name}/${e.id}`);
    expect(bad).toEqual([]);
    expect(refs).toBe(413);
  });

  it("every cross-link resolves to an entry that exists", () => {
    const ids = { persons: new Set(QURAN_PERSONS.map((e) => e.id)), stories: new Set(QURAN_STORIES.map((e) => e.id)), peoples: new Set(QURAN_COMMUNITIES.map((e) => e.id)), places: new Set(QURAN_PLACES.map((e) => e.id)), themes: new Set(QURAN_THEMES.map((e) => e.id)), duas: new Set(QURAN_DUAS.map((e) => e.id)), events: new Set(QURAN_EVENTS.map((e) => e.id)), signs: new Set(QURAN_SIGNS.map((e) => e.id)), commands: new Set(QURAN_COMMANDS.map((e) => e.id)) };
    const fields: Record<string, keyof typeof ids> = { personIds: "persons", storyIds: "stories", communityIds: "peoples", placeIds: "places", themeIds: "themes", duaIds: "duas", eventIds: "events", signIds: "signs", relatedThemeIds: "themes", relatedEventIds: "events", relatedPlaceIds: "places", associatedCommunityIds: "peoples", personId: "persons", storyId: "stories" };
    const broken: string[] = [];
    let links = 0;
    for (const [name, list] of Object.entries(DATASETS)) {
      for (const e of list as Record<string, unknown>[]) {
        for (const [f, target] of Object.entries(fields)) {
          const v = e[f];
          if (v === undefined) continue;
          for (const id of Array.isArray(v) ? v : [v]) {
            links++;
            if (!ids[target].has(id as string)) broken.push(`${name}/${e.id}.${f} -> ${id}`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
    expect(links).toBeGreaterThan(300);
  });

  it("pass the legacy Peoples validator", () => {
    const issues = validateCommunityDataset(QURAN_COMMUNITIES, SURAH_ROWS.map((s) => ({ surahNo: s.n, totalAyah: s.ayahs })));
    expect(issues).toEqual([]);
  });
});

describe("the module registry", () => {
  it("has the seven modules with their legacy bookmark keys", () => {
    expect(MODULE_ORDER).toHaveLength(7);
    expect(MODULE_ORDER.map((m) => bookmarkKey(m, "x"))).toEqual(["community:x", "place:x", "theme:x", "dua:x", "event:x", "sign:x", "command:x"]);
    expect(MODULES.events.title).toBe("Events in the Qur’an");
  });
  it("draws a link only to a page that exists", () => {
    expect(hrefFor("persons", "hud")).toBe("/persons/hud");
    expect(hrefFor("stories", "x")).toBe("/stories/x");
    expect(KNOWLEDGE_READY.peoples).toBe(true);
    expect(hrefFor("peoples", "ad")).toBe("/peoples/ad");
    for (const m of ["places", "themes", "duas", "events", "signs", "commands"] as const) if (!KNOWLEDGE_READY[m]) expect(hrefFor(m, "x")).toBeNull();
  });
});

describe("references typed into the filter box", () => {
  it("reads 7:65, 7.65, 7 65 and 7:65-72, and nothing else", () => {
    expect(parseAyahQuery("7:65")).toEqual({ surah: 7, from: 65, to: 65 });
    expect(parseAyahQuery(" 7.65 ")).toEqual({ surah: 7, from: 65, to: 65 });
    expect(parseAyahQuery("7 65")).toEqual({ surah: 7, from: 65, to: 65 });
    expect(parseAyahQuery("7:65-72")).toEqual({ surah: 7, from: 65, to: 72 });
    expect(parseAyahQuery("7:72-65")).toBeNull();
    expect(parseAyahQuery("2:999")).toBeNull(); // Al-Baqarah has 286 ayahs
    expect(parseAyahQuery("115:1")).toBeNull();
    expect(parseAyahQuery("hud")).toBeNull();
    expect(parseAyahQuery("11")).toBeNull();
  });
  it("positions and ranges", () => {
    const e = { mentions: [{ surah: 1, from: 1, to: 1 }], passages: [{ id: "p", surah: 1, from: 3, to: 4 }], also: [] };
    expect(threadPositions(e)).toEqual([1, 3, 4]);
    expect(playableAyahs(e)).toEqual([{ surah: 1, ayah: 3 }, { surah: 1, ayah: 4 }]);
    expect(coversAyah(e, { surah: 1, from: 4, to: 6 })).toBe(true);
    expect(coversAyah(e, { surah: 1, from: 5, to: 6 })).toBe(false);
    expect(passageLabel({ surah: 7, from: 65, to: 72 })).toBe("7:65-72");
    expect(passageLabel({ surah: 7, from: 65, to: 65 })).toBe("7:65");
  });
});

describe("Peoples & Nations (the adapter)", () => {
  const a = peoplesAdapter();
  it("shapes all 14 entries from the data, without any verification wording", () => {
    expect(a.entries).toHaveLength(14);
    const ad = a.get("ad")!;
    expect(ad).toMatchObject({ module: "peoples", name: "'Ad", typeValue: "tribe", typeLabel: "Tribes", explicit: true, basisLabel: null });
    expect(ad.arabic).toBe(QURAN_COMMUNITIES.find((c) => c.id === "ad")!.arabicName); // from the data, never typed here
    expect(ad.passages.map((p) => p.id)).toContain("ad-hud-account");
    expect(JSON.stringify(a.entries)).not.toMatch(/verificationStatus|"verified"|reviewed/i);
  });
  it("a weaker basis is labelled in the legacy's words; an explicit one is not tagged", () => {
    expect(a.get("sabbathbreakers")).toMatchObject({ explicit: false, basisLabel: "Identified through Qur'anic context" });
    expect(a.entries.filter((e) => !e.explicit).map((e) => e.id)).toEqual(["sabbathbreakers"]);
  });
  it("filters by type chip and by text (name, Arabic, theme)", () => {
    expect(a.search("tribe", "").map((e) => e.id)).toEqual(["ad", "thamud", "quraysh"]);
    expect(a.search("all", "thamud")[0]!.id).toBe("thamud");
    expect(a.search("all", QURAN_COMMUNITIES.find((c) => c.id === "ad")!.arabicName).map((e) => e.id)).toContain("ad");
    expect(a.search("all", "destruction by wind").map((e) => e.id)).toContain("ad");
    expect(a.search("nation", "thamud")).toEqual([]); // the chip and the text both apply
  });
  it("finds the entries that cover an ayah, and a range", () => {
    expect(a.search("all", "7:65").map((e) => e.id)).toContain("ad");
    expect(a.search("all", "7:65-72").map((e) => e.id)).toEqual(expect.arrayContaining(["ad"]));
    expect(a.search("all", "2:999")).toEqual(a.search("all", "2:999")); // an impossible reference falls through to plain text and finds nothing
    expect(a.search("all", "2:999")).toEqual([]);
  });
});

describe("Connected and Referenced by (the legacy graph)", () => {
  it("separates what the entry's own data names from what only another entry names, and never lists itself", () => {
    const { connected, referencedBy } = linksFor("peoples", "ad");
    const all = [...connected, ...referencedBy].flatMap((g) => g.items);
    expect(all.find((i) => i.module === "peoples" && i.id === "ad")).toBeUndefined();
    expect(connected.some((g) => g.module === "persons" && g.items.some((i) => i.id === "hud" && i.href === "/persons/hud"))).toBe(true);
    // an entry is never in both lists
    const keys = (gs: typeof connected) => new Set(gs.flatMap((g) => g.items.map((i) => `${i.module}:${i.id}`)));
    for (const k of keys(referencedBy)) expect(keys(connected).has(k)).toBe(false);
    // links to pages that do not exist yet carry no href
    for (const i of all) if (i.module !== "persons" && i.module !== "stories" && i.module !== "peoples") expect(i.href).toBeNull();
  });
});

describe("Play all for a knowledge entry (the new queue kind)", () => {
  it("is rebuilt from the data: the entry's passages, once each, in order", async () => {
    const { knowledgeQueue } = await import("../app/lib/knowledge/queue");
    const q = (await knowledgeQueue("peoples", "ad"))!;
    expect(q.id).toBe("knowledge:peoples:ad");
    expect(q.label).toBe("'Ad");
    expect(q.items[0]).toEqual({ surah: 7, ayah: 65 });
    expect(new Set(q.items.map((i) => `${i.surah}:${i.ayah}`)).size).toBe(q.items.length);
    expect(await knowledgeQueue("peoples", "nobody")).toBeNull();
    expect(await knowledgeQueue("nope", "ad")).toBeNull();
  });
  it("its saved place is a new additive record that survives a read, and damage is ignored", async () => {
    const { restoredQueue } = await import("../app/lib/audioState");
    expect(restoredQueue({ v: 1, kind: "knowledge", ref: { module: "peoples", id: "ad" }, index: 3, reciter: "Mishary Rashid Al Afasy", position: 12 })).toEqual({ kind: "knowledge", ref: { module: "peoples", id: "ad" }, index: 3, reciter: "Mishary Rashid Al Afasy", position: 12 });
    expect(restoredQueue({ v: 1, kind: "knowledge", ref: { module: "nope", id: "ad" }, index: 0, reciter: "x", position: 0 })).toBeNull();
    expect(restoredQueue({ v: 1, kind: "knowledge", ref: { module: "peoples" }, index: 0, reciter: "x", position: 0 })).toBeNull();
    expect(restoredQueue({ v: 1, kind: "page", ref: { page: 3 }, index: 0, reciter: "x", position: 0 })).toMatchObject({ kind: "page" }); // the old kinds still read
  });
});
