// What every module's adapter shares: turning the legacy reference shapes into ranges, and one search that first reads a typed reference (7:65, 7:65-72)
// and otherwise hands the text to the module's own legacy search util. Pure.
import type { QuranReference, RelatedPassage, SourceReference } from "@legacy/utils/quranReference";
import { SOURCE_LABELS } from "~/lib/stories";
import { coversAyah, parseAyahQuery } from "./refs";
import type { KAdapter, KEntry, KFilter, KPassage, KSource, KnowledgeModuleId, PassageRange } from "./types";

/** A direct mention: one ayah (or a stated range). */
export const rangeOfRef = (r: QuranReference): PassageRange => ({ surah: r.surahNumber, from: r.ayahNumber ?? r.ayahStart ?? 1, to: r.ayahNumber ?? r.ayahEnd ?? r.ayahStart ?? 1 });

export const passageOf = (p: RelatedPassage & { title?: string; description?: string }): KPassage => ({ id: p.id, surah: p.surahNumber, from: p.ayahStart, to: p.ayahEnd, title: p.title, description: p.description });

/** Passages in the data's own story order where it gives one, otherwise as listed. */
export const orderedPassages = (list: readonly RelatedPassage[] | undefined): KPassage[] => [...(list ?? [])].sort((a, b) => (a.storyOrder ?? 0) - (b.storyOrder ?? 0)).map(passageOf);

export const sourcesOf = (list: readonly SourceReference[] | undefined): KSource[] => (list ?? []).map((s) => ({ label: SOURCE_LABELS[s.type] ?? s.type, citation: s.note ? `${s.citation} (${s.note})` : s.citation, quran: s.type === "quran" }));

export function makeAdapter(opts: {
  id: KnowledgeModuleId;
  entries: KEntry[];
  filters: KFilter[];
  /** The module's own legacy search over the entry ids for a type chip and a text; used when the text is not a reference. */
  legacySearch(typeValue: string, query: string): string[];
}): KAdapter {
  const byId = new Map(opts.entries.map((e) => [e.id, e]));
  return {
    id: opts.id,
    entries: opts.entries,
    filters: opts.filters,
    get: (id) => byId.get(id),
    search(typeValue, query) {
      const q = query.trim();
      const byType = typeValue === "all" ? opts.entries : opts.entries.filter((e) => e.typeValue === typeValue);
      if (!q) return byType;
      const ref = parseAyahQuery(q);
      if (ref) return byType.filter((e) => coversAyah(e, ref));
      const ids = new Set(opts.legacySearch(typeValue, q));
      return byType.filter((e) => ids.has(e.id));
    },
  };
}
