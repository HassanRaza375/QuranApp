<script setup lang="ts">
// The Qur'an text of one chapter: Arabic (with the verse marker) and the translation chosen in Settings, from the cached surah through
// the reader's loader (one request per surah, shared with the reader). Never typed. The first ayahs show, then "Show all N ayahs".
import type { Chapter } from "~/lib/chapter";
import { readReaderPrefs, readerTranslation } from "~/lib/readerPrefs";
import { FIRST_AYAHS, refText, visibleAyahs, type StoryChapter } from "~/lib/stories";
import { surahHref } from "~/lib/readerLinks";

const props = defineProps<{ chapter: StoryChapter }>();
const emit = defineEmits<{ ready: [] }>();
const prefs = usePreferencesStore();
const text = useQuranText();

type Load = { state: "loading" } | { state: "ready"; chapter: Chapter } | { state: "error"; message: string };
const loaded = ref<Record<number, Load>>({});
const showAll = ref(false);
const moreBtn = ref<HTMLButtonElement | null>(null);

const offlineMessage = "This surah isn’t saved on this device yet. Connect once to read it.";
const failedMessage = "Couldn’t load this surah. Check your connection and try again.";

const surahs = computed(() => [...new Set(props.chapter.passages.map((p) => p.surahNumber))]);
async function loadSurah(n: number) {
  loaded.value = { ...loaded.value, [n]: { state: "loading" } };
  try {
    const { value } = await text.getChapter(n);
    loaded.value = { ...loaded.value, [n]: { state: "ready", chapter: value } };
  } catch {
    loaded.value = { ...loaded.value, [n]: { state: "error", message: typeof navigator !== "undefined" && navigator.onLine === false ? offlineMessage : failedMessage } };
  }
}
watch(
  () => props.chapter,
  () => {
    showAll.value = false;
    loaded.value = {};
    surahs.value.forEach((n) => void loadSurah(n));
  },
  { immediate: true },
);

watch(loaded, (l) => {
  if (surahs.value.length && surahs.value.every((n) => l[n]?.state === "ready")) emit("ready"); // the text is there: the end of the chapter can now count
});

const translation = computed(() => readerTranslation(prefs.prefs, readReaderPrefs()));
const order = computed(() => prefs.prefs.verseLayout);
const trKey = computed(() => (translation.value === "english" ? "english" : translation.value === "urdu" ? "urdu" : translation.value === "bengali" ? "bengali" : translation.value === "arabic2" ? "arabic2" : null));
const trLang = computed(() => ({ english: "en", urdu: "ur", bengali: "bn", arabic2: "ar" })[translation.value ?? "english"]);
const trRtl = computed(() => translation.value === "urdu" || translation.value === "arabic2");
const trClass = computed(() => (translation.value === "urdu" ? "ur" : translation.value === "bengali" ? "bn" : translation.value === "arabic2" ? "ar !text-[22px] !leading-[2]" : "font-serif text-[16.5px] leading-[1.65]"));

const blocks = computed(() => visibleAyahs(props.chapter, showAll.value));
const long = computed(() => props.chapter.ayahs > FIRST_AYAHS);
const range = (s: number, a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => ({ s, n: a + i }));

async function expand() {
  showAll.value = true;
  await nextTick();
  moreBtn.value?.focus();
}
</script>

<template>
  <div data-testid="chapter-text">
    <template v-for="(b, bi) in blocks" :key="`${b.surahNumber}-${b.ayahStart}`">
      <p v-if="chapter.passages.length > 1" class="mt-4 text-[12.5px] text-ink-2" data-testid="passage-heading">{{ refText(b) }}</p>
      <div v-if="loaded[b.surahNumber]?.state === 'ready'">
        <article v-for="a in range(b.surahNumber, b.ayahStart, b.ayahEnd)" :key="a.n" class="border-b py-5" :data-surah="a.s" :data-n="a.n" data-testid="story-ayah">
          <template v-for="mode in [order]" :key="mode">
            <p v-if="mode === 'ar'" class="ar mb-3 text-right" lang="ar" dir="rtl" data-testid="story-arabic">
              {{ (loaded[a.s] as Extract<Load, { state: "ready" }>).chapter.arabic1[a.n - 1] }}<span class="verse-mark" aria-hidden="true">{{ a.n }}</span>
            </p>
            <p v-if="trKey" :class="trClass" class="mb-3 max-w-[600px] text-ink-2" :lang="trLang" :dir="trRtl ? 'rtl' : 'ltr'" :style="trRtl ? 'text-align: right; margin-left: auto' : ''" data-testid="story-translation">{{ (loaded[a.s] as Extract<Load, { state: "ready" }>).chapter[trKey][a.n - 1] }}</p>
            <p v-if="mode !== 'ar'" class="ar mb-3 text-right" lang="ar" dir="rtl" data-testid="story-arabic">
              {{ (loaded[a.s] as Extract<Load, { state: "ready" }>).chapter.arabic1[a.n - 1] }}<span class="verse-mark" aria-hidden="true">{{ a.n }}</span>
            </p>
          </template>
          <NuxtLink :to="surahHref(a.s, a.n)" class="inline-flex min-h-11 items-center text-[12.5px] text-ink-2 underline md:min-h-8" :aria-label="`Read ${refText({ surahNumber: a.s, ayahStart: a.n, ayahEnd: a.n })} in the surah`" data-testid="story-ayah-link">{{ a.s }}:{{ a.n }}</NuxtLink>
        </article>
      </div>
      <div v-else-if="loaded[b.surahNumber]?.state === 'error'" class="mt-3 rounded-[10px] border border-dashed px-4 py-6 text-center" role="alert" data-testid="chapter-error">
        <p class="text-[14.5px]">{{ (loaded[b.surahNumber] as Extract<Load, { state: "error" }>).message }}</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" data-testid="chapter-retry" @click="loadSurah(b.surahNumber)">Retry</Button>
      </div>
      <div v-else class="mt-3" aria-busy="true" aria-label="Loading the text" data-testid="chapter-loading">
        <div v-for="i in Math.min(3, b.ayahEnd - b.ayahStart + 1)" :key="`${bi}-${i}`" class="border-b py-5"><Skeleton class="mb-3 ml-auto h-9 w-4/5" /><Skeleton class="h-4 w-2/3" /></div>
      </div>
    </template>

    <div v-if="long && !showAll" class="mt-4">
      <button ref="moreBtn" type="button" class="inline-flex min-h-11 items-center rounded-md border px-4 text-[14px] hover:bg-accent md:min-h-9" :aria-expanded="false" data-testid="show-all" @click="expand">Show all {{ chapter.ayahs }} ayahs</button>
    </div>
    <div v-else-if="long && showAll" class="mt-4">
      <button ref="moreBtn" type="button" class="inline-flex min-h-11 items-center rounded-md border px-4 text-[14px] hover:bg-accent md:min-h-9" :aria-expanded="true" data-testid="show-fewer" @click="showAll = false">Show fewer</button>
    </div>
  </div>
</template>
