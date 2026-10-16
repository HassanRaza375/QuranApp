<script setup lang="ts">
// The Timeline: the legacy `buildTimeline` (prophets with a chronology order, in order; each with the people they are related to
// who are not on the line; and everyone else in a last group so nobody is hidden). No dates are invented: only the legacy label and
// status. A dashed mark means "not established"; a solid mark means the data calls the chronology strong.
import { buildTimeline } from "@legacy/utils/personsTimeline";
import { chronologyInfo, displayName, PEOPLE, personById, relationSentence, sourceLabel } from "~/lib/people";

const timeline = buildTimeline(PEOPLE);
const open = ref<Record<string, boolean>>({});
const toggle = (id: string) => (open.value = { ...open.value, [id]: !open.value[id] });
</script>

<template>
  <div data-testid="timeline">
    <p class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-ink-2" data-testid="timeline-legend">
      <span class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="inline-block size-2.5 rounded-full bg-brand" />Established chronology</span>
      <span class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="inline-block size-2.5 rounded-full border border-dashed border-brand" />Traditional, uncertain or unknown chronology</span>
    </p>

    <ol class="mt-4" data-testid="timeline-mainline">
      <li v-for="node in timeline.mainline" :key="node.person.id" class="relative border-l pb-5 pl-5" data-testid="timeline-node" :data-id="node.person.id">
        <span aria-hidden="true" class="absolute -left-[6px] top-1.5 inline-block size-3 rounded-full" :class="chronologyInfo(node.person)?.dashed === false ? 'bg-brand' : 'border border-dashed border-brand bg-background'" />
        <NuxtLink :to="`/persons/${node.person.id}`" class="inline-flex min-h-11 flex-wrap items-baseline gap-x-3 md:min-h-0" data-testid="timeline-link">
          <span class="text-[15.5px] font-medium">{{ displayName(node.person) }}</span>
          <span class="text-[18px] text-ink-2" style="font-family: var(--font-arabic)" lang="ar" dir="rtl" aria-hidden="true">{{ node.person.arabicName }}</span>
        </NuxtLink>
        <p class="text-[12.5px] text-ink-2" data-testid="timeline-chronology">
          <span class="inline-block rounded-full border px-2 py-0.5" :class="chronologyInfo(node.person)?.dashed === false ? '' : 'border-dashed'">{{ chronologyInfo(node.person)?.text ?? "Chronology unknown" }}</span>
        </p>
        <template v-if="node.branches.length">
          <button type="button" class="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] text-brand md:min-h-8" :aria-expanded="!!open[node.person.id]" :aria-controls="`branches-${node.person.id}`" data-testid="branch-toggle" @click="toggle(node.person.id)">
            <Icon :name="open[node.person.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="15" />{{ node.branches.length }} related {{ node.branches.length === 1 ? "person" : "people" }}
          </button>
          <ul v-show="open[node.person.id]" :id="`branches-${node.person.id}`" class="mt-1 space-y-1.5" data-testid="branches">
            <li v-for="rel in node.branches" :key="`${rel.relationshipType}-${rel.personId}`" class="text-[13.5px]" data-testid="branch">
              {{ relationSentence(node.person.id, rel) }}
              <NuxtLink v-if="personById(rel.personId)" :to="`/persons/${rel.personId}`" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-0" :aria-label="`Open ${personById(rel.personId)!.name}`">Open</NuxtLink>
              <span class="ml-1 rounded-full border px-2 py-0.5 text-[11.5px]" :class="rel.verificationStatus === 'verified' ? '' : 'border-dashed'">{{ sourceLabel(rel.sourceType) }}</span>
            </li>
          </ul>
        </template>
      </li>
    </ol>

    <section v-if="timeline.unlinked.length" class="mt-6" aria-labelledby="unlinked-h" data-testid="timeline-unlinked">
      <h2 id="unlinked-h" class="text-[15px] font-medium">Other people and groups of the Qur’an</h2>
      <p class="mt-1 text-[13px] text-ink-2">Not placed in the sequence above: the data records no chronological order for them and no relationship to a prophet on the line.</p>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="p in timeline.unlinked" :key="p.id">
          <NuxtLink :to="`/persons/${p.id}`" class="inline-flex min-h-11 items-center rounded-full border px-3 text-[13.5px] md:min-h-8" data-testid="unlinked-link">{{ displayName(p) }}</NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
