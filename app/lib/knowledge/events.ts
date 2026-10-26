// Events in the Qur'an: the 40 legacy entries (data/quranEvents.ts) in the shared shape. Each has a chronology statement from the data's own
// `chronologyStatus` (in the legacy page's words) and, where the data gives one, who it happened during and which event it follows or precedes.
import { getEventById, QURAN_EVENTS, type QuranEvent } from "@legacy/data/quranEvents";
import { getPersonById } from "@legacy/data/quranPersons";
import { EVENT_CATEGORY_FILTERS, filterByEventCategory, searchEvents, type EventCategoryFilter } from "@legacy/utils/eventsSearch";
import { makeAdapter, passageOf } from "./adapter";
import type { KAdapter, KEntry, KSection } from "./types";

const BASIS: Record<string, string> = {
  quran_explicit: "Qur'an states this directly",
  quran_context: "Established by Qur'anic narrative context",
  traditional: "Traditional identification",
  disputed: "Disputed interpretation",
};
export const CHRONOLOGY_EXPLANATIONS: Record<string, string> = {
  strong: "This event's placement in sequence is well-established.",
  traditional: "This event's placement in sequence relies on traditional (not Qur'an-stated) chronology — the Qur'an does not itself give a date or sequence position.",
  uncertain: "This event's placement in sequence is uncertain — the Qur'an describes the occurrence without establishing when it happened relative to others.",
  unknown: "No chronology is established for this event in the Qur'an or in reliable tradition.",
};
const categoryLabel = (v: string) => EVENT_CATEGORY_FILTERS.find((f) => f.value === v)?.label ?? v.replace(/_/g, " ");

export function eventsEntry(e: QuranEvent): KEntry {
  const rc = e.relativeChronology;
  const relations: string[] = [];
  if (rc?.duringPersonId) relations.push(`During the lifetime of ${getPersonById(rc.duringPersonId)?.name ?? rc.duringPersonId}.`);
  if (rc?.afterEventId) relations.push(`After: ${getEventById(rc.afterEventId)?.title ?? rc.afterEventId}.`);
  if (rc?.beforeEventId) relations.push(`Before: ${getEventById(rc.beforeEventId)?.title ?? rc.beforeEventId}.`);
  const sections: KSection[] = [{ id: "chronology", title: "Chronology", text: CHRONOLOGY_EXPLANATIONS[e.chronologyStatus], items: relations }];
  return {
    module: "events",
    id: e.id,
    name: e.title,
    arabic: e.arabicTitle,
    alternateNames: [],
    summary: e.description,
    typeValue: e.category,
    typeLabel: categoryLabel(e.category),
    basisLabel: e.sourceBasis === "quran_explicit" ? null : (BASIS[e.sourceBasis] ?? e.sourceBasis),
    explicit: e.sourceBasis === "quran_explicit",
    themes: [],
    mentions: [],
    passages: [passageOf(e.passage)],
    also: (e.parallelPassages ?? []).map(passageOf),
    sections,
    sources: [],
  };
}

let adapter: KAdapter | null = null;
export function eventsAdapter(): KAdapter {
  return (adapter ??= makeAdapter({
    id: "events",
    entries: QURAN_EVENTS.map(eventsEntry),
    filters: EVENT_CATEGORY_FILTERS.map((f) => ({ value: f.value, label: f.label })),
    legacySearch: (type, q) => searchEvents(filterByEventCategory(QURAN_EVENTS, type as EventCategoryFilter), q).map((e) => e.id),
  }));
}
