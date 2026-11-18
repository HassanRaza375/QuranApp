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

/**
 * Only when accounts are on (the sync flag): the two outside services an account can involve. Both are optional for the person: Google only if they pick "Continue
 * with Google", Cloudinary only if they add a profile photo. The app's own server, which holds the account, is not a data source: it is this app.
 */
export const ACCOUNT_SOURCES: DataSource[] = [
  { id: "cloudinary", name: "Cloudinary", host: "api.cloudinary.com", href: "https://cloudinary.com/", provides: "Your profile photo, only if you add one. It is shown only to you.", sends: "The photo you choose, when you press Use photo." },
  { id: "google", name: "Google sign-in", host: "accounts.google.com", href: "https://accounts.google.com/", provides: "Signing in with your Google account, only if you choose it.", sends: "You leave this app for Google’s own page. The app receives your name and email address, never your Google photo." },
];

/** The hosts above, for the test. */
export const SOURCE_HOSTS: string[] = [...DATA_SOURCES.map((s) => s.host), "media.githubusercontent.com"];

/** Credits for text that carries terms of its own (docs/DECISIONS.md, reader transliteration). Not a service the app asks: the lines arrive through AlQuran Cloud above. */
export interface Credit {
  id: string;
  name: string;
  href: string;
  text: string;
}

export const CREDITS: Credit[] = [
  {
    id: "tanzil-transliteration",
    name: "Tanzil Project",
    href: "https://tanzil.net/trans/",
    text: "The transliteration line in the readers comes from AlQuran Cloud’s English Transliteration edition, which matches the English Transliteration that the Tanzil Project lists. Tanzil’s terms: its translations are for non-commercial purposes only; any other use needs permission from the translator or the publisher. This app is free and not monetised.",
  },
];

export const ABOUT = {
  title: "About",
  lede: "A local-first Qur’an companion: reading, translations, tafsir, audio, prayer times and study tools, kept on your device.",
  metaDescription: "About the Quran App: where its text, audio and prayer times come from, and what stays on your device.",
  what: "There is no account to make. Your place in the Qur’an, bookmarks, notes, reading goals, Hifz progress and settings are saved in this browser, on this device, and are not uploaded anywhere. Pages that need a connection say so, and parts you have opened or saved keep working without one.",
  /** the same section while accounts exist on this server (sync flag on): an account is optional and what it keeps is chosen by you */
  whatWithAccount:
    "Everything stays on this device unless you choose otherwise. An account is optional. If you make one and turn sync on, only the parts you choose (your Library, your progress, your settings) are also kept on this app’s server, so your devices stay in step. Your saved place and notification choices are never synced. You can sign out, remove your synced data, or delete your account in Settings, Account.",
  /** shown only on the hosted app (the `vercelAnalytics` build flag), in the same section */
  analytics:
    "This hosted app counts visits to its pages with Vercel Web Analytics, so the person who runs it can see roughly how much it is used. For each visit Vercel records the page’s address (never anything after a question mark, so never what you search for), where you came from, a country, and your device and browser type. It sets no tracking cookies and cannot tell who you are; a visitor is told apart only by a short-lived code that Vercel discards after 24 hours. It is not used on the admin page, and it is skipped if your browser sends Do Not Track or you are offline. What you read, save, search for or write is never part of it.",
  fresh: "A fresh start: nothing from the older version of this app carries over to this address, so you begin with nothing saved.",
  sources: "The app asks these services for what it does not hold itself. Like any website, a service can see your device’s network address when your device asks it for something.",
  grounding:
    "Each entry in the study pages (people, places, themes, duas, events, signs and commands) points to the ayahs it comes from. Where an entry rests on tradition or on scholars’ interpretation rather than on the Qur’an stating it, the entry says so, in words such as “Traditional identification”, “Scholarly interpretation” or “Disputed interpretation”.",
  limits:
    "This app is not affiliated with any religious institution, and nothing in it is a ruling. Where traditions differ, it shows them side by side. For a religious question, follow your own marja’ or a local scholar.",
} as const;
