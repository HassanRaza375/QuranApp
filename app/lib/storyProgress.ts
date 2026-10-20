// Story progress: `quran:story-progress:v1` = { v: 1, stories: { <storyId>: { chapter, read: [..], updatedAt } } }. New and additive (the
// legacy app never reads it). A chapter counts as read when its end is reached or Next is pressed, never by time. The resume point
// is the chapter last on (`chapter === total` is the end page). No streaks, no day counts. Damaged values read as empty. Pure over the
// storage wrapper.
import { getJSON, setJSON } from "./storage";

export const STORY_PROGRESS_KEY = "quran:story-progress:v1";

export interface StoryProgress {
  /** 0-based chapter last on; equal to the chapter count means the end page */
  chapter: number;
  read: number[];
  updatedAt: number;
}
export type ProgressMap = Record<string, StoryProgress>;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function readAllProgress(): ProgressMap {
  const raw = getJSON<unknown>(STORY_PROGRESS_KEY, null);
  const stories = isObj(raw) && isObj(raw.stories) ? raw.stories : {};
  const out: ProgressMap = {};
  for (const [id, v] of Object.entries(stories)) {
    if (!isObj(v) || typeof v.updatedAt !== "number" || !Number.isFinite(v.updatedAt)) continue;
    const chapter = typeof v.chapter === "number" && Number.isInteger(v.chapter) && v.chapter >= 0 ? v.chapter : 0;
    const read = Array.isArray(v.read) ? [...new Set(v.read.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0))].sort((a, b) => a - b) : [];
    out[id] = { chapter, read, updatedAt: v.updatedAt };
  }
  return out;
}
export const readProgress = (id: string, total?: number): StoryProgress | null => {
  const p = readAllProgress()[id];
  if (!p) return null;
  if (total === undefined) return p;
  return { ...p, chapter: Math.min(p.chapter, total), read: p.read.filter((n) => n < total) };
};

function write(map: ProgressMap): boolean {
  return setJSON(STORY_PROGRESS_KEY, { v: 1, stories: map });
}
const update = (id: string, f: (p: StoryProgress | undefined) => StoryProgress): boolean => {
  const all = readAllProgress();
  all[id] = f(all[id]);
  return write(all);
};

/** You are on this chapter now (the resume point); it is not marked read. */
export const recordChapter = (id: string, chapter: number, now = Date.now()): boolean => update(id, (p) => ({ chapter, read: p?.read ?? [], updatedAt: now }));
/** The chapter's end was reached or Next was pressed. */
export const markRead = (id: string, chapter: number, now = Date.now()): boolean => update(id, (p) => ({ chapter: p?.chapter ?? chapter, read: [...new Set([...(p?.read ?? []), chapter])].sort((a, b) => a - b), updatedAt: now }));
export function clearProgress(id: string): StoryProgress | null {
  const all = readAllProgress();
  const before = all[id] ?? null;
  if (!before) return null;
  write(Object.fromEntries(Object.entries(all).filter(([k]) => k !== id)));
  return before;
}
export const restoreProgress = (id: string, p: StoryProgress): boolean => update(id, () => p);

/** "Not started", "Chapter 3 of 4" or "Finished" for a row. */
export function progressText(p: StoryProgress | null, total: number): string {
  if (!p || (!p.read.length && p.chapter === 0)) return "Not started";
  if (p.chapter >= total || p.read.length >= total) return "Finished";
  return `Chapter ${p.chapter + 1} of ${total}`;
}
/** The chapter a "Continue" goes to: the resume chapter, or the first for a finished or new story. */
export const resumeChapter = (p: StoryProgress | null, total: number): number | "end" => (!p ? 0 : p.chapter >= total ? "end" : p.chapter);

/** The most recently updated progress record (for Home and the Library), ignoring any that point at a story that is not there. */
export function latestProgress(map: ProgressMap, totals: (id: string) => number | undefined): { id: string; progress: StoryProgress; total: number } | null {
  let best: { id: string; progress: StoryProgress; total: number } | null = null;
  for (const [id, p] of Object.entries(map)) {
    const total = totals(id);
    if (!total) continue;
    if (p.chapter === 0 && !p.read.length) continue; // nothing worth resuming
    if (!best || p.updatedAt > best.progress.updatedAt) best = { id, progress: p, total };
  }
  return best;
}

/**
 * The second resume row: whichever is newer, the latest story progress or the latest person study. A tie goes to the story (the newer
 * feature). Either may be absent.
 */
export function newerOf<A extends { updatedAt: number }, B extends { updatedAt: number }>(person: A | null, story: B | null): { kind: "person"; value: A } | { kind: "story"; value: B } | null {
  if (person && story) return story.updatedAt >= person.updatedAt ? { kind: "story", value: story } : { kind: "person", value: person };
  if (story) return { kind: "story", value: story };
  if (person) return { kind: "person", value: person };
  return null;
}
