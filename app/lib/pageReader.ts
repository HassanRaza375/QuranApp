// The per-page reader (Phase 9A): which ayahs are on a page, the header lines, the page number from the URL and the Go-to box.
// A page's ayahs come ONLY from the generated page starts (`PAGE_STARTS`, from the service's /v1/meta): the page runs from its start to just
// before the next page's start. Nothing is derived by a rule such as "20 pages per juz". The text itself is the surah reader's cached text.
import { PAGE_STARTS, SURAH_ROWS } from "~/data/quranMeta.generated";
import { showsBismillah } from "./chapter";
import { AYAH_COUNTS, juzOfAyah, TOTAL_PAGES } from "./quranMeta";

/** A run of consecutive ayahs of one surah that sit on a page. */
export interface PageSegment {
  surah: number;
  from: number;
  to: number;
  /** the surah begins on this page (its first ayah is here), so its name banner shows above it */
  starts: boolean;
  /** the Bismillah line shows above it (the reader's rule: surahs 2 to 114 except 9, only where the surah starts) */
  bismillah: boolean;
}

export const isPageNumber = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= TOTAL_PAGES;

/** The page's ayahs as runs per surah, from the page starts. Null for a page that does not exist. */
export function pageSegments(page: number): PageSegment[] | null {
  if (!isPageNumber(page)) return null;
  const [s0, a0] = PAGE_STARTS[page - 1]!;
  const end = page < TOTAL_PAGES ? PAGE_STARTS[page]! : null; // the next page's start; the last page runs to the end of the Qur'an
  const out: PageSegment[] = [];
  let s = s0;
  let a = a0;
  for (;;) {
    const total = AYAH_COUNTS[s - 1]!;
    let to = total;
    let done = false;
    if (end && end[0] === s) {
      to = end[1] - 1;
      done = true;
    }
    if (to >= a) out.push({ surah: s, from: a, to, starts: a === 1, bismillah: a === 1 && showsBismillah(s) });
    if (done || s >= AYAH_COUNTS.length) break;
    s += 1;
    a = 1;
    if (end && end[0] === s && end[1] === 1) break; // the next page begins exactly at this surah's first ayah
  }
  return out;
}

/** The surahs on the page, in order (a page can hold the end of one surah and the start of the next). */
export const pageSurahNumbers = (page: number): number[] => (pageSegments(page) ?? []).map((g) => g.surah);

/** "Al-Baqara" or "Al-Baqara, Aal-i-Imraan": the data's names, every surah on the page, never one picked. */
export const surahNamesLine = (page: number): string => pageSurahNumbers(page).map((n) => SURAH_ROWS[n - 1]!.name).join(", ");

/** "Juz 2", or "Juz 4 and 5" when a juz begins partway down the page. From the data's juz starts. */
export function juzLine(page: number): string {
  const segs = pageSegments(page);
  if (!segs?.length) return "";
  const first = segs[0]!;
  const last = segs[segs.length - 1]!;
  const a = juzOfAyah(first.surah, first.from)!;
  const b = juzOfAyah(last.surah, last.to)!;
  return a === b ? `Juz ${a}` : `Juz ${a} and ${b}`;
}

/** The first ayah on the page, for the link into the surah reader. */
export const firstAyahOf = (page: number): { surah: number; ayah: number } | null => {
  const g = pageSegments(page)?.[0];
  return g ? { surah: g.surah, ayah: g.from } : null;
};

export interface PageParam {
  page: number;
  /** shown when the address named a page that does not exist; null when the address was fine or had no page */
  notice: string | null;
}

/** Western digits for Arabic-Indic (U+0660 to U+0669) and Persian (U+06F0 to U+06F9) digits, so a page can be typed on an Arabic keyboard. By code point: no Arabic is typed in code. */
export const westernDigits = (s: string): string =>
  Array.from(s, (ch) => {
    const c = ch.codePointAt(0)!;
    if (c >= 0x660 && c <= 0x669) return String(c - 0x660);
    if (c >= 0x6f0 && c <= 0x6f9) return String(c - 0x6f0);
    return ch;
  }).join("");

/** `?page=` from the address: a missing value opens page 1; a value that is not a page opens page 1 with a short notice (as the legacy page opens page 1). */
export function parsePageParam(raw: unknown): PageParam {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === null || v === "") return { page: 1, notice: null };
  const s = westernDigits(String(v).trim());
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (isPageNumber(n)) return { page: n, notice: null };
    return { page: 1, notice: `Page ${n} doesn’t exist. Showing page 1.` };
  }
  return { page: 1, notice: "That page doesn’t exist. Showing page 1." };
}

export const GO_TO_ERROR = `Enter a page from 1 to ${TOTAL_PAGES}.`;
/** The Go-to box: a whole number from 1 to 604 (Arabic-Indic digits accepted), else null. */
export function parseGoTo(text: string): number | null {
  const s = westernDigits(text.trim());
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return isPageNumber(n) ? n : null;
}

export const PAGE_NOTE = "Text flows in the order and page breaks of the standard 604-page Madani mushaf. It is not a line-for-line copy of the printed page.";
export const PAGE_OFFLINE = "This page’s text isn’t saved on this device yet. Connect once to read it.";
export const PAGE_FAILED = "Couldn’t load this page. Check your connection and try again.";
export const PLAY_REASON = "Coming with the player";
