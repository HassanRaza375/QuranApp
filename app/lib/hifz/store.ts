// Reading and writing the Hifz keys (Phase 14). `quran:hifz:v2` and `quran:hifz-session:v1` are read and written in the LEGACY shape, so a user keeps
// their targets and progress and can roll back to the legacy app; `quran:hifz:v1` (the older plan-only model) is only read, once, to migrate when v2 is
// absent, and never written. A write keeps every top-level field it does not know. A value that cannot be parsed reads as empty and is not written
// over until the user acts.
import { getJSON, getRaw, setJSON } from "../storage";
import { emptyData, migrateFromV1, todayKey, type HifzData } from "./engine";
import type { HifzSession } from "./session";
import { SURAH_ROWS } from "~/data/quranMeta.generated";

export const HIFZ_KEY = "quran:hifz:v2";
export const HIFZ_V1_KEY = "quran:hifz:v1";
export const SESSION_KEY = "quran:hifz-session:v1";

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function normalizeData(raw: unknown): HifzData {
  if (!isObject(raw)) return emptyData();
  return { targets: list(raw.targets), ayahStates: list(raw.ayahStates), transitionStates: list(raw.transitionStates), activity: list(raw.activity) };
}

/** The English meaning of the surah's name ("The Opening"): what the legacy stores as `surahName`. */
export const legacySurahName = (surahNo: number): string => SURAH_ROWS[surahNo - 1]?.en ?? `Surah ${surahNo}`;

export interface Loaded {
  data: HifzData;
  /** the stored value could not be read: shown as empty, and left alone until the user acts */
  damaged: boolean;
}

/** The v2 record as stored: parsed, `null` when absent, `"damaged"` when there is a value that is not an object. */
function readV2(): Record<string, unknown> | null | "damaged" {
  const raw = getRaw(HIFZ_KEY);
  if (raw === null || raw === "") return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (v === null) return null;
    return isObject(v) ? v : "damaged";
  } catch {
    return "damaged";
  }
}

export function loadHifz(): Loaded {
  const stored = readV2();
  if (stored === "damaged") return { data: emptyData(), damaged: true };
  if (stored) return { data: normalizeData(stored), damaged: false };
  const migrated = migrateFromV1(getJSON<unknown>(HIFZ_V1_KEY, null), { today: todayKey(), now: Date.now(), surahName: legacySurahName });
  if (migrated) {
    saveHifz(migrated);
    return { data: migrated, damaged: false };
  }
  return { data: emptyData(), damaged: false };
}

/** Writes the four lists into the stored record, keeping any other field in it. */
export function saveHifz(d: HifzData): boolean {
  const stored = readV2();
  const base = isObject(stored) ? stored : {};
  return setJSON(HIFZ_KEY, { ...base, targets: d.targets, ayahStates: d.ayahStates, transitionStates: d.transitionStates, activity: d.activity });
}

/** Reads the record fresh, applies a change, writes it back (so a second tab's changes are not lost), and returns the result. */
export function mutate(fn: (d: HifzData) => HifzData): HifzData {
  const next = fn(loadHifz().data);
  saveHifz(next);
  return next;
}

export function readSession(): HifzSession | null {
  const v = getJSON<unknown>(SESSION_KEY, null);
  if (!isObject(v) || !Array.isArray(v.items) || typeof v.currentIndex !== "number") return null;
  return v as unknown as HifzSession;
}
export const writeSession = (s: HifzSession | null): boolean => setJSON(SESSION_KEY, s);

/** "About N weeks": how long a surah of `ayahs` ayahs takes at `perDay` new ayahs a day. */
export const weeksFor = (ayahs: number, perDay: number): number => Math.max(1, Math.round(ayahs / Math.max(1, perDay) / 7));
