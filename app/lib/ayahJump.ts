// Typing an ayah number ("2:255", "2.255" or "2 255") is a way to open it, not a text search. Pure; the numbers are checked against the
// real surah table, never a typed list.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { surahHref } from "./readerLinks";

export type Jump =
  | { kind: "open"; surah: number; ayah: number; surahName: string; href: string }
  | { kind: "no-surah" }
  | { kind: "no-ayah"; surah: number; surahName: string; ayahs: number };

const REF = /^\s*(\d{1,3})\s*[:.\s]\s*(\d{1,3})\s*$/;

/** null when the text is not shaped like an ayah reference at all. */
export function parseJump(text: string): Jump | null {
  const m = REF.exec(text);
  if (!m) return null;
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  const row = SURAH_ROWS[surah - 1];
  if (!row) return { kind: "no-surah" };
  if (ayah < 1 || ayah > row.ayahs) return { kind: "no-ayah", surah, surahName: row.name, ayahs: row.ayahs };
  return { kind: "open", surah, ayah, surahName: row.name, href: surahHref(surah, ayah) };
}

/** A query that is only digits (a surah number, or a number nobody wrote in an ayah) is never sent to the text search. */
export const isNumericQuery = (text: string): boolean => /^\s*\d+\s*$/.test(text);
