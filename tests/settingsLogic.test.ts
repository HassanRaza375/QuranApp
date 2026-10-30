// Phase 2 logic: calculation methods, the new preference keys, notification scheduling, Hijri preview, Export,
// Reset (with Undo) and Clear all (exactly what was approved).
import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeRevampDb, deleteDatabase, getPrayerMonth, putPrayerMonth, REVAMP_DB_NAME } from "../app/db/revampDb";
import { CALC_METHODS, DEFAULT_CALC, methodsFor, normalizeCalc, paramsFor } from "../app/lib/calcMethods";
import { formatHijri, hijriPreview } from "../app/lib/hijri";
import { needsHomeScreenHint, notificationPermission, showNotificationNow } from "../app/lib/notifyBrowser";
import { DEFAULT_NOTIFY, LATE_GRACE_MS, nextDelay, pendingReminders, reminderText, type NotifyConfig } from "../app/lib/notifySchedule";
import { zonedInstant } from "../app/lib/prayerClock";
import { normalizeMonthResponse, type PrayerDay, type PrayerRequest } from "../app/lib/prayerMonth";
import { DESCRIPTORS, effectiveTranslationLang, KEYS, loadPreferences, preferencesForKey, savePreference } from "../app/lib/preferences";
import { buildExport, clearAllLocalData, exportFileName, resetSettings, restoreSettings, RESET_KEYS, snapshotSettings } from "../app/lib/settingsData";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8"));
const use = (initial: Record<string, string> = {}) => {
  const s = memoryStore(initial);
  setStorageBackend(s);
  return s;
};
afterEach(() => setStorageBackend(null));

/* ---------------- calculation methods ---------------- */
describe("calculation methods", () => {
  it("every id and name matches the service's own list (recorded GET /v1/methods)", () => {
    const methods = Object.values(fixture("aladhan-methods.json").data) as { id: number; name: string }[];
    for (const m of CALC_METHODS) expect(methods.find((x) => x.id === m.id)?.name, `method ${m.id}`).toBe(m.name);
  });

  it("Sunni offers 5 methods, Ja'fari 2 (Leva and Tehran), as in the prototype", () => {
    expect(methodsFor("sunni").map((m) => m.id)).toEqual([2, 3, 4, 1, 5]);
    expect(methodsFor("jafari").map((m) => m.id)).toEqual([0, 7]);
  });

  it("the defaults equal what the legacy app asks for (ISNA for Sunni; Leva, school 0, Ja'fari midnight)", async () => {
    const { FIQH_PARAMS } = await import("@legacy/utils/prayerFiqh.js");
    expect(paramsFor("sunni", DEFAULT_CALC)).toEqual({ method: FIQH_PARAMS.sunni.method, school: 0, midnightMode: 0 });
    expect(paramsFor("jafari", DEFAULT_CALC)).toEqual({ method: FIQH_PARAMS.jafari.method, school: FIQH_PARAMS.jafari.school, midnightMode: FIQH_PARAMS.jafari.midnightMode });
  });

  it("the Asr school applies to Sunni only; Ja'fari always sends school 0, so a hidden setting never changes its cache key", () => {
    const hanafi = { ...DEFAULT_CALC, asr: "hanafi" as const };
    expect(paramsFor("sunni", hanafi).school).toBe(1);
    expect(paramsFor("jafari", hanafi).school).toBe(0);
    expect(paramsFor("jafari", { ...hanafi, jafariMethod: 7 })).toEqual({ method: 7, school: 0, midnightMode: 1 });
  });

  it("invalid stored values fall back field by field (a Ja'fari id in the Sunni slot is invalid)", () => {
    expect(normalizeCalc({ sunniMethod: 7, jafariMethod: 2, asr: "x" })).toEqual(DEFAULT_CALC);
    expect(normalizeCalc({ sunniMethod: 1, jafariMethod: 7, asr: "hanafi" })).toEqual({ sunniMethod: 1, jafariMethod: 7, asr: "hanafi" });
    for (const bad of [null, "x", [], 5]) expect(normalizeCalc(bad)).toEqual(DEFAULT_CALC);
  });
});

