<script setup lang="ts">
// One ruling for one marja' (prototype `slot`). What it shows is decided by `viewOf` (lib/fiqh/visibility.ts): the marja's own text, or a pointer to his book, or "Not added yet".
// Never another marja's text. The text is quoted exactly; nothing here rewrites, summarises or translates it.
import type { Marja, Ruling } from "@legacy/data/wajibat/types";
import { URDU_EDITION_LAG_NOTICE } from "@legacy/utils/wajibatLabels";
import { basisBadge, hukmBadge } from "~/lib/fiqh/badges";
import { getRecitationById, getRulingById } from "~/lib/fiqh/data";
import { ANSWER_UR, QUESTION_UR, URDU } from "~/lib/fiqh/ui";
import { MARJA_SHORT, viewOf, type FiqhLang } from "~/lib/fiqh/visibility";

const props = defineProps<{ ruling: Ruling; marja: Marja; lang: FiqhLang }>();
const view = computed(() => viewOf(props.ruling, props.marja.id, props.lang, props.marja.status === "pending-sources"));
const short = computed(() => MARJA_SHORT[props.marja.id]);
const seeAlso = computed(() => (view.value.kind === "missing" && view.value.seeAlsoRulingId ? getRulingById(view.value.seeAlsoRulingId) : undefined));
// only the chosen marja's own recitations (the same rule as for rulings)
const recitations = computed(() => (props.ruling.recitationIds ?? []).map((id) => getRecitationById(id)).filter((r) => r && r.marjaId === props.marja.id));

</script>

<template>
  <article :id="ruling.id" class="border-b py-5" data-testid="ruling" :data-ruling="ruling.id">
    <h3 class="text-[15.5px] font-medium">{{ ruling.subject.en }}</h3>

    <!-- no entry: never another marja's text -->
    <template v-if="view.kind === 'missing'">
      <p v-if="seeAlso" class="mt-2 rounded-[10px] border border-dashed px-3 py-2.5 text-[13.5px]" data-testid="ruling-seealso">
        {{ short }}’s ruling on this point is part of <a :href="`#${seeAlso.id}`" class="underline">“{{ seeAlso.subject.en }}”</a> on this page.
      </p>
      <p v-else class="mt-2 rounded-[10px] border border-dashed px-3 py-2.5 text-[13.5px]" data-testid="ruling-missing">
        Not added yet for {{ short }}. Refer to his risala.
        <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="ml-1 underline">Official website</a>
      </p>
    </template>

    <!-- held, withheld or on hold: a pointer and no text, in any language -->
    <FiqhPointer v-else-if="view.kind === 'pointer'" class="mt-2" :reason="view.reason" :source="view.source" :marja="marja" />

    <template v-else>
      <div class="mt-2 flex flex-wrap gap-1.5" data-testid="ruling-badges">
        <span v-if="view.entry.hukm" class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]"><Icon :name="hukmBadge(view.entry.hukm).icon" size="13" />{{ hukmBadge(view.entry.hukm).label }}</span>
        <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]" :title="basisBadge(view.entry.basis).hint" data-testid="ruling-basis"><Icon :name="basisBadge(view.entry.basis).icon" size="13" />{{ basisBadge(view.entry.basis).label }}</span>
        <span v-if="view.entry.format === 'qa'" class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]"><Icon name="lucide:messages-square" size="13" />Q&amp;A</span>
        <span v-if="view.entry.excerpt" class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]"><Icon name="lucide:quote" size="13" />Excerpt</span>
      </div>

      <!-- English: the English book of this marja', with its own source line -->
      <div v-if="view.english" class="mt-3 border-l-2 pl-3.5" data-testid="ruling-en">
        <p v-if="lang === 'both'" class="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ink-2">English</p>
        <template v-if="view.english.question">
          <p class="text-[11.5px] font-medium uppercase tracking-wide text-ink-2">Question</p>
          <p class="mb-2 whitespace-pre-line text-[15px] leading-relaxed">{{ view.english.question }}</p>
          <p class="text-[11.5px] font-medium uppercase tracking-wide text-ink-2">Answer</p>
        </template>
        <p class="whitespace-pre-line text-[15px] leading-relaxed" data-testid="ruling-text">{{ view.english.text }}</p>
        <FiqhSourceLine :source="view.english.source" :marja-name="marja.name.en" :verification="view.entry.verification" />
      </div>

      <!-- recitation: shown beside the ruling, from its own source, never spliced into the ruling's text -->
      <FiqhRecitation v-for="r in recitations" :key="r!.id" :recitation="r!" :marja="marja" />

      <!-- Urdu: the marja's own Urdu book, with its own source line -->
      <div v-if="view.urdu" class="mt-3 border-l-2 pl-3.5" :class="view.english ? 'mt-4' : ''" data-testid="ruling-ur">
        <p v-if="lang === 'both'" class="mb-1 text-[13px] font-medium text-ink-2" lang="ur" dir="rtl">{{ URDU }}</p>
        <template v-if="view.urdu.question">
          <p class="text-right text-[13.5px] text-ink-2" lang="ur" dir="rtl">{{ QUESTION_UR }}</p>
          <p class="ur mb-2 whitespace-pre-line" lang="ur" dir="rtl">{{ view.urdu.question }}</p>
          <p class="text-right text-[13.5px] text-ink-2" lang="ur" dir="rtl">{{ ANSWER_UR }}</p>
        </template>
        <p class="ur whitespace-pre-line" lang="ur" dir="rtl" data-testid="ruling-text-ur">{{ view.urdu.text }}</p>
        <FiqhSourceLine :source="view.urdu.source" :marja-name="marja.name.en" urdu />
        <p v-if="view.urdu.persian" class="mt-1 text-[12.5px] text-ink-2">Compared with the Persian original: <a :href="view.urdu.persian.url" target="_blank" rel="noopener noreferrer" class="underline">{{ view.urdu.persian.reference }}</a></p>
      </div>

      <template v-for="n in view.notices" :key="n.kind">
        <p v-if="n.kind === 'urdu-only'" class="mt-2 border-l-2 border-dashed pl-3.5 text-[13.5px]" role="note" data-testid="notice-urdu-only">
          The official text of this ruling is in Urdu only: there is no official English translation, and the app does not translate rulings itself. To check it, see {{ marja.name.en }}’s own book ({{ view.entry.source.title }}) or ask his office through <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="underline">his official website</a>.
        </p>
        <p v-else-if="n.kind === 'urdu-lag'" class="mt-2 rounded-[10px] border border-dashed px-3 py-2 text-[13px]" role="note" data-testid="notice-urdu-lag">
          <span class="ur block" lang="ur" dir="rtl">{{ URDU_EDITION_LAG_NOTICE.text.ur }}</span>
          <span class="text-ink-2">Explanation written by the app, not a ruling: {{ URDU_EDITION_LAG_NOTICE.text.en }}</span>
        </p>
        <p v-else class="mt-2 text-[12.5px] text-ink-2" data-testid="notice-no-urdu">No official Urdu text for this ruling yet, so the English is shown. <template v-if="n.reason">{{ n.reason }}</template></p>
      </template>
      <p v-if="view.note" class="mt-2 text-[12.5px] text-ink-2" data-testid="ruling-note">{{ view.note }}</p>
    </template>
  </article>
</template>
