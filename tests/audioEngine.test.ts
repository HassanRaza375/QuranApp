// Phase 4B: the player engine with a fake audio element and manual timers. Every rule the plan lists: nothing plays by itself, seeking after
// metadata, speed, repeat, auto-next to 114, previous/next, reciter switch from 0, resume (saved every 5 s, on pause, at the end), honest
// errors (failed, blocked, timed out, never an endless spinner), retry, and the Media Session wiring.
import { describe, expect, it } from "vitest";
import { AudioEngine, type AudioLike, type EngineDeps, type Snapshot } from "../app/lib/audioEngine";
import { LOAD_TIMEOUT_MS, PLAY_ERROR, SAVE_EVERY_MS, TIMEOUT_ERROR, BLOCKED_NOTE, type ResumeRecord, type RestoredTrack } from "../app/lib/audioState";
import { bindMediaSession, type MediaSessionLike } from "../app/lib/mediaSession";
import { RECITER_NAMES } from "../app/lib/surahAudio";

const R0 = RECITER_NAMES[0]!;
const R1 = RECITER_NAMES[1]!;

class FakeEl implements AudioLike {
  private _src = "";
  get src() {
    return this._src;
  }
  set src(v: string) {
    this._src = v;
    this.currentTime = 0; // a real element starts a new file at 0
  }
  preload = "";
  playbackRate = 1;
  currentTime = 0;
  duration = NaN;
  paused = true;
  ended = false;
  plays = 0;
  playError: string | null = null;
  private h: Record<string, (() => void)[]> = {};
  addEventListener(n: string, f: () => void) {
    (this.h[n] ??= []).push(f);
  }
  emit(n: string) {
    (this.h[n] ?? []).forEach((f) => f());
  }
  async play() {
    this.plays++;
    if (this.playError) {
      const e = new Error(this.playError);
      e.name = this.playError;
      throw e;
    }
    this.paused = false;
    this.ended = false;
    this.emit("playing");
  }
  pause() {
    this.paused = true;
    this.emit("pause");
  }
  // test helpers: what a browser does
  meta(duration: number) {
    this.duration = duration;
    this.emit("loadedmetadata");
  }
  tick(t: number) {
    this.currentTime = t;
    this.emit("timeupdate");
  }
  end() {
    this.ended = true;
    this.paused = true;
    this.currentTime = this.duration;
    this.emit("pause");
    this.emit("ended");
  }
}

function setup(opts: Partial<EngineDeps> & { resume?: RestoredTrack | null; autoAdvance?: boolean } = {}) {
  const { resume, autoAdvance, ...over } = opts;
  const els: FakeEl[] = [];
  const writes: ResumeRecord[] = [];
  const timers: { fn: () => void; ms: number; kind: "i" | "t"; id: number; live: boolean }[] = [];
  let repeat = false;
  const state = { autoAdvance: autoAdvance ?? false, rate: 1, resolveGate: null as Promise<void> | null };
  const snaps: Snapshot[] = [];
  const deps: EngineDeps = {
    create: () => {
      const e = new FakeEl();
      els.push(e);
      return e;
    },
    resolve: async (s, r) => {
      if (state.resolveGate) await state.resolveGate;
      return r === "Nobody" ? null : `https://audio.test/${r.replace(/\W+/g, "-")}/${s}.mp3`;
    },
    surahTitle: (n) => `Surah ${n}`,
    readResume: () => resume ?? null,
    writeResume: (r) => void writes.push(JSON.parse(JSON.stringify(r))),
    readRepeat: () => repeat,
    writeRepeat: (on) => void (repeat = on),
    autoAdvance: () => state.autoAdvance,
    rate: () => state.rate,
    setInterval: (fn, ms) => (timers.push({ fn, ms, kind: "i", id: timers.length, live: true }), timers.length - 1),
    clearInterval: (h) => void (timers[h as number]!.live = false),
    setTimeout: (fn, ms) => (timers.push({ fn, ms, kind: "t", id: timers.length, live: true }), timers.length - 1),
    clearTimeout: (h) => void (timers[h as number]!.live = false),
    ...over,
  };
  const e = new AudioEngine(deps, (s) => snaps.push(s));
  const fire = (kind: "i" | "t", ms?: number) => timers.filter((t) => t.live && t.kind === kind && (ms === undefined || t.ms === ms)).forEach((t) => (t.fn(), kind === "t" && (t.live = false)));
  return { e, els, writes, timers, state, snaps, fire, el: () => els[els.length - 1]! };
}
const T = { surahNo: 2, title: "Al-Baqara", reciter: R0 };

