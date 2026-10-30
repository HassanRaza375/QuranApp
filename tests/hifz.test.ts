// Phase 14: Hifz, the pure parts that have no legacy twin: splitting an ayah into words, the slips store and the tricky-word rule, the slips-to-grade
// rules, the plan and its time estimate, the session builders and the storage wrapper. (The engine itself is compared with the legacy in
// tests/hifzParity.test.ts.)
import { afterEach, describe, expect, it } from "vitest";
import * as E from "../app/lib/hifz/engine";
import { canOfferEasy, gradeFor } from "../app/lib/hifz/grading";
import { CELL_LABEL, cellsFor, counts, summarize } from "../app/lib/hifz/overview";
import { ayahList, buildPlan, refsLabel } from "../app/lib/hifz/queue";
import * as S from "../app/lib/hifz/session";
import * as W from "../app/lib/hifz/slips";
import { HIFZ_KEY, loadHifz, mutate, saveHifz, weeksFor } from "../app/lib/hifz/store";
import * as T from "../app/lib/hifz/timing";
import { estimateWordCount, lastWords, sameWord, splitWords } from "../app/lib/hifz/words";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

// letters and marks as escapes: no Arabic script is typed into the tests either
const BA = "بِ"; // a word
const SEEN = "سْمِ";
const PAUSE = "ۖ"; // a pause mark standing alone
const RUB = "۞";
const SAJDA = "۩";

describe("splitting an ayah into words", () => {
  it("splits on spaces and drops marks that stand alone, but keeps a word that carries a mark", () => {
    const text = `${BA}${SEEN} ${PAUSE} ${BA}${PAUSE} ${RUB} ${SEEN} ${SAJDA}`;
    expect(splitWords(text)).toEqual([`${BA}${SEEN}`, `${BA}${PAUSE}`, SEEN]);
  });
  it("copes with extra spaces and an empty text", () => {
    expect(splitWords("  ")).toEqual([]);
    expect(splitWords(` ${BA}   ${SEEN} `)).toEqual([BA, SEEN]);
  });
  it("compares words after NFC (the reader's text is not stored normalised)", () => {
    const decomposed = "آ"; // alef + madda above
    const composed = "آ";
    expect(decomposed).not.toBe(composed);
    expect(sameWord(decomposed, composed)).toBe(true);
    expect(sameWord(BA, SEEN)).toBe(false);
  });
  it("estimates words from length (about 9.2 characters a word) and never says 0", () => {
    expect(estimateWordCount(92)).toBe(10);
    expect(estimateWordCount(1)).toBe(1);
    expect(lastWords(["a", "b", "c", "d"], 3)).toEqual(["b", "c", "d"]);
    expect(lastWords(["a"], 3)).toEqual(["a"]);
  });
});

describe("slips to a grade (the owner's rules)", () => {
  it("no slips and no cue is good; any slip is again; easy only after a clean recitation", () => {
    expect(gradeFor({ slips: [], cue: false, easy: false })).toEqual({ grade: "good", hintLevel: 0 });
    expect(gradeFor({ slips: [], cue: false, easy: true })).toEqual({ grade: "easy", hintLevel: 0 });
    expect(gradeFor({ slips: [2], cue: false, easy: false })).toEqual({ grade: "again", hintLevel: 0 });
    expect(gradeFor({ slips: [2, 3], cue: false, easy: true })).toEqual({ grade: "again", hintLevel: 0 });
  });
  it("the first-word cue is not a slip: good, hint level 1, and no easy button", () => {
    expect(gradeFor({ slips: [], cue: true, easy: false })).toEqual({ grade: "good", hintLevel: 1 });
    expect(gradeFor({ slips: [], cue: true, easy: true })).toEqual({ grade: "good", hintLevel: 1 });
    expect(canOfferEasy({ slips: [], cue: true })).toBe(false);
    expect(canOfferEasy({ slips: [1], cue: false })).toBe(false);
    expect(canOfferEasy({ slips: [], cue: false })).toBe(true);
  });
  it("a slip together with the cue is again, with hint level 1", () => {
    expect(gradeFor({ slips: [0], cue: true, easy: false })).toEqual({ grade: "again", hintLevel: 1 });
  });
});

