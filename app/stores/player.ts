// The small real player (Phase 3): play and pause one surah at a time, shared app-wide, so the mini player and every
// listing row agree. It does NOT seek, resume, repeat, auto-advance, play single ayahs or download; those arrive with
// the full player (Phase 4) and Downloads (Phase 11). Playback keeps going when the page changes.
import { defineStore } from "pinia";
import { ref } from "vue";
import { resolveSurahAudio } from "~/lib/surahAudio";

export interface NowPlaying {
  type: "surah";
  surahNo: number;
  title: string;
  subtitle: string;
  reciter: string;
}

/** Shown when a file cannot be played. Nothing here claims the audio works offline. */
export const PLAY_ERROR = "Couldn’t play. Audio needs a connection unless it was downloaded.";

export const usePlayerStore = defineStore("player", () => {
  const nowPlaying = ref<NowPlaying | null>(null);
  const playing = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let el: HTMLAudioElement | null = null;
  let token = 0; // a newer request makes an older one stale

  function element(): HTMLAudioElement {
    if (el) return el;
    el = new Audio();
    el.preload = "none";
    el.addEventListener("playing", () => {
      playing.value = true;
      loading.value = false;
    });
    el.addEventListener("pause", () => {
      playing.value = false;
    });
    el.addEventListener("ended", () => {
      playing.value = false;
    });
    el.addEventListener("error", () => fail());
    return el;
  }

  function fail() {
    playing.value = false;
    loading.value = false;
    error.value = PLAY_ERROR;
  }

  /** Play one surah by one reciter. The same surah and reciter already loaded just resumes. */
  async function playSurah(track: { surahNo: number; title: string; reciter: string; rate?: number }) {
    const same = nowPlaying.value?.surahNo === track.surahNo && nowPlaying.value.reciter === track.reciter;
    if (same && !error.value && el?.src) {
      el.playbackRate = track.rate ?? 1;
      await el.play().catch(fail);
      return;
    }
    const mine = ++token;
    error.value = null;
    loading.value = true;
    nowPlaying.value = { type: "surah", surahNo: track.surahNo, title: track.title, subtitle: `Recited by ${track.reciter}`, reciter: track.reciter };
    const audio = element();
    audio.pause();
    const url = await resolveSurahAudio(track.surahNo, track.reciter).catch(() => null);
    if (mine !== token) return;
    if (!url) return fail();
    audio.src = url;
    audio.playbackRate = track.rate ?? 1;
    try {
      await audio.play();
    } catch {
      if (mine === token) fail();
    }
  }

  function pause() {
    el?.pause();
  }

  /** Play or pause what is loaded (the mini player's button). */
  async function toggle(rate = 1) {
    if (!nowPlaying.value) return;
    if (playing.value || loading.value) {
      ++token;
      loading.value = false;
      pause();
      return;
    }
    await playSurah({ surahNo: nowPlaying.value.surahNo, title: nowPlaying.value.title, reciter: nowPlaying.value.reciter, rate });
  }

  return { nowPlaying, playing, loading, error, playSurah, pause, toggle };
});
