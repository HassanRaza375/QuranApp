// Shared helpers for browser tests: a fixed clock, mocked upstream APIs (no test talks to the real services),
// and storage seeding. The mocked responses for AlAdhan are REAL responses (tests/fixtures), the verse text is a
// clearly fake test string.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BrowserContext, Page, Route } from "@playwright/test";
import { AYAH_COUNTS } from "../app/lib/quranMeta";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => fs.readFileSync(path.resolve(HERE, "../tests/fixtures", name), "utf8");
export const SUNNI_OCT = fixture("aladhan-lahore-2026-10-sunni.json");
export const JAFARI_OCT = fixture("aladhan-lahore-2026-10-jafari.json");

/** 15 Oct 2026, 09:14 in Karachi (UTC+5), which is 04:14 UTC. */
export const NOW_KARACHI = "2026-10-15T09:14:00+05:00";
export const LAHORE_LEGACY = JSON.stringify({ lat: 31.5204, lng: 74.3587 });

/** Fixes `Date` (timers keep running). Pair it with `timezoneId` on the context for a known device time zone. */
export const freezeClock = (context: BrowserContext, iso = NOW_KARACHI) => context.clock.setFixedTime(new Date(iso));

/** Seeds localStorage once per tab (init scripts re-run on reload, so a flag in sessionStorage guards it). */
let seedCount = 0;
export const seed = (context: BrowserContext, values: Record<string, string>) =>
  context.addInitScript(
    ({ v, flag }) => {
      if (sessionStorage.getItem(flag)) return;
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, val);
      sessionStorage.setItem(flag, "1");
    },
    { v: values, flag: `__seeded_${++seedCount}` }, // one flag per call, so several seeds can be combined
  );

/**
 * Register this FIRST in a test: any request to a real upstream API that no mock answers is recorded and blocked.
 * (Playwright tries the most recently added route first, so the specific mocks added later still win.) Assert the
 * returned list is empty at the end of the test.
 */
export async function forbidRealApis(context: BrowserContext): Promise<string[]> {
  const leaks: string[] = [];
  await context.route(/https:\/\/(api\.aladhan\.com|quranapi\.pages\.dev|api\.alquran\.cloud)\//, (route: Route) => {
    leaks.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  return leaks;
}

export interface AladhanMock {
  calls: string[];
  /** change what the next requests get */
  mode: "ok" | "http500" | "network";
}

/** Answers api.aladhan.com monthly requests with real Lahore October 2026 data (Ja'fari data when method=0). */
export async function mockAladhan(context: BrowserContext, mode: AladhanMock["mode"] = "ok"): Promise<AladhanMock> {
  const state: AladhanMock = { calls: [], mode };
  await context.route(/https:\/\/api\.aladhan\.com\/v1\/calendar\//, async (route: Route) => {
    const url = route.request().url();
    state.calls.push(url);
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    const u = new URL(url);
    const ok = u.pathname.endsWith("/2026/10");
    if (!ok) return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    const body = u.searchParams.get("method") === "0" ? JAFARI_OCT : SUNNI_OCT;
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body });
  });
  return state;
}

export interface VerseMock {
  calls: string[];
  mode: "ok" | "http500" | "network";
}

/** Answers quranapi.pages.dev verse requests (`/api/<surah>/<ayah>.json`) with fake test text. */
export async function mockVerse(context: BrowserContext, mode: VerseMock["mode"] = "ok"): Promise<VerseMock> {
  const state: VerseMock = { calls: [], mode };
  await context.route(/https:\/\/quranapi\.pages\.dev\/api\/\d+\/\d+\.json/, async (route: Route) => {
    const m = /\/api\/(\d+)\/(\d+)\.json/.exec(route.request().url())!;
    state.calls.push(`${m[1]}:${m[2]}`);
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, body: "{}" });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        surahName: `TestSurah${m[1]}`, surahNameArabic: "TEST", surahNameArabicLong: "TEST LONG", surahNo: Number(m[1]),
        arabic1: `TEST ARABIC ${m[1]}:${m[2]}`, arabic2: `TEST ARABIC TWO ${m[1]}:${m[2]}`,
        english: `Test English ${m[1]}:${m[2]}`, urdu: `Test Urdu ${m[1]}:${m[2]}`, bengali: `Test Bengali ${m[1]}:${m[2]}`,
      }),
    });
  });
  return state;
}

