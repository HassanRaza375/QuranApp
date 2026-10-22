// Phase 4C: a single ayah, a queue (a page or a story chapter) and a clip, through the same engine as the whole-surah player, with a fake element
// and manual timers (tests/audioFakes.ts). Nothing plays by itself, a queue plays on ayah by ayah with no pause and one ayah preloaded ahead,
// a failed ayah is retried once and then stops with Try again and Skip (never skipped silently), and a queue's place has its own additive key.
import { describe, expect, it } from "vitest";
import { LOAD_TIMEOUT_MS, PLAY_ERROR, TIMEOUT_ERROR, ayahFailedMessage } from "../app/lib/audioState";
import { RECITER_NAMES } from "../app/lib/surahAudio";
import { FakeEl, setup } from "./audioFakes";

const R0 = RECITER_NAMES[0]!;
const R1 = RECITER_NAMES[1]!;
const A2 = (a: number) => ({ surah: 2, ayah: a });
const PAGE = { id: "page:49", label: "Page 49", items: [A2(6), A2(7), A2(8)] };
const pageQ = (extra: Record<string, unknown> = {}) => ({ ...PAGE, reciter: R0, kind: "page" as const, ref: { page: 49 }, ...extra });
const ayahUrl = (r: string, s: number, a: number) => `https://audio.test/ayah/${r.replace(/\W+/g, "-")}/${s}_${a}.mp3`;
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("one ayah", () => {
  it("plays the file the endpoint gave for that ayah and reciter; the title is the reference; nothing is saved", async () => {
    const s = setup();
    await s.e.playAyah({ surah: 2, ayah: 255, reciter: R1 });
    expect(s.el().src).toBe(ayahUrl(R1, 2, 255));
    expect(s.e.snapshot.track).toMatchObject({ kind: "ayah", surahNo: 2, ayah: 255, reciter: R1 });
    expect(s.e.snapshot.view).toMatchObject({ title: "Surah 2 2:255", line: `Recited by ${R1}`, mediaTitle: "Surah 2 2:255", artist: R1, album: "Quran App" });
    s.el().meta(30);
    s.el().tick(5);
    s.e.pause();
    s.e.flush();
    expect(s.writes).toEqual([]);
    expect(s.queueWrites).toEqual([]);
  });
  it("Previous and Next are the neighbouring ayahs of the same surah, disabled at its first and last", async () => {
    const s = setup();
    await s.e.playAyah({ surah: 112, ayah: 1, reciter: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: false, canNext: true });
    await s.e.next();
    expect(s.e.snapshot.track).toMatchObject({ kind: "ayah", surahNo: 112, ayah: 2 });
    await s.e.previous();
    expect(s.e.snapshot.track!.ayah).toBe(1);
    await s.e.playAyah({ surah: 112, ayah: 4, reciter: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: true, canNext: false });
    await s.e.next();
    expect(s.e.snapshot.track!.ayah).toBe(4);
  });
  it("repeat plays the same ayah again; without repeat it just stops", async () => {
    const s = setup();
    await s.e.playAyah({ surah: 2, ayah: 255, reciter: R0 });
    s.el().meta(20);
    s.e.setRepeat(true);
    const plays = s.el().plays;
    s.el().end();
    expect(s.el().plays).toBe(plays + 1);
    expect(s.e.snapshot.track!.ayah).toBe(255);
    s.e.setRepeat(false);
    s.el().end();
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0 });
  });
  it("another reciter plays this ayah again at once (from 0); while paused it only changes what Play will play", async () => {
    const s = setup();
    await s.e.playAyah({ surah: 2, ayah: 255, reciter: R0 });
    s.el().meta(20);
    s.el().tick(8);
    await s.e.switchReciter(R1);
    expect(s.el().src).toBe(ayahUrl(R1, 2, 255));
    s.e.pause();
    const plays = s.el().plays;
    await s.e.switchReciter(R0);
    expect(s.el().plays).toBe(plays);
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0, track: { reciter: R0, ayah: 255 } });
  });
  it("a single ayah that cannot be found is asked for once more, then reported with the ayah's number (and no Skip)", async () => {
    const s = setup();
    s.state.ayahFail.add("2:255");
    await s.e.playAyah({ surah: 2, ayah: 255, reciter: R0 });
    await flush();
    expect(s.calls.ayah).toEqual([`2:255|${R0}`, `2:255|${R0}|fresh`]);
    expect(s.e.snapshot).toMatchObject({ status: "error", error: { kind: "failed", message: ayahFailedMessage(2, 255), canSkip: false } });
  });
});

