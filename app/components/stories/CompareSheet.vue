<script setup lang="ts">
// Compare tellings: the story's primary and supporting passages with their references, ayah counts and the data's description where
// there is one ("No description recorded yet." where there is none). No comparison is written here. Each opens in the reader.
import { useMediaQuery } from "@vueuse/core";
import { surahHref } from "~/lib/readerLinks";
import { refText, tellings, type QuranStory } from "~/lib/stories";

const props = defineProps<{ story: QuranStory; open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const isDesktop = useMediaQuery("(min-width: 768px)");
const model = computed({ get: () => props.open, set: (v) => !v && emit("close") });
const rows = computed(() => tellings(props.story));
</script>

<template>
  <Sheet v-model:open="model">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[440px] md:max-w-none" data-testid="compare-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Compare tellings</SheetTitle>
        <SheetDescription class="text-[13px]">The passages that tell {{ story.title }}, with the descriptions that exist in the data.</SheetDescription>
      </SheetHeader>
      <ul class="space-y-3">
        <li v-for="(r, i) in rows" :key="i" class="rounded-[10px] border p-3" data-testid="telling">
          <p class="flex justify-between text-[12px] text-ink-2"><span data-testid="telling-kind">{{ r.kind }}</span><span>{{ r.ayahs }} {{ r.ayahs === 1 ? "ayah" : "ayahs" }}</span></p>
          <p class="mt-0.5 text-[14.5px] font-medium">{{ r.title ?? refText(r.ref) }}</p>
          <p v-if="r.title" class="text-[12.5px] text-ink-2">{{ refText(r.ref) }}</p>
          <p v-if="r.description" class="mt-1 text-[13.5px]" data-testid="telling-description">{{ r.description }}</p>
          <p v-else class="mt-1 text-[13.5px] text-ink-3" data-testid="telling-none">No description recorded yet.</p>
          <NuxtLink :to="surahHref(r.ref.surahNumber, r.ref.ayahStart)" class="mt-1 inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-8" data-testid="telling-read">Read passage</NuxtLink>
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>
