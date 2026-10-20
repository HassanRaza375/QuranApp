<script setup lang="ts">
// The fasting tracker: the last 7 Ramadan days, private, on this device (`quran:ramadan:v1`). A tap cycles nothing, fasted, didn't fast,
// nothing (the legacy cycle). No streak, no flame, no counts of days in a row. "Plan tomorrow" toggles planned.
import { addDaysKey } from "~/lib/dayKeys";
import { FASTING_LABELS, fastingCounts, nextFastingStatus, trackerStrip, type FastingStatus } from "~/lib/ramadan";
import { formatShortDate } from "~/lib/ramadanText";

const ramadan = useRamadan();
const strip = computed(() => trackerStrip(ramadan.plan.value, ramadan.todayKey.value, ramadan.rec.value.fastingLog));
const counts = computed(() => fastingCounts(ramadan.rec.value.fastingLog));
const tomorrow = computed(() => addDaysKey(ramadan.todayKey.value, 1));
const tomorrowPlanned = computed(() => ramadan.rec.value.fastingLog[tomorrow.value] === "planned");
const announce = ref("");

function tap(d: { day: number; date: string; status: FastingStatus | null }) {
  const next = nextFastingStatus(d.status);
  ramadan.setFasting(d.date, next);
  announce.value = `Day ${d.day}: ${next ? FASTING_LABELS[next] : "cleared"}`;
}
function planTomorrow() {
  const next = tomorrowPlanned.value ? null : "planned";
  ramadan.setFasting(tomorrow.value, next);
  announce.value = next ? "Tomorrow: planned" : "Tomorrow: cleared";
}
</script>

<template>
  <section v-if="strip.length" aria-labelledby="fast-h" class="rounded-[10px] border p-4" data-testid="fasting">
    <h2 id="fast-h" class="text-[15px] font-medium">Fasting tracker</h2>
    <p class="mt-0.5 text-[12.5px] text-ink-2">Tap a day to change it. Private, and stored only on this device.</p>
    <ul class="mt-3 grid grid-cols-7 gap-1.5">
      <li v-for="d in strip" :key="d.date">
        <button
          type="button"
          class="flex min-h-14 w-full flex-col items-center justify-center rounded-lg border px-1 py-1 text-center"
          :class="[d.today ? 'border-brand' : '', d.status === 'fasted' ? 'bg-accent' : d.status === 'missed' ? 'border-dashed' : d.status === 'planned' ? 'border-dashed border-brand' : '']"
          :aria-label="`Day ${d.day}, ${formatShortDate(d.date)}: ${d.status ? FASTING_LABELS[d.status] : 'not marked'}. Press to change.`"
          :data-status="d.status ?? 'none'"
          data-testid="fast-day"
          @click="tap(d)"
        >
          <b class="text-[14px]">{{ d.day }}</b>
          <span class="text-[10.5px] leading-tight text-ink-2" data-testid="fast-status">{{ d.status ? FASTING_LABELS[d.status] : "—" }}</span>
        </button>
      </li>
    </ul>
    <p class="mt-3 text-[12.5px] text-ink-2" data-testid="fast-counts">Fasted {{ counts.fasted }} · Didn’t fast {{ counts.missed }} · Planned {{ counts.planned }}</p>
    <Button variant="outline" class="mt-2 min-h-11 md:min-h-9" :aria-pressed="tomorrowPlanned" data-testid="plan-tomorrow" @click="planTomorrow">{{ tomorrowPlanned ? "Tomorrow: planned" : "Plan tomorrow’s fast" }}</Button>
    <p class="sr-only" role="status" aria-live="polite" data-testid="fast-announce">{{ announce }}</p>
  </section>
</template>
