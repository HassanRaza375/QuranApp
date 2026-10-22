<script setup lang="ts">
// Search (Phase 10). One box over ayahs (online), surahs, people, stories and your notes. The behaviour is in useSearchPage; this is the
// screen. Ayah text, translations and edition names come from the upstream's answer; everything else from the app's own data tables.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { MAX_SHOWN } from "~/lib/ayahSearch";
import { editionById, editionLabel, isRtlGroup } from "~/lib/searchEditions";
import { activeFilterCount, type Scope } from "~/lib/searchQuery";

useSeoMeta({ title: "Search · Quran App", description: "Search the Qur’an’s ayahs, surahs, people, stories and your own notes.", robots: "noindex, follow" });

const SUGGESTED = ["patience", "mercy", "forgiveness", "gratitude", "prayer", "fasting", "charity", "guidance"]; // the legacy page's suggestions
const search = useSearchPage();
const { state, ayah, view, positions, localGroups, query, jump, history } = search;

const filtersOpen = ref(false);
const input = ref<{ $el?: HTMLInputElement } | null>(null);
onMounted(() => {
  // Desktop starts in the box (as the legacy page did); on a phone that would open the keyboard over the page, so it does not.
  if (!query.value && window.matchMedia("(min-width: 768px)").matches) (input.value?.$el as HTMLInputElement | undefined)?.focus();
});

const active = computed(() => activeFilterCount(state));
const editionTitle = computed(() => editionById(state.edition)?.title ?? state.edition);
const groupLabel = computed(() => editionLabel(state.edition) ?? state.edition);
const filterSummary = computed(() => {
  const parts: string[] = [];
  if (editionById(state.edition) && state.edition !== "en.pickthall") parts.push(editionTitle.value);
  if (state.surah) parts.push(SURAH_ROWS[state.surah - 1]?.name ?? `Surah ${state.surah}`);
  if (state.juz) parts.push(`Juz ${state.juz}`);
  if (state.bookmarked) parts.push("Saved ayahs only");
  return parts.join(" · ");
});

const LOCAL_ICON: Record<string, string> = { surahs: "lucide:list", people: "lucide:users", stories: "lucide:scroll-text", notes: "lucide:notebook-pen" };
const countOf = (id: string) => localGroups.value.find((g) => g.group === id)?.hits.length ?? 0;
const ayahCount = computed(() => (ayah.phase === "ok" && ayah.forQuery === query.value ? view.value.total : null));
const chips = computed(() => {
  const withCounts = !!query.value;
  const items: Array<{ value: Scope; label: string; n: number | null }> = [
    { value: "ayahs", label: "Ayahs", n: withCounts ? ayahCount.value : null },
    { value: "surahs", label: "Surahs", n: withCounts ? countOf("surahs") : null },
    { value: "people", label: "People", n: withCounts ? countOf("people") : null },
    { value: "stories", label: "Stories", n: withCounts ? countOf("stories") : null },
    { value: "notes", label: "Notes", n: withCounts ? countOf("notes") : null },
  ];
  const known = items.map((i) => i.n).filter((n): n is number => n != null);
  return [{ value: "all" as Scope, label: "All", n: withCounts ? known.reduce((a, b) => a + b, 0) : null }, ...items];
});

const showAyahs = computed(() => !!query.value && (state.scope === "all" || state.scope === "ayahs"));
const shownLocal = computed(() => localGroups.value.filter((g) => state.scope === "all" || state.scope === g.group));
const CAP_ALL = 4;
const noResults = computed(() => state.scope === "all" && !!query.value && !localGroups.value.length && jump.value?.kind !== "open" && (ayah.phase === "none" || ayah.phase === "idle" || ayah.phase === "short"));

const rtlOf = (editionId: string) => isRtlGroup(editionById(editionId)?.group ?? state.group);
const groupOf = (editionId: string) => editionById(editionId)?.group ?? state.group;
const surahName = (n: number) => SURAH_ROWS[n - 1]?.name ?? `Surah ${n}`;
const rowEdition = (id: string, fallback: string) => editionById(id)?.title ?? fallback;
const arabicStyle = "font-family: var(--font-arabic); font-size: calc(21px * var(--arabic-font-scale)); line-height: 2";