describe("a queue", () => {
  it("plays its first ayah and shows 'ayah 1 of 3'", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    expect(s.el().src).toBe(ayahUrl(R0, 2, 6));
    expect(s.e.snapshot.track).toMatchObject({ kind: "queue", surahNo: 2, ayah: 6, title: "Page 49", queue: { id: "page:49", index: 0, length: 3 } });
    expect(s.e.snapshot.view).toMatchObject({ title: "Page 49", line: "Surah 2 2:6 · ayah 1 of 3", mediaTitle: "Surah 2 2:6", album: "Page 49", artist: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: false, canNext: true });
  });
  it("moves on to the next ayah the moment one ends: no pause between files, and the status never flickers to paused", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    s.snaps.length = 0;
    s.el().end();
    await flush();
    expect(s.el().src).toBe(ayahUrl(R0, 2, 7));
    expect(s.e.snapshot.track!.queue!.index).toBe(1);
    expect(s.snaps.map((x) => x.status)).not.toContain("paused");
    expect(s.timers.filter((t) => t.kind === "t" && t.ms < LOAD_TIMEOUT_MS)).toHaveLength(0); // no gap timer
  });
  it("preloads exactly one ayah ahead, once, and not on a connection that asked to save data", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    await flush();
    expect(s.calls.preload).toEqual([ayahUrl(R0, 2, 7)]);
    s.el().emit("playing"); // again: still once
    await flush();
    expect(s.calls.preload).toHaveLength(1);
    const d = setup();
    d.state.saveData = true;
    await d.e.playQueue(pageQ());
    await flush();
    expect(d.calls.preload).toEqual([]);
    const last = setup();
    await last.e.playQueue(pageQ({ startIndex: 2 }));
    await flush();
    expect(last.calls.preload).toEqual([]); // nothing after the last ayah
  });
  it("stops after its last ayah (it does not carry on into anything else), with the place reset to the first ayah", async () => {
    const s = setup({ autoAdvance: true });
    await s.e.playQueue(pageQ({ startIndex: 2 }));
    s.el().meta(10);
    const els = s.els.length;
    s.el().end();
    await flush();
    expect(s.els.length).toBe(els);
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0, track: { queue: { index: 0 } } });
    expect(s.queueWrites.at(-1)).toMatchObject({ v: 1, kind: "page", ref: { page: 49 }, index: 0, position: 0, reciter: R0 });
    expect(s.writes).toEqual([]); // the legacy surah record is never touched by a queue
  });
  it("Previous and Next move one ayah in the queue, disabled at the ends", async () => {
    const s = setup();
    await s.e.playQueue(pageQ({ startIndex: 1 }));
    expect(s.e.snapshot).toMatchObject({ canPrevious: true, canNext: true });
    await s.e.next();
    expect(s.e.snapshot).toMatchObject({ track: { ayah: 8, queue: { index: 2 } }, canNext: false });
    await s.e.next();
    expect(s.e.snapshot.track!.ayah).toBe(8);
    await s.e.previous();
    await s.e.previous();
    expect(s.e.snapshot).toMatchObject({ track: { ayah: 6 }, canPrevious: false });
    await s.e.previous();
    expect(s.e.snapshot.track!.ayah).toBe(6);
  });
  it("repeat does not apply to a queue (a queue plays through once)", async () => {
    const s = setup();
    await s.e.playQueue(pageQ({ startIndex: 2 }));
    s.el().meta(10);
    s.e.setRepeat(true);
    const plays = s.el().plays;
    s.el().end();
    await flush();
    expect(s.el().plays).toBe(plays);
    expect(s.e.snapshot.status).toBe("paused");
  });
  it("another reciter plays the current ayah again by the new reciter and carries on; while paused it only changes who will recite", async () => {
    const s = setup();
    await s.e.playQueue(pageQ({ startIndex: 1 }));
    await s.e.switchReciter(R1);
    expect(s.el().src).toBe(ayahUrl(R1, 2, 7));
    expect(s.e.snapshot.track).toMatchObject({ reciter: R1, queue: { index: 1 } });
    s.e.pause();
    const plays = s.el().plays;
    await s.e.switchReciter(R0);
    expect(s.el().plays).toBe(plays);
    expect(s.queueWrites.at(-1)).toMatchObject({ index: 1, reciter: R0, position: 0 });
    await s.e.toggle();
    expect(s.el().src).toBe(ayahUrl(R0, 2, 7));
  });
});

