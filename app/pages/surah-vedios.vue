<script setup lang="ts">
// Surah videos (/surah-vedios, the legacy spelling kept). The legacy page said "Coming Soon..." and there is no video content anywhere in the app or its
// data, so this page says that plainly and points to what every surah does have: audio by five reciters (/surah-audios/<n>). Level A: bundled data only.
import { SURAH_ROWS } from "~/data/quranMeta.generated";

useSeoMeta({ title: "Surah videos · Quran App", description: "There are no surah videos yet. Every surah has audio by five reciters.", robots: "noindex, follow" });
</script>

<template>
  <article class="mx-auto max-w-[760px]" data-testid="videos-page">
    <h1 class="font-serif text-[30px] font-medium leading-tight md:text-[36px]">Surah videos</h1>
    <p class="mt-2 text-[16px]" data-testid="videos-none">There are no videos in the app yet.</p>
    <p class="mt-2 text-[15px] leading-relaxed text-ink-2">Every surah does have audio instead: five reciters, to play here or to save and listen to with no connection. Choose a surah.</p>

    <ol class="mt-5 grid grid-cols-2 gap-x-6 border-t sm:grid-cols-3 md:grid-cols-4" aria-label="Surahs" data-testid="videos-list">
      <li v-for="s in SURAH_ROWS" :key="s.n" class="border-b">
        <NuxtLink :to="`/surah-audios/${s.n}`" :prefetch="false" class="flex min-h-11 items-center gap-2 py-2 hover:text-brand" :data-testid="`videos-surah-${s.n}`">
          <span class="w-7 shrink-0 text-right text-[12.5px] tabular-nums text-ink-2">{{ s.n }}</span>
          <span class="truncate text-[14.5px]">{{ s.name }}</span>
        </NuxtLink>
      </li>
    </ol>

    <p class="mt-6 text-[14.5px]">
      <NuxtLink to="/surah-listing" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2 md:min-h-9" data-testid="videos-listing">All surahs to read or play</NuxtLink>
    </p>
  </article>
</template>
