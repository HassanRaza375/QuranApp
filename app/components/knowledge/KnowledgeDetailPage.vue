<script setup lang="ts">
// One entry (prototype `pgKDetail`, with the legacy sections kept): name, Arabic, summary, the kind, a basis tag only when the Qur'an does not state it outright,
// Save and Play all; where it appears (the thread and the direct mentions); the passages with their ayahs; the module's own sections; Connected and
// Referenced by (the legacy graph, derived links worded as derived); the data's notes and its sources. No word on this page says "verified" or "reviewed":
// the basis label is the whole claim.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, bookmarkAddedAt, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { adapterFor } from "~/lib/knowledge";
import { linksFor, type LinkGroup } from "~/lib/knowledge/graph";
import { bookmarkKey, MODULES } from "~/lib/knowledge/modules";
import { passageLabel, playableAyahs, surahsOf, threadPositions } from "~/lib/knowledge/refs";
import type { KEntry, KnowledgeModuleId } from "~/lib/knowledge/types";
import { surahHref } from "~/lib/readerLinks";
import { reciterName } from "~/lib/surahAudio";

const props = defineProps<{ module: KnowledgeModuleId; id: string }>();
const info = MODULES[props.module];
const prefs = usePreferencesStore();
const player = usePlayerStore();
const undo = useUndoToast();

const entry = shallowRef<KEntry | null | undefined>(undefined); // undefined: loading; null: no such entry
const links = shallowRef<{ connected: LinkGroup[]; referencedBy: LinkGroup[] }>({ connected: [], referencedBy: [] });
const saved = ref(false);

async function load() {
  entry.value = undefined;
  try {
    entry.value = (await adapterFor(props.module)).get(props.id) ?? null;
  } catch {
    entry.value = null;
  }
  if (entry.value) links.value = linksFor(props.module, props.id);
  saved.value = hasBookmark(bookmarkKey(props.module, props.id));
}
onMounted(load);
watch(() => props.id, load);

useSeoMeta({
  title: () => (entry.value ? `${entry.value.name} · ${info.title} · Quran App` : `${info.title} · Quran App`),
  description: () => entry.value?.summary ?? info.title,
});

const marks = computed(() => (entry.value ? threadPositions(entry.value) : []));
const where = computed(() => {
  const e = entry.value;
  if (!e) return { ayahs: 0, surahs: 0 };
  return { ayahs: marks.value.length, surahs: surahsOf([...e.mentions, ...e.passages, ...e.also]).length };
});
const surahName = (n: number) => SURAH_ROWS[n - 1]?.name ?? `Surah ${n}`;

function toggleSave() {
  const key = bookmarkKey(props.module, props.id);
  const name = entry.value!.name;
  if (saved.value) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    saved.value = false;
    undo.withUndo(`Removed ${name} from saved`, () => {
      addBookmark(key, when);
      saved.value = true;
    });
  } else {
    addBookmark(key);
    saved.value = true;
    undo.withUndo(`Saved ${name}`, () => {
      removeBookmark(key);
      saved.value = false;
    });
  }
}

const queueId = computed(() => `knowledge:${props.module}:${props.id}`);
const playingAll = computed(() => player.queueActive(queueId.value));
const canPlay = computed(() => !!entry.value && playableAyahs(entry.value).length > 0);
function playAll() {
  const e = entry.value!;
  if (playingAll.value) return player.pause();
  void player.playQueue({ id: queueId.value, label: e.name, items: playableAyahs(e), reciter: reciterName(prefs.prefs.reciter), kind: "knowledge", ref: { module: props.module, id: props.id } });
}
</script>

