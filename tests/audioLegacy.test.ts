// Phase 4B: the two legacy audio keys against the LEGACY parser. The legacy composable (app/composables/useAudioPlayer.ts) is loaded as it is
// and its own storage code is run beside the revamp's: its preferences records and resume records must read the same in both directions, and
// everything the revamp writes must be accepted by the legacy code (so a rollback loses nothing).
import { afterEach, describe, expect, it } from "vitest";
import { AudioEngine, type AudioLike } from "../app/lib/audioEngine";
import * as A from "../app/lib/audioState";
import { setStorageBackend } from "../app/lib/storage";
import { RECITER_NAMES } from "../app/lib/surahAudio";
import { loadLegacyAudioPlayer } from "../scripts/lib/legacy-audio-player.mjs";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const R = RECITER_NAMES[3]!;

/** The legacy `$storage` wrapper's behaviour over a map. */
const legacyStorage = (data: Map<string, string>) => ({
  get: (k: string, d: unknown) => (data.has(k) ? JSON.parse(data.get(k)!) : d),
  set: (k: string, v: unknown) => void data.set(k, JSON.stringify(v)),
});

describe("quran:audio-prefs:v1", () => {
  it("every preference change leaves the same stored record whether the legacy code or the revamp makes it", async () => {
    const legacyData = new Map<string, string>();
    const legacy = await loadLegacyAudioPlayer(legacyStorage(legacyData));
    const lp = legacy.useAudioPlayer();
    const mine = memoryStore();
    setStorageBackend(mine);
    const steps: Array<[string, () => void, () => void]> = [
      ["speed 1.25", () => lp.setPlaybackRate(1.25), () => A.writeAudioPrefs({ playbackRate: 1.25 })],
      ["repeat on", () => lp.toggleRepeatOne(), () => A.writeAudioPrefs({ repeatOne: true })],
      ["auto-next on", () => lp.toggleAutoAdvance(), () => A.writeAudioPrefs({ autoAdvance: true })],
      ["speed 2", () => lp.setPlaybackRate(2), () => A.writeAudioPrefs({ playbackRate: 2 })],
      ["repeat off", () => lp.toggleRepeatOne(), () => A.writeAudioPrefs({ repeatOne: false })],
      ["auto-next off", () => lp.toggleAutoAdvance(), () => A.writeAudioPrefs({ autoAdvance: false })],
    ];
    for (const [label, legacyStep, mineStep] of steps) {
      legacyStep();
      mineStep();
      expect(JSON.parse(mine.data.get(A.AUDIO_PREFS_KEY)!), label).toEqual(JSON.parse(legacyData.get(A.AUDIO_PREFS_KEY)!));
    }
  });

  it("the legacy parser reads what the revamp wrote (and Settings' one-field writes)", async () => {
    for (const stored of [{ playbackRate: 0.75, repeatOne: true, autoAdvance: true }, { autoAdvance: true }, { playbackRate: 3 }, {}]) {
      const data = new Map([[A.AUDIO_PREFS_KEY, JSON.stringify(stored)]]);
      const lp = (await loadLegacyAudioPlayer(legacyStorage(data))).useAudioPlayer();
      const mineRead = (() => {
        setStorageBackend(memoryStore({ [A.AUDIO_PREFS_KEY]: JSON.stringify(stored) }));
        return A.readAudioPrefs();
      })();
      expect(lp.playbackRate.value, JSON.stringify(stored)).toBe(mineRead.playbackRate);
      expect(lp.repeatOne.value).toBe(mineRead.repeatOne);
      expect(lp.autoAdvance.value).toBe(mineRead.autoAdvance);
    }
  });
});

