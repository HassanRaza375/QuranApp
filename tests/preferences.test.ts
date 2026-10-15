// The preferences must read and write the SAME keys and formats as the legacy app (docs/phases/phase-00-foundation.md).
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULTS, DESCRIPTORS, KEYS, loadPreferences, preferencesForKey, resolveTheme, savePreference, type Preferences,
} from "../app/lib/preferences";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const use = (initial: Record<string, string> = {}) => {
  const s = memoryStore(initial);
  setStorageBackend(s);
  return s;
};

describe("loading values written by the legacy app", () => {
  it("reads every legacy key in its legacy format", () => {
    use({
      prayerFiqh: "jafari",
      themeMode: "dark",
      preferredVerseDisplay: "urdu",
      translationDefaultLang: "bengali",
      tafsirDefaultAuthor: "Ibn Kathir",
      reciter: JSON.stringify({ reciter: "Mishary Rashid Al Afasy" }),
      "quran:accessibility:v1": JSON.stringify({ reducedMotion: true, highContrast: true, largeTouchTargets: true, arabicFontScale: 1.3 }),
      "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 1.25, repeatOne: true, autoAdvance: true }),
      "quran:additional-modules-enabled:v1": "true",
      "quran:hijri-adjust:v1": JSON.stringify({ days: -1 }),
      "quran:prayer-calc:v1": JSON.stringify({ sunniMethod: 1, jafariMethod: 7, asr: "hanafi" }),
      "quran:download-prefs:v1": JSON.stringify({ wifiOnly: true }),
      "quran:verse-layout:v1": JSON.stringify({ order: "tr" }),
      prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: false }, reminderOffset: 15 }),
      "quran:fiqh-prefs:v1": JSON.stringify({ marjaId: "sistani", lang: "ur", updatedAt: 5 }),
    });
    expect(loadPreferences()).toEqual({
      fiqh: "jafari",
      theme: "dark",
      verseDisplay: "urdu",
      translationLang: "bengali",
      tafsirAuthor: "Ibn Kathir",
      reciter: { reciter: "Mishary Rashid Al Afasy" },
      arabicScale: 1.3,
      reducedMotion: true,
      highContrast: true,
      largeTouchTargets: true,
      playbackRate: 1.25,
      autoplay: true,
      literaryModules: true,
      hijriAdjust: -1,
      calc: { sunniMethod: 1, jafariMethod: 7, asr: "hanafi" },
      wifiOnly: true,
      verseLayout: "tr",
      notifications: { enabled: true, prayers: { Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: false }, offset: 15 },
      marjaId: "sistani",
    } satisfies Preferences);
  });

  it("uses the defaults on a first run (nothing stored)", () => {
    use();
    expect(loadPreferences()).toEqual(DEFAULTS);
    expect(DEFAULTS.theme).toBe("light"); // light by default
    expect(DEFAULTS.fiqh).toBe("sunni");
  });

  it("any fiqh value other than 'jafari' means sunni (the legacy rule); the prototype's 'shia' is not a stored value", () => {
    use({ prayerFiqh: "shia" });
    expect(DESCRIPTORS.fiqh.read()).toBe("sunni");
  });

  it("ignores invalid and out-of-range stored values", () => {
    use({
      themeMode: "purple",
      preferredVerseDisplay: "klingon",
      translationDefaultLang: "french",
      tafsirDefaultAuthor: "Nobody",
      "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 9, reducedMotion: "yes" }),
      "quran:audio-prefs:v1": "not json",
      "quran:hijri-adjust:v1": JSON.stringify({ days: 40 }),
      reciter: "[1,2]",
    });
    const p = loadPreferences();
    expect(p.theme).toBe("light");
    expect(p.verseDisplay).toBe("arabic1");
    expect(p.translationLang).toBeNull();
    expect(p.tafsirAuthor).toBeNull();
    expect(p.arabicScale).toBe(1.6);
    expect(p.reducedMotion).toBe(false);
    expect(p.playbackRate).toBe(1);
    expect(p.hijriAdjust).toBe(2);
    expect(p.reciter).toBeNull();
  });
});