/** A stored `ayah-of-day` entry for the given local date, so a test that is not about the ayah needs no network. */
export const ayahEntry = (localDate: string, utcDate = localDate, surah = 94, ayah = 5) =>
  JSON.stringify({
    date: utcDate,
    localDate,
    data: { arabic: `SEEDED ARABIC ${surah}:${ayah}`, translation: `Seeded English ${surah}:${ayah}`, urdu: "Seeded Urdu", surah_name: "SEEDED LONG", ayah_number: ayah, surah_number: surah, surah_name_en: "SeededSurah" },
  });

export const readStorage = (page: Page) =>
  page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));

export const idbNames = (page: Page) => page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));

// ---- the reader's upstream (quranapi.pages.dev): SYNTHETIC chapters and tafsir with the right ayah counts and obviously
// fake text, so no Qur'an or tafsir text is stored in a test. Shapes match the service (checked against a real response).
export const fakeChapter = (n: number) => {
  const total = AYAH_COUNTS[n - 1]!;
  const mk = (label: string) => Array.from({ length: total }, (_, i) => `${label} ${n}:${i + 1}`);
  return {
    surahName: `TestSurah${n}`,
    surahNameArabic: "TEST",
    surahNameArabicLong: `TEST LONG ${n}`,
    surahNameTranslation: `Test Meaning ${n}`,
    revelationPlace: "Mecca",
    totalAyah: total,
    surahNo: n,
    audio: {},
    english: mk("Test English"),
    arabic1: mk("TEST ARABIC"),
    arabic2: mk("TEST ARABIC ALT"),
    bengali: mk("Test Bengali"),
    urdu: mk("Test Urdu"),
  };
};

export const fakeTafsir = (s: number, a: number) => ({
  surahName: `TestSurah${s}`,
  surahNo: s,
  ayahNo: a,
  tafsirs: [
    { author: "Ibn Kathir", groupVerse: null, content: `## Heading ${s}:${a}

Ibn Kathir test text for ${s}:${a}. **bold** <b>not markup</b> <script>window.__xss=1</script>` },
    { author: "Maarif Ul Quran", groupVerse: null, content: `Maarif test text for ${s}:${a}.` },
    { author: "Tazkirul Quran", groupVerse: `You are reading a tafsir for the group of verses ${s}:${a} to ${s}:${a + 2}`, content: `Tazkir test text for ${s}:${a}.` },
  ],
});

export interface QuranTextMock {
  chapters: number[];
  tafsirs: string[];
  /** change what the next requests get */
  mode: "ok" | "http500" | "network";
  /** surahs that are never answered (a hung request) */
  delayMs: number;
}

export async function mockQuranText(context: BrowserContext, mode: QuranTextMock["mode"] = "ok"): Promise<QuranTextMock> {
  const state: QuranTextMock = { chapters: [], tafsirs: [], mode, delayMs: 0 };
  const respond = async (route: Route, body: unknown, record: () => void) => {
    record();
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, body: "{}" });
    if (state.delayMs) await new Promise((r) => setTimeout(r, state.delayMs));
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  };
  await context.route(/https:\/\/quranapi\.pages\.dev\/api\/tafsir\/\d+_\d+\.json/, (route) => {
    const m = /tafsir\/(\d+)_(\d+)\.json/.exec(route.request().url())!;
    return respond(route, fakeTafsir(Number(m[1]), Number(m[2])), () => state.tafsirs.push(`${m[1]}_${m[2]}`));
  });
  await context.route(/https:\/\/quranapi\.pages\.dev\/api\/\d+\.json/, (route) => {
    const n = Number(/api\/(\d+)\.json/.exec(route.request().url())![1]);
    return respond(route, fakeChapter(n), () => state.chapters.push(n));
  });
  return state;
}

/** Replaces the browser's Audio with a recorder; `window.__audio.fail = true` makes play() fail like a missing file. */
export const stubAudio = (context: BrowserContext) =>
  context.addInitScript(() => {
    const w = window as unknown as { __audio: { srcs: string[]; rates: number[]; fail: boolean }; Audio: unknown };
    w.__audio = { srcs: [], rates: [], fail: false };
    class FakeAudio {
      src = "";
      preload = "";
      playbackRate = 1;
      h: Record<string, (() => void)[]> = {};
      addEventListener(n: string, f: () => void) {
        (this.h[n] ??= []).push(f);
      }
      emit(n: string) {
        (this.h[n] ?? []).forEach((f) => f());
      }
      async play() {
        w.__audio.srcs.push(this.src);
        w.__audio.rates.push(this.playbackRate);
        if (w.__audio.fail) {
          setTimeout(() => this.emit("error"));
          throw new DOMException("no file", "NotSupportedError");
        }
        this.emit("playing");
      }
      pause() {
        this.emit("pause");
      }
    }
    w.Audio = FakeAudio;
  });
