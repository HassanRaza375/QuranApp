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
/** Real recorded Lahore months (AlAdhan), Sunni (method 2) and Ja'fari (method 0), by "YYYY/M" as the app asks for them. */
const MONTHS: Record<string, [string, string]> = {
  "2026/10": ["aladhan-lahore-2026-10-sunni.json", "aladhan-lahore-2026-10-jafari.json"],
  "2027/1": ["aladhan-lahore-2027-01-sunni.json", "aladhan-lahore-2027-01-jafari.json"],
  "2027/2": ["aladhan-lahore-2027-02-sunni.json", "aladhan-lahore-2027-02-jafari.json"],
  "2027/3": ["aladhan-lahore-2027-03-sunni.json", "aladhan-lahore-2027-03-jafari.json"],
};
/** Real recorded Hijri calendar (AlAdhan `hToGCalendar/9/1448`: Ramadan 1448, 8 Feb to 8 Mar 2027). */
export const RAMADAN_1448 = fixture("aladhan-htog-1448-09.json");

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
  await context.route(/https:\/\/(api\.aladhan\.com|quranapi\.pages\.dev|api\.alquran\.cloud|geocoding-api\.open-meteo\.com)\//, (route: Route) => {
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
    const m = /\/calendar\/(\d{4}\/\d{1,2})$/.exec(u.pathname);
    const files = m ? MONTHS[m[1]!] : undefined;
    if (!files) return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    const body = fixture(u.searchParams.get("method") === "0" ? files[1] : files[0]);
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body });
  });
  return state;
}

export interface HijriMock {
  /** Hijri-month requests (`hToGCalendar`, Ramadan) */
  calls: string[];
  /** Gregorian-month requests (`gToHCalendar`, events) */
  gcalls: string[];
  mode: "ok" | "http500" | "network";
}
/** Answers api.aladhan.com calendar requests: the Hijri month for Ramadan 1448 only, and the Gregorian months Sep 2026 to Sep 2027 (anything else is a 404). */
export async function mockHijri(context: BrowserContext, mode: HijriMock["mode"] = "ok"): Promise<HijriMock> {
  const state: HijriMock = { calls: [], gcalls: [], mode };
  await context.route(/https:\/\/api\.aladhan\.com\/v1\/gToHCalendar\//, async (route: Route) => {
    const url = route.request().url();
    state.gcalls.push(url);
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    const m = /\/gToHCalendar\/(\d{1,2})\/(\d{4})$/.exec(url);
    const file = m ? `aladhan-gtoh-${m[2]}-${m[1]!.padStart(2, "0")}.json` : "";
    if (!file || !fs.existsSync(path.resolve(HERE, "../tests/fixtures", file))) return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fixture(file) });
  });
  await context.route(/https:\/\/api\.aladhan\.com\/v1\/hToGCalendar\//, async (route: Route) => {
    const url = route.request().url();
    state.calls.push(url);
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    if (!/\/hToGCalendar\/9\/1448$/.test(url)) return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: RAMADAN_1448 });
  });
  return state;
}

export interface VerseMock {
  calls: string[];
  /** the recording files asked for (the queue preloads one ahead) */
  audioFetches: string[];
  mode: "ok" | "http500" | "network";
}

/** The five reciters of the per-ayah endpoint, in its order (the same names as the full-surah list). */
export const AYAH_RECITERS = ["Mishary Rashid Al Afasy", "Abu Bakr Al Shatri", "Nasser Al Qatami", "Yasser Al Dosari", "Hani Ar Rifai"];
/** What the per-ayah endpoint's `audio` holds for one ayah: a url per reciter, on a test host (the stand-in element never fetches it). */
export const fakeAyahAudio = (s: number, a: number) => Object.fromEntries(AYAH_RECITERS.map((r, i) => [String(i + 1), { reciter: r, url: `https://audio.test/Data/${i + 1}/${s}_${a}.mp3`, originalUrl: `https://audio.test/orig/${i + 1}/${s}_${a}.mp3` }]));

