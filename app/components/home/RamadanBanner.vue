<script setup lang="ts">
// A quiet Ramadan banner on Home, only while Ramadan is under way (the day and today's iftar time, linking to /ramadan). Nothing else on
// Home changes, and no event card (Phase 1's decision).
import { formatClock12 } from "~/lib/prayerClock";

const ramadan = useRamadan();
const plan = ramadan.plan;
const day = computed(() => ramadan.todayDay.value);
const show = computed(() => plan.value.state === "during" && !!plan.value.day);
</script>

<template>
  <NuxtLink v-if="show" to="/ramadan" class="mb-4 flex min-h-11 items-center justify-between gap-3 rounded-[10px] border border-l-[3px] border-l-brand bg-surface px-4 py-3" data-testid="ramadan-banner">
    <span class="flex items-center gap-3">
      <Icon name="lucide:moon" size="18" class="text-brand" aria-hidden="true" />
      <span class="text-[14.5px]"><b>Ramadan</b> · Day {{ plan.day }}<template v-if="day"> · Iftar {{ formatClock12(day.timings.Maghrib) }}</template></span>
    </span>
    <Icon name="lucide:chevron-right" size="16" class="text-ink-2" aria-hidden="true" />
  </NuxtLink>
</template>
