// Hifz (Phase 14): the plan, the surahs, and the session being run. The rules are in `lib/hifz/*` (pure, and compared with the legacy composables in
// tests/hifzParity.test.ts); this wires them to storage and the screens. Every change reads the stored record fresh and writes it back in the legacy
// shape (`lib/hifz/store.ts`), so a second tab, or the legacy app after a rollback, never loses anything.
//
// Free practice is kept in memory only: it never writes the record, the words, the timing or the stored session.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { localDateKey } from "~/lib/dates";
import * as E from "~/lib/hifz/engine";
import { gradeFor, type Recitation } from "~/lib/hifz/grading";
import { buildPlan } from "~/lib/hifz/queue";
import * as S from "~/lib/hifz/session";
import { ayahKey, readWords, recordRecitation, writeWords, emptyWords, type WordsRecord } from "~/lib/hifz/slips";
import { legacySurahName, loadHifz, readSession, saveHifz, writeSession } from "~/lib/hifz/store";
import { emptyTiming, readTiming, recordSession, writeTiming, type Timing } from "~/lib/hifz/timing";
import { AYAH_COUNTS } from "~/lib/quranMeta";

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const today = () => localDateKey(new Date());

export interface RemovedSurah {
  target: E.HifzTarget;
  index: number;
  ayahStates: E.HifzAyahState[];
  transitionStates: E.HifzTransitionState[];
}

