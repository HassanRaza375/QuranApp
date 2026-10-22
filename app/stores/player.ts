// The player, shared app-wide (Phase 3 started it; 4B made the whole-surah player; 4C adds single ayahs, queues and clips). The rules live in
// `lib/audioEngine.ts`; this store mirrors its snapshot for the mini player, the player sheet, every Play button and the pages that highlight the
// playing ayah, and wires in the real element, storage, the per-ayah endpoint and Media Session. Playback keeps going when the page changes.
// Nothing ever starts by itself: `restore()` only shows the saved item paused.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { AudioEngine, type AudioLike, type AyahRef, type BuiltQueue, type Snapshot } from "~/lib/audioEngine";
import { makeAyahResolver } from "~/lib/ayahAudio";
import { pageQueue, storyQueue } from "~/lib/audioQueue";
import { AUDIO_QUEUE_KEY, PLAY_ERROR, clearQueueRecord, readAudioPrefs, readPlayerPrefs, readQueueRecord, readResume, setFollowAyah, writeAudioPrefs, writeQueueRecord, writeResume, type PlayerPrefs, type QueueRef } from "~/lib/audioState";
import { bindMediaSession, type MediaSessionLike } from "~/lib/mediaSession";
import { AYAH_COUNTS } from "~/lib/quranMeta";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { resolveSurahAudio } from "~/lib/surahAudio";
import { VerseService } from "~/services/verse.service";
import { usePreferencesStore } from "./preferences";

export { PLAY_ERROR, AUDIO_QUEUE_KEY };

/** The surah that is playing as a whole file (the Phase 3 name; an ayah, a queue or a clip is not "a surah playing"). */
export interface NowPlaying {
  type: "surah";
  surahNo: number;
  title: string;
  subtitle: string;
  reciter: string;
}

export const usePlayerStore = defineStore("player", () => {
  const prefs = usePreferencesStore();
  const snap = ref<Snapshot>({ track: null, view: null, status: "idle", error: null, position: 0, duration: 0, repeat: false, seekable: false, canPrevious: false, canNext: false });
  const sheetOpen = ref(false);
  const playerPrefs = ref<PlayerPrefs>(typeof localStorage === "undefined" ? {} : readPlayerPrefs());

  const session = typeof navigator !== "undefined" ? (navigator as Navigator & { mediaSession?: MediaSessionLike }).mediaSession : undefined;
  const meta = typeof MediaMetadata !== "undefined" ? (MediaMetadata as unknown as new (i: { title: string; artist: string; album: string }) => unknown) : undefined;
  const resolveAyah = makeAyahResolver((s, a) => VerseService.getVerseByNumber(s, a));

  const engine = new AudioEngine(
    {
      create: () => new Audio() as unknown as AudioLike,
      resolve: resolveSurahAudio,
      resolveAyah,
      preload: (url) => void fetch(url).then((r) => r.arrayBuffer()).catch(() => undefined),
      saveData: () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true,
      surahTitle: (n) => SURAH_ROWS[n - 1]!.name,
      ayahCount: (n) => AYAH_COUNTS[n - 1] ?? 0,
      readResume,
      writeResume,
      readQueue: readQueueRecord,
      writeQueue: writeQueueRecord,
      clearQueue: clearQueueRecord,
      buildQueue: async (kind, ref) => buildQueue(kind, ref),
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

  /** A saved queue, rebuilt from the data (a page from the page starts, a story chapter from its passages). */
  async function buildQueue(kind: "page" | "story", ref: QueueRef): Promise<BuiltQueue | null> {
    if (kind === "page" && "page" in ref) return pageQueue(ref.page);
    if (kind === "story" && "storyId" in ref) {
      const [{ QURAN_STORIES }, { chaptersOf }] = await Promise.all([import("@legacy/data/quranStories"), import("~/lib/stories")]);
      const story = QURAN_STORIES.find((s) => s.id === ref.storyId);
      const ch = story ? chaptersOf(story)[ref.chapter] : undefined;
      return story && ch ? storyQueue(story.id, ref.chapter, ch.title, ch.passages) : null;
    }
    return null;
  }

  // ---- what the rest of the app reads (the Phase 3 names are kept)
  const nowPlaying = computed<NowPlaying | null>(() => {
    const t = snap.value.track;
    return t && t.kind === "surah" ? { type: "surah", surahNo: t.surahNo, title: t.title, subtitle: `Recited by ${t.reciter}`, reciter: t.reciter } : null;
  });
  const playing = computed(() => snap.value.status === "playing" || snap.value.status === "buffering");
  const loading = computed(() => snap.value.status === "loading");
  const error = computed(() => snap.value.error?.message ?? null);
  /** The ayah being played (alone or in a queue), for the highlight: while it loads, plays, buffers or is paused on it. A string, so it only changes when the ayah does. */
  const playingKey = computed<string | null>(() => {
    const t = snap.value.track;
    if (!t || (t.kind !== "ayah" && t.kind !== "queue") || snap.value.status === "idle" || snap.value.status === "restored") return null;
    return `${t.surahNo}:${t.ayah}`;
  });
  const playingAyah = computed<AyahRef | null>(() => {
    if (!playingKey.value) return null;
    const [s, a] = playingKey.value.split(":").map(Number);
    return { surah: s!, ayah: a! };
  });
  /** Whether that very ayah is audibly going (loading, playing or buffering), for a row's pressed state. */
  const ayahActive = (surah: number, ayah: number) => {
    const a = playingAyah.value;
    return !!a && a.surah === surah && a.ayah === ayah && ["loading", "playing", "buffering"].includes(snap.value.status);
  };
  /** Whether the queue `id` is the thing shown, and whether it is audibly going. */
  const queueIs = (id: string) => snap.value.track?.kind === "queue" && snap.value.track.queue?.id === id;
  const queueActive = (id: string) => queueIs(id) && ["loading", "playing", "buffering"].includes(snap.value.status);
  const clipIs = (id: string) => snap.value.track?.kind === "clip" && snap.value.track.clip?.id === id;
  const clipActive = (id: string) => clipIs(id) && ["loading", "playing", "buffering"].includes(snap.value.status);

  async function playSurah(track: { surahNo: number; title: string; reciter: string; rate?: number; startAt?: number }) {
    await engine.playSurah({ surahNo: track.surahNo, title: track.title, reciter: track.reciter, startAt: track.startAt });
  }

  return {
    snap, sheetOpen, nowPlaying, playing, loading, error, playingAyah, playingKey, ayahActive, queueIs, queueActive, clipIs, clipActive, playerPrefs,
    status: computed(() => snap.value.status),
    view: computed(() => snap.value.view),
    playSurah,
    playAyah: (a: { surah: number; ayah: number; reciter: string }) => engine.playAyah(a),
    playQueue: (q: { id: string; label: string; items: AyahRef[]; reciter: string; kind: "page" | "story"; ref: QueueRef; startIndex?: number }) => engine.playQueue(q),
    playClip: (c: { id: string; title: string; subtitle: string; url: string }) => engine.playClip(c),
    skipAyah: () => engine.skipAyah(),
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
    setFollow: (on: boolean) => {
      setFollowAyah(on);
      playerPrefs.value = readPlayerPrefs();
    },
    switchReciter: (name: string) => engine.switchReciter(name),
    openSheet: () => (sheetOpen.value = true),
    closeSheet: () => (sheetOpen.value = false),
  };
});
