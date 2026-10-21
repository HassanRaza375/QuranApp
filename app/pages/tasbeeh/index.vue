<script setup lang="ts">
// Tasbeeh: the six counters of the legacy page (five dhikr and a custom counter), each with its count and goal. The dhikr text is the legacy
// data (generated, never typed). Counts stay on this device in `quran:tasbeeh:v1`. See docs/pages/tasbeeh.md.
import { TASBEEH_PRESETS } from "~/data/tasbeehPresets.generated";
import { readEntry, type TasbeehEntry } from "~/lib/tasbeeh";

useSeoMeta({ title: "Tasbeeh · Quran App", description: "A dhikr counter. Counts stay on this device.", robots: "noindex" });

const entries = ref<Record<string, TasbeehEntry>>({});
onMounted(() => {
  entries.value = Object.fromEntries(TASBEEH_PRESETS.map((p) => [p.id, readEntry(p.id)]));
});
const of = (id: string) => entries.value[id];
</script>

<template>
  <section data-testid="tasbeeh-index">
    <h1 class="font-serif text-[26px] font-medium md:text-[30px]">Tasbeeh</h1>
    <p class="mt-1 text-[14px] text-ink-2">A dhikr counter. Choose one to start counting. Counts stay on this device.</p>

    <ul class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="p in TASBEEH_PRESETS" :key="p.id">
        <NuxtLink :to="`/tasbeeh/${p.id}`" class="flex h-full min-h-11 flex-col items-center gap-1 rounded-[10px] border bg-surface px-4 py-5 text-center hover:bg-accent" :data-testid="`counter-${p.id}`">
          <span v-if="p.arabic" class="ar !text-[28px] !leading-[1.8]" lang="ar" dir="rtl">{{ p.arabic }}</span>
          <span class="text-[15px] font-medium" data-testid="counter-name">{{ p.transliteration }}</span>
          <span class="text-[13px] text-ink-2">{{ p.meaning }}</span>
          <span class="mt-2 rounded-full border px-3 py-0.5 text-[12.5px] tabular-nums text-ink-2" data-testid="counter-progress">{{ of(p.id)?.count ?? 0 }} / {{ of(p.id)?.target ?? 33 }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
