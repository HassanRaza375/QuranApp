<script setup lang="ts">
// The ayahs of one surah. Plain elements and one delegated click handler (Phase 3 measured why: Al-Baqarah has 286 rows).
// Every control is a real <button> with a name; the text and the order follow the reader preferences.
import type { Chapter, TafsirEntry } from "~/lib/chapter";
import { tafsirHtml } from "~/lib/tafsirHtml";
import { TAFSIR_AUTHORS, type TranslationLang } from "~/lib/preferences";
import { ICONS } from "./icons";

export interface TafsirPanelState {
  open: boolean;
  author: string | null;
  status: "idle" | "loading" | "ready" | "error";
  entries: TafsirEntry[] | null;
  message: string;
}

const props = defineProps<{
  chapter: Chapter;
  order: "ar" | "tr";
  translation: TranslationLang | null;
  panels: Record<number, TafsirPanelState>;
  saved: Set<number>;
  pinned: number | null;
  defaultAuthor: string;
  highlight: number | null;
}>();

const emit = defineEmits<{
  tafsir: [n: number];
  source: [n: number, author: string];
  retry: [n: number];
  save: [n: number];
  pin: [n: number];
  share: [n: number];
}>();

const texts = computed(() => (props.translation === "english" ? props.chapter.english : props.translation === "urdu" ? props.chapter.urdu : props.translation === "bengali" ? props.chapter.bengali : props.translation === "arabic2" ? props.chapter.arabic2 : null));
const trLang = computed(() => ({ english: "en", urdu: "ur", bengali: "bn", arabic2: "ar" })[props.translation ?? "english"]);
const trRtl = computed(() => props.translation === "urdu" || props.translation === "arabic2");
const trClass = computed(() => (props.translation === "urdu" ? "ur" : props.translation === "bengali" ? "bn" : props.translation === "arabic2" ? "ar !text-[22px] !leading-[2]" : "font-serif text-[16.5px] leading-[1.65]"));

const authorOf = (n: number) => props.panels[n]?.author ?? props.defaultAuthor;
const entryOf = (n: number) => props.panels[n]?.entries?.find((e) => e.author === authorOf(n)) ?? null;

const onClick = (e: MouseEvent) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!el) return;
  const n = Number(el.dataset.n);
  switch (el.dataset.act) {
    case "tafsir": return emit("tafsir", n);
    case "source": return emit("source", n, el.dataset.author!);
    case "retry": return emit("retry", n);
    case "save": return emit("save", n);
    case "pin": return emit("pin", n);
    case "share": return emit("share", n);
  }
};
</script>