describe("the slips store and the tricky-word rule", () => {
  const words = [BA, SEEN, `${BA}${SEEN}`];
  const key = W.ayahKey(112, 3);
  const slip = (rec: W.WordsRecord, day: string, ...idx: number[]) => W.recordRecitation(rec, key, words, idx, day);

  it("one slip is recorded but is not tricky; a slip on a second day makes the word tricky", () => {
    let rec = slip(W.emptyWords(), "2026-10-01", 1);
    expect(rec.ayahs[key]!["1"]).toMatchObject({ word: SEEN, slipDays: ["2026-10-01"], cleanDays: [] });
    expect(W.trickyIn(rec, key, words)).toEqual([]);
    expect(W.slippedIn(rec, key)).toEqual([{ index: 1, word: SEEN, days: 1 }]);
    rec = slip(rec, "2026-10-02", 1);
    expect(W.trickyIn(rec, key, words)).toEqual([{ index: 1, word: SEEN }]);
    expect(W.trickyOfSurah(rec, 112)).toEqual([{ ayah: 3, index: 1, word: SEEN, days: 2 }]);
    expect(W.trickyOfSurah(rec, 67)).toEqual([]);
  });
  it("two slips on the same day are one day", () => {
    const rec = slip(slip(W.emptyWords(), "2026-10-01", 1), "2026-10-01", 1);
    expect(rec.ayahs[key]!["1"]!.slipDays).toEqual(["2026-10-01"]);
  });
  it("stops being tricky after 3 different clean days, and a repeat on the same day counts once", () => {
    let rec = slip(slip(W.emptyWords(), "2026-10-01", 1), "2026-10-02", 1);
    rec = slip(rec, "2026-10-03"); // clean day 1
    rec = slip(rec, "2026-10-03"); // the same day again: still 1
    expect(rec.ayahs[key]!["1"]!.cleanDays).toEqual(["2026-10-03"]);
    expect(W.trickyIn(rec, key, words)).toHaveLength(1);
    rec = slip(rec, "2026-10-04"); // 2
    expect(W.trickyIn(rec, key, words)).toHaveLength(1);
    rec = slip(rec, "2026-10-05"); // 3
    expect(W.trickyIn(rec, key, words)).toEqual([]);
    expect(W.slippedIn(rec, key)).toEqual([]);
  });
  it("a slip starts the clean count again", () => {
    let rec = slip(slip(W.emptyWords(), "2026-10-01", 1), "2026-10-02", 1);
    rec = slip(slip(rec, "2026-10-03"), "2026-10-04");
    rec = slip(rec, "2026-10-05", 1);
    expect(rec.ayahs[key]!["1"]!.cleanDays).toEqual([]);
    expect(W.trickyIn(rec, key, words)).toHaveLength(1);
  });
  it("a clean recitation on a day the word was slipped on does not count as clean", () => {
    const rec = slip(slip(W.emptyWords(), "2026-10-01", 1), "2026-10-01");
    expect(rec.ayahs[key]!["1"]!.cleanDays).toEqual([]);
  });
  it("words never slipped on get no entry, and slipping on different words keeps each its own count", () => {
    const rec = slip(slip(W.emptyWords(), "2026-10-01", 0), "2026-10-02", 2);
    expect(Object.keys(rec.ayahs[key]!).sort()).toEqual(["0", "2"]);
    expect(rec.ayahs[key]!["0"]!.cleanDays).toEqual(["2026-10-02"]);
    expect(rec.ayahs[key]!["2"]!.slipDays).toEqual(["2026-10-02"]);
  });
  it("an entry whose word no longer matches the text is dropped, never shown on the wrong word", () => {
    const rec = slip(W.emptyWords(), "2026-10-01", 1);
    const changed = [BA, BA, `${BA}${SEEN}`];
    expect(W.trickyIn(slip(rec, "2026-10-02", 1), key, changed)).toEqual([]);
    const after = W.recordRecitation(rec, key, changed, [], "2026-10-02");
    expect(after.ayahs[key]).toBeUndefined();
  });
  it("an out-of-range slip index is ignored", () => {
    expect(W.recordRecitation(W.emptyWords(), key, words, [7, -1], "2026-10-01").ayahs).toEqual({});
  });
  it("a stored value that is not the expected shape is repaired, not thrown on", () => {
    expect(W.parseWords(null)).toEqual(W.emptyWords());
    expect(W.parseWords({ v: 1, ayahs: { "1:1": "x", "1:2": { "0": { word: 5 }, "x": { word: "a" }, "1": { word: "ok", slipDays: ["d", 3], cleanDays: "no" } } } }).ayahs).toEqual({ "1:2": { "1": { word: "ok", slipDays: ["d"], cleanDays: [], last: "" } } });
  });
  it("is stored under its own key and read back", () => {
    const store = memoryStore();
    setStorageBackend(store);
    W.writeWords(slip(W.emptyWords(), "2026-10-01", 1));
    expect(W.WORDS_KEY).toBe("quran:hifz-words:v1");
    expect(W.readWords().ayahs[key]!["1"]!.word).toBe(SEEN);
    expect([...store.data.keys()]).toEqual(["quran:hifz-words:v1"]);
  });
});

