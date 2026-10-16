<script setup lang="ts">
// Surah reader (prototype d-page-reader / m-page-reader). Offline level B: a surah and an ayah's tafsir work offline once they
// have been opened. See docs/phases/phase-04a-surah-reader.md. The full player (seeking, resume, per-ayah audio) is Phase 4B.
import { onBeforeUnmount } from "vue";
import type { TafsirPanelState } from "~/components/reader/AyahList.vue";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, ayahBookmarkKey, bookmarkAddedAt, listBookmarks, removeBookmark } from "~/lib/bookmarks";
import { bismillahFrom, ChapterError, parseAyahHash, parseSurahParam, showsBismillah, type Chapter } from "~/lib/chapter";
import { readReadingPin, writeReadingPin, type ReadingPin } from "~/lib/pins";
import { TAFSIR_AUTHORS } from "~/lib/preferences";
import { recordAyahsRead } from "~/lib/goalLog";
import { readReaderPrefs, readerTranslation, setTranslationOff, type ReaderPrefs } from "~/lib/readerPrefs";
import { writeProgress } from "~/lib/readingProgress";
import { currentAyah, LINE, PROGRESS_DEBOUNCE_MS, ReadingTracker } from "~/lib/readingTracker";
import { markRead, markUnread, readCompleted } from "~/lib/readSurahs";
import { ayahReference, ayahShareText } from "~/lib/shareText";
import { reciterName } from "~/lib/surahAudio";

const route = useRoute();
const store = usePreferencesStore();
const player = usePlayerStore();
const undo = useUndoToast();
const text = useQuranText();

const surahNo = computed(() => parseSurahParam(route.params.id));
const status = ref<"loading" | "ready" | "error" | "notfound">("loading");
const errorMessage = ref("");
const chapter = shallowRef<Chapter | null>(null);
const bismillah = ref<string | null>(null);
// "loading" reserves the line's height so the text does not jump when it arrives; "none" (offline, never loaded) removes it
const bismillahState = ref<"none" | "loading" | "ready">("none");
const highlight = ref<number | null>(null);

useSeoMeta({
  title: () => (chapter.value ? `${chapter.value.name} (${chapter.value.en}) · Quran App` : "Surah · Quran App"),
  description: () => (chapter.value ? `Read Surah ${chapter.value.name}, ${chapter.value.en}: ${chapter.value.total} ayahs, with translation and tafsir.` : "Read a surah of the Quran."),
});

// ---- preferences
const readerPrefs = ref<ReaderPrefs>({});
const translation = computed(() => readerTranslation(store.prefs, readerPrefs.value));
const defaultAuthor = computed(() => store.prefs.tafsirAuthor ?? TAFSIR_AUTHORS[0]);
const reciter = computed(() => reciterName(store.prefs.reciter));

function onTranslation(v: string) {
  if (v === "off") {
    setTranslationOff(true);
    readerPrefs.value = { translation: "off" };
    return;
  }
  setTranslationOff(false);
  readerPrefs.value = {};
  store.set("translationLang", v as never); // the legacy key, as the legacy reader and Settings write it
}
const onTafsirDefault = (v: string) => store.set("tafsirAuthor", v as never);

// ---- loading
const offlineMessage = "This surah isn’t saved on this device yet. Connect once to read it.";
const failedMessage = "Couldn’t load this surah. Check your connection and try again.";

async function load() {
  stopTracking();
  panels.value = {};
  const n = surahNo.value;
  chapter.value = null;
  bismillah.value = null;
  bismillahState.value = "none";
  if (n === null) {
    status.value = "notfound";
    return;
  }
  status.value = "loading";
  try {
    const { value } = await text.getChapter(n);
    if (surahNo.value !== n) return; // another surah was opened meanwhile
    chapter.value = value;
    bismillahState.value = showsBismillah(n) ? "loading" : "none";
    status.value = "ready";
  } catch (e) {
    if (surahNo.value !== n) return;
    const kind = e instanceof ChapterError ? e.kind : "unavailable";
    errorMessage.value = kind === "unavailable" && typeof navigator !== "undefined" && navigator.onLine === false ? offlineMessage : failedMessage;
    status.value = "error";
    return;
  }
  if (showsBismillah(n)) {
    // The bismillah comes from the data of surah 1; when that was never loaded (offline first visit) the line is left out.
    const settle = (text_: string | null) => {
      if (surahNo.value !== n) return;
      bismillah.value = text_;
      bismillahState.value = text_ ? "ready" : "none";
    };
    void text.getChapter(1).then((r) => settle(bismillahFrom(r.value))).catch(() => settle(null));
  }
  await nextTick();
  startTracking();
  await goToHash();
}

