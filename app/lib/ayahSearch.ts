// The ayah text search: reading the upstream's answer, applying the juz and bookmark filters, and a searcher that cancels the request it
// replaces and remembers answers for the session. Pure over a fetch function, so it is tested without a network.
//
// What the legacy page did and this fixes (docs/phases/phase-10-search-plan.md, section 1):
//  - an older, slower response could overwrite a newer one (no cancellation);
//  - the first 60 matches were cut BEFORE the juz and bookmark filters ran, so a filter could hide matches that exist;
//  - "no match" (the upstream answers 404) and a real failure were not told apart, and there was no offline state.
import { isAyah, juzOfAyah } from "./quranMeta";
import { surahHref } from "./readerLinks";

export const MAX_SHOWN = 60;
/** The text search starts at two characters in any script (the legacy page needed three, which blocked two-letter Arabic roots). */
export const MIN_QUERY_CHARS = 2;
/** Answers kept for the session, least recently used out first. A broad query is about 300 KB of text once parsed. */
export const CACHE_SIZE = 24;

export interface AyahHit {
  id: string;
  surah: number;
  ayah: number;
  text: string;
  editionId: string;
  /** the edition's own name as the upstream gives it ("Mohammed Marmaduke William Pickthall") */
  editionName: string;
  href: string;
}

export class SearchShapeError extends Error {
  constructor() {
    super("The search service answered in a shape this app does not understand.");
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Every valid match of the answer. A match with an impossible surah or ayah number, or no text, is dropped; no matches array is an error. */
export function parseSearchResponse(json: unknown): AyahHit[] {
  const matches = isObject(json) && isObject(json.data) ? json.data.matches : undefined;
  if (!Array.isArray(matches)) throw new SearchShapeError();
  const out: AyahHit[] = [];
  for (const m of matches) {
    if (!isObject(m) || !isObject(m.surah) || !isObject(m.edition)) continue;
    const surah = m.surah.number;
    const ayah = m.numberInSurah;
    const id = m.edition.identifier;
    if (typeof surah !== "number" || typeof ayah !== "number" || typeof m.text !== "string" || typeof id !== "string") continue;
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || !isAyah(surah, ayah)) continue;
    const name = typeof m.edition.englishName === "string" && m.edition.englishName ? m.edition.englishName : typeof m.edition.name === "string" && m.edition.name ? m.edition.name : id;
    out.push({ id: `${surah}:${ayah}:${id}`, surah, ayah, text: m.text, editionId: id, editionName: name, href: surahHref(surah, ayah) });
  }
  return out;
}

export interface AyahFilters {
  juz: number | null;
  bookmarkedOnly: boolean;
}

/** Filters the whole answer first, then keeps the first `MAX_SHOWN`; `total` is the number that passed the filters. */
export function selectAyahs(hits: readonly AyahHit[], f: AyahFilters, isSaved: (surah: number, ayah: number) => boolean): { shown: AyahHit[]; total: number } {
  const passed = hits.filter((h) => (f.juz == null || juzOfAyah(h.surah, h.ayah) === f.juz) && (!f.bookmarkedOnly || isSaved(h.surah, h.ayah)));
  return { shown: passed.slice(0, MAX_SHOWN), total: passed.length };
}

export type AyahOutcome =
  | { kind: "ok"; hits: AyahHit[] }
  /** the upstream found nothing (it answers 404 for that) */
  | { kind: "none" }
  /** the service could not be reached: no connection, or the request never got an answer */
  | { kind: "offline" }
  /** the service answered with an error, or with something unreadable */
  | { kind: "failed" };

export interface AyahQuery {
  text: string;
  /** a surah number, or "all" */
  scope: number | "all";
  edition: string;
}

export type Fetcher = (q: AyahQuery, signal: AbortSignal) => Promise<unknown>;

const statusOf = (e: unknown): number | undefined => {
  const x = e as { status?: number; statusCode?: number; response?: { status?: number } } | null;
  return x?.response?.status ?? x?.statusCode ?? x?.status;
};

export interface AyahSearcher {
  /** null when this request was replaced by a newer one (or cancelled) before it finished: ignore it */
  run(q: AyahQuery): Promise<AyahOutcome | null>;
  cancel(): void;
  clear(): void;
  readonly size: number;
}

export function createAyahSearcher(fetcher: Fetcher, online: () => boolean = () => true): AyahSearcher {
  const cache = new Map<string, AyahOutcome>();
  let current: AbortController | null = null;
  const keyOf = (q: AyahQuery) => `${q.text.trim().toLowerCase()}|${q.scope}|${q.edition}`;

  return {
    async run(q) {
      current?.abort();
      const mine = new AbortController();
      current = mine;
      const key = keyOf(q);
      const hit = cache.get(key);
      if (hit) {
        cache.delete(key);
        cache.set(key, hit); // most recently used
        return hit;
      }
      if (!online()) return { kind: "offline" };
      let outcome: AyahOutcome;
      try {
        outcome = { kind: "ok", hits: parseSearchResponse(await fetcher({ ...q, text: q.text.trim() }, mine.signal)) };
        if (outcome.kind === "ok" && !outcome.hits.length) outcome = { kind: "none" };
      } catch (e) {
        if (mine.signal.aborted || current !== mine) return null;
        const status = statusOf(e);
        if (status === 404) outcome = { kind: "none" };
        else if (status === undefined && !(e instanceof SearchShapeError)) outcome = { kind: "offline" };
        else return { kind: "failed" };
      }
      if (mine.signal.aborted || current !== mine) return null;
      cache.set(key, outcome);
      if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
      return outcome;
    },
    cancel() {
      current?.abort();
      current = null;
    },
    clear: () => cache.clear(),
    get size() {
      return cache.size;
    },
  };
}