describe("nothing plays by itself", () => {
  it("restore shows the saved item paused and creates no element, makes no request, plays nothing", () => {
    const s = setup({ resume: { surahNo: 18, title: "Al-Kahf", reciter: R1, position: 754 } });
    s.e.restore();
    expect(s.e.snapshot).toMatchObject({ status: "restored", track: { surahNo: 18, reciter: R1 }, position: 754, seekable: false });
    expect(s.els).toHaveLength(0);
    expect(s.writes).toHaveLength(0);
  });
  it("restore with no saved record leaves the player idle and empty", () => {
    const s = setup();
    s.e.restore();
    expect(s.e.snapshot).toMatchObject({ status: "idle", track: null });
  });
  it("Play on a restored item starts it, and only from the saved place after the metadata has arrived", async () => {
    const s = setup({ resume: { surahNo: 18, title: "Al-Kahf", reciter: R1, position: 754 } });
    s.e.restore();
    await s.e.toggle();
    const el = s.el();
    expect(el.src).toBe(`https://audio.test/${R1.replace(/\W+/g, "-")}/18.mp3`);
    expect(el.currentTime).toBe(0); // not yet: the file has not said how long it is
    el.meta(3600);
    expect(el.currentTime).toBe(754);
    expect(s.e.snapshot).toMatchObject({ status: "playing", position: 754, duration: 3600, seekable: true });
  });
  it("the saved place is clamped to the file's length", async () => {
    const s = setup({ resume: { surahNo: 112, title: "Al-Ikhlas", reciter: R0, position: 9999 } });
    s.e.restore();
    await s.e.toggle();
    s.el().meta(52);
    expect(s.el().currentTime).toBe(52);
  });
});

describe("playing, pausing, seeking, speed", () => {
  it("plays a surah by reciter name, reports loading then playing, and applies the speed", async () => {
    const s = setup();
    s.state.rate = 1.5;
    await s.e.playSurah(T);
    expect(s.el().playbackRate).toBe(1.5);
    expect(s.e.snapshot.status).toBe("playing");
    expect(s.snaps.map((x) => x.status)).toContain("loading");
  });
  it("pause then toggle plays the same file on from where it was (it does not reload)", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().tick(42);
    s.e.pause();
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 42 });
    const src = s.el().src;
    await s.e.toggle();
    expect(s.el().src).toBe(src);
    expect(s.e.snapshot.status).toBe("playing");
    expect(s.el().currentTime).toBe(42);
  });
  it("seeks only once the length is known, clamps to it, and skip moves by 10 seconds", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.e.seek(100);
    expect(s.el().currentTime).toBe(0); // before metadata: ignored
    s.el().meta(600);
    s.e.seek(100);
    expect(s.el().currentTime).toBe(100);
    s.e.skipForward();
    expect(s.el().currentTime).toBe(110);
    s.e.skipBack();
    s.e.skipBack();
    expect(s.el().currentTime).toBe(90);
    s.e.seek(-5);
    expect(s.el().currentTime).toBe(0);
    s.e.seek(9999);
    expect(s.el().currentTime).toBe(600);
    s.e.skipForward();
    expect(s.el().currentTime).toBe(600);
  });
  it("the position follows the element's time", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().tick(12.4);
    expect(s.e.snapshot.position).toBe(12.4);
  });
  it("a speed change reaches the element at once", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.e.setRate(0.75);
    expect(s.el().playbackRate).toBe(0.75);
  });
  it("buffering is a state with its own name, and playing resumes it", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().emit("waiting");
    expect(s.e.snapshot.status).toBe("buffering");
    s.el().emit("playing");
    expect(s.e.snapshot.status).toBe("playing");
  });
});

