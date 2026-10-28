// Themes: the 42 legacy entries (data/quranThemes.ts) in the shared shape. The data's definition is the summary; its fuller paragraph is "In more detail".
// The basis words are the legacy theme page's own.
import { QURAN_THEMES, type QuranTheme } from "@legacy/data/quranThemes";
import { THEME_CATEGORY_FILTERS, filterByThemeCategory, searchThemes, type ThemeCategoryFilter } from "@legacy/utils/themesSearch";
import { makeAdapter, orderedPassages, sourcesOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const BASIS: Record<string, string> = {
  quran_explicit_concept: "Qur'an-explicit concept",
  quran_derived_concept: "Qur'an-derived concept",
  scholarly_interpretation: "Scholarly interpretation",
};
const categoryLabel = (v: string) => THEME_CATEGORY_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function themesEntry(t: QuranTheme): KEntry {
  const sections: KSection[] = [];
  if (t.description) sections.push({ id: "details", title: "In more detail", text: t.description });
  return {
    module: "themes",
    id: t.id,
    name: t.name,
    arabic: t.arabicName,
    alternateNames: t.alternateNames ?? [],
    summary: t.definition,
    typeValue: t.category,
    typeLabel: categoryLabel(t.category),
    basisLabel: t.conceptualBasis === "quran_explicit_concept" ? null : (BASIS[t.conceptualBasis] ?? t.conceptualBasis),
    explicit: t.conceptualBasis === "quran_explicit_concept",
    themes: [],
    mentions: [],
    passages: orderedPassages(t.representativePassages),
    also: [],
    sections,
    sources: sourcesOf(t.sources),
  };
}

let adapter: KAdapter | null = null;
export function themesAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "themes",
    entries: QURAN_THEMES.map(themesEntry),
    filters: THEME_CATEGORY_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchThemes(filterByThemeCategory(QURAN_THEMES, type as ThemeCategoryFilter), q).map((t) => t.id),
  }));
}
