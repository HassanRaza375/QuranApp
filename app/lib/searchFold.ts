// Highlighting for Search, and the character-mapped twin of the app's normaliser. Pure.
//
// `normalize` in listingSearch.ts is the one normaliser every search box uses (the Surah listing, the Library, the place search, the
// people and story filters): Latin accents, Arabic vowel marks and tatweel are removed, alef and yeh variants are folded, case is
// ignored, hyphens and apostrophes become spaces, and repeated letters collapse (the data spells "Al-Faatiha"; people type "fatiha").
// It works on the whole string with a few regular expressions, which is fast enough to run over every surah on each keystroke.
//
// `foldWithMap` below does the same work one character at a time and remembers where each folded character came from. That is what
// highlighting needs (the match is found in the folded text and painted on the original, so a bare Arabic root lights up inside the
// marked word, and `yusuf` inside the same name with a macron), but it is several times slower, so it is only used for the few dozen
// short strings on screen. `tests/searchFold.test.ts` proves the two give identical text on every string the app feeds them.
//
// Teh marbuta (U+0629) and heh (U+0647) are NOT merged by `normalize`: it is the one fold that joins two different words, so the Surah
// listing, the Library and the other filters keep telling them apart. Search merges them in two places only (decided 2026-10-22): the
// highlighting here (`teh: true`) and the local groups (`queryVariants` in searchLocal.ts). The upstream's ayah search is unchanged.
// Characters are tested by code point, so this file holds no Arabic text (tests/library.test.ts).
import { normalize } from "./listingSearch";

/** The one normaliser, under the name Search uses. */
export const fold = normalize;

const isCombining = (c: number) => c >= 0x300 && c <= 0x36f;
/** Arabic recitation marks (U+0610 to U+061A, U+064B to U+065F, U+0670, U+06D6 to U+06ED) and tatweel (U+0640). */
export const isArabicMark = (c: number) => (c >= 0x610 && c <= 0x61a) || (c >= 0x64b && c <= 0x65f) || c === 0x670 || (c >= 0x6d6 && c <= 0x6ed) || c === 0x640;
const ALEF = 0x627;
/** alef with madda (U+0622), with hamza above (U+0623) and below (U+0625), and alef wasla (U+0671) all fold to a plain alef */
const isAlefVariant = (c: number) => c === 0x622 || c === 0x623 || c === 0x625 || c === 0x671;
const ALEF_MAQSURA = 0x649;
const YEH = 0x64a;
const TEH_MARBUTA = 0x629;
const HEH = 0x647;

const PUNCTUATION = new Set(["-", "_", "'", "‘", "’", "`", ".", ",", ":", ";", "(", ")"]);
const LETTER = /\p{L}/u;
const SPACE = /\s/;

/** One character through the first steps of the fold (NFD, accents, Arabic marks, alef and yeh variants, lower case); `teh` also folds teh marbuta to heh. */
function foldPiece(ch: string, teh = false): string {
  let out = "";
  for (const part of ch.normalize("NFD")) {
    const c = part.codePointAt(0)!;
    if (isCombining(c) || isArabicMark(c)) continue;
    out += String.fromCodePoint(isAlefVariant(c) ? ALEF : c === ALEF_MAQSURA ? YEH : teh && c === TEH_MARBUTA ? HEH : c);
  }
  return out.toLowerCase();
}

export interface Folded {
  folded: string;
  /** `origin[i]` is the UTF-16 index in the original text of the character that produced `folded[i]` */
  origin: number[];
}

export function foldWithMap(text: string, teh = false): Folded {
  const out: string[] = [];
  const origin: number[] = [];
  let i = 0;
  for (const ch of text) {
    for (const c of foldPiece(ch, teh)) {
      const c2 = PUNCTUATION.has(c) ? " " : c;
      const last = out[out.length - 1];
      if (SPACE.test(c2)) {
        if (last === undefined || last === " ") continue; // leading and repeated spaces
        out.push(" ");
        origin.push(i);
      } else if (LETTER.test(c2) && last === c2) {
        continue; // a repeated letter collapses into the first
      } else {
        out.push(c2);
        origin.push(i);
      }
    }
    i += ch.length;
  }
  if (out[out.length - 1] === " ") {
    out.pop();
    origin.pop();
  }
  return { folded: out.join(""), origin };
}

export interface Segment {
  text: string;
  hit: boolean;
}

/**
 * Splits `text` into plain and matched parts for `query`, matching on the folded forms. The whole query is looked for first; when it is
 * not there and has several words, each word of two or more letters is. Marks and doubled letters that sit inside or right after a match
 * belong to it. `teh: true` also treats teh marbuta and heh as the same letter. Never produces HTML: the caller renders each segment as text, with `<mark>` around the hits.
 */
export function highlight(text: string, query: string, opts: { teh?: boolean } = {}): Segment[] {
  const teh = !!opts.teh;
  const q = teh ? foldWithMap(query, true).folded : fold(query);
  if (!q || !text) return [{ text, hit: false }];
  const { folded, origin } = foldWithMap(text, teh);
  const contributes = new Set(origin);

  const spans: Array<[number, number]> = []; // in folded indices
  const find = (needle: string) => {
    for (let from = folded.indexOf(needle); from >= 0; from = folded.indexOf(needle, from + needle.length)) spans.push([from, from + needle.length]);
  };
  find(q);
  if (!spans.length && q.includes(" ")) for (const w of q.split(" ")) if (w.length >= 2) find(w);
  if (!spans.length) return [{ text, hit: false }];

  // folded spans to original ranges, merged
  const ranges: Array<[number, number]> = [];
  for (const [a, b] of spans.sort((x, y) => x[0] - y[0])) {
    const start = origin[a]!;
    let end = origin[b - 1]!;
    end += String.fromCodePoint(text.codePointAt(end)!).length;
    // vowel marks and doubled letters that follow the match belong to it; punctuation and spaces do not
    const lastFolded = folded[b - 1]!;
    while (end < text.length) {
      const cp = text.codePointAt(end)!;
      const ch = String.fromCodePoint(cp);
      const mark = isCombining(cp) || isArabicMark(cp);
      const doubled = !contributes.has(end) && LETTER.test(ch) && foldPiece(ch, teh) === lastFolded;
      if (!mark && !doubled) break;
      end += ch.length;
    }
    const prev = ranges[ranges.length - 1];
    if (prev && start <= prev[1]) prev[1] = Math.max(prev[1], end);
    else ranges.push([start, end]);
  }

  const out: Segment[] = [];
  let at = 0;
  for (const [s, e] of ranges) {
    if (s > at) out.push({ text: text.slice(at, s), hit: false });
    out.push({ text: text.slice(s, e), hit: true });
    at = e;
  }
  if (at < text.length) out.push({ text: text.slice(at), hit: false });
  return out;
}
