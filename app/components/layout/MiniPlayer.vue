<script setup lang="ts">
// The persistent mini player. It shows once something has been started, and after a reload when a saved place exists (then PAUSED: nothing
// plays until a tap). Tapping the title opens the player sheet. 4B: position line, buffering and error states with Try again; 4C: the title and
// line follow the kind (a surah, an ayah, a queue's "ayah 3 of 13", a clip), and a failed ayah of a queue offers Skip.
import { SKIP_AYAH, clock } from "~/lib/audioState";

const player = usePlayerStore();
const busy = computed(() => player.playing || player.loading);
const s = computed(() => player.snap);
const view = computed(() => player.view);
const pct = computed(() => (s.value.duration > 0 ? Math.min(100, (s.value.position / s.value.duration) * 100) : 0));
const status = computed(() => {
  if (player.error) return player.error;
  if (s.value.status === "loading") return "Loading…";
  if (s.value.status === "buffering") return "Buffering…";
  if (s.value.status === "restored" || (s.value.status === "paused" && s.value.position > 0)) return `Paused at ${clock(s.value.position)}`;
  return view.value?.line ?? "";
});
</script>

<template>
  <div v-if="view" class="fixed inset-x-0 bottom-0 z-30 border-t bg-surface md:left-64" role="region" aria-label="Audio player" data-testid="mini-player">
    <div class="h-0.5 bg-muted" aria-hidden="true"><i class="block h-full bg-brand" :style="{ width: `${pct}%` }" data-testid="mini-progress" /></div>
    <div class="flex min-h-16 items-center gap-2 px-4 py-1">
      <div class="flex min-w-0 flex-1 flex-col items-start">
        <button type="button" class="flex min-h-11 w-full min-w-0 flex-col justify-center text-left" aria-label="Open the player" data-testid="mini-open" @click="player.openSheet()">
          <span class="truncate text-[14px] font-medium" data-testid="mini-title">{{ view.title }}</span>
          <span class="line-clamp-2 break-words text-[12px] leading-[1.35]" :class="player.error ? 'text-destructive' : 'text-ink-2'" data-testid="mini-status">{{ status }}</span>
        </button>
        <!-- under the text, so the whole message fits on two lines and the buttons are never pushed off the row -->
        <div v-if="s.status === 'error'" class="mb-1 flex flex-wrap gap-2">
          <Button variant="outline" class="min-h-11 shrink-0 md:min-h-9" data-testid="mini-retry" @click="player.retry()">Try again</Button>
          <Button v-if="s.error?.canSkip" variant="outline" class="min-h-11 shrink-0 md:min-h-9" data-testid="mini-skip" @click="player.skipAyah()">{{ SKIP_AYAH }}</Button>
        </div>
      </div>
      <Button variant="default" size="icon" class="size-11 shrink-0 rounded-full" :aria-label="busy ? 'Pause' : 'Play'" data-testid="mini-toggle" @click="player.toggle()">
        <Icon :name="busy ? 'lucide:pause' : 'lucide:play'" size="18" />
      </Button>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-testid="mini-live">{{ view.title }}. {{ status }}</p>
  </div>
</template>
