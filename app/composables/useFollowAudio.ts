// "Follow audio" (Phase 4C): when the player moves to another ayah and the user has turned the switch on (it is off by default, and never on while
// Reduce motion is on), bring that ayah into view if it is not already fully visible. Instant (no smooth scrolling), no focus change, and only when
// the ayah itself changes, so the user can scroll away between ayahs. `find` returns the page's element for an ayah, or null when it is not shown.
import { followOn } from "~/lib/audioState";

export function useFollowAudio(find: (surah: number, ayah: number) => HTMLElement | null) {
  const player = usePlayerStore();
  watch(
    () => player.playingKey,
    async (key) => {
      if (!key || !followOn(player.playerPrefs, document.documentElement.dataset.reducedMotion === "true")) return;
      const [s, a] = key.split(":").map(Number);
      await nextTick();
      const el = find(s!, a!);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= window.innerHeight) return;
      el.scrollIntoView({ block: "center" });
    },
  );
}
