// The two "pick up where you left off" rows, from legacy state. Pure.
//
// Row 1 is reading progress (`quran:reading-progress:v1`). Row 2 is, until Phase 7, the Prophets & People study state
// (`quran:persons-study:v1`: "You were reading: <section>"). Phase 7 switches row 2 to story chapters with a new key.
import { TOTAL_AYAHS_IN_QURAN } from "./quranCounts";

export interface ReadingProgressRecord {
  surahNo: number;
  ayahNo: number;
  surahName?: string;
  totalAyah?: number;
  updatedAt?: number;
}

export interface ReadingRow {
  title: string;
  meta: string;
  href: string;
  surahNo: number;
  ayahNo: number;
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** `counts[n - 1]` is the number of ayahs in surah n. Returns null when the stored record is not usable. */
export function readingRow(raw: unknown, counts: number[]): ReadingRow | null {
  const p = raw as Partial<ReadingProgressRecord> | null;
  if (!p || typeof p !== "object" || !isInt(p.surahNo) || !isInt(p.ayahNo)) return null;
  const total = counts[p.surahNo - 1];
  if (!total || p.ayahNo < 1 || p.ayahNo > total) return null;
  const before = counts.slice(0, p.surahNo - 1).reduce((a, b) => a + b, 0);
  const pct = Math.round(((before + p.ayahNo) / TOTAL_AYAHS_IN_QURAN) * 100);
  const name = typeof p.surahName === "string" && p.surahName ? p.surahName : `Surah ${p.surahNo}`;
  return {
    title: `${name} · ayah ${p.ayahNo} of ${total}`,
    meta: pct < 1 ? "Just started" : `${pct}% of the Qur’an completed`,
    href: `/surah/${p.surahNo}#ayah-${p.ayahNo}`,
    surahNo: p.surahNo,
    ayahNo: p.ayahNo,
  };
}

export interface StudyState {
  personId: string;
  lastSection: string;
  lastSurahNo?: number;
  updatedAt: number;
}

/**
 * The most recently updated study state that is worth resuming: the legacy rule is "not just the overview with no
 * passage" (`pages/persons/[id].vue`).
 */
export function latestStudy(record: unknown): StudyState | null {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  let best: StudyState | null = null;
  for (const [id, v] of Object.entries(record as Record<string, unknown>)) {
    const s = v as Partial<StudyState> | null;
    if (!s || typeof s !== "object" || typeof s.lastSection !== "string" || typeof s.updatedAt !== "number") continue;
    if (s.lastSection === "overview" && !s.lastSurahNo) continue;
    if (!best || s.updatedAt > best.updatedAt) {
      best = { personId: typeof s.personId === "string" ? s.personId : id, lastSection: s.lastSection, lastSurahNo: s.lastSurahNo, updatedAt: s.updatedAt };
    }
  }
  return best;
}

/** Link for the "Continue reading" nav item, or null when there is no usable reading progress (the item is then hidden). */
export function continueReadingHref(raw: unknown): string | null {
  const p = raw as Partial<ReadingProgressRecord> | null;
  if (!p || typeof p !== "object" || !isInt(p.surahNo) || !isInt(p.ayahNo)) return null;
  if (p.surahNo < 1 || p.surahNo > 114 || p.ayahNo < 1) return null;
  return `/surah/${p.surahNo}#ayah-${p.ayahNo}`;
}