describe("repeat and auto-next", () => {
  it("repeat plays the same recitation again, and is stored", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.e.setRepeat(true);
    expect(s.e.snapshot.repeat).toBe(true);
    const plays = s.el().plays;
    s.el().end();
    expect(s.el().currentTime).toBe(0);
    expect(s.el().plays).toBe(plays + 1);
    expect(s.e.snapshot.status).toBe("playing");
  });
  it("auto-next plays the next surah with the same reciter when the setting is on", async () => {
    const s = setup({ autoAdvance: true });
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().end();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(s.e.snapshot.track).toMatchObject({ surahNo: 3, title: "Surah 3", reciter: R0 });
    expect(s.el().src).toMatch(/\/3\.mp3$/);
  });
  it("with auto-next off the surah just stops at its end, and the saved place is 0", async () => {
    const s = setup({ autoAdvance: false });
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().end();
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0 });
    expect(s.writes.at(-1)!.position).toBe(0);
  });
  it("auto-next stops after surah 114", async () => {
    const s = setup({ autoAdvance: true });
    await s.e.playSurah({ surahNo: 114, title: "An-Nas", reciter: R0 });
    s.el().meta(100);
    const before = s.els.length;
    s.el().end();
    await new Promise((r) => setTimeout(r, 0));
    expect(s.e.snapshot).toMatchObject({ status: "paused", track: { surahNo: 114 } });
    expect(s.els.length).toBe(before);
  });
});

describe("previous and next surah", () => {
  it("move one surah with the same reciter; the ends are disabled", async () => {
    const s = setup();
    await s.e.playSurah({ surahNo: 1, title: "Al-Faatiha", reciter: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: false, canNext: true });
    await s.e.previous(); // nothing before surah 1
    expect(s.e.snapshot.track!.surahNo).toBe(1);
    await s.e.next();
    expect(s.e.snapshot.track).toMatchObject({ surahNo: 2, reciter: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: true, canNext: true });
    await s.e.playSurah({ surahNo: 114, title: "An-Nas", reciter: R0 });
    expect(s.e.snapshot).toMatchObject({ canPrevious: true, canNext: false });
    await s.e.next();
    expect(s.e.snapshot.track!.surahNo).toBe(114);
  });
});

describe("switching reciter restarts from the beginning", () => {
  it("while playing it plays the new reciter's file from 0 at once", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().tick(300);
    await s.e.switchReciter(R1);
    expect(s.e.snapshot.track).toMatchObject({ surahNo: 2, reciter: R1 });
    expect(s.el().src).toContain(R1.replace(/\W+/g, "-"));
    expect(s.e.snapshot.position).toBe(0);
    s.el().meta(700);
    expect(s.el().currentTime).toBe(0); // not 300: the timing is another file's
  });
  it("while paused it only changes what Play will play (never an autoplay), from 0", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().tick(300);
    s.e.pause();
    const plays = s.el().plays;
    await s.e.switchReciter(R1);
    expect(s.el().plays).toBe(plays);
    expect(s.e.snapshot).toMatchObject({ status: "paused", position: 0, track: { reciter: R1 } });
    expect(s.writes.at(-1)!.nowPlaying.reciter).toBe(R1);
    expect(s.writes.at(-1)!.position).toBe(0);
    await s.e.toggle();
    expect(s.el().src).toContain(R1.replace(/\W+/g, "-"));
  });
  it("the same reciter again does nothing", async () => {
    const s = setup();
    await s.e.playSurah(T);
    const plays = s.el().plays;
    await s.e.switchReciter(R0);
    expect(s.el().plays).toBe(plays);
  });
});

describe("the resume record", () => {
  it("is saved every 5 seconds while playing, on pause and when the page is hidden, and not when nothing plays", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    expect(s.timers.some((t) => t.kind === "i" && t.ms === SAVE_EVERY_MS && t.live)).toBe(true);
    s.el().tick(30);
    s.fire("i");
    expect(s.writes.at(-1)).toMatchObject({ position: 30, nowPlaying: { type: "surah", surahNo: 2, title: "Al-Baqara", subtitle: R0, reciter: R0 } });
    expect(s.writes.at(-1)!.url).toContain("/2.mp3");
    s.el().tick(41);
    s.e.pause();
    expect(s.writes.at(-1)!.position).toBe(41);
    expect(s.timers.filter((t) => t.kind === "i" && t.live)).toHaveLength(0); // the timer stops with the audio
    const n = s.writes.length;
    s.fire("i");
    expect(s.writes.length).toBe(n);
    s.el().tick(50);
    s.e.flush(); // pagehide while paused
    expect(s.writes.at(-1)!.position).toBe(50);
  });
  it("flush while idle or restored writes nothing", () => {
    const s = setup({ resume: { surahNo: 5, title: "Al-Maaida", reciter: R0, position: 9 } });
    s.e.flush();
    s.e.restore();
    s.e.flush();
    expect(s.writes).toHaveLength(0);
  });
});

