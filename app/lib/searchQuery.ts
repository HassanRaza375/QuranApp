// The Search page's state and how it travels in the URL, so a search can be shared and survives a reload. Pure.
// The names are the legacy page's: ?q= text, g= edition group, e= edition, s= surah, j= juz, b=1 bookmarked only. t= is new (the type chip).
import { DEFAULT_EDITION, DEFAULT_GROUP, editionById, isEditionGroup, type EditionGroup } from "./searchEditions";

export type Scope = "all" | "ayahs" | "surahs" | "people" | "stories" | "duas" | "knowledge" | "notes";
export const SCOPE_VALUES: readonly Scope[] = ["all", "ayahs", "surahs", "people", "stories", "duas", "knowledge", "notes"];

export interface SearchState {
  q: string;
  scope: Scope;
  group: EditionGroup;
  edition: string;
  surah: number | null;
  juz: number | null;
  bookmarked: boolean;
}

export const DEFAULT_STATE: SearchState = { q: "", scope: "all", group: DEFAULT_GROUP, edition: DEFAULT_EDITION[DEFAULT_GROUP], surah: null, juz: null, bookmarked: false };

const one = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);
const int = (v: unknown, min: number, max: number): number | null => {
  if (typeof v !== "string" || !/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
};

/** Anything unknown or out of range is ignored. An edition that does not belong to the group falls back to the group's first. */
export function stateFromQuery(query: Record<string, unknown>): SearchState {
  const q = one(query.q);
  const g = one(query.g);
  const e = one(query.e);
  const t = one(query.t);
  const group = isEditionGroup(g) ? g : DEFAULT_GROUP;
  const edition = typeof e === "string" && editionById(e)?.group === group ? e : DEFAULT_EDITION[group];
  return {
    q: typeof q === "string" ? q : "",
    scope: SCOPE_VALUES.includes(t as Scope) ? (t as Scope) : "all",
    group,
    edition,
    surah: int(one(query.s), 1, 114),
    juz: int(one(query.j), 1, 30),
    bookmarked: one(query.b) === "1",
  };
}

/** Only what differs from the defaults is written, so a plain search is just ?q=text. */
export function stateToQuery(s: SearchState): Record<string, string> {
  const out: Record<string, string> = {};
  if (s.q.trim()) out.q = s.q;
  if (s.scope !== "all") out.t = s.scope;
  if (s.edition !== DEFAULT_EDITION[DEFAULT_GROUP]) {
    out.g = s.group;
    out.e = s.edition;
  }
  if (s.surah) out.s = String(s.surah);
  if (s.juz) out.j = String(s.juz);
  if (s.bookmarked) out.b = "1";
  return out;
}

/** How many filters are on (the number on the Filters button): a non-default edition, a surah, a juz, bookmarked only. */
export const activeFilterCount = (s: SearchState): number =>
  (s.edition !== DEFAULT_EDITION[DEFAULT_GROUP] ? 1 : 0) + (s.surah ? 1 : 0) + (s.juz ? 1 : 0) + (s.bookmarked ? 1 : 0);

export const NO_FILTERS: Pick<SearchState, "group" | "edition" | "surah" | "juz" | "bookmarked"> = { group: DEFAULT_GROUP, edition: DEFAULT_EDITION[DEFAULT_GROUP], surah: null, juz: null, bookmarked: false };
