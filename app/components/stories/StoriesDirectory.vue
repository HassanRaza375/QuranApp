<script setup lang="ts">
// Stories (a lean directory): search (title, Arabic title, themes), a person menu, a type menu, Saved; each row shows the status chip, the
// chapter count and your progress. State is in the URL (?q=&type=&person=&saved=1).
import { onBeforeUnmount } from "vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { addBookmark, bookmarkAddedAt, BOOKMARKS_KEY, listBookmarks, removeBookmark } from "~/lib/bookmarks";
import { chaptersOf, filterStories, isFilteredStories, NO_STORY_FILTERS, peopleInStories, STORIES, STORY_TYPE_FILTERS, storyCountLine, storyFiltersFromQuery, storyFiltersToQuery, storyKey, type StoryFilters, type StoryTypeFilter } from "~/lib/stories";
import { readAllProgress, STORY_PROGRESS_KEY, type ProgressMap } from "~/lib/storyProgress";

useSeoMeta({ title: "Stories of the Qur’an · Quran App", description: "Explore the Qur’an’s major narratives." });
const route = useRoute();
const router = useRouter();
const undo = useUndoToast();

const f = reactive<StoryFilters>({ ...storyFiltersFromQuery(route.query) });
const same = (a: StoryFilters, b: StoryFilters) => a.q === b.q && a.type === b.type && a.person === b.person && a.saved === b.saved;
watch(f, () => {
  if (!same(f, storyFiltersFromQuery(route.query))) void router.replace({ query: storyFiltersToQuery(f) });
});
watch(
  () => route.query,
  (q) => {
    const n = storyFiltersFromQuery(q);
    if (!same(f, n)) Object.assign(f, n);
  },
);

const saved = ref<Set<string>>(new Set());
const progress = ref<ProgressMap>({});
const refresh = () => {
  saved.value = new Set(listBookmarks().filter((k) => k.startsWith("story:")).map((k) => k.slice(6)));
  progress.value = readAllProgress();
};
const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === BOOKMARKS_KEY || e.key === STORY_PROGRESS_KEY) refresh();
};
onMounted(() => {
  refresh();
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => window.removeEventListener("storage", onStorage));

const rows = computed(() => filterStories(f, saved.value));
const typeOptions: MenuOption[] = STORY_TYPE_FILTERS.map((t) => ({ value: t.value, label: t.label }));
const personOptions: MenuOption[] = [{ value: "", label: "All people" }, ...peopleInStories().map((p) => ({ value: p.id, label: p.name }))];

function toggle(id: string, title: string) {
  const key = storyKey(id);
  if (saved.value.has(id)) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refresh();
    undo.withUndo(`Removed ${title} from saved`, () => {
      addBookmark(key, when);
      refresh();
    });
  } else {
    addBookmark(key);
    refresh();
  }
}
const reset = () => Object.assign(f, NO_STORY_FILTERS);
const empty = computed(() => (f.saved && !f.q.trim() && f.type === "all" && !f.person ? "Nothing saved yet. Open a story and tap Save." : f.q.trim() ? `No stories match “${f.q.trim()}”.` : "No stories match these filters."));
</script>

<template>
  <section>
    <h1 class="font-serif text-[28px] font-medium">Stories of the Qur’an</h1>
    <p class="mt-1 text-[14px] text-ink-2">The Qur’an’s major narratives: who, what happened, where, and the lessons drawn, one chapter at a time.</p>
    <p class="mt-4 text-[14px] text-ink-2" role="status" data-testid="stories-count">{{ storyCountLine(rows.length, STORIES.length) }}</p>
    <div class="mt-3 space-y-3">
      <Input v-model="f.q" type="search" autocomplete="off" placeholder="Search by title, Arabic title or theme" aria-label="Search stories" class="!h-11 md:!h-9" data-testid="stories-search" />
      <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
        <div class="min-w-0"><ResponsiveMenu :model-value="f.type" :options="typeOptions" label="Type" wide @update:model-value="(v) => (f.type = v as StoryTypeFilter)" /></div>
        <div class="min-w-0"><ResponsiveMenu :model-value="f.person" :options="personOptions" label="Person" @update:model-value="(v) => (f.person = v)" /></div>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="f.saved" :class="f.saved ? 'border-brand text-brand' : ''" data-testid="stories-saved" @click="f.saved = !f.saved"><Icon name="lucide:star" size="16" />Saved</Button>
        <Button v-if="isFilteredStories(f)" variant="ghost" class="min-h-11 gap-2 md:min-h-8" data-testid="stories-reset" @click="reset"><Icon name="lucide:x" size="16" />Reset</Button>
      </div>
    </div>
    <ul v-if="rows.length" class="mt-3" data-testid="stories-list">
      <StoriesStoryRow v-for="s in rows" :key="s.id" :story="s" :saved="saved.has(s.id)" :chapters="chaptersOf(s).length" :progress="progress[s.id] ?? null" @star="toggle(s.id, s.title)" />
    </ul>
    <div v-else class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="stories-empty">
      <p class="text-[15px]">{{ empty }}</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="stories-empty-reset" @click="reset">Reset search and filters</Button>
    </div>
  </section>
</template>
