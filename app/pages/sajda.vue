<script setup lang="ts">
// Verses of prostration (prototype d-page-sajda / m-page-sajda). The 15 references are the service's list, bundled (offline level A); the Arabic is
// the surah reader's text (cached chapter, then the per-ayah store, then one small request). No obligatory/recommended labels and no
// per-tradition statements: those need a reviewed source (CONTENT_TO_VERIFY.md). See docs/pages/sajda.md.
import { addBookmark, bookmarkAddedAt, hasBookmark, removeBookmark, sajdaBookmarkKey } from "~/lib/bookmarks";
import { SAJDA_NO_TEXT, SAJDA_TEXT_FAILED, SAJDA_TITLE, sajdaCountLine, sajdaRows } from "~/lib/sajda";

useSeoMeta({
  title: "Verses of prostration · Quran App",
  description: "The verses of prostration in the Qur’an, with their locations and Arabic text.",
});

const undo = useUndoToast();
const snippets = useAyahSnippets();
const rows = sajdaRows();
const saved = ref<Set<string>>(new Set());
const refreshSaved = () => (saved.value = new Set(rows.filter((r) => hasBookmark(sajdaBookmarkKey(r.surah, r.ayah))).map((r) => `${r.surah}:${r.ayah}`)));
const isSaved = (r: { surah: number; ayah: number }) => saved.value.has(`${r.surah}:${r.ayah}`);

function toggle(r: (typeof rows)[number]) {
  const key = sajdaBookmarkKey(r.surah, r.ayah);
  const label = `${r.surahName} ${r.surah}:${r.ayah}`;
  if (isSaved(r)) {
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
    undo.withUndo(`Saved ${label}`, () => {
      removeBookmark(key);
      refreshSaved();
    });
  }
}

const textOf = (r: { surah: number; ayah: number }) => snippets.get(r.surah, r.ayah);
onMounted(() => {
  refreshSaved();
  for (const r of rows) snippets.request(r.surah, r.ayah);
});
onBeforeUnmount(() => snippets.forget());
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="sajda-page">
    <h1 class="font-serif text-[26px] font-medium md:text-[30px]">{{ SAJDA_TITLE }}</h1>
    <p class="mt-1 text-[14px] text-ink-2" data-testid="sajda-count">{{ sajdaCountLine(rows.length) }}</p>

    <ol class="mt-5" data-testid="sajda-list">
      <li v-for="r in rows" :key="r.n" class="border-b py-6" data-testid="sajda-row" :data-surah="r.surah" :data-ayah="r.ayah">
        <div class="flex items-start gap-3">
          <span class="w-6 shrink-0 pt-1 text-[12px] tabular-nums text-ink-2" data-testid="sajda-n">{{ r.n }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-medium" data-testid="sajda-ref">{{ r.surahName }} <span class="text-ink-2">{{ r.surah }}:{{ r.ayah }}</span></p>
            <p class="text-[12.5px] text-ink-2" data-testid="sajda-where">Juz {{ r.juz }} · Page {{ r.page }}</p>
          </div>
          <button
            type="button"
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-sunken md:size-9"
            :class="isSaved(r) ? 'text-brand' : 'text-ink-2'"
            :aria-pressed="isSaved(r)"
            :aria-label="isSaved(r) ? `Remove ${r.surahName} ${r.surah}:${r.ayah} from saved` : `Save ${r.surahName} ${r.surah}:${r.ayah}`"
            data-testid="sajda-star"
            @click="toggle(r)"
          >
            <Icon name="lucide:star" size="18" :class="isSaved(r) ? 'fill-current' : ''" />
          </button>
        </div>

        <div class="mt-3 pl-9">
          <p v-if="textOf(r) && textOf(r) !== 'loading' && (textOf(r) as { state: string }).state === 'text'" class="ar text-right" lang="ar" dir="rtl" data-testid="sajda-text">{{ (textOf(r) as { text: string }).text }}</p>
          <div v-else-if="!textOf(r) || textOf(r) === 'loading'" class="space-y-2" aria-busy="true" aria-label="Loading the text" data-testid="sajda-loading"><Skeleton class="ml-auto h-8 w-4/5" /></div>
          <p v-else-if="(textOf(r) as { state: string }).state === 'none'" class="text-[13px] text-ink-2" data-testid="sajda-none">{{ SAJDA_NO_TEXT }}</p>
          <p v-else class="text-[13px] text-ink-2" data-testid="sajda-failed">
            {{ SAJDA_TEXT_FAILED }}
            <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-9" data-testid="sajda-retry" @click="snippets.request(r.surah, r.ayah, true)">Try again</button>
          </p>
          <NuxtLink :to="r.href" class="mt-2 inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-9" data-testid="sajda-open">Open in the reader</NuxtLink>
        </div>
      </li>
    </ol>
  </section>
</template>
