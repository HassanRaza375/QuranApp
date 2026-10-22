<script setup lang="ts">
// The whole Qur'an as one line (all 6,236 ayahs): thin ticks are the juz boundaries and accent lines are positions. Search uses it for "where
// your results fall"; Downloads, the knowledge modules and Goals reuse it in later phases. Everything is computed from the app's ayah table.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { TOTAL_AYAHS_IN_QURAN } from "~/lib/quranCounts";
import { absolute, JUZ } from "~/lib/quranMeta";

defineProps<{ marks?: readonly number[]; label: string; scale?: boolean }>();
const juzLines = JUZ.slice(1).map((j) => absolute(j.startSurah, j.startAyah) - 1);
const first = SURAH_ROWS[0]!.name;
const last = SURAH_ROWS[SURAH_ROWS.length - 1]!.name;
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${TOTAL_AYAHS_IN_QURAN} 22`" preserveAspectRatio="none" role="img" :aria-label="label" class="block h-[22px] w-full" data-testid="thread">
      <rect x="0" y="6" :width="TOTAL_AYAHS_IN_QURAN" height="10" rx="5" class="fill-sunken" />
      <line v-for="p in juzLines" :key="`j${p}`" :x1="p" :x2="p" y1="4" y2="18" class="stroke-border" stroke-width="1" vector-effect="non-scaling-stroke" />
      <line v-for="(p, i) in marks ?? []" :key="`m${i}`" :x1="p - 1" :x2="p - 1" y1="2" y2="20" class="stroke-brand" stroke-width="2" vector-effect="non-scaling-stroke" data-testid="thread-mark" />
    </svg>
    <div v-if="scale" class="mt-1 flex justify-between text-[11px] text-ink-2" aria-hidden="true"><span>{{ first }}</span><span>{{ last }}</span></div>
  </div>
</template>
