// Islamic events (Phase 8B). An event is a Hijri month and day; its Gregorian date is the day the calendar service reports for that Hijri
// date (never a formula), shifted by the Settings Hijri adjustment for display only. Events are read through ONE adapter over a list of
// sources: the legacy file today, and `app/data/events/reviewed-events.json` (shipped empty). A reviewed file may add events, replace a
// legacy one by id, and carry per-tradition wording; wording requires a source. Adding that file needs no code change. Pure.
import { ISLAMIC_EVENTS } from "@legacy/utils/islamicEvents";
import { daysBetweenKeys } from "./dayKeys";
import { displayedDate, type GregorianMonthRecord } from "./gregorianMonths";

export type Tradition = "shared" | "sunni" | "jafari";
export const TRADITIONS: Tradition[] = ["shared", "sunni", "jafari"];

export interface EventSource {
  type: string;
  citation: string;
}
export interface EventDef {
  id: string;
  month: number;
  day: number;
  name: string;
  tradition: Tradition;
  /** the data's category, e.g. "major", "birth" */
  category: string;
  /** the data's own note (the legacy `dateNote`), shown as it is */
  note?: string;
  /** per-tradition wording from a reviewed file; each needs `source` */
  text?: Partial<Record<Tradition, string>>;
  source?: EventSource;
  origin: "legacy" | "reviewed";
}

/** Our labels for the data's values (flagged for review in CONTENT_TO_VERIFY.md). */
export const TRADITION_TAG: Record<Tradition, string> = { shared: "Both", sunni: "Sunni", jafari: "Ja’fari" };
export const CATEGORY_LABEL: Record<string, string> = { major: "Major", birth: "Birth", martyrdom: "Martyrdom", "shia-occasion": "Occasion", remembrance: "Remembrance" };
export const categoryLabel = (c: string): string => CATEGORY_LABEL[c] ?? c.replace(/-/g, " ");

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The legacy list as events, each with a stable id (`legacy:<month>-<day>-<name>`). */
export function legacyEvents(): EventDef[] {
  return (ISLAMIC_EVENTS as Array<{ month: number; day: number; name: string; category: string; tradition: string; dateNote?: string }>).map((e) => ({
    id: `legacy:${e.month}-${e.day}-${slug(e.name)}`,
    month: e.month,
    day: e.day,
    name: e.name,
    tradition: (TRADITIONS as string[]).includes(e.tradition) ? (e.tradition as Tradition) : "shared",
    category: e.category,
    ...(e.dateNote ? { note: e.dateNote } : {}),
    origin: "legacy" as const,
  }));
}

export interface ReviewedFile {
  version?: unknown;
  events?: unknown;
}
export interface ValidationIssue {
  index: number;
  id: string | null;
  reason: string;
}

