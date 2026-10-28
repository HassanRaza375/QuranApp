<script setup lang="ts">
// A Hifz session (Phase 14; prototype `session`): a queue of one-screen steps. Today's plan, "Recite to someone" (`?mode=check`: nothing hidden, a
// listener taps the slips), "Check the whole surah" (`?mode=full&target=<id>`: every started ayah, then each join, all graded) and free practice
// (`?mode=free&surah=&from=&to=`: any ayahs, nothing recorded at all). The text comes from the reader's cache or the network, never typed here.
// Offline: a surah whose text is not on the device shows a plain message with Try again and Skip, never a blank page. See docs/pages/hifz.md.
import type { Recitation } from "~/lib/hifz/grading";
import { surahLabel } from "~/lib/hifz/queue";
import { currentItem, summary, type SessionItem } from "~/lib/hifz/session";
import { ayahKey, trickyIn } from "~/lib/hifz/slips";
import { splitWords } from "~/lib/hifz/words";

useSeoMeta({ title: "Hifz session · Quran App", robots: "noindex" });

const store = useHifzStore();
const route = useRoute();
const text = useQuranText();

const mode = computed(() => (typeof route.query.mode === "string" ? route.query.mode : "daily"));
const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);
const phase = ref<"starting" | "ready" | "empty">("starting");
const slippedWords = ref<string[]>([]);

function begin() {
  store.load();
  const q = route.query;
  const resumable = store.resumable;
  let s = null;
  if (mode.value === "free") {
    const surah = num(q.surah) ?? 1;
    const max = store.ayahsIn(surah) || 1;
    const from = Math.min(Math.max(num(q.from) ?? 1, 1), max);
    const to = Math.min(Math.max(num(q.to) ?? max, from), max);
    s = store.startFree(surah, from, to);
  } else if (q.resume) {
    s = store.resume();
  } else if (mode.value === "check") {
    const surah = num(q.surah);
    s = resumable?.mode === "check" && !surah ? store.resume() : store.startCheck(surah);
  } else if (mode.value === "full") {
    const id = typeof q.target === "string" ? q.target : "";
    s = resumable?.kind === "assessment" && resumable.targetIds[0] === id ? store.resume() : store.targetOf(id) ? store.startFull(id) : null;
  } else {
    s = resumable?.kind === "daily" && !resumable.mode ? store.resume() : store.startDaily();
  }
  phase.value = s ? "ready" : "empty";
}
onMounted(begin);
onBeforeUnmount(() => store.endFree());

// ---- the step on screen
const session = computed(() => store.session);
const item = computed(() => currentItem(session.value));
const completed = computed(() => session.value?.status === "completed");
const check = computed(() => session.value?.mode === "check");
const free = computed(() => store.running === "free");
const surahOf = (it: SessionItem): number | null => store.targetOf(it.targetId)?.surahNo ?? (it.targetId.startsWith("free:") ? Number(it.targetId.slice(5)) : null);
const startAyahOf = (it: SessionItem) => store.targetOf(it.targetId)?.startAyah ?? 1;

interface Loaded {
  key: string;
  words: string[];
  prev: string[] | null;
  /** for a join: the ayah it starts from */
  fromWords: string[];
}
const loaded = ref<Loaded | null>(null);
const failure = ref<string | null>(null);

async function loadItem() {
  const it = item.value;
  loaded.value = null;
  failure.value = null;
  if (!it) return;
  store.beginItem();
  const surah = surahOf(it);
  if (surah == null) return store.skip(); // the surah was removed while the session was open
  try {
    const { value: chapter } = await text.getChapter(surah);
    if (item.value?.id !== it.id) return; // the step changed while the text was loading
    const ayah = it.ayahNo ?? it.toAyah ?? 1;
    const wordsOf = (n: number) => splitWords(chapter.arabic1[n - 1] ?? "");
    loaded.value = { key: it.id, words: wordsOf(ayah), prev: ayah > 1 ? wordsOf(ayah - 1) : null, fromWords: it.fromAyah != null ? wordsOf(it.fromAyah) : [] };
  } catch {
    if (item.value?.id === it.id) failure.value = "This surah’s text isn’t on this device yet. Connect once to load it, then try again.";
  }
}
watch(() => item.value?.id, loadItem, { immediate: false });
watch(phase, (p) => p === "ready" && loadItem());

const kind = computed(() => {
  const it = item.value;
  if (!it) return null;
  if (it.fromAyah != null) return "join";
  return it.type === "new" ? "learn" : "review";
});
const tag = computed(() => {
  const it = item.value;
  if (!it) return { label: "", cls: "" };
  if (it.type === "weak-ayah" || it.type === "weak-transition") return { label: "Tricky", cls: "bg-weak/15 text-weak" };
  if (it.type === "new") return { label: "New", cls: "bg-accent text-brand" };
  if (it.fromAyah != null) return { label: "Join", cls: "bg-accent text-brand" };
  return { label: "Review", cls: "bg-sunken text-ink-2" };
});
const where = computed(() => {
  const it = item.value;
  const s = it && surahOf(it);
  if (!it || !s) return "";
  return it.fromAyah != null ? `${surahLabel(s)} ${s}:${it.fromAyah}–${it.toAyah}` : `${surahLabel(s)} ${s}:${it.ayahNo}`;
});
const title = computed(() => (free.value ? "Free practice" : check.value ? "Recite to someone" : session.value?.kind === "assessment" ? "Check the whole surah" : `${(session.value?.currentIndex ?? 0) + 1} of ${session.value?.items.length ?? 0}`));
const pct = computed(() => (session.value?.items.length ? Math.round(((session.value.currentIndex) / session.value.items.length) * 100) : 0));
const tricky = computed(() => {
  const it = item.value;
  const l = loaded.value;
  const s = it && surahOf(it);
  if (!it || !l || !s || free.value || it.ayahNo == null) return [];
  return trickyIn(store.words, ayahKey(s, it.ayahNo), l.words);
});

