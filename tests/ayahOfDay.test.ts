// Ayah of the day: the pool, the deterministic pick, and the stored entry the legacy app can still read.
import { afterEach, describe, expect, it } from "vitest";
import { AYAH_LENGTHS } from "../app/data/ayahLengths.generated";
import {
  AYAH_MAX_CHARS, AYAH_MIN_CHARS, buildPool, dataFromVerse, isAyahData, isEntryFor, makeEntry, pickAyahForDate, prefixSums, readEntry, refFromAbsolute, translationFor,
  type AyahOfDayData,
} from "../app/lib/ayahOfDay";
import { TOTAL_AYAHS_IN_QURAN } from "../app/lib/quranCounts";
import { localDateKey } from "../app/lib/dates";

const original = process.env.TZ;
afterEach(() => {
  if (original === undefined) delete process.env.TZ;
  else process.env.TZ = original;
});

describe("the generated ayah-length table matches the legacy data", () => {
  it("114 surahs and 6,236 ayahs, with the same per-surah counts as the legacy surah.json", async () => {
    const surahs = (await import("@legacy/assets/data/surah.json")).default as { totalAyah: number }[];
    expect(AYAH_LENGTHS).toHaveLength(114);
    expect(AYAH_LENGTHS.flat()).toHaveLength(6236);
    expect(TOTAL_AYAHS_IN_QURAN).toBe(6236);
    AYAH_LENGTHS.forEach((s, i) => expect(s.length, `surah ${i + 1}`).toBe(surahs[i]!.totalAyah));
  });

  it("our prefix sums equal the legacy getAyahPrefixSums logic (run on the legacy surah.json), and the total equals the legacy constant", async () => {
    // The legacy function loads surah.json with a dynamic `~/` import, which Vitest does not rewrite for files outside
    // this project; its logic is three lines, so it is applied to the same legacy JSON here.
    const surahs = (await import("@legacy/assets/data/surah.json")).default as { totalAyah: number }[];
    const legacySums = [0];
    for (const s of surahs) legacySums.push(legacySums[legacySums.length - 1]! + s.totalAyah);
    expect(prefixSums(AYAH_LENGTHS)).toEqual(legacySums);
    const legacy = await import("@legacy/utils/quranAyahCounts.js");
    expect(TOTAL_AYAHS_IN_QURAN).toBe(legacy.TOTAL_QURAN_AYAHS);
  });
});

describe("the pool: every ayah inside a length range", () => {
  const pool = buildPool(AYAH_LENGTHS);

  it("is the ayahs between the floor and the cap (5,817 of 6,236 at a 250-character cap, less the very short ones)", () => {
    expect(AYAH_MAX_CHARS).toBe(250);
    expect(AYAH_MIN_CHARS).toBe(15);
    const flat = AYAH_LENGTHS.flat();
    const underCap = flat.filter((n) => n <= AYAH_MAX_CHARS).length;
    expect(underCap).toBe(5817);
    expect(pool.length).toBe(flat.filter((n) => n >= AYAH_MIN_CHARS && n <= AYAH_MAX_CHARS).length);
    expect(pool.length).toBeGreaterThan(5700);
    expect(pool.length).toBeLessThan(underCap + 1);
  });

  it("holds no ayah above the cap or below the floor", () => {
    for (const abs of pool) {
      const { surah, ayah } = refFromAbsolute(AYAH_LENGTHS, abs);
      const len = AYAH_LENGTHS[surah - 1]![ayah - 1]!;
      expect(len).toBeLessThanOrEqual(AYAH_MAX_CHARS);
      expect(len).toBeGreaterThanOrEqual(AYAH_MIN_CHARS);
    }
  });

  it("refFromAbsolute covers the whole Qur'an and rejects positions outside it", () => {
    expect(refFromAbsolute(AYAH_LENGTHS, 0)).toEqual({ surah: 1, ayah: 1 });
    expect(refFromAbsolute(AYAH_LENGTHS, 6)).toEqual({ surah: 1, ayah: 7 });
    expect(refFromAbsolute(AYAH_LENGTHS, 7)).toEqual({ surah: 2, ayah: 1 });
    expect(refFromAbsolute(AYAH_LENGTHS, 6235)).toEqual({ surah: 114, ayah: 6 });
    expect(() => refFromAbsolute(AYAH_LENGTHS, 6236)).toThrow(RangeError);
  });
});

