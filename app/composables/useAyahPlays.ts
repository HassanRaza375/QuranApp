// Plays one ayah with the Settings reciter and counts how many times it played to the end (the "Listen 3 times" step). It reads the shared player and
// starts nothing by itself. Nothing here needs a connection to be correct: when the file cannot be had (offline and not downloaded) `failed` is true and
// the step can be skipped.
import { reciterName } from "~/lib/surahAudio";

export function useAyahPlays(surah: () => number, ayah: () => number) {
  const player = usePlayerStore();
  const prefs = usePreferencesStore();
  const plays = ref(0);
  let going = false;

  const mine = () => player.playingKey === `${surah()}:${ayah()}`;
  /** Playing, loading or buffering this very ayah. */
  const active = computed(() => player.ayahActive(surah(), ayah()));
  const failed = computed(() => player.status === "error" && mine());

  watch(
    () => [player.status, player.snap.position] as const,
    ([status, position]) => {
      if (["loading", "playing", "buffering"].includes(status) && mine()) going = true;
      // a single ayah that has played to its end is reported as paused at 0
      else if (going && status === "paused" && position === 0 && mine()) {
        going = false;
        plays.value++;
      } else if (status === "error" || !mine()) going = false;
    },
  );

  const play = () => {
    if (active.value) return player.pause();
    return player.playAyah({ surah: surah(), ayah: ayah(), reciter: reciterName(prefs.prefs.reciter) });
  };
  const reset = () => {
    plays.value = 0;
    going = false;
  };
  onBeforeUnmount(() => {
    if (mine()) player.pause();
  });
  return { plays, active, failed, play, reset };
}