/* ---------------- new preference keys ---------------- */
describe("new and shared preference keys", () => {
  it("prayer-calc, download-prefs and verse-layout use the proposed keys and shapes, merging unknown fields", () => {
    const s = use({ "quran:prayer-calc:v1": '{"future":1}' });
    savePreference("calc", { sunniMethod: 4, jafariMethod: 7, asr: "hanafi" });
    expect(JSON.parse(s.data.get("quran:prayer-calc:v1")!)).toEqual({ future: 1, sunniMethod: 4, jafariMethod: 7, asr: "hanafi" });
    savePreference("wifiOnly", true);
    expect(s.data.get("quran:download-prefs:v1")).toBe('{"wifiOnly":true}');
    savePreference("verseLayout", "tr");
    expect(s.data.get("quran:verse-layout:v1")).toBe('{"order":"tr"}');
  });

  it("notifications are stored in the legacy prayerSettings shape, keeping unknown fields; any offset the legacy scheduler accepts", () => {
    const s = use({ prayerSettings: '{"extra":"keep","notificationsEnabled":false}' });
    savePreference("notifications", { enabled: true, prayers: { Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: true }, offset: 15 });
    expect(JSON.parse(s.data.get("prayerSettings")!)).toEqual({
      extra: "keep",
      notificationsEnabled: true,
      enabledPrayers: { Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: true },
      reminderOffset: 15,
    });
    expect(loadPreferences().notifications.offset).toBe(15);
  });

  it("reads prayerSettings written by the legacy app (missing prayers default to on; junk is ignored)", () => {
    use({ prayerSettings: JSON.stringify({ notificationsEnabled: true, reminderOffset: 5 }) });
    expect(loadPreferences().notifications).toEqual({ enabled: true, prayers: DEFAULT_NOTIFY.prayers, offset: 5 });
    use({ prayerSettings: JSON.stringify({ notificationsEnabled: "yes", reminderOffset: "soon", enabledPrayers: [] }) });
    expect(loadPreferences().notifications).toEqual(DEFAULT_NOTIFY);
    use({ prayerSettings: "{oops" });
    expect(loadPreferences().notifications).toEqual(DEFAULT_NOTIFY);
  });

  it("the reminder offset is clamped", () => {
    const s = use();
    savePreference("notifications", { ...DEFAULT_NOTIFY, offset: 999 });
    expect(JSON.parse(s.data.get("prayerSettings")!).reminderOffset).toBe(120);
    savePreference("notifications", { ...DEFAULT_NOTIFY, offset: -4 });
    expect(JSON.parse(s.data.get("prayerSettings")!).reminderOffset).toBe(0);
  });

  it("the Daily Fiqh marja' uses the legacy key, keeps the reading language, and rejects unknown ids", () => {
    const s = use({ "quran:fiqh-prefs:v1": '{"marjaId":null,"lang":"ur","updatedAt":1}' });
    savePreference("marjaId", "sistani");
    const stored = JSON.parse(s.data.get("quran:fiqh-prefs:v1")!);
    expect(stored).toMatchObject({ marjaId: "sistani", lang: "ur" });
    expect(loadPreferences().marjaId).toBe("sistani");
    use({ "quran:fiqh-prefs:v1": '{"marjaId":"nobody"}' });
    expect(loadPreferences().marjaId).toBeNull();
    savePreference("marjaId", "nobody");
    expect(loadPreferences().marjaId).toBeNull();
  });

  it("every new key feeds the cross-tab map", () => {
    expect(preferencesForKey(KEYS.calc)).toEqual(["calc"]);
    expect(preferencesForKey("prayerSettings")).toEqual(["notifications"]);
    expect(preferencesForKey("quran:fiqh-prefs:v1")).toEqual(["marjaId", "fiqhLang"]);
    expect(preferencesForKey("quran:verse-layout:v1")).toEqual(["verseLayout"]);
    expect(preferencesForKey("quran:download-prefs:v1")).toEqual(["wifiOnly"]);
    expect(Object.keys(DESCRIPTORS).length).toBe(Object.keys(loadPreferences()).length);
  });
});

