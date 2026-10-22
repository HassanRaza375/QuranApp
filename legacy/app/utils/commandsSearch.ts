// Pure search/filter logic for the Commands & Prohibitions module
// (Phase 9). Mirrors app/utils/signsSearch.ts's pattern. Same standing
// gap as every prior phase: separate from the site-wide `/search` page,
// not unified here either — see MODULE_BLUEPRINT.md's Phase 0 section.
import type { QuranCommand, CommandType } from "~/data/quranCommands";

export type CommandTypeFilter = CommandType | "all";

export const COMMAND_TYPE_FILTERS: { value: CommandTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "command", label: "Command" },
  { value: "prohibition", label: "Prohibition" },
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

const allPassages = (command: QuranCommand) => [command.passage, ...(command.parallelPassages ?? [])];

const referenceMatchesExact = (command: QuranCommand, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  allPassages(command).some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

/** Full-text search across title/arabicTitle/description/type, plus the
 * exact "surah:ayah" shortcut. Does not search Arabic ayah text or
 * translation directly — this dataset stores neither (identical
 * architecture to Signs/Events/Duas/Themes); those are fetched live for
 * display only, not indexed here. */
export const searchCommands = (commands: QuranCommand[], query: string): QuranCommand[] => {
  const trimmed = query.trim();
  if (!trimmed) return commands;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = commands.filter((c) => referenceMatchesExact(c, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return commands.filter((c) => {
    const haystacks = [c.title, c.arabicTitle, c.description, c.type].map(normalize);
    return haystacks.some((h) => h.includes(q));
  });
};

export const filterByCommandType = (commands: QuranCommand[], type: CommandTypeFilter): QuranCommand[] => {
  if (type === "all") return commands;
  return commands.filter((c) => c.type === type);
};

export const filterByCommandPerson = (commands: QuranCommand[], personId: string): QuranCommand[] =>
  commands.filter((c) => c.personIds?.includes(personId));
