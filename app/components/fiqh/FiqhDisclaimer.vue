<script setup lang="ts">
// The study-aid line at the foot of a Daily Fiqh page (the legacy app's words), with the marja's official site.
import type { Marja } from "@legacy/data/wajibat/types";

defineProps<{ marja?: Marja | null }>();
</script>

<template>
  <p class="mt-10 rounded-[10px] border px-4 py-3 text-[13.5px] text-ink-2" data-testid="fiqh-disclaimer">
    This is a study aid based on the published rulings of {{ marja ? marja.name.en : "the maraji'" }}. For your own situation, consult your marja's official risala or office.
    <template v-if="marja"><a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="ml-1 underline">{{ marja.officialSite.replace(/^https?:\/\//, "") }}</a></template>
  </p>
</template>
