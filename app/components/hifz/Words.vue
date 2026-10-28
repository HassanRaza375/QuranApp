<script setup lang="ts">
// An ayah as words, on the page (not in a card). Inline Arabic text that wraps, never letter-spaced or cut off, scaled by the Arabic size setting.
// Interactive (recite): every word is a button of at least 44px; a hidden word keeps its width but shows no text, and a screen reader is told
// only "word 3, hidden", never the word. Not interactive (listen, read along, fade): plain spans.
const props = defineProps<{
  words: string[];
  hidden?: ReadonlySet<number>;
  slips?: ReadonlySet<number>;
  interactive?: boolean;
  /** the whole ayah is lit (it is being played) */
  lit?: boolean;
}>();
const emit = defineEmits<{ pick: [index: number] }>();
const isHidden = (i: number) => !!props.hidden?.has(i);
const isSlip = (i: number) => !!props.slips?.has(i);
const label = (i: number) => (isHidden(i) ? `Word ${i + 1}, hidden. Reveal it (counts as a slip)` : isSlip(i) ? `Word ${i + 1}, marked as a slip. Press to clear` : `Word ${i + 1}. Press to mark a slip`);
</script>

<template>
  <p class="ar rounded-lg px-2 text-center transition-colors" :class="lit ? 'bg-accent' : ''" dir="rtl" lang="ar" data-testid="hifz-words" :data-lit="lit ? 'true' : undefined">
    <template v-for="(w, i) in words" :key="i">
      <button
        v-if="interactive"
        type="button"
        class="min-h-11 rounded-md px-[.12em] align-middle"
        :class="[isHidden(i) ? 'bg-sunken' : '', isSlip(i) ? 'bg-weak/15 text-weak' : '']"
        :aria-label="label(i)"
        :aria-pressed="isSlip(i)"
        :data-testid="`word-${i}`"
        :data-state="isHidden(i) ? 'hidden' : isSlip(i) ? 'slip' : 'shown'"
        @click="emit('pick', i)"
      >
        <span :class="isHidden(i) ? 'invisible' : ''">{{ w }}</span>
      </button>
      <span v-else class="rounded-md px-[.12em]" :class="isHidden(i) ? 'bg-sunken' : ''" :data-state="isHidden(i) ? 'hidden' : 'shown'">
        <span :class="isHidden(i) ? 'invisible' : ''" :aria-hidden="isHidden(i) ? 'true' : undefined">{{ w }}</span>
      </span>
      {{ " " }}
    </template>
  </p>
</template>
