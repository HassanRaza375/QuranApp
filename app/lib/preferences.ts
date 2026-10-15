// Preferences: every setting is one descriptor that reads and writes the SAME localStorage key and format
// the legacy app uses, so a user keeps their settings at cutover. Pure (no Nuxt, no Vue), unit-tested.
//
// To add a setting later (Phase 2: calculation method, Asr school, Wi-Fi-only downloads, ...): add a field to
// `Preferences`, a default, and a descriptor using a NEW `quran:<feature>:v1` key. Nothing else changes.
import { getJSON, getRaw, mergeJSON, remove, setJSON, setRaw } from "./storage";

export type Fiqh = "sunni" | "jafari";
export type ThemeMode = "light" | "dark" | "system";
export type TranslationLang = "english" | "urdu" | "bengali" | "arabic2";
export type VerseDisplay = "arabic1" | "arabic2" | "english" | "urdu" | "bengali";

export const FIQH_VALUES: Fiqh[] = ["sunni", "jafari"];
export const THEME_VALUES: ThemeMode[] = ["light", "dark", "system"];
export const TRANSLATION_LANGS: TranslationLang[] = ["english", "urdu", "bengali", "arabic2"];
export const VERSE_DISPLAYS: VerseDisplay[] = ["arabic1", "arabic2", "english", "urdu", "bengali"];
export const TAFSIR_AUTHORS = ["Ibn Kathir", "Maarif Ul Quran", "Tazkirul Quran"] as const;
export const ARABIC_SCALE = { min: 0.8, max: 1.6, step: 0.1, default: 1 } as const;
export const HIJRI_ADJUST = { min: -2, max: 2 } as const;

/** Legacy storage keys. The comment on each says whether the value is raw text or JSON. */
export const KEYS = {
  fiqh: "prayerFiqh", // raw string: sunni | jafari
  theme: "themeMode", // raw string: light | dark | system
  verseDisplay: "preferredVerseDisplay", // raw string (legacy "which text the reader shows"); left untouched
  translationLang: "translationDefaultLang", // raw string
  tafsirAuthor: "tafsirDefaultAuthor", // raw string; removed when unset
  reciter: "reciter", // JSON object, resolved by name per surah
  accessibility: "quran:accessibility:v1", // JSON {reducedMotion, highContrast, largeTouchTargets, arabicFontScale}
  audioPrefs: "quran:audio-prefs:v1", // JSON {playbackRate, repeatOne, autoAdvance}
  literaryModules: "quran:additional-modules-enabled:v1", // JSON boolean
  hijriAdjust: "quran:hijri-adjust:v1", // NEW (approved): JSON {days}
} as const;

export interface Preferences {
  fiqh: Fiqh;
  theme: ThemeMode;
  arabicScale: number;
  translationLang: TranslationLang | null;
  tafsirAuthor: (typeof TAFSIR_AUTHORS)[number] | null;
  reciter: Record<string, unknown> | null;
  playbackRate: number;
  autoplay: boolean; // legacy name: autoAdvance
  verseDisplay: VerseDisplay;
  reducedMotion: boolean;
  highContrast: boolean;
  largeTouchTargets: boolean;
  literaryModules: boolean;
  hijriAdjust: number;
}

export const DEFAULTS: Preferences = {
  fiqh: "sunni",
  theme: "light", // the revamp defaults to light (legacy defaulted to "system"); an existing themeMode always wins
  arabicScale: ARABIC_SCALE.default,
  translationLang: null,
  tafsirAuthor: null,
  reciter: null,
  playbackRate: 1,
  autoplay: false,
  verseDisplay: "arabic1",
  reducedMotion: false,
  highContrast: false,
  largeTouchTargets: false,
  literaryModules: false,
  hijriAdjust: 0,
};

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

interface Descriptor<K extends keyof Preferences> {
  read(): Preferences[K];
  write(value: Preferences[K]): void;
}
type Descriptors = { [K in keyof Preferences]: Descriptor<K> };

const accessibility = () => getJSON<Record<string, unknown>>(KEYS.accessibility, {});
const audio = () => getJSON<Record<string, unknown>>(KEYS.audioPrefs, {});