const announce = computed(() => {
  if (!query.value) return "";
  if (ayah.phase === "loading") return "Searching…";
  const parts: string[] = [];
  if (ayahCount.value != null) parts.push(`${ayahCount.value} ayahs`);
  for (const g of localGroups.value) parts.push(`${g.hits.length} ${g.label.toLowerCase()}`);
  return parts.length ? `Found ${parts.join(", ")}.` : "No results.";
});
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="search-page">
    <h1 class="font-serif text-[28px] font-medium">Search</h1>
    <p class="mt-1 text-[14px] text-ink-2">Ayahs, surahs, people, stories and your notes. Marks and spelling variants are ignored.</p>

    <div class="mt-4 flex gap-2">
      <div class="relative min-w-0 flex-1">
        <Icon name="lucide:search" size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
        <Input
          ref="input"
          v-model="state.q"
          type="search"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="search"
          placeholder="Try 2:255, Al-Kahf or patience"
          aria-label="Search"
          class="!h-12 !pl-10 !text-[16px]"
          data-testid="search-input"
          @keydown.enter="search.commit()"
        />
      </div>
      <Button variant="outline" class="min-h-12 gap-2" :aria-label="active ? `Filters, ${active} on` : 'Filters'" data-testid="filters-open" @click="filtersOpen = true">
        <Icon name="lucide:sliders-horizontal" size="16" />Filters
        <span v-if="active" class="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground" data-testid="filters-count">{{ active }}</span>
      </Button>
    </div>

    <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Show">
      <button
        v-for="c in chips"
        :key="c.value"
        type="button"
        class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] md:min-h-8 md:px-3"
        :class="state.scope === c.value ? 'border-primary bg-primary text-primary-foreground' : 'text-ink-2 hover:text-foreground'"
        :aria-pressed="state.scope === c.value"
        :data-scope="c.value"
        data-testid="scope-chip"
        @click="state.scope = c.value"
      >{{ c.label }}<span v-if="c.n != null" class="tabular-nums opacity-70" data-testid="scope-count">{{ c.n }}</span></button>
    </div>

    <p v-if="active" class="mt-2 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2" data-testid="filters-summary">
      <span>Filters on: {{ filterSummary }}</span>
      <button type="button" class="min-h-11 text-brand underline md:min-h-6" data-testid="filters-clear" @click="search.resetFilters()">Clear</button>
    </p>

    <p class="sr-only" role="status" aria-live="polite" data-testid="search-announce">{{ announce }}</p>

    <!-- before anything is typed -->
    <div v-if="!query" data-testid="search-start">
      <div v-if="history.length" class="mt-6" data-testid="history">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[13px] font-medium text-ink-2">Recent</h2>
          <button type="button" class="min-h-11 px-2 text-[13px] text-brand md:min-h-8" data-testid="history-clear" @click="search.clearEntries()">Clear</button>
        </div>
        <ul class="flex flex-wrap gap-2">
          <li v-for="h in history" :key="h" class="inline-flex items-center rounded-full border" data-testid="history-chip">
            <button type="button" class="min-h-11 pl-3.5 pr-1 text-[13.5px] md:min-h-8 md:pl-3" data-testid="history-use" @click="search.pickEntry(h)">{{ h }}</button>
            <button type="button" class="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-accent md:size-8" :aria-label="`Remove ${h}`" data-testid="history-remove" @click="search.removeEntry(h)"><Icon name="lucide:x" size="14" /></button>
          </li>
        </ul>
      </div>
      <div v-else class="mt-6 text-[13.5px] text-ink-2" data-testid="history-empty">Your searches appear here, on this device only.</div>

      <div class="mt-6">
        <h2 class="mb-2 text-[13px] font-medium text-ink-2">Suggested</h2>
        <ul class="flex flex-wrap gap-2">
          <li v-for="w in SUGGESTED" :key="w">
            <button type="button" class="min-h-11 rounded-full border px-3.5 text-[13.5px] text-ink-2 hover:text-foreground md:min-h-8 md:px-3" data-testid="suggested-chip" @click="search.pickEntry(w)">{{ w }}</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- results -->
    <div v-else class="mt-5">
      <NuxtLink v-if="jump?.kind === 'open'" :to="jump.href" class="mb-5 flex min-h-14 items-center gap-3 rounded-[10px] bg-primary px-4 py-3 text-primary-foreground" data-testid="jump-card" @click="search.commit()">
        <Icon name="lucide:book-open" size="20" />
        <span class="min-w-0 flex-1"><span class="block font-medium">Open {{ jump.surahName }} {{ jump.surah }}:{{ jump.ayah }}</span><span class="block text-[13px] opacity-85">Goes to the reader at this ayah</span></span>
        <Icon name="lucide:chevron-right" size="18" />
      </NuxtLink>
      <p v-else-if="jump" class="mb-5 flex gap-2 rounded-md bg-sunken px-3.5 py-3 text-[13.5px] text-ink-2" role="status" data-testid="jump-message">
        <Icon name="lucide:info" size="16" class="mt-0.5 shrink-0" />
        <span>{{ jump.kind === "no-surah" ? "There are 114 surahs." : `${jump.surahName} has ${jump.ayahs} ayahs.` }}</span>
      </p>

      <div v-if="positions.length > 1 && showAyahs && ayah.phase === 'ok'" class="mb-6" data-testid="thread-block">
        <p class="mb-1.5 text-[12.5px] text-ink-2">Where your results fall in the Qur’an</p>
        <QuranThread :marks="positions" :label="`Where the ${positions.length} ayahs shown fall in the Qur’an`" scale />
      </div>

      <p v-if="[...query].length === 1 && state.scope === 'ayahs'" class="text-[13.5px] text-ink-2" data-testid="ayah-short">Ayah search starts at 2 characters.</p>

      <!-- ayahs -->
      <section v-if="showAyahs && ayah.phase !== 'idle' && ayah.phase !== 'short'" class="mb-8" data-testid="group-ayahs" :aria-busy="ayah.phase === 'loading'">
        <div class="mb-1 flex items-center gap-2">
          <Icon name="lucide:book-open" size="18" class="text-ink-2" />
          <h2 class="font-serif text-[18px] font-medium">Ayahs</h2>
          <span v-if="ayahCount != null" class="rounded bg-sunken px-1.5 text-[12px] tabular-nums text-ink-2" data-testid="group-count">{{ ayahCount }}</span>
          <span class="ml-auto text-[12.5px] text-ink-2" data-testid="ayah-edition">{{ groupLabel }}</span>
        </div>

        <div v-if="ayah.phase === 'loading' && !ayah.hits.length" class="space-y-3 py-2" role="status" data-testid="ayah-loading">
          <p class="text-[13.5px] text-ink-2">Searching…</p>
          <Skeleton class="h-4 w-11/12" /><Skeleton class="h-4 w-3/4" /><Skeleton class="h-4 w-5/6" />
        </div>

        <p v-else-if="ayah.phase === 'offline'" class="flex gap-2 rounded-[10px] border bg-sunken px-3.5 py-3 text-[13.5px]" role="status" data-testid="ayah-offline">
          <Icon name="lucide:wifi-off" size="16" class="mt-0.5 shrink-0" />
          <span class="min-w-0 flex-1">Searching ayah text needs a connection.<span v-if="localGroups.length || jump"> What is on your device still works, and an ayah opens directly by its number, like 2:255.</span>
            <button type="button" class="mt-1 block min-h-11 underline md:min-h-6" data-testid="ayah-retry" @click="search.retry()">Try again</button></span>
        </p>

        <p v-else-if="ayah.phase === 'failed'" class="flex gap-2 rounded-[10px] border bg-sunken px-3.5 py-3 text-[13.5px]" role="status" data-testid="ayah-failed">
          <Icon name="lucide:info" size="16" class="mt-0.5 shrink-0" />
          <span class="min-w-0 flex-1">The search service didn’t give an answer this time.
            <button type="button" class="mt-1 block min-h-11 underline md:min-h-6" data-testid="ayah-retry" @click="search.retry()">Try again</button></span>
        </p>

        <p v-else-if="ayah.phase === 'none'" class="py-3 text-[14px] text-ink-2" data-testid="ayah-none">No ayahs match “{{ ayah.forQuery }}” in {{ editionTitle }}{{ state.surah ? ` in ${surahName(state.surah)}` : "" }}.</p>

        <template v-else-if="ayah.hits.length">
          <p v-if="view.total === 0" class="py-3 text-[14px] text-ink-2" data-testid="ayah-filtered-out">
            None of the {{ ayah.hits.length }} matches pass your filters.
            <button type="button" class="min-h-11 text-brand underline md:min-h-6" @click="search.resetFilters()">Clear filters</button>
          </p>
          <template v-else>
            <p class="py-1.5 text-[13px] text-ink-2" data-testid="ayah-status">{{ view.total > MAX_SHOWN ? `Showing the first ${MAX_SHOWN} of ${view.total} ayahs` : `${view.total} ${view.total === 1 ? "ayah" : "ayahs"}` }}<span v-if="ayah.phase === 'loading'"> · Searching…</span></p>
            <ul class="border-t" :class="ayah.phase === 'loading' ? 'opacity-60' : ''" data-testid="ayah-list">
              <li v-for="h in view.shown" :key="h.id" class="border-b" data-testid="ayah-row">
                <NuxtLink :to="h.href" class="block py-3" @click="search.commit()">
                  <span class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span class="text-[13.5px] font-medium">{{ surahName(h.surah) }} {{ h.surah }}:{{ h.ayah }}</span>
                    <span class="rounded bg-sunken px-1.5 text-[12px] text-ink-2" data-testid="ayah-row-edition" :title="h.editionName">{{ rowEdition(h.editionId, h.editionName) }}</span>
                  </span>
                  <span
                    v-if="rtlOf(h.editionId)"
                    class="mt-1 block text-right"
                    :class="groupOf(h.editionId) === 'urdu' ? 'ur !text-[17px] !leading-[2.2]' : ''"
                    :style="groupOf(h.editionId) === 'urdu' ? '' : arabicStyle"
                    :lang="groupOf(h.editionId) === 'urdu' ? 'ur' : 'ar'"
                    dir="rtl"
                    data-testid="ayah-row-text"
                  ><SearchHighlightedText :text="h.text" :query="ayah.forQuery" /></span>
                  <span v-else class="mt-1 block font-serif text-[15.5px] leading-relaxed" data-testid="ayah-row-text"><SearchHighlightedText :text="h.text" :query="ayah.forQuery" /></span>
                </NuxtLink>
              </li>
            </ul>
          </template>
        </template>
      </section>

      <!-- surahs, people, stories, notes -->
      <section v-for="g in shownLocal" :key="g.group" class="mb-8" :data-testid="`group-${g.group}`">
        <div class="mb-1 flex items-center gap-2">
          <Icon :name="LOCAL_ICON[g.group] ?? 'lucide:tag'" size="18" class="text-ink-2" />
          <h2 class="font-serif text-[18px] font-medium">{{ g.label }}</h2>
          <span class="rounded bg-sunken px-1.5 text-[12px] tabular-nums text-ink-2" data-testid="group-count">{{ g.hits.length }}</span>
        </div>
        <ul class="border-t">
          <li v-for="h in state.scope === 'all' ? g.hits.slice(0, CAP_ALL) : g.hits" :key="h.id" class="border-b" data-testid="local-row">
            <SearchLocalRow :hit="h" :query="query" @open="search.commit()" />
          </li>
        </ul>
        <button v-if="state.scope === 'all' && g.hits.length > CAP_ALL" type="button" class="mt-1 min-h-11 text-[13.5px] text-brand underline md:min-h-8" data-testid="show-all" @click="state.scope = g.group as Scope">Show all {{ g.hits.length }}</button>
      </section>

      <div v-if="noResults" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="search-empty">
        <p class="text-[15px]">Nothing matches “{{ query }}”.</p>
        <p class="mt-1 text-[13.5px] text-ink-2">Check the spelling, try fewer words, or search an ayah number like 18:10.</p>
      </div>
    </div>

    <SearchFiltersSheet :open="filtersOpen" :state="state" @close="filtersOpen = false" @change="(p) => Object.assign(state, p)" @reset="search.resetFilters()" />
  </section>
</template>
