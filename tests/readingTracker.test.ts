// What counts as read: the resume position (legacy rule), the daily log (1.5 s on screen), and Completed. The last tests are a
// simulated reading session that compares the legacy count of logged ayahs with the new one; its numbers are quoted in
// docs/phases/phase-04a-surah-reader.md.
import { describe, expect, it } from "vitest";
import { COMPLETE_SHARE, currentAyah, DWELL_MS, LINE, PROGRESS_DEBOUNCE_MS, ReadingTracker } from "../app/lib/readingTracker";

describe("currentAyah (the legacy 35% line)", () => {
  it("is the last ayah whose top is at or above the line, and 1 when none is", () => {
    expect(currentAyah([100, 400, 700, 1000], 245)).toBe(1);
    expect(currentAyah([-300, 0, 240, 500], 245)).toBe(3);
    expect(currentAyah([-900, -600, -300, 245], 245)).toBe(4);
    expect(currentAyah([300, 600], 245)).toBe(1); // nothing above the line yet
    expect(currentAyah([], 245)).toBe(1);
    expect(LINE).toBe(0.35);
    expect(PROGRESS_DEBOUNCE_MS).toBe(400);
  });
});

describe("ReadingTracker", () => {
  it("does not write ayah 1 (where a visit starts) and writes each change once", () => {
    const t = new ReadingTracker(10);
    expect(t.shouldWriteProgress(1)).toBe(false);
    expect(t.shouldWriteProgress(2)).toBe(true);
    expect(t.shouldWriteProgress(2)).toBe(false);
    expect(t.shouldWriteProgress(1)).toBe(true); // going back is a change
  });
  it("counts an ayah for the log after 1.5 s on screen in total, once", () => {
    const t = new ReadingTracker(10);
    t.show(3, 0);
    expect(t.tick(1000)).toEqual([]);
    expect(t.tick(1500)).toEqual([3]);
    expect(t.tick(3000)).toEqual([]); // not again
    expect(DWELL_MS).toBe(1500);
  });
  it("adds up separate stretches on screen (scrolling away and back)", () => {
    const t = new ReadingTracker(10);
    t.show(4, 0);
    t.hide(4, 900);
    expect(t.tick(2000)).toEqual([]); // 0.9 s so far, and it is off screen
    t.show(4, 5000);
    expect(t.tick(5500)).toEqual([]); // 0.9 + 0.5
    expect(t.tick(5600)).toEqual([4]); // 0.9 + 0.6 = 1.5
  });
  it("a flick (on screen for a moment) is not logged", () => {
    const t = new ReadingTracker(10);
    t.show(5, 0);
    t.hide(5, 120);
    expect(t.tick(10000)).toEqual([]);
    expect(t.read).toBe(0); // 0.12 s is not enough
  });
  it("stops counting while the tab is hidden, and starts again from the return", () => {
    const t = new ReadingTracker(10);
    t.show(2, 0);
    t.pause(1000); // 1.0 s counted
    expect(t.tick(60_000)).toEqual([]); // a minute in the background adds nothing
    t.resume([2], 60_000);
    expect(t.tick(60_400)).toEqual([]);
    expect(t.tick(60_500)).toEqual([2]); // 1.0 + 0.5
  });
  it("Completed needs the last ayah AND 90% counted as read in this visit; a jump or a skim does not complete", () => {
    const total = 20;
    const reached = (counted: number) => {
      const t = new ReadingTracker(total);
      for (let n = 1; n <= counted; n++) t.show(n, 0);
      t.tick(2000); // each of them has now been on screen for 2 s
      return t;
    };
    expect(reached(18).isComplete(19)).toBe(false); // not at the end yet
    expect(reached(18).isComplete(20)).toBe(true); // 90%
    expect(reached(17).isComplete(20)).toBe(false); // 85%
    const jumped = new ReadingTracker(total);
    jumped.show(20, 0); // a link straight to the last ayah
    jumped.tick(10_000);
    expect(jumped.isComplete(20)).toBe(false);
    expect(COMPLETE_SHARE).toBe(0.9);
  });
  it("a short surah is complete when all of it was read and the end was reached", () => {
    const t = new ReadingTracker(3);
    [1, 2, 3].forEach((n) => t.show(n, 0));
    expect(t.isComplete(3)).toBe(false); // they have only just appeared
    t.tick(2000);
    expect(t.isComplete(3)).toBe(true);
  });
});

// ---------------------------------------------------------------- simulated reading sessions
const AYAH_PX = 320; // an ayah with its translation on a phone, about
const VIEW = 700; // viewport height
const AYAHS = 60;
const FRAME = 16;

