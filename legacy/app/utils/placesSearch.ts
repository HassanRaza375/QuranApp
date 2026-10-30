// Pure search/filter/grouping logic for the Places module (Phase 3).
// Mirrors app/utils/peoplesSearch.ts's pattern (per Phase 0's own
// established rule: "one dependency-free {module}Search.ts per module").
import type { QuranPlace, PlaceType } from "~/data/quranPlaces";

export type PlaceTypeFilter = PlaceType | "all";

export const PLACE_TYPE_FILTERS: { value: PlaceTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "city", label: "Cities" },
  { value: "settlement", label: "Settlements" },
  { value: "region", label: "Regions" },
  { value: "mountain", label: "Mountains" },
  { value: "valley", label: "Valleys" },
  { value: "land_territory", label: "Lands & Territories" },
  { value: "body_of_water", label: "Bodies of Water" },
  { value: "sanctuary_site", label: "Sanctuaries & Sites" },
  { value: "battlefield", label: "Battlefields" },
  { value: "other", label: "Other" },
];

const stripTashkeel = (s: string) => s.replace(/[ً-ٰٟ]/g, "");
const normalize = (s: string) => stripTashkeel(s).toLowerCase().trim();

export const parseExactReference = (query: string): { surahNumber: number; ayahNumber: number } | null => {
  const match = query.trim().match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  if (surahNumber < 1 || surahNumber > 114 || ayahNumber < 1) return null;
  return { surahNumber, ayahNumber };
};

const referenceMatchesExact = (
  place: QuranPlace,
  ref: { surahNumber: number; ayahNumber: number }
): boolean => {
  const inDirectMentions = place.directMentions.some(
    (m) => m.surahNumber === ref.surahNumber && m.ayahNumber === ref.ayahNumber
  );
  if (inDirectMentions) return true;
  return place.relatedPassages.some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );
};

export const searchPlaces = (places: QuranPlace[], query: string): QuranPlace[] => {
  const trimmed = query.trim();
  if (!trimmed) return places;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = places.filter((p) => referenceMatchesExact(p, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return places.filter((p) => {
    const haystacks = [
      p.name,
      p.arabicName,
      ...(p.alternateNames ?? []),
      p.shortDescription,
      p.detailedDescription ?? "",
      ...(p.themes ?? []),
      p.placeType,
    ].map(normalize);

    if (haystacks.some((h) => h.includes(q))) return true;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      const inMentions = p.directMentions.some((m) => m.surahNumber === asNumber);
      const inPassages = p.relatedPassages.some((rp) => rp.surahNumber === asNumber);
      if (inMentions || inPassages) return true;
    }

    return false;
  });
};

export const filterByPlaceType = (places: QuranPlace[], type: PlaceTypeFilter): QuranPlace[] => {
  if (type === "all") return places;
  return places.filter((p) => p.placeType === type);
};

export const groupDirectMentionsBySurah = (place: QuranPlace) => {
  const bySurah = new Map<number, QuranPlace["directMentions"]>();
  for (const ref of place.directMentions) {
    const list = bySurah.get(ref.surahNumber) ?? [];
    list.push(ref);
    bySurah.set(ref.surahNumber, list);
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahNumber, references]) => ({
      surahNumber,
      references: [...references].sort((a, b) => (a.ayahNumber ?? 0) - (b.ayahNumber ?? 0)),
    }));
};

export const groupRelatedPassagesBySurah = (place: QuranPlace) => {
  const bySurah = new Map<number, QuranPlace["relatedPassages"]>();
  for (const passage of place.relatedPassages) {
    const list = bySurah.get(passage.surahNumber) ?? [];
    list.push(passage);
    bySurah.set(passage.surahNumber, list);
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahNumber, references]) => ({
      surahNumber,
      references: [...references].sort((a, b) => a.ayahStart - b.ayahStart),
    }));
};
