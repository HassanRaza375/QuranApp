<script setup lang="ts">
// The Story tab: the overview, key lessons, and the stories that involve this person, each with your progress and a link to where you
// left off. The reader shipped in 7B; the one flag (STORIES_READY.reader) still decides whether a "not rebuilt yet" notice shows.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { NARRATIVE_LABELS, STORIES_READY, storiesFor, storyHref, type QuranPerson } from "~/lib/people";
import { surahHref } from "~/lib/readerLinks";
import { chapterHref, chaptersOf } from "~/lib/stories";
import { progressText, readAllProgress, resumeChapter, type ProgressMap } from "~/lib/storyProgress";

const props = defineProps<{ person: QuranPerson }>();
const stories = computed(() => storiesFor(props.person.id));
const refLabel = (r: { surahNumber: number; ayahNumber?: number; ayahStart?: number }) => `${SURAH_ROWS[r.surahNumber - 1]?.name ?? `Surah ${r.surahNumber}`} ${r.surahNumber}:${r.ayahNumber ?? r.ayahStart ?? 1}`;
const refHref = (r: { surahNumber: number; ayahNumber?: number; ayahStart?: number }) => surahHref(r.surahNumber, r.ayahNumber ?? r.ayahStart);
const detailOpen = ref(false);
const progress = ref<ProgressMap>({});
onMounted(() => {
  progress.value = readAllProgress();
});
const total = (s: (typeof stories.value)[number]) => chaptersOf(s).length;
const state = (s: (typeof stories.value)[number]) => progressText(progress.value[s.id] ?? null, total(s));
const href = (s: (typeof stories.value)[number]) => (STORIES_READY.reader ? chapterHref(s.id, resumeChapter(progress.value[s.id] ?? null, total(s))) : storyHref(s.id));
</script>

<template>
  <div class="space-y-6" data-testid="story-tab">
    <section aria-labelledby="overview-h">
      <h2 id="overview-h" class="text-[15px] font-medium">Overview</h2>
      <p class="mt-1 text-[15px] leading-relaxed" data-testid="overview-text">{{ person.shortDescription }}</p>
      <Collapsible v-if="person.detailedDescription" v-model:open="detailOpen" class="mt-2">
        <CollapsibleTrigger as-child>
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-8" :aria-expanded="detailOpen" data-testid="more-detail"><Icon :name="detailOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="15" />More detail</Button>
        </CollapsibleTrigger>
        <CollapsibleContent><p class="mt-2 text-[14.5px] leading-relaxed" data-testid="detail-text">{{ person.detailedDescription }}</p></CollapsibleContent>
      </Collapsible>
      <ul v-if="person.themes?.length" class="mt-3 flex flex-wrap gap-1.5" aria-label="Themes">
        <li v-for="t in person.themes" :key="t" class="rounded-full bg-muted px-2.5 py-0.5 text-[12.5px]" data-testid="theme">{{ t }}</li>
      </ul>
    </section>

    <section aria-labelledby="stories-h" data-testid="stories-section">
      <h2 id="stories-h" class="text-[15px] font-medium">Stories</h2>
      <template v-if="stories.length">
        <p v-if="!STORIES_READY.reader" class="mt-1 text-[12.5px] text-ink-2" data-testid="stories-notice">The story reader is still being moved to the new design, so opening a story shows a placeholder for now.</p>
        <ul class="mt-2">
          <li v-for="s in stories" :key="s.id" class="border-b py-3" data-testid="story-item">
            <NuxtLink :to="href(s)" class="block min-h-11" data-testid="story-link">
              <span class="block text-[15px] font-medium">{{ s.title }}</span>
              <span class="block text-[12.5px] text-ink-2" data-testid="story-kind">{{ NARRATIVE_LABELS[s.narrativeStatus] }} · <span data-testid="story-progress">{{ total(s) }} {{ total(s) === 1 ? "chapter" : "chapters" }}, {{ state(s) }}</span></span>
              <span class="mt-0.5 line-clamp-2 block text-[13.5px] text-ink-2">{{ s.shortDescription }}</span>
            </NuxtLink>
          </li>
        </ul>
      </template>
      <p v-else class="mt-1 text-[14px] text-ink-2" data-testid="no-story">No story has been written for {{ person.name }} yet. Their passages are listed under Passages.</p>
    </section>

    <section v-if="person.keyLessons?.length" aria-labelledby="lessons-h" data-testid="lessons-section">
      <h2 id="lessons-h" class="text-[15px] font-medium">Key lessons</h2>
      <ul class="mt-2 space-y-3">
        <li v-for="(l, i) in person.keyLessons" :key="i" class="rounded-[10px] border p-3" data-testid="lesson">
          <p class="text-[14.5px]">{{ l.text }}</p>
          <p v-if="l.quranReferences?.length" class="mt-1.5 flex flex-wrap gap-1.5">
            <NuxtLink v-for="r in l.quranReferences" :key="refLabel(r)" :to="refHref(r)" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[12.5px] md:min-h-8" data-testid="lesson-ref">{{ refLabel(r) }}</NuxtLink>
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>