onMounted(() => {
  readerPrefs.value = readReaderPrefs();
  refreshSaved();
  pinned.value = pinOf(readReadingPin());
  completedSet.value = new Set(readCompleted().keys());
  void load();
});
watch(() => route.params.id, () => void load());
watch(() => route.hash, () => void goToHash());
onBeforeUnmount(() => {
  stopTracking();
  clearTimeout(flashTimer);
});

// ---- opening at an ayah (#ayah-N): after the text is rendered, scroll until the position is stable (rows below are
// laid out lazily, so the first position can be a little off), focus the ayah, and highlight it for a moment.
let flashTimer: ReturnType<typeof setTimeout> | undefined;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
async function goToHash() {
  const c = chapter.value;
  if (!c) return;
  const a = parseAyahHash(route.hash, c.total);
  if (!a) return;
  await nextTick();
  const el = document.getElementById(`ayah-${a}`);
  if (!el) return;
  let last = Number.NaN;
  for (let i = 0; i < 5; i++) {
    el.scrollIntoView({ block: "start" });
    await frame();
    await frame();
    const top = el.getBoundingClientRect().top;
    if (Math.abs(top - last) < 2) break;
    last = top;
  }
  el.focus({ preventScroll: true });
  highlight.value = a;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => (highlight.value = null), 1600);
}

// ---- tafsir
const panels = ref<Record<number, TafsirPanelState>>({});
const panelOf = (n: number): TafsirPanelState => (panels.value[n] ??= { open: false, author: null, status: "idle", entries: null, message: "" });

async function loadPanel(n: number) {
  const c = chapter.value;
  if (!c) return;
  const p = panelOf(n);
  p.status = "loading";
  try {
    const { value } = await text.getTafsir(c.n, n);
    p.entries = value;
    p.status = "ready";
  } catch {
    p.status = "error";
    p.message = typeof navigator !== "undefined" && navigator.onLine === false ? "Tafsir for this ayah isn’t saved on this device. Connect to load it." : "Couldn’t load the tafsir. Check your connection and try again.";
  }
}
function onTafsir(n: number) {
  const p = panelOf(n);
  p.open = !p.open;
  if (p.open && !p.entries && p.status !== "loading") void loadPanel(n);
}
function onSource(n: number, author: string) {
  panelOf(n).author = author;
  store.set("tafsirAuthor", author as never); // legacy: choosing a source also sets the default
}
const onRetry = (n: number) => void loadPanel(n);

// ---- save (the legacy bookmark keys, with Undo)
const saved = ref<Set<number>>(new Set());
function refreshSaved() {
  const out = new Set<number>();
  for (const k of listBookmarks()) {
    const m = /^ayah:(\d+):(\d+)$/.exec(k);
    if (m && Number(m[1]) === surahNo.value) out.add(Number(m[2]));
  }
  saved.value = out;
}
function onSave(n: number) {
  const c = chapter.value;
  if (!c) return;
  const key = ayahBookmarkKey(c.n, n);
  if (saved.value.has(n)) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshSaved();
    undo.withUndo(`Removed ${c.name} ${c.n}:${n} from saved`, () => {
      addBookmark(key, when);
      refreshSaved();
    });
  } else {
    addBookmark(key);
    refreshSaved();
  }
}

// ---- pin ("where I stopped")
const pinned = ref<number | null>(null);
const pinOf = (p: ReadingPin | null) => (p && p.surahNo === surahNo.value ? p.ayahNo : null);
function onPin(n: number) {
  const c = chapter.value;
  if (!c) return;
  const before = readReadingPin();
  if (pinned.value === n) {
    writeReadingPin(null);
    pinned.value = null;
    undo.withUndo("Unpinned", () => {
      writeReadingPin(before);
      pinned.value = pinOf(before);
    });
    return;
  }
  writeReadingPin({ surahNo: c.n, ayahNo: n, pinnedAt: Date.now() });
  pinned.value = n;
  undo.withUndo(`Pinned ${c.name} ${c.n}:${n} as where you stopped`, () => {
    writeReadingPin(before);
    pinned.value = pinOf(before);
  });
}

