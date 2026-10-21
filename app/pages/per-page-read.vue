<script setup lang="ts">
// Per-page reader (prototype d-page-mushaf / m-page-mushaf). The page's ayahs come from the generated page starts; the text is the surah
// reader's cached text (quran-revamp-db `chapters`), so it works offline for any surah opened once. Flowing text, not mushaf lines.
// Opening a page does not write reading progress (docs/phases/phase-09a-per-page.md). See also docs/pages/per-page-read.md.
import type { FrameSegment } from "~/components/perpage/Frame.vue";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, bookmarkAddedAt, hasBookmark, pageBookmarkKey, removeBookmark } from "~/lib/bookmarks";
import { bismillahFrom, ChapterError, type Chapter } from "~/lib/chapter";
import { firstAyahOf, GO_TO_ERROR, isPageNumber, juzLine, PAGE_FAILED, PAGE_NOTE, PAGE_OFFLINE, pageSegments, parseGoTo, parsePageParam, PLAY_REASON, surahNamesLine } from "~/lib/pageReader";
import { readPagePin, writePagePin, type PagePin } from "~/lib/pins";
import { ARABIC_SCALE } from "~/lib/preferences";
import { TOTAL_PAGES } from "~/lib/quranMeta";

const route = useRoute();
const router = useRouter();
const store = usePreferencesStore();
const undo = useUndoToast();
const text = useQuranText();

const param = computed(() => parsePageParam(route.query.page));
const page = computed(() => param.value.page);
const status = ref<"loading" | "ready" | "error">("loading");
const errorMessage = ref("");
const segments = shallowRef<FrameSegment[]>([]);
const bismillah = ref<string | null>(null);
const bismillahState = ref<"none" | "loading" | "ready">("none");
const live = ref("");
const heading = ref<HTMLElement | null>(null);

useSeoMeta({ title: () => `Page ${page.value} · Quran App`, description: "Read the Qur’an one page at a time.", robots: "noindex" });

const juz = computed(() => juzLine(page.value));
const names = computed(() => surahNamesLine(page.value));
const first = computed(() => firstAyahOf(page.value));
const firstName = computed(() => (first.value ? SURAH_ROWS[first.value.surah - 1]!.name : ""));

// ---- loading (the surah reader's cache first, then the network)
let focusTitle = false; // focus the title after Previous, Next or Go (not on the first load, and not from the slider, which keeps focus so it can be adjusted again)
let token = 0;
async function load() {
  const my = ++token;
  const p = page.value;
  const segs = pageSegments(p)!;
  status.value = "loading";
  bismillah.value = null;
  bismillahState.value = "none";
  try {
    const chapters = await Promise.all(segs.map((g) => text.getChapter(g.surah)));
    if (my !== token) return;
    segments.value = segs.map((g, i) => {
      const c: Chapter = chapters[i]!.value;
      return { ...g, arLong: c.arLong || SURAH_ROWS[g.surah - 1]!.arLong, ayahs: c.arabic1.slice(g.from - 1, g.to) };
    });
    bismillahState.value = segs.some((g) => g.bismillah) ? "loading" : "none";
    status.value = "ready";
  } catch (e) {
    if (my !== token) return;
    const kind = e instanceof ChapterError ? e.kind : "unavailable";
    errorMessage.value = kind === "unavailable" && typeof navigator !== "undefined" && navigator.onLine === false ? PAGE_OFFLINE : PAGE_FAILED;
    status.value = "error";
    return;
  }
  live.value = `Page ${p} of ${TOTAL_PAGES}`;
  if (focusTitle) {
    focusTitle = false;
    await nextTick();
    heading.value?.focus({ preventScroll: false });
  }
  if (bismillahState.value === "loading") {
    // From the data of surah 1; when that was never loaded (offline, first visit) the line is left out, as in the surah reader.
    const settle = (t: string | null) => {
      if (my !== token) return;
      bismillah.value = t;
      bismillahState.value = t ? "ready" : "none";
    };
    void text.getChapter(1).then((r) => settle(bismillahFrom(r.value))).catch(() => settle(null));
  }
  // Quietly have the next page's surahs ready so Next does not stall where a page crosses into another surah.
  if (p < TOTAL_PAGES && navigator.onLine !== false) for (const g of pageSegments(p + 1)!) void text.getChapter(g.surah).catch(() => undefined);
}

