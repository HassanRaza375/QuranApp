const PREFS_KEY = "quran:audio-prefs:v1";
const RESUME_KEY = "quran:audio-resume:v1";

export const useAudioPlayer = () => {
  const audio = useState<HTMLAudioElement | null>("audio", () => null);
  const currentUrl = useState<string | null>("currentUrl", () => null);
  const loading = useState<boolean>("loading", () => false);
  const playing = useState<boolean>("playing", () => false);
  const progress = useState<number>("progress", () => 0);
  const duration = useState<number>("duration", () => 0);

  // What's currently loaded, so a global mini-player (or Media Session) can
  // show a title even though playback may have been started from a page
  // that's since been navigated away from.
  const nowPlaying = useState<{
    type: "surah" | "ayah" | "name";
    surahNo: number;
    title: string;
    subtitle: string;
  } | null>("audio-now-playing", () => null);

  const playbackRate = useState<number>("audio-playback-rate", () => 1);
  const repeatOne = useState<boolean>("audio-repeat-one", () => false);
  const autoAdvance = useState<boolean>("audio-auto-advance", () => false);
  const resumeInfo = useState<{ url: string; position: number; nowPlaying: typeof nowPlaying.value } | null>(
    "audio-resume-info",
    () => null
  );

  // Ticks (via Date.now()) on every *natural* end of playback — distinct from
  // a user-initiated pause, which only flips `playing` to false. Lets a
  // caller drive its own sequential queue (e.g. Prophets & Persons "Play all
  // passages") without building a second audio element/player.
  const endedAt = useState<number>("audio-ended-at", () => 0);

  const getStorage = () => useNuxtApp().$storage;

  const loadPrefs = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    const saved = $storage.get(PREFS_KEY, null);
    if (saved) {
      playbackRate.value = saved.playbackRate ?? 1;
      repeatOne.value = !!saved.repeatOne;
      autoAdvance.value = !!saved.autoAdvance;
    }
    resumeInfo.value = $storage.get(RESUME_KEY, null);
  };

  const persistPrefs = () => {
    if (!import.meta.client) return;
    getStorage()?.set(PREFS_KEY, {
      playbackRate: playbackRate.value,
      repeatOne: repeatOne.value,
      autoAdvance: autoAdvance.value,
    });
  };

  const persistResume = () => {
    if (!import.meta.client || !currentUrl.value) return;
    getStorage()?.set(RESUME_KEY, {
      url: currentUrl.value,
      position: progress.value,
      nowPlaying: nowPlaying.value,
    });
  };

  /* ------------------ create audio once (client only) ------------------ */
  onMounted(() => {
    if (!audio.value) {
      audio.value = new Audio();
      audio.value.playbackRate = playbackRate.value;

      audio.value.addEventListener("timeupdate", () => {
        progress.value = audio.value!.currentTime;
      });

      audio.value.addEventListener("loadedmetadata", () => {
        duration.value = audio.value!.duration;
        loading.value = false;
      });

      audio.value.addEventListener("pause", persistResume);

      audio.value.addEventListener("ended", () => {
        if (repeatOne.value) {
          audio.value!.currentTime = 0;
          audio.value!.play();
          return;
        }
        playing.value = false;
        endedAt.value = Date.now();
        if (autoAdvance.value && nowPlaying.value?.type === "surah") {
          playNextInQueue();
        }
      });

      if (import.meta.client && "mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => audio.value?.play());
        navigator.mediaSession.setActionHandler("pause", () => audio.value?.pause());
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (audio.value && details.seekTime != null) audio.value.currentTime = details.seekTime;
        });
      }
    }

    loadPrefs();
  });

  watch(nowPlaying, (meta) => {
    if (!import.meta.client || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = meta
      ? new MediaMetadata({ title: meta.title, artist: meta.subtitle, album: "Quran App" })
      : null;
  });

  watch(playing, (v) => {
    if (!import.meta.client || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = v ? "playing" : "paused";
  });

  /* ------------------ time formatter ------------------ */
  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";

    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /* ------------------ computed timers ------------------ */
  const currentTimeLabel = computed(() => formatTime(progress.value));
  const durationLabel = computed(() => formatTime(duration.value));
  const remainingLabel = computed(() =>
    formatTime(duration.value - progress.value),
  );

  /* ------------------ controls ------------------ */
  const setNowPlaying = (meta: typeof nowPlaying.value) => {
    nowPlaying.value = meta;
  };

  const play = async (url: string, meta?: typeof nowPlaying.value) => {
    if (!audio.value) return;
    if (meta) nowPlaying.value = meta;

    // If already playing same surah, do nothing
    if (currentUrl.value === url && playing.value) return;

    if (currentUrl.value !== url) {
      loading.value = true;
      audio.value.src = url;
      currentUrl.value = url;
    }

    audio.value.playbackRate = playbackRate.value;
    await audio.value.play();
    playing.value = true;
  };

  const pause = () => {
    audio.value?.pause();
    playing.value = false;
  };

  const seek = (time: number) => {
    if (audio.value) audio.value.currentTime = time;
  };
  const reset = () => {
    if (!audio.value) return;

    audio.value.pause();
    audio.value.src = "";

    progress.value = 0;
    duration.value = 0;
    playing.value = false;
    loading.value = false;
    currentUrl.value = null;
    nowPlaying.value = null;
  };

  const setPlaybackRate = (rate: number) => {
    playbackRate.value = rate;
    if (audio.value) audio.value.playbackRate = rate;
    persistPrefs();
  };

  const toggleRepeatOne = () => {
    repeatOne.value = !repeatOne.value;
    persistPrefs();
  };

  const toggleAutoAdvance = () => {
    autoAdvance.value = !autoAdvance.value;
    persistPrefs();
  };

  /** Reciter continues automatically into the next surah when a full-surah track ends. */
  const playNextInQueue = async () => {
    const current = nowPlaying.value;
    if (!current || current.type !== "surah") return;
    const nextSurahNo = current.surahNo + 1;
    if (nextSurahNo > 114) return;

    const { getChapter } = useChapters();
    const { selected } = useReciter();
    const chapter = await getChapter(nextSurahNo);
    const match = Object.values(chapter?.audio ?? {}).find(
      (r: any) => r.reciter === selected.value?.reciter
    ) as { reciter: string; url: string } | undefined;
    if (!match) return;

    await play(match.url, {
      type: "surah",
      surahNo: nextSurahNo,
      title: chapter.surahNameTranslation,
      subtitle: match.reciter,
    });
  };

  const hasResumable = computed(() => !!resumeInfo.value && resumeInfo.value.url !== currentUrl.value);

  const resumeLast = async () => {
    if (!resumeInfo.value) return;
    await play(resumeInfo.value.url, resumeInfo.value.nowPlaying);
    seek(resumeInfo.value.position);
  };

  return {
    play,
    pause,
    seek,
    playing,
    loading,
    progress,
    duration,
    currentUrl,
    // timers
    currentTimeLabel,
    durationLabel,
    remainingLabel,
    reset,
    // now-playing metadata (for the global mini-player / Media Session)
    nowPlaying,
    setNowPlaying,
    endedAt,
    // preferences
    playbackRate,
    setPlaybackRate,
    repeatOne,
    toggleRepeatOne,
    autoAdvance,
    toggleAutoAdvance,
    // queue / resume
    playNextInQueue,
    hasResumable,
    resumeInfo,
    resumeLast,
  };
};
