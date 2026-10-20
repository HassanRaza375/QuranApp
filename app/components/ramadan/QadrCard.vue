<script setup lang="ts">
// Laylat al-Qadr: the legacy app's nights (21, 23, 25, 27, 29) and its note, for both fiqhs, labelled as this app's data. The night that is
// today is marked. No other set of nights is shown until a reviewed source is supplied (CONTENT_TO_VERIFY.md).
import { LAYLAT_AL_QADR_NIGHTS, LAYLAT_AL_QADR_NOTE } from "@legacy/utils/ramadanContent";
import { isQadrNight } from "~/lib/ramadan";

const ramadan = useRamadan();
const day = computed(() => ramadan.plan.value.day);
const tonight = computed(() => isQadrNight(day.value, LAYLAT_AL_QADR_NIGHTS));
</script>

<template>
  <section aria-labelledby="qadr-h" class="rounded-[10px] border p-4" :class="tonight ? 'border-brand' : ''" data-testid="qadr">
    <h2 id="qadr-h" class="text-[15px] font-medium">Laylat al-Qadr <span v-if="tonight" class="ml-2 rounded-full border border-brand px-2 py-0.5 text-[11.5px] text-brand" data-testid="qadr-tonight">Today is one of the nights</span></h2>
    <p class="mt-1 text-[13.5px]" data-testid="qadr-note">{{ LAYLAT_AL_QADR_NOTE }}</p>
    <ul class="mt-3 flex flex-wrap gap-2" aria-label="Nights of the last ten">
      <li v-for="n in LAYLAT_AL_QADR_NIGHTS" :key="n" class="rounded-full border px-3 py-1 text-[13px]" :class="day === n ? 'border-brand bg-accent text-brand' : 'border-dashed'" :aria-current="day === n ? 'date' : undefined" data-testid="qadr-night">Night {{ n }}</li>
    </ul>
    <p class="mt-2 text-[12px] text-ink-2" data-testid="qadr-source">From this app’s data, the same for both fiqhs.</p>
  </section>
</template>
