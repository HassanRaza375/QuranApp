// Peoples & Nations: the 14 legacy entries (data/quranPeoples.ts) in the shared shape. The search and the type chips are the legacy util's.
import { QURAN_COMMUNITIES, type QuranCommunity } from "@legacy/data/quranPeoples";
import { COMMUNITY_TYPE_FILTERS, filterByCommunityType, searchCommunities, type CommunityTypeFilter } from "@legacy/utils/peoplesSearch";
import { IDENTIFICATION_LABELS } from "~/lib/stories";
import { makeAdapter, orderedPassages, rangeOfRef, sourcesOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const typeLabel = (v: string) => COMMUNITY_TYPE_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function peoplesEntry(c: QuranCommunity): KEntry {
  const sections: KSection[] = [];
  if (c.outcome) sections.push({ id: "outcome", title: "Outcome", text: c.outcome });
  if (c.detailedDescription) sections.push({ id: "details", title: "In more detail", text: c.detailedDescription });
  if (c.associatedPlaces?.length) sections.push({ id: "places-named", title: "Places named in the text", items: c.associatedPlaces });
  return {
    module: "peoples",
    id: c.id,
    name: c.name,
    arabic: c.arabicName,
    alternateNames: c.alternateNames ?? [],
    summary: c.shortDescription,
    typeValue: c.communityType,
    typeLabel: typeLabel(c.communityType),
    basisLabel: c.identificationBasis === "quran_explicit" ? null : (IDENTIFICATION_LABELS[c.identificationBasis] ?? c.identificationBasis),
    explicit: c.identificationBasis === "quran_explicit",
    themes: c.themes ?? [],
    mentions: c.directMentions.map(rangeOfRef),
    passages: orderedPassages(c.relatedPassages),
    also: [],
    sections,
    sources: sourcesOf(c.sources),
  };
}

let adapter: KAdapter | null = null;
export function peoplesAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "peoples",
    entries: QURAN_COMMUNITIES.map(peoplesEntry),
    filters: COMMUNITY_TYPE_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchCommunities(filterByCommunityType(QURAN_COMMUNITIES, type as CommunityTypeFilter), q).map((c) => c.id),
  }));
}
