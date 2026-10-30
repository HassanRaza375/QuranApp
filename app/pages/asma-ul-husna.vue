<script setup lang="ts">
// Asma-ul-Husna (prototype d-page-asma / m-page-asma). The 99 names are the legacy data file, imported. Offline level A (bundled).
// The legacy page's YouTube embed is not carried over (a third-party page); the per-name audio waits for the player (Phase 4B).
// See docs/pages/asma-ul-husna.md.
import names from "@legacy/assets/data/names.json";
import { ASMA_FOOTER, NAME_CLIP_LINE, asmaCountLine, nameClipId, noMatchLine, NO_SAVED_NAMES, parseNameHash, savedNameIds, SEARCH_LABEL, searchNames, shown, type AsmaName } from "~/lib/asma";
import { addBookmark, bookmarkAddedAt, listBookmarks, nameBookmarkKey, removeBookmark } from "~/lib/bookmarks";
import { nameCounterId } from "~/lib/tasbeeh";

useSeoMeta({
  title: "Asma-ul-Husna · Quran App",
  description: "The 99 names of Allah in Arabic, with transliteration, meaning and Urdu.",
});

const route = useRoute();
const router = useRouter();
const undo = useUndoToast();
const player = usePlayerStore();

const NAMES = names as AsmaName[];
const TOTAL = NAMES.length;
const q = ref("");
const savedOnly = ref(false);
const saved = ref<Set<number>>(new Set());
const open = ref<number | null>(null);

const refreshSaved = () => (saved.value = savedNameIds(listBookmarks()));
const matches = computed(() => searchNames(NAMES, q.value).filter((n) => !savedOnly.value || saved.value.has(n.id)));
const list = computed(() => matches.value.map(shown));
const emptyLine = computed(() => (savedOnly.value && !q.value.trim() ? NO_SAVED_NAMES : noMatchLine(q.value)));
const current = computed(() => (open.value ? shown(NAMES[open.value - 1]!) : null));

function toggleSave(id: number) {
  const key = nameBookmarkKey(id);
  const n = shown(NAMES[id - 1]!);
  if (saved.value.has(id)) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshSaved();
    undo.withUndo(`Removed ${n.shownTransliteration} from saved`, () => {
      addBookmark(key, when);
      refreshSaved();
    });
  } else {
    addBookmark(key);
    refreshSaved();
    undo.withUndo(`Saved ${n.shownTransliteration}`, () => {
      removeBookmark(key);
      refreshSaved();
    });
  }
}

// the name's own recording, through the shared player (a clip: no reciter, no queue); a second press pauses it
function playName() {
  const n = current.value;
  if (!n) return;
  if (player.clipIs(nameClipId(n.id))) return void player.toggle();
  void player.playClip({ id: nameClipId(n.id), title: n.shownTransliteration, subtitle: NAME_CLIP_LINE, url: n.audio });
}
const namePlaying = computed(() => !!current.value && player.clipActive(nameClipId(current.value.id)));

// a name opens in a sheet; the address holds it (#name-12) so a Library row can open it
const fromHash = () => (open.value = parseNameHash(route.hash, TOTAL));
function openName(id: number) {
  open.value = id;
  void router.replace({ hash: `#name-${id}` });
}
function closeName() {
  open.value = null;
  if (route.hash) void router.replace({ hash: "" });
}

onMounted(() => {
  refreshSaved();
  fromHash();
});
watch(() => route.hash, fromHash);
</script>

<template>
  <section data-testid="asma-page">
    <h1 class="font-serif text-[26px] font-medium md:text-[30px]">Asma-ul-Husna</h1>
    <p class="mt-1 text-[14px] text-ink-2">The 99 names, from this app’s data. Saved names stay on this device.</p>

    <div class="mt-4 space-y-3">
      <Input v-model="q" type="search" autocomplete="off" placeholder="Search by name, meaning or number" :aria-label="SEARCH_LABEL" class="!h-11 md:!h-9" data-testid="asma-search" />
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-pressed="savedOnly" :class="savedOnly ? 'border-brand text-brand' : ''" data-testid="asma-saved" @click="savedOnly = !savedOnly">
          <Icon name="lucide:star" size="16" />Saved
        </Button>
        <p class="text-[13px] text-ink-2" role="status" data-testid="asma-count">{{ asmaCountLine(list.length, TOTAL) }}</p>
      </div>
    </div>

    <p v-if="!list.length" class="mt-6 rounded-[10px] border border-dashed px-4 py-8 text-center text-[15px]" data-testid="asma-empty">{{ emptyLine }}</p>
    <ul v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="asma-grid">
      <li v-for="n in list" :key="n.id" class="name-card relative rounded-[10px] border bg-surface" :data-id="n.id" data-testid="name-card">
        <button
          type="button"
          class="flex w-full flex-col items-center gap-1 rounded-[10px] px-3 pb-4 pt-9 text-center hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
          data-testid="name-open"
          @click="openName(n.id)"
        >
          <span class="ar !text-[34px] !leading-[1.8]" lang="ar" dir="rtl" data-testid="name-arabic">{{ n.arabic }}</span>
          <span class="ur !text-[18px] !leading-[2] text-ink-2" lang="ur" dir="rtl" data-testid="name-urdu">{{ n.urdu }}</span>
          <span class="text-[15px] font-medium" data-testid="name-translit">{{ n.shownTransliteration }}</span>
          <span class="text-[14px] text-ink-2" data-testid="name-english">{{ n.shownEnglish }}</span>
        </button>
        <span class="pointer-events-none absolute left-3 top-2 text-[12px] tabular-nums text-ink-2" data-testid="name-number">#{{ n.id }}</span>
        <button
          type="button"
          class="absolute right-1 top-0 inline-flex size-11 items-center justify-center rounded-full hover:bg-sunken"
          :class="saved.has(n.id) ? 'text-brand' : 'text-ink-2'"
          :aria-pressed="saved.has(n.id)"
          :aria-label="saved.has(n.id) ? `Remove ${n.shownTransliteration} from saved` : `Save ${n.shownTransliteration}`"
          data-testid="name-star"
          @click="toggleSave(n.id)"
        >
          <Icon name="lucide:star" size="18" :class="saved.has(n.id) ? 'fill-current' : ''" />
        </button>
      </li>
    </ul>

    <p class="mt-6 text-[12.5px] text-ink-2" data-testid="asma-footer">{{ ASMA_FOOTER }}</p>

    <AsmaNameSheet :name="current" :saved="current ? saved.has(current.id) : false" :total="TOTAL" :playing="namePlaying" @close="closeName" @save="current && toggleSave(current.id)" @play="playName">
      <template #count>
        <Button v-if="current" as-child variant="outline" class="min-h-11 gap-1.5 md:min-h-9"><NuxtLink :to="`/tasbeeh/${nameCounterId(current.id)}`" data-testid="sheet-count"><Icon name="lucide:circle-dot" size="16" />Count this name</NuxtLink></Button>
      </template>
    </AsmaNameSheet>
  </section>
</template>

<style scoped>
.name-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 190px;
}
</style>
