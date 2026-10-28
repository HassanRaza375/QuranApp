// Phase 4B: the player's shared pieces: the two legacy keys, the resume record, time wording and the words of ours.
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as A from "../app/lib/audioState";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { RECITER_NAMES } from "../app/lib/surahAudio";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const R0 = RECITER_NAMES[0]!;
const R2 = RECITER_NAMES[2]!;

describe("time", () => {
  it("clock is the legacy mini player's mm:ss, with hours when needed", () => {
    expect(A.clock(0)).toBe("0:00");
    expect(A.clock(59.9)).toBe("0:59");
    expect(A.clock(80)).toBe("1:20");
    expect(A.clock(754)).toBe("12:34");
    expect(A.clock(3723)).toBe("1:02:03");
    for (const bad of [NaN, -5, Infinity]) expect(A.clock(bad)).toBe("0:00");
  });
  it("the slider's spoken value reads as words: '1 minute 20 seconds of 6 minutes'", () => {
    expect(A.spokenTime(80)).toBe("1 minute 20 seconds");
    expect(A.spokenTime(360)).toBe("6 minutes");
    expect(A.spokenTime(1)).toBe("1 second");
    expect(A.spokenTime(0)).toBe("0 seconds");
    expect(A.spokenTime(3723)).toBe("1 hour 2 minutes 3 seconds");
    expect(A.spokenTime(3600)).toBe("1 hour");
    expect(A.spokenPosition(80, 360)).toBe("1 minute 20 seconds of 6 minutes");
    expect(A.spokenPosition(0, 0)).toBe("0 seconds of 0 seconds");
  });
});

describe("speeds", () => {
  it("the chips are the prototype's; a Settings value outside them is custom", () => {
    expect([...A.SPEEDS]).toEqual([0.75, 1, 1.25, 1.5, 2]);
    expect(A.isCustomSpeed(1.5)).toBe(false);
    expect(A.isCustomSpeed(0.5)).toBe(true);
    expect(A.isCustomSpeed(3)).toBe(true);
  });
});

describe("quran:audio-prefs:v1 keeps the legacy triple", () => {
  it("reads the defaults when nothing is stored, and repairs a damaged value", () => {
    setStorageBackend(memoryStore());
    expect(A.readAudioPrefs()).toEqual({ playbackRate: 1, repeatOne: false, autoAdvance: false });
    setStorageBackend(memoryStore({ [A.AUDIO_PREFS_KEY]: JSON.stringify({ playbackRate: "fast", repeatOne: 1 }) }));
    expect(A.readAudioPrefs()).toEqual({ playbackRate: 1, repeatOne: true, autoAdvance: false });
  });
  it("a write stores all three fields (what the legacy parser expects) and keeps unknown ones", () => {
    const store = memoryStore({ [A.AUDIO_PREFS_KEY]: JSON.stringify({ autoAdvance: true, future: { a: 1 } }) });
    setStorageBackend(store);
    A.writeAudioPrefs({ repeatOne: true });
    expect(JSON.parse(store.data.get(A.AUDIO_PREFS_KEY)!)).toEqual({ playbackRate: 1, repeatOne: true, autoAdvance: true, future: { a: 1 } });
  });
});

