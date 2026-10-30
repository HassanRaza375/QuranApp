// Pure search/filter logic for the Signs & Miracles module (Phase 8).
// Mirrors app/utils/eventsSearch.ts's pattern. Same standing gap as every
// prior phase: separate from the site-wide `/search` page, not unified
// here either — see MODULE_BLUEPRINT.md's Phase 0 section.
import type { QuranSign, SignClassification } from "~/data/quranSigns";

export type SignClassificationFilter = SignClassification | "all";

export const SIGN_CLASSIFICATION_FILTERS: { value: SignClassificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sign", label: "Sign" },
  { value: "miracle", label: "Miracle" },
  { value: "divine_aid", label: "Divine Aid" },
  { value: "punishment_sign", label: "Punishment Sign" },
  { value: "extraordinary_event", label: "Extraordinary Event" },
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

const allPassages = (sign: QuranSign) => [sign.passage, ...(sign.parallelPassages ?? [])];

const referenceMatchesExact = (sign: QuranSign, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  allPassages(sign).some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

/** Full-text search across title/arabicTitle/description/classification,
 * plus the exact "surah:ayah" shortcut. Does not search Arabic ayah text
 * or translation directly — this dataset stores neither (identical
 * architecture to Events/Duas/Themes/Stories); those are fetched live
 * for display only, not indexed here. */
export const searchSigns = (signs: QuranSign[], query: string): QuranSign[] => {
  const trimmed = query.trim();
  if (!trimmed) return signs;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = signs.filter((s) => referenceMatchesExact(s, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return signs.filter((s) => {
    const haystacks = [s.title, s.arabicTitle, s.description, s.classification].map(normalize);
    return haystacks.some((h) => h.includes(q));
  });
};

export const filterBySignClassification = (signs: QuranSign[], classification: SignClassificationFilter): QuranSign[] => {
  if (classification === "all") return signs;
  return signs.filter((s) => s.classification === classification);
};

export const filterBySignPerson = (signs: QuranSign[], personId: string): QuranSign[] =>
  signs.filter((s) => s.personIds?.includes(personId));

export const filterBySignEvent = (signs: QuranSign[], eventId: string): QuranSign[] =>
  signs.filter((s) => s.eventIds?.includes(eventId));
