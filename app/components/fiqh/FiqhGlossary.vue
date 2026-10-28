<script setup lang="ts">
// /fiqh/glossary: the 94 terms of the data, each with the book it is defined in (the legacy app's words). Filter in English, Urdu or Arabic; #<term id> opens a term.
import { normalizeWajibatText } from "@legacy/utils/wajibatSearch";
import { WAJIBAT_GLOSSARY } from "~/lib/fiqh/data";
import { ARABIC_LANG, URDU } from "~/lib/fiqh/ui";

useSeoMeta({ title: "Glossary · Daily Fiqh · Quran App", description: "Terms used in Daily Fiqh, with sourced definitions." });
const query = ref("");
const sorted = [...WAJIBAT_GLOSSARY].sort((a, b) => normalizeWajibatText(a.term).localeCompare(normalizeWajibatText(b.term)));
const filtered = computed(() => {
  const q = normalizeWajibatText(query.value);
  return q ? sorted.filter((g) => [g.term, g.arabic, g.urdu, g.definition.en, g.definition.ur].some((f) => f && normalizeWajibatText(f).includes(q))) : sorted;
});
const letterOf = (term: string) => normalizeWajibatText(term).charAt(0).toUpperCase();
const letters = computed(() => [...new Set(filtered.value.map((g) => letterOf(g.term)))]);

const route = useRoute();
onMounted(async () => {
  if (!route.hash) return;
  await nextTick();
  document.querySelector(route.hash)?.scrollIntoView({ block: "start" });
});
</script>

<template>
  <section class="mx-auto max-w-4xl" data-testid="fiqh-glossary">
    <div class="text-[13px] text-ink-2"><NuxtLink to="/fiqh" class="underline" data-testid="fiqh-back">Daily Fiqh</NuxtLink></div>
    <h1 class="mt-2 font-serif text-[28px] font-medium md:text-[34px]">Glossary</h1>
    <p class="mt-1 max-w-2xl text-[15px] text-ink-2">Terms used in this module. Definitions are quoted from the glossary of al-Sistani's <em>Islamic Laws</em> (4th edition); the Arabic and Urdu spellings are the app's own labels.</p>
    <div class="mt-4">
      <label class="sr-only" for="fiqh-glossary-filter">Filter terms</label>
      <Input id="fiqh-glossary-filter" v-model="query" type="search" class="min-h-11" :placeholder="`Filter terms (English, ${URDU}, ${ARABIC_LANG})`" data-testid="fiqh-glossary-filter" />
    </div>
    <p class="mt-3 text-[13px] tabular-nums text-ink-2" data-testid="fiqh-glossary-count">{{ filtered.length }} {{ filtered.length === 1 ? "term" : "terms" }}</p>
    <nav v-if="!query && letters.length" class="mt-2 flex flex-wrap gap-1" aria-label="Jump to a letter"><a v-for="l in letters" :key="l" :href="`#letter-${l}`" class="grid min-h-11 min-w-11 place-items-center rounded-md border text-[13px] hover:bg-accent md:min-h-8 md:min-w-8">{{ l }}</a></nav>

    <p v-if="!filtered.length" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center text-[14px]" data-testid="fiqh-glossary-empty">No terms match “{{ query }}”.</p>
    <dl v-else class="mt-3 divide-y">
      <template v-for="(g, i) in filtered" :key="g.id">
        <div v-if="!query && (i === 0 || letterOf(filtered[i - 1]!.term) !== letterOf(g.term))" :id="`letter-${letterOf(g.term)}`" class="pb-1 pt-4 text-[13px] font-medium text-ink-2">{{ letterOf(g.term) }}</div>
        <div :id="g.id" class="py-3.5" data-testid="fiqh-term">
          <dt class="flex flex-wrap items-baseline gap-x-3"><span class="text-[16px] font-medium">{{ g.term }}</span><span v-if="g.arabic" class="ar !text-[20px] !leading-[1.6]" lang="ar" dir="rtl">{{ g.arabic }}</span><span v-if="g.urdu" class="text-[16px] text-ink-2" lang="ur" dir="rtl">{{ g.urdu }}</span></dt>
          <dd class="mt-1 max-w-2xl text-[14.5px]">{{ g.definition.en }}
            <span v-if="g.source" class="mt-1 block text-[12.5px] text-ink-2"><a :href="g.source.url" target="_blank" rel="noopener noreferrer" class="underline">{{ g.source.title }}</a>, {{ g.source.reference }}</span>
            <span v-else class="mt-1 block text-[12.5px] text-ink-2">Explanation written by the app</span>
          </dd>
        </div>
      </template>
    </dl>
  </section>
</template>
