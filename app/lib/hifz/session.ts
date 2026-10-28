// A Hifz session (Phase 14): a queue of one-screen items, in the LEGACY item shape and stored in the legacy key `quran:hifz-session:v1`, so a session
// started here can be resumed in the legacy app and the other way round. Pure: ids, the clock and "today" come from the caller.
//
// What the simple mode leaves out of the legacy queue (owner decision, 2026-10-28): the warm-up item, the mixed final test and Quick Test. A legacy
// session that still has warm-up or final-mixed items resumes with them as ordinary review items.
//
// Two deliberate differences from the legacy runner, both written down in docs/phases/phase-14-hifz.md:
//   * a join graded in "Check the whole surah" is graded (the legacy assessment never graded its join items, because they carry no ayah number);
//   * a "new" ayah graded `again` still counts as introduced (kept for parity: it is started, comes back tomorrow, and is weak after two slips).
import {
  activeTargets,
  dueOrOverdue,
  gradeAyah,
  gradeTransition,
  introduceAyahs,
  newAyahBudgetToday,
  recordActivity,
  updateTarget,
  weakAyahsFor,
  weakTransitionsFor,
  type Grade,
  type HifzData,
} from "./engine";

export type SessionItemType = "warmup" | "weak-ayah" | "weak-transition" | "revision" | "new" | "final-mixed" | "assessment";
export type TestMode = "full" | "continue" | "previous" | "next" | "random" | "transition";
export type SessionKind = "daily" | "weak" | "quick-test" | "free-practice" | "assessment";

export interface SessionItem {
  id: string;
  type: SessionItemType;
  targetId: string;
  ayahNo?: number;
  fromAyah?: number;
  toAyah?: number;
  isNew?: boolean;
  gradedTest: boolean;
  testMode: TestMode;
  result: Grade | "skipped" | null;
  hintLevel: number;
}

export interface HifzSession {
  id: string;
  kind: SessionKind;
  targetIds: string[];
  items: SessionItem[];
  currentIndex: number;
  status: "in-progress" | "completed" | "abandoned";
  startedAt: number;
  completedAt: number | null;
  stats: { mistakes: number; hints: number };
  /** Revamp only (the legacy app keeps unknown fields): "Recite to someone", where nothing is hidden and a listener taps the slips. */
  mode?: "check";
}

export type NewId = () => string;

const make = (newId: NewId, partial: Omit<SessionItem, "id" | "result" | "hintLevel" | "gradedTest"> & { gradedTest?: boolean }): SessionItem => ({
  id: newId(),
  result: null,
  hintLevel: 0,
  gradedTest: partial.gradedTest ?? true,
  ...partial,
});

export interface DailyOptions {
  targetIds?: string[];
  /** false for "Recite to someone": a listener cannot hear a new ayah being learned */
  includeNew?: boolean;
}

/** Today's queue: weak ayahs and joins first, then due revision round-robin across surahs, then new ayahs within each surah's budget. */
export function buildDailyItems(d: HifzData, today: string, newId: NewId, o: DailyOptions = {}): SessionItem[] {
  const targets = activeTargets(d).filter((t) => !o.targetIds || o.targetIds.includes(t.id));
  const items: SessionItem[] = [];
  for (const t of targets) {
    for (const a of weakAyahsFor(d, t.id)) items.push(make(newId, { type: "weak-ayah", targetId: t.id, ayahNo: a.ayahNo, testMode: "full" }));
    for (const tr of weakTransitionsFor(d, t.id)) items.push(make(newId, { type: "weak-transition", targetId: t.id, fromAyah: tr.fromAyah, toAyah: tr.toAyah, testMode: "transition" }));
  }
  const due = dueOrOverdue(d, today);
  const buckets = targets.map((t) => due.filter((a) => a.targetId === t.id));
  let more = true;
  while (more) {
    more = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) {
        more = true;
        items.push(make(newId, { type: "revision", targetId: next.targetId, ayahNo: next.ayahNo, testMode: "full" }));
      }
    }
  }
  if (o.includeNew !== false) {
    for (const t of targets) {
      const budget = newAyahBudgetToday(d, t);
      for (let ayahNo = t.lastPosition + 1; ayahNo < t.lastPosition + 1 + budget && ayahNo <= t.endAyah; ayahNo++) {
        items.push(make(newId, { type: "new", targetId: t.id, ayahNo, isNew: true, testMode: "full" }));
      }
    }
  }
  return items;
}