// ---- share: Web Share, else copy with a short message
async function onShare(n: number) {
  const c = chapter.value;
  if (!c) return;
  const tr = translation.value;
  const trText = tr === "english" ? c.english[n - 1] : tr === "urdu" ? c.urdu[n - 1] : tr === "bengali" ? c.bengali[n - 1] : tr === "arabic2" ? c.arabic2[n - 1] : null;
  const body = ayahShareText({ arabic: c.arabic1[n - 1]!, translation: trText ?? null, name: c.name, surah: c.n, ayah: n });
  const url = `${window.location.origin}/surah/${c.n}#ayah-${n}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: ayahReference({ name: c.name, surah: c.n, ayah: n }), text: body, url });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) undo.info("Could not open the share sheet");
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${body}\n${url}`);
    undo.info("Copied");
  } catch {
    undo.info("Could not copy. Select the text and copy it by hand.");
  }
}

// ---- audio (the Phase 3 player: play and pause the surah)
const active = computed(() => player.nowPlaying?.surahNo === chapter.value?.n && (player.playing || player.loading));
function onPlay() {
  const c = chapter.value;
  if (!c) return;
  if (active.value) return player.pause();
  void player.playSurah({ surahNo: c.n, title: c.name, reciter: reciter.value, rate: store.prefs.playbackRate });
}
function onReciter(name: string) {
  if (name === reciter.value) return;
  store.set("reciter", { reciter: name });
  const np = player.nowPlaying;
  if (np && (player.playing || player.loading)) void player.playSurah({ surahNo: np.surahNo, title: np.title, reciter: name, rate: store.prefs.playbackRate });
}
const playerError = computed(() => (player.error && player.nowPlaying?.surahNo === chapter.value?.n ? player.error : null));

// ---- completed (the new marker)
const completedSet = ref<Set<number>>(new Set());
const completed = computed(() => (chapter.value ? completedSet.value.has(chapter.value.n) : false));
function setCompleted(n: number, name: string, on: boolean, announce: boolean) {
  if (on) markRead(n);
  else markUnread(n);
  completedSet.value = new Set(readCompleted().keys());
  if (announce) undo.withUndo(on ? `Marked ${name} as read` : `Marked ${name} as not read`, () => setCompleted(n, name, !on, false));
}
const onToggleRead = () => chapter.value && setCompleted(chapter.value.n, chapter.value.name, !completed.value, true);

// ---- reading position, the daily log and automatic completion (rules in lib/readingTracker.ts)
let tracker: ReadingTracker | null = null;
let io: IntersectionObserver | null = null;
let tickTimer: ReturnType<typeof setInterval> | undefined;
let scrollTimer: ReturnType<typeof setTimeout> | undefined;
let rows: HTMLElement[] = [];
let lastCurrent = 1;
const visibleNow = new Set<number>();
const now = () => performance.now(); // not Date: the page's clock may be fixed or changed while reading

function checkProgress() {
  const c = chapter.value;
  if (!c || !tracker) return;
  const current = currentAyah(
    rows.map((r) => r.getBoundingClientRect().top),
    window.innerHeight * LINE,
  );
  if (tracker.shouldWriteProgress(current)) writeProgress(c, current);
  // On a short surah the page cannot scroll far enough for the last ayah to reach the 35% line, so "the end" also means the
  // last ayah on screen with the page scrolled to its bottom.
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  lastCurrent = visibleNow.has(c.total) && atBottom ? c.total : current;
  maybeComplete();
}
function maybeComplete() {
  const c = chapter.value;
  if (c && tracker?.isComplete(lastCurrent) && !completedSet.value.has(c.n)) setCompleted(c.n, c.name, true, true);
}
const onScroll = () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(checkProgress, PROGRESS_DEBOUNCE_MS);
};
const onVisibility = () => {
  if (!tracker) return;
  if (document.visibilityState === "hidden") tracker.pause(now());
  else tracker.resume([...visibleNow], now());
};

