<script setup lang="ts">
// The persistent mini player. It shows once a surah has been started, and after a reload when a saved place exists (then PAUSED: nothing
// plays until a tap). Tapping the title opens the player sheet. Phase 4B: position line, buffering and error states with Try again.
import { clock } from "~/lib/audioState";

const player = usePlayerStore();
const busy = computed(() => player.playing || player.loading);
const s = computed(() => player.snap);
const pct = computed(() => (s.value.duration > 0 ? Math.min(100, (s.value.position / s.value.duration) * 100) : 0));
const status = computed(() => {
  if (player.error) return player.error;
  if (s.value.status === "loading") return "Loading…";
  if (s.value.status === "buffering") return "Buffering…";
  if (s.value.status === "restored" || (s.value.status === "paused" && s.value.position > 0)) return `Paused at ${clock(s.value.position)}`;
  return player.nowPlaying?.subtitle ?? "";
});
</script>

<template>
  <div v-if="player.nowPlaying" class="fixed inset-x-0 bottom-0 z-30 border-t bg-surface md:left-64" role="region" aria-label="Audio player" data-testid="mini-player">
    <div class="h-0.5 bg-muted" aria-hidden="true"><i class="block h-full bg-brand" :style="{ width: `${pct}%` }" data-testid="mini-progress" /></div>
    <div class="flex min-h-16 items-center gap-2 px-4 py-1">
      <div class="flex min-w-0 flex-1 flex-col items-start">
        <button type="button" class="flex min-h-11 w-full min-w-0 flex-col justify-center text-left" aria-label="Open the player" data-testid="mini-open" @click="player.openSheet()">
          <span class="truncate text-[14px] font-medium" data-testid="mini-title">{{ player.nowPlaying.title }}</span>
          <span class="line-clamp-2 break-words text-[12px] leading-[1.35]" :class="player.error ? 'text-destructive' : 'text-ink-2'" data-testid="mini-status">{{ status }}</span>
        </button>
        <!-- under the text, so the whole message fits on two lines and Try again is never pushed off the row -->
        <Button v-if="s.status === 'error'" variant="outline" class="mb-1 min-h-11 shrink-0 md:min-h-9" data-testid="mini-retry" @click="player.retry()">Try again</Button>
      </div>
      <Button variant="default" size="icon" class="size-11 shrink-0 rounded-full" :aria-label="busy ? 'Pause' : 'Play'" data-testid="mini-toggle" @click="player.toggle()">
        <Icon :name="busy ? 'lucide:pause' : 'lucide:play'" size="18" />
      </Button>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-testid="mini-live">{{ player.nowPlaying.title }}. {{ status }}</p>
  </div>
</template>