/** Checks a reviewed file. Entries that fail are left out (and reported); wording without a source is refused. */
export function validateReviewed(file: unknown): { events: EventDef[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const out: EventDef[] = [];
  const list = (file as ReviewedFile | null)?.events;
  if (!Array.isArray(list)) return { events: [], issues: file === null || file === undefined ? [] : [{ index: -1, id: null, reason: "The file has no events list." }] };
  const seen = new Set<string>();
  list.forEach((raw, index) => {
    const e = raw as Record<string, unknown> | null;
    const id = e && typeof e.id === "string" ? e.id : null;
    const bad = (reason: string) => void issues.push({ index, id, reason });
    if (!e || typeof e !== "object") return bad("Not an object.");
    if (!id || !id.trim()) return bad("An event needs an id.");
    if (seen.has(id)) return bad("The id is used twice in the file.");
    if (typeof e.month !== "number" || !Number.isInteger(e.month) || e.month < 1 || e.month > 12) return bad("The month must be a whole number from 1 to 12.");
    if (typeof e.day !== "number" || !Number.isInteger(e.day) || e.day < 1 || e.day > 30) return bad("The day must be a whole number from 1 to 30.");
    if (typeof e.name !== "string" || !e.name.trim()) return bad("An event needs a name.");
    if (!(TRADITIONS as unknown[]).includes(e.tradition)) return bad("The tradition must be shared, sunni or jafari.");
    if (typeof e.category !== "string" || !e.category.trim()) return bad("An event needs a category.");
    let text: Partial<Record<Tradition, string>> | undefined;
    if (e.text !== undefined) {
      if (!e.text || typeof e.text !== "object" || Array.isArray(e.text)) return bad("The wording must be an object of shared, sunni and jafari text.");
      text = {};
      for (const [k, v] of Object.entries(e.text as Record<string, unknown>)) {
        if (!(TRADITIONS as string[]).includes(k)) return bad(`Wording for an unknown tradition “${k}”.`);
        if (typeof v !== "string" || !v.trim()) return bad("Wording must be text.");
        text[k as Tradition] = v;
      }
    }
    const src = e.source as { type?: unknown; citation?: unknown } | undefined;
    const hasSource = !!src && typeof src.type === "string" && !!src.type.trim() && typeof src.citation === "string" && !!src.citation.trim();
    if (text && Object.keys(text).length && !hasSource) return bad("Wording needs a source (a type and a citation).");
    seen.add(id);
    out.push({ id, month: e.month, day: e.day, name: e.name, tradition: e.tradition as Tradition, category: e.category, ...(typeof e.note === "string" && e.note.trim() ? { note: e.note } : {}), ...(text && Object.keys(text).length ? { text } : {}), ...(hasSource ? { source: { type: src!.type as string, citation: src!.citation as string } } : {}), origin: "reviewed" });
  });
  return { events: out, issues };
}

/** Every source merged: the legacy events, then the reviewed ones (the same id replaces a legacy entry; a new id adds a row). */
export function mergeEvents(legacy: EventDef[], reviewed: EventDef[]): EventDef[] {
  const byId = new Map(legacy.map((e) => [e.id, e]));
  for (const r of reviewed) byId.set(r.id, r);
  return [...byId.values()];
}

// ---------------------------------------------------------------- placing events on days

export interface PlacedEvent {
  event: EventDef;
  /** the Gregorian day it is shown on (the adjustment applied) */
  date: string;
  /** "27 Rajab 1448", in the service's own month name */
  hijriLabel: string;
  daysUntil: number;
}

export interface PlaceInput {
  events: EventDef[];
  /** the saved calendar months (any order) */
  months: GregorianMonthRecord[];
  adjust: number;
  today: string;
  /** the last day to show (inclusive) */
  end: string;
}

/** Each event on the day whose Hijri date it names, from the service's own days; shown `adjust` days earlier when the adjustment is +. Sorted by date. */
export function placeEvents({ events, months, adjust, today, end }: PlaceInput): PlacedEvent[] {
  const out: PlacedEvent[] = [];
  const seen = new Set<string>();
  for (const rec of months) {
    for (const d of rec.days) {
      for (const e of events) {
        if (e.month !== d.hMonth || e.day !== d.hDay) continue;
        const key = `${e.id}|${d.date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const date = displayedDate(d.date, adjust);
        if (date < today || date > end) continue;
        out.push({ event: e, date, hijriLabel: `${d.hDay} ${rec.hijriNames[d.hMonth] ?? `month ${d.hMonth}`} ${d.hYear}`, daysUntil: daysBetweenKeys(today, date) });
      }
    }
  }
  const order = new Map(events.map((e, i) => [e.id, i]));
  return out.sort((a, b) => a.date.localeCompare(b.date) || (order.get(a.event.id) ?? 0) - (order.get(b.event.id) ?? 0));
}

// ---------------------------------------------------------------- the filter

export type Show = "following" | "both" | "sunni" | "jafari";
export const SHOW_VALUES: Show[] = ["following", "both", "sunni", "jafari"];

/** The filter control exists only when events carry a tradition tag other than "shared". */
export const hasTraditionTags = (events: EventDef[]): boolean => events.some((e) => e.tradition !== "shared");

/**
 * The view: "following" is the Following fiqh; with no fiqh set the default is Both. `fiqhSet` is whether the user has ever chosen one.
 */
export function defaultShow(fiqhSet: boolean): Show {
  return fiqhSet ? "following" : "both";
}
export const showFromQuery = (v: unknown, fiqhSet: boolean): Show => {
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "string" && (SHOW_VALUES as string[]).includes(raw) ? (raw as Show) : defaultShow(fiqhSet);
};
/** The tradition a view stands for, or null for Both. */
export const traditionOf = (show: Show, fiqh: "sunni" | "jafari"): "sunni" | "jafari" | null => (show === "both" ? null : show === "following" ? fiqh : show);

/** An event shows if it is shared or matches the tradition in view; with no tradition (Both) everything shows. */
export const visible = (e: EventDef, tradition: "sunni" | "jafari" | null): boolean => !tradition || e.tradition === "shared" || e.tradition === tradition;

/** A tradition with this few events of its own gets a plain line instead of an empty-looking list. */
export const FEW_EVENTS = 3;
export const countOwn = (events: EventDef[], t: "sunni" | "jafari"): number => events.filter((e) => e.tradition === t).length;
export const FEW_LINE = "Only a few events are recorded for this tradition so far.";
export const isFew = (events: EventDef[], t: "sunni" | "jafari" | null): boolean => !!t && countOwn(events, t) <= FEW_EVENTS;

/** The wording a reviewed event has for the view: the tradition's own and the shared; in Both, each labelled. Nothing when it has none. */
export function wordingFor(e: EventDef, tradition: "sunni" | "jafari" | null): { label: string | null; text: string }[] {
  if (!e.text) return [];
  const out: { label: string | null; text: string }[] = [];
  if (tradition) {
    if (e.text.shared) out.push({ label: null, text: e.text.shared });
    if (e.text[tradition]) out.push({ label: null, text: e.text[tradition]! });
    return out;
  }
  if (e.text.shared) out.push({ label: null, text: e.text.shared });
  if (e.text.sunni) out.push({ label: "Sunni", text: e.text.sunni });
  if (e.text.jafari) out.push({ label: "Ja’fari", text: e.text.jafari });
  return out;
}

// ---------------------------------------------------------------- grouping and relative days

export interface MonthGroup {
  /** "2026-11" */
  month: string;
  items: PlacedEvent[];
}
export function groupByMonth(placed: PlacedEvent[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const p of placed) {
    const month = p.date.slice(0, 7);
    const g = groups[groups.length - 1];
    if (g && g.month === month) g.items.push(p);
    else groups.push({ month, items: [p] });
  }
  return groups;
}
export const monthHeading = (month: string): string => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
export const relativeDays = (n: number): string => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);
/** "Expected Monday 8 February 2027": every event date reads "Expected" (the data does not say which depend on sighting). */
export function expectedText(date: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).formatToParts(new Date(`${date}T12:00:00Z`));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `Expected ${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`;
}
