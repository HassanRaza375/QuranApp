<script setup lang="ts">
// One small tile: a label, a value, and either a link or a button. At least 44px tall (it is a touch target).
defineProps<{ label: string; value?: string; to?: string; busy?: boolean; testid?: string }>();
const cls = "block min-h-[64px] w-full rounded-lg border bg-accent px-3 py-2.5 text-left transition-colors hover:bg-accent/70";
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="cls" :data-testid="testid">
    <span class="block text-[11px] text-ink-2">{{ label }}</span>
    <Skeleton v-if="busy" class="mt-1.5 h-4 w-24" />
    <span v-else class="mt-0.5 block text-[13px] font-medium">{{ value }}</span>
  </NuxtLink>
  <button v-else type="button" :class="cls" :data-testid="testid">
    <span class="block text-[11px] text-ink-2">{{ label }}</span>
    <span class="mt-0.5 block text-[13px] font-medium text-brand underline-offset-2"><slot>{{ value }}</slot></span>
  </button>
</template>
