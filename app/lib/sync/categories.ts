// Phase 17C: the three sync toggles (Library, Progress, Settings). They belong to the account (the `account.categories` record), so every device follows them;
// each device keeps its copy in `quran:sync-prefs:v1`. Until a person chooses, nothing syncs. Pure over a `Store`.
import type { Adapter, Store } from "./adapters";
import type { Category } from "./namespaces";

export const SYNC_PREFS_KEY = "quran:sync-prefs:v1";
export const CATEGORIES: Category[] = ["library", "progress", "settings"];
export type Choice = Record<Category, boolean>;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function read(s: Store): Record<string, unknown> {
  const raw = s.get(SYNC_PREFS_KEY);
  if (raw === null) return {};
  try {
    const v = JSON.parse(raw);
    return isObj(v) ? v : {};
  } catch {
    return {};
  }
}

/** The choice made on this device (or followed from the account), or null when nobody has chosen yet. */
export function readChoice(s: Store): Choice | null {
  const c = read(s).categories;
  if (!isObj(c)) return null;
  return { library: c.library === true, progress: c.progress === true, settings: c.settings === true };
}

export const enabledCategories = (s: Store): Set<Category> => {
  const c = readChoice(s);
  return new Set(c ? CATEGORIES.filter((k) => c[k]) : []);
};

export function writeChoice(s: Store, choice: Choice | null): void {
  const rest = read(s);
  if (choice === null) delete rest.categories;
  else rest.categories = { library: choice.library, progress: choice.progress, settings: choice.settings };
  if (Object.keys(rest).length) s.set(SYNC_PREFS_KEY, JSON.stringify(rest));
  else s.remove(SYNC_PREFS_KEY);
}

/** The toggles as a synced record (so another device follows them). */
export const categoriesAdapter: Adapter = {
  ns: "account.categories",
  category: "account",
  keys: [SYNC_PREFS_KEY],
  project: (s) => {
    const c = readChoice(s);
    return new Map(c ? [["singleton", { ...c }]] : []);
  },
  apply: (s, ch) => {
    const p = ch.get("singleton");
    if (p === undefined) return [];
    writeChoice(s, p === null ? null : { library: p.library === true, progress: p.progress === true, settings: p.settings === true });
    return [SYNC_PREFS_KEY];
  },
};
