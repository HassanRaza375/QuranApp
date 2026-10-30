// Pure search/filter logic for the Themes module (Phase 5). Mirrors
// app/utils/storiesSearch.ts's pattern (Phase 0's established "one
// dependency-free {module}Search.ts per module" rule). Same standing gap
// as every prior phase: separate from the site-wide `/search` page — not
// unified here either; see MODULE_BLUEPRINT.md's Phase 0 section.
import type { QuranTheme, ThemeCategory } from "~/data/quranThemes";

export type ThemeCategoryFilter = ThemeCategory | "all";

export const THEME_CATEGORY_FILTERS: { value: ThemeCategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "belief", label: "Belief" },
  { value: "worship_spirituality", label: "Worship & Spirituality" },
  { value: "character", label: "Character" },
  { value: "moral_warning", label: "Moral Warnings" },
  { value: "social_civilizational", label: "Social & Civilizational" },
  { value: "trials_human_experience", label: "Trials & Human Experience" },
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

const referenceMatchesExact = (theme: QuranTheme, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  theme.representativePassages.some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

export const searchThemes = (themes: QuranTheme[], query: string): QuranTheme[] => {
  const trimmed = query.trim();
  if (!trimmed) return themes;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = themes.filter((t) => referenceMatchesExact(t, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return themes.filter((t) => {
    const haystacks = [
      t.name,
      t.arabicName,
      ...(t.alternateNames ?? []),
      t.definition,
      t.description,
      t.category,
    ].map(normalize);
    return haystacks.some((h) => h.includes(q));
  });
};

export const filterByThemeCategory = (themes: QuranTheme[], category: ThemeCategoryFilter): QuranTheme[] => {
  if (category === "all") return themes;
  return themes.filter((t) => t.category === category);
};
