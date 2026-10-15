// Placeholder state for the mini player shell. Replaced by the real player store in Phase 4.
import { defineStore } from "pinia";

export interface NowPlaying {
  type: "surah" | "ayah" | "name";
  surahNo: number;
  title: string;
  subtitle: string;
}

export const usePlayerShellStore = defineStore("player-shell", () => {
  const nowPlaying = ref<NowPlaying | null>(null);
  const playing = ref(false);
  return { nowPlaying, playing };
});
