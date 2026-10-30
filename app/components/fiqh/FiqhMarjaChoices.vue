<script setup lang="ts">
// Choose whose rulings to follow: the three maraji' of the data, each with the books the app quotes. A marja' whose sources are not in the app yet can still be chosen:
// his followers see "Not added yet" everywhere, never another marja's text.
import type { MarjaId } from "@legacy/data/wajibat/types";
import { MARAJI } from "~/lib/fiqh/data";

const { marjaId, setMarja } = useFiqh();
const emit = defineEmits<{ chosen: [id: MarjaId] }>();
const choose = (id: MarjaId) => {
  setMarja(id);
  emit("chosen", id);
};
</script>

<template>
  <div class="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Marja'" data-testid="marja-choices">
    <button
      v-for="m in MARAJI"
      :key="m.id"
      type="button"
      role="radio"
      :aria-checked="marjaId === m.id"
      class="flex min-h-11 flex-col gap-1.5 rounded-[10px] border px-4 py-3.5 text-left hover:bg-accent"
      :class="marjaId === m.id ? 'border-brand bg-accent' : ''"
      :data-testid="`marja-${m.id}`"
      @click="choose(m.id)"
    >
      <span class="text-[15.5px] font-medium">{{ m.name.en }}</span>
      <span class="text-[15px]" lang="ur" dir="rtl">{{ m.name.ur }}</span>
      <span v-for="b in m.books" :key="b.title" class="text-[12.5px] text-ink-2" :lang="b.lang === 'ur' ? 'ur' : undefined">{{ b.title }}<template v-if="b.edition && !b.title.includes(b.edition)"> · {{ b.edition }}</template></span>
      <span v-if="m.status === 'pending-sources'" class="mt-1 text-[12.5px] text-ink-2" data-testid="marja-pending">His rulings are not added yet. Pages will say “Not added yet” and point to his risala.</span>
    </button>
  </div>
</template>
