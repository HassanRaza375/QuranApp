// Shared fakes for the player tests: a fake audio element and an engine set up with fake dependencies and manual timers.
import { AudioEngine, type AudioLike, type BuiltQueue, type EngineDeps, type Snapshot } from "../app/lib/audioEngine";
import type { QueueRecord, ResumeRecord, RestoredQueue, RestoredTrack } from "../app/lib/audioState";

export class FakeEl implements AudioLike {
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

export function setup(opts: Partial<EngineDeps> & { resume?: RestoredTrack | null; autoAdvance?: boolean; queueRecord?: RestoredQueue | null; builder?: (k: "page" | "story", ref: RestoredQueue["ref"]) => BuiltQueue | null } = {}) {
  const { resume, autoAdvance, queueRecord, builder, ...over } = opts;
  const queueWrites: QueueRecord[] = [];
  const calls = { ayah: [] as string[], preload: [] as string[], cleared: 0 };
  const els: FakeEl[] = [];
  const writes: ResumeRecord[] = [];
  const timers: { fn: () => void; ms: number; kind: "i" | "t"; id: number; live: boolean }[] = [];
  let repeat = false;
  const state = { autoAdvance: autoAdvance ?? false, rate: 1, resolveGate: null as Promise<void> | null, saveData: false, ayahFail: new Set<string>(), ayahFailOnce: new Set<string>(), ayahHook: null as null | ((n: number) => Promise<void> | void) };
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
    resolveAyah: async (s, a, r, fresh) => {
      calls.ayah.push(`${s}:${a}|${r}${fresh ? "|fresh" : ""}`);
      await state.ayahHook?.(calls.ayah.length);
      if (state.ayahFail.has(`${s}:${a}`) && !(fresh && state.ayahFailOnce.has(`${s}:${a}`))) return null;
      return `https://audio.test/ayah/${r.replace(/\W+/g, "-")}/${s}_${a}.mp3`;
    },
    preload: (u) => void calls.preload.push(u),
    saveData: () => state.saveData,
    surahTitle: (n) => {
      if (n < 1 || n > 114) throw new TypeError(`no surah ${n}`); // like the real list: a clip has no surah, and asking for its title would crash
      return `Surah ${n}`;
    },
    ayahCount: (n) => ({ 1: 7, 2: 286, 112: 4, 113: 5, 114: 6 })[n] ?? 10,
    readResume: () => resume ?? null,
    writeResume: (r) => void writes.push(JSON.parse(JSON.stringify(r))),
    readQueue: () => queueRecord ?? null,
    writeQueue: (r) => void queueWrites.push(JSON.parse(JSON.stringify(r))),
    clearQueue: () => void calls.cleared++,
    buildQueue: async (kind, ref) => (builder ? builder(kind, ref) : null),
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
  return { e, els, writes, queueWrites, calls, timers, state, snaps, fire, el: () => els[els.length - 1]! };
}
