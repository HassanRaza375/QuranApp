<script setup lang="ts">
// /fiqh/<category>: the topics of one category, with how many of their rulings the chosen marja' has text for ("N of M rulings shown for X"; the prototype's meter, from the real data).
// A category with no topics says "Coming later". The category's ruling data is loaded here for the count, and saved for offline.
import type { MarjaId } from "@legacy/data/wajibat/types";
import { categoryIcon } from "~/lib/fiqh/badges";
import { getCategoryById, getRulingById, getTopicById, loadCategory } from "~/lib/fiqh/data";
import { cacheLoadedChunks } from "~/lib/fiqh/offline";
import { MARJA_SHORT, viewOf, visibleTo } from "~/lib/fiqh/visibility";

const route = useRoute();
const { marja, marjaId, lang } = useFiqh();
const category = computed(() => getCategoryById(String(route.params.category)));
const topics = computed(() => (category.value?.topicIds ?? []).map((id) => getTopicById(id)).filter((t) => !!t));
useSeoMeta({ title: () => (category.value ? `${category.value.title.en} · Daily Fiqh · Quran App` : "Daily Fiqh · Quran App"), description: () => category.value?.summary.text.en });

const ready = ref(false);
const failed = ref(false);
async function load() {
  failed.value = false;
  try {
    await loadCategory(String(route.params.category));
    ready.value = true;
    void cacheLoadedChunks();
  } catch {
    failed.value = true;
  }
}
onMounted(load);

/** For each topic: its rulings that a follower of the chosen marja' sees, and how many of them have text for him (not missing, not held). */
const counts = computed(() => {
  const out = new Map<string, { total: number; shown: number }>();
  const id = marjaId.value as MarjaId | null;
  if (!ready.value || !id) return out;
  for (const t of topics.value) {
    let total = 0;
    let shown = 0;
    for (const rid of t!.rulingIds) {
      const r = getRulingById(rid);
      if (!r || !visibleTo(r, id)) continue;
      total++;
      if (viewOf(r, id, lang.value, marja.value?.status === "pending-sources").kind === "text") shown++;
    }
    out.set(t!.id, { total, shown });
  }
  return out;
});
</script>

<template>
  <section v-if="category" class="mx-auto max-w-4xl" data-testid="fiqh-category">
    <div class="text-[13px] text-ink-2"><NuxtLink to="/fiqh" class="underline" data-testid="fiqh-back">Daily Fiqh</NuxtLink></div>
    <div class="mt-2 flex flex-col-reverse gap-x-6 gap-y-1 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0 flex-1">
        <h1 class="flex items-center gap-2 font-serif text-[28px] font-medium md:text-[34px]"><Icon :name="categoryIcon(category.id)" size="26" class="text-ink-2" />{{ category.title.en }}</h1>
        <p v-if="category.title.ur" class="text-[17px] text-ink-2" lang="ur" dir="rtl" style="text-align: left">{{ category.title.ur }}</p>
        <p class="mt-2 max-w-xl text-[15.5px] text-ink-2">{{ category.summary.text.en }}</p>
      </div>
      <p class="ar !text-[34px] !leading-[1.8] max-md:!text-left" lang="ar" dir="rtl">{{ category.arabicTerm }}</p>
    </div>

    <div class="mt-4 space-y-3"><FiqhNotices /><FiqhMarjaBar /></div>

    <p v-if="!topics.length" class="mt-6 rounded-[10px] border border-dashed px-4 py-8 text-center text-[14.5px]" data-testid="fiqh-category-empty">Coming later. Rulings are added one topic at a time, and only once each is sourced from the marja's own book.</p>

    <p v-if="failed" class="mt-4 rounded-[10px] border border-dashed px-4 py-3 text-[13.5px]" role="status" data-testid="fiqh-category-unavailable">
      This category’s rulings aren’t on your device yet. Connect to load them.
      <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-8" @click="load">Try again</button>
    </p>

    <ul v-if="topics.length" class="mt-6 grid gap-3 md:grid-cols-2" data-testid="fiqh-topics">
      <li v-for="t in topics" :key="t!.id">
        <NuxtLink :to="`/fiqh/${category.id}/${t!.id}`" class="flex h-full min-h-11 flex-col gap-1 rounded-[10px] border px-4 py-3.5 hover:bg-accent" data-testid="fiqh-topic-card" :data-id="t!.id">
          <span class="flex items-start gap-2"><span class="flex-1 text-[15.5px] font-medium">{{ t!.title.en }}</span><span v-if="t!.arabicTerm" class="ar !text-[20px] !leading-[1.6]" lang="ar" dir="rtl">{{ t!.arabicTerm }}</span></span>
          <span v-if="t!.title.ur" class="text-[15px] text-ink-2" lang="ur" dir="rtl" style="text-align: left">{{ t!.title.ur }}</span>
          <span class="text-[13.5px] text-ink-2">{{ t!.summary.text.en }}</span>
          <span class="text-[12.5px] text-ink-2" data-testid="fiqh-topic-count">
            <template v-if="marja && counts.get(t!.id)">{{ counts.get(t!.id)!.shown }} of {{ counts.get(t!.id)!.total }} {{ counts.get(t!.id)!.total === 1 ? "ruling" : "rulings" }} shown for {{ MARJA_SHORT[marja.id] }}</template>
            <template v-else>{{ t!.rulingIds.length }} {{ t!.rulingIds.length === 1 ? "ruling" : "rulings" }}</template>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <FiqhDisclaimer :marja="marja" />
  </section>
  <section v-else class="mx-auto max-w-2xl" data-testid="fiqh-category-missing">
    <h1 class="font-serif text-[26px] font-medium">No such section</h1>
    <p class="mt-2 text-[14.5px] text-ink-2">There is no section called “{{ route.params.category }}” in Daily Fiqh.</p>
    <p class="mt-3"><NuxtLink to="/fiqh" class="text-brand underline">Back to Daily Fiqh</NuxtLink></p>
  </section>
</template>
