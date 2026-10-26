// Phase 12, stage 2: the six modules after Peoples, and what all seven adapters share, on the REAL vendored data. Permanent integrity checks: the legacy
// validators pass, every entry has its name, Arabic name and a place in the Qur'an, and nothing shaped says "verified" or "reviewed".
import { describe, expect, it } from "vitest";
import { QURAN_COMMANDS } from "@legacy/data/quranCommands";
import { QURAN_DUAS } from "@legacy/data/quranDuas";
import { QURAN_EVENTS } from "@legacy/data/quranEvents";
import { QURAN_COMMUNITIES } from "@legacy/data/quranPeoples";
import { QURAN_PLACES } from "@legacy/data/quranPlaces";
import { QURAN_SIGNS } from "@legacy/data/quranSigns";
import { QURAN_THEMES } from "@legacy/data/quranThemes";
import { validateCommandDataset } from "@legacy/utils/commandsValidate";
import { validateDuaDataset } from "@legacy/utils/duasValidate";
import { validateEventDataset } from "@legacy/utils/eventsValidate";
import { validateCommunityDataset } from "@legacy/utils/peoplesValidate";
import { validatePlaceDataset } from "@legacy/utils/placesValidate";
import { validateSignDataset } from "@legacy/utils/signsValidate";
import { validateThemeDataset } from "@legacy/utils/themesValidate";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { adapterFor } from "../app/lib/knowledge";
import { SUMMARY_OVERRIDES } from "../app/lib/knowledge/commands";
import { hrefFor, KNOWLEDGE_READY, MODULE_ORDER, MODULES } from "../app/lib/knowledge/modules";

const DATASETS: Record<string, { id: string }[]> = { peoples: QURAN_COMMUNITIES, places: QURAN_PLACES, themes: QURAN_THEMES, duas: QURAN_DUAS, events: QURAN_EVENTS, signs: QURAN_SIGNS, commands: QURAN_COMMANDS };

describe("the legacy validators, one per module", () => {
  const surahs = SURAH_ROWS.map((s) => ({ surahNo: s.n, totalAyah: s.ayahs }));
  it("all pass on the vendored data", () => {
    expect(validateCommunityDataset(QURAN_COMMUNITIES, surahs)).toEqual([]);
    expect(validatePlaceDataset(QURAN_PLACES, surahs)).toEqual([]);
    expect(validateThemeDataset(QURAN_THEMES, surahs)).toEqual([]);
    expect(validateDuaDataset(QURAN_DUAS, surahs)).toEqual([]);
    expect(validateEventDataset(QURAN_EVENTS, surahs)).toEqual([]);
    expect(validateSignDataset(QURAN_SIGNS, surahs, QURAN_EVENTS)).toEqual([]);
    expect(validateCommandDataset(QURAN_COMMANDS, surahs)).toEqual([]);
  });
});

describe("the registry, with every module built", () => {
  it("links every module's entries to its own route", () => {
    expect(Object.values(KNOWLEDGE_READY)).toEqual([true, true, true, true, true, true, true]);
    for (const m of MODULE_ORDER) expect(hrefFor(m, "x")).toBe(`${MODULES[m].route}/x`);
  });
});

describe("all seven adapters (the shared shape on the real data)", () => {
  it("each shapes every entry from the data and never says verified or reviewed", async () => {
    for (const m of MODULE_ORDER) {
      const a = await adapterFor(m);
      expect(a.entries.map((e) => e.id), m).toEqual(DATASETS[m]!.map((e) => e.id));
      for (const e of a.entries) {
        expect(e.name, `${m}:${e.id} name`).toBeTruthy();
        expect(e.arabic, `${m}:${e.id} arabic`).toBeTruthy();
        expect(e.summary, `${m}:${e.id} summary`).toBeTruthy();
        expect(e.passages.length + e.mentions.length, `${m}:${e.id} appears somewhere`).toBeGreaterThan(0);
        expect(e.basisLabel === null, `${m}:${e.id}`).toBe(e.explicit);
        expect(a.filters.some((f) => f.value === e.typeValue), `${m}:${e.id} has a chip`).toBe(true);
      }
      expect(a.filters[0]).toMatchObject({ value: "all" });
      expect(JSON.stringify(a.entries), m).not.toMatch(/verificationStatus|"verified"|reviewed|statusNotes/i);
    }
  });

  it("the entries off the explicit basis are the ones on the review list (Signs and Commands have none)", async () => {
    const off = Object.fromEntries(await Promise.all(MODULE_ORDER.map(async (m) => [m, (await adapterFor(m)).entries.filter((e) => !e.explicit).length] as const)));
    expect(off.signs).toBe(0);
    expect(off.commands).toBe(0);
    const expected =
      QURAN_COMMUNITIES.filter((c) => c.identificationBasis !== "quran_explicit").length +
      QURAN_PLACES.filter((p) => p.identificationBasis !== "quran_explicit").length +
      QURAN_THEMES.filter((t) => t.conceptualBasis !== "quran_explicit_concept").length +
      QURAN_DUAS.filter((d) => d.sourceBasis !== "quran_explicit").length +
      QURAN_EVENTS.filter((e) => e.sourceBasis !== "quran_explicit").length;
    expect(Object.values(off).reduce((x, y) => x + y, 0)).toBe(expected);
  });

  it("each module finds an entry by a typed reference, by its Arabic name and by its type chip, and nothing by nonsense", async () => {
    for (const m of MODULE_ORDER) {
      const a = await adapterFor(m);
      const e = a.entries[0]!;
      const r = e.passages[0] ?? e.mentions[0]!;
      expect(a.search("all", `${r.surah}:${r.from}`).map((x) => x.id), `${m} by reference`).toContain(e.id);
      expect(a.search("all", e.arabic).map((x) => x.id), `${m} by Arabic`).toContain(e.id);
      expect(a.search(e.typeValue, "").map((x) => x.id), `${m} by chip`).toContain(e.id);
      expect(a.search("all", "zzzzzzzz"), m).toEqual([]);
    }
  });
});