describe("honest errors, never a spinner that does not end", () => {
  it("a surah with no file for that reciter fails with the connection-honest message", async () => {
    const s = setup();
    await s.e.playSurah({ ...T, reciter: "Nobody" });
    expect(s.e.snapshot).toMatchObject({ status: "error", error: { kind: "failed", message: PLAY_ERROR } });
  });
  it("a file the browser cannot play (play() rejects, or the element reports an error) is an error", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().emit("error");
    expect(s.e.snapshot.error).toEqual({ kind: "failed", message: PLAY_ERROR });
    const t = setup();
    t.e.restore();
    await t.e.playSurah(T);
    t.el().playError = "NotSupportedError";
    await t.e.retry();
    expect(t.e.snapshot.error?.kind).toBe("failed");
  });
  it("a browser that blocks play() says 'Tap Play to start.'", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().playError = "NotAllowedError";
    await s.e.retry();
    expect(s.e.snapshot.error).toEqual({ kind: "blocked", message: BLOCKED_NOTE });
  });
  it("a load that never produces metadata times out into an error with Try again", async () => {
    const s = setup();
    const orig = FakeEl.prototype.play;
    FakeEl.prototype.play = async function (this: FakeEl) {
      this.plays++; // a file that never starts: no 'playing' event
    };
    try {
      await s.e.playSurah(T);
      expect(s.e.snapshot.status).toBe("loading");
      expect(s.timers.find((t) => t.kind === "t" && t.ms === LOAD_TIMEOUT_MS && t.live)).toBeTruthy();
      s.fire("t", LOAD_TIMEOUT_MS);
      expect(s.e.snapshot).toMatchObject({ status: "error", error: { kind: "timeout", message: TIMEOUT_ERROR } });
    } finally {
      FakeEl.prototype.play = orig;
    }
  });
  it("the timer is cancelled once the file starts, so a playing surah is never reported as timed out", async () => {
    const s = setup();
    await s.e.playSurah(T);
    expect(s.timers.filter((t) => t.kind === "t" && t.live)).toHaveLength(0);
  });
  it("Try again plays from the place that was reached, with the same surah and reciter", async () => {
    const s = setup();
    await s.e.playSurah(T);
    s.el().meta(600);
    s.el().tick(200);
    s.el().emit("error");
    await s.e.retry();
    s.els.at(-1)!.meta(600);
    expect(s.e.snapshot.error).toBeNull();
    expect(s.e.snapshot).toMatchObject({ status: "playing", track: { surahNo: 2, reciter: R0 } });
    expect(s.el().currentTime).toBe(200);
  });
  it("pausing during a load cancels it: the file that was still being looked up does not start", async () => {
    const s = setup();
    let release!: () => void;
    s.state.resolveGate = new Promise<void>((r) => (release = r));
    const p = s.e.playSurah(T);
    s.e.pause();
    release();
    await p;
    expect(s.el().plays).toBe(0);
    expect(s.e.snapshot.status).not.toBe("playing");
  });
  it("a newer request wins over an older one", async () => {
    const s = setup();
    let release!: () => void;
    s.state.resolveGate = new Promise<void>((r) => (release = r));
    const a = s.e.playSurah(T);
    const b = s.e.playSurah({ surahNo: 3, title: "Aal-i-Imraan", reciter: R0 });
    release();
    await Promise.all([a, b]);
    expect(s.e.snapshot.track!.surahNo).toBe(3);
    expect(s.el().src).toMatch(/\/3\.mp3$/);
  });
});