// ---- moving between pages (the address follows; replace, so Back is not flooded)
function go(n: number, focus = true) {
  if (!isPageNumber(n)) return;
  focusTitle = focus;
  goError.value = "";
  void router.replace({ query: { ...route.query, page: String(n) } });
}
const goInput = ref("");
const goError = ref("");
function onGo() {
  const n = parseGoTo(goInput.value);
  if (n === null) {
    goError.value = GO_TO_ERROR;
    return;
  }
  goInput.value = "";
  go(n);
}
const sliderValue = ref(1);
watch(page, (p) => (sliderValue.value = p), { immediate: true });
const onSliderInput = (e: Event) => (sliderValue.value = Number((e.target as HTMLInputElement).value));
const onSliderChange = (e: Event) => go(Number((e.target as HTMLInputElement).value), false);

// ---- text size: the global Arabic size (the Settings slider writes the same value)
const scale = computed(() => store.prefs.arabicScale);
const bump = (d: number) => store.set("arabicScale", Math.round(Math.min(ARABIC_SCALE.max, Math.max(ARABIC_SCALE.min, scale.value + d)) * 10) / 10);
const atMin = computed(() => scale.value <= ARABIC_SCALE.min + 1e-9);
const atMax = computed(() => scale.value >= ARABIC_SCALE.max - 1e-9);

// ---- pin ("where I stopped" for pages: the Page slot of quran:pins:v1) and save (the legacy page:N bookmark), each with Undo
const pin = ref<PagePin | null>(null);
const pinned = computed(() => pin.value?.pageNo === page.value);
function onPin() {
  const before = readPagePin();
  if (pinned.value) {
    writePagePin(null);
    pin.value = null;
    undo.withUndo("Unpinned the page", () => {
      writePagePin(before);
      pin.value = readPagePin();
    });
    return;
  }
  writePagePin({ pageNo: page.value, pinnedAt: Date.now() });
  pin.value = readPagePin();
  undo.withUndo(`Pinned page ${page.value} as where you stopped`, () => {
    writePagePin(before);
    pin.value = readPagePin();
  });
}
const saved = ref(false);
const refreshSaved = () => (saved.value = hasBookmark(pageBookmarkKey(page.value)));
function onSave() {
  const key = pageBookmarkKey(page.value);
  const p = page.value;
  if (saved.value) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshSaved();
    undo.withUndo(`Removed page ${p} from saved`, () => {
      addBookmark(key, when);
      refreshSaved();
    });
  } else {
    addBookmark(key);
    refreshSaved();
    undo.withUndo(`Saved page ${p}`, () => {
      removeBookmark(key);
      refreshSaved();
    });
  }
}
watch(page, refreshSaved);

