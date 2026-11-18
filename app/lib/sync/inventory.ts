// Phase 17E: every localStorage key the app uses, classified. A key is in exactly one of: a sync category, `never` (stays on this device, with the reason), or
// `meta` (sync's own). tests/syncInventory.test.ts scans `app/` for key literals and fails if one is missing here, so a future phase cannot add a key that
// silently syncs, or one that silently does not. The categories must also match the adapters (`SYNCED_KEYS`).
import type { Category } from "./namespaces";

export type Classification = Category | "never" | "meta";

export const INVENTORY: Record<string, { to: Classification; why?: string }> = {
  // Library
  "quran:bookmarks:v1": { to: "library" },
  "quran:bookmarks:added-at:v1": { to: "library" },
  "quran:library:v1": { to: "library" },
  // Progress
  "quran:reading-progress:v1": { to: "progress" },
  "quran:read-surahs:v1": { to: "progress" },
  "quran:pins:v1": { to: "progress" },
  "quran:reading-goals:v1": { to: "progress" },
  "quran:hifz:v2": { to: "progress" },
  "quran:hifz-words:v1": { to: "progress" },
  "quran:tasbeeh:v1": { to: "progress" },
  "quran:story-progress:v1": { to: "progress" },
  "quran:persons-study:v1": { to: "progress" },
  "quran:ramadan:v1": { to: "progress" },
  "quran:reminders:v1": { to: "progress" },
  // Settings
  prayerFiqh: { to: "settings" },
  "quran:fiqh-prefs:v1": { to: "settings" },
  themeMode: { to: "settings" },
  translationDefaultLang: { to: "settings" },
  tafsirDefaultAuthor: { to: "settings" },
  reciter: { to: "settings" },
  "quran:accessibility:v1": { to: "settings" },
  "quran:audio-prefs:v1": { to: "settings" },
  "quran:player-prefs:v1": { to: "settings" },
  "quran:reader-prefs:v1": { to: "settings" },
  "quran:verse-layout:v1": { to: "settings" },
  "quran:hijri-adjust:v1": { to: "settings" },
  "quran:prayer-calc:v1": { to: "settings" },
  "quran:calendar-prefs:v1": { to: "settings" },
  prayerSettings: { to: "settings" }, // `notificationsEnabled` inside it never syncs (notification permission belongs to each browser)
  // Sync's own
  "quran:sync-prefs:v1": { to: "meta", why: "the toggles; synced as the account.categories record" },
  // Never
  "quran:downloads:v1": { to: "never", why: "describes this device's saved files" },
  "quran:download-prefs:v1": { to: "never", why: "Wi-Fi only depends on this device's connection" },
  "quran:audio-resume:v1": { to: "never", why: "the place in the audio on this device" },
  "quran:audio-queue:v1": { to: "never", why: "the queue on this device" },
  "quran:location:v1": { to: "never", why: "coordinates: the most sensitive item in storage" },
  last_location: { to: "never", why: "legacy coordinates, read only" },
  "ayah-of-day": { to: "never", why: "derived from the date" },
  "quran:nav-open:v1": { to: "never", why: "the sidebar state of this screen" },
  "quran:tasbeeh-prefs:v1": { to: "never", why: "vibration depends on the device" },
  preferredVerseDisplay: { to: "never", why: "the revamp only reads it" },
  "quran:search-history:v1": { to: "never", why: "what someone searched for is sensitive and of little use elsewhere" },
  "quran:hifz-session:v1": { to: "never", why: "an unfinished session on this device; merging two would grade items twice" },
  "quran:hifz-timing:v1": { to: "never", why: "this device's own speed" },
  "quran:hifz:v1": { to: "never", why: "the older model, read once to migrate" },
  "quran:favorites:surah:v1": { to: "never", why: "the old favourites key, migrated once and removed" },
};

/** Keys that must never appear in any record, whatever an adapter does. Checked by name in the tests. */
export const NEVER_KEYS = Object.entries(INVENTORY)
  .filter(([, v]) => v.to === "never")
  .map(([k]) => k);
