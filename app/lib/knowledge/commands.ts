// Commands & Prohibitions: the 18 legacy entries (data/quranCommands.ts) in the shared shape; "Audience" is the data's own statement of who is addressed.
import { QURAN_COMMANDS, type QuranCommand } from "@legacy/data/quranCommands";
import { COMMAND_TYPE_FILTERS, filterByCommandType, searchCommands, type CommandTypeFilter } from "@legacy/utils/commandsSearch";
import { makeAdapter, passageOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const BASIS: Record<string, string> = {
  quran_explicit: "Direct Qur'anic command/prohibition",
  quran_inferred: "Inferred principle",
  derived_ruling: "Derived legal ruling",
  scholarly_interpretation: "Scholarly interpretation",
};
const typeLabel = (v: string) => COMMAND_TYPE_FILTERS.find((f) => f.value === v)?.label ?? v;

export function commandsEntry(c: QuranCommand): KEntry {
  const sections: KSection[] = [];
  if (c.audience) sections.push({ id: "audience", title: "Audience", text: c.audience });
  return {
    module: "commands",
    id: c.id,
    name: c.title,
    arabic: c.arabicTitle,
    alternateNames: [],
    summary: c.description,
    typeValue: c.type,
    typeLabel: typeLabel(c.type),
    basisLabel: c.sourceBasis === "quran_explicit" ? null : (BASIS[c.sourceBasis] ?? c.sourceBasis),
    explicit: c.sourceBasis === "quran_explicit",
    themes: [],
    mentions: [],
    passages: [passageOf(c.passage)],
    also: (c.parallelPassages ?? []).map(passageOf),
    sections,
    sources: [],
  };
}

let adapter: KAdapter | null = null;
export function commandsAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "commands",
    entries: QURAN_COMMANDS.map(commandsEntry),
    filters: COMMAND_TYPE_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchCommands(filterByCommandType(QURAN_COMMANDS, type as CommandTypeFilter), q).map((c) => c.id),
  }));
}
