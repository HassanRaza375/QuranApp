<script setup lang="ts">
// One setting: label and description on the left, the control on the right (below on mobile).
// `inline` makes the whole row the tap target for a switch (a <label>), so the target is the row, not the small switch.
import { useId } from "vue";

const props = defineProps<{ label: string; desc?: string; inline?: boolean; stack?: boolean }>();
const id = useId();
const labelId = `row-${id}`;
const tag = computed(() => (props.inline ? "label" : "div"));
</script>

<template>
  <component
    :is="tag"
    class="flex min-h-14 gap-3 px-4 py-3.5"
    :class="[inline ? 'cursor-pointer flex-row items-center justify-between' : stack ? 'flex-col' : 'flex-col md:flex-row md:items-center md:justify-between md:gap-6']"
  >
    <span class="block min-w-0 flex-1">
      <span :id="labelId" class="block text-[14px] font-medium">{{ label }}</span>
      <span v-if="desc" class="mt-0.5 block text-[13px] leading-snug text-ink-2">{{ desc }}</span>
      <slot name="extra" :label-id="labelId" />
    </span>
    <span class="shrink-0" :class="stack ? 'block' : ''"><slot :label-id="labelId" /></span>
  </component>
</template>