/** "Check the whole surah": every started ayah in order, and the join to the one before it. */
export function buildAssessmentItems(d: HifzData, targetId: string, newId: NewId): SessionItem[] {
  const target = d.targets.find((t) => t.id === targetId);
  if (!target) return [];
  const items: SessionItem[] = [];
  for (let ayahNo = target.startAyah; ayahNo <= target.lastPosition; ayahNo++) {
    items.push(make(newId, { type: "assessment", targetId, ayahNo, testMode: "full" }));
    if (ayahNo > target.startAyah) items.push(make(newId, { type: "assessment", targetId, fromAyah: ayahNo - 1, toAyah: ayahNo, testMode: "transition" }));
  }
  return items;
}

/** Free practice: any ayahs of any surah, ungraded. It is never stored, so it cannot touch the schedule or the legacy session. */
export function buildFreeItems(targetId: string, startAyah: number, endAyah: number, newId: NewId): SessionItem[] {
  const items: SessionItem[] = [];
  for (let ayahNo = startAyah; ayahNo <= endAyah; ayahNo++) items.push(make(newId, { type: "revision", targetId, ayahNo, testMode: "full", gradedTest: false }));
  return items;
}

export function startSession(kind: SessionKind, items: SessionItem[], targetIds: string[], id: string, now: number, mode?: "check"): HifzSession {
  return { id, kind, targetIds, items, currentIndex: 0, status: "in-progress", startedAt: now, completedAt: null, stats: { mistakes: 0, hints: 0 }, ...(mode ? { mode } : {}) };
}

export const currentItem = (s: HifzSession | null): SessionItem | null => (s && s.status === "in-progress" ? (s.items[s.currentIndex] ?? null) : null);

/** The session is shown as resumable only when it is in progress and has an item left. */
export const isResumable = (s: HifzSession | null): s is HifzSession => !!s && s.status === "in-progress" && s.currentIndex < s.items.length;

/** Moves to the next item, or completes the session after the last one. A finished whole-surah check is recorded (activity, `lastAssessmentAt`) like the legacy. */
export function advance(d: HifzData, s: HifzSession, today: string, now: number): { data: HifzData; session: HifzSession } {
  const nextIndex = s.currentIndex + 1;
  if (nextIndex < s.items.length) return { data: d, session: { ...s, currentIndex: nextIndex } };
  let data = d;
  if (s.kind === "assessment") {
    data = recordActivity(data, { assessments: 1 }, today);
    data = updateTarget(data, s.targetIds[0]!, { lastAssessmentAt: today });
  }
  return { data, session: { ...s, status: "completed", completedAt: now } };
}

/** Skips the current item: marked, not graded. */
export function skipCurrent(d: HifzData, s: HifzSession, today: string, now: number): { data: HifzData; session: HifzSession } {
  const item = currentItem(s);
  if (!item) return { data: d, session: s };
  return advance(d, { ...s, items: s.items.map((i) => (i.id === item.id ? { ...i, result: "skipped" as const } : i)) }, today, now);
}

/** Grades the current item (an ayah or a join) unless it is ungraded, then moves on. */
export function gradeCurrent(d: HifzData, s: HifzSession, grade: Grade, hintLevel: number, today: string, now: number): { data: HifzData; session: HifzSession } {
  const item = currentItem(s);
  if (!item) return { data: d, session: s };
  let data = d;
  if (item.gradedTest) {
    if (item.fromAyah != null) data = gradeTransition(data, item.targetId, item.fromAyah, grade, today);
    else if (item.ayahNo != null) data = gradeAyah(data, item.targetId, item.ayahNo, grade, hintLevel, today);
    if (item.type === "new" && item.ayahNo != null) data = introduceAyahs(data, item.targetId, 1, today).data;
  }
  const marked: HifzSession = {
    ...s,
    items: s.items.map((i) => (i.id === item.id ? { ...i, result: grade, hintLevel } : i)),
    stats: { mistakes: s.stats.mistakes + (grade === "again" ? 1 : 0), hints: s.stats.hints + (hintLevel > 0 ? 1 : 0) },
  };
  return advance(data, marked, today, now);
}

/** Moves past an ungraded (free practice) item: nothing changes in the schedule. */
export const completeUngraded = (d: HifzData, s: HifzSession, today: string, now: number) => advance(d, s, today, now);

export function summary(s: HifzSession) {
  const done = s.items.filter((i) => i.result && i.result !== "skipped");
  return {
    total: s.items.length,
    practised: done.length,
    slipped: s.items.filter((i) => i.result === "again").length,
    skipped: s.items.filter((i) => i.result === "skipped").length,
    newCount: s.items.filter((i) => i.isNew && i.result && i.result !== "skipped").length,
  };
}
