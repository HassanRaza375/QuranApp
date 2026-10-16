<script setup lang="ts">
// Library (prototype d-page-library / m-page-library): Where I stopped, then Saved / Collections / Notes. Everything is stored on this
// device in the legacy keys. See docs/phases/phase-06-library.md.
import { buildLibraryExport, exportMessage, libraryExportName } from "~/lib/libraryExport";
import { OPENS_TODAY, PENDING_PHASE } from "~/lib/libraryItems";

useSeoMeta({ title: "Library · Quran App", description: "Everything you save and write, in one place." });

const store = useLibraryStore();
const route = useRoute();
const router = useRouter();
const undo = useUndoToast();
const snippets = useAyahSnippets();

const VIEWS = [
  { id: "saved", label: "Saved" },
  { id: "collections", label: "Collections" },
  { id: "notes", label: "Notes" },
] as const;
const view = computed(() => (route.query.view === "collections" || route.query.view === "notes" ? route.query.view : "saved"));
const collectionId = computed(() => (typeof route.query.collection === "string" ? route.query.collection : null));
const setView = (v: string, extra: Record<string, string> = {}) => router.push({ path: "/bookmarks", query: v === "saved" && !extra.collection ? {} : { view: v, ...extra } });

let stop: (() => void) | undefined;
onMounted(() => {
  snippets.forget(); // a revisit asks again for rows whose text could not be loaded before
  store.reload();
  void store.ensureProviders();
  stop = store.listen();
});
onBeforeUnmount(() => stop?.());
watch(() => store.lib.bookmarks.length + Object.keys(store.lib.itemMeta).length, () => void store.ensureProviders());

const editKey = ref<string | null>(null);
const newNoteOpen = ref(false);
const editReturn = ref<HTMLElement | null>(null);
const openEdit = (key: string) => {
  editReturn.value = document.activeElement as HTMLElement | null;
  editKey.value = key;
};
const openAfterNew = (key: string) => void nextTick(() => (editKey.value = key));

const count = computed(() => {
  if (view.value === "collections") return `${store.lib.collections.length} ${store.lib.collections.length === 1 ? "collection" : "collections"}`;
  if (view.value === "notes") return `${store.notes.length} ${store.notes.length === 1 ? "note" : "notes"}`;
  return `${store.lib.bookmarks.length} saved`;
});

/** The types that are saved but whose pages are not rebuilt yet, named once. */
const pendingNotice = computed(() => {
  const names = [...new Set([...store.typesPresent].filter((t) => !OPENS_TODAY[t] && PENDING_PHASE[t]).map((t) => PENDING_PHASE[t]!))];
  if (!names.length) return "";
  const list = names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} ${names.length === 1 ? "is" : "are"} still being moved to the new design, so opening those items shows a placeholder for now.`;
});

function exportLibrary() {
  const blob = new Blob([JSON.stringify(buildLibraryExport(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = libraryExportName(new Date());
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  undo.info(exportMessage(store.lib));
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-serif text-[28px] font-medium">Library</h1>
        <p class="mt-1 text-[14px] text-ink-2">Everything you save and write, in one place. Stored on this device.</p>
      </div>
      <div class="text-right">
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" data-testid="library-export" @click="exportLibrary"><Icon name="lucide:download" size="15" />Export</Button>
        <p class="mt-1 max-w-56 text-[12px] text-ink-2">Settings, Data &amp; privacy has a full export.</p>
      </div>
    </div>

    <div class="mt-5"><LibraryWhereIStopped /></div>

    <nav aria-label="Library views" class="mt-6 flex border-b" data-testid="library-tabs">
      <button
        v-for="v in VIEWS"
        :key="v.id"
        type="button"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="v.id === view ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="v.id === view ? 'page' : undefined"
        :data-testid="`tab-${v.id}`"
        @click="setView(v.id)"
      >
        {{ v.label }}
      </button>
    </nav>
    <p class="mt-3 text-[14px] text-ink-2" role="status" data-testid="library-count">{{ count }}</p>
    <p v-if="pendingNotice && view === 'saved'" class="mt-1 text-[12.5px] text-ink-2" data-testid="pending-notice">{{ pendingNotice }}</p>

    <div class="mt-3">
      <LibrarySavedList v-if="view === 'saved'" :collection-id="collectionId" @edit="openEdit" @clear-collection="setView('saved')" @new-note="newNoteOpen = true" />
      <LibraryCollectionsList v-else-if="view === 'collections'" @open="(id) => setView('saved', { collection: id })" />
      <LibraryNotesList v-else @edit="openEdit" @new-note="newNoteOpen = true" />
    </div>

    <LibraryEditSheet :item-key="editKey" @close="editKey = null; editReturn?.focus()" />
    <LibraryNewNoteSheet :open="newNoteOpen" @close="newNoteOpen = false" @open="openAfterNew" />
  </section>
</template>
