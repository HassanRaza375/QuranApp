// Signs & Miracles: the 14 legacy entries (data/quranSigns.ts) in the shared shape. The chips are the legacy classifications that the data uses.
import { QURAN_SIGNS, type QuranSign } from "@legacy/data/quranSigns";
import { SIGN_CLASSIFICATION_FILTERS, filterBySignClassification, searchSigns, type SignClassificationFilter } from "@legacy/utils/signsSearch";
import { makeAdapter, passageOf } from "./adapter";
import type { KAdapter, KEntry } from "./types";

const BASIS: Record<string, string> = {
  quran_explicit: "Qur'an states this directly",
  quran_context: "Established by Qur'anic narrative context",
  traditional: "Traditional identification",
  modern_identification: "Modern/proposed identification",
  disputed: "Disputed interpretation",
};
const classLabel = (v: string) => SIGN_CLASSIFICATION_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function signsEntry(s: QuranSign): KEntry {
  return {
    module: "signs",
    id: s.id,
    name: s.title,
    arabic: s.arabicTitle,
    alternateNames: [],
    summary: s.description,
    typeValue: s.classification,
    typeLabel: classLabel(s.classification),
    basisLabel: s.sourceBasis === "quran_explicit" ? null : (BASIS[s.sourceBasis] ?? s.sourceBasis),
    explicit: s.sourceBasis === "quran_explicit",
    themes: [],
    mentions: [],
    passages: [passageOf(s.passage)],
    also: (s.parallelPassages ?? []).map(passageOf),
    sections: [],
    sources: [],
  };
}

let adapter: KAdapter | null = null;
export function signsAdapter(): KAdapter {
  const used = new Set<string>(QURAN_SIGNS.map((s) => s.classification));
  return (adapter ??= makeAdapter({
    id: "signs",
    entries: QURAN_SIGNS.map(signsEntry),
    // only the classifications some entry has: the legacy list also names two that the data does not use
    filters: SIGN_CLASSIFICATION_FILTERS.filter((f) => f.value === "all" || used.has(f.value)).map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchSigns(filterBySignClassification(QURAN_SIGNS, type as SignClassificationFilter), q).map((s) => s.id),
  }));
}
