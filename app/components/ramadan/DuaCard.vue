<script setup lang="ts">
// A Qur'anic dua (2:201), read from the cached surah text (never typed), and the hadith duas as references only until a verified text set
// exists. The Arabic comes from the device's cache or one small request, as the Library does.
import { RAMADAN_DUAS } from "@legacy/utils/ramadanContent";
import { CHAPTERS, getCached } from "~/db/revampDb";
import type { Chapter } from "~/lib/chapter";
import { surahHref } from "~/lib/readerLinks";

const SURAH = 2;
const AYAH = 201;
const snippets = useAyahSnippets();
const english = ref<string | null>(null);
const snippet = computed(() => snippets.get(SURAH, AYAH));
onMounted(async () => {
  snippets.request(SURAH, AYAH);
  const cached = await getCached<Chapter>(CHAPTERS, SURAH);
  english.value = cached?.english?.[AYAH - 1] ?? null;
});
// the hadith duas: the legacy references only (no text), skipping the entry that is the Qur'an's own dua
const hadith = RAMADAN_DUAS.filter((d) => !/^Qur.an/.test(d.reference)).map((d) => d.reference);
</script>

<template>
  <section aria-labelledby="dua-h" class="rounded-[10px] border p-4" data-testid="dua">
    <h2 id="dua-h" class="text-[15px] font-medium">A dua from the Qur’an</h2>
    <p v-if="snippet && snippet !== 'loading' && snippet.state === 'text'" class="ar mt-2 text-right" lang="ar" dir="rtl" data-testid="dua-arabic">{{ snippet.text }}</p>
    <div v-else-if="snippet === 'loading' || !snippet" class="mt-2 h-8 w-2/3 animate-pulse rounded bg-muted" aria-hidden="true" data-testid="dua-loading" />
    <p v-else class="mt-2 text-[13px] text-ink-2" data-testid="dua-unavailable">Text appears once you are online or have opened this surah.</p>
    <p v-if="english" class="mt-2 text-[14px]" data-testid="dua-english">{{ english }}</p>
    <p class="mt-1 text-[12.5px] text-ink-2">Qur’an {{ SURAH }}:{{ AYAH }} · <NuxtLink :to="surahHref(SURAH, AYAH)" class="inline-flex min-h-11 items-center text-brand underline md:min-h-0" data-testid="dua-read">Read in the surah</NuxtLink></p>
    <h3 class="mt-4 text-[13px] font-medium">Duas from the hadith</h3>
    <p class="text-[12.5px] text-ink-2">References only. The text will be added from a verified set.</p>
    <ul class="mt-1 list-disc space-y-0.5 pl-5 text-[13.5px]" data-testid="dua-references"><li v-for="r in hadith" :key="r">{{ r }}</li></ul>
  </section>
</template>