describe("a failed ayah in a queue is never skipped silently", () => {
  it("is asked for once more automatically; if that works the queue carries on and nothing is shown", async () => {
    const s = setup();
    s.state.ayahFail.add("2:7");
    s.state.ayahFailOnce.add("2:7"); // fails the first time, works when asked fresh
    await s.e.playQueue(pageQ());
    s.el().end();
    await flush();
    await flush();
    expect(s.calls.ayah.filter((c) => c === `2:7|${R0}|fresh`)).toHaveLength(1); // asked again, once (the plain asks are the preload and the first try)
    expect(s.e.snapshot).toMatchObject({ status: "playing", error: null, track: { ayah: 7 } });
  });
  it("then stops on it with the message, Try again and Skip; Try again asks once more; Skip goes on to the next ayah", async () => {
    const s = setup();
    s.state.ayahFail.add("2:7");
    await s.e.playQueue(pageQ());
    s.el().end();
    await flush();
    await flush();
    expect(s.e.snapshot).toMatchObject({ status: "error", track: { ayah: 7, queue: { index: 1 } }, error: { kind: "failed", message: ayahFailedMessage(2, 7), canSkip: true } });
    await s.e.retry();
    await flush();
    expect(s.e.snapshot.status).toBe("error"); // still failing: asked again, still stopped
    expect(s.calls.ayah.filter((c) => c.startsWith("2:7")).length).toBeGreaterThanOrEqual(4);
    await s.e.skipAyah();
    await flush();
    expect(s.e.snapshot).toMatchObject({ status: "playing", track: { ayah: 8 }, error: null });
  });
  it("Skip on the last ayah ends the queue", async () => {
    const s = setup();
    s.state.ayahFail.add("2:8");
    await s.e.playQueue(pageQ({ startIndex: 2 }));
    await flush();
    await flush();
    expect(s.e.snapshot.error?.canSkip).toBe(true);
    await s.e.skipAyah();
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0, track: { queue: { index: 0 } } });
  });
  it("a load that times out in a queue can be skipped too", async () => {
    const s = setup();
    const orig = FakeEl.prototype.play;
    FakeEl.prototype.play = async function (this: FakeEl) {
      this.plays++;
    };
    try {
      await s.e.playQueue(pageQ());
      s.fire("t", LOAD_TIMEOUT_MS);
      expect(s.e.snapshot.error).toMatchObject({ kind: "timeout", message: TIMEOUT_ERROR, canSkip: true });
    } finally {
      FakeEl.prototype.play = orig;
    }
  });
});

describe("a queue's saved place", () => {
  it("is written to its own additive key (not the legacy record) every 5 seconds, on pause and when the page is hidden", async () => {
    const s = setup();
    await s.e.playQueue(pageQ({ startIndex: 1 }));
    s.el().meta(30);
    s.el().tick(12);
    s.fire("i");
    expect(s.queueWrites.at(-1)).toMatchObject({ v: 1, kind: "page", ref: { page: 49 }, index: 1, reciter: R0, position: 12 });
    expect(typeof s.queueWrites.at(-1)!.savedAt).toBe("number");
    expect(Object.keys(s.queueWrites.at(-1)!)).toEqual(["v", "kind", "ref", "index", "reciter", "position", "savedAt"]);
    s.el().tick(20);
    s.e.pause();
    expect(s.queueWrites.at(-1)!.position).toBe(20);
    s.el().tick(25);
    s.e.flush();
    expect(s.queueWrites.at(-1)!.position).toBe(25);
    expect(s.writes).toEqual([]);
  });
  it("a story chapter is saved by its story and chapter, not by its list of ayahs", async () => {
    const s = setup();
    await s.e.playQueue({ id: "story:yusufstory:2", label: "The well", items: [A2(1)], reciter: R0, kind: "story", ref: { storyId: "yusufstory", chapter: 2 } });
    s.el().meta(10);
    s.e.pause();
    expect(s.queueWrites.at(-1)).toMatchObject({ kind: "story", ref: { storyId: "yusufstory", chapter: 2 }, index: 0 });
    expect(JSON.stringify(s.queueWrites.at(-1))).not.toContain("items");
  });
  it("starting a surah clears the queue's record (the last thing started is what a reload shows); starting a queue leaves the surah's record alone", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    expect(s.calls.cleared).toBe(0);
    await s.e.playSurah({ surahNo: 3, title: "Surah 3", reciter: R0 });
    expect(s.calls.cleared).toBe(1);
    expect(s.writes).toEqual([]);
  });
  it("restore shows the saved queue paused at its ayah and place, without creating an element or playing; Play goes on from there and carries on", async () => {
    const s = setup({
      queueRecord: { kind: "page", ref: { page: 49 }, index: 1, reciter: R1, position: 9 },
      builder: (k, ref) => (k === "page" && "page" in ref && ref.page === 49 ? PAGE : null),
      resume: { surahNo: 18, title: "Al-Kahf", reciter: R0, position: 5 },
    });
    await s.e.restore();
    expect(s.e.snapshot).toMatchObject({ status: "restored", position: 9, track: { kind: "queue", reciter: R1, ayah: 7, queue: { id: "page:49", index: 1, length: 3 } } });
    expect(s.els).toHaveLength(0);
    await s.e.toggle();
    expect(s.el().src).toBe(ayahUrl(R1, 2, 7));
    s.el().meta(40);
    expect(s.el().currentTime).toBe(9);
    s.el().end();
    await flush();
    expect(s.e.snapshot.track!.ayah).toBe(8);
  });
  it("a saved queue that cannot be rebuilt (gone, or the index is past its end) falls back to the saved surah", async () => {
    for (const builder of [() => null, () => ({ ...PAGE, items: [A2(1)] })]) {
      const s = setup({ queueRecord: { kind: "page", ref: { page: 49 }, index: 2, reciter: R0, position: 3 }, builder, resume: { surahNo: 18, title: "Al-Kahf", reciter: R0, position: 5 } });
      await s.e.restore();
      expect(s.e.snapshot).toMatchObject({ status: "restored", track: { kind: "surah", surahNo: 18 } });
    }
  });
});