function ayahDone(rec: Recitation) {
  const l = loaded.value;
  if (!l) return;
  if (!free.value) slippedWords.value.push(...rec.slips.map((i) => l.words[i]).filter((w): w is string => !!w));
  store.finishAyah(rec, l.words);
}
function joinDone(said: boolean) {
  store.finishJoin(said);
}

const done = computed(() => (session.value ? summary(session.value) : null));
const skippable = computed(() => !!item.value && !completed.value);
const doneTitle = computed(() => (free.value ? "Free practice done" : session.value?.kind === "assessment" ? "Check done" : "Done for today"));
const practised = computed(() => (free.value ? (session.value?.items.length ?? 0) : (done.value?.practised ?? 0)));
</script>

<template>
  <section class="mx-auto max-w-[640px]" data-testid="hifz-session">
    <p v-if="phase === 'starting'" class="py-10 text-center text-[14px] text-ink-2" role="status">Getting your session ready…</p>

    <div v-else-if="phase === 'empty'" class="py-10 text-center" data-testid="hifz-session-empty">
      <h1 class="font-serif text-[26px] font-medium">{{ mode === "free" ? "Nothing to practise" : "You’re caught up" }}</h1>
      <p class="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-2">
        <template v-if="mode === 'check'">Nothing is due in your surahs, so there is nothing to recite to someone today. “Check the whole surah” on a surah’s page goes through everything you have learned.</template>
        <template v-else-if="mode === 'full'">That surah has no ayahs started yet.</template>
        <template v-else-if="!store.surahs.length">Add a surah first, then your plan for the day appears here.</template>
        <template v-else>Nothing is due today. Your next ayahs come back when their time comes.</template>
      </p>
      <Button as-child class="mt-6 h-12 min-h-12 px-8"><NuxtLink to="/hifz">Back to Hifz</NuxtLink></Button>
    </div>

    <HifzDone v-else-if="completed && done" :practised="practised" :need-another="done.slipped" :slipped="slippedWords" :free="free" :title="doneTitle" />

    <template v-else-if="item">
      <div class="mb-3 flex items-center gap-2">
        <NuxtLink to="/hifz" class="grid size-11 place-items-center rounded-lg text-ink-2 hover:bg-accent" aria-label="Leave the session (your place is kept)" data-testid="hifz-leave"><Icon name="lucide:x" size="18" /></NuxtLink>
        <h1 class="flex-1 text-center font-serif text-[18px] font-medium" data-testid="hifz-title">{{ title }}</h1>
        <Button variant="ghost" class="min-h-11" :disabled="!skippable" data-testid="hifz-skip" @click="store.skip()">Skip</Button>
      </div>
      <div class="mb-7 h-1 overflow-hidden rounded-full bg-sunken" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Session progress" data-testid="hifz-progress"><div class="h-full bg-brand transition-all" :style="{ width: `${pct}%` }" /></div>

      <div class="mb-2 flex items-center justify-center gap-2">
        <span class="inline-flex h-[22px] items-center rounded px-2 text-[12px]" :class="tag.cls" data-testid="hifz-tag">{{ tag.label }}</span>
        <span class="text-[13px] text-ink-2" data-testid="hifz-where">{{ where }}</span>
      </div>

      <div v-if="failure" class="mt-6 rounded-[10px] border border-dashed px-4 py-6 text-center" role="status" data-testid="hifz-text-missing">
        <p class="text-[14.5px]">{{ failure }}</p>
        <div class="mt-4 flex justify-center gap-2.5">
          <Button variant="outline" class="min-h-11" data-testid="hifz-retry" @click="loadItem">Try again</Button>
          <Button variant="ghost" class="min-h-11" @click="store.skip()">Skip this step</Button>
        </div>
      </div>
      <p v-else-if="!loaded" class="py-10 text-center text-[14px] text-ink-2" role="status">Loading the text…</p>

      <template v-else>
        <HifzJoin v-if="kind === 'join'" :key="item.id" :from="item.fromAyah!" :to="item.toAyah!" :from-words="loaded.fromWords" @said="joinDone" />
        <HifzLearn v-else-if="kind === 'learn'" :key="item.id" :surah="surahOf(item)!" :ayah="item.ayahNo!" :start-ayah="startAyahOf(item)" :words="loaded.words" :prev="loaded.prev" :tricky="tricky" @done="ayahDone" />
        <HifzReview v-else :key="item.id" :words="loaded.words" :prev="loaded.prev" :check="check" :free="free" :tricky="tricky" @done="ayahDone" />
      </template>
    </template>
  </section>
</template>