onMounted(() => {
  pin.value = readPagePin();
  refreshSaved();
  void load();
});
watch(page, () => void load());
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="per-page">
    <header class="text-center">
      <NuxtLink to="/surah-listing?tab=page" class="mb-2 inline-flex min-h-11 items-center text-[12.5px] text-ink-2 hover:text-foreground md:min-h-0" data-testid="back-link">‹ Pages</NuxtLink>
      <h1 ref="heading" tabindex="-1" class="font-serif text-[26px] font-medium outline-none md:text-[30px]" data-testid="per-page-title">Page {{ page }}</h1>
      <p class="mt-1 text-[13px] text-ink-2" data-testid="page-sub">Page {{ page }} of {{ TOTAL_PAGES }} · {{ juz }} · {{ names }}</p>
    </header>

    <p v-if="param.notice" class="mt-4 rounded-lg border border-dashed px-3 py-2 text-center text-[13.5px]" role="status" data-testid="page-notice">{{ param.notice }}</p>

    <div class="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Page tools">
      <Button variant="outline" class="min-h-11 min-w-11 rounded-full md:min-h-9 md:min-w-9" :disabled="atMin" aria-label="Smaller Arabic text" data-testid="text-smaller" @click="bump(-0.1)">A−</Button>
      <span class="w-10 text-center text-[12.5px] tabular-nums text-ink-2" data-testid="text-scale">{{ scale.toFixed(1) }}×</span>
      <Button variant="outline" class="min-h-11 min-w-11 rounded-full md:min-h-9 md:min-w-9" :disabled="atMax" aria-label="Larger Arabic text" data-testid="text-bigger" @click="bump(0.1)">A+</Button>
      <Button variant="outline" class="min-h-11 gap-1.5 rounded-full md:min-h-9" :aria-pressed="pinned" :class="pinned ? 'border-brand text-brand' : ''" data-testid="pin-page" @click="onPin">
        <Icon name="lucide:pin" size="15" />{{ pinned ? "Pinned" : "Pin page" }}
      </Button>
      <Button variant="outline" class="min-h-11 gap-1.5 rounded-full md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="save-page" @click="onSave">
        <Icon name="lucide:star" size="15" />{{ saved ? "Saved" : "Save" }}
      </Button>
      <Button variant="outline" class="min-h-11 gap-1.5 rounded-full md:min-h-9" aria-disabled="true" aria-describedby="play-reason" data-testid="play-page" @click.prevent>
        <Icon name="lucide:play" size="15" />Play page
      </Button>
    </div>
    <p id="play-reason" class="mt-1 text-center text-[12px] text-ink-2" data-testid="play-reason">{{ PLAY_REASON }}</p>

    <div class="mt-5">
      <div v-if="status === 'loading'" aria-busy="true" aria-label="Loading the page" data-testid="page-skeleton" class="rounded-[14px] border px-4 py-6">
        <Skeleton v-for="i in 6" :key="i" class="mb-4 ml-auto h-8" :class="i % 2 ? 'w-full' : 'w-4/5'" />
      </div>
      <div v-else-if="status === 'error'" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="page-error">
        <p class="text-[15px]" role="status" data-testid="load-error">{{ errorMessage }}</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="load-retry" @click="load()">Try again</Button>
      </div>
      <PerpageFrame v-else :page="page" :juz="juz" :names="names" :segments="segments" :bismillah="bismillah" :bismillah-state="bismillahState" />
    </div>

    <p class="mt-3 text-center text-[12.5px] text-ink-2" data-testid="page-note">{{ PAGE_NOTE }}</p>
    <p v-if="first" class="mt-2 text-center text-[13px]">
      <NuxtLink :to="`/surah/${first.surah}#ayah-${first.ayah}`" class="inline-flex min-h-11 items-center text-brand underline md:min-h-9" data-testid="open-in-reader">Open {{ firstName }} {{ first.surah }}:{{ first.ayah }} in the reader</NuxtLink>
    </p>

    <nav class="mt-4 border-t pt-4" aria-label="Pages" data-testid="page-nav">
      <div class="flex items-center gap-3">
        <Button variant="outline" class="min-h-11 shrink-0 md:min-h-9" :aria-disabled="page <= 1" aria-label="Previous page" data-testid="prev-page" @click="page > 1 && go(page - 1)"><Icon name="lucide:chevron-left" size="16" />Previous</Button>
        <input
          type="range"
          class="h-11 min-w-0 flex-1 accent-[var(--primary)]"
          min="1"
          :max="TOTAL_PAGES"
          step="1"
          :value="sliderValue"
          aria-label="Page"
          :aria-valuetext="`Page ${sliderValue} of ${TOTAL_PAGES}`"
          data-testid="page-slider"
          @input="onSliderInput"
          @change="onSliderChange"
        />
        <Button variant="outline" class="min-h-11 shrink-0 md:min-h-9" :aria-disabled="page >= TOTAL_PAGES" aria-label="Next page" data-testid="next-page" @click="page < TOTAL_PAGES && go(page + 1)">Next<Icon name="lucide:chevron-right" size="16" /></Button>
      </div>
      <form class="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px]" novalidate data-testid="go-form" @submit.prevent="onGo">
        <label for="go-to" class="text-ink-2">Go to page</label>
        <input
          id="go-to"
          v-model="goInput"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="h-11 w-24 rounded-md border bg-background px-3 text-center tabular-nums md:h-9"
          :aria-invalid="!!goError"
          aria-describedby="go-error"
          data-testid="go-input"
        />
        <span class="text-ink-2">of {{ TOTAL_PAGES }}</span>
        <Button type="submit" variant="outline" class="min-h-11 md:min-h-9" data-testid="go-button">Go</Button>
      </form>
      <p id="go-error" class="mt-1 min-h-5 text-center text-[12.5px] text-destructive" role="status" data-testid="go-error">{{ goError }}</p>
    </nav>

    <p class="sr-only" role="status" aria-live="polite" data-testid="page-live">{{ live }}</p>
  </section>
</template>
