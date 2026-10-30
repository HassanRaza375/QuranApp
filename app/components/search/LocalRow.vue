<script setup lang="ts">
// One result in the Surahs, People, Stories, Duas, Knowledge base or Notes group. A note on an item that has no page is shown but not linked.
import type { LocalHit } from "~/lib/searchLocal";

defineProps<{ hit: LocalHit; query: string }>();
const emit = defineEmits<{ open: [] }>();
</script>

<template>
  <NuxtLink v-if="hit.href" :to="hit.href" class="flex min-h-14 items-center gap-3 py-2.5" @click="emit('open')">
    <span class="min-w-0 flex-1">
      <span class="block text-[14.5px] font-medium"><SearchHighlightedText :text="hit.title" :query="query" /></span>
      <span v-if="hit.subtitle" class="block text-[13px] text-ink-2"><SearchHighlightedText :text="hit.subtitle" :query="query" /></span>
    </span>
    <span v-if="hit.arabic" class="max-w-[45%] shrink-0 text-[19px] leading-snug text-ink-2 sm:text-[20px]" style="font-family: var(--font-arabic)" lang="ar" dir="rtl" aria-hidden="true"><SearchHighlightedText :text="hit.arabic" :query="query" /></span>
  </NuxtLink>
  <div v-else class="flex min-h-14 items-center gap-3 py-2.5">
    <span class="min-w-0 flex-1">
      <span class="block text-[14.5px] font-medium"><SearchHighlightedText :text="hit.title" :query="query" /></span>
      <span v-if="hit.subtitle" class="block text-[13px] text-ink-2"><SearchHighlightedText :text="hit.subtitle" :query="query" /></span>
    </span>
  </div>
</template>
