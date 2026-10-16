// Sort and filter for the Surah tab. Pure; every order is stable and total (ties fall back to the surah number).
// No revelation-order sort: the app has no verified source for one (docs/phases/phase-03-surah-listing.md).
import type { SurahRow } from "~/data/quranMeta.generated";
import { normalize } from "./listingSearch";

export type SortKey = "number" | "name" | "most" | "fewest";
export type PlaceFilter = "all" | SurahRow["place"];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "number", label: "Surah number" },
  { value: "name", label: "Name (A to Z)" },
  { value: "most", label: "Verse count (most first)" },
  { value: "fewest", label: "Verse count (fewest first)" },
];

export const PLACE_OPTIONS: { value: PlaceFilter; label: string }[] = [
  { value: "all", label: "Mecca and Madina" },
  { value: "Mecca", label: "Mecca only" },
  { value: "Madina", label: "Madina only" },
];

// The transliterations begin with the definite article joined to the next letter (Al-, An-, Ash-, ...); "Name (A to Z)"
// sorts by the word after it, so Al-Faatiha is found under F. ("Aal-i-Imraan" is a name, not an article.)
const ARTICLE = /^(al|an|ar|as|ash|at|ad|adh|az)-/i;
export const sortName = (name: string) => normalize(name.replace(ARTICLE, ""));

export function sortSurahs(rows: SurahRow[], key: SortKey): SurahRow[] {
  const out = [...rows];
  out.sort((a, b) => {
    let c = 0;
    if (key === "name") c = sortName(a.name).localeCompare(sortName(b.name), "en");
    else if (key === "most") c = b.ayahs - a.ayahs;
    else if (key === "fewest") c = a.ayahs - b.ayahs;
    return c || a.n - b.n;
  });
  return out;
}

export const filterPlace = (rows: SurahRow[], place: PlaceFilter) => (place === "all" ? rows : rows.filter((r) => r.place === place));