interface Step {
  scrollPx: number;
  scrollMs: number;
  pauseMs: number;
}

/** Runs a session in 16 ms frames (about 60 fps). Returns what the legacy reader would log and what the new rules log. */
function session(steps: Step[]) {
  const tracker = new ReadingTracker(AYAHS);
  const legacy = new Set<number>(); // legacy: the one ayah the debounce lands on, at each pause of 400 ms or more
  let y = 0;
  let t = 0;
  let still = 0;
  let lastLegacy = 1;
  const visible = new Set<number>();
  const logged = new Set<number>();
  const frame = () => {
    for (let n = 1; n <= AYAHS; n++) {
      const top = (n - 1) * AYAH_PX - y;
      const on = top < VIEW && top + AYAH_PX > 0;
      if (on && !visible.has(n)) {
        visible.add(n);
        tracker.show(n, t);
      }
      if (!on && visible.has(n)) {
        visible.delete(n);
        tracker.hide(n, t);
      }
    }
    for (const n of tracker.tick(t)) logged.add(n);
  };
  const stopped = () => {
    const tops = Array.from({ length: AYAHS }, (_, i) => i * AYAH_PX - y);
    const current = currentAyah(tops, VIEW * LINE);
    if (current !== lastLegacy) {
      lastLegacy = current;
      legacy.add(current);
    }
  };
  for (const s of steps) {
    const n = Math.max(1, Math.round(s.scrollMs / FRAME));
    for (let i = 0; i < n; i++) {
      y += s.scrollPx / n;
      t += FRAME;
      still = 0;
      frame();
    }
    for (let ms = 0; ms < s.pauseMs; ms += FRAME) {
      t += FRAME;
      still += FRAME;
      if (still === PROGRESS_DEBOUNCE_MS) stopped();
      frame();
    }
  }
  return { legacy: legacy.size, dwell: logged.size, read: tracker.read };
}

const repeat = (n: number, s: Step): Step[] => Array.from({ length: n }, () => s);

describe("simulated reading: legacy count against the new count (quoted in the phase doc)", () => {
  const careful = session(repeat(24, { scrollPx: 500, scrollMs: 500, pauseMs: 8000 })); // reads each screen for 8 s
  const normal = session(repeat(24, { scrollPx: 500, scrollMs: 500, pauseMs: 4000 })); // 4 s per screen
  const quick = session(repeat(24, { scrollPx: 500, scrollMs: 300, pauseMs: 700 })); // about a second per screen
  const skim = session(repeat(24, { scrollPx: 500, scrollMs: 300, pauseMs: 300 })); // a skim: 0.6 s per screen
  const flick = session([{ scrollPx: AYAHS * AYAH_PX - VIEW, scrollMs: 600, pauseMs: 1000 }]); // one big fast scroll to the end
  const steady = session([{ scrollPx: 12000, scrollMs: 60_000, pauseMs: 2000 }]); // a slow continuous scroll, no pauses

  it("prints the numbers", () => {
    console.log("SIM", JSON.stringify({ careful, normal, quick, skim, flick, steady }));
    expect(careful.read).toBeGreaterThan(0);
  });
  it("a careful or normal reader is counted far more fully than the legacy rule counted them", () => {
    expect(careful.dwell).toBeGreaterThan(careful.legacy);
    expect(normal.dwell).toBeGreaterThan(normal.legacy);
  });
  it("a skim and a flick log almost nothing under the new rule", () => {
    expect(skim.dwell).toBeLessThanOrEqual(2);
    expect(flick.dwell).toBe(0);
    expect(flick.legacy).toBeGreaterThanOrEqual(1);
  });
  it("a steady slow scroll with no stop: legacy logs one landing (the final pause), the new rule logs what was on screen long enough", () => {
    expect(steady.legacy).toBeLessThanOrEqual(1);
    expect(steady.dwell).toBeGreaterThan(10);
  });
  it("a flick or a skim to the end does not complete the surah (at 60 fps a flick shows every ayah for a frame or two)", () => {
    expect(flick.read / AYAHS).toBeLessThan(COMPLETE_SHARE);
    const skimWhole = session(repeat(Math.ceil((AYAHS * AYAH_PX) / 500), { scrollPx: 500, scrollMs: 300, pauseMs: 300 }));
    expect(skimWhole.read / AYAHS).toBeLessThan(COMPLETE_SHARE);
  });
  it("a normal reader through the whole surah completes it", () => {
    const whole = session(repeat(Math.ceil((AYAHS * AYAH_PX) / 500), { scrollPx: 500, scrollMs: 500, pauseMs: 4000 }));
    expect(whole.read / AYAHS).toBeGreaterThanOrEqual(COMPLETE_SHARE);
  });
});
