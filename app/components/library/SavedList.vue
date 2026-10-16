<script setup lang="ts">
// The Saved view: search, Show (type), Sort and group, Select mode, and the rows. A collection view (?collection=<id>) lists every item
// in the collection, note-only ones included.
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import * as L from "~/lib/library";
import { agoText, COMMON_TYPES, groupItems, matches, RARE_TYPES, SORT_OPTIONS, sortItems, TYPE_PLURAL, type Item, type ItemType, type SortKey } from "~/lib/libraryItems";

const props = defineProps<{ collectionId: string | null }>();
const emit = defineEmits<{ edit: [key: string]; "clear-collection": []; "new-note": [] }>();
const store = useLibraryStore();

const query = ref("");
const type = ref<ItemType | "all">("all");
const sort = ref<SortKey>("recent");
const selecting = ref(false);
const selected = ref<Set<string>>(new Set());
const newCollection = ref(false);
const newName = ref("");
const message = ref("");
const announce = ref("");

const collection = computed(() => store.lib.collections.find((c) => c.id === props.collectionId) ?? null);
const base = computed<Item[]>(() => {
  const items = [...store.savedItems];
  if (collection.value) {
    for (const k of L.collectionMembers(store.lib, collection.value.id)) if (!store.lib.bookmarks.includes(k)) items.push(store.describe(k));
  }
  return items;
});
const filtered = computed(() => {
  const f = { query: query.value, type: type.value, collectionId: collection.value?.id ?? null };
  const found = base.value.filter((i) => matches(i, store.lib, f));
  return sortItems(found, store.lib, sort.value.startsWith("group") ? "recent" : (sort.value as "recent" | "ord" | "name"));
});
const groups = computed(() => {
  if (sort.value === "group-collection") return groupItems(filtered.value, store.lib, "collection");
  if (sort.value === "group-type") return groupItems(filtered.value, store.lib, "type");
  return [{ label: "", items: filtered.value }];
});

const typeOptions = computed<MenuOption[]>(() => {
  const present = store.typesPresent;
  const common = COMMON_TYPES.filter((t) => present.has(t));
  const rare = RARE_TYPES.filter((t) => present.has(t));
  const opts: MenuOption[] = [{ value: "all", label: "All types" }];
  common.forEach((t) => opts.push({ value: t, label: TYPE_PLURAL[t] }));
  rare.forEach((t, i) => opts.push({ value: t, label: TYPE_PLURAL[t], heading: i === 0 && common.length ? "More types" : undefined }));
  return opts;
});
const sortOptions: MenuOption[] = SORT_OPTIONS.map((o, i) => ({ value: o.value, label: o.label, heading: i === 3 ? "Group" : undefined }));
const showLabel = computed(() => (type.value === "all" ? "All types" : TYPE_PLURAL[type.value]));
watch(typeOptions, (o) => {
  if (!o.some((x) => x.value === type.value)) type.value = "all";
});

const ago = (key: string) => agoText(store.lib.addedAt[key], new Date());
const isFiltered = computed(() => !!query.value.trim() || type.value !== "all" || !!collection.value);
const clearFilters = () => {
  query.value = "";
  type.value = "all";
  emit("clear-collection");
};

// ---- select mode (checkbox rows, a count announced politely)
function setSelecting(on: boolean) {
  selecting.value = on;
  selected.value = new Set();
  newCollection.value = false;
  message.value = "";
  announce.value = on ? "Select mode on. 0 selected." : "Select mode off.";
}
function pick(key: string, on: boolean) {
  const next = new Set(selected.value);
  if (on) next.add(key);
  else next.delete(key);
  selected.value = next;
  announce.value = `${next.size} selected`;
}
function selectAll() {
  selected.value = new Set(filtered.value.map((i) => i.key));
  announce.value = `${selected.value.size} selected`;
}
const selectedSaved = computed(() => [...selected.value].filter((k) => L.isSaved(store.lib, k)));
function removeSelected() {
  const keys = selectedSaved.value;
  if (!keys.length) return;
  const r = store.remove(keys, keys.length === 1 ? "Removed 1 item from Saved" : `Removed ${keys.length} items from Saved`);
  message.value = r?.error ?? "";
  setSelecting(false);
}
function addSelected(id: string) {
  if (id === "__new") {
    newCollection.value = true;
    return;
  }
  const r = store.addToCollection([...selected.value], id);
  if (typeof r === "object") message.value = r.error;
  else announce.value = `Added ${r} ${r === 1 ? "item" : "items"} to the collection.`;
}
function createAndAdd() {
  const c = store.createCollection(newName.value);
  if ("error" in c) {
    message.value = c.error;
    return;
  }
  store.addToCollection([...selected.value], c.id);
  newName.value = "";
  newCollection.value = false;
  message.value = "";
}
const collectionOptions = computed<MenuOption[]>(() => [...store.lib.collections.map((c) => ({ value: c.id, label: c.name })), { value: "__new", label: "New collection…" }]);
</script>

