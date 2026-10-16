<script setup lang="ts">
// Surah listing (prototype d-page-surah / m-page-surah): the Surah, Juz and Page tabs. Offline level A: every list is
// built from bundled data. Playing audio needs a connection unless the file was downloaded. See
// docs/phases/phase-03-surah-listing.md.
import { onBeforeUnmount } from "vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, bookmarkAddedAt, listBookmarks, removeBookmark } from "~/lib/bookmarks";
import { juzMatches, parsePage, surahMatches } from "~/lib/listingSearch";
import { filterPlace, PLACE_OPTIONS, SORT_OPTIONS, sortSurahs, type PlaceFilter, type SortKey } from "~/lib/listingSort";
import { JUZ, TOTAL_PAGES } from "~/lib/quranMeta";
import { readersPending } from "~/lib/readerLinks";
import { lastRead, type LastRead } from "~/lib/readingMarker";
import { readCompleted } from "~/lib/readSurahs";
import { RECITER_NAMES, reciterName } from "~/lib/surahAudio";
import { getJSON } from "~/lib/storage";
import { HISTORY_KEYS } from "~/lib/userState";

export type ListingTab = "surah" | "juz" | "page";
const props = defineProps<{ tab: ListingTab }>();

const TABS: { id: ListingTab; label: string; to: string }[] = [
  { id: "surah", label: "Surah", to: "/surah-listing" },
  { id: "juz", label: "Juz", to: "/juz" },
  { id: "page", label: "Page", to: "/surah-listing?tab=page" },
];
const PLACEHOLDER: Record<ListingTab, string> = {
  surah: "Filter by name, number or place",
  juz: "Filter by juz number or place",
  page: `Go to page (1 to ${TOTAL_PAGES})`,
};

useSeoMeta({ title: () => `${props.tab === "juz" ? "Juz" : props.tab === "page" ? "Pages" : "Surahs"} · Quran App`, description: "Browse the Quran by surah, juz or page." });

const prefs = usePreferencesStore();
const player = usePlayerStore();
const undo = useUndoToast();

const filter = ref("");
const pageText = ref("");
const pageError = ref("");
const sort = ref<SortKey>("number");
const place = ref<PlaceFilter>("all");
const savedOnly = ref(false);
const saved = ref<Set<string>>(new Set());
const last = ref<LastRead | null>(null);
const completed = ref<Set<number>>(new Set());
const pageEl = ref<HTMLElement | null>(null);

const refreshSaved = () => {
  saved.value = new Set(listBookmarks());
};
onMounted(() => {
  refreshSaved();
  last.value = lastRead(getJSON<unknown>(HISTORY_KEYS.readingProgress, null));
  completed.value = new Set(readCompleted().keys());
});

watch(
  () => props.tab,
  () => {
    filter.value = "";
    pageText.value = "";
    pageError.value = "";
    savedOnly.value = false;
  },
);

// ---- rows
const surahRows = computed(() => {
  let rows = sortSurahs(filterPlace(SURAH_ROWS, place.value), sort.value);
  if (savedOnly.value) rows = rows.filter((s) => saved.value.has(`surah:${s.n}`));
  return rows.filter((s) => surahMatches(s, filter.value));
});
const juzRows = computed(() => JUZ.filter((j) => juzMatches(j, SURAH_ROWS[j.startSurah - 1]!.name, filter.value)));

const total = computed(() => (props.tab === "surah" ? SURAH_ROWS.length : props.tab === "juz" ? JUZ.length : TOTAL_PAGES));
const shown = computed(() => (props.tab === "surah" ? surahRows.value.length : props.tab === "juz" ? juzRows.value.length : TOTAL_PAGES));
const noun = computed(() => (props.tab === "surah" ? "surahs" : props.tab === "juz" ? "juz" : "pages"));
const count = computed(() => (shown.value === total.value ? `${total.value} ${noun.value}` : `${shown.value} of ${total.value} ${noun.value}`));

const emptyMessage = computed(() => {
  if (props.tab === "surah" && savedOnly.value && !filter.value.trim() && place.value === "all") return "No saved surahs yet. Tap the star on a surah to save it.";
  const q = filter.value.trim();
  return q ? `No ${noun.value} match “${q}”. Try a name or a number.` : `No ${noun.value} to show.`;
});
const clearAll = () => {
  filter.value = "";
  place.value = "all";
  savedOnly.value = false;
};

// ---- saved (legacy bookmark keys: surah:<n>, juz:<n>)
function toggleSaved(key: string, label: string) {
  if (saved.value.has(key)) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshSaved();
    undo.withUndo(`Removed ${label} from saved`, () => {
      addBookmark(key, when);
      refreshSaved();
    });
  } else {
    addBookmark(key);
    refreshSaved();
  }
}
const onStarSurah = (n: number) => toggleSaved(`surah:${n}`, SURAH_ROWS[n - 1]!.name);
const onStarJuz = (n: number) => toggleSaved(`juz:${n}`, `Juz ${n}`);

// ---- audio
const reciter = computed(() => reciterName(prefs.prefs.reciter));
const reciterOptions: MenuOption[] = RECITER_NAMES.map((r) => ({ value: r, label: r }));
const sortOptions: MenuOption[] = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
const placeOptions: MenuOption[] = PLACE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

const active = computed(() => player.playing || player.loading);
const currentNo = computed(() => player.nowPlaying?.surahNo ?? null);

function onPlay(n: number) {
  if (currentNo.value === n && active.value) return player.pause();
  void player.playSurah({ surahNo: n, title: SURAH_ROWS[n - 1]!.name, reciter: reciter.value, rate: prefs.prefs.playbackRate });
}
function onReciter(name: string) {
  if (name === reciter.value) return;
  prefs.set("reciter", { reciter: name });
  const np = player.nowPlaying;
  if (np && active.value) void player.playSurah({ surahNo: np.surahNo, title: np.title, reciter: name, rate: prefs.prefs.playbackRate });
}

