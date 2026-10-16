<script setup lang="ts">
// One person in the directory: the Arabic name (text only), the name with its honorific, the category, the counts, the chronology and
// the stories they are in. The star saves `person:<id>` (the key the legacy app and the Library use).
import { categoryLabel, chronologyInfo, displayName, storiesFor, type QuranPerson } from "~/lib/people";

const props = defineProps<{ person: QuranPerson; saved: boolean }>();
defineEmits<{ star: [] }>();
const chron = computed(() => chronologyInfo(props.person));
const stories = computed(() => storiesFor(props.person.id).length);
</script>

<template>
  <li class="people-row flex items-start gap-2 border-b py-3" data-testid="person-row" :data-id="person.id">
    <NuxtLink :to="`/persons/${person.id}`" class="flex min-w-0 flex-1 items-start gap-4" data-testid="person-link">
      <span class="w-20 shrink-0 text-center text-[22px] leading-tight" style="font-family: var(--font-arabic)" lang="ar" dir="rtl" aria-hidden="true">{{ person.arabicName }}</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[15.5px] font-medium">{{ displayName(person) }}</span>
        <span class="mt-0.5 flex flex-wrap gap-1.5">
          <span class="rounded-full border px-2 py-0.5 text-[11.5px]">{{ categoryLabel(person.primaryCategory) }}</span>
          <span v-if="person.entityType === 'group'" class="rounded-full border px-2 py-0.5 text-[11.5px]">Group</span>
          <span v-if="stories" class="rounded-full border border-brand px-2 py-0.5 text-[11.5px] text-brand" data-testid="row-stories">{{ stories === 1 ? "In 1 story" : `In ${stories} stories` }}</span>
        </span>
        <span class="mt-1 line-clamp-2 block text-[13.5px] text-ink-2">{{ person.shortDescription }}</span>
        <span class="mt-1 block text-[12.5px] text-ink-2" data-testid="row-meta">
          {{ person.directMentions.length }} direct mentions · {{ person.relatedPassages.length }} related passages
          <span v-if="chron" class="ml-1 inline-block rounded-full border px-2 py-0.5 text-[11.5px]" :class="chron.dashed ? 'border-dashed' : ''" data-testid="row-chronology">{{ chron.text }}</span>
        </span>
      </span>
    </NuxtLink>
    <ListingStarButton :saved="saved" :name="displayName(person)" @toggle="$emit('star')" />
  </li>
</template>

<style scoped>
.people-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 120px;
}
</style>
