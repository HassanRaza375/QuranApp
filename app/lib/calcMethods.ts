// Calculation methods the Settings page offers, with the real AlAdhan method ids and the service's own names
// (`GET /v1/methods`; tests/fixtures/aladhan-methods.json is a recorded response, and a test compares every id and
// name here with it). Defaults are the legacy app's: ISNA for Sunni, Leva Institute (Qum) for Ja'fari.
//
// Stored in `quran:prayer-calc:v1` as { sunniMethod, jafariMethod, asr }. The legacy app ignores that key and always
// uses method 2 (Sunni) or 0 (Ja'fari) with the standard school.
export type Fiqh = "sunni" | "jafari";
export type AsrSchool = "standard" | "hanafi";

export interface CalcMethod {
  id: number;
  fiqh: Fiqh;
  name: string;
}

export const CALC_METHODS: CalcMethod[] = [
  { id: 2, fiqh: "sunni", name: "Islamic Society of North America (ISNA)" },
  { id: 3, fiqh: "sunni", name: "Muslim World League" },
  { id: 4, fiqh: "sunni", name: "Umm Al-Qura University, Makkah" },
  { id: 1, fiqh: "sunni", name: "University of Islamic Sciences, Karachi" },
  { id: 5, fiqh: "sunni", name: "Egyptian General Authority of Survey" },
  { id: 0, fiqh: "jafari", name: "Shia Ithna-Ashari, Leva Institute, Qum" },
  { id: 7, fiqh: "jafari", name: "Institute of Geophysics, University of Tehran" },
];

export interface PrayerCalc {
  sunniMethod: number;
  jafariMethod: number;
  asr: AsrSchool;
}

export const DEFAULT_CALC: PrayerCalc = { sunniMethod: 2, jafariMethod: 0, asr: "standard" };
export const CALC_KEY = "quran:prayer-calc:v1";

export const methodsFor = (fiqh: Fiqh): CalcMethod[] => CALC_METHODS.filter((m) => m.fiqh === fiqh);
export const methodName = (id: number): string => CALC_METHODS.find((m) => m.id === id)?.name ?? `Method ${id}`;

/** Reads whatever is stored; anything invalid falls back to the default for that field. */
export function normalizeCalc(raw: unknown): PrayerCalc {
  const r = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const ok = (v: unknown, fiqh: Fiqh): v is number => typeof v === "number" && methodsFor(fiqh).some((m) => m.id === v);
  return {
    sunniMethod: ok(r.sunniMethod, "sunni") ? r.sunniMethod : DEFAULT_CALC.sunniMethod,
    jafariMethod: ok(r.jafariMethod, "jafari") ? r.jafariMethod : DEFAULT_CALC.jafariMethod,
    asr: r.asr === "hanafi" ? "hanafi" : "standard",
  };
}

export interface PrayerParams {
  method: number;
  /** 0 standard, 1 Hanafi. Always 0 for Ja'fari (Asr school does not apply). */
  school: number;
  /** 1 (Ja'fari midnight) for Ja'fari, 0 for Sunni. Follows the fiqh, not the method, so the cache key never depends on a hidden setting. */
  midnightMode: number;
}

/** What to ask AlAdhan for, given the fiqh and the user's calculation settings. */
export function paramsFor(fiqh: Fiqh, calc: PrayerCalc): PrayerParams {
  if (fiqh === "jafari") return { method: calc.jafariMethod, school: 0, midnightMode: 1 };
  return { method: calc.sunniMethod, school: calc.asr === "hanafi" ? 1 : 0, midnightMode: 0 };
}
