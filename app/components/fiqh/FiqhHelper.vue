<script setup lang="ts">
// A step-by-step helper ("Find your answer"): one question per screen about the reader's situation, ending in the marja's own wording or a pointer to his risala. Nothing here is a ruling written by the
// app. Every question offers "I'm not sure", which leads to the pointer and never to a guessed answer. An answer that quotes a ruling which is held, whose English is withheld or that is on our hold
// list shows the pointer in the quote's place. No scholar has signed off the paths (owner decision, 2026-10-28: not required), so the result always says "Not scholar-reviewed".
import type { DecisionTree, Marja } from "@legacy/data/wajibat/types";
import { getRulingById } from "~/lib/fiqh/data";
import { back as walkBack, choose, currentNode, NOT_SURE, nodeById, type WalkStep } from "~/lib/fiqh/helperWalk";
import { quoteView } from "~/lib/fiqh/quoteView";

const props = defineProps<{ tree: DecisionTree; marja: Marja }>();
const openRuling = inject<(id: string) => void>("fiqh-open-ruling", () => {});

const started = ref(false);
const history = ref<WalkStep[]>([]);
const choice = ref<string | null>(null);
const node = computed(() => currentNode(props.tree, history.value)!);
const trail = computed(() => history.value.map((h) => ({ question: nodeById(props.tree, h.nodeId)?.question?.text.en ?? "", answer: h.answer })));

function next() {
  if (!choice.value) return;
  history.value = choose(props.tree, history.value, choice.value);
  choice.value = null;
}
function back() {
  history.value = walkBack(history.value);
  choice.value = null;
}
function restart() {
  history.value = [];
  choice.value = null;
}

const quotes = computed(() => (node.value.outcome?.kind === "ruling" ? node.value.outcome.quotes : []));
const phrases = computed(() => (node.value.outcome?.kind === "ruling" ? node.value.outcome.verdictPhrases : []));
const views = computed(() => quotes.value.map((q) => quoteView(getRulingById(q.rulingId), props.marja.id, q.text, q.lang)));
// a ruling quoted in several parts: its notice once before the first part, its link once after the last
const firstOf = (i: number) => quotes.value.findIndex((x) => x.rulingId === quotes.value[i]!.rulingId) === i;
const lastOf = (i: number) => quotes.value.findLastIndex((x) => x.rulingId === quotes.value[i]!.rulingId) === i;
const related = computed(() => (node.value.outcome?.kind === "ruling" ? (node.value.outcome.seeRulingIds ?? []) : []).map((id) => ({ id, title: getRulingById(id)?.subject.en })).filter((s) => s.title));
const questionId = computed(() => `dh-q-${props.tree.id}-${node.value.id}`);
</script>

<template>
  <section class="mt-4 rounded-[10px] border px-4 py-4" :aria-labelledby="`dh-title-${tree.id}`" data-testid="fiqh-helper" :data-helper="tree.id">
    <div class="flex flex-wrap items-center gap-2">
      <h3 :id="`dh-title-${tree.id}`" class="text-[16px] font-medium">{{ tree.title.en }}</h3>
      <span class="rounded-full border px-2.5 py-0.5 text-[12px]">{{ marja.name.en }}</span>
      <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] text-ink-2"><Icon name="lucide:user-round-x" size="13" />Not scholar-reviewed</span>
    </div>

    <template v-if="!started">
      <p class="mt-2 max-w-xl text-[14px]">{{ tree.intro.text.en }}</p>
      <Button class="mt-3 min-h-11 md:min-h-9" data-testid="helper-start" @click="started = true"><Icon name="lucide:play" size="16" />Start</Button>
    </template>

    <template v-else>
      <ol v-if="trail.length" class="mt-3 list-decimal space-y-0.5 pl-5 text-[12.5px]" aria-label="Your answers so far" data-testid="helper-trail"><li v-for="(t, i) in trail" :key="i"><span class="text-ink-2">{{ t.question }}</span> <b class="font-medium">{{ t.answer }}</b></li></ol>

      <fieldset v-if="node.question" :key="node.id" class="mt-3" data-testid="helper-question">
        <legend :id="questionId" class="text-[15px] font-medium">{{ node.question.text.en }}</legend>
        <div class="mt-2 space-y-1">
          <label v-for="o in node.options" :key="o.id" class="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-1 text-[14.5px] hover:bg-accent md:min-h-9"><input v-model="choice" type="radio" :name="questionId" :value="o.id" data-testid="helper-option" />{{ o.label.en }}</label>
          <label class="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-1 text-[14.5px] hover:bg-accent md:min-h-9"><input v-model="choice" type="radio" :name="questionId" :value="NOT_SURE" data-testid="helper-notsure" />I'm not sure</label>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button class="min-h-11 md:min-h-9" :disabled="!choice" data-testid="helper-next" @click="next">Next<Icon name="lucide:arrow-right" size="16" /></Button>
          <Button variant="ghost" class="min-h-11 md:min-h-9" :disabled="!trail.length" data-testid="helper-back" @click="back"><Icon name="lucide:arrow-left" size="16" />Back</Button>
          <Button variant="ghost" class="min-h-11 md:min-h-9" data-testid="helper-restart" @click="restart"><Icon name="lucide:rotate-ccw" size="16" />Start over</Button>
        </div>
      </fieldset>

      <div v-else class="mt-3" aria-live="polite" data-testid="helper-result">
        <template v-if="node.outcome?.kind === 'ruling'">
          <p class="text-[12.5px] text-ink-2">According to {{ marja.name.en }}, in his own words (shown exactly as published; the app does not paraphrase or translate it):</p>
          <FiqhHelperQuote v-for="(q, i) in quotes" :key="i" :quote="q" :view="views[i]!" :marja="marja" :phrases="phrases" :first="firstOf(i)" :last="lastOf(i)" @open="openRuling" />
          <p v-if="related.length" class="mt-2 text-[14px]">Related: <template v-for="(s, i) in related" :key="s.id"><button type="button" class="underline" @click="openRuling(s.id)">{{ s.title }}</button><span v-if="i < related.length - 1">, </span></template></p>
        </template>
        <div v-else-if="node.outcome?.kind === 'refer'" class="rounded-[10px] border border-dashed px-3.5 py-3 text-[14px]" data-testid="helper-refer">
          <p>{{ node.outcome.reason.text.en }}</p>
          <p class="mt-2">Where to look: {{ tree.risala.book }}, {{ tree.risala.location }}. <a :href="tree.risala.url" target="_blank" rel="noopener noreferrer" class="underline">Open it on the official website</a> or ask {{ marja.name.en }}’s office through <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="underline">his official website</a>.</p>
        </div>
        <p class="mt-3 text-[12.5px] text-ink-2">{{ marja.name.en }} · Not scholar-reviewed. This helper only points to his published text; if your situation is unusual, ask him or his office.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" class="min-h-11 md:min-h-9" data-testid="helper-back" @click="back"><Icon name="lucide:arrow-left" size="16" />Back</Button>
          <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="helper-restart" @click="restart"><Icon name="lucide:rotate-ccw" size="16" />Start over</Button>
        </div>
      </div>
    </template>
  </section>
</template>
