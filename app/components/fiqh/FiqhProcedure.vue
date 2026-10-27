<script setup lang="ts">
// A guided procedure (wuḍūʾ, ghusl, tayammum, the daily prayers) according to ONE marja': one step at a time, or all. The step titles are written by the app (and say so); the text under each
// is quoted from the ruling the step cites, with its book and number, exactly as the ruling card shows it. A step that cites a ruling which is held, whose English is withheld or that is on our
// hold list shows the pointer in the quote's place (lib/fiqh/quoteView.ts); no text, and no Urdu in its place.
import type { Marja, Procedure, ProcedureStep } from "@legacy/data/wajibat/types";
import { hukmBadge } from "~/lib/fiqh/badges";
import { getRecitationById, getRulingById } from "~/lib/fiqh/data";
import { quoteView } from "~/lib/fiqh/quoteView";
import { readerNote } from "~/lib/fiqh/visibility";

const props = defineProps<{ procedure: Procedure; marja: Marja }>();
const index = ref(0);
const showAll = ref(false);
const steps = computed(() => props.procedure.steps);
const current = computed(() => steps.value[Math.min(index.value, steps.value.length - 1)]!);

const view = (s: ProcedureStep) => {
  const urdu = !s.instruction.en && !!s.instruction.ur;
  return quoteView(getRulingById(s.rulingId), props.marja.id, urdu ? s.instruction.ur! : s.instruction.en, urdu ? "ur" : "en");
};
const recitationsOf = (s: ProcedureStep) => (s.recitationIds ?? []).map((id) => getRecitationById(id)).filter((r) => r && r.marjaId === props.marja.id);
</script>

<template>
  <section class="mt-4 rounded-[10px] border px-4 py-4" :aria-labelledby="`proc-${procedure.id}`" data-testid="fiqh-procedure" :data-procedure="procedure.id">
    <h3 :id="`proc-${procedure.id}`" class="text-[16px] font-medium">{{ procedure.title.en }}</h3>
    <p class="mt-0.5 text-[13px] text-ink-2">According to {{ marja.name.en }} · {{ steps.length }} {{ steps.length === 1 ? "step" : "steps" }}</p>
    <p class="mt-2 text-[12.5px] text-ink-2">Step titles are written by the app. The text under each title is quoted from the ruling it cites.</p>

    <template v-if="!showAll">
      <div class="mt-3 flex items-center gap-3">
        <span class="flex-1 text-[14px] font-medium tabular-nums" aria-live="polite" data-testid="step-counter">Step {{ index + 1 }} of {{ steps.length }}</span>
        <button type="button" class="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-brand underline md:min-h-9" data-testid="step-all" @click="showAll = true">Show all steps</button>
      </div>
      <div class="mt-2 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden="true"><div class="h-full bg-primary" :style="{ width: `${((index + 1) / steps.length) * 100}%` }" /></div>
      <FiqhStep :key="current.id" :step="current" :view="view(current)" :marja="marja" :recitations="recitationsOf(current)" :hukm="current.hukm ? hukmBadge(current.hukm) : null" :note="readerNote(current.note)" class="mt-4" />
      <div class="mt-4 flex justify-between gap-2">
        <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="index === 0" data-testid="step-prev" @click="index--"><Icon name="lucide:chevron-left" size="16" />Previous</Button>
        <Button v-if="index < steps.length - 1" class="min-h-11 md:min-h-9" data-testid="step-next" @click="index++">Next<Icon name="lucide:chevron-right" size="16" /></Button>
        <Button v-else variant="outline" class="min-h-11 md:min-h-9" data-testid="step-restart" @click="index = 0"><Icon name="lucide:rotate-ccw" size="16" />Start over</Button>
      </div>
    </template>
    <template v-else>
      <div class="mt-3 flex justify-end"><button type="button" class="inline-flex min-h-11 items-center text-[13px] text-brand underline md:min-h-9" data-testid="step-one" @click="showAll = false">One step at a time</button></div>
      <ol class="mt-2 space-y-5">
        <li v-for="s in steps" :key="s.id"><FiqhStep :step="s" :view="view(s)" :marja="marja" :recitations="recitationsOf(s)" :hukm="s.hukm ? hukmBadge(s.hukm) : null" :note="readerNote(s.note)" /></li>
      </ol>
    </template>
  </section>
</template>
