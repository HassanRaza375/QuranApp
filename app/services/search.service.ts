import { useQuranApi2 } from "./api";
import type { AyahQuery } from "~/lib/ayahSearch";

// The upstream's text search: /search/<text>/<surah or all>/<edition>. It ignores Arabic marks itself, answers 404 when nothing matches, and
// returns every match in one response (up to about 100 KB compressed for a broad two-letter query), so the page caps what it shows.
export const SearchService = {
  search: ({ text, scope, edition }: AyahQuery, signal?: AbortSignal) => useQuranApi2()(`/search/${encodeURIComponent(text)}/${scope}/${edition}`, { signal }),
};
