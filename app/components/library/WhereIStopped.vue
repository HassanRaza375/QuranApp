<script setup lang="ts">
// Where I stopped: three slots (Reading, Page, Story). A pin has a Clear button (with Undo). With no reading pin the automatic
// last-read place is shown, with no clear button. An empty slot says "Not set" and what sets it.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { pageHref, surahHref } from "~/lib/readerLinks";
import { lastRead, type LastRead } from "~/lib/readingMarker";
import { getJSON } from "~/lib/storage";
import { clearProgress, restoreProgress } from "~/lib/storyProgress";
import { HISTORY_KEYS } from "~/lib/userState";

const store = useLibraryStore();
const home = useHomeState();
const last = ref<LastRead | null>(null);
const refresh = () => {
  last.value = lastRead(getJSON<unknown>(HISTORY_KEYS.readingProgress, null));
};
onMounted(() => {
  refresh();
  void home.load();
});
watch(() => store.readingPin, refresh);

const study = computed(() => home.state.value?.study ?? null);
const undo = useUndoToast();
/** Clears only a story's progress (a person's study record is not cleared from here), with Undo. */
function clearStory() {
  const s = study.value;
  if (!s || s.kind !== "story") return;
  const before = clearProgress(s.personId);
  void home.load();
  if (before) {
    undo.withUndo("Story progress cleared.", () => {
      restoreProgress(s.personId, before);
      void home.load();
    });
  }
}
const reading = computed(() => {
  const p = store.readingPin;
  if (p) return { label: "Pinned", title: `${SURAH_ROWS[p.surahNo - 1]!.name}, ayah ${p.ayahNo}`, href: surahHref(p.surahNo, p.ayahNo), clear: true };
  if (last.value) return { label: "Last read", title: `${SURAH_ROWS[last.value.surahNo - 1]!.name}, ayah ${last.value.ayahNo}`, href: last.value.href, clear: false };
  return null;
});
</script>

<template>
  <section aria-labelledby="stopped-h" data-testid="where-i-stopped">
    <h2 id="stopped-h" class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Where I stopped</h2>
    <div class="mt-2 grid gap-2 md:grid-cols-3">
      <div class="flex min-h-[72px] items-center gap-2 rounded-[10px] border p-3" data-testid="slot-reading">
        <div class="min-w-0 flex-1">
          <p class="text-[12px] text-ink-2">Reading{{ reading ? ` · ${reading.label}` : "" }}</p>
          <NuxtLink v-if="reading" :to="reading.href" class="mt-0.5 inline-flex min-h-11 items-center text-[14.5px] font-medium hover:underline md:min-h-0" data-testid="slot-reading-link">{{ reading.title }}</NuxtLink>
          <p v-else class="mt-0.5 text-[13.5px]">Not set. Pin a spot from the reader.</p>
        </div>
        <Button v-if="reading?.clear" variant="ghost" class="size-11 shrink-0 md:size-9" aria-label="Clear the reading pin" data-testid="slot-reading-clear" @click="store.clearReadingPin()"><Icon name="lucide:x" size="16" /></Button>
      </div>
      <div class="flex min-h-[72px] items-center gap-2 rounded-[10px] border p-3" data-testid="slot-page">
        <div class="min-w-0 flex-1">
          <p class="text-[12px] text-ink-2">Page{{ store.pagePin ? " · Pinned" : "" }}</p>
          <NuxtLink v-if="store.pagePin" :to="pageHref(store.pagePin.pageNo)" class="mt-0.5 inline-flex min-h-11 items-center text-[14.5px] font-medium hover:underline md:min-h-0" data-testid="slot-page-link">Page {{ store.pagePin.pageNo }}</NuxtLink>
          <p v-else class="mt-0.5 text-[13.5px]">Not set. Pin a page from the page reader.</p>
        </div>
        <Button v-if="store.pagePin" variant="ghost" class="size-11 shrink-0 md:size-9" aria-label="Clear the page pin" data-testid="slot-page-clear" @click="store.clearPagePin()"><Icon name="lucide:x" size="16" /></Button>
      </div>
      <div class="flex min-h-[72px] items-center gap-2 rounded-[10px] border p-3" data-testid="slot-story">
        <div class="min-w-0 flex-1">
          <p class="text-[12px] text-ink-2">Story</p>
          <NuxtLink v-if="study" :to="study.href" class="mt-0.5 inline-flex min-h-11 items-center text-[14.5px] font-medium hover:underline md:min-h-0" data-testid="slot-story-link">{{ study.line }}</NuxtLink>
          <p v-else class="mt-0.5 text-[13.5px]">Not set. Appears when you read a person or story.</p>
        </div>
        <Button v-if="study?.kind === 'story'" variant="ghost" class="size-11 shrink-0 md:size-9" aria-label="Clear the story progress" data-testid="slot-story-clear" @click="clearStory"><Icon name="lucide:x" size="16" /></Button>
      </div>
    </div>
  </section>
</template>
