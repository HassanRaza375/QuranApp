// Today's goal tile: an ayah count, and the amount for today when there is one. No streak, no pace, no "behind" message (design rule: no guilt
// reminders). Reads the legacy `quran:reading-goals:v1` shape: { goals[], activeGoalId, dailyLog: { "YYYY-MM-DD": string[] } }. The amount comes from
// the same function as the Goals page (lib/goals/model.ts `todayFor`), so the two always agree: a finish-by-date goal is worked out from where you
// are and the days left; on or after its date there is no amount (the tile then shows the count alone).
import { todayFor, positionOf, type Goal } from "./goals/model";

export interface GoalToday {
  count: number;
  /** ayahs asked for today, or null when the goal has no amount today (its date has come) */
  target: number | null;
}

export function goalToday(raw: unknown, localToday: string, progress: unknown = null): GoalToday | null {
  const s = raw as { goals?: unknown; activeGoalId?: unknown; dailyLog?: unknown } | null;
  if (!s || typeof s !== "object" || !Array.isArray(s.goals)) return null;
  const goal = (s.goals as Array<Partial<Goal> & { id?: unknown }>).find((g) => g && g.id === s.activeGoalId && g.status === "active");
  const stored = goal?.dailyAyahTarget;
  if (!goal || typeof stored !== "number" || !Number.isFinite(stored) || stored <= 0) return null;
  const log = s.dailyLog as Record<string, unknown> | undefined;
  const today = log && typeof log === "object" ? log[localToday] : undefined;
  const count = Array.isArray(today) ? today.length : 0;
  const ask = todayFor(
    { type: goal.type ?? "custom", targetDate: typeof goal.targetDate === "string" ? goal.targetDate : null, startAbsoluteAyah: typeof goal.startAbsoluteAyah === "number" ? goal.startAbsoluteAyah : 0, dailyAyahTarget: stored } as Goal,
    positionOf(progress),
    localToday,
  );
  return { count, target: ask.kind === "amount" ? ask.ayahs : null };
}