describe("the time estimate", () => {
  const fresh = T.emptyTiming();
  it("is about 10 seconds an item plus 1.5 seconds a word, a new ayah four times that", () => {
    expect(T.estimateSeconds([{ words: 10, isNew: false }], fresh)).toBe(25);
    expect(T.estimateSeconds([{ words: 10, isNew: true }], fresh)).toBe(100);
    expect(T.estimateSeconds([{ words: 10, isNew: false }, { words: 20, isNew: false }], fresh)).toBe(25 + 40);
  });
  it("uses your own median per item only after 10 sessions", () => {
    const nine: T.Timing = { v: 1, sessions: 9, secs: [30, 30, 30] };
    expect(T.estimateSeconds([{ words: 10, isNew: false }], nine)).toBe(25);
    const ten: T.Timing = { v: 1, sessions: 10, secs: [20, 40, 30] };
    expect(T.estimateSeconds([{ words: 10, isNew: false }], ten)).toBe(30);
    expect(T.estimateSeconds([{ words: 10, isNew: true }], ten)).toBe(120);
  });
  it("keeps the last 60 item times and ignores nonsense", () => {
    let t = fresh;
    for (let i = 0; i < 5; i++) t = T.recordSession(t, Array.from({ length: 20 }, () => 30));
    expect(t.secs).toHaveLength(60);
    expect(t.sessions).toBe(5);
    expect(T.recordSession(fresh, [0, -3, 1000, 12]).secs).toEqual([12]);
    expect(T.parseTiming("x")).toEqual(fresh);
    expect(T.parseTiming({ sessions: 3.7, secs: [1, "a", NaN, 5] })).toEqual({ v: 1, sessions: 3, secs: [1, 5] });
    expect(T.median([])).toBeNull();
    expect(T.median([1, 2, 3, 4])).toBe(2.5);
  });
  it("is said as whole minutes, at least 1", () => {
    expect(T.aboutMinutes(10)).toBe(1);
    expect(T.aboutMinutes(540)).toBe(9);
    expect(T.aboutMinutes(89)).toBe(1);
    expect(T.aboutMinutes(91)).toBe(2);
  });
});

