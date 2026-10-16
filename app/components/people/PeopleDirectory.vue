<script setup lang="ts">
// Browse people: search (names, Arabic, short description, themes), a category menu, Saved, Reset. The state lives in the URL
// (?q=&category=&saved=1) so the back button restores it.
import { onBeforeUnmount } from "vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { addBookmark, bookmarkAddedAt, BOOKMARKS_KEY, listBookmarks, removeBookmark } from "~/lib/bookmarks";
import { CATEGORY_OPTIONS, countLine, displayName, filterPeople, filtersFromQuery, filtersToQuery, isFiltered, NO_FILTERS, PEOPLE, personKey, type CategoryFilter, type PeopleFilters } from "~/lib/people";

const route = useRoute();
const router = useRouter();
const undo = useUndoToast();

const f = reactive<PeopleFilters>({ ...filtersFromQuery(route.query) });
const same = (a: PeopleFilters, b: PeopleFilters) => a.q === b.q && a.category === b.category && a.saved === b.saved;
watch(f, () => {
  if (!same(f, filtersFromQuery(route.query))) void router.replace({ query: filtersToQuery(f) });
});
watch(
  () => route.query,
  (q) => {
    const n = filtersFromQuery(q);
    if (!same(f, n)) Object.assign(f, n);
  },
);

const saved = ref<Set<string>>(new Set());
const refreshSaved = () => {
  saved.value = new Set(listBookmarks().filter((k) => k.startsWith("person:")).map((k) => k.slice(7)));
};
const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === BOOKMARKS_KEY) refreshSaved();
};
onMounted(() => {
  refreshSaved();
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => window.removeEventListener("storage", onStorage));

const rows = computed(() => filterPeople(f, saved.value));
const categoryOptions: MenuOption[] = CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }));

function toggle(id: string) {
  const key = personKey(id);
  const name = displayName(PEOPLE.find((p) => p.id === id)!);
  if (saved.value.has(id)) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshSaved();
    undo.withUndo(`Removed ${name} from saved`, () => {
      addBookmark(key, when);
      refreshSaved();
    });
  } else {
    addBookmark(key);
    refreshSaved();
  }
}
const reset = () => Object.assign(f, NO_FILTERS);
const empty = computed(() => {
  if (f.saved && !f.q.trim()) return f.category === "all" ? "Nothing saved yet. Open a person and tap Save." : "None of your saved people are in this category.";
  return f.q.trim() ? `No people match “${f.q.trim()}”${f.category === "all" ? "" : " in this category"}.` : "No people to show.";
});
</script>

<template>
  <div>
    <p class="text-[14px] text-ink-2" role="status" data-testid="people-count">{{ countLine(rows.length, PEOPLE.length) }}</p>
    <div class="mt-3 space-y-3">
      <Input v-model="f.q" type="search" autocomplete="off" placeholder="Search by name, Arabic name or theme" aria-label="Search people" class="!h-11 md:!h-9" data-testid="people-search" />
      <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
        <div class="min-w-0"><ResponsiveMenu :model-value="f.category" :options="categoryOptions" label="Category" @update:model-value="(v) => (f.category = v as CategoryFilter)" /></div>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="f.saved" :class="f.saved ? 'border-brand text-brand' : ''" data-testid="people-saved" @click="f.saved = !f.saved">
          <Icon name="lucide:star" size="16" />Saved
        </Button>
        <Button v-if="isFiltered(f)" variant="ghost" class="min-h-11 gap-2 md:min-h-8" data-testid="people-reset" @click="reset"><Icon name="lucide:x" size="16" />Reset</Button>
      </div>
    </div>
    <ul v-if="rows.length" class="mt-3" data-testid="people-list">
      <PeoplePersonRow v-for="p in rows" :key="p.id" :person="p" :saved="saved.has(p.id)" @star="toggle(p.id)" />
    </ul>
    <div v-else class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="people-empty">
      <p class="text-[15px]">{{ empty }}</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="people-empty-reset" @click="reset">Reset search and filters</Button>
    </div>
  </div>
</template>
