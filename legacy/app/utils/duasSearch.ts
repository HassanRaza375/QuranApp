// Pure search/filter logic for the Duas module (Phase 6). Mirrors
// app/utils/themesSearch.ts's pattern (Phase 0's established "one
// dependency-free {module}Search.ts per module" rule). Same standing gap
// as every prior phase: separate from the site-wide `/search` page — not
// unified here either; see MODULE_BLUEPRINT.md's Phase 0 section.
import type { QuranDua, DuaCategory } from "~/data/quranDuas";

export type DuaCategoryFilter = DuaCategory | "all";

export const DUA_CATEGORY_FILTERS: { value: DuaCategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "forgiveness", label: "Forgiveness" },
  { value: "guidance", label: "Guidance" },
  { value: "protection", label: "Protection" },
  { value: "mercy", label: "Mercy" },
  { value: "family", label: "Family" },
  { value: "provision", label: "Provision" },
  { value: "patience", label: "Patience" },
  { value: "gratitude", label: "Gratitude" },
  { value: "knowledge", label: "Knowledge" },
  { value: "worship", label: "Worship" },
  { value: "repentance", label: "Repentance" },
  { value: "help", label: "Help" },
  { value: "faith", label: "Faith" },
  { value: "hereafter", label: "Hereafter" },
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

const allPassages = (dua: QuranDua) => [dua.passage, ...(dua.parallelPassages ?? [])];

const referenceMatchesExact = (dua: QuranDua, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  allPassages(dua).some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

/** Full-text search across title/arabicTitle/context/askingFor/
 * speakerLabel, plus the exact "surah:ayah" shortcut. Does not search
 * Arabic dua text or translation directly — this dataset stores neither
 * (see quranDuas.ts's own architecture note); those are fetched live for
 * display only, not indexed here. */
export const searchDuas = (duas: QuranDua[], query: string): QuranDua[] => {
  const trimmed = query.trim();
  if (!trimmed) return duas;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = duas.filter((d) => referenceMatchesExact(d, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return duas.filter((d) => {
    const haystacks = [
      d.title,
      d.arabicTitle,
      d.context,
      d.askingFor,
      d.speakerLabel ?? "",
      d.category,
    ].map(normalize);
    return haystacks.some((h) => h.includes(q));
  });
};

export const filterByDuaCategory = (duas: QuranDua[], category: DuaCategoryFilter): QuranDua[] => {
  if (category === "all") return duas;
  return duas.filter((d) => d.category === category);
};

/** Filters duas to ones spoken by a given Person id — the directory's
 * "speaker" filter, reusing the same pattern as Stories'
 * filterByPersonId. */
export const filterByDuaSpeaker = (duas: QuranDua[], personId: string): QuranDua[] =>
  duas.filter((d) => d.personId === personId);
