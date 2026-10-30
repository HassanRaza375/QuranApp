<script setup lang="ts">
// A module's list (prototype `pgKList`, with the legacy filters kept): the tab strip, the title and its question, then ONE filter row: the filter box (names,
// Arabic, themes, or a reference such as 7:65 or 7:65-72), the module's type menu, Saved, Reset; then the cards. The state lives in the URL
// (?q=&t=&saved=1) so Back restores it. Each module's data is its own chunk, loaded here.
import { onBeforeUnmount } from "vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { addBookmark, bookmarkAddedAt, BOOKMARKS_KEY, listBookmarks, removeBookmark } from "~/lib/bookmarks";
import { adapterFor } from "~/lib/knowledge";
import { bookmarkKey, MODULES } from "~/lib/knowledge/modules";
import { parseAyahQuery } from "~/lib/knowledge/refs";
import type { KAdapter, KnowledgeModuleId } from "~/lib/knowledge/types";

const props = defineProps<{ module: KnowledgeModuleId }>();
const info = MODULES[props.module];
const route = useRoute();
const router = useRouter();
const undo = useUndoToast();

useSeoMeta({
  title: `${info.title} · Quran App`,
  description: `Browse the ${info.title.toLowerCase()} of the Qur’an, each with the ayahs that mention it.`,
});

const adapter = shallowRef<KAdapter | null>(null);
const failed = ref(false);
onMounted(async () => {
  try {
    adapter.value = await adapterFor(props.module);
  } catch {
    failed.value = true;
  }
});

// ---- the filters, in the URL
interface Filters {
  q: string;
  t: string;
  saved: boolean;
}
const fromQuery = (q: Record<string, unknown>): Filters => ({ q: typeof q.q === "string" ? q.q : "", t: typeof q.t === "string" && q.t ? q.t : "all", saved: q.saved === "1" });
const toQuery = (f: Filters): Record<string, string> => ({ ...(f.q.trim() ? { q: f.q } : {}), ...(f.t !== "all" ? { t: f.t } : {}), ...(f.saved ? { saved: "1" } : {}) });
const f = reactive<Filters>(fromQuery(route.query));
const same = (a: Filters, b: Filters) => a.q === b.q && a.t === b.t && a.saved === b.saved;
watch(f, () => {
  if (!same(f, fromQuery(route.query))) void router.replace({ query: toQuery(f) });
});
watch(
  () => route.query,
  (q) => {
    const n = fromQuery(q);
    if (!same(f, n)) Object.assign(f, n);
  },
);

// ---- saved (the legacy bookmark keys)
const saved = ref<Set<string>>(new Set());
const prefix = `${info.bookmark}:`;
const refreshSaved = () => (saved.value = new Set(listBookmarks().filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length))));
const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === BOOKMARKS_KEY) refreshSaved();
};
onMounted(() => {
  refreshSaved();
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => window.removeEventListener("storage", onStorage));

const rows = computed(() => {
  const a = adapter.value;
  if (!a) return [];
  const list = a.search(f.t, f.q);
  return f.saved ? list.filter((e) => saved.value.has(e.id)) : list;
});
const total = computed(() => adapter.value?.entries.length ?? 0);
const typeOptions = computed<MenuOption[]>(() => (adapter.value?.filters ?? []).map((x) => ({ value: x.value, label: x.label })));
const filtered = computed(() => !!f.q.trim() || f.t !== "all" || f.saved);
const isRef = computed(() => !!parseAyahQuery(f.q));

function toggle(id: string, name: string) {
  const key = bookmarkKey(props.module, id);
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
const reset = () => Object.assign(f, { q: "", t: "all", saved: false });
const countLine = computed(() => (rows.value.length === total.value ? `${total.value} entries` : `${rows.value.length} of ${total.value}`));
const empty = computed(() => {
  if (f.saved && !f.q.trim()) return f.t === "all" ? "Nothing saved yet. Open an entry and tap Save." : "None of your saved entries are of this kind.";
  if (isRef.value) return `Nothing here points at ${f.q.trim()}.`;
  return f.q.trim() ? `Nothing matches “${f.q.trim()}”${f.t === "all" ? "" : " of this kind"}.` : "Nothing to show.";
});
</script>

<template>
  <section class="mx-auto max-w-5xl" :data-testid="`k-list-${module}`">
    <KnowledgeTabs :current="module" />
    <h1 class="font-serif text-[28px] font-medium md:text-[32px]" data-testid="k-title">{{ info.title }}</h1>
    <p class="mt-1 max-w-2xl text-[15px] text-ink-2" data-testid="k-lede">{{ info.question }} <span v-if="total">{{ total }} entries, each anchored to the ayahs that mention it.</span></p>

    <div class="mt-5 space-y-3">
      <Input v-model="f.q" type="search" autocomplete="off" placeholder="Name, Arabic, theme or ayah (7:65)" :aria-label="`Filter ${info.title.toLowerCase()}`" class="!h-11 md:!h-9" data-testid="k-filter" />
      <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
        <div v-if="typeOptions.length" class="min-w-0"><ResponsiveMenu :model-value="f.t" :options="typeOptions" label="Kind" align="start" @update:model-value="(v) => (f.t = v)" /></div>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="f.saved" :class="f.saved ? 'border-brand text-brand' : ''" data-testid="k-saved" @click="f.saved = !f.saved"><Icon name="lucide:star" size="16" />Saved</Button>
        <Button v-if="filtered" variant="ghost" class="min-h-11 gap-2 md:min-h-8" data-testid="k-reset" @click="reset"><Icon name="lucide:x" size="16" />Reset</Button>
      </div>
      <p class="text-[13px] text-ink-2" role="status" data-testid="k-count">{{ adapter ? countLine : "" }}</p>
    </div>

    <p v-if="failed" class="mt-6 rounded-[10px] border border-dashed px-4 py-6 text-[14px]" role="status" data-testid="k-failed">This list could not be loaded. Reload the page to try again.</p>
    <ul v-else-if="adapter && rows.length" class="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="k-grid">
      <KnowledgeCard v-for="e in rows" :key="e.id" :entry="e" :saved="saved.has(e.id)" @star="toggle(e.id, e.name)" />
    </ul>
    <div v-else-if="adapter" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="k-empty">
      <p class="text-[15px]">{{ empty }}</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="k-empty-reset" @click="reset">Reset the filters</Button>
    </div>
    <div v-else class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true"><Skeleton v-for="i in 6" :key="i" class="h-44 rounded-[10px]" /></div>
  </section>
</template>
