<script setup lang="ts">
// Save / unsave star. Filled when saved (an inline SVG, because the icon set only has the outline), and aria-pressed.
defineProps<{ saved: boolean; name: string }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-accent md:size-9"
    :class="saved ? 'text-brand' : 'text-ink-2'"
    :aria-pressed="saved"
    :aria-label="saved ? `Remove ${name} from saved` : `Save ${name}`"
    data-testid="star"
    @click="$emit('toggle')"
  >
    <svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </svg>
  </button>
</template>
