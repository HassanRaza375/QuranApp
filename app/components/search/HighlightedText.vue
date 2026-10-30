<script setup lang="ts">
// Text with the matched part marked. The segments are plain data from highlight() and are rendered as text, never as HTML.
import { highlight } from "~/lib/searchFold";

const props = defineProps<{ text: string; query: string }>();
const segments = computed(() => highlight(props.text, props.query, { teh: true })); // search treats teh marbuta and heh as one letter
</script>

<template>
  <span><template v-for="(s, i) in segments" :key="i"><mark v-if="s.hit" class="rounded-[2px] bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] px-px text-inherit">{{ s.text }}</mark><template v-else>{{ s.text }}</template></template></span>
</template>