export const useHifzStore = defineStore("hifz", () => {
  const loaded = ref(false);
  const damaged = ref(false);
  const data = ref<E.HifzData>(E.emptyData());
  const words = ref<WordsRecord>(emptyWords());
  const timing = ref<Timing>(emptyTiming());
  const stored = ref<S.HifzSession | null>(null);
  const free = ref<S.HifzSession | null>(null);
  const running = ref<"stored" | "free">("stored");
  const lengths = ref<number[][] | null>(null);
  const itemStart = ref(0);
  const itemSeconds = ref<number[]>([]);

  function load() {
    const l = loadHifz();
    data.value = l.data;
    damaged.value = l.damaged;
    words.value = readWords();
    timing.value = readTiming();
    stored.value = readSession();
    loaded.value = true;
  }

  async function ensureLengths() {
    if (!lengths.value) lengths.value = (await import("~/data/ayahLengths.generated")).AYAH_LENGTHS;
  }

  /* ---------------- what the screens read ---------------- */

  const surahs = computed(() => data.value.targets);
  const resumable = computed(() => (S.isResumable(stored.value) ? stored.value : null));
  const plan = computed(() => {
    const len = lengths.value;
    if (!len) return null;
    return buildPlan({ data: data.value, today: today(), words: words.value, timing: timing.value, chars: (s, a) => len[s - 1]?.[a - 1] ?? 90, newId: () => "p" });
  });
  /** The session being run, wherever it is kept. */
  const session = computed(() => (running.value === "free" ? free.value : stored.value));
  const item = computed(() => S.currentItem(session.value));
  const targetOf = (id: string) => data.value.targets.find((t) => t.id === id) ?? null;

  /* ---------------- surahs ---------------- */

  function addSurah(o: { surahNo: number; startAyah: number; endAyah: number; perDay: number }): E.HifzTarget {
    let made!: E.HifzTarget;
    data.value = mutateData((d) => {
      const r = E.createTarget(d, { surahNo: o.surahNo, surahName: legacySurahName(o.surahNo), startAyah: o.startAyah, endAyah: o.endAyah, dailyNewTarget: o.perDay, dailyTimeGoalMinutes: 15 }, newId(), Date.now());
      made = r.target;
      return r.data;
    });
    damaged.value = false;
    return made;
  }
  function setPace(id: string, perDay: number) {
    data.value = mutateData((d) => E.updateTarget(d, id, { dailyNewTarget: perDay }));
  }
  function setStatus(id: string, status: E.HifzTarget["status"]) {
    data.value = mutateData((d) => E.updateTarget(d, id, { status }));
  }
  /** Removes a surah and what was learnt of it; the returned snapshot puts it back (the Undo). Tricky words are kept: they belong to the ayah, not the plan. */
  function removeSurah(id: string): RemovedSurah | null {
    const target = targetOf(id);
    if (!target) return null;
    const snap: RemovedSurah = {
      target,
      index: data.value.targets.findIndex((t) => t.id === id),
      ayahStates: E.ayahStatesFor(data.value, id),
      transitionStates: E.transitionStatesFor(data.value, id),
    };
    data.value = mutateData((d) => E.deleteTarget(d, id));
    return snap;
  }
  function restoreSurah(snap: RemovedSurah) {
    data.value = mutateData((d) => {
      if (d.targets.some((t) => t.id === snap.target.id)) return d;
      const targets = [...d.targets];
      targets.splice(Math.min(snap.index, targets.length), 0, snap.target);
      return { ...d, targets, ayahStates: [...d.ayahStates, ...snap.ayahStates], transitionStates: [...d.transitionStates, ...snap.transitionStates] };
    });
  }

  function mutateData(fn: (d: E.HifzData) => E.HifzData): E.HifzData {
    const next = fn(loadHifz().data);
    saveHifz(next);
    return next;
  }

  /* ---------------- starting a session ---------------- */

  /** Starts and stores a session; null (and nothing stored) when there is nothing to do. */
  function begin(kind: S.SessionKind, items: S.SessionItem[], targetIds: string[], mode?: "check"): S.HifzSession | null {
    if (!items.length) return null;
    const s = S.startSession(kind, items, targetIds, newId(), Date.now(), mode);
    running.value = "stored";
    stored.value = s;
    writeSession(s);
    itemSeconds.value = [];
    return s;
  }
  function startDaily(): S.HifzSession | null {
    load();
    const items = S.buildDailyItems(data.value, today(), newId);
    return begin("daily", items, E.activeTargets(data.value).map((t) => t.id));
  }
  /** "Recite to someone": the same queue, without new ayahs, nothing hidden; graded like a review. */
  function startCheck(surahNo?: number): S.HifzSession | null {
    load();
    const targets = E.activeTargets(data.value).filter((t) => !surahNo || t.surahNo === surahNo);
    const items = S.buildDailyItems(data.value, today(), newId, { targetIds: targets.map((t) => t.id), includeNew: false });
    return begin("quick-test", items, targets.map((t) => t.id), "check");
  }
  /** "Check the whole surah": every started ayah, then each join. */
  function startFull(targetId: string): S.HifzSession | null {
    load();
    return begin("assessment", S.buildAssessmentItems(data.value, targetId, newId), [targetId]);
  }
  /** Free practice: any surah, ungraded, in memory only. */
  function startFree(surahNo: number, from: number, to: number) {
    const s = S.startSession("free-practice", S.buildFreeItems(`free:${surahNo}`, from, to, newId), [`free:${surahNo}`], newId(), Date.now());
    running.value = "free";
    free.value = s;
    return s;
  }
  function resume() {
    load();
    if (!resumable.value) return null;
    running.value = "stored";
    itemSeconds.value = [];
    return stored.value;
  }
  function endFree() {
    free.value = null;
    running.value = "stored";
  }
  /** Drops the stored session without grading anything left in it (the legacy "abandon"). */
  function abandon() {
    stored.value = null;
    writeSession(null);
  }

  /* ---------------- running it ---------------- */

  function beginItem() {
    itemStart.value = typeof performance === "undefined" ? 0 : performance.now();
  }
  function noteTime(isNew: boolean) {
    if (isNew || running.value === "free") return;
    const secs = ((typeof performance === "undefined" ? 0 : performance.now()) - itemStart.value) / 1000;
    if (secs > 0 && secs < 600) itemSeconds.value = [...itemSeconds.value, secs];
  }

  function commit(next: { data: E.HifzData; session: S.HifzSession }) {
    if (running.value === "free") {
      free.value = next.session;
      return;
    }
    saveHifz(next.data);
    data.value = next.data;
    stored.value = next.session;
    writeSession(next.session);
    if (next.session.status === "completed" && next.session.kind === "daily" && !next.session.mode) {
      timing.value = recordSession(timing.value, itemSeconds.value);
      writeTiming(timing.value);
    }
  }

  /** The recitation of the current ayah is over: grade it from the slips (a free session only moves on), remember the slipped words, go to the next item. */
  function finishAyah(rec: Recitation, ayahWords: readonly string[]) {
    const s = session.value;
    const it = item.value;
    if (!s || !it) return;
    noteTime(!!it.isNew);
    const now = Date.now();
    if (running.value === "free" || !it.gradedTest) {
      commit(S.completeUngraded(data.value, s, today(), now));
      return;
    }
    const { grade, hintLevel } = gradeFor(rec);
    const target = targetOf(it.targetId);
    if (target && it.ayahNo != null) {
      words.value = recordRecitation(readWords(), ayahKey(target.surahNo, it.ayahNo), ayahWords, rec.slips, today());
      writeWords(words.value);
    }
    commit(S.gradeCurrent(loadHifz().data, s, grade, hintLevel, today(), now));
  }
  /** A join was said (good) or not (again). */
  function finishJoin(said: boolean) {
    const s = session.value;
    if (!s || !item.value) return;
    noteTime(false);
    commit(S.gradeCurrent(loadHifz().data, s, said ? "good" : "again", 0, today(), Date.now()));
  }
  function skip() {
    const s = session.value;
    if (!s) return;
    commit(S.skipCurrent(loadHifz().data, s, today(), Date.now()));
  }

  /** The number of ayahs in a surah, for the pickers. */
  const ayahsIn = (surahNo: number) => AYAH_COUNTS[surahNo - 1] ?? 0;

  return {
    loaded, damaged, data, words, timing, stored, free, running, lengths,
    surahs, resumable, plan, session, item, targetOf, ayahsIn,
    load, ensureLengths, addSurah, setPace, setStatus, removeSurah, restoreSurah,
    startDaily, startCheck, startFull, startFree, resume, endFree, abandon,
    beginItem, finishAyah, finishJoin, skip,
  };
});