function startTracking() {
  stopTracking();
  const c = chapter.value;
  if (!c || typeof IntersectionObserver === "undefined") return;
  tracker = new ReadingTracker(c.total);
  rows = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="ayah-list"] article[data-n]'));
  io = new IntersectionObserver((entries) => {
    const t = now();
    for (const e of entries) {
      const n = Number((e.target as HTMLElement).dataset.n);
      if (e.isIntersecting) {
        visibleNow.add(n);
        tracker?.show(n, t);
      } else {
        visibleNow.delete(n);
        tracker?.hide(n, t);
      }
    }
  });
  rows.forEach((r) => io!.observe(r));
  tickTimer = setInterval(() => {
    const fresh = tracker?.tick(now()) ?? [];
    if (fresh.length) {
      recordAyahsRead(fresh.map((a) => `${c.n}:${a}`));
      maybeComplete(); // the last ayah may only now have been on screen long enough
    }
  }, 500);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
}
function stopTracking() {
  io?.disconnect();
  io = null;
  clearInterval(tickTimer);
  clearTimeout(scrollTimer);
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("visibilitychange", onVisibility);
  tracker = null;
  lastCurrent = 1;
  rows = [];
  visibleNow.clear();
}

const prev = computed(() => (chapter.value && chapter.value.n > 1 ? SURAH_ROWS[chapter.value.n - 2]! : null));
const next = computed(() => (chapter.value && chapter.value.n < 114 ? SURAH_ROWS[chapter.value.n]! : null));
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <template v-if="status === 'notfound'">
      <h1 class="font-serif text-[24px] font-medium" data-testid="notfound-title">That surah doesn’t exist</h1>
      <p class="mt-2 text-ink-2">Surahs are numbered 1 to 114.</p>
      <p class="mt-4"><NuxtLink class="text-brand underline" to="/surah-listing">Go to the surah listing</NuxtLink></p>
    </template>

    <template v-else-if="status === 'error'">
      <h1 class="font-serif text-[24px] font-medium">Surah {{ surahNo }}</h1>
      <p class="mt-2 text-ink-2" role="status" data-testid="load-error">{{ errorMessage }}</p>
      <div class="mt-4 flex items-center gap-4">
        <Button class="min-h-11 md:min-h-9" data-testid="load-retry" @click="load()">Retry</Button>
        <NuxtLink class="text-brand underline" to="/surah-listing">Surah listing</NuxtLink>
      </div>
    </template>

    <template v-else-if="status === 'loading'">
      <h1 class="sr-only">Loading surah {{ surahNo }}</h1>
      <ReaderSkeleton />
    </template>

    <template v-else-if="chapter">
      <ReaderHeader
        :chapter="chapter"
        :translation="translation ?? 'off'"
        :tafsir-author="defaultAuthor"
        :reciter="reciter"
        :active="active"
        :completed="completed"
        @play="onPlay"
        @translation="onTranslation"
        @tafsir="onTafsirDefault"
        @reciter="onReciter"
        @toggle-read="onToggleRead"
      />
      <p v-if="playerError" class="mt-3 text-center text-[12.5px] text-destructive" role="status" data-testid="player-error">{{ playerError }}</p>

      <p v-if="bismillahState === 'ready'" class="ar py-6 text-center !text-[26px] md:!text-[30px]" lang="ar" dir="rtl" data-testid="bismillah">{{ bismillah }}</p>
      <div v-else-if="bismillahState === 'loading'" class="h-[132px] md:h-[150px]" aria-hidden="true" />

      <ReaderAyahList
        :chapter="chapter"
        :order="store.prefs.verseLayout"
        :translation="translation"
        :panels="panels"
        :saved="saved"
        :pinned="pinned"
        :default-author="defaultAuthor"
        :highlight="highlight"
        @tafsir="onTafsir"
        @source="onSource"
        @retry="onRetry"
        @save="onSave"
        @pin="onPin"
        @share="onShare"
      />

      <nav class="flex justify-between gap-4 px-1 pt-6 text-[13px]" aria-label="Previous and next surah" data-testid="reader-nav">
        <NuxtLink v-if="prev" :to="`/surah/${prev.n}`" class="inline-flex min-h-11 items-center font-medium text-brand" data-testid="prev-surah">‹ {{ prev.name }}</NuxtLink>
        <span v-else class="inline-flex min-h-11 items-center text-ink-2">‹ Previous surah</span>
        <NuxtLink v-if="next" :to="`/surah/${next.n}`" class="inline-flex min-h-11 items-center font-medium text-brand" data-testid="next-surah">{{ next.name }} ›</NuxtLink>
        <span v-else class="inline-flex min-h-11 items-center text-ink-2">Next surah ›</span>
      </nav>
    </template>
  </section>
</template>
