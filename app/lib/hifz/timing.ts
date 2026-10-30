// The time estimate (Phase 14, owner decision): about 1.5 s a word plus about 10 s an item, a new ayah four times that; after 10 finished sessions the
// estimate uses your own median time per item, which is kept on this device in `quran:hifz-timing:v1` (new, additive; the legacy app ignores it).
// Shown as "about N min": it is the app's estimate, not a promise.
import { getJSON, setJSON } from "../storage";

export const TIMING_KEY = "quran:hifz-timing:v1";
export const SECONDS_PER_WORD = 1.5;
export const SECONDS_PER_ITEM = 10;
export const NEW_AYAH_FACTOR = 4;
export const SESSIONS_BEFORE_OWN_TIME = 10;
const KEEP = 60;

export interface Timing {
  v: 1;
  /** finished daily sessions */
  sessions: number;
  /** seconds per item (reviews, tricky ayahs and joins; not new ayahs), the last 60 */
  secs: number[];
}
export const emptyTiming = (): Timing => ({ v: 1, sessions: 0, secs: [] });

export function parseTiming(raw: unknown): Timing {
  const o = raw as Partial<Timing> | null;
  if (!o || typeof o !== "object") return emptyTiming();
  return {
    v: 1,
    sessions: typeof o.sessions === "number" && o.sessions >= 0 ? Math.floor(o.sessions) : 0,
    secs: Array.isArray(o.secs) ? o.secs.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0).slice(-KEEP) : [],
  };
}
export const readTiming = (): Timing => parseTiming(getJSON<unknown>(TIMING_KEY, null));

export function recordSession(t: Timing, itemSeconds: number[]): Timing {
  return { v: 1, sessions: t.sessions + 1, secs: [...t.secs, ...itemSeconds.filter((n) => n > 0 && n < 600)].slice(-KEEP) };
}
export const writeTiming = (t: Timing): boolean => setJSON(TIMING_KEY, t);

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export interface TimedItem {
  /** words in the ayah (estimated from its length when the text is not at hand) */
  words: number;
  isNew: boolean;
}

/** Seconds for a list of items. */
export function estimateSeconds(items: readonly TimedItem[], t: Timing): number {
  const own = t.sessions >= SESSIONS_BEFORE_OWN_TIME ? median(t.secs) : null;
  return items.reduce((sum, it) => {
    const base = own ?? SECONDS_PER_ITEM + SECONDS_PER_WORD * it.words;
    return sum + (it.isNew ? base * NEW_AYAH_FACTOR : base);
  }, 0);
}

/** "about 9 min" (at least 1). */
export const aboutMinutes = (seconds: number): number => Math.max(1, Math.round(seconds / 60));
