<script setup lang="ts">
// Family & notes: each relationship as a sentence with its source (a dashed border when it is not verified), and the scholarly and
// traditional notes (sources by type, status notes). Referenced By waits for Phase 12.
import { relationLines, sourceLabel, type QuranPerson } from "~/lib/people";

const props = defineProps<{ person: QuranPerson }>();
const lines = computed(() => relationLines(props.person));
</script>

<template>
  <div class="space-y-8" data-testid="family-tab">
    <section aria-labelledby="family-h" data-testid="family-section">
      <h2 id="family-h" class="text-[15px] font-medium">Family &amp; relationships</h2>
      <p class="mt-1 text-[13px] text-ink-2">A relationship found only in tradition is marked with a dashed border and its source, and is never shown with the same weight as one the Qur’an states.</p>
      <ul v-if="lines.length" class="mt-2">
        <li v-for="(l, i) in lines" :key="i" class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-3" data-testid="relation">
          <span class="text-[14.5px]" data-testid="relation-sentence">{{ l.sentence }}</span>
          <span class="rounded-full border px-2.5 py-0.5 text-[12px]" :class="l.dashed ? 'border-dashed' : ''" data-testid="relation-source">{{ l.source }}<template v-if="l.dashed"> · {{ l.status }}</template></span>
          <NuxtLink v-if="l.related.href" :to="l.related.href" class="inline-flex min-h-11 items-center text-[13px] text-brand underline md:min-h-8" data-testid="relation-open">Open {{ l.related.name }}</NuxtLink>
        </li>
      </ul>
      <p v-else class="mt-2 text-[14px] text-ink-2" data-testid="no-family">No family or other relationships are catalogued for this person yet.</p>
    </section>

    <section aria-labelledby="notes-h" data-testid="notes-section">
      <h2 id="notes-h" class="text-[15px] font-medium">Scholarly &amp; traditional notes</h2>
      <ul v-if="person.sources?.length" class="mt-2 space-y-2" data-testid="sources">
        <li v-for="(s, i) in person.sources" :key="i" class="text-[14px]">
          <span class="mr-2 rounded-full border px-2 py-0.5 text-[12px]" :class="s.type === 'quran' ? '' : 'border-dashed'">{{ sourceLabel(s.type) }}</span>{{ s.citation }}<span v-if="s.note" class="block text-[13px] text-ink-2">{{ s.note }}</span>
        </li>
      </ul>
      <ul v-if="person.statusNotes?.length" class="mt-3 list-disc space-y-1 pl-5 text-[14px]" data-testid="status-notes">
        <li v-for="(n, i) in person.statusNotes" :key="i">{{ n }}</li>
      </ul>
      <p v-if="!person.sources?.length && !person.statusNotes?.length" class="mt-2 text-[14px] text-ink-2" data-testid="no-notes">No notes are recorded for this person.</p>
    </section>
  </div>
</template>
