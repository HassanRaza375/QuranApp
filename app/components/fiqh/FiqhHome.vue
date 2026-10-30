<script setup lang="ts">
// /fiqh (prototype `pgFiqh`, with the legacy's own words): choose a marja' first (decision Q2), then search and the categories that have data. A category without topics is
// shown as "Coming later", not linked. "Save all for offline" fetches the data chunks into the device (level B).
import { categoryIcon } from "~/lib/fiqh/badges";
import { ARABIC_LANG, URDU } from "~/lib/fiqh/ui";
import { CATEGORY_CHUNK_COUNT, WAJIBAT_CATEGORIES, getTopicById, loadAllCategories } from "~/lib/fiqh/data";
import * as offline from "~/lib/fiqh/offline";
import { categoryTitle, rulingHref, searchFiqh, topicHref } from "~/lib/fiqh/search";

useSeoMeta({ title: "Daily Fiqh · Quran App", description: "Obligatory acts in Fiqh Ja'fari, quoted from the rulings of the marja' you follow, with their sources." });
const { marjaId, marja } = useFiqh();
const buildId = useRuntimeConfig().app.buildId as string;
const categories = [...WAJIBAT_CATEGORIES].sort((a, b) => a.order - b.order);

const query = ref("");
const results = computed(() => searchFiqh(query.value, marjaId.value));
const resultCount = computed(() => results.value.topics.length + results.value.rulings.length + results.value.glossary.length);
const CAP = 12;
const NuxtLinkTag = resolveComponent("NuxtLink");

const saved = ref<"unknown" | "saving" | "saved" | "error" | "unsupported">("unknown");
onMounted(async () => {
  saved.value = !offline.offlineSupported() ? "unsupported" : (await offline.isAllSaved(buildId)) ? "saved" : "unknown";
});
async function saveAll() {
  saved.value = "saving";
  saved.value = (await offline.saveAll(loadAllCategories, buildId)) ? "saved" : "error";
}
</script>

<template>
  <section class="mx-auto max-w-4xl" data-testid="fiqh-home">
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="font-serif text-[30px] font-medium md:text-[36px]">Daily Fiqh</h1>
        <p class="mt-1 max-w-xl text-[15.5px] text-ink-2">The obligatory acts of Fiqh Ja'fari. Every ruling is quoted from your marja's own published book, with its issue or question number.</p>
      </div>
      <NuxtLink to="/fiqh/glossary" class="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-brand underline md:min-h-9" data-testid="fiqh-glossary-link"><Icon name="lucide:list" size="16" />Glossary</NuxtLink>
    </div>

    <div class="mt-4"><FiqhNotices review-label /></div>

    <!-- first visit: nothing is shown until a marja' is chosen -->
    <div v-if="!marja" class="mt-5 rounded-[10px] border px-4 py-5" data-testid="fiqh-gate">
      <h2 class="text-[17px] font-medium">Choose your marja'</h2>
      <p class="mb-4 mt-1 max-w-xl text-[14px] text-ink-2">You'll only see the rulings of the marja' you choose. You can change this at any time here or in Settings.</p>
      <FiqhMarjaChoices />
    </div>
    <div v-else class="mt-5"><FiqhMarjaBar /></div>

    <div class="mt-5">
      <label class="sr-only" for="fiqh-search">Search topics, rulings and terms</label>
      <Input id="fiqh-search" v-model="query" type="search" class="min-h-11" :placeholder="`Search topics, rulings and terms (English, ${URDU}, ${ARABIC_LANG})`" data-testid="fiqh-search" />
    </div>

    <template v-if="query.trim()">
      <p v-if="!resultCount" class="mt-4 rounded-[10px] border border-dashed px-4 py-6 text-center text-[14px]" data-testid="fiqh-search-empty">No topics, rulings or terms match “{{ query }}”.</p>
      <ul v-else class="mt-2 divide-y" aria-label="Search results" data-testid="fiqh-results">
        <li v-for="t in results.topics.slice(0, CAP)" :key="`t-${t.id}`"><NuxtLink :to="topicHref(t.id)" class="flex min-h-14 flex-col justify-center py-2"><span class="text-[14.5px] font-medium">{{ t.title.en }}</span><span class="text-[13px] text-ink-2">Topic · {{ categoryTitle(t.categoryId) }}</span></NuxtLink></li>
        <li v-for="r in results.rulings.slice(0, CAP)" :key="`r-${r.id}`"><NuxtLink :to="rulingHref(r.topicId, r.id)" class="flex min-h-14 flex-col justify-center py-2"><span class="text-[14.5px] font-medium">{{ r.subject.en }}</span><span class="text-[13px] text-ink-2">Ruling · {{ getTopicById(r.topicId)?.title.en }}</span></NuxtLink></li>
        <li v-for="g in results.glossary.slice(0, CAP)" :key="`g-${g.id}`"><NuxtLink :to="{ path: '/fiqh/glossary', hash: `#${g.id}` }" class="flex min-h-14 flex-col justify-center py-2"><span class="text-[14.5px] font-medium">{{ g.term }}</span><span class="line-clamp-1 text-[13px] text-ink-2">Glossary · {{ g.definition.en }}</span></NuxtLink></li>
      </ul>
    </template>

    <div class="mt-8">
      <h2 class="text-[17px] font-medium">Topics</h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="fiqh-categories">
        <component :is="c.topicIds.length ? NuxtLinkTag : 'div'" v-for="c in categories" :key="c.id" :to="c.topicIds.length ? `/fiqh/${c.id}` : undefined" class="flex min-h-11 flex-col gap-1 rounded-[10px] border px-4 py-3.5" :class="c.topicIds.length ? 'hover:bg-accent' : 'border-dashed text-ink-2'" :data-testid="`fiqh-category-${c.id}`">
          <span class="flex items-start gap-2"><Icon :name="categoryIcon(c.id)" size="18" class="mt-0.5 text-ink-2" /><span class="flex-1 text-[15.5px] font-medium">{{ c.title.en }}</span><span class="ar !text-[22px] !leading-[1.6]" lang="ar" dir="rtl">{{ c.arabicTerm }}</span></span>
          <span class="text-[13.5px] text-ink-2">{{ c.summary.text.en }}</span>
          <span class="text-[13px] text-ink-2" data-testid="fiqh-category-count">{{ c.topicIds.length ? `${c.topicIds.length} ${c.topicIds.length === 1 ? "topic" : "topics"}` : "Coming later" }}</span>
        </component>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-2">
      <NuxtLink to="/prayerTime" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] hover:bg-accent md:min-h-9"><Icon name="lucide:clock" size="15" />Prayer times</NuxtLink>
      <NuxtLink to="/qibla-direction" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] hover:bg-accent md:min-h-9"><Icon name="lucide:compass" size="15" />Qibla</NuxtLink>
    </div>

    <div v-if="saved !== 'unsupported'" class="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] bg-sunken px-4 py-3 text-[13.5px]" data-testid="fiqh-offline">
      <Icon name="lucide:cloud-download" size="16" class="text-ink-2" />
      <span class="min-w-0 flex-1">Topics you open are saved for offline. Save all {{ CATEGORY_CHUNK_COUNT }} categories to read every ruling with no connection.<template v-if="saved === 'error'"> <b class="font-medium">Couldn’t save the rulings. Check your connection and try again.</b></template></span>
      <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="saved === 'saving' || saved === 'saved'" data-testid="fiqh-save-all" @click="saveAll">{{ saved === "saving" ? "Saving…" : saved === "saved" ? "Saved for offline" : "Save all" }}</Button>
    </div>

    <FiqhDisclaimer :marja="marja" />
  </section>
</template>
