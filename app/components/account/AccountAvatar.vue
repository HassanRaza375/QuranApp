<script setup lang="ts">
// The profile picture, shown only to its owner (Account area and the header menu). The default is geometric, with no silhouette: a pointed-arch outline
// with the person's initial. A photo is only ever the one the person chose to upload (17F); the Google photo is never imported.
const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: number }>(), { src: null, size: 40 });
const initial = computed(() => (Array.from(props.name.trim())[0] ?? "?").toUpperCase());
</script>

<template>
  <img v-if="src" :src="src" alt="" class="shrink-0 rounded-full border object-cover" :style="{ width: `${size}px`, height: `${size}px` }" data-testid="account-photo" />
  <svg v-else :width="size" :height="size" viewBox="0 0 40 40" class="shrink-0 text-ink-2" role="img" :aria-label="`Default picture for ${name}`" data-testid="account-monogram">
    <path d="M8 35V18.5C8 11.5 13.5 6.5 20 3c6.5 3.5 12 8.5 12 15.5V35z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    <text x="20" y="27" text-anchor="middle" font-size="14" font-weight="500" fill="currentColor" style="font-family: var(--font-sans)">{{ initial }}</text>
  </svg>
</template>
