// Duas: the 38 legacy entries (data/quranDuas.ts) in the shared shape. The data holds no Arabic for a dua: the page shows the reader's text of the passage,
// and the transliteration is fetched live (components/knowledge/KnowledgeTransliteration.vue). "What it asks for" and "Context" are the data's own words.
import { QURAN_DUAS, type QuranDua } from "@legacy/data/quranDuas";
import { getPersonById } from "@legacy/data/quranPersons";
import { DUA_CATEGORY_FILTERS, filterByDuaCategory, searchDuas, type DuaCategoryFilter } from "@legacy/utils/duasSearch";
import { makeAdapter, passageOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const BASIS: Record<string, string> = {
  quran_explicit: "Direct Qur'anic supplication",
  quran_narrative: "Narrative prayer",
  quran_instruction: "Qur'anic instruction to supplicate",
};
const categoryLabel = (v: string) => DUA_CATEGORY_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function duasEntry(d: QuranDua): KEntry {
  const speaker = d.speakerType === "person" && d.personId ? (getPersonById(d.personId)?.name ?? d.personId) : (d.speakerLabel ?? "");
  const sections: KSection[] = [];
  if (d.context) sections.push({ id: "context", title: "Context", text: d.context });
  if (speaker) sections.push({ id: "speaker", title: "Who made it", text: speaker });
  return {
    module: "duas",
    id: d.id,
    name: d.title,
    arabic: d.arabicTitle,
    alternateNames: [],
    summary: d.askingFor,
    typeValue: d.category,
    typeLabel: categoryLabel(d.category),
    basisLabel: d.sourceBasis === "quran_explicit" ? null : (BASIS[d.sourceBasis] ?? d.sourceBasis),
    explicit: d.sourceBasis === "quran_explicit",
    themes: [],
    mentions: [],
    passages: [passageOf(d.passage)],
    also: (d.parallelPassages ?? []).map(passageOf),
    sections,
    sources: [],
    dua: { partialAyah: d.isPartialAyah, segmentNote: d.segmentNote ?? null },
  };
}

let adapter: KAdapter | null = null;
export function duasAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "duas",
    entries: QURAN_DUAS.map(duasEntry),
    filters: DUA_CATEGORY_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchDuas(filterByDuaCategory(QURAN_DUAS, type as DuaCategoryFilter), q).map((d) => d.id),
  }));
}
