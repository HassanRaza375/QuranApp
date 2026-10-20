<script setup lang="ts">
// One event: the date block, the name, the Hijri date and "in N days", the tradition tag, the category, the data's own note, any reviewed
// wording for the view, and the bell that saves a reminder to your list (no alert is sent).
import { categoryLabel, expectedText, relativeDays, TRADITION_TAG, wordingFor, type PlacedEvent } from "~/lib/islamicEvents";
import { formatShortDate } from "~/lib/ramadanText";

const props = defineProps<{ placed: PlacedEvent; tradition: "sunni" | "jafari" | null; marker: "next" | "today" | null; reminded: boolean }>();
defineEmits<{ bell: [] }>();
const e = computed(() => props.placed.event);
const day = computed(() => Number(props.placed.date.slice(8, 10)));
const mon = computed(() => formatShortDate(props.placed.date).split(" ").slice(-1)[0]);
const weekday = computed(() => formatShortDate(props.placed.date).split(" ")[0]);
const wording = computed(() => wordingFor(e.value, props.tradition));
</script>

<template>
  <li class="flex items-start gap-3 border-b py-3" data-testid="event-row" :data-id="e.id" :data-date="placed.date">
    <div class="w-14 shrink-0 text-center" aria-hidden="true">
      <b class="block text-[22px] leading-none">{{ day }}</b>
      <span class="block text-[12px] text-ink-2">{{ mon }}</span>
      <small class="block text-[11px] text-ink-2">{{ weekday }}</small>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-[15px] font-medium" data-testid="event-name">
        {{ e.name }}
        <span v-if="marker" class="ml-1 rounded-full bg-brand px-2 py-0.5 align-middle text-[11px] font-normal text-background" data-testid="event-marker">{{ marker === "today" ? "Today" : "Next" }}</span>
      </p>
      <p class="mt-0.5 flex flex-wrap gap-1.5">
        <span class="rounded-full border px-2 py-0.5 text-[11.5px]" :class="e.tradition === 'shared' ? '' : 'border-dashed'" data-testid="event-tradition">{{ TRADITION_TAG[e.tradition] }}</span>
        <span class="rounded-full border px-2 py-0.5 text-[11.5px]" data-testid="event-category">{{ categoryLabel(e.category) }}</span>
      </p>
      <p class="mt-1 text-[13px] text-ink-2" data-testid="event-date">{{ expectedText(placed.date) }} · {{ placed.hijriLabel }} · {{ relativeDays(placed.daysUntil) }}</p>
      <p v-if="e.note" class="mt-1 text-[13.5px]" data-testid="event-note">{{ e.note }}</p>
      <p v-for="(w, i) in wording" :key="i" class="mt-1 text-[13.5px]" data-testid="event-wording"><b v-if="w.label">{{ w.label }}: </b>{{ w.text }}</p>
      <p v-if="e.source && wording.length" class="text-[12px] text-ink-2" data-testid="event-source">{{ e.source.citation }}</p>
    </div>
    <div class="flex shrink-0 flex-col items-center">
      <button
        type="button"
        class="inline-flex size-11 items-center justify-center rounded-full hover:bg-accent"
        :class="reminded ? 'text-brand' : 'text-ink-2'"
        :aria-pressed="reminded"
        :aria-label="`${reminded ? 'Remove the reminder for' : 'Save a reminder for'} ${e.name}`"
        data-testid="event-bell"
        @click="$emit('bell')"
      >
        <svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true" :fill="reminded ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </button>
      <span v-if="reminded" class="text-[10.5px] leading-tight text-ink-2" data-testid="event-saved">Saved to your list</span>
    </div>
  </li>
</template>
