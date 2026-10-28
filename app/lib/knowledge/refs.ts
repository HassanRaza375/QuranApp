// Ayah references for the knowledge pages: reading "7:65" or "7:65-72" typed into the filter box, finding the entries that cover an ayah, the positions
// for the thread ("where it appears"), and the ayahs of a passage. Pure; every number is checked against the real ayah counts.
import { absolute, AYAH_COUNTS } from "~/lib/quranMeta";
import type { KEntry, KPassage, PassageRange } from "./types";

export interface AyahQuery {
  surah: number;
  from: number;
  to: number;
}

/** "7:65", "7.65", "7 65" or "7:65-72": a surah and an ayah or a range of ayahs. Null for anything else, or for numbers that do not exist. */
export function parseAyahQuery(text: string): AyahQuery | null {
  const m = /^\s*(\d{1,3})\s*[:.\s]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*$/.exec(text);
  if (!m) return null;
  const surah = Number(m[1]);
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  const count = AYAH_COUNTS[surah - 1];
  if (!count || from < 1 || to < from || to > count) return null;
  return { surah, from, to };
}

const overlaps = (r: PassageRange, q: AyahQuery) => r.surah === q.surah && r.from <= q.to && r.to >= q.from;

/** Whether the entry's mentions or passages cover any ayah of the query. */
export function coversAyah(e: Pick<KEntry, "mentions" | "passages" | "also">, q: AyahQuery): boolean {
  return e.mentions.some((r) => overlaps(r, q)) || e.passages.some((r) => overlaps(r, q)) || e.also.some((r) => overlaps(r, q));
}

/** Every ayah the entry points at (mentions, passages, also), once each, as positions in the Qur'an for the thread. */
export function threadPositions(e: Pick<KEntry, "mentions" | "passages" | "also">): number[] {
  const out = new Set<number>();
  for (const r of [...e.mentions, ...e.passages, ...e.also]) for (let a = r.from; a <= r.to; a++) out.add(absolute(r.surah, a));
  return [...out].sort((a, b) => a - b);
}

/** The passages as ayahs in order, once each (for Play all). */
export function playableAyahs(e: Pick<KEntry, "passages">): { surah: number; ayah: number }[] {
  const seen = new Set<string>();
  const out: { surah: number; ayah: number }[] = [];
  for (const p of e.passages) for (let a = p.from; a <= p.to; a++) if (!seen.has(`${p.surah}:${a}`) && seen.add(`${p.surah}:${a}`)) out.push({ surah: p.surah, ayah: a });
  return out;
}

export const passageLabel = (p: PassageRange) => (p.from === p.to ? `${p.surah}:${p.from}` : `${p.surah}:${p.from}-${p.to}`);
export const ayahCount = (p: PassageRange) => p.to - p.from + 1;

/** Surah numbers a set of ranges touches, in order (the "N ayahs in M surahs" line). */
export const surahsOf = (ranges: readonly PassageRange[]): number[] => [...new Set(ranges.map((r) => r.surah))].sort((a, b) => a - b);

export type { KPassage };
