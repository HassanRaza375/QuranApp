<script setup lang="ts">
// The Story reader (prototype d-page-story / m-page-story): one chapter per screen, a progress rail, Previous and Next, the Qur'an text
// from the cached surah, entity sheets, Compare tellings, and an end page. Chapters, labels and notices come from the story data
// (lib/stories.ts); progress is `quran:story-progress:v1` (lib/storyProgress.ts). See docs/phases/phase-07b-story.md.
import { onBeforeUnmount } from "vue";
import { addBookmark, bookmarkAddedAt, BOOKMARKS_KEY, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { surahHref } from "~/lib/readerLinks";
import {
  ARRANGED_NOTICE, chapterFromQuery, chapterQuery, chaptersOf, entitiesOf, hasSupporting, isArranged, LESSON_BASIS_LABELS, NARRATIVE_LABELS, orderLine, refText, SOURCE_LABELS, storyById, storyKey, SUMMARY_LABEL, surahName, typeLabel,
  type Entity, type QuranStory,
} from "~/lib/stories";
import { clearProgress, markRead, readProgress, recordChapter, restoreProgress, resumeChapter, STORY_PROGRESS_KEY, type StoryProgress } from "~/lib/storyProgress";

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const undo = useUndoToast();

const story = computed<QuranStory | undefined>(() => storyById(props.id));
useSeoMeta({ title: () => (story.value ? `${story.value.title} · Stories · Quran App` : "Story not found · Quran App"), description: () => story.value?.shortDescription });

const chapters = computed(() => (story.value ? chaptersOf(story.value) : []));
const total = computed(() => chapters.value.length);
const current = computed(() => chapterFromQuery(route.query.chapter, total.value));
const chapter = computed(() => (typeof current.value === "number" ? chapters.value[current.value] ?? null : null));
const entities = computed(() => (story.value ? entitiesOf(story.value) : null));
const order = computed(() => orderLine(chapters.value));
const arranged = computed(() => !!story.value && isArranged(story.value));

const progress = ref<StoryProgress | null>(null);
const saved = ref(false);
const announce = ref("");
const titleEl = ref<HTMLElement | null>(null);
const endTitleEl = ref<HTMLElement | null>(null);
const navEl = ref<HTMLElement | null>(null);
const textReady = ref(false);
const offer = ref<number | "end" | null>(null);
const compareOpen = ref(false);
const entity = ref<Entity | null>(null);
const entityReturn = ref<HTMLElement | null>(null);

function refresh() {
  if (!story.value) return;
  progress.value = readProgress(story.value.id, total.value);
  saved.value = hasBookmark(storyKey(story.value.id));
}
const isRead = (i: number) => !!progress.value?.read.includes(i);

function enter() {
  refresh();
  const s = story.value;
  if (!s) return;
  const resume = resumeChapter(progress.value, total.value);
  offer.value = route.query.chapter === undefined && resume !== 0 ? resume : null;
  track();
}
function track() {
  const s = story.value;
  if (!s) return;
  recordChapter(s.id, typeof current.value === "number" ? current.value : total.value);
  refresh();
  textReady.value = false;
  announce.value = typeof current.value === "number" ? `Chapter ${current.value + 1} of ${total.value}: ${chapters.value[current.value]?.title ?? ""}` : "The end of the story";
}

const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === BOOKMARKS_KEY || e.key === STORY_PROGRESS_KEY) refresh();
};
onMounted(() => {
  enter();
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => {
  window.removeEventListener("storage", onStorage);
  observer?.disconnect();
});
watch(() => props.id, enter);
watch(current, async () => {
  track();
  await nextTick();
  (typeof current.value === "number" ? titleEl.value : endTitleEl.value)?.focus({ preventScroll: false });
});

// A chapter counts as read when its end is reached (the bar under the text scrolls into view after the text is there) or Next is pressed.
let observer: IntersectionObserver | undefined;
watch([textReady, navEl], () => {
  observer?.disconnect();
  if (!textReady.value || !navEl.value || typeof current.value !== "number" || typeof IntersectionObserver === "undefined") return;
  const idx = current.value;
  observer = new IntersectionObserver(([e]) => {
    if (e?.isIntersecting && story.value) {
      markRead(story.value.id, idx);
      refresh();
      observer?.disconnect();
    }
  });
  observer.observe(navEl.value);
});

function go(c: number | "end", push = false) {
  const q = chapterQuery(c);
  void (push ? router.push({ query: q }) : router.replace({ query: q }));
  offer.value = null;
}
function next() {
  if (!story.value || typeof current.value !== "number") return;
  markRead(story.value.id, current.value);
  go(current.value + 1 >= total.value ? "end" : current.value + 1);
}
const prev = () => typeof current.value === "number" && current.value > 0 && go(current.value - 1);

function startAgain() {
  const s = story.value;
  if (!s) return;
  const before = clearProgress(s.id);
  go(0);
  refresh();
  if (before) undo.withUndo("Progress for this story cleared.", () => { restoreProgress(s.id, before); refresh(); });
}

function toggleSaved() {
  const s = story.value;
  if (!s) return;
  const key = storyKey(s.id);
  if (saved.value) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refresh();
    undo.withUndo(`Removed ${s.title} from saved`, () => { addBookmark(key, when); refresh(); });
  } else {
    addBookmark(key);
    refresh();
  }
}
function openEntity(e: Entity) {
  entityReturn.value = document.activeElement as HTMLElement | null;
  entity.value = e;
}
</script>