<template>
  <div @keydown.esc="selecting && setSelecting(false)">
    <div v-if="collection" class="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px]" data-testid="collection-chip">
      Collection: {{ collection.name }}
      <button type="button" class="inline-flex size-11 items-center justify-center md:size-7" aria-label="Show all saved items" data-testid="collection-chip-clear" @click="emit('clear-collection')"><Icon name="lucide:x" size="14" /></button>
    </div>

    <div class="space-y-3">
      <Input v-model="query" type="search" autocomplete="off" placeholder="Search saved items, notes and tags" aria-label="Search saved items" class="!h-11 md:!h-9" data-testid="library-search" />
      <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
        <div v-if="typeOptions.length > 2" class="min-w-0"><ResponsiveMenu v-model="type" :options="typeOptions" label="Show" :title="`Show: ${showLabel}`" /></div>
        <div class="min-w-0"><ResponsiveMenu v-model="sort" :options="sortOptions" label="Sort and group" title="Sort and group" /></div>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="selecting" :class="selecting ? 'border-brand text-brand' : ''" data-testid="select-toggle" @click="setSelecting(!selecting)">
          <Icon name="lucide:square-check" size="16" />{{ selecting ? "Done" : "Select" }}
        </Button>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" data-testid="new-note-open" @click="emit('new-note')"><Icon name="lucide:plus" size="16" />New note</Button>
      </div>
    </div>

    <div v-if="selecting" class="sticky top-0 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2" role="group" aria-label="Actions for selected items" data-testid="select-bar">
      <span class="px-1 text-[14px] font-medium" data-testid="select-count">{{ selected.size }} selected</span>
      <Button variant="outline" class="min-h-11 md:min-h-8" data-testid="select-all" @click="selectAll">Select all shown</Button>
      <ResponsiveMenu v-if="selected.size" :model-value="null" :options="collectionOptions" label="Add to collection" title="Add to collection" icon="lucide:folder-plus" @update:model-value="addSelected">
        <template #trigger><Button variant="outline" class="min-h-11 gap-2 md:min-h-8" data-testid="select-add"><Icon name="lucide:folder-plus" size="16" />Add to collection</Button></template>
      </ResponsiveMenu>
      <Button v-if="selectedSaved.length" variant="outline" class="min-h-11 gap-2 md:min-h-8" data-testid="select-remove" @click="removeSelected"><Icon name="lucide:trash-2" size="16" />Remove from Saved</Button>
      <form v-if="newCollection" class="flex w-full gap-2" @submit.prevent="createAndAdd">
        <Input v-model="newName" aria-label="New collection name" placeholder="Collection name" class="!h-11 flex-1 md:!h-9" data-testid="select-new-name" />
        <Button type="submit" class="min-h-11 md:min-h-8" data-testid="select-new-create">Create and add</Button>
      </form>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-testid="select-announce">{{ announce }}</p>
    <p v-if="message || store.blocked" class="mt-2 text-[13px] text-destructive" role="alert" data-testid="library-error">{{ message || "Couldn’t save. Your browser is blocking storage for this site." }}</p>

    <div class="mt-4">
      <template v-if="filtered.length">
        <section v-for="g in groups" :key="g.label" :aria-label="g.label || undefined" data-testid="library-group">
          <h2 v-if="g.label" class="mt-4 text-[13px] font-medium uppercase tracking-wide text-ink-2" data-testid="group-label">{{ g.label }}</h2>
          <ul>
            <LibraryItemRow
              v-for="i in g.items"
              :key="`${g.label}|${i.key}`"
              :item="i"
              :meta="store.meta(i.key)"
              :collections="store.lib.collections"
              :saved="L.isSaved(store.lib, i.key)"
              :ago="ago(i.key)"
              :selecting="selecting"
              :selected="selected.has(i.key)"
              @edit="emit('edit', i.key)"
              @select="(on) => pick(i.key, on)"
            />
          </ul>
        </section>
      </template>
      <div v-else-if="isFiltered" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="no-match">
        <p class="text-[15px]">Nothing matches your search or filters.</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="no-match-clear" @click="clearFilters">Clear</Button>
      </div>
      <div v-else class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="first-run">
        <p class="text-[15px]">Nothing saved yet. Tap the star under any ayah in the reader and it will appear here. Notes you write show up under Notes.</p>
        <div class="mt-3 flex flex-wrap justify-center gap-2">
          <Button as-child class="min-h-11 md:min-h-8"><NuxtLink to="/surah/1" data-testid="first-run-reader">Open the reader</NuxtLink></Button>
          <Button as-child variant="outline" class="min-h-11 md:min-h-8"><NuxtLink to="/surah-listing" data-testid="first-run-listing">Surah listing</NuxtLink></Button>
        </div>
      </div>
    </div>
  </div>
</template>
