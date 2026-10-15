<script setup lang="ts">
// Shell for the persistent mini player. It renders only when something is playing (the real player,
// reciter lists and the full-screen player arrive in Phase 4). The track area will open the full player.
const player = usePlayerShellStore();
</script>

<template>
  <div v-if="player.nowPlaying" class="fixed inset-x-0 bottom-0 z-30 border-t bg-surface md:left-64" role="region" aria-label="Audio player">
    <div class="flex h-16 items-center gap-3 px-4">
      <button type="button" class="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left" aria-label="Open the full player">
        <span class="truncate text-[14px] font-medium">{{ player.nowPlaying.title }}</span>
        <span class="truncate text-[12px] text-ink-2">{{ player.nowPlaying.subtitle }}</span>
      </button>
      <Button variant="default" size="icon" class="size-11 rounded-full" :aria-label="player.playing ? 'Pause' : 'Play'" @click="player.playing = !player.playing">
        <Icon :name="player.playing ? 'lucide:pause' : 'lucide:play'" size="18" />
      </Button>
    </div>
  </div>
</template>
