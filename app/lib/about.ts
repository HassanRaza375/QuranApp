// The About page's facts (Phase 15), in one place so a test can check them against the code: every service the app talks to is named here, and every name
// here is a service the app talks to. The page text around them is ours (docs/CONTENT_TO_VERIFY.md, About). Pure.
export interface DataSource {
  id: string;
  name: string;
  /** the host the app asks, exactly as in the code (tests/about.test.ts compares it) */
  host: string;
  href: string;
  provides: string;
  /** what is sent, in plain words */
  sends: string;
}

export const DATA_SOURCES: DataSource[] = [
  { id: "quranapi", name: "Quran API", host: "quranapi.pages.dev", href: "https://quranapi.pages.dev/", provides: "The Qur’an text, translations and tafsir, one surah or ayah at a time.", sends: "The surah and ayah numbers you open." },
  { id: "alquran", name: "AlQuran Cloud", host: "api.alquran.cloud", href: "https://alquran.cloud/api", provides: "Page and juz lists, the verses of prostration, ayah search and transliteration.", sends: "The numbers you open, and the words you search for." },
  { id: "aladhan", name: "AlAdhan", host: "api.aladhan.com", href: "https://aladhan.com/prayer-times-api", provides: "Prayer times for your saved place, and the Hijri calendar.", sends: "Your saved place’s coordinates (rounded to about 1 km), your calculation method and a month, for prayer times; only a month and year for the Hijri calendar." },
  { id: "openmeteo", name: "Open-Meteo", host: "geocoding-api.open-meteo.com", href: "https://open-meteo.com/", provides: "Finding a city when you type one, with location data from GeoNames.", sends: "Only the city you type, and only when you press Search." },
  { id: "github", name: "GitHub", host: "raw.githubusercontent.com", href: "https://github.com/", provides: "The full-surah recitation audio files, to stream or to save on this device.", sends: "Nothing but the request for the file." },
];

/** The hosts above, for the test. */
export const SOURCE_HOSTS: string[] = [...DATA_SOURCES.map((s) => s.host), "media.githubusercontent.com"];

export const ABOUT = {
  title: "About",
  lede: "A local-first Qur’an companion: reading, translations, tafsir, audio, prayer times and study tools, kept on your device.",
  metaDescription: "About the Quran App: where its text, audio and prayer times come from, and what stays on your device.",
  what: "There is no account to make. Your place in the Qur’an, bookmarks, notes, reading goals, Hifz progress and settings are saved in this browser, on this device, and are not uploaded anywhere. Pages that need a connection say so, and parts you have opened or saved keep working without one.",
  sources: "The app asks these services for what it does not hold itself. Like any website, a service can see your device’s network address when your device asks it for something.",
  grounding:
    "Each entry in the study pages (people, places, themes, duas, events, signs and commands) points to the ayahs it comes from. Where an entry rests on tradition or on scholars’ interpretation rather than on the Qur’an stating it, the entry says so, in words such as “Traditional identification”, “Scholarly interpretation” or “Disputed interpretation”.",
  limits:
    "This app is not affiliated with any religious institution, and nothing in it is a ruling. Where traditions differ, it shows them side by side. For a religious question, follow your own marja’ or a local scholar.",
} as const;
