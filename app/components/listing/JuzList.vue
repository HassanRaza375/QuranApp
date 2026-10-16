<script setup lang="ts">
// The Juz tab: "Juz n", where it starts and which pages it covers. There are no juz names (no verified source) and no
// juz audio (the data has none), so a row has a star and an open link only.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import type { JuzInfo } from "~/lib/quranMeta";
import type { LastRead } from "~/lib/readingMarker";
import { juzHref } from "~/lib/readerLinks";

defineProps<{ rows: JuzInfo[]; last: LastRead | null; saved: Set<string> }>();
defineEmits<{ star: [n: number] }>();
const surahName = (n: number) => SURAH_ROWS[n - 1]!.name;
</script>

<template>
  <ul class="border-t" data-testid="juz-list">
    <li v-for="j in rows" :key="j.n" class="listing-row border-b" :data-testid="`juz-row-${j.n}`">
      <div class="flex items-center gap-2 px-1 md:gap-3 md:px-3">
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full border text-[13px] tabular-nums"
          :class="last?.juz === j.n ? 'border-brand font-medium' : 'text-ink-2'"
          :data-testid="last?.juz === j.n ? 'last-read-marker' : undefined"
        >
          {{ j.n }}
        </span>
        <NuxtLink :to="juzHref(j.startSurah, j.startAyah)" class="flex min-h-14 min-w-0 flex-1 flex-col justify-center py-2" :aria-label="`Open Juz ${j.n}`">
          <span class="font-serif text-[16px] font-medium">Juz {{ j.n }}</span>
          <span class="block text-[12.5px] text-ink-2">Starts at {{ surahName(j.startSurah) }} {{ j.startSurah }}:{{ j.startAyah }} · Pages {{ j.firstPage }}–{{ j.lastPage }}</span>
          <span v-if="j.midPageStart" class="block text-[12.5px] text-ink-2">Starts partway down page {{ j.firstPage }}</span>
          <span v-if="last?.juz === j.n" class="block text-[12.5px] font-medium text-brand" data-testid="last-read-text">
            <span aria-hidden="true" class="mr-1 inline-block size-2.5 rounded-full border border-brand align-[-1px]" style="background: linear-gradient(90deg, var(--accent) 50%, transparent 50%)" />
            Last read: {{ surahName(last.surahNo) }} {{ last.surahNo }}:{{ last.ayahNo }}
          </span>
        </NuxtLink>
        <ListingStarButton :saved="saved.has(`juz:${j.n}`)" :name="`Juz ${j.n}`" @toggle="$emit('star', j.n)" />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.listing-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 72px;
}
</style>