describe("a clip", () => {
  const clip = { id: "name:12", title: "Al-Bari", subtitle: "Asma-ul-Husna", url: "https://names.test/12.mp3" };
  it("plays its own file, with no reciter, no previous or next, nothing saved, and no repeat", async () => {
    const s = setup();
    await s.e.playClip(clip);
    expect(s.el().src).toBe(clip.url);
    expect(s.e.snapshot.track).toMatchObject({ kind: "clip", reciter: "", surahNo: 0 });
    expect(s.e.snapshot.view).toMatchObject({ title: "Al-Bari", line: "Asma-ul-Husna", mediaTitle: "Al-Bari", artist: "Asma-ul-Husna" });
    expect(s.e.snapshot).toMatchObject({ canPrevious: false, canNext: false });
    s.el().meta(5);
    s.e.setRepeat(true);
    s.el().end();
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0 });
    expect(s.writes).toEqual([]);
    expect(s.queueWrites).toEqual([]);
    const plays = s.el().plays;
    await s.e.switchReciter(R1);
    expect(s.el().plays).toBe(plays);
  });
  it("a clip that cannot play says so with the standard message (and no Skip)", async () => {
    const s = setup();
    await s.e.playClip(clip);
    s.el().emit("error");
    expect(s.e.snapshot.error).toEqual({ kind: "failed", message: PLAY_ERROR, canSkip: false });
  });
});

describe("one thing plays at a time, and nothing starts by itself", () => {
  it("starting an ayah replaces a queue, and the replaced queue does not move on", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    await s.e.playAyah({ surah: 112, ayah: 1, reciter: R0 });
    s.el().meta(10);
    s.el().end();
    await flush();
    expect(s.e.snapshot).toMatchObject({ status: "paused", track: { kind: "ayah", surahNo: 112 } });
    expect(s.el().src).toBe(ayahUrl(R0, 112, 1)); // the element never went on to the queue's next ayah
  });
  it("restoring and flushing play nothing and create no element", async () => {
    const s = setup({ queueRecord: { kind: "page", ref: { page: 49 }, index: 0, reciter: R0, position: 1 }, builder: () => PAGE });
    await s.e.restore();
    s.e.flush();
    expect(s.els).toHaveLength(0);
    expect(s.calls.ayah).toEqual([]);
  });
  it("Media Session metadata follows the kind: the ayah reference as the title, the reciter as the artist, the queue's label as the album", async () => {
    const s = setup();
    await s.e.playQueue(pageQ());
    const v = s.e.snapshot.view!;
    expect([v.mediaTitle, v.artist, v.album]).toEqual(["Surah 2 2:6", R0, "Page 49"]);
  });
});
