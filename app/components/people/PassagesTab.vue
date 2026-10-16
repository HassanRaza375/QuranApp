<script setup lang="ts">
// Passages: every direct mention (grouped by surah) and the related passages (grouped by surah, or in Story View order). Each opens
// the reader. Play and Play all are left out until the player (Phase 4B). Opening one records it in the legacy study record.
import { groupDirectMentionsBySurah, groupRelatedPassagesBySurah, sortRelatedPassagesForStoryView } from "@legacy/utils/personsSearch";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import type { QuranPerson } from "~/lib/people";
import { readStudy, recordPassageView, recordReference } from "~/lib/peopleStudy";
import { surahHref } from "~/lib/readerLinks";

const props = defineProps<{ person: QuranPerson }>();
const emit = defineEmits<{ "related-view": [] }>();

const surahName = (n: number) => `${SURAH_ROWS[n - 1]?.name ?? `Surah ${n}`} (${n})`;
const mentions = computed(() => groupDirectMentionsBySurah(props.person));
const bySurah = computed(() => groupRelatedPassagesBySurah(props.person));
const inStory = computed(() => sortRelatedPassagesForStoryView(props.person));
const view = ref<"surah" | "story">("surah");
onMounted(() => {
  view.value = readStudy(props.person.id)?.passageView === "story" ? "story" : "surah";
});
function setView(v: "surah" | "story") {
  if (v === view.value) return;
  view.value = v;
  recordPassageView(props.person.id, v);
  emit("related-view");
}
const opened = (s: number, a: number) => recordReference(props.person.id, s, a);
</script>

<template>
  <div class="space-y-8" data-testid="passages-tab">
    <section aria-labelledby="mentions-h" data-testid="mentions-section">
      <h2 id="mentions-h" class="text-[15px] font-medium">Direct mentions</h2>
      <p class="mt-1 text-[13px] text-ink-2">Every ayah where {{ person.name }}’s name or title is explicitly mentioned, as catalogued in this app’s data.</p>
      <div v-if="mentions.length" class="mt-2 space-y-3">
        <div v-for="g in mentions" :key="g.surahNumber" data-testid="mention-group">
          <h3 class="text-[13px] font-medium text-ink-2">{{ surahName(g.surahNumber) }}</h3>
          <ul class="mt-1 flex flex-wrap gap-1.5">
            <li v-for="(r, i) in g.references" :key="`${r.ayahNumber ?? r.ayahStart}-${i}`">
              <NuxtLink :to="surahHref(g.surahNumber, r.ayahNumber ?? r.ayahStart)" class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-[12.5px] md:min-h-8" data-testid="mention-link" @click="opened(g.surahNumber, r.ayahNumber ?? r.ayahStart ?? 1)">{{ g.surahNumber }}:{{ r.ayahNumber ?? r.ayahStart }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="mt-2 text-[14px] text-ink-2" data-testid="no-mentions">No direct name mentions are catalogued for this person yet.</p>
    </section>

    <section aria-labelledby="related-h" data-testid="related-section">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="related-h" class="text-[15px] font-medium">Related passages</h2>
        <div v-if="person.relatedPassages.length" class="inline-flex rounded-md border" role="group" aria-label="Passage order">
          <button type="button" class="min-h-11 px-3 text-[13px] md:min-h-8" :class="view === 'surah' ? 'bg-accent font-medium text-brand' : ''" :aria-pressed="view === 'surah'" data-testid="view-surah" @click="setView('surah')">Grouped by surah</button>
          <button type="button" class="min-h-11 border-l px-3 text-[13px] md:min-h-8" :class="view === 'story' ? 'bg-accent font-medium text-brand' : ''" :aria-pressed="view === 'story'" data-testid="view-story" @click="setView('story')">Story view</button>
        </div>
      </div>
      <p class="mt-1 text-[13px] text-ink-2">Passages relevant to {{ person.name }}’s story, including verses where the name is not repeated. Story view is a study sequence, not one continuous revealed passage.</p>
      <template v-if="person.relatedPassages.length">
        <div v-if="view === 'surah'" class="mt-2 space-y-4">
          <div v-for="g in bySurah" :key="g.surahNumber" data-testid="passage-group">
            <h3 class="text-[13px] font-medium text-ink-2">{{ surahName(g.surahNumber) }}</h3>
            <ul class="mt-1 space-y-2">
              <li v-for="p in g.references" :key="p.id" class="rounded-[10px] border p-3" data-testid="passage">
                <p class="text-[14.5px] font-medium">{{ p.title || surahName(p.surahNumber) }}</p>
                <p class="text-[12.5px] text-ink-2">{{ surahName(p.surahNumber) }} · {{ p.ayahStart }}–{{ p.ayahEnd }} · {{ p.ayahEnd - p.ayahStart + 1 }} {{ p.ayahEnd === p.ayahStart ? "ayah" : "ayahs" }}</p>
                <p v-if="p.description" class="mt-1 text-[13.5px]">{{ p.description }}</p>
                <NuxtLink :to="surahHref(p.surahNumber, p.ayahStart)" class="mt-1 inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-8" data-testid="passage-read" @click="opened(p.surahNumber, p.ayahStart)">Read passage</NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        <ul v-else class="mt-2 space-y-2" data-testid="story-order">
          <li v-for="p in inStory" :key="p.id" class="rounded-[10px] border p-3" data-testid="passage">
            <p class="text-[14.5px] font-medium">{{ p.title || surahName(p.surahNumber) }}</p>
            <p class="text-[12.5px] text-ink-2">{{ surahName(p.surahNumber) }} · {{ p.ayahStart }}–{{ p.ayahEnd }} · {{ p.ayahEnd - p.ayahStart + 1 }} {{ p.ayahEnd === p.ayahStart ? "ayah" : "ayahs" }}</p>
            <p v-if="p.description" class="mt-1 text-[13.5px]">{{ p.description }}</p>
            <NuxtLink :to="surahHref(p.surahNumber, p.ayahStart)" class="mt-1 inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-8" data-testid="passage-read" @click="opened(p.surahNumber, p.ayahStart)">Read passage</NuxtLink>
          </li>
        </ul>
      </template>
      <p v-else class="mt-2 text-[14px] text-ink-2" data-testid="no-passages">No related passages are catalogued for this person yet.</p>
    </section>
  </div>
</template>
