<script setup lang="ts">
// One entry in a list: the Arabic name (from the data), the name, a short summary, how many ayahs it points at, a basis tag only when the Qur'an does not
// state it outright, and the thread of where it appears. The star saves it under the module's legacy bookmark key.
import { MODULES } from "~/lib/knowledge/modules";
import { surahsOf, threadPositions } from "~/lib/knowledge/refs";
import type { KEntry } from "~/lib/knowledge/types";

const props = defineProps<{ entry: KEntry; saved: boolean }>();
defineEmits<{ star: [] }>();
const marks = computed(() => threadPositions(props.entry));
const surahs = computed(() => surahsOf([...props.entry.mentions, ...props.entry.passages, ...props.entry.also]).length);
const to = computed(() => `${MODULES[props.entry.module].route}/${props.entry.id}`);
</script>

<template>
  <li class="relative rounded-[10px] border p-4 transition-colors hover:bg-sunken/60" data-testid="k-card" :data-id="entry.id">
    <NuxtLink :to="to" class="block pr-11 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[10px] focus-visible:after:ring-2 focus-visible:after:ring-ring" data-testid="k-card-link">
      <span class="ar block !text-[24px] !leading-[1.8]" lang="ar" dir="rtl" aria-hidden="true">{{ entry.arabic }}</span>
      <span class="mt-1 block text-[16px] font-medium">{{ entry.name }}</span>
      <span class="mt-1 line-clamp-3 block text-[13.5px] text-ink-2">{{ entry.summary }}</span>
      <span class="mt-2 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-2">
        <span class="rounded-full border px-2 py-0.5 text-[11.5px]" data-testid="k-type">{{ entry.typeLabel }}</span>
        <span v-if="entry.basisLabel" class="rounded-full border border-dashed px-2 py-0.5 text-[11.5px]" data-testid="k-basis">{{ entry.basisLabel }}</span>
        <span class="tabular-nums" data-testid="k-count">{{ marks.length }} {{ marks.length === 1 ? "ayah" : "ayahs" }} in {{ surahs }} {{ surahs === 1 ? "surah" : "surahs" }}</span>
      </span>
    </NuxtLink>
    <div v-if="marks.length" class="mt-3"><QuranThread :marks="marks" :label="`Where ${entry.name} appears in the Qur’an`" /></div>
    <div class="absolute right-1.5 top-1.5 z-10"><ListingStarButton :saved="saved" :name="entry.name" @toggle="$emit('star')" /></div>
  </li>
</template>