/* ---- a small world: two surahs ---- */
const TODAY = "2026-10-10";
function world() {
  let d = E.emptyData();
  d = E.createTarget(d, { surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 }, "mulk", 1).data;
  d = E.createTarget(d, { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "ikhlas", 2).data;
  d = E.introduceAyahs(d, "mulk", 2, "2026-10-01").data;
  d = E.introduceAyahs(d, "ikhlas", 4, "2026-10-01").data;
  return d;
}
const ids = () => {
  let n = 0;
  return () => `i${++n}`;
};

describe("today's plan and the session queue", () => {
  const weaken = (d: E.HifzData, target: string, ayah: number) => E.gradeAyah(E.gradeAyah(d, target, ayah, "again", 0, "2026-10-02"), target, ayah, "again", 0, "2026-10-03");

  it("lists tricky ayahs first, then reviews, then new ayahs", () => {
    const d = weaken(world(), "ikhlas", 3);
    expect(E.getAyahState(d, "ikhlas", 3)!.strength).toBe("weak");
    const items = S.buildDailyItems(d, TODAY, ids());
    expect(items[0]).toMatchObject({ type: "weak-ayah", targetId: "ikhlas", ayahNo: 3 });
    const types = items.map((i) => i.type);
    expect(types.indexOf("revision")).toBeGreaterThan(0);
    expect(types.lastIndexOf("revision")).toBeLessThan(types.indexOf("new"));
    expect(items.every((i) => i.type !== "warmup" && i.type !== "final-mixed")).toBe(true);
    // Al-Ikhlas is fully started; Al-Mulk has nothing weak, so its whole budget of 2 is offered
    expect(items.filter((i) => i.type === "new").map((i) => [i.targetId, i.ayahNo])).toEqual([["mulk", 3], ["mulk", 4]]);
  });

  it("new ayahs of a surah are halved while 1 or 2 of its ayahs and joins need work, and wait while 3 or more do", () => {
    const newOf = (d: E.HifzData) => S.buildDailyItems(d, TODAY, ids()).filter((i) => i.type === "new" && i.targetId === "mulk").length;
    let d = world();
    expect(newOf(d)).toBe(2);
    d = weaken(d, "mulk", 1);
    expect(newOf(d)).toBe(1);
    d = weaken(d, "mulk", 2);
    expect(newOf(d)).toBe(1);
    d = E.gradeTransition(d, "mulk", 1, "again", "2026-10-03");
    expect(newOf(d)).toBe(0);
  });

  it("Recite to someone leaves new ayahs out", () => {
    expect(S.buildDailyItems(world(), TODAY, ids(), { includeNew: false }).some((i) => i.type === "new")).toBe(false);
    expect(S.buildDailyItems(world(), TODAY, ids(), { targetIds: ["ikhlas"] }).every((i) => i.targetId === "ikhlas")).toBe(true);
  });

  it("a paused surah is not in the plan", () => {
    const d = E.updateTarget(world(), "mulk", { status: "paused" });
    expect(new Set(S.buildDailyItems(d, TODAY, ids()).map((i) => i.targetId))).toEqual(new Set(["ikhlas"]));
  });

  it("builds the plan lines, the detail and the estimate", () => {
    let d = world();
    d = E.gradeAyah(E.gradeAyah(d, "ikhlas", 3, "again", 0, "2026-10-02"), "ikhlas", 3, "again", 0, "2026-10-03");
    const words = W.recordRecitation(W.recordRecitation(W.emptyWords(), "112:3", ["a", "b", "c"], [1], "2026-10-02"), "112:3", ["a", "b", "c"], [2], "2026-10-03");
    const plan = buildPlan({ data: d, today: TODAY, words, timing: T.emptyTiming(), chars: () => 92, newId: ids() });
    expect(plan.empty).toBe(false);
    expect(plan.lines.map((l) => l.kind)).toEqual(["tricky", "review", "new"]);
    expect(plan.lines[0]).toMatchObject({ title: "Fix 1 tricky ayah", detail: expect.stringContaining("112:3 · 2 words slipped last time") });
    expect(plan.lines[2]!.title).toBe("Learn 2 new ayahs");
    // 10 words an item: 25 s; the new ones 100 s each
    const reviews = plan.items.filter((i) => i.type !== "new").length;
    expect(plan.seconds).toBe(reviews * 25 + 2 * 100);
    expect(plan.minutes).toBe(Math.round(plan.seconds / 60));
  });

  it("a plan with nothing due is empty", () => {
    const d = E.createTarget(E.emptyData(), { surahNo: 112, surahName: "x", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t", 0).data;
    const done = E.updateTarget(d, "t", { lastPosition: 4 });
    expect(buildPlan({ data: done, today: TODAY, words: W.emptyWords(), timing: T.emptyTiming(), chars: () => 50, newId: ids() }).empty).toBe(true);
  });

  it("joins the ayah numbers the way they are read", () => {
    expect(ayahList([1])).toBe("1");
    expect(ayahList([2, 1])).toBe("1–2");
    expect(ayahList([1, 4])).toBe("1 and 4");
    expect(ayahList([1, 2, 3, 7])).toBe("1–3 and 7");
    expect(ayahList([1, 4, 6])).toBe("1, 4 and 6");
    expect(ayahList([])).toBe("");
    const d = world();
    const items = S.buildDailyItems(d, TODAY, ids()).filter((i) => i.type === "revision");
    expect(refsLabel(d, items)).toBe("Al-Mulk 1–2, Al-Ikhlaas 1–4");
  });
});

describe("sessions", () => {
  it("a whole-surah check is every started ayah in order with the join to the one before, and a finished check records itself", () => {
    const d = world();
    const items = S.buildAssessmentItems(d, "ikhlas", ids());
    expect(items.map((i) => (i.fromAyah != null ? `join ${i.fromAyah}-${i.toAyah}` : `ayah ${i.ayahNo}`))).toEqual(["ayah 1", "ayah 2", "join 1-2", "ayah 3", "join 2-3", "ayah 4", "join 3-4"]);
    let s = S.startSession("assessment", items, ["ikhlas"], "s", 0);
    let data = d;
    while (S.currentItem(s)) {
      const r = S.gradeCurrent(data, s, "good", 0, TODAY, 5);
      data = r.data;
      s = r.session;
    }
    expect(s.status).toBe("completed");
    expect(data.targets.find((t) => t.id === "ikhlas")!.lastAssessmentAt).toBe(TODAY);
    expect(data.activity.find((a) => a.date === TODAY)!.assessments).toBe(1);
    // the joins were graded (unlike the legacy assessment, whose join items carried no ayah number)
    expect(E.getTransitionState(data, "ikhlas", 1)!.recentResults).toEqual(["good"]);
    expect(S.summary(s)).toMatchObject({ total: 7, practised: 7, slipped: 0 });
  });

  it("a join that is not said is graded again and becomes weak", () => {
    const d = world();
    const s = S.startSession("assessment", [{ id: "j", type: "weak-transition", targetId: "ikhlas", fromAyah: 2, toAyah: 3, gradedTest: true, testMode: "transition", result: null, hintLevel: 0 }], ["ikhlas"], "s", 0);
    const r = S.gradeCurrent(d, s, "again", 0, TODAY, 0);
    expect(E.getTransitionState(r.data, "ikhlas", 2)!.strength).toBe("weak");
  });

  it("free practice items are ungraded: finishing them leaves the record exactly as it was", () => {
    const d = world();
    const items = S.buildFreeItems("ikhlas", 1, 3, ids());
    expect(items.every((i) => !i.gradedTest)).toBe(true);
    let s = S.startSession("free-practice", items, ["ikhlas"], "s", 0);
    let data = d;
    while (S.currentItem(s)) {
      const r = S.completeUngraded(data, s, TODAY, 1);
      data = r.data;
      s = r.session;
    }
    expect(s.status).toBe("completed");
    expect(data).toBe(d);
    // even if it were handed to gradeCurrent, an ungraded item changes nothing in the schedule
    const again = S.gradeCurrent(d, S.startSession("free-practice", S.buildFreeItems("ikhlas", 1, 1, ids()), ["ikhlas"], "s", 0), "again", 0, TODAY, 1);
    expect(again.data.ayahStates).toEqual(d.ayahStates);
  });

  describe("a new ayah and its joins", () => {
    // Al-Mulk 3 is the new ayah (1 and 2 are started); its joins come after the Recite stage
    const start = () => {
      const d = world();
      const items = S.buildDailyItems(d, TODAY, ids()).filter((i) => i.type === "new" && i.targetId === "mulk").slice(0, 1);
      return { d, s: S.startSession("daily", items, ["mulk"], "s", 0) };
    };

    it("the ayah is graded and introduced when Recite ends, and the session stays on it", () => {
      const { d, s } = start();
      expect(S.currentItem(s)).toMatchObject({ type: "new", ayahNo: 3 });
      const r = S.applyGrade(d, s, "good", 0, TODAY);
      expect(S.currentItem(r.session)).toMatchObject({ ayahNo: 3, result: "good" });
      expect(r.session.currentIndex).toBe(0);
      expect(r.session.status).toBe("in-progress");
      expect(E.getAyahState(r.data, "mulk", 3)).toMatchObject({ reviewCount: 1, recentResults: ["good"] });
      expect(r.data.targets.find((t) => t.id === "mulk")!.lastPosition).toBe(3);
      // the join of 2 with 3 exists from the introduction, but nothing has graded it yet
      expect(E.getTransitionState(r.data, "mulk", 2)!.recentResults).toEqual([]);
      expect(S.isGraded(S.currentItem(r.session))).toBe(true);
      expect(S.isGraded(S.currentItem(s))).toBe(false);
    });

    it("the join from the ayah before is graded on its own: said at once is good, after a Not yet is again and weak", () => {
      const { d, s } = start();
      const graded = S.applyGrade(d, s, "good", 0, TODAY);
      const said = S.finishJoins(graded.data, graded.session, true, TODAY, 9);
      expect(E.getTransitionState(said.data, "mulk", 2)!.recentResults).toEqual(["good"]);
      expect(E.getAyahState(said.data, "mulk", 3)!.recentResults).toEqual(["good"]); // the ayah is not graded a second time
      expect(said.session.status).toBe("completed");
      const missed = S.finishJoins(graded.data, graded.session, false, TODAY, 9);
      expect(E.getTransitionState(missed.data, "mulk", 2)).toMatchObject({ recentResults: ["again"], strength: "weak" });
      expect(E.getAyahState(missed.data, "mulk", 3)!.recentResults).toEqual(["good"]);
    });

    it("the grade of the ayah counts as slipped in the summary and stays when the joins go well", () => {
      const { d, s } = start();
      const graded = S.applyGrade(d, s, "again", 0, TODAY);
      const done = S.finishJoins(graded.data, graded.session, true, TODAY, 9);
      expect(S.summary(done.session)).toMatchObject({ practised: 1, slipped: 1, newCount: 1 });
      // an ayah graded `again` still counts as introduced (the legacy behaviour, kept)
      expect(done.data.targets.find((t) => t.id === "mulk")!.lastPosition).toBe(3);
    });

    it("skipping during the joins keeps the grade the ayah already has (it is not marked skipped)", () => {
      const { d, s } = start();
      const graded = S.applyGrade(d, s, "good", 0, TODAY);
      const skipped = S.skipCurrent(graded.data, graded.session, TODAY, 9);
      expect(skipped.session.items[0]!.result).toBe("good");
      expect(skipped.data).toBe(graded.data);
      expect(skipped.session.status).toBe("completed");
      // an ungraded item is still marked skipped and changes nothing
      const plain = S.skipCurrent(d, s, TODAY, 9);
      expect(plain.session.items[0]!.result).toBe("skipped");
      expect(plain.data).toBe(d);
    });

    it("gradeCurrent is still apply-and-move-on, for the steps that have no joins", () => {
      const { d, s } = start();
      const r = S.gradeCurrent(d, s, "good", 0, TODAY, 9);
      expect(r.session.status).toBe("completed");
      expect(E.getAyahState(r.data, "mulk", 3)!.recentResults).toEqual(["good"]);
    });
  });

  it("a session with an item left is resumable; a completed one and a missing one are not", () => {
    const s = S.startSession("daily", S.buildDailyItems(world(), TODAY, ids()), ["mulk"], "s", 0);
    expect(S.isResumable(s)).toBe(true);
    expect(S.isResumable({ ...s, status: "completed" })).toBe(false);
    expect(S.isResumable({ ...s, currentIndex: s.items.length })).toBe(false);
    expect(S.isResumable(null)).toBe(false);
  });

  it("the check mode is kept on the session and is the only field the legacy does not have", () => {
    const s = S.startSession("quick-test", [], [], "s", 0, "check");
    expect(s.mode).toBe("check");
    expect(S.startSession("daily", [], [], "s", 0).mode).toBeUndefined();
    expect(Object.keys(S.startSession("daily", [], [], "s", 0)).sort()).toEqual(["completedAt", "currentIndex", "id", "items", "kind", "startedAt", "stats", "status", "targetIds"]);
  });
});

describe("the storage wrapper", () => {
  it("mutate reads the record fresh, so a change made in another tab in between is kept", () => {
    const store = memoryStore();
    setStorageBackend(store);
    saveHifz(world());
    const otherTab = { ...JSON.parse(store.data.get(HIFZ_KEY)!), targets: JSON.parse(store.data.get(HIFZ_KEY)!).targets.map((t: E.HifzTarget) => (t.id === "mulk" ? { ...t, status: "paused" } : t)) };
    store.data.set(HIFZ_KEY, JSON.stringify(otherTab));
    const after = mutate((d) => E.updateTarget(d, "ikhlas", { dailyNewTarget: 3 }));
    expect(after.targets.find((t) => t.id === "mulk")!.status).toBe("paused");
    expect(JSON.parse(store.data.get(HIFZ_KEY)!).targets.find((t: E.HifzTarget) => t.id === "ikhlas").dailyNewTarget).toBe(3);
  });
  it("an absent, empty or odd record loads as empty, and arrays that are not arrays are repaired", () => {
    for (const raw of [undefined, "null", '{"targets": 5}', "[]"]) {
      setStorageBackend(memoryStore(raw === undefined ? {} : { [HIFZ_KEY]: raw }));
      const loaded = loadHifz();
      expect(loaded.data).toEqual(E.emptyData());
    }
    setStorageBackend(memoryStore({ [HIFZ_KEY]: "[]" }));
    expect(loadHifz().damaged).toBe(true);
  });
  it("says how many weeks a surah takes at a pace", () => {
    expect(weeksFor(83, 2)).toBe(6);
    expect(weeksFor(4, 1)).toBe(1);
    expect(weeksFor(286, 1)).toBe(41);
  });
});

describe("a surah as cells (the strength strip)", () => {
  it("one cell per ayah of the plan, by strength, with a weak join marked on the ayah it leads to", () => {
    let d = world();
    d = weakJoin(d);
    const cells = cellsFor(d, d.targets.find((t) => t.id === "ikhlas")!);
    expect(cells.map((c) => [c.ayah, c.s, c.joinWeak])).toEqual([[1, "learning", false], [2, "learning", false], [3, "learning", true], [4, "learning", false]]);
    const mulk = cellsFor(d, d.targets.find((t) => t.id === "mulk")!);
    expect(mulk).toHaveLength(30);
    expect(counts(mulk)).toMatchObject({ started: 2, none: 28, learning: 2 });
  });
  it("a partial plan has cells only for its range, and an ayah without a state is not started", () => {
    const d = E.createTarget(E.emptyData(), { surahNo: 36, surahName: "x", startAyah: 20, endAyah: 22, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "p", 0).data;
    expect(cellsFor(d, d.targets[0]!).map((c) => [c.ayah, c.s])).toEqual([[20, "none"], [21, "none"], [22, "none"]]);
  });
  it("is read out as a sentence", () => {
    let d = world();
    d = E.gradeAyah(E.gradeAyah(d, "ikhlas", 3, "again", 0, "2026-10-02"), "ikhlas", 3, "again", 0, "2026-10-03");
    d = weakJoin(d);
    expect(summarize(cellsFor(d, d.targets.find((t) => t.id === "ikhlas")!))).toBe("4 of 4 ayahs started: 3 learning, 1 needs work, 1 join needs work");
    expect(summarize(cellsFor(d, d.targets.find((t) => t.id === "mulk")!))).toBe("2 of 30 ayahs started: 2 learning");
    expect(summarize([])).toBe("0 of 0 ayahs started");
    expect(CELL_LABEL.weak).toBe("Needs work");
  });
});
function weakJoin(d: E.HifzData): E.HifzData {
  return E.gradeTransition(d, "ikhlas", 2, "again", "2026-10-03");
}