describe("Default translation: Not set removes the key; preferredVerseDisplay is only read", () => {
  it("'Not set' removes translationDefaultLang", () => {
    const s = use({ translationDefaultLang: "urdu" });
    savePreference("translationLang", null);
    expect(s.data.has("translationDefaultLang")).toBe(false);
  });

  it("an explicit choice wins; otherwise a translation named by the legacy reader's text tab is the default; Arabic tabs give none", () => {
    expect(effectiveTranslationLang({ translationLang: "bengali", verseDisplay: "urdu" })).toBe("bengali");
    expect(effectiveTranslationLang({ translationLang: null, verseDisplay: "urdu" })).toBe("urdu");
    expect(effectiveTranslationLang({ translationLang: null, verseDisplay: "english" })).toBe("english");
    expect(effectiveTranslationLang({ translationLang: null, verseDisplay: "bengali" })).toBe("bengali");
    expect(effectiveTranslationLang({ translationLang: null, verseDisplay: "arabic1" })).toBeNull();
    expect(effectiveTranslationLang({ translationLang: null, verseDisplay: "arabic2" })).toBeNull();
  });

  it("preferredVerseDisplay is never written by anything in Settings or Reset", () => {
    const s = use({ preferredVerseDisplay: "urdu", translationDefaultLang: "english" });
    const writes: string[] = [];
    const real = s.setItem;
    s.setItem = (k, v) => (writes.push(k), real(k, v));
    savePreference("translationLang", null);
    savePreference("translationLang", "bengali");
    resetSettings();
    expect(writes).not.toContain("preferredVerseDisplay");
    expect(s.data.get("preferredVerseDisplay")).toBe("urdu");
    expect(RESET_KEYS).not.toContain("preferredVerseDisplay");
  });
});

