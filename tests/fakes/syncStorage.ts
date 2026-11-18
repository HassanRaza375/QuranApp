// A storage that has every key the app writes, in the legacy shapes, with unknown extra fields where the legacy app would keep them. Values are made up
// (no Qur'an text). `NEVER_MARK` is put in every key that must never leave the device, so a test can search a payload for it.
import type { Store } from "../../app/lib/sync/adapters";

export const NEVER_MARK = "NEVER-SYNC-MARKER";

export const FULL: Record<string, string> = {
  "quran:bookmarks:v1": JSON.stringify(["ayah:2:255", "surah:18", "person:ibrahim"]),
  "quran:bookmarks:added-at:v1": JSON.stringify({ "ayah:2:255": 1000, "surah:18": 2000, "person:ibrahim": 3000 }),
  "quran:library:v1": JSON.stringify({
    collections: [{ id: "c1", name: "Fridays", description: "", createdAt: 5, colour: "teal" }],
    itemMeta: { "ayah:2:255": { note: "a note", tags: ["dua"], collectionIds: ["c1"], updatedAt: 7, pinned: true } },
    retiredCollectionIds: ["old"],
    futureField: { a: 1 },
  }),
  "quran:reading-progress:v1": JSON.stringify({ surahNo: 2, ayahNo: 100, surahName: "Al-Baqara", surahNameArabic: "x", totalAyah: 286, updatedAt: 123 }),
  "quran:read-surahs:v1": JSON.stringify({ v: 1, surahs: { "1": { completedAt: 5 }, "112": { completedAt: 9 } }, extra: 1 }),
  "quran:pins:v1": JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 5, pinnedAt: 9 }, page: { pageNo: 3, pinnedAt: 9 } }),
  "quran:reading-goals:v1": JSON.stringify({
    goals: [{ id: "g1", type: "ayahs-per-day", status: "active", label: "Daily", startDate: "2026-11-01", dailyAyahTarget: 5, legacyField: 1 }],
    activeGoalId: "g1",
    dailyLog: { "2026-11-02": ["1:1", "1:2"] },
    other: { a: 1 },
  }),
  "quran:hifz:v2": JSON.stringify({
    targets: [{ id: "t1", surahNo: 67 }],
    ayahStates: [{ key: "t1:1", targetId: "t1", strength: "new" }],
    transitionStates: [{ key: "t1:1-2", targetId: "t1" }],
    activity: [{ date: "2026-11-02", newAyahs: 2, revisions: 1 }],
    extra: 1,
  }),
  "quran:hifz-words:v1": JSON.stringify({ v: 1, ayahs: { "67:1": { "0": { word: "w", slipDays: ["2026-11-01"], cleanDays: [], last: "2026-11-01" } } } }),
  "quran:tasbeeh:v1": JSON.stringify({ c1: { count: 3, target: 33, cycles: 0, lifetime: 3 }, "name-5": { count: 1, target: 99, cycles: 2, lifetime: 200, extra: 1 } }),
  "quran:story-progress:v1": JSON.stringify({ v: 1, stories: { s1: { chapter: 1, read: [0, 1], updatedAt: 2 } } }),
  "quran:persons-study:v1": JSON.stringify({ ibrahim: { lastSection: "a", passageView: "b", lastSurahNo: 2, lastAyahNo: 1, updatedAt: 3 } }),
  "quran:ramadan:v1": JSON.stringify({ startOverride: "2027-02-08", fastingLog: { "2027-02-09": "fasted", "2027-02-10": "missed" }, extra: 1 }),
  "quran:reminders:v1": JSON.stringify([{ id: "r1", title: "Ayat al-Kursi", date: "2026-12-01", note: "", done: false, repeat: "hijri" }]),
  prayerFiqh: "jafari",
  themeMode: "dark",
  translationDefaultLang: "urdu",
  tafsirDefaultAuthor: "Ibn Kathir",
  reciter: JSON.stringify({ name: "Some Reciter", unknown: 1 }),
  "quran:fiqh-prefs:v1": JSON.stringify({ marjaId: "m1", lang: "both", updatedAt: 1, extra: 1 }),
  "quran:accessibility:v1": JSON.stringify({ reducedMotion: true, highContrast: false, largeTouchTargets: true, arabicFontScale: 1.2, other: 1 }),
  "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 1.25, repeatOne: false, autoAdvance: true }),
  "quran:player-prefs:v1": JSON.stringify({ followAyah: true }),
  "quran:reader-prefs:v1": JSON.stringify({ translation: "off", transliteration: true }),
  "quran:verse-layout:v1": JSON.stringify({ order: "tr" }),
  "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }),
  "quran:prayer-calc:v1": JSON.stringify({ sunniMethod: 2, jafariMethod: 7, asr: "hanafi" }),
  "quran:calendar-prefs:v1": JSON.stringify({ first: "mon" }),
  prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: ["fajr", "maghrib"], reminderOffset: 10 }),
  // never
  "quran:downloads:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:download-prefs:v1": JSON.stringify({ wifiOnly: true, marker: NEVER_MARK }),
  "quran:audio-resume:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:audio-queue:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:location:v1": JSON.stringify({ lat: 31.5, lon: 74.3, marker: NEVER_MARK }),
  last_location: JSON.stringify({ lat: 31.5, lon: 74.3, marker: NEVER_MARK }),
  "ayah-of-day": JSON.stringify({ marker: NEVER_MARK }),
  "quran:nav-open:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:tasbeeh-prefs:v1": JSON.stringify({ vibrate: true, marker: NEVER_MARK }),
  preferredVerseDisplay: NEVER_MARK,
  "quran:search-history:v1": JSON.stringify([NEVER_MARK]),
  "quran:hifz-session:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:hifz-timing:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:hifz:v1": JSON.stringify({ marker: NEVER_MARK }),
  "quran:favorites:surah:v1": JSON.stringify([NEVER_MARK]),
};

export interface MapStore extends Store {
  map: Map<string, string>;
}
export function mapStore(initial: Record<string, string> = {}): MapStore {
  const map = new Map(Object.entries(initial));
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}
