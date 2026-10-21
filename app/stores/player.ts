// The player, shared app-wide (Phase 3 started it; Phase 4B completes the whole-surah player). The rules live in `lib/audioEngine.ts`; this
// store mirrors its snapshot for the mini player, the player sheet and every Play button, and wires in the real element, storage and Media
// Session. Playback keeps going when the page changes. Nothing ever starts by itself: `restore()` only shows the saved item paused.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { AudioEngine, type AudioLike, type Snapshot } from "~/lib/audioEngine";
import { PLAY_ERROR, readAudioPrefs, readResume, writeAudioPrefs, writeResume } from "~/lib/audioState";
import { bindMediaSession, type MediaSessionLike } from "~/lib/mediaSession";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { resolveSurahAudio } from "~/lib/surahAudio";
import { usePreferencesStore } from "./preferences";

export { PLAY_ERROR };

export interface NowPlaying {
  type: "surah";
  surahNo: number;
  title: string;
  subtitle: string;
  reciter: string;
}

export const usePlayerStore = defineStore("player", () => {
  const prefs = usePreferencesStore();
  const snap = ref<Snapshot>({ track: null, status: "idle", error: null, position: 0, duration: 0, repeat: false, seekable: false, canPrevious: false, canNext: false });
  const sheetOpen = ref(false);

  const session = typeof navigator !== "undefined" ? (navigator as Navigator & { mediaSession?: MediaSessionLike }).mediaSession : undefined;
  const meta = typeof MediaMetadata !== "undefined" ? (MediaMetadata as unknown as new (i: { title: string; artist: string; album: string }) => unknown) : undefined;

  const engine = new AudioEngine(
    {
      create: () => new Audio() as unknown as AudioLike,
      resolve: resolveSurahAudio,
      surahTitle: (n) => SURAH_ROWS[n - 1]!.name,
      readResume,
      writeResume,
      readRepeat: () => readAudioPrefs().repeatOne,
      writeRepeat: (on) => writeAudioPrefs({ repeatOne: on }),
      autoAdvance: () => prefs.prefs.autoplay,
      rate: () => prefs.prefs.playbackRate,
      setInterval: (fn, ms) => setInterval(fn, ms),
      clearInterval: (h) => clearInterval(h as number),
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (h) => clearTimeout(h as number),
    },
    (s) => {
      snap.value = s;
      mediaSession.sync(s, prefs.prefs.playbackRate);
    },
  );
  const mediaSession = bindMediaSession(session, meta, {
    play: () => void toggleIfPaused(),
    pause: () => engine.pause(),
    seekTo: (t) => engine.seek(t),
    skip: (d) => engine.skip(d),
    next: () => void engine.next(),
    previous: () => void engine.previous(),
  });
  const toggleIfPaused = async () => {
    if (!["playing", "buffering", "loading"].includes(engine.snapshot.status)) await engine.toggle();
  };

  // the place is saved when the page is hidden or closed
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => engine.flush());
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && engine.flush());
  }

  // ---- what the rest of the app reads (the Phase 3 names are kept)
  const nowPlaying = computed<NowPlaying | null>(() => {
    const t = snap.value.track;
    return t ? { type: "surah", surahNo: t.surahNo, title: t.title, subtitle: `Recited by ${t.reciter}`, reciter: t.reciter } : null;
  });
  const playing = computed(() => snap.value.status === "playing" || snap.value.status === "buffering");
  const loading = computed(() => snap.value.status === "loading");
  const error = computed(() => snap.value.error?.message ?? null);

  async function playSurah(track: { surahNo: number; title: string; reciter: string; rate?: number; startAt?: number }) {
    await engine.playSurah({ surahNo: track.surahNo, title: track.title, reciter: track.reciter, startAt: track.startAt });
  }

  return {
    snap, sheetOpen, nowPlaying, playing, loading, error,
    status: computed(() => snap.value.status),
    playSurah,
    pause: () => engine.pause(),
    /** Play or pause what is shown (a restored item plays from its saved place). */
    toggle: (_rate?: number) => engine.toggle(),
    retry: () => engine.retry(),
    restore: () => engine.restore(),
    seek: (t: number) => engine.seek(t),
    skipBack: () => engine.skipBack(),
    skipForward: () => engine.skipForward(),
    next: () => engine.next(),
    previous: () => engine.previous(),
    setRate: (r: number) => engine.setRate(r),
    setRepeat: (on: boolean) => engine.setRepeat(on),
    switchReciter: (name: string) => engine.switchReciter(name),
    openSheet: () => (sheetOpen.value = true),
    closeSheet: () => (sheetOpen.value = false),
  };
});