<template>
  <div data-testid="ayah-list" @click="onClick">
    <article
      v-for="n in chapter.total"
      :id="`ayah-${n}`"
      :key="n"
      tabindex="-1"
      class="ayah-row scroll-mt-20 border-b px-1 py-7 outline-none md:px-4 md:py-9"
      :class="highlight === n ? 'flash' : ''"
      :aria-label="`Ayah ${n}`"
      :data-n="n"
      :data-testid="`ayah-${n}`"
    >
      <template v-if="order === 'ar'">
        <p class="ar mb-3 text-right" lang="ar" dir="rtl" data-testid="ayah-arabic">
          {{ chapter.arabic1[n - 1] }}<span class="verse-mark" aria-hidden="true">{{ n }}</span>
        </p>
        <p v-if="texts" :class="trClass" class="mb-4 max-w-[600px] text-ink-2" :lang="trLang" :dir="trRtl ? 'rtl' : 'ltr'" :style="trRtl ? 'text-align: right; margin-left: auto' : ''" data-testid="ayah-translation">{{ texts[n - 1] }}</p>
      </template>
      <template v-else>
        <p v-if="texts" :class="trClass" class="mb-4 max-w-[600px] text-ink-2" :lang="trLang" :dir="trRtl ? 'rtl' : 'ltr'" :style="trRtl ? 'text-align: right; margin-left: auto' : ''" data-testid="ayah-translation">{{ texts[n - 1] }}</p>
        <p class="ar mb-3 text-right" lang="ar" dir="rtl" data-testid="ayah-arabic">
          {{ chapter.arabic1[n - 1] }}<span class="verse-mark" aria-hidden="true">{{ n }}</span>
        </p>
      </template>

      <div class="flex items-center gap-0.5 text-ink-2">
        <button
          type="button"
          class="tool inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[12.5px] hover:bg-sunken md:min-h-9"
          :class="panels[n]?.open ? 'bg-accent text-brand' : ''"
          :aria-expanded="!!panels[n]?.open"
          :aria-controls="`tafsir-${n}`"
          :aria-label="`${panels[n]?.open ? 'Hide' : 'Show'} tafsir for ayah ${n}`"
          data-act="tafsir"
          :data-n="n"
          data-testid="tafsir-toggle"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg viewBox="0 0 24 24" class="pointer-events-none size-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.book" />
          Tafsir
        </button>
        <span class="flex-1" />
        <button
          type="button"
          class="tool inline-flex size-11 items-center justify-center rounded-full hover:bg-sunken md:size-9"
          :class="saved.has(n) ? 'text-brand' : ''"
          :aria-pressed="saved.has(n)"
          :aria-label="saved.has(n) ? `Remove ayah ${n} from saved` : `Save ayah ${n}`"
          data-act="save"
          :data-n="n"
          data-testid="ayah-save"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg viewBox="0 0 24 24" class="pointer-events-none size-[18px]" aria-hidden="true" :fill="saved.has(n) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.star" />
        </button>
        <button
          type="button"
          class="tool inline-flex size-11 items-center justify-center rounded-full hover:bg-sunken md:size-9"
          :class="pinned === n ? 'bg-accent text-brand' : ''"
          :aria-pressed="pinned === n"
          :aria-label="pinned === n ? `Unpin ayah ${n}` : `Pin ayah ${n} as where you stopped`"
          data-act="pin"
          :data-n="n"
          data-testid="ayah-pin"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg viewBox="0 0 24 24" class="pointer-events-none size-[18px]" aria-hidden="true" :fill="pinned === n ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.pin" />
        </button>
        <button
          type="button"
          class="tool inline-flex size-11 items-center justify-center rounded-full hover:bg-sunken md:size-9"
          :aria-label="`Share ayah ${n}`"
          data-act="share"
          :data-n="n"
          data-testid="ayah-share"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg viewBox="0 0 24 24" class="pointer-events-none size-[18px]" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.share" />
        </button>
      </div>

      <section v-if="panels[n]?.open" :id="`tafsir-${n}`" class="mt-3 rounded-lg bg-sunken px-4 py-3" :aria-label="`Tafsir of ayah ${n}`" data-testid="tafsir-panel">
        <div role="group" aria-label="Tafsir source" class="mb-3 flex flex-wrap gap-1.5">
          <button
            v-for="a in TAFSIR_AUTHORS"
            :key="a"
            type="button"
            class="min-h-11 rounded-full border px-3 text-[12.5px] md:min-h-8"
            :class="authorOf(n) === a ? 'border-brand bg-accent font-medium text-brand' : 'text-ink-2'"
            :aria-pressed="authorOf(n) === a"
            data-act="source"
            :data-n="n"
            :data-author="a"
            data-testid="tafsir-source"
          >
            {{ a }}
          </button>
        </div>
        <p v-if="panels[n]!.status === 'loading'" class="py-2 text-[13px] text-ink-2" role="status" data-testid="tafsir-loading">Loading the tafsir…</p>
        <div v-else-if="panels[n]!.status === 'error'" role="status" data-testid="tafsir-error">
          <p class="text-[13.5px] text-destructive">{{ panels[n]!.message }}</p>
          <button type="button" class="mt-2 min-h-11 rounded-md border px-3 text-[13px] md:min-h-8" data-act="retry" :data-n="n" data-testid="tafsir-retry">Retry</button>
        </div>
        <template v-else-if="panels[n]!.status === 'ready'">
          <p v-if="entryOf(n)?.groupVerse" class="mb-2 text-[12.5px] text-ink-2" data-testid="tafsir-group">{{ entryOf(n)!.groupVerse }}</p>
          <!-- Safe: the renderer escapes the third-party text first and adds only its own fixed tags (tests/reader.test.ts). -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="entryOf(n)" class="tafsir-body font-serif text-[14.5px] leading-[1.7] text-ink-2" data-testid="tafsir-text" v-html="tafsirHtml(entryOf(n)!.content)" />
          <p v-else class="text-[13.5px] text-ink-2" data-testid="tafsir-none">{{ authorOf(n) }} has no text for this ayah.</p>
          <p class="mt-2 text-[12px] text-ink-2" data-testid="tafsir-source-line">{{ authorOf(n) }}</p>
        </template>
        <p class="mt-3 border-t pt-2 text-[12px] text-ink-2" data-testid="tafsir-jafari-note">No Ja’fari tafsir is available from this app’s data provider.</p>
      </section>
    </article>
  </div>
</template>

<style scoped>
.ayah-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 230px;
}
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
.flash {
  background: var(--accent-soft);
  border-radius: 8px;
}
.tafsir-body :deep(p) {
  margin: 0 0 0.75em;
}
.tafsir-body :deep(.tafsir-heading) {
  font-weight: 600;
  margin: 0.8em 0 0.4em;
}
</style>
