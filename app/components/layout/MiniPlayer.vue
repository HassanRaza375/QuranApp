<script setup lang="ts">
// The persistent mini player. It renders only when a surah has been started. Phase 3 has play and pause; the full
// player (seeking, resume, repeat, per-ayah audio) arrives in Phase 4.
const player = usePlayerStore();
const prefs = usePreferencesStore();
const busy = computed(() => player.playing || player.loading);
const status = computed(() => (player.error ? player.error : player.loading ? "Loading…" : player.nowPlaying?.subtitle));
</script>

<template>
  <div v-if="player.nowPlaying" class="fixed inset-x-0 bottom-0 z-30 border-t bg-surface md:left-64" role="region" aria-label="Audio player" data-testid="mini-player">
    <div class="flex h-16 items-center gap-3 px-4">
      <div class="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left">
        <span class="truncate text-[14px] font-medium" data-testid="mini-title">{{ player.nowPlaying.title }}</span>
        <span class="truncate text-[12px]" :class="player.error ? 'text-destructive' : 'text-ink-2'" role="status" data-testid="mini-status">{{ status }}</span>
      </div>
      <Button variant="default" size="icon" class="size-11 rounded-full" :aria-label="busy ? 'Pause' : 'Play'" data-testid="mini-toggle" @click="player.toggle(prefs.prefs.playbackRate)">
        <Icon :name="busy ? 'lucide:pause' : 'lucide:play'" size="18" />
      </Button>
    </div>
  </div>
</template>
