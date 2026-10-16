// The new Completed marker: `quran:read-surahs:v1` = { v: 1, surahs: { "<n>": { completedAt: <ms> } } }. Additive: the
// legacy app ignores it, and Export includes it with the other keys. A damaged value is read as empty. Pure.
import { isSurahNumber } from "./chapter";
import { getJSON, setJSON } from "./storage";

export const READ_SURAHS_KEY = "quran:read-surahs:v1";

type Record_ = Record<string, unknown> & { v?: unknown; surahs?: unknown };

const readRecord = (): Record_ => {
  const v = getJSON<unknown>(READ_SURAHS_KEY, null);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record_) : {};
};

/** surah number -> completedAt. Entries that are not a real surah with a number time are dropped. */
export function readCompleted(): Map<number, number> {
  const out = new Map<number, number>();
  const s = readRecord().surahs;
  if (!s || typeof s !== "object" || Array.isArray(s)) return out;
  for (const [k, e] of Object.entries(s as Record<string, unknown>)) {
    const n = Number(k);
    const at = (e as { completedAt?: unknown } | null)?.completedAt;
    if (isSurahNumber(n) && typeof at === "number" && Number.isFinite(at)) out.set(n, at);
  }
  return out;
}

const write = (surahs: Map<number, number>, base: Record_) => {
  const obj: Record<string, { completedAt: number }> = {};
  for (const [n, at] of [...surahs].sort((a, b) => a[0] - b[0])) obj[String(n)] = { completedAt: at };
  return setJSON(READ_SURAHS_KEY, { ...base, v: 1, surahs: obj });
};

export function markRead(n: number, at = Date.now()): boolean {
  if (!isSurahNumber(n)) return false;
  const m = readCompleted();
  m.set(n, m.get(n) ?? at); // the first completion time is kept
  return write(m, readRecord());
}

export function markUnread(n: number): boolean {
  const m = readCompleted();
  m.delete(n);
  return write(m, readRecord());
}