<template>
  <section v-if="story" data-testid="story-page">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <NuxtLink to="/stories" class="inline-flex min-h-11 items-center gap-1 text-[14px] text-brand md:min-h-9" data-testid="story-back"><Icon name="lucide:chevron-left" size="16" />Stories</NuxtLink>
      <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="story-save" @click="toggleSaved">
        <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" /></svg>
        {{ saved ? "Saved" : "Save" }}
      </Button>
    </div>

    <header class="mt-4">
      <p class="text-[32px] leading-tight" style="font-family: var(--font-arabic); text-align: left" lang="ar" dir="rtl" data-testid="story-arabic-title">{{ story.arabicTitle }}</p>
      <h1 class="mt-1 font-serif text-[28px] font-medium" data-testid="story-title">{{ story.title }}</h1>
      <p v-if="story.alternateTitles?.length" class="mt-0.5 text-[13.5px] text-ink-2">Also known as: {{ story.alternateTitles.join(", ") }}</p>
      <ul class="mt-2 flex flex-wrap gap-1.5" aria-label="About this story">
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-type">{{ typeLabel(story) }}</li>
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" :class="arranged ? 'border-dashed' : ''" data-testid="chip-status">{{ NARRATIVE_LABELS[story.narrativeStatus] }}</li>
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-chapters">{{ total }} {{ total === 1 ? "chapter" : "chapters" }}</li>
      </ul>
      <p v-if="order" class="mt-2 text-[13px] text-ink-2" data-testid="story-order">{{ order }}</p>
      <p v-if="arranged" class="mt-2 rounded-lg border border-dashed px-3 py-2 text-[13px]" data-testid="arranged-notice">{{ ARRANGED_NOTICE }}</p>
      <p class="mt-2 text-[12.5px] text-ink-2" data-testid="summary-note">Chapter summaries are written for this app; the Qur’an text is the source.</p>
    </header>

    <div v-if="offer !== null" class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-accent/40 px-3 py-2 text-[13.5px]" data-testid="continue-banner">
      <span>Continue where you left off: {{ offer === "end" ? "the end of the story" : `Chapter ${Number(offer) + 1}` }}</span>
      <span class="flex gap-1">
        <Button size="sm" class="min-h-11 md:min-h-8" data-testid="continue-go" @click="go(offer!, true)">Continue</Button>
        <Button size="sm" variant="ghost" class="min-h-11 md:min-h-8" aria-label="Dismiss" data-testid="continue-dismiss" @click="offer = null"><Icon name="lucide:x" size="15" /></Button>
      </span>
    </div>

    <ol v-if="total > 1" class="mt-5 flex items-center" aria-label="Chapters" data-testid="progress-rail">
      <li v-for="(c, i) in chapters" :key="i" class="flex items-center">
        <span v-if="i" aria-hidden="true" class="h-px w-4 bg-border md:w-8" :class="isRead(i - 1) ? 'bg-brand' : ''" />
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center"
          :aria-label="`Chapter ${i + 1}: ${c.title}${isRead(i) ? ', read' : ''}${current === i ? ', current' : ''}`"
          :aria-current="current === i ? 'step' : undefined"
          :data-state="isRead(i) ? 'read' : current === i ? 'current' : 'unread'"
          data-testid="rail-dot"
          @click="go(i)"
        >
          <span class="inline-flex size-7 items-center justify-center rounded-full border text-[12px]" :class="isRead(i) ? 'border-brand bg-brand text-background' : current === i ? 'border-brand text-brand' : 'border-dashed text-ink-2'">
            <Icon v-if="isRead(i)" name="lucide:check" size="14" /><template v-else>{{ i + 1 }}</template>
          </span>
        </button>
      </li>
      <li class="ml-3 text-[12.5px] text-ink-2" data-testid="rail-caption">{{ current === "end" ? "Story complete" : `Chapter ${Number(current) + 1} of ${total}` }}</li>
    </ol>
    <p class="sr-only" role="status" aria-live="polite" data-testid="chapter-announce">{{ announce }}</p>

    <!-- a chapter -->
    <article v-if="chapter" class="mt-4" data-testid="chapter">
      <p class="text-[12px] font-medium uppercase tracking-wide text-ink-2" data-testid="chapter-eyebrow">Chapter {{ chapter.index + 1 }} of {{ total }}</p>
      <h2 ref="titleEl" tabindex="-1" class="mt-1 font-serif text-[24px] font-medium outline-none" data-testid="chapter-title">{{ chapter.title }}</h2>
      <p class="mt-0.5 text-[13px] text-ink-2" data-testid="chapter-ref">{{ chapter.passages.map(refText).join(" · ") }} · {{ chapter.ayahs }} {{ chapter.ayahs === 1 ? "ayah" : "ayahs" }}</p>
      <p v-if="chapter.summary" class="mt-3 text-[15px] leading-relaxed" data-testid="chapter-summary"><span class="mb-1 block text-[12px] text-ink-2">{{ SUMMARY_LABEL }}</span>{{ chapter.summary }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-disabled="true" aria-describedby="listen-why" class="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-md border px-4 text-[14px] opacity-60 md:min-h-9" data-testid="listen" @click.prevent>
          <Icon name="lucide:headphones" size="16" />Listen to this chapter
        </button>
        <span id="listen-why" class="text-[12.5px] text-ink-2" data-testid="listen-why">Coming with the player</span>
      </div>
      <div class="mt-3"><StoriesChapterText :chapter="chapter" @ready="textReady = true" /></div>

      <section v-if="hasSupporting(story)" class="mt-4 rounded-[10px] border p-3" aria-labelledby="told-h" data-testid="told-in">
        <h3 id="told-h" class="text-[13px] font-medium">Also told in</h3>
        <p class="mt-1 text-[13px] text-ink-2">{{ (story.supportingPassages ?? []).map((p) => refText(p)).join(" · ") }}</p>
        <Button variant="outline" class="mt-2 min-h-11 gap-2 md:min-h-9" data-testid="compare-open" @click="compareOpen = true"><Icon name="lucide:layers" size="15" />Compare tellings</Button>
      </section>

      <nav ref="navEl" aria-label="Chapter navigation" class="mt-6 flex items-center justify-between gap-2 border-t pt-3" data-testid="chapter-nav">
        <button type="button" class="inline-flex min-h-11 max-w-[45%] items-center gap-1 text-left text-[14px] text-brand disabled:text-ink-3" :disabled="chapter.index === 0" data-testid="prev" @click="prev">
          <Icon name="lucide:chevron-left" size="16" class="shrink-0" /><span class="truncate">{{ chapter.index === 0 ? "Previous chapter" : chapters[chapter.index - 1]!.title }}</span>
        </button>
        <button type="button" class="inline-flex min-h-11 max-w-[45%] items-center gap-1 text-right text-[14px] text-brand" data-testid="next" @click="next">
          <span class="truncate">{{ chapter.index + 1 >= total ? "Finish the story" : chapters[chapter.index + 1]!.title }}</span><Icon name="lucide:chevron-right" size="16" class="shrink-0" />
        </button>
      </nav>
    </article>

    <!-- the end -->
    <article v-else class="mt-4" data-testid="story-end">
      <p class="text-[12px] font-medium uppercase tracking-wide text-ink-2">The end of the story</p>
      <h2 ref="endTitleEl" tabindex="-1" class="mt-1 font-serif text-[24px] font-medium outline-none" data-testid="end-title">{{ story.title }}</h2>
      <p v-if="story.outcome" class="mt-2 text-[15px] leading-relaxed" data-testid="story-outcome"><span class="mb-1 block text-[12px] text-ink-2">Outcome</span>{{ story.outcome }}</p>
      <section v-if="story.lessons?.length" class="mt-5" aria-labelledby="lessons-h" data-testid="lessons">
        <h3 id="lessons-h" class="text-[15px] font-medium">What the Qur’an stresses</h3>
        <ul class="mt-2 space-y-3">
          <li v-for="(l, i) in story.lessons" :key="i" class="rounded-[10px] border p-3" data-testid="lesson">
            <span class="rounded-full border px-2 py-0.5 text-[11.5px]" :class="l.basis === 'quran_explicit' ? '' : 'border-dashed'" data-testid="lesson-basis">{{ LESSON_BASIS_LABELS[l.basis] ?? l.basis }}</span>
            <p class="mt-1.5 text-[14.5px]">{{ l.text }}</p>
            <p v-if="l.quranReferences?.length" class="mt-1.5 flex flex-wrap gap-1.5">
              <NuxtLink v-for="r in l.quranReferences" :key="`${r.surahNumber}:${r.ayahNumber}`" :to="surahHref(r.surahNumber, r.ayahNumber)" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[12.5px] md:min-h-8" data-testid="lesson-ref">{{ surahName(r.surahNumber) }} {{ r.surahNumber }}:{{ r.ayahNumber }}</NuxtLink>
            </p>
          </li>
        </ul>
      </section>
      <section v-if="story.relatedStoryIds?.length" class="mt-5" aria-labelledby="rel-h" data-testid="related-stories">
        <h3 id="rel-h" class="text-[15px] font-medium">Continue with</h3>
        <ul class="mt-2 flex flex-wrap gap-2">
          <li v-for="rid in story.relatedStoryIds" :key="rid"><NuxtLink v-if="storyById(rid)" :to="`/stories/${rid}`" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[13.5px] md:min-h-8" data-testid="related-link">{{ storyById(rid)!.title }}</NuxtLink></li>
        </ul>
      </section>
      <div class="mt-6 flex flex-wrap gap-2">
        <Button as-child class="min-h-11 md:min-h-9"><NuxtLink to="/stories" data-testid="end-back">Back to Stories</NuxtLink></Button>
        <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="start-again" @click="startAgain">Start again</Button>
        <Button v-if="total > 1" variant="ghost" class="min-h-11 md:min-h-9" data-testid="last-chapter" @click="go(total - 1)">Back to the last chapter</Button>
      </div>
    </article>

    <!-- who and where: data only; places, peoples and events have no page until Phase 12 -->
    <section v-if="entities && (entities.people.length || entities.communities.length || entities.places.length || entities.events.length)" class="mt-8" aria-labelledby="in-story-h" data-testid="in-story">
      <h3 id="in-story-h" class="text-[15px] font-medium">In this story</h3>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="e in [...entities.people, ...entities.communities, ...entities.places]" :key="`${e.kind}-${e.id}`">
          <button type="button" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[13.5px] md:min-h-8" :class="e.kind === 'person' ? '' : 'border-dashed'" :data-kind="e.kind" data-testid="entity-chip" @click="openEntity(e)">{{ e.name }}</button>
        </li>
        <li v-for="e in entities.events" :key="`event-${e.id}`"><span class="inline-flex min-h-8 items-center rounded-full border border-dashed px-3 text-[13px] text-ink-2" title="Events arrive in a later phase" data-testid="event-chip">Event · {{ e.name }}</span></li>
      </ul>
      <p v-if="entities.events.length" class="mt-1 text-[12px] text-ink-2" data-testid="events-note">Events arrive in a later phase. Place and people-group pages arrive then too.</p>
    </section>

    <section v-if="story.statusNotes?.length || story.sources?.length" class="mt-6" data-testid="story-notes">
      <Collapsible>
        <CollapsibleTrigger as-child>
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" data-testid="notes-toggle"><Icon name="lucide:chevron-down" size="15" />Notes on this story</Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul v-if="story.sources?.length" class="mt-3 space-y-2" data-testid="story-sources">
            <li v-for="(s, i) in story.sources" :key="i" class="text-[14px]"><span class="mr-2 rounded-full border px-2 py-0.5 text-[12px]" :class="s.type === 'quran' ? '' : 'border-dashed'">{{ SOURCE_LABELS[s.type] ?? s.type }}</span>{{ s.citation }}</li>
          </ul>
          <ul v-if="story.statusNotes?.length" class="mt-3 list-disc space-y-1 pl-5 text-[14px]" data-testid="story-status-notes"><li v-for="(n, i) in story.statusNotes" :key="i">{{ n }}</li></ul>
        </CollapsibleContent>
      </Collapsible>
    </section>

    <StoriesCompareSheet :story="story" :open="compareOpen" @close="compareOpen = false" />
    <StoriesEntitySheet :entity="entity" @close="entity = null; entityReturn?.focus()" />
  </section>

  <section v-else data-testid="story-missing">
    <h1 class="font-serif text-[24px] font-medium">Story not found</h1>
    <p class="mt-2 text-ink-2">There is no story “{{ id }}”.</p>
    <p class="mt-4"><NuxtLink class="text-brand underline" to="/stories">Back to Stories</NuxtLink></p>
  </section>
</template>