describe("pickAyahForDate", () => {
  const pool = buildPool(AYAH_LENGTHS);

  it("the same date always gives the same ayah", () => {
    expect(pickAyahForDate("2026-10-15", AYAH_LENGTHS, pool)).toEqual(pickAyahForDate("2026-10-15", AYAH_LENGTHS, pool));
  });

  it("is independent of the device's time zone (it depends only on the date string)", () => {
    const results: string[] = [];
    for (const tz of ["UTC", "Asia/Karachi", "America/Los_Angeles", "Pacific/Auckland"]) {
      process.env.TZ = tz;
      results.push(JSON.stringify(pickAyahForDate("2026-10-15", AYAH_LENGTHS, buildPool(AYAH_LENGTHS))));
    }
    expect(new Set(results).size).toBe(1);
  });

  it("different dates give different ayahs, spread across the Qur'an", () => {
    const seen = new Set<string>();
    const surahs = new Set<number>();
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.UTC(2026, 0, 1 + i));
      const r = pickAyahForDate(d.toISOString().slice(0, 10), AYAH_LENGTHS, pool);
      seen.add(`${r.surah}:${r.ayah}`);
      surahs.add(r.surah);
    }
    expect(seen.size).toBeGreaterThan(330); // almost no repeats in a year
    expect(surahs.size).toBeGreaterThan(60);
  });

  it("every pick over 10 years is a real ayah inside the length range (the legacy random pick could ask for ayah 5 of a 3-ayah surah)", () => {
    for (let i = 0; i < 3650; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      const { surah, ayah } = pickAyahForDate(date, AYAH_LENGTHS, pool);
      expect(surah).toBeGreaterThanOrEqual(1);
      expect(surah).toBeLessThanOrEqual(114);
      expect(ayah).toBeGreaterThanOrEqual(1);
      expect(ayah).toBeLessThanOrEqual(AYAH_LENGTHS[surah - 1]!.length);
      const len = AYAH_LENGTHS[surah - 1]![ayah - 1]!;
      expect(len).toBeLessThanOrEqual(AYAH_MAX_CHARS);
    }
  });

  it("documents the legacy bug: its rule (ayah 1 to 7 of any surah) hits non-existent ayahs", () => {
    let invalid = 0;
    for (let s = 1; s <= 114; s++) for (let a = 1; a <= 7; a++) if (a > AYAH_LENGTHS[s - 1]!.length) invalid++;
    expect(invalid).toBeGreaterThan(0); // for example surah 108 has 3 ayahs, so ayahs 4 to 7 do not exist
    expect(AYAH_LENGTHS[107]!.length).toBe(3);
  });

  it("throws on an empty pool rather than returning nonsense", () => {
    expect(() => pickAyahForDate("2026-10-15", AYAH_LENGTHS, [])).toThrow();
  });
});

const DATA: AyahOfDayData = { arabic: "ar", translation: "english text", urdu: "urdu text", surah_name: "long arabic name", ayah_number: 7, surah_number: 30, bengali: "bn text", arabic2: "ar2 text", surah_name_en: "Ar-Rum" };