// ---- go to page
let flashTimer: ReturnType<typeof setTimeout> | undefined;
async function goToPage(p: number) {
  await nextTick();
  const chips = Array.from(pageEl.value?.querySelectorAll<HTMLElement>(`[data-page="${p}"]`) ?? []);
  if (!chips.length) return;
  chips[0]!.scrollIntoView({ block: "center" });
  chips[0]!.focus({ preventScroll: true });
  chips.forEach((c) => c.classList.add("flash"));
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => chips.forEach((c) => c.classList.remove("flash")), 1600);
}
function submitPage() {
  const p = parsePage(pageText.value, TOTAL_PAGES);
  if (p === null) {
    pageError.value = `Enter a page from 1 to ${TOTAL_PAGES}`;
    return;
  }
  pageError.value = "";
  void goToPage(p);
}
onBeforeUnmount(() => clearTimeout(flashTimer));
</script>

<template>
  <section ref="pageEl">
    <h1 class="font-serif text-[28px] font-medium">Surah listing</h1>
    <p class="mt-1 text-[14px] text-ink-2" role="status" data-testid="list-count">{{ count }}</p>

    <nav aria-label="Listing views" class="mt-4 flex border-b" data-testid="listing-tabs">
      <NuxtLink
        v-for="t in TABS"
        :key="t.id"
        :to="t.to"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="t.id === tab ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="t.id === tab ? 'page' : undefined"
        :data-testid="`tab-${t.id}`"
        @click="t.id === tab ? $event.preventDefault() : undefined"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>

    <div class="mt-4 space-y-3">
      <form v-if="tab === 'page'" class="flex gap-2" role="search" @submit.prevent="submitPage">
        <Input v-model="pageText" type="text" inputmode="numeric" autocomplete="off" :placeholder="PLACEHOLDER.page" aria-label="Go to page" class="!h-11 flex-1 md:!h-9" data-testid="page-input" />
        <Button type="submit" class="min-h-11 md:min-h-9" data-testid="page-go">Go</Button>
      </form>
      <Input v-else v-model="filter" type="search" autocomplete="off" :placeholder="PLACEHOLDER[tab]" :aria-label="tab === 'juz' ? 'Filter juz' : 'Filter surahs'" class="!h-11 md:!h-9" data-testid="filter-input" />
      <p v-if="pageError" class="text-[12.5px] text-destructive" role="alert" data-testid="page-error">{{ pageError }}</p>

      <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
        <div v-if="tab === 'surah'" class="min-w-0">
          <ResponsiveMenu v-model="sort" :options="sortOptions" label="Sort" wide hint="Name ignores Al-, An-" />
        </div>
        <div v-if="tab === 'surah'" class="min-w-0">
          <ResponsiveMenu v-model="place" :options="placeOptions" label="Place" />
        </div>
        <div v-if="tab === 'surah'" class="min-w-0">
          <ResponsiveMenu :model-value="reciter" :options="reciterOptions" label="Reciter" title="Choose a reciter" @update:model-value="onReciter" />
        </div>
        <Button v-if="tab === 'surah'" variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="savedOnly" :class="savedOnly ? 'border-brand text-brand' : ''" data-testid="saved-toggle" @click="savedOnly = !savedOnly">
          <Icon name="lucide:star" size="16" />Saved
        </Button>
      </div>

      <p v-if="readersPending() && tab === 'page'" class="text-[12.5px] text-ink-2" data-testid="readers-notice">
        The page reader is still being moved to the new design, so opening a page shows a placeholder for now.
      </p>

      <p v-if="tab === 'surah' && (completed.size || last)" class="flex items-center gap-4 text-[12px] text-ink-2" data-testid="legend">
        <span v-if="completed.size" class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="inline-block size-2.5 rounded-full bg-brand" />Completed</span>
        <span v-if="last" class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="inline-block size-2.5 rounded-full border border-brand" style="background: linear-gradient(90deg, var(--accent) 50%, transparent 50%)" />Last read</span>
      </p>

      <p v-if="last && tab === 'surah'" class="text-[13px]" data-testid="last-read-line">
        <NuxtLink :to="last.href" class="inline-flex min-h-11 items-center text-brand underline md:min-h-0">
          Last read: {{ SURAH_ROWS[last.surahNo - 1]!.name }}, ayah {{ last.ayahNo }} of {{ last.total }}
        </NuxtLink>
      </p>
      <p v-if="last && tab === 'page'" class="text-[13px]">
        <button type="button" class="inline-flex min-h-11 items-center text-brand underline md:min-h-0" data-testid="jump-current" @click="goToPage(last.page)">
          Jump to page {{ last.page }}, where you stopped
        </button>
      </p>
    </div>

    <div class="mt-4">
      <ListingSurahList
        v-if="tab === 'surah' && surahRows.length"
        :rows="surahRows"
        :last="last"
        :completed="completed"
        :saved="saved"
        :current-no="currentNo"
        :active="active"
        :error="player.error"
        @play="onPlay"
        @star="onStarSurah"
      />
      <ListingJuzList v-else-if="tab === 'juz' && juzRows.length" :rows="juzRows" :last="last" :saved="saved" @star="onStarJuz" />
      <ListingPageGroups v-else-if="tab === 'page'" :current-page="last?.page ?? null" />
      <ListingEmptyList v-else :message="emptyMessage" @clear="clearAll" />
    </div>
  </section>
</template>
