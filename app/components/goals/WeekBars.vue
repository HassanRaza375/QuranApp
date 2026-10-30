<script setup lang="ts">
// The last seven days as bars (prototype `.week`). The line is today's amount when there is one. Days outside the goal's preferred days are
// hatched. Every bar has its number printed under it (colour and height are never the only signal).
import type { WeekBar } from "~/lib/goals/model";

const props = defineProps<{ bars: WeekBar[]; line: number | null }>();
const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// a little headroom, so the line for today's amount sits inside the bars' box even when it is the tallest thing
const max = computed(() => Math.max(1, (props.line ?? 0) * 1.12, ...props.bars.map((b) => b.count)));
const hatch = "repeating-linear-gradient(135deg, var(--sunken) 0 4px, transparent 4px 8px)";
</script>

<template>
  <div class="flex gap-2" role="list" aria-label="Ayahs read in the last 7 days" data-testid="goals-week">
    <div v-for="b in bars" :key="b.date" class="flex-1 text-center text-[12px] text-ink-2" :class="b.today ? '!text-foreground font-semibold' : ''" role="listitem" :data-date="b.date" :aria-label="`${DAYS[b.weekday]}${b.today ? ' (today)' : ''}: ${b.count} ayahs${b.off ? ', not one of your reading days' : ''}`">
      <span class="relative mb-1 block h-9 overflow-hidden rounded-md bg-sunken" :style="b.off ? { background: hatch } : undefined" aria-hidden="true">
        <b class="absolute inset-x-0 bottom-0 bg-brand" :style="{ height: `${(b.count / max) * 100}%` }" />
        <i v-if="line" class="absolute inset-x-0 border-t border-dashed border-ink-2" :style="{ bottom: `${(line / max) * 100}%` }" />
      </span>
      <span aria-hidden="true">{{ LETTERS[b.weekday] }}</span><br />
      <span class="tabular-nums" aria-hidden="true">{{ b.count || "–" }}</span>
    </div>
  </div>
</template>
