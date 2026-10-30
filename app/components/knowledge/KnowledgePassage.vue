<script setup lang="ts">
// One passage of an entry: its reference and the data's own one-line description, and the ayahs themselves. The Arabic and the translation come from the
// reader's text (the cached surah, or one request when online), never from the data files. A short passage is open; a long one waits behind a button.
// Each ayah has Play (your Settings reciter) and Open in reader. Offline and not saved: a plain line and Try again, never a blank.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import type { Chapter } from "~/lib/chapter";
import { ayahCount, passageLabel } from "~/lib/knowledge/refs";
import type { KPassage } from "~/lib/knowledge/types";
import { readerTranslation, readReaderPrefs } from "~/lib/readerPrefs";
import { surahHref } from "~/lib/readerLinks";
import { reciterName } from "~/lib/surahAudio";

const props = defineProps<{ passage: KPassage }>();
const OPEN_UP_TO = 6;
const prefs = usePreferencesStore();
const player = usePlayerStore();
const text = useQuranText();

const open = ref(ayahCount(props.passage) <= OPEN_UP_TO);
const chapter = shallowRef<Chapter | null>(null);
const state = ref<"idle" | "loading" | "ready" | "offline" | "failed">("idle");
const lang = ref<"english" | "urdu" | "bengali" | "arabic2" | null>(null);
const surah = computed(() => SURAH_ROWS[props.passage.surah - 1]!);
const ayahs = computed(() => Array.from({ length: ayahCount(props.passage) }, (_, i) => props.passage.from + i));

async function load() {
  if (chapter.value || state.value === "loading") return;
  state.value = "loading";
  try {
    chapter.value = (await text.getChapter(props.passage.surah)).value;
    state.value = "ready";
  } catch {
    state.value = typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "failed";
  }
}
onMounted(() => {
  lang.value = readerTranslation(prefs.prefs, readReaderPrefs());
  if (open.value) void load();
});
watch(open, (v) => v && void load());

const arabicOf = (a: number) => chapter.value?.arabic1[a - 1] ?? "";
const translationOf = (a: number) => (chapter.value && lang.value ? (chapter.value[lang.value][a - 1] ?? "") : "");
const rtl = computed(() => lang.value === "urdu" || lang.value === "arabic2");
const reciter = computed(() => reciterName(prefs.prefs.reciter));
const play = (a: number) => void player.playAyah({ surah: props.passage.surah, ayah: a, reciter: reciter.value });
</script>

<template>
  <li class="border-b py-4" data-testid="k-passage" :data-ref="passageLabel(passage)">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 v-if="passage.title" class="text-[15px] font-medium">{{ passage.title }}</h3>
      <NuxtLink :to="surahHref(passage.surah, passage.from)" class="text-[13px] tabular-nums text-brand underline" data-testid="k-passage-ref">{{ surah.name }} {{ passageLabel(passage) }}</NuxtLink>
      <span class="text-[12.5px] text-ink-2">{{ ayahCount(passage) }} {{ ayahCount(passage) === 1 ? "ayah" : "ayahs" }}</span>
    </div>
    <p v-if="passage.description" class="mt-1 text-[13.5px] text-ink-2">{{ passage.description }}</p>

    <button v-if="!open" type="button" class="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] md:min-h-9" aria-expanded="false" data-testid="k-passage-open" @click="open = true">
      <Icon name="lucide:chevron-down" size="14" />Show the {{ ayahCount(passage) }} ayahs
    </button>
    <template v-else>
      <p v-if="state === 'loading' || state === 'idle'" class="mt-3 text-[13px] text-ink-2" role="status">Loading the text…</p>
      <div v-else-if="state === 'offline' || state === 'failed'" class="mt-3 rounded-[10px] border border-dashed px-3 py-3 text-[13.5px]" role="status" data-testid="k-passage-unavailable">
        {{ state === "offline" ? "This text isn’t on your device yet. Connect to load it." : "Couldn’t load this text." }}
        <button type="button" class="ml-2 inline-flex min-h-11 items-center text-brand underline md:min-h-8" data-testid="k-passage-retry" @click="state = 'idle'; load()">Try again</button>
      </div>
      <div v-else class="mt-2" data-testid="k-passage-text">
        <article v-for="a in ayahs" :key="a" class="border-t py-3 first:border-t-0" :class="player.ayahActive(passage.surah, a) ? 'ayah-playing' : ''" :data-ayah="a" data-testid="k-ayah">
          <p class="ar text-right" lang="ar" dir="rtl">{{ arabicOf(a) }}<span class="verse-mark" aria-hidden="true">{{ a }}</span></p>
          <p v-if="lang && translationOf(a)" class="mt-2 max-w-[640px] text-[14.5px] text-ink-2" :lang="lang === 'arabic2' ? 'ar' : lang === 'urdu' ? 'ur' : lang === 'bengali' ? 'bn' : 'en'" :dir="rtl ? 'rtl' : 'ltr'" :style="rtl ? 'text-align: right; margin-left: auto' : ''" data-testid="k-translation">{{ translationOf(a) }}</p>
          <div class="mt-1 flex items-center gap-1 text-ink-2">
            <span class="text-[12.5px] tabular-nums">{{ passage.surah }}:{{ a }}</span>
            <span class="flex-1" />
            <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[12.5px] hover:bg-sunken md:min-h-9" :aria-label="`Play ${surah.name} ${passage.surah}:${a}`" data-testid="k-play-ayah" @click="play(a)"><Icon name="lucide:play" size="14" />Play</button>
            <NuxtLink :to="surahHref(passage.surah, a)" class="inline-flex min-h-11 items-center rounded-full px-3 text-[12.5px] hover:bg-sunken md:min-h-9" :aria-label="`Open ${passage.surah}:${a} in the reader`" data-testid="k-open-ayah">Open in reader</NuxtLink>
          </div>
        </article>
      </div>
    </template>
  </li>
</template>

<style scoped>
.verse-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-inline-start: 10px;
  border: 1px solid var(--gold);
  border-radius: 9999px;
  font-family: var(--font-sans);
  font-size: 11.5px;
  line-height: 1;
  vertical-align: middle;
  color: var(--ink-2);
}
.ayah-playing {
  background: var(--accent-soft);
  border-radius: 8px;
  box-shadow: inset 3px 0 0 var(--accent);
}
</style>