/* ---------------- notification scheduling ---------------- */
describe("pendingReminders", () => {
  const KHI = "Asia/Karachi";
  const day = (date: string, t: [string, string, string, string, string]): PrayerDay => ({
    date,
    timings: { Fajr: t[0], Dhuhr: t[1], Asr: t[2], Maghrib: t[3], Isha: t[4] },
    hijri: { day: 1, month: 1, year: 1448, monthNameEn: "" },
  });
  const d15 = day("2026-10-15", ["04:59", "11:48", "15:05", "17:31", "18:38"]);
  const d16 = day("2026-10-16", ["04:59", "11:48", "15:04", "17:30", "18:37"]);
  const on = (over: Partial<NotifyConfig> = {}): NotifyConfig => ({ ...DEFAULT_NOTIFY, enabled: true, ...over });
  const at = (date: string, hhmm: string) => zonedInstant(date, hhmm, KHI);
  const none = new Set<string>();

  it("nothing when disabled", () => {
    expect(pendingReminders({ ...DEFAULT_NOTIFY, enabled: false }, [d15], KHI, at("2026-10-15", "09:00"), none)).toEqual([]);
  });

  it("the remaining prayers of today then tomorrow, in order, in the location's zone", () => {
    const r = pendingReminders(on(), [d15, d16], KHI, at("2026-10-15", "09:00"), none);
    expect(r.slice(0, 5).map((x) => x.key)).toEqual(["2026-10-15:Dhuhr", "2026-10-15:Asr", "2026-10-15:Maghrib", "2026-10-15:Isha", "2026-10-16:Fajr"]);
    expect(r[0]!.fireAt.toISOString()).toBe("2026-10-15T06:48:00.000Z"); // 11:48 in Karachi (UTC+5)
  });

  it("tomorrow's own times are used (not today's rolled forward)", () => {
    const r = pendingReminders(on(), [d15, d16], KHI, at("2026-10-15", "19:00"), none);
    expect(r.find((x) => x.key === "2026-10-16:Asr")!.fireAt.toISOString()).toBe(at("2026-10-16", "15:04").toISOString());
  });

  it("a reminder offset fires that many minutes before", () => {
    const r = pendingReminders(on({ offset: 10 }), [d15], KHI, at("2026-10-15", "09:00"), none);
    expect(r[0]!.prayerAt.toISOString()).toBe(at("2026-10-15", "11:48").toISOString());
    expect(r[0]!.fireAt.toISOString()).toBe(at("2026-10-15", "11:38").toISOString());
  });

  it("only the chosen prayers", () => {
    const r = pendingReminders(on({ prayers: { Fajr: false, Dhuhr: false, Asr: true, Maghrib: false, Isha: false } }), [d15, d16], KHI, at("2026-10-15", "09:00"), none);
    expect(r.map((x) => x.prayer)).toEqual(["Asr", "Asr"]);
  });

  it("late reminders: up to 5 minutes late is still shown, older is skipped (never shown stale)", () => {
    const late4 = pendingReminders(on(), [d15], KHI, new Date(at("2026-10-15", "11:48").getTime() + 4 * 60_000), none);
    expect(late4[0]!.key).toBe("2026-10-15:Dhuhr");
    expect(nextDelay(late4, new Date(at("2026-10-15", "11:48").getTime() + 4 * 60_000))).toBe(0); // due now
    const late6 = pendingReminders(on(), [d15], KHI, new Date(at("2026-10-15", "11:48").getTime() + 6 * 60_000), none);
    expect(late6[0]!.key).toBe("2026-10-15:Asr");
    expect(LATE_GRACE_MS).toBe(300_000);
    const exactly = pendingReminders(on(), [d15], KHI, new Date(at("2026-10-15", "11:48").getTime() + LATE_GRACE_MS), none);
    expect(exactly[0]!.key).toBe("2026-10-15:Dhuhr"); // exactly 5 minutes late still counts
  });

  it("each reminder shows at most once (shown keys are skipped)", () => {
    const r = pendingReminders(on(), [d15], KHI, at("2026-10-15", "09:00"), new Set(["2026-10-15:Dhuhr"]));
    expect(r[0]!.key).toBe("2026-10-15:Asr");
  });

  it("works from the location's zone even when the device is elsewhere", () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = "America/Los_Angeles";
      const r = pendingReminders(on(), [d15], KHI, at("2026-10-15", "09:00"), none);
      expect(r[0]!.fireAt.toISOString()).toBe("2026-10-15T06:48:00.000Z");
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it("delay is the time to the first reminder, null when none is left (end of the cached months)", () => {
    const now = at("2026-10-15", "09:00");
    const r = pendingReminders(on(), [d15], KHI, now, none);
    expect(nextDelay(r, now)).toBe(r[0]!.fireAt.getTime() - now.getTime());
    expect(nextDelay(pendingReminders(on(), [d15], KHI, at("2026-10-15", "23:00"), none), at("2026-10-15", "23:00"))).toBeNull();
  });

  it("wording", () => {
    const r = pendingReminders(on(), [d15], KHI, at("2026-10-15", "09:00"), none)[0]!;
    expect(reminderText(r, 0)).toEqual({ title: "Dhuhr time", body: "It is time for Dhuhr prayer." });
    expect(reminderText(r, 10)).toEqual({ title: "Dhuhr soon", body: "Dhuhr begins in 10 minutes." });
    expect(reminderText(r, 1).body).toBe("Dhuhr begins in 1 minute.");
  });
});

describe("notifyBrowser", () => {
  const g = globalThis as Record<string, unknown>;
  afterEach(() => {
    delete g.Notification;
    vi.restoreAllMocks();
  });

  it("permission states", () => {
    expect(notificationPermission()).toBe("unsupported");
    g.Notification = { permission: "granted" };
    expect(notificationPermission()).toBe("granted");
    g.Notification = { permission: "denied" };
    expect(notificationPermission()).toBe("denied");
  });

  it("does not show anything without permission", async () => {
    g.Notification = { permission: "default" };
    expect(await showNotificationNow({ title: "t", body: "b", tag: "x" })).toBe(false);
  });

  it("the Home Screen hint appears only when the browser has no Notification API and it is an iPhone or iPad", () => {
    const nav = (ua: string) => vi.stubGlobal("navigator", { userAgent: ua });
    nav("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    expect(needsHomeScreenHint()).toBe(true);
    g.Notification = { permission: "default" };
    expect(needsHomeScreenHint()).toBe(false);
    delete g.Notification;
    nav("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120");
    expect(needsHomeScreenHint()).toBe(false);
    vi.unstubAllGlobals();
  });
});

/* ---------------- Hijri preview ---------------- */
describe("hijriPreview", () => {
  const mk = (date: string, day: number, month = 5): PrayerDay => ({ date, timings: {} as PrayerDay["timings"], hijri: { day, month, year: 1448, monthNameEn: "Jumada I" } });
  const days = [mk("2026-10-13", 2), mk("2026-10-14", 3), mk("2026-10-15", 4), mk("2026-10-16", 5), mk("2026-10-17", 6)];

  it("shifts by whole days using the neighbouring day's own Hijri date", () => {
    expect(hijriPreview(days, "2026-10-15", 0)!.adjusted.day).toBe(4);
    expect(hijriPreview(days, "2026-10-15", 1)!.adjusted.day).toBe(5);
    expect(hijriPreview(days, "2026-10-15", -2)!.adjusted.day).toBe(2);
    expect(formatHijri(hijriPreview(days, "2026-10-15", 2)!.adjusted)).toBe("6 Jumada I 1448");
  });

  it("crosses a Hijri month change without guessing the month length", () => {
    const edge = [mk("2026-10-14", 29, 5), mk("2026-10-15", 30, 5), { ...mk("2026-10-16", 1, 6), hijri: { day: 1, month: 6, year: 1448, monthNameEn: "Jumada II" } }];
    expect(formatHijri(hijriPreview(edge, "2026-10-15", 1)!.adjusted)).toBe("1 Jumada II 1448");
  });

  it("no preview when the neighbouring day is not cached", () => {
    expect(hijriPreview(days, "2026-10-17", 2)).toBeNull();
    expect(hijriPreview(days, "2026-12-01", 0)).toBeNull();
    expect(hijriPreview([], "2026-10-15", 0)).toBeNull();
  });
});

/* ---------------- Export ---------------- */
describe("Export", () => {
  it("is one flat object with every localStorage key: JSON parsed, raw strings kept", () => {
    use({ prayerFiqh: "jafari", themeMode: "dark", "quran:bookmarks:v1": '["ayah:2:255"]', "quran:accessibility:v1": '{"arabicFontScale":1.2}', last_location: '{"lat":1,"lng":2}', "quran:location:v1": '{"lat":3,"lon":4}' });
    expect(buildExport()).toEqual({
      prayerFiqh: "jafari",
      themeMode: "dark",
      "quran:bookmarks:v1": ["ayah:2:255"],
      "quran:accessibility:v1": { arabicFontScale: 1.2 },
      last_location: { lat: 1, lng: 2 },
      "quran:location:v1": { lat: 3, lon: 4 }, // new keys are included automatically (so are the saved places)
    });
  });

  it("is empty, not an error, when storage is unavailable", () => {
    setStorageBackend(memoryStore({}, true));
    expect(buildExport()).toEqual({});
  });

  it("the file name uses the LOCAL date (the legacy name used the UTC date)", () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = "Asia/Karachi";
      expect(exportFileName(new Date("2026-10-15T20:30:00Z"))).toBe("quran-app-data-2026-10-16.json"); // 01:30 on the 16th locally
      process.env.TZ = "America/Los_Angeles";
      expect(exportFileName(new Date("2026-10-16T03:00:00Z"))).toBe("quran-app-data-2026-10-15.json");
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

/* ---------------- Reset settings ---------------- */
describe("Reset settings", () => {
  const FULL = {
    prayerFiqh: "jafari",
    themeMode: "dark",
    translationDefaultLang: "urdu",
    tafsirDefaultAuthor: "Ibn Kathir",
    reciter: '{"reciter":"Hani Ar Rifai"}',
    prayerSettings: '{"notificationsEnabled":true,"reminderOffset":10}',
    "quran:additional-modules-enabled:v1": "true",
    "quran:prayer-calc:v1": '{"sunniMethod":1}',
    "quran:download-prefs:v1": '{"wifiOnly":true}',
    "quran:hijri-adjust:v1": '{"days":1}',
    "quran:verse-layout:v1": '{"order":"tr"}',
    "quran:accessibility:v1": '{"reducedMotion":true,"highContrast":true,"largeTouchTargets":true,"arabicFontScale":1.5,"futureField":"keep"}',
    "quran:audio-prefs:v1": '{"playbackRate":1.5,"autoAdvance":true,"repeatOne":true}',
    // data and things that are not settings: must survive
    "quran:bookmarks:v1": '["ayah:1:1"]',
    "quran:library:v1": '{"collections":[]}',
    "quran:reading-progress:v1": '{"surahNo":2,"ayahNo":5}',
    "quran:location:v1": '{"lat":31.52,"lon":74.36,"source":"device","updatedAt":1}',
    last_location: '{"lat":31.5,"lng":74.3}',
    "quran:fiqh-prefs:v1": '{"marjaId":"sistani","lang":"ur","updatedAt":1}',
    preferredVerseDisplay: "urdu",
    "quran:nav-open:v1": '{"read":true}',
    "ayah-of-day": '{"date":"2026-10-15"}',
  };

  it("restores the defaults for settings only, keeps shared-object fields it does not own, and keeps all data", () => {
    const s = use({ ...FULL });
    resetSettings();
    for (const k of ["prayerFiqh", "themeMode", "translationDefaultLang", "tafsirDefaultAuthor", "reciter", "prayerSettings", "quran:prayer-calc:v1", "quran:download-prefs:v1", "quran:hijri-adjust:v1", "quran:verse-layout:v1"]) {
      expect(s.data.has(k), k).toBe(false);
    }
    expect(JSON.parse(s.data.get("quran:accessibility:v1")!)).toEqual({ futureField: "keep" });
    expect(JSON.parse(s.data.get("quran:audio-prefs:v1")!)).toEqual({ repeatOne: true });
    for (const k of ["quran:bookmarks:v1", "quran:library:v1", "quran:reading-progress:v1", "quran:location:v1", "last_location", "quran:fiqh-prefs:v1", "preferredVerseDisplay", "quran:nav-open:v1", "ayah-of-day", "quran:additional-modules-enabled:v1" /* Poets is deferred: this key is never read or written (DECISIONS.md) */]) {
      expect(s.data.get(k), k).toBe(FULL[k as keyof typeof FULL]);
    }
    expect(loadPreferences()).toMatchObject({ theme: "light", fiqh: "sunni", arabicScale: 1, playbackRate: 1, autoplay: false, reducedMotion: false, hijriAdjust: 0, marjaId: "sistani" });
  });

  it("an object whose only fields were settings is removed, not left empty", () => {
    const s = use({ "quran:accessibility:v1": '{"reducedMotion":true}' });
    resetSettings();
    expect(s.data.has("quran:accessibility:v1")).toBe(false);
  });

  it("Undo puts every key back exactly as it was (byte for byte, including absent ones)", () => {
    const s = use({ ...FULL });
    const before = new Map(s.data);
    const snap = resetSettings();
    expect(new Map(s.data)).not.toEqual(before);
    restoreSettings(snap);
    expect(new Map(s.data)).toEqual(before);

    const empty = use({ themeMode: "dark" });
    const snap2 = resetSettings();
    restoreSettings(snap2);
    expect(empty.data.get("themeMode")).toBe("dark");
    expect(empty.data.has("prayerFiqh")).toBe(false); // absent stays absent
  });

  it("the snapshot covers exactly the keys Reset can change", () => {
    use({});
    expect(Object.keys(snapshotSettings()).sort()).toEqual([...RESET_KEYS].sort());
  });
});

/* ---------------- Clear all ---------------- */
describe("Clear all local data", () => {
  const REQ: PrayerRequest = { lat: 31.5204, lon: 74.3587, method: 2, school: 0, midnightMode: 0, month: "2026-10" };

  beforeEach(async () => {
    await closeRevampDb();
    await new Promise<void>((done) => {
      const r = indexedDB.deleteDatabase(REVAMP_DB_NAME);
      r.onsuccess = r.onerror = r.onblocked = () => done();
    });
  });
  afterEach(async () => {
    await closeRevampDb();
    vi.unstubAllGlobals();
  });

  it("is localStorage.clear() plus deleting quran-revamp-db, and NOTHING else", async () => {
    const s = use({ a: "1", b: "2" });
    const deleted: string[] = [];
    const cachesDelete = vi.fn();
    const unregister = vi.fn();
    vi.stubGlobal("caches", { delete: cachesDelete, keys: vi.fn(), open: vi.fn() });
    vi.stubGlobal("navigator", { serviceWorker: { getRegistrations: unregister, getRegistration: unregister } });
    const result = await clearAllLocalData(async (name) => void deleted.push(name));
    expect(result.storageCleared).toBe(true);
    expect([...s.data.keys()]).toEqual([]);
    expect(deleted).toEqual(["quran-revamp-db"]); // not "quran-app-db"
    expect(cachesDelete).not.toHaveBeenCalled(); // downloaded audio and the app shell stay
    expect(unregister).not.toHaveBeenCalled(); // the service worker stays
  });

  it("really deletes the revamp database and leaves the legacy quran-app-db untouched (same version, same data)", async () => {
    // a legacy database as the legacy app creates it: quran-app-db, version 1, stores "chapters" and "tafsirs"
    await new Promise<void>((ok, fail) => {
      const open = indexedDB.open("quran-app-db", 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore("chapters");
        open.result.createObjectStore("tafsirs");
      };
      open.onsuccess = () => {
        const tx = open.result.transaction("chapters", "readwrite");
        tx.objectStore("chapters").put({ surah: 1 }, 1);
        tx.oncomplete = () => (open.result.close(), ok());
      };
      open.onerror = () => fail(open.error);
    });
    const r = normalizeMonthResponse(fixture("aladhan-lahore-2026-10-sunni.json"), REQ, 1);
    if (!r.ok) throw new Error(r.reason);
    await putPrayerMonth(r.record);
    expect(await getPrayerMonth(r.record.key)).toBeTruthy();

    use({ x: "1" });
    await closeRevampDb();
    await clearAllLocalData(deleteDatabase);

    const dbs = await indexedDB.databases();
    expect(dbs.map((d) => d.name)).not.toContain("quran-revamp-db");
    const legacy = dbs.find((d) => d.name === "quran-app-db");
    expect(legacy?.version).toBe(1); // never version-bumped
    const value = await new Promise((ok) => {
      const open = indexedDB.open("quran-app-db", 1);
      open.onsuccess = () => {
        const get = open.result.transaction("chapters").objectStore("chapters").get(1);
        get.onsuccess = () => (open.result.close(), ok(get.result));
      };
    });
    expect(value).toEqual({ surah: 1 });
    expect(await getPrayerMonth(r.record.key)).toBeUndefined(); // the saved prayer times are gone (a new empty database opens)
  });

  it("still deletes the database when storage is unavailable, and reports it", async () => {
    setStorageBackend(memoryStore({}, true));
    const deleted: string[] = [];
    const result = await clearAllLocalData(async (n) => void deleted.push(n));
    expect(result.storageCleared).toBe(false);
    expect(deleted).toEqual(["quran-revamp-db"]);
  });
});
