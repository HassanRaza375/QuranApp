<script setup lang="ts">
// One story in the directory: the Arabic title (text), the title, the status chip (dashed unless fully told), the chapter count, your
// progress, and a star (`story:<id>`).
import { chapterHref, isArranged, NARRATIVE_LABELS, typeLabel, type QuranStory } from "~/lib/stories";
import { progressText, resumeChapter, type StoryProgress } from "~/lib/storyProgress";

const props = defineProps<{ story: QuranStory; saved: boolean; chapters: number; progress: StoryProgress | null }>();
defineEmits<{ star: [] }>();
const text = computed(() => progressText(props.progress, props.chapters));
const href = computed(() => chapterHref(props.story.id, resumeChapter(props.progress, props.chapters)));
</script>

<template>
  <li class="stories-row flex items-start gap-2 border-b py-3" data-testid="story-row" :data-id="story.id">
    <NuxtLink :to="href" class="flex min-w-0 flex-1 items-start gap-4" data-testid="story-row-link">
      <span class="w-24 shrink-0 text-center text-[20px] leading-tight" style="font-family: var(--font-arabic)" lang="ar" dir="rtl" aria-hidden="true">{{ story.arabicTitle }}</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[15.5px] font-medium">{{ story.title }}</span>
        <span class="mt-0.5 flex flex-wrap gap-1.5">
          <span class="rounded-full border px-2 py-0.5 text-[11.5px]" :class="isArranged(story) ? 'border-dashed' : ''" data-testid="row-status">{{ NARRATIVE_LABELS[story.narrativeStatus] }}</span>
          <span class="rounded-full border px-2 py-0.5 text-[11.5px]">{{ typeLabel(story) }}</span>
        </span>
        <span class="mt-1 line-clamp-2 block text-[13.5px] text-ink-2">{{ story.shortDescription }}</span>
        <span class="mt-1 block text-[12.5px] text-ink-2" data-testid="row-chapters">{{ chapters }} {{ chapters === 1 ? "chapter" : "chapters" }} · <span data-testid="row-progress">{{ text }}</span></span>
      </span>
    </NuxtLink>
    <ListingStarButton :saved="saved" :name="story.title" @toggle="$emit('star')" />
  </li>
</template>

<style scoped>
.stories-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 120px;
}
</style>