/** Answers quranapi.pages.dev verse requests (`/api/<surah>/<ayah>.json`) with fake test text. */
export async function mockVerse(context: BrowserContext, mode: VerseMock["mode"] = "ok"): Promise<VerseMock> {
  const state: VerseMock = { calls: [], audioFetches: [], mode };
  // the recording files themselves (a queue preloads the next one with fetch)
  await context.route(/https:\/\/audio\.test\//, (route: Route) => {
    state.audioFetches.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "audio/mpeg", headers: { "access-control-allow-origin": "*" }, body: "x" });
  });
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
        audio: fakeAyahAudio(Number(m[1]), Number(m[2])),
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
    type Hooks = {
      srcs: string[];
      rates: number[];
      fail: boolean;
      /** make play() reject with this error name (for example "NotAllowedError") */
      playError: string | null;
      /** play() resolves but the file never starts (a stalled load) */
      stall: boolean;
      duration: number;
      tick(t: number): void;
      end(): void;
      emit(name: string): void;
    };
    const w = window as unknown as { __audio: Hooks; Audio: unknown };
    const els: FakeAudio[] = [];
    class FakeAudio {
      private _src = "";
      get src() {
        return this._src;
      }
      set src(v: string) {
        this._src = v;
        this.currentTime = 0; // a real element starts a new file at 0
        this.announced = false;
      }
      preload = "";
      playbackRate = 1;
      currentTime = 0;
      duration = w.__audio.duration;
      paused = true;
      ended = false;
      announced = false;
      h: Record<string, (() => void)[]> = {};
      constructor() {
        els.push(this);
      }
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
        if (w.__audio.playError) throw new DOMException("blocked", w.__audio.playError);
        if (w.__audio.stall) return;
        this.duration = w.__audio.duration;
        if (!this.announced) {
          this.announced = true;
          this.emit("loadedmetadata");
        }
        this.paused = false;
        this.ended = false;
        this.emit("playing");
      }
      pause() {
        this.paused = true;
        this.emit("pause");
      }
    }
    const last = () => els[els.length - 1]!;
    w.__audio = {
      srcs: [],
      rates: [],
      fail: false,
      playError: null,
      stall: false,
      duration: 3600,
      tick: (t) => {
        last().currentTime = t;
        last().emit("timeupdate");
      },
      end: () => {
        const e = last();
        e.ended = true;
        e.paused = true;
        e.currentTime = e.duration;
        e.emit("pause");
        e.emit("ended");
      },
      emit: (n) => last().emit(n),
    };
    w.Audio = FakeAudio;
  });

// ---- Phase 5: the place search (Open-Meteo), the device position, and the orientation sensors

export interface GeocodeMock {
  calls: string[];
  mode: "ok" | "http500" | "network";
}

/** Answers geocoding-api.open-meteo.com with the real recorded responses (Leicester, Qom; anything else has no results). */
export async function mockGeocode(context: BrowserContext, mode: GeocodeMock["mode"] = "ok"): Promise<GeocodeMock> {
  const state: GeocodeMock = { calls: [], mode };
  await context.route(/https:\/\/geocoding-api\.open-meteo\.com\//, async (route: Route) => {
    const url = route.request().url();
    state.calls.push(url);
    if (state.mode === "network") return route.abort("internetdisconnected");
    if (state.mode === "http500") return route.fulfill({ status: 500, body: "{}" });
    const name = (new URL(url).searchParams.get("name") ?? "").toLowerCase();
    const file = name === "leicester" ? "openmeteo-leicester.json" : name === "qom" ? "openmeteo-qom.json" : "openmeteo-none.json";
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fixture(file) });
  });
  return state;
}

/** Replaces navigator.geolocation: "ok" answers `pos`, "denied" refuses, "timeout" times out. `window.__geoCalls` counts the asks. */
export const stubGeolocation = (context: BrowserContext, mode: "ok" | "denied" | "timeout", pos = { lat: 31.5204, lon: 74.3587 }) =>
  context.addInitScript(
    ({ mode, pos }) => {
      const w = window as unknown as { __geoCalls: number };
      w.__geoCalls = 0;
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (ok: (p: unknown) => void, err: (e: unknown) => void) => {
            w.__geoCalls++;
            if (mode === "ok") ok({ coords: { latitude: pos.lat, longitude: pos.lon } });
            else err({ code: mode === "denied" ? 1 : 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
          },
        },
      });
    },
    { mode, pos },
  );

/**
 * Tracks the orientation listeners the page adds and removes (by type, function and capture flag), counts vibrations, and gives
 * tests `window.__orient(type, props)` to dispatch a sensor event. `ios` adds DeviceOrientationEvent.requestPermission, whose
 * answer is `window.__iosAnswer`; `window.__iosAsks` counts the calls.
 */
export const stubSensors = (context: BrowserContext, opts: { ios?: boolean } = {}) =>
  context.addInitScript((o) => {
    const w = window as unknown as Record<string, unknown>;
    const active = new Set<string>();
    const ids = new WeakMap<object, number>();
    let next = 1;
    const key = (type: string, fn: unknown, capture: unknown) => `${type}#${ids.get(fn as object) ?? ids.set(fn as object, next++).get(fn as object)}#${capture === true || (typeof capture === "object" && capture !== null && (capture as { capture?: boolean }).capture === true)}`;
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, capture?: boolean | AddEventListenerOptions) => {
      if (type.startsWith("deviceorientation")) active.add(key(type, fn, capture));
      return add(type, fn, capture);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, fn: EventListenerOrEventListenerObject, capture?: boolean | EventListenerOptions) => {
      if (type.startsWith("deviceorientation")) active.delete(key(type, fn, capture));
      return remove(type, fn, capture);
    }) as typeof window.removeEventListener;
    w.__activeOrientationListeners = () => active.size;
    w.__vibrations = 0;
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: () => ((w.__vibrations as number)++, true) });
    w.__orient = (type: string, props: Record<string, unknown>) => {
      const e = new Event(type);
      for (const [k, v] of Object.entries(props)) Object.defineProperty(e, k, { value: v });
      window.dispatchEvent(e);
    };
    if (o.ios) {
      w.__iosAsks = 0;
      w.__iosAnswer = "granted";
      (window as unknown as { DeviceOrientationEvent: unknown }).DeviceOrientationEvent = Object.assign(function () {}, {
        requestPermission: async () => {
          (w.__iosAsks as number)++;
          return w.__iosAnswer;
        },
      });
    }
  }, opts);
