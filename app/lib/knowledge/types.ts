// The one shape every knowledge module is turned into, so seven modules are one list page and one detail page (Phase 12). An adapter per
// module (peoples.ts, ...) maps its legacy dataset onto this; nothing here is written by us: every string comes from the data.
export type KnowledgeModuleId = "peoples" | "places" | "themes" | "duas" | "events" | "signs" | "commands";

export interface PassageRange {
  surah: number;
  from: number;
  to: number;
}
export interface KPassage extends PassageRange {
  id: string;
  title?: string;
  description?: string;
}
export interface KSection {
  id: string;
  title: string;
  text?: string;
  items?: string[];
}
export interface KSource {
  /** "Qur'an", "Traditional account" ... */
  label: string;
  citation: string;
  /** a source that is not the Qur'an is drawn with a dashed border */
  quran: boolean;
}
export interface KEntry {
  module: KnowledgeModuleId;
  id: string;
  name: string;
  arabic: string;
  alternateNames: string[];
  summary: string;
  /** the module's own type, category or classification: the chip value and its label */
  typeValue: string;
  typeLabel: string;
  /** how the data says the entry is grounded, in the legacy's own words; `explicit` is the plain "the Qur'an states it" case, which is not tagged */
  basisLabel: string | null;
  explicit: boolean;
  themes: string[];
  /** single-ayah direct mentions */
  mentions: PassageRange[];
  passages: KPassage[];
  /** the same thing, elsewhere ("Also occurs at") */
  also: KPassage[];
  sections: KSection[];
  notes: string[];
  sources: KSource[];
}

export interface KFilter {
  value: string;
  label: string;
}

/** What a module offers: its entries, its chips, and how it searches (the legacy search util where there is one). */
export interface KAdapter {
  id: KnowledgeModuleId;
  entries: KEntry[];
  filters: KFilter[];
  get(id: string): KEntry | undefined;
  /** Entries matching the type chip and the typed text (names, Arabic, themes, or a reference such as 7:65). */
  search(typeValue: string, query: string): KEntry[];
}
