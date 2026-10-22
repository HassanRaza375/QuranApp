// Recent searches, in the legacy format so a rollback to the legacy app loses nothing: the key `quran:search-history:v1` holds a JSON array of
// plain strings, newest first, 15 at most, de-duplicated without regard to case (the legacy `useSearchHistory`). The prototype stored objects;
// the legacy parser calls `.toLowerCase()` on every entry, so objects would break it. tests/searchHistory.test.ts runs the legacy code on what is
// written here. Reads accept anything and never throw.
import { getJSON, setJSON } from "./storage";

export const HISTORY_KEY = "quran:search-history:v1";
export const HISTORY_MAX = 15;

export function readHistory(): string[] {
  const raw = getJSON<unknown>(HISTORY_KEY, []);
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) if (typeof x === "string" && x.trim() && !out.some((y) => y.toLowerCase() === x.toLowerCase())) out.push(x);
  return out.slice(0, HISTORY_MAX);
}

/** The list after adding `query` at the front (pure). */
export function withEntry(list: readonly string[], query: string): string[] {
  const t = query.trim();
  if (!t) return [...list];
  return [t, ...list.filter((q) => q.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX);
}

/** Returns false when the browser would not store it. */
export const writeHistory = (list: readonly string[]): boolean => setJSON(HISTORY_KEY, [...list]);

export function addHistory(query: string): string[] {
  const next = withEntry(readHistory(), query);
  writeHistory(next);
  return next;
}

export function removeHistory(query: string): string[] {
  const next = readHistory().filter((q) => q !== query);
  writeHistory(next);
  return next;
}

export function clearHistory(): string[] {
  writeHistory([]);
  return [];
}