describe("Media Session", () => {
  function stub() {
    const handlers: Record<string, ((d: { seekTime?: number; seekOffset?: number }) => void) | null> = {};
    const ms: MediaSessionLike & { positions: unknown[] } = {
      metadata: null,
      playbackState: "none",
      positions: [],
      setActionHandler: (a, h) => void (handlers[a] = h),
      setPositionState: (st) => void ms.positions.push(st),
    };
    class Meta {
      constructor(public init: { title: string; artist: string; album: string }) {}
    }
    const calls: string[] = [];
    const ctl = { play: () => calls.push("play"), pause: () => calls.push("pause"), seekTo: (t: number) => calls.push(`seekto ${t}`), skip: (d: number) => calls.push(`skip ${d}`), next: () => calls.push("next"), previous: () => calls.push("previous") };
    return { ms, handlers, Meta, calls, bind: () => bindMediaSession(ms, Meta, ctl) };
  }
  const snap = (over: Partial<Snapshot> = {}): Snapshot => ({ track: { surahNo: 2, title: "Al-Baqara", reciter: R0 }, status: "playing", error: null, position: 10, duration: 600, repeat: false, seekable: true, canPrevious: true, canNext: true, ...over });

  it("sets the surah and the reciter as the metadata, and the state", () => {
    const m = stub();
    const b = m.bind();
    b.sync(snap(), 1);
    expect(m.ms.metadata).toMatchObject({ init: { title: "Al-Baqara", artist: R0, album: "Quran App" } });
    expect(m.ms.playbackState).toBe("playing");
    b.sync(snap({ status: "paused" }), 1);
    expect(m.ms.playbackState).toBe("paused");
    b.sync(snap({ track: null, status: "idle" }), 1);
    expect(m.ms.playbackState).toBe("none");
    expect(m.ms.metadata).toBeNull();
  });
  it("the lock-screen actions call the player: play, pause, seekto, 10-second skips and previous/next", () => {
    const m = stub();
    m.bind().sync(snap(), 1);
    m.handlers.play!({});
    m.handlers.pause!({});
    m.handlers.seekto!({ seekTime: 123 });
    m.handlers.seekbackward!({});
    m.handlers.seekforward!({});
    m.handlers.seekforward!({ seekOffset: 30 });
    m.handlers.previoustrack!({});
    m.handlers.nexttrack!({});
    expect(m.calls).toEqual(["play", "pause", "seekto 123", "skip -10", "skip 10", "skip 30", "previous", "next"]);
  });
  it("previous and next are removed where there is no previous or next surah", () => {
    const m = stub();
    const b = m.bind();
    b.sync(snap({ track: { surahNo: 1, title: "Al-Faatiha", reciter: R0 }, canPrevious: false }), 1);
    expect(m.handlers.previoustrack).toBeNull();
    expect(typeof m.handlers.nexttrack).toBe("function");
    b.sync(snap({ track: { surahNo: 114, title: "An-Nas", reciter: R0 }, canNext: false }), 1);
    expect(m.handlers.nexttrack).toBeNull();
  });
  it("the position is reported at most once a second and only when the length is known", () => {
    const m = stub();
    const b = m.bind();
    b.sync(snap({ duration: 0 }), 1);
    expect(m.ms.positions).toHaveLength(0);
    b.sync(snap({ position: 10 }), 1.5);
    b.sync(snap({ position: 10.4 }), 1.5);
    b.sync(snap({ position: 11.2 }), 1.5);
    expect(m.ms.positions).toEqual([{ duration: 600, position: 10, playbackRate: 1.5 }, { duration: 600, position: 11.2, playbackRate: 1.5 }]);
  });
  it("a browser without the API is simply skipped, and an unknown action does not throw", () => {
    expect(() => bindMediaSession(undefined, undefined, { play() {}, pause() {}, seekTo() {}, skip() {}, next() {}, previous() {} }).sync(snap(), 1)).not.toThrow();
    const ms: MediaSessionLike = { metadata: null, playbackState: "none", setActionHandler: () => { throw new Error("unsupported action"); } };
    expect(() => bindMediaSession(ms, undefined, { play() {}, pause() {}, seekTo() {}, skip() {}, next() {}, previous() {} }).sync(snap(), 1)).not.toThrow();
  });
});
