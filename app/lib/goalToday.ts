// Today's goal tile: an ayah count only. No streak, no pace, no "behind" message (design rule: no guilt reminders).
// Reads the legacy `quran:reading-goals:v1` shape: { goals[], activeGoalId, dailyLog: { "YYYY-MM-DD": string[] } }.
export interface GoalToday {
  count: number;
  target: number;
}

export function goalToday(raw: unknown, localToday: string): GoalToday | null {
  const s = raw as { goals?: unknown; activeGoalId?: unknown; dailyLog?: unknown } | null;
  if (!s || typeof s !== "object" || !Array.isArray(s.goals)) return null;
  const goal = (s.goals as Array<{ id?: unknown; status?: unknown; dailyAyahTarget?: unknown }>).find(
    (g) => g && g.id === s.activeGoalId && g.status === "active",
  );
  const target = goal?.dailyAyahTarget;
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) return null;
  const log = s.dailyLog as Record<string, unknown> | undefined;
  const today = log && typeof log === "object" ? log[localToday] : undefined;
  return { count: Array.isArray(today) ? today.length : 0, target: Math.round(target) };
}
