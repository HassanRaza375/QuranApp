// Shared helpers for browser tests: a fixed clock, mocked upstream APIs (no test talks to the real services),
// and storage seeding. The mocked responses for AlAdhan are REAL responses (tests/fixtures), the verse text is a
// clearly fake test string.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BrowserContext, Page, Route } from "@playwright/test";

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