describe("the stored entry (key ayah-of-day), written so the legacy app can still read it", () => {
  it("has the legacy shape { date, data } with the UTC date, plus the additive localDate", () => {
    process.env.TZ = "Asia/Karachi";
    const now = new Date("2026-10-15T20:00:00Z"); // 01:00 on the 16th in Karachi
    const e = makeEntry(DATA, now);
    expect(e.date).toBe("2026-10-15"); // exactly what the legacy `saved.date === today(UTC)` compares against
    expect(e.localDate).toBe("2026-10-16");
    expect(e.data).toEqual(DATA);
  });

  it("the legacy reader accepts a revamp entry on the same UTC day, and reads every field it needs", () => {
    const now = new Date("2026-10-15T20:00:00Z");
    const raw = JSON.parse(JSON.stringify(makeEntry(DATA, now)));
    // the legacy logic, verbatim: `saved?.date === today` where today = new Date().toISOString().slice(0, 10)
    const legacyToday = now.toISOString().slice(0, 10);
    expect(raw?.date === legacyToday).toBe(true);
    for (const f of ["arabic", "translation", "urdu", "surah_name", "ayah_number", "surah_number"]) expect(raw.data[f], f).toBeDefined();
  });

  it("the revamp rejects a stale entry at local midnight even though the legacy UTC date has not changed", () => {
    process.env.TZ = "Asia/Karachi";
    const wroteAt = new Date(2026, 9, 15, 22, 0); // 15 Oct 22:00 local
    const e = makeEntry(DATA, wroteAt);
    expect(isEntryFor(e, "2026-10-15")).toBe(true);
    const lateNight = new Date(2026, 9, 16, 1, 0); // 16 Oct 01:00 local: legacy UTC date is still the 15th
    expect(isEntryFor(e, localDateKey(lateNight))).toBe(false); // revamp refreshes at local midnight
    expect(e.date).toBe(wroteAt.toISOString().slice(0, 10));
  });

  it("an entry written by the legacy app (no localDate) counts only if its date equals the local date", () => {
    const legacyEntry = readEntry({ date: "2026-10-15", data: DATA })!;
    expect(legacyEntry.localDate).toBeUndefined();
    expect(isEntryFor(legacyEntry, "2026-10-15")).toBe(true);
    expect(isEntryFor(legacyEntry, "2026-10-16")).toBe(false);
  });

  it("readEntry returns null for anything unusable", () => {
    for (const bad of [null, undefined, "x", 3, [], {}, { date: 1, data: DATA }, { date: "2026-10-15" }, { date: "2026-10-15", data: {} }, { date: "2026-10-15", data: { ...DATA, arabic: "" } }, { date: "2026-10-15", data: { ...DATA, surah_number: 0 } }]) {
      expect(readEntry(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(isAyahData(DATA)).toBe(true);
  });

  it("dataFromVerse maps the verse service fields exactly as the legacy pickRandomVerse did, plus the additive ones", () => {
    const json = { arabic1: "A", english: "E", urdu: "U", surahNameArabicLong: "L", bengali: "B", arabic2: "A2", surahName: "Ar-Rum" };
    expect(dataFromVerse(json, 30, 7)).toEqual({ arabic: "A", translation: "E", urdu: "U", surah_name: "L", ayah_number: 7, surah_number: 30, bengali: "B", arabic2: "A2", surah_name_en: "Ar-Rum" });
    expect(dataFromVerse({}, 1, 1).arabic).toBe("");
  });
});

describe("translationFor: translationDefaultLang, English when unset or missing", () => {
  it("each language", () => {
    expect(translationFor(DATA, "english")).toMatchObject({ text: "english text", rtl: false });
    expect(translationFor(DATA, "urdu")).toMatchObject({ text: "urdu text", lang: "urdu", rtl: true });
    expect(translationFor(DATA, "bengali")).toMatchObject({ text: "bn text", lang: "bengali", rtl: false });
    expect(translationFor(DATA, "arabic2")).toMatchObject({ text: "ar2 text", rtl: true });
  });
  it("falls back to English when unset or when that language is missing from the stored entry", () => {
    expect(translationFor(DATA, null)).toMatchObject({ text: "english text", lang: "english" });
    expect(translationFor({ ...DATA, bengali: undefined }, "bengali")).toMatchObject({ text: "english text", lang: "english" });
    expect(translationFor({ ...DATA, urdu: "" }, "urdu")).toMatchObject({ lang: "english" });
  });
});
