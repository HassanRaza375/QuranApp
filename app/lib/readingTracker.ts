// What counts as "read" in the reader. Pure (the page feeds it what the browser reports), so the rules are unit-tested.
//
// Three separate things, deliberately:
//  1. The resume position (legacy rule, unchanged): the last ayah whose top is above 35% of the viewport, written after the
//     scroll has been still for 400 ms. Ayah 1 is not written on open (it is the starting point), so merely opening a surah
//     changes nothing until you scroll on.
//  2. The daily log (goals): every ayah that stayed on screen for DWELL_MS (1.5 s) in total while the tab was visible.
//     The legacy reader logged only the one ayah the 400 ms pause happened to land on, so a steady scroll skipped most of
//     them; a fast flick logs none here.
//  3. Completed: the last ayah is reached AND at least 90% of the ayahs were counted as read (rule 2) in this visit, so a link
//     straight to the end, a jump with the scrollbar, a fast flick, or a skim does not complete a surah.

export const LINE = 0.35;
export const PROGRESS_DEBOUNCE_MS = 400;
export const DWELL_MS = 1500;
export const COMPLETE_SHARE = 0.9;

/** The legacy rule: the last ayah whose top edge is at or above `threshold` (the first ayah when none is). `tops` is in page order. */
export function currentAyah(tops: number[], threshold: number): number {
  let current = 1;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i]! <= threshold) current = i + 1;
    else break;
  }
  return current;
}

export class ReadingTracker {
  private visibleSince = new Map<number, number>();
  private dwellMs = new Map<number, number>();
  private counted = new Set<number>();
  lastTracked = 1;

  constructor(readonly total: number) {}

  /** An ayah came on screen at time `t`. */
  show(n: number, t: number) {
    if (!this.visibleSince.has(n)) this.visibleSince.set(n, t);
  }

  /** An ayah left the screen: its time so far is added. */
  hide(n: number, t: number) {
    const s = this.visibleSince.get(n);
    if (s !== undefined) this.dwellMs.set(n, (this.dwellMs.get(n) ?? 0) + Math.max(0, t - s));
    this.visibleSince.delete(n);
  }

  /** The tab was hidden or lost: time stops counting until `resume`. */
  pause(t: number) {
    for (const n of [...this.visibleSince.keys()]) this.hide(n, t);
    this.paused = true;
  }
  private paused = false;
  /** Ayahs that are still on screen start counting again from `t`. */
  resume(visibleNow: number[], t: number) {
    this.paused = false;
    for (const n of visibleNow) this.visibleSince.set(n, t);
  }

  /** The ayahs whose total time on screen has now reached DWELL_MS and were not yet counted. */
  tick(t: number): number[] {
    if (this.paused) return [];
    const out: number[] = [];
    for (const [n, since] of this.visibleSince) {
      if (this.counted.has(n)) continue;
      if ((this.dwellMs.get(n) ?? 0) + (t - since) >= DWELL_MS) {
        this.counted.add(n);
        out.push(n);
      }
    }
    return out.sort((a, b) => a - b);
  }

  /** Whether the resume position should be written for `current` (not for the ayah the visit started on). */
  shouldWriteProgress(current: number): boolean {
    if (current === this.lastTracked) return false;
    this.lastTracked = current;
    return true;
  }

  /** How many ayahs have been counted as read in this visit. */
  get read(): number {
    return this.counted.size;
  }

  isComplete(current: number): boolean {
    return this.total > 0 && current >= this.total && this.counted.size / this.total >= COMPLETE_SHARE;
  }
}
