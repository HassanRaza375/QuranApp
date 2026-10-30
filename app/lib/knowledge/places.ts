// Places: the 16 legacy entries (data/quranPlaces.ts) in the shared shape. The search and the type chips are the legacy util's.
import { QURAN_PLACES, type QuranPlace } from "@legacy/data/quranPlaces";
import { PLACE_TYPE_FILTERS, filterByPlaceType, searchPlaces, type PlaceTypeFilter } from "@legacy/utils/placesSearch";
import { IDENTIFICATION_LABELS } from "~/lib/stories";
import { makeAdapter, orderedPassages, rangeOfRef, sourcesOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const typeLabel = (v: string) => PLACE_TYPE_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function placesEntry(p: QuranPlace): KEntry {
  const sections: KSection[] = [];
  if (p.detailedDescription) sections.push({ id: "details", title: "In more detail", text: p.detailedDescription });
  return {
    module: "places",
    id: p.id,
    name: p.name,
    arabic: p.arabicName,
    alternateNames: p.alternateNames ?? [],
    summary: p.shortDescription,
    typeValue: p.placeType,
    typeLabel: typeLabel(p.placeType),
    basisLabel: p.identificationBasis === "quran_explicit" ? null : (IDENTIFICATION_LABELS[p.identificationBasis] ?? p.identificationBasis),
    explicit: p.identificationBasis === "quran_explicit",
    themes: p.themes ?? [],
    mentions: p.directMentions.map(rangeOfRef),
    passages: orderedPassages(p.relatedPassages),
    also: [],
    sections,
    sources: sourcesOf(p.sources),
  };
}

let adapter: KAdapter | null = null;
export function placesAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "places",
    entries: QURAN_PLACES.map(placesEntry),
    filters: PLACE_TYPE_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchPlaces(filterByPlaceType(QURAN_PLACES, type as PlaceTypeFilter), q).map((p) => p.id),
  }));
}