describe("saving keeps the legacy formats", () => {
  it("writes the six raw keys as raw strings, not JSON", () => {
    const s = use();
    savePreference("fiqh", "jafari");
    savePreference("theme", "system");
    savePreference("verseDisplay", "english");
    savePreference("translationLang", "urdu");
    savePreference("tafsirAuthor", "Tazkirul Quran");
    expect(s.data.get("prayerFiqh")).toBe("jafari");
    expect(s.data.get("themeMode")).toBe("system");
    expect(s.data.get("preferredVerseDisplay")).toBe("english");
    expect(s.data.get("translationDefaultLang")).toBe("urdu");
    expect(s.data.get("tafsirDefaultAuthor")).toBe("Tazkirul Quran");
  });

  it("removes tafsirDefaultAuthor when unset, as the legacy Settings page does", () => {
    const s = use({ tafsirDefaultAuthor: "Ibn Kathir" });
    savePreference("tafsirAuthor", null);
    expect(s.data.has("tafsirDefaultAuthor")).toBe(false);
  });

  it("accessibility and audio settings are merged into the shared objects without losing other fields", () => {
    const s = use({
      "quran:accessibility:v1": JSON.stringify({ highContrast: true, futureField: 42 }),
      "quran:audio-prefs:v1": JSON.stringify({ repeatOne: true, playbackRate: 1 }),
    });
    savePreference("arabicScale", 1.4);
    savePreference("reducedMotion", true);
    savePreference("playbackRate", 2);
    savePreference("autoplay", true);
    expect(JSON.parse(s.data.get("quran:accessibility:v1")!)).toEqual({ highContrast: true, futureField: 42, arabicFontScale: 1.4, reducedMotion: true });
    expect(JSON.parse(s.data.get("quran:audio-prefs:v1")!)).toEqual({ repeatOne: true, playbackRate: 2, autoAdvance: true });
  });

  it("stores the Arabic scale clamped to 0.8 to 1.6", () => {
    const s = use();
    savePreference("arabicScale", 5);
    expect(JSON.parse(s.data.get("quran:accessibility:v1")!).arabicFontScale).toBe(1.6);
    savePreference("arabicScale", 0.1);
    expect(JSON.parse(s.data.get("quran:accessibility:v1")!).arabicFontScale).toBe(0.8);
  });

  it("stores the Hijri adjustment under the new versioned key, clamped to -2..+2", () => {
    const s = use();
    savePreference("hijriAdjust", 1);
    expect(s.data.get(KEYS.hijriAdjust)).toBe('{"days":1}');
    savePreference("hijriAdjust", -9);
    expect(s.data.get(KEYS.hijriAdjust)).toBe('{"days":-2}');
  });

  it("round-trips every preference", () => {
    use();
    const next: Preferences = {
      fiqh: "jafari", theme: "dark", arabicScale: 1.2, translationLang: "english", tafsirAuthor: "Maarif Ul Quran",
      reciter: { reciter: "X" }, playbackRate: 1.5, autoplay: true, verseDisplay: "bengali", reducedMotion: true,
      highContrast: true, largeTouchTargets: true, literaryModules: true, hijriAdjust: 2,
      calc: { sunniMethod: 5, jafariMethod: 7, asr: "hanafi" }, wifiOnly: true, verseLayout: "tr",
      notifications: { enabled: true, prayers: { Fajr: false, Dhuhr: true, Asr: true, Maghrib: false, Isha: true }, offset: 30 },
      marjaId: "sistani",
    };
    for (const k of Object.keys(next) as (keyof Preferences)[]) savePreference(k, next[k] as never);
    expect(loadPreferences()).toEqual(next);
  });

  it("survives blocked storage (no throw, defaults)", () => {
    setStorageBackend(memoryStore({}, true));
    expect(() => savePreference("fiqh", "jafari")).not.toThrow();
    expect(loadPreferences()).toEqual(DEFAULTS);
  });
});

describe("extensibility and cross-tab sync", () => {
  it("has exactly one descriptor per preference", () => {
    expect(Object.keys(DESCRIPTORS).sort()).toEqual(Object.keys(DEFAULTS).sort());
  });

  it("maps every storage key to the preferences it feeds, and a full clear to all of them", () => {
    expect(preferencesForKey("prayerFiqh")).toEqual(["fiqh"]);
    expect(preferencesForKey("quran:accessibility:v1")).toEqual(["arabicScale", "reducedMotion", "highContrast", "largeTouchTargets"]);
    expect(preferencesForKey("quran:bookmarks:v1")).toEqual([]);
    expect(preferencesForKey(null)).toHaveLength(Object.keys(DEFAULTS).length);
  });

  it("every key a descriptor uses is listed in KEYS", () => {
    const listed = new Set(Object.values(KEYS));
    for (const key of Object.keys(DEFAULTS)) {
      const covered = Object.values(KEYS).some((k) => preferencesForKey(k).includes(key as keyof Preferences));
      expect(covered, key).toBe(true);
    }
    expect(listed.size).toBe(Object.keys(KEYS).length);
  });
});

describe("theme resolution", () => {
  it("follows the OS only in system mode", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
