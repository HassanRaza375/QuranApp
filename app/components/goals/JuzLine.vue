<script setup lang="ts">
// The whole Qur'an as one line of 30 juz (prototype `.spine`): done juz filled, the current one filled as far as the saved place, the rest empty.
// Colour is never the only signal: the sentence beside it says how many juz are complete, and the image has the same sentence as its label.
import type { JuzCell } from "~/lib/goals/model";

const props = defineProps<{ cells: JuzCell[]; done: number }>();
const label = computed(() => `${props.done} of 30 juz complete${props.cells.find((c) => c.state === "current") ? `, juz ${props.cells.find((c) => c.state === "current")!.n} in progress` : ""}`);
</script>

<template>
  <div>
    <div class="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-0.5" role="img" :aria-label="label" data-testid="goals-juz">
      <i
        v-for="c in cells"
        :key="c.n"
        class="block h-[34px] rounded-[2px] bg-sunken"
        :class="c.state === 'done' ? '!bg-brand' : ''"
        :style="c.state === 'current' ? { background: `linear-gradient(90deg, var(--accent) ${c.part}%, var(--sunken) ${c.part}%)` } : undefined"
        :title="`Juz ${c.n}`"
        :data-state="c.state"
      />
    </div>
    <div class="mt-1 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-0.5 text-center text-[10px] text-ink-2" aria-hidden="true">
      <span v-for="c in cells" :key="c.n" :class="c.n === 1 || c.n % 5 === 0 ? '' : 'max-sm:invisible'">{{ c.n }}</span>
    </div>
  </div>
</template>