export const DESCRIPTORS: Descriptors = {
  fiqh: {
    // Same rule as the legacy store: anything other than "jafari" means sunni.
    read: () => (getRaw(KEYS.fiqh) === "jafari" ? "jafari" : "sunni"),
    write: (v) => void setRaw(KEYS.fiqh, v === "jafari" ? "jafari" : "sunni"),
  },
  theme: {
    read: () => {
      const v = getRaw(KEYS.theme);
      return isOneOf(THEME_VALUES, v) ? v : DEFAULTS.theme;
    },
    write: (v) => void setRaw(KEYS.theme, v),
  },
  arabicScale: {
    read: () => clamp(num(accessibility().arabicFontScale, ARABIC_SCALE.default), ARABIC_SCALE.min, ARABIC_SCALE.max),
    write: (v) => void mergeJSON(KEYS.accessibility, { arabicFontScale: clamp(v, ARABIC_SCALE.min, ARABIC_SCALE.max) }),
  },
  translationLang: {
    read: () => {
      const v = getRaw(KEYS.translationLang);
      return isOneOf(TRANSLATION_LANGS, v) ? v : null;
    },
    write: (v) => (v ? void setRaw(KEYS.translationLang, v) : remove(KEYS.translationLang)),
  },
  tafsirAuthor: {
    read: () => {
      const v = getRaw(KEYS.tafsirAuthor);
      return isOneOf(TAFSIR_AUTHORS, v) ? v : null;
    },
    write: (v) => (v ? void setRaw(KEYS.tafsirAuthor, v) : remove(KEYS.tafsirAuthor)),
  },
  reciter: {
    read: () => {
      const v = getJSON<unknown>(KEYS.reciter, null);
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    },
    write: (v) => (v ? void setJSON(KEYS.reciter, v) : remove(KEYS.reciter)),
  },
  playbackRate: {
    read: () => clamp(num(audio().playbackRate, 1), 0.5, 3),
    write: (v) => void mergeJSON(KEYS.audioPrefs, { playbackRate: clamp(v, 0.5, 3) }),
  },
  autoplay: {
    read: () => bool(audio().autoAdvance, false),
    write: (v) => void mergeJSON(KEYS.audioPrefs, { autoAdvance: v }),
  },
  verseDisplay: {
    read: () => {
      const v = getRaw(KEYS.verseDisplay);
      return isOneOf(VERSE_DISPLAYS, v) ? v : DEFAULTS.verseDisplay;
    },
    write: (v) => void setRaw(KEYS.verseDisplay, v),
  },
  reducedMotion: {
    read: () => bool(accessibility().reducedMotion, false),
    write: (v) => void mergeJSON(KEYS.accessibility, { reducedMotion: v }),
  },
  highContrast: {
    read: () => bool(accessibility().highContrast, false),
    write: (v) => void mergeJSON(KEYS.accessibility, { highContrast: v }),
  },
  largeTouchTargets: {
    read: () => bool(accessibility().largeTouchTargets, false),
    write: (v) => void mergeJSON(KEYS.accessibility, { largeTouchTargets: v }),
  },
  literaryModules: {
    read: () => bool(getJSON<unknown>(KEYS.literaryModules, false), false),
    write: (v) => void setJSON(KEYS.literaryModules, v),
  },
  hijriAdjust: {
    read: () => clamp(Math.round(num(getJSON<Record<string, unknown>>(KEYS.hijriAdjust, {}).days, 0)), HIJRI_ADJUST.min, HIJRI_ADJUST.max),
    write: (v) => void setJSON(KEYS.hijriAdjust, { days: clamp(Math.round(v), HIJRI_ADJUST.min, HIJRI_ADJUST.max) }),
  },
};

export function loadPreferences(): Preferences {
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const k of Object.keys(DESCRIPTORS) as (keyof Preferences)[]) out[k] = DESCRIPTORS[k].read();
  return out as unknown as Preferences;
}

export function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  DESCRIPTORS[key].write(value);
}

/** Which preference a storage key belongs to (for the cross-tab `storage` event). */
export function preferencesForKey(storageKey: string | null): (keyof Preferences)[] {
  if (storageKey === null) return Object.keys(DESCRIPTORS) as (keyof Preferences)[]; // storage.clear()
  const map: Record<string, (keyof Preferences)[]> = {
    [KEYS.fiqh]: ["fiqh"],
    [KEYS.theme]: ["theme"],
    [KEYS.verseDisplay]: ["verseDisplay"],
    [KEYS.translationLang]: ["translationLang"],
    [KEYS.tafsirAuthor]: ["tafsirAuthor"],
    [KEYS.reciter]: ["reciter"],
    [KEYS.accessibility]: ["arabicScale", "reducedMotion", "highContrast", "largeTouchTargets"],
    [KEYS.audioPrefs]: ["playbackRate", "autoplay"],
    [KEYS.literaryModules]: ["literaryModules"],
    [KEYS.hijriAdjust]: ["hijriAdjust"],
  };
  return map[storageKey] ?? [];
}

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}
