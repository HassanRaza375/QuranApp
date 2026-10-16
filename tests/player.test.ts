// The small player store: play, pause, switch, resume, error, a stale request. A fake audio element stands in for the browser's.
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { PLAY_ERROR, usePlayerStore } from "../app/stores/player";

class FakeAudio {
  static last: FakeAudio;
  static failNext = false;
  src = "";
  preload = "";
  playbackRate = 1;
  private handlers: Record<string, (() => void)[]> = {};
  constructor() {
    FakeAudio.last = this;
  }
  addEventListener(name: string, fn: () => void) {
    (this.handlers[name] ??= []).push(fn);
  }
  emit(name: string) {
    this.handlers[name]?.forEach((f) => f());
  }
  async play() {
    if (FakeAudio.failNext) {
      FakeAudio.failNext = false;
      this.emit("error");
      throw new Error("NotSupportedError");
    }
    this.emit("playing");
  }
  pause() {
    this.emit("pause");
  }
}

beforeEach(() => {
  setActivePinia(createPinia());
  FakeAudio.failNext = false;
  (globalThis as unknown as { Audio: typeof FakeAudio }).Audio = FakeAudio;
});

const fatiha = { surahNo: 1, title: "Al-Faatiha", reciter: "Mishary Rashid Al Afasy" };

describe("player store", () => {
  it("plays a surah from the reciter's file and reports it", async () => {
    const p = usePlayerStore();
    await p.playSurah({ ...fatiha, rate: 1.5 });
    expect(p.playing).toBe(true);
    expect(p.loading).toBe(false);
    expect(p.error).toBeNull();
    expect(p.nowPlaying).toMatchObject({ surahNo: 1, title: "Al-Faatiha", reciter: fatiha.reciter, subtitle: "Recited by Mishary Rashid Al Afasy" });
    expect(FakeAudio.last.src).toMatch(/^https:\/\/.+\.mp3$/);
    expect(FakeAudio.last.playbackRate).toBe(1.5);
  });
  it("pauses, and the mini player's toggle resumes the same file", async () => {
    const p = usePlayerStore();
    await p.playSurah(fatiha);
    const src = FakeAudio.last.src;
    p.pause();
    expect(p.playing).toBe(false);
    expect(p.nowPlaying).not.toBeNull();
    await p.toggle();
    expect(p.playing).toBe(true);
    expect(FakeAudio.last.src).toBe(src);
    await p.toggle();
    expect(p.playing).toBe(false);
  });
  it("switching surah or reciter loads the other file", async () => {
    const p = usePlayerStore();
    await p.playSurah(fatiha);
    const first = FakeAudio.last.src;
    await p.playSurah({ surahNo: 2, title: "Al-Baqara", reciter: fatiha.reciter });
    expect(p.nowPlaying?.surahNo).toBe(2);
    expect(FakeAudio.last.src).not.toBe(first);
    const second = FakeAudio.last.src;
    await p.playSurah({ surahNo: 2, title: "Al-Baqara", reciter: "Hani Ar Rifai" });
    expect(FakeAudio.last.src).not.toBe(second);
    expect(p.nowPlaying?.reciter).toBe("Hani Ar Rifai");
  });
  it("a failed file shows the offline-honest message and goes idle (no spinner left)", async () => {
    const p = usePlayerStore();
    FakeAudio.failNext = true;
    await p.playSurah(fatiha);
    expect(p.error).toBe(PLAY_ERROR);
    expect(p.playing).toBe(false);
    expect(p.loading).toBe(false);
    // playing again clears the error
    await p.playSurah(fatiha);
    expect(p.error).toBeNull();
    expect(p.playing).toBe(true);
  });
  it("an unknown reciter has no file: error, idle", async () => {
    const p = usePlayerStore();
    await p.playSurah({ ...fatiha, reciter: "Nobody" });
    expect(p.error).toBe(PLAY_ERROR);
    expect(p.loading).toBe(false);
  });
  it("a request that is superseded does not start", async () => {
    const p = usePlayerStore();
    const a = p.playSurah(fatiha);
    const b = p.playSurah({ surahNo: 3, title: "Aal-i-Imraan", reciter: fatiha.reciter });
    await Promise.all([a, b]);
    expect(p.nowPlaying?.surahNo).toBe(3);
    expect(FakeAudio.last.src).toMatch(/\/3\.mp3$/);
  });
});

describe("the error text", () => {
  it("never claims offline playback", () => {
    expect(PLAY_ERROR).not.toMatch(/plays? offline|works offline/i);
    expect(PLAY_ERROR).toMatch(/connection/);
  });
});