describe("quran:audio-resume:v1", () => {
  it("a record the legacy code wrote is read by the revamp: surah, title, reciter (from the legacy subtitle) and position", async () => {
    const data = new Map<string, string>();
    const legacy = await loadLegacyAudioPlayer(legacyStorage(data));
    const lp = legacy.useAudioPlayer();
    await lp.play("https://audio.test/legacy/2.mp3", { type: "surah", surahNo: 2, title: "The Cow", subtitle: R });
    legacy.audios[0].currentTime = 754;
    legacy.audios[0].emit("timeupdate");
    lp.pause(); // the legacy writes its record on pause
    const stored = JSON.parse(data.get(A.AUDIO_RESUME_KEY)!);
    expect(Object.keys(stored)).toEqual(["url", "position", "nowPlaying"]);
    setStorageBackend(memoryStore({ [A.AUDIO_RESUME_KEY]: data.get(A.AUDIO_RESUME_KEY)! }));
    expect(A.readResume()).toEqual({ surahNo: 2, title: "The Cow", reciter: R, position: 754 });
  });

  it("a record the revamp's engine writes is accepted by the legacy code: same keys, loaded as resume info, resumable, and its resume plays that url from that place", async () => {
    // the revamp plays and pauses with a fake element, writing its record
    const mine = memoryStore();
    setStorageBackend(mine);
    class El implements AudioLike {
      src = "";
      preload = "";
      playbackRate = 1;
      currentTime = 0;
      duration = 900;
      paused = true;
      private h: Record<string, (() => void)[]> = {};
      addEventListener(n: string, f: () => void) {
        (this.h[n] ??= []).push(f);
      }
      emit(n: string) {
        (this.h[n] ?? []).forEach((f) => f());
      }
      async play() {
        this.paused = false;
        this.emit("playing");
      }
      pause() {
        this.paused = true;
        this.emit("pause");
      }
    }
    let el!: El;
    const engine = new AudioEngine(
      {
        create: () => (el = new El()),
        resolve: async (s, r) => `https://audio.test/${r.replace(/\W+/g, "-")}/${s}.mp3`,
        resolveAyah: async () => null,
        preload: () => {},
        saveData: () => false,
        surahTitle: (n) => `Surah ${n}`,
        ayahCount: () => 10,
        readResume: () => null,
        writeResume: A.writeResume,
        readQueue: () => null,
        writeQueue: () => {},
        clearQueue: () => {},
        buildQueue: async () => null,
        readRepeat: () => false,
        writeRepeat: () => {},
        autoAdvance: () => false,
        rate: () => 1,
        setInterval: () => 0,
        clearInterval: () => {},
        setTimeout: () => 0,
        clearTimeout: () => {},
      },
      () => {},
    );
    await engine.playSurah({ surahNo: 18, title: "Al-Kahf", reciter: R });
    el.emit("loadedmetadata");
    el.currentTime = 412;
    el.emit("timeupdate");
    engine.pause();
    const written = mine.data.get(A.AUDIO_RESUME_KEY)!;
    const rec = JSON.parse(written);
    expect(Object.keys(rec)).toEqual(["url", "position", "nowPlaying"]);
    expect(rec).toMatchObject({ url: `https://audio.test/${R.replace(/\W+/g, "-")}/18.mp3`, position: 412, nowPlaying: { type: "surah", surahNo: 18, title: "Al-Kahf", subtitle: R } });
    // now the legacy code starts up on that stored record
    const legacy = await loadLegacyAudioPlayer(legacyStorage(new Map([[A.AUDIO_RESUME_KEY, written]])));
    const lp = legacy.useAudioPlayer();
    expect(lp.resumeInfo.value).toEqual(rec);
    expect(lp.hasResumable.value).toBe(true);
    await lp.resumeLast();
    expect(legacy.audios[0].src).toBe(rec.url);
    expect(legacy.audios[0].currentTime).toBe(412);
    expect(lp.nowPlaying.value).toMatchObject({ type: "surah", surahNo: 18, title: "Al-Kahf" });
  });

  it("a finished surah is stored with position 0, which the legacy code also accepts", async () => {
    const rec = { url: "https://audio.test/x/2.mp3", position: 0, nowPlaying: { type: "surah", surahNo: 2, title: "Al-Baqara", subtitle: R, reciter: R } };
    const lp = (await loadLegacyAudioPlayer(legacyStorage(new Map([[A.AUDIO_RESUME_KEY, JSON.stringify(rec)]])))).useAudioPlayer();
    expect(lp.resumeInfo.value?.position).toBe(0);
  });
});
