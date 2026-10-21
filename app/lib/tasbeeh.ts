// Tasbeeh (Phase 9B). The record is `quran:tasbeeh:v1` in exactly the legacy shape: { [id]: { count, target, cycles, lifetime } }. Every
// operation does what the legacy composable does (tests/tasbeeh.test.ts runs the legacy code and this code on the same data and compares the
// stored result), and keeps everything it does not know: other counters, unknown fields in an entry, unknown fields at the top. Pure; the
// storage wrapper is the same `lib/storage` every other module uses.
import { TASBEEH_PRESETS, type TasbeehPreset } from "~/data/tasbeehPresets.generated";
import { getJSON, setJSON } from "./storage";

export const TASBEEH_KEY = "quran:tasbeeh:v1";
export const PREFS_KEY = "quran:tasbeeh-prefs:v1";
export const DEFAULT_TARGET = 33;
/** The legacy goals. (A custom number is not offered; the stored `target` can hold any whole number.) */
export const GOALS = [33, 99, 100] as const;

export interface TasbeehEntry {
  count: number;
  target: number;
  cycles: number;
  lifetime: number;
}

export const emptyEntry = (): TasbeehEntry => ({ count: 0, target: DEFAULT_TARGET, cycles: 0, lifetime: 0 });

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const whole = (v: unknown, fallback: number, min: number): number => (typeof v === "number" && Number.isFinite(v) && v >= min ? Math.floor(v) : fallback);

const readRecord = (): Record<string, unknown> => {
  const v = getJSON<unknown>(TASBEEH_KEY, {});
  return isObject(v) ? v : {};
};

/** One counter as it is stored, repaired for display: a missing or damaged field falls back to the legacy default. Reads, never writes. */
export function readEntry(id: string): TasbeehEntry {
  const e = readRecord()[id];
  if (!isObject(e)) return emptyEntry();
  return { count: whole(e.count, 0, 0), target: whole(e.target, DEFAULT_TARGET, 1), cycles: whole(e.cycles, 0, 0), lifetime: whole(e.lifetime, 0, 0) };
}

/** Writes one counter back, keeping every other counter and every field of this entry that is not one of the four. */
function writeEntry(id: string, next: TasbeehEntry): void {
  const record = readRecord();
  const old = isObject(record[id]) ? (record[id] as Record<string, unknown>) : {};
  setJSON(TASBEEH_KEY, { ...record, [id]: { ...old, count: next.count, target: next.target, cycles: next.cycles, lifetime: next.lifetime } });
}

export interface TapResult {
  entry: TasbeehEntry;
  /** this tap reached the goal: a cycle was added and the count went back to 0 */
  cycled: boolean;
}

/** One count: count and lifetime go up; reaching the goal adds a cycle and starts again from 0 (as the legacy counter does). */
export function tap(id: string): TapResult {
  const e = readEntry(id);
  const count = e.count + 1;
  const lifetime = e.lifetime + 1;
  const cycled = count >= e.target;
  const entry: TasbeehEntry = cycled ? { ...e, count: 0, cycles: e.cycles + 1, lifetime } : { ...e, count, lifetime };
  writeEntry(id, entry);
  return { entry, cycled };
}

/** Back to 0. Cycles and lifetime stay (the legacy dialog says so). Returns the entry as it was, for Undo. */
export function resetCount(id: string): { before: TasbeehEntry; entry: TasbeehEntry } {
  const before = readEntry(id);
  const entry = { ...before, count: 0 };
  writeEntry(id, entry);
  return { before, entry };
}

/** A new goal. As in the legacy counter, the count goes back to 0. Returns the entry as it was, for Undo. */
export function setTarget(id: string, target: number): { before: TasbeehEntry; entry: TasbeehEntry } {
  const before = readEntry(id);
  const entry = { ...before, target: whole(target, DEFAULT_TARGET, 1), count: 0 };
  writeEntry(id, entry);
  return { before, entry };
}

/** Puts an earlier state of one counter back (Undo). */
export const restoreEntry = (id: string, entry: TasbeehEntry): void => writeEntry(id, entry);

// ---- the counters on offer

export const presetOf = (id: string): TasbeehPreset | undefined => TASBEEH_PRESETS.find((p) => p.id === id);

/** `name-12` is the counter of the 12th name of Asma-ul-Husna ("Count this name"); anything else is null. */
export function parseNameCounterId(id: string, total = 99): number | null {
  const m = /^name-(\d+)$/.exec(id);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= total ? n : null;
}
export const nameCounterId = (n: number): string => `name-${n}`;

/** The progress ring's fill, 0 to 1. */
export const fraction = (e: TasbeehEntry): number => (e.target > 0 ? Math.min(1, e.count / e.target) : 0);

// ---- vibration: on by default where the browser can, with a switch next to the counter; never when Reduce motion is on

export interface TasbeehPrefs {
  vibrate?: boolean;
}
export function readPrefs(): TasbeehPrefs {
  const v = getJSON<unknown>(PREFS_KEY, {});
  return isObject(v) && typeof v.vibrate === "boolean" ? { ...v, vibrate: v.vibrate } : isObject(v) ? v : {};
}
export function setVibrate(on: boolean): void {
  const v = getJSON<unknown>(PREFS_KEY, {});
  setJSON(PREFS_KEY, { ...(isObject(v) ? v : {}), vibrate: on });
}
/** The switch's own state: on unless the user turned it off. */
export const vibrateWanted = (p: TasbeehPrefs): boolean => p.vibrate !== false;
/** Whether a count may vibrate now. */
export const vibrationOn = (p: TasbeehPrefs, env: { supported: boolean; reducedMotion: boolean }): boolean => env.supported && !env.reducedMotion && vibrateWanted(p);
export const TAP_PATTERN = 15;
export const CYCLE_PATTERN = [120, 60, 120, 60, 120];

// ---- wording of ours
export const countAnnouncement = (e: TasbeehEntry): string => `${e.count} of ${e.target}`;
export const cycleAnnouncement = (e: TasbeehEntry): string => `Goal of ${e.target} reached. ${e.cycles} ${e.cycles === 1 ? "cycle" : "cycles"} completed.`;
export const RESET_ANNOUNCEMENT = "Count reset to 0.";
export const REDUCED_MOTION_NOTE = "Off while Reduce motion is on in Settings.";