describe("quran:audio-resume:v1", () => {
  const rec = { url: "https://example.test/2.mp3", position: 754, nowPlaying: { type: "surah" as const, surahNo: 2, title: "Al-Baqara", subtitle: R2, reciter: R2 } };
  it("is written in the legacy shape (url, position, nowPlaying) with only `reciter` added, and reads back", () => {
    const store = memoryStore();
    setStorageBackend(store);
    A.writeResume(rec);
    const stored = JSON.parse(store.data.get(A.AUDIO_RESUME_KEY)!);
    expect(Object.keys(stored)).toEqual(["url", "position", "nowPlaying"]);
    expect(Object.keys(stored.nowPlaying)).toEqual(["type", "surahNo", "title", "subtitle", "reciter"]);
    expect(A.readResume()).toEqual({ surahNo: 2, title: "Al-Baqara", reciter: R2, position: 754 });
  });
  it("a legacy record (reciter only in `subtitle`) resumes with that reciter; an unknown one falls back to the default", () => {
    expect(A.restoredTrack({ url: "x", position: 12.9, nowPlaying: { type: "surah", surahNo: 3, title: "The Family of Imran", subtitle: R2 } })).toEqual({ surahNo: 3, title: "The Family of Imran", reciter: R2, position: 12 });
    expect(A.restoredTrack({ url: "x", position: 5, nowPlaying: { type: "surah", surahNo: 3, title: "T", subtitle: "Recited by nobody" } })?.reciter).toBe(R0);
  });
  it("only a surah resumes (legacy ayah and name tracks are ignored), and a damaged record gives null", () => {
    const np = (o: Record<string, unknown>) => ({ url: "x", position: 1, nowPlaying: { type: "surah", surahNo: 1, title: "T", subtitle: R0, ...o } });
    expect(A.restoredTrack(np({ type: "ayah" }))).toBeNull();
    expect(A.restoredTrack(np({ type: "name" }))).toBeNull();
    for (const bad of [null, undefined, "x", [], {}, { nowPlaying: null }, np({ surahNo: 0 }), np({ surahNo: 115 }), np({ surahNo: 1.5 }), np({ surahNo: "2" }), np({ title: "" }), np({ title: 3 })]) expect(A.restoredTrack(bad), JSON.stringify(bad)).toBeNull();
  });
  it("a bad position is 0, never NaN or negative", () => {
    for (const p of [undefined, -4, NaN, "9", null]) expect(A.restoredTrack({ url: "x", position: p, nowPlaying: { type: "surah", surahNo: 1, title: "T", subtitle: R0 } })?.position, String(p)).toBe(0);
  });
  it("blocked or damaged storage reads as nothing", () => {
    setStorageBackend(memoryStore({}, true));
    expect(A.readResume()).toBeNull();
    setStorageBackend(memoryStore({ [A.AUDIO_RESUME_KEY]: "{not json" }));
    expect(A.readResume()).toBeNull();
    expect(getJSON(A.AUDIO_RESUME_KEY, "fallback")).toBe("fallback");
  });
});

describe("words of ours", () => {
  it("make no offline-play claim; the error keeps its meaning", () => {
    for (const s of [A.PLAY_ERROR, A.TIMEOUT_ERROR, A.BLOCKED_NOTE, A.RECITER_RESTART_NOTE, A.RESUME_LABEL, A.SKIP_AYAH, A.FOLLOW_DESC]) expect(s).not.toMatch(/plays? offline|works offline|available offline/i);
    expect(A.PLAY_ERROR).toBe("Couldn’t play. Audio needs a connection unless it was downloaded.");
    expect(A.RECITER_RESTART_NOTE).toBe("Switching reciter restarts this surah.");
    expect(A.ayahFailedMessage(2, 6)).toBe("Couldn’t play ayah 2:6. Audio needs a connection unless it was downloaded.");
    expect(A.NO_RECORDING).toBe("No recording for this name");
    expect(A.FOLLOW_LABEL).toBe("Follow audio");
  });
  it("no page or component still says 'Coming with the player'", () => {
    const root = path.resolve(__dirname, "../app");
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.(vue|ts)$/.test(f.name) && fs.readFileSync(p, "utf8").includes("Coming with the player")) hits.push(path.relative(root, p));
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
  it("no page still says the 4B placeholder reasons (the four Play controls are real now, or have their own reason)", () => {
    const root = path.resolve(__dirname, "../app");
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.(vue|ts)$/.test(f.name) && /Playing single ayahs arrives soon|Coming with the player/.test(fs.readFileSync(p, "utf8"))) hits.push(path.relative(root, p));
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});
