// The Calendar's one setting: which number is large in a day cell, the Hijri day or the Gregorian day. One small additive key
// (`quran:calendar-prefs:v1`); the legacy app ignores it. A damaged value reads as the default (Hijri first).
import { getJSON, setJSON } from "../storage";

export const CALENDAR_PREFS_KEY = "quran:calendar-prefs:v1";
export type First = "hijri" | "gregorian";

export function readFirst(): First {
  const v = getJSON<unknown>(CALENDAR_PREFS_KEY, null) as { first?: unknown } | null;
  return v && typeof v === "object" && v.first === "gregorian" ? "gregorian" : "hijri";
}
export function writeFirst(first: First): boolean {
  const cur = getJSON<unknown>(CALENDAR_PREFS_KEY, null);
  return setJSON(CALENDAR_PREFS_KEY, { ...(cur && typeof cur === "object" && !Array.isArray(cur) ? (cur as Record<string, unknown>) : {}), first });
}