describe("what is particular to a module", () => {
  it("Duas: one passage each, the partial-ayah note is the data's, parallel passages are \"Also occurs at\", the speaker is a section", async () => {
    const a = await adapterFor("duas");
    const partial = QURAN_DUAS.filter((d) => d.isPartialAyah);
    expect(partial.length).toBeGreaterThan(0);
    for (const d of partial) expect(a.get(d.id)!.dua).toEqual({ partialAyah: true, segmentNote: d.segmentNote });
    expect(a.entries.every((e) => e.passages.length === 1 && e.dua)).toBe(true);
    const withParallel = QURAN_DUAS.find((d) => d.parallelPassages?.length)!;
    expect(a.get(withParallel.id)!.also).toHaveLength(withParallel.parallelPassages!.length);
    for (const e of a.entries) expect(e.sections.find((s) => s.id === "speaker")?.text, e.id).toBeTruthy();
    expect(new Set(a.entries.map((e) => e.basisLabel))).toEqual(new Set([null, "Narrative prayer", "Qur'anic instruction to supplicate"]));
  });

  it("Events: a chronology section in the legacy's words, naming who it happened during and what it follows (names, never ids)", async () => {
    const a = await adapterFor("events");
    for (const e of a.entries) expect(e.sections[0]).toMatchObject({ id: "chronology" });
    const withAfter = QURAN_EVENTS.find((e) => e.relativeChronology?.afterEventId)!;
    const items = a.get(withAfter.id)!.sections[0]!.items!;
    expect(items.some((i) => i.startsWith("After: "))).toBe(true);
    expect(items.join(" ")).not.toContain(withAfter.relativeChronology!.afterEventId!);
    const withDuring = QURAN_EVENTS.find((e) => e.relativeChronology?.duringPersonId)!;
    expect(a.get(withDuring.id)!.sections[0]!.items!.some((i) => i.startsWith("During the lifetime of "))).toBe(true);
  });

  it("Signs offer only the classifications the data uses; Commands show the audience", async () => {
    const signs = await adapterFor("signs");
    const used = new Set<string>(QURAN_SIGNS.map((s) => s.classification));
    expect(new Set(signs.filters.map((f) => f.value))).toEqual(new Set(["all", ...used]));
    const commands = await adapterFor("commands");
    expect(commands.entries.every((c) => c.sections[0]?.id === "audience")).toBe(true);
    expect(commands.filters.map((f) => f.value)).toEqual(["all", "command", "prohibition"]);
  });

  it("Commands: the Riba and Theft summaries are the app-written lines that attribute to the Qur'an text and send application to fiqh; no other summary changes", async () => {
    const a = await adapterFor("commands");
    expect(a.get("ribaprohibition")!.summary).toBe("The Qur'an forbids riba (2:275).");
    expect(a.get("theftprohibition")!.summary).toBe("The Qur'an addresses theft (5:38). Its conditions and application are matters of fiqh; see Daily Fiqh or a scholar.");
    for (const c of QURAN_COMMANDS) if (!(c.id in SUMMARY_OVERRIDES)) expect(a.get(c.id)!.summary, c.id).toBe(c.description);
    expect(Object.keys(SUMMARY_OVERRIDES).sort()).toEqual(["ribaprohibition", "theftprohibition"]);
    expect(JSON.stringify(a.get("theftprohibition")) + JSON.stringify(a.get("ribaprohibition"))).not.toMatch(/punish|penalt|hadd|cut off/i);
  });

  it("Themes: the definition is the summary and the paragraph is the detail; Places keep their direct mentions", async () => {
    const themes = await adapterFor("themes");
    const t = QURAN_THEMES[0]!;
    expect(themes.get(t.id)).toMatchObject({ summary: t.definition });
    expect(themes.get(t.id)!.sections[0]!.text).toBe(t.description);
    const places = await adapterFor("places");
    expect(places.entries.some((p) => p.mentions.length > 0)).toBe(true);
  });
});
