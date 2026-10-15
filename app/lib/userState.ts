// New versus returning user, from the legacy storage keys. Pure: the caller supplies how to read a key.
// Each check is defensive: missing, empty and corrupt values all mean "no history".
export const HISTORY_KEYS = {
  readingProgress: "quran:reading-progress:v1",
  personsStudy: "quran:persons-study:v1",
  bookmarks: "quran:bookmarks:v1",
  readingGoals: "quran:reading-goals:v1",
  hifzV2: "quran:hifz:v2",
  hifzV1: "quran:hifz:v1",
  library: "quran:library:v1",
  downloads: "quran:downloads:v1",
} as const;

export interface UserState {
  returning: boolean;
  /** which kinds of history exist */
  has: { readingProgress: boolean; personsStudy: boolean; bookmarks: boolean; goal: boolean; hifz: boolean; library: boolean; downloads: boolean };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0;

export function hasReadingProgress(v: unknown): boolean {
  return isObj(v) && Number.isInteger(v.surahNo) && (v.surahNo as number) >= 1 && (v.surahNo as number) <= 114;
}
export function hasGoal(v: unknown): boolean {
  return isObj(v) && nonEmptyArray(v.goals);
}
export function hasHifz(v2: unknown, v1: unknown): boolean {
  if (isObj(v2) && nonEmptyArray(v2.targets)) return true;
  // the old v1 store: any non-empty array or object with content counts as data
  return nonEmptyArray(v1) || (isObj(v1) && Object.keys(v1).length > 0);
}

export function detectUserState(read: (key: string) => unknown): UserState {
  const k = HISTORY_KEYS;
  const lib = read(k.library);
  const has = {
    readingProgress: hasReadingProgress(read(k.readingProgress)),
    personsStudy: isObj(read(k.personsStudy)) && Object.keys(read(k.personsStudy) as object).length > 0,
    bookmarks: nonEmptyArray(read(k.bookmarks)),
    goal: hasGoal(read(k.readingGoals)),
    hifz: hasHifz(read(k.hifzV2), read(k.hifzV1)),
    library: isObj(lib) && (nonEmptyArray(lib.collections) || (isObj(lib.itemMeta) && Object.keys(lib.itemMeta).length > 0)),
    downloads: nonEmptyArray(read(k.downloads)),
  };
  return { returning: Object.values(has).some(Boolean), has };
}
