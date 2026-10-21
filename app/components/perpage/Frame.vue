<script setup lang="ts">
// The framed text of one page (prototype `mp-frame`): a thin head, then each surah's run of ayahs as flowing, justified Arabic with the
// reader's ayah markers (and a small sign after a verse of prostration, from the bundled list). A banner and the Bismillah appear only where a surah starts on the page. It is flowing text, not mushaf lines.
import { isSajdaAyah, SAJDA_SIGN_LABEL } from "~/lib/sajda";

export interface FrameSegment {
  surah: number;
  from: number;
  to: number;
  starts: boolean;
  bismillah: boolean;
  /** the surah's long Arabic name, from the data */
  arLong: string;
  ayahs: string[];
}

defineProps<{
  page: number;
  juz: string;
  names: string;
  segments: FrameSegment[];
  bismillah: string | null;
  bismillahState: "none" | "loading" | "ready";
}>();
</script>

<template>
  <div class="frame rounded-[14px] border bg-surface px-4 pb-6 pt-4 md:px-10 md:pb-8" data-testid="page-frame">
    <div class="flex items-baseline justify-between gap-3 border-b pb-3 text-[12.5px] text-ink-2" data-testid="page-head">
      <span data-testid="page-juz">{{ juz }}</span>
      <span class="min-w-0 truncate text-center" data-testid="page-names">{{ names }}</span>
      <span class="tabular-nums" data-testid="page-no">{{ page }}</span>
    </div>
    <template v-for="g in segments" :key="`${g.surah}-${g.from}`">
      <section :aria-label="`Surah ${g.surah}, ayahs ${g.from} to ${g.to}`" :data-surah="g.surah" data-testid="page-segment">
        <template v-if="g.starts">
          <h2 class="ar mt-6 text-center !text-[24px] !leading-[2] md:!text-[28px]" lang="ar" dir="rtl" data-testid="surah-banner">{{ g.arLong }}</h2>
          <template v-if="g.bismillah">
            <p v-if="bismillahState === 'ready'" class="ar py-3 text-center !text-[22px] md:!text-[26px]" lang="ar" dir="rtl" data-testid="page-bismillah">{{ bismillah }}</p>
            <div v-else-if="bismillahState === 'loading'" class="h-[72px]" aria-hidden="true" />
          </template>
        </template>
        <p class="ar page-text mt-4" lang="ar" dir="rtl" data-testid="page-text">
          <template v-for="(t, i) in g.ayahs" :key="g.from + i">{{ t }}<span class="verse-mark" data-testid="verse-mark" :data-ayah="g.from + i"><span class="sr-only" lang="en" dir="ltr"> ayah </span>{{ g.from + i }}</span><span v-if="isSajdaAyah(g.surah, g.from + i)" class="sajda-sign" data-testid="sajda-sign" :data-surah="g.surah" :data-ayah="g.from + i" role="img" :aria-label="SAJDA_SIGN_LABEL"><Icon name="lucide:arrow-down-to-line" size="16" aria-hidden="true" /></span> </template>
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-text {
  text-align: justify;
  overflow-wrap: break-word;
}
.sajda-sign {
  display: inline-flex;
  vertical-align: middle;
  margin-inline: 2px 8px;
  color: var(--ink-2);
}
.verse-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  margin-inline: 4px 8px;
  padding-inline: 2px;
  border: 1px solid var(--gold);
  border-radius: 9999px;
  font-family: var(--font-sans);
  font-size: 11.5px;
  line-height: 1;
  vertical-align: middle;
  color: var(--ink-2);
  direction: ltr;
}
</style>