<template>
  <section class="mx-auto max-w-3xl" :data-testid="`k-detail-${module}`">
    <KnowledgeTabs :current="module" />

    <template v-if="entry">
      <div class="text-[13px] text-ink-2"><NuxtLink :to="info.route" class="underline" data-testid="k-back">{{ info.title }}</NuxtLink></div>
      <div class="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div class="min-w-0 flex-1">
          <h1 class="font-serif text-[28px] font-medium md:text-[34px]" data-testid="k-name">{{ entry.name }}</h1>
          <p v-if="entry.alternateNames.length" class="text-[13px] text-ink-2" data-testid="k-alt">Also: {{ entry.alternateNames.join(", ") }}</p>
          <p class="mt-2 max-w-xl text-[15.5px] text-ink-2" data-testid="k-summary">{{ entry.summary }}</p>
        </div>
        <p class="ar !text-[34px] !leading-[1.8]" lang="ar" dir="rtl" data-testid="k-arabic">{{ entry.arabic }}</p>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="k-type">{{ entry.typeLabel }}</span>
        <span v-if="entry.basisLabel" class="rounded-full border border-dashed px-2.5 py-0.5 text-[12.5px]" data-testid="k-basis">{{ entry.basisLabel }}</span>
        <span class="flex-1" />
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="k-save" @click="toggleSave"><Icon name="lucide:star" size="16" />{{ saved ? "Saved" : "Save" }}</Button>
        <Button v-if="canPlay" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="playingAll" data-testid="k-play-all" @click="playAll"><Icon :name="playingAll ? 'lucide:pause' : 'lucide:play'" size="16" />{{ playingAll ? "Pause" : "Play all" }}</Button>
      </div>

      <div class="mt-8" data-testid="k-where">
        <div class="flex items-baseline gap-3"><h2 class="flex-1 text-[17px] font-medium">Where it appears</h2><span class="text-[13px] tabular-nums text-ink-2" data-testid="k-where-count">{{ where.ayahs }} {{ where.ayahs === 1 ? "ayah" : "ayahs" }} in {{ where.surahs }} {{ where.surahs === 1 ? "surah" : "surahs" }}</span></div>
        <div class="mt-3"><QuranThread :marks="marks" :label="`Where ${entry.name} appears in the Qur’an`" scale /></div>
        <ul v-if="entry.mentions.length" class="mt-3 flex flex-wrap gap-1.5" data-testid="k-mentions" aria-label="Direct mentions">
          <li v-for="(m, i) in entry.mentions" :key="i">
            <NuxtLink :to="surahHref(m.surah, m.from)" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[12.5px] tabular-nums hover:bg-accent md:min-h-8" data-testid="k-mention">{{ surahName(m.surah) }} <b class="ml-1 font-medium">{{ passageLabel(m) }}</b></NuxtLink>
          </li>
        </ul>
      </div>

      <div v-if="entry.passages.length" class="mt-8" data-testid="k-passages">
        <h2 class="text-[17px] font-medium">The ayahs</h2>
        <ul class="mt-1"><KnowledgePassage v-for="p in entry.passages" :key="p.id" :passage="p" /></ul>
      </div>
      <div v-if="entry.also.length" class="mt-8" data-testid="k-also">
        <h2 class="text-[17px] font-medium">Also occurs at</h2>
        <ul class="mt-1"><KnowledgePassage v-for="p in entry.also" :key="p.id" :passage="p" /></ul>
      </div>

      <section v-for="s in entry.sections" :key="s.id" class="mt-8" :data-testid="`k-section-${s.id}`">
        <h2 class="text-[17px] font-medium">{{ s.title }}</h2>
        <p v-if="s.text" class="mt-2 max-w-2xl text-[15px]">{{ s.text }}</p>
        <ul v-if="s.items?.length" class="mt-2 list-disc space-y-1 pl-5 text-[15px]"><li v-for="(it, i) in s.items" :key="i">{{ it }}</li></ul>
      </section>

      <section v-if="entry.themes.length" class="mt-8" data-testid="k-themes">
        <h2 class="text-[17px] font-medium">Themes</h2>
        <ul class="mt-2 flex flex-wrap gap-1.5"><li v-for="t in entry.themes" :key="t" class="rounded-full border px-3 py-1 text-[13px]">{{ t }}</li></ul>
      </section>

      <section v-if="links.connected.length" class="mt-8" data-testid="k-connected-section">
        <h2 class="text-[17px] font-medium">Connected</h2>
        <p class="mt-1 text-[13px] text-ink-2">Named in this entry’s own data.</p>
        <div class="mt-2"><KnowledgeLinkGroups :groups="links.connected" testid="k-connected" /></div>
      </section>
      <section v-if="links.referencedBy.length" class="mt-8" data-testid="k-referenced-section">
        <h2 class="text-[17px] font-medium">Referenced by</h2>
        <p class="mt-1 text-[13px] text-ink-2">Entries whose own data names {{ entry.name }}. {{ entry.name }}’s data does not name them back.</p>
        <div class="mt-2"><KnowledgeLinkGroups :groups="links.referencedBy" testid="k-referenced" /></div>
      </section>

      <section v-if="entry.notes.length || entry.sources.length" class="mt-8" data-testid="k-notes">
        <h2 class="text-[17px] font-medium">Notes and sources</h2>
        <ul v-if="entry.notes.length" class="mt-2 list-disc space-y-1.5 pl-5 text-[14px]" data-testid="k-status-notes"><li v-for="(n, i) in entry.notes" :key="i">{{ n }}</li></ul>
        <ul v-if="entry.sources.length" class="mt-3 space-y-2" data-testid="k-sources">
          <li v-for="(s, i) in entry.sources" :key="i" class="text-[14px]"><span class="mr-2 rounded-full border px-2 py-0.5 text-[12px]" :class="s.quran ? '' : 'border-dashed'">{{ s.label }}</span>{{ s.citation }}</li>
        </ul>
      </section>
    </template>

    <div v-else-if="entry === null" class="mt-4 rounded-[10px] border border-dashed px-4 py-10 text-center" data-testid="k-missing">
      <h1 class="font-serif text-[22px] font-medium">No such entry</h1>
      <p class="mt-1 text-[14px] text-ink-2">There is nothing called “{{ id }}” in {{ info.title }}.</p>
      <p class="mt-3"><NuxtLink :to="info.route" class="text-brand underline">Back to {{ info.title }}</NuxtLink></p>
    </div>
    <div v-else class="mt-4 space-y-3" aria-hidden="true"><Skeleton class="h-10 w-2/3" /><Skeleton class="h-6 w-full" /><Skeleton class="h-40 w-full" /></div>
  </section>
</template>
