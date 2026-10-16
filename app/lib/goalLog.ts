// The daily reading log the legacy reader writes: `quran:reading-goals:v1` { goals, activeGoalId, dailyLog: { "YYYY-MM-DD":
// ["<surah>:<ayah>", ...] } }. The reader only appends to `dailyLog` (unique per day, local calendar day, never
// `toISOString`) and keeps every other field exactly as it was. There is no goals screen until Phase 15. Pure.
import { localDateKey } from "./dates";
import { getJSON, setJSON } from "./storage";

export const GOALS_KEY = "quran:reading-goals:v1";

/** Adds ayah keys ("2:255") to today's log. Returns how many were new. */
export function recordAyahsRead(keys: string[], now = new Date()): number {
  if (!keys.length) return 0;
  const cur = getJSON<unknown>(GOALS_KEY, null);
  const base = cur && typeof cur === "object" && !Array.isArray(cur) ? (cur as Record<string, unknown>) : {};
  const logRaw = base.dailyLog;
  const dailyLog: Record<string, unknown> = logRaw && typeof logRaw === "object" && !Array.isArray(logRaw) ? { ...(logRaw as Record<string, unknown>) } : {};
  const day = localDateKey(now);
  const list = Array.isArray(dailyLog[day]) ? (dailyLog[day] as unknown[]) : [];
  const have = new Set(list);
  const fresh = keys.filter((k) => !have.has(k));
  if (!fresh.length) return 0;
  dailyLog[day] = [...list, ...new Set(fresh)];
  setJSON(GOALS_KEY, { ...base, goals: Array.isArray(base.goals) ? base.goals : [], activeGoalId: base.activeGoalId ?? null, dailyLog });
  return new Set(fresh).size;
}
