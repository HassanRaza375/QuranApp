<script setup lang="ts">
// One step of a procedure. `view` says whether its ruling may be quoted (see lib/fiqh/quoteView.ts).
import type { Marja, ProcedureStep, Recitation } from "@legacy/data/wajibat/types";
import type { QuoteView } from "~/lib/fiqh/quoteView";

defineProps<{ step: ProcedureStep; view: QuoteView; marja: Marja; recitations: (Recitation | undefined)[]; hukm: { label: string; icon: string } | null; note: string | null }>();
</script>

<template>
  <div data-testid="fiqh-step" :data-step="step.id">
    <div class="flex flex-wrap items-center gap-2">
      <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-medium text-primary-foreground tabular-nums" aria-hidden="true">{{ step.order }}</span>
      <h4 class="text-[15.5px] font-medium">{{ step.title.en }}</h4>
      <span v-if="hukm" class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px]"><Icon :name="hukm.icon" size="13" />{{ hukm.label }}</span>
      <span v-if="step.isRukn" class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px]">Rukn</span>
    </div>

    <FiqhPointer v-if="view.kind === 'pointer'" class="mt-2" :reason="view.reason" :source="view.source" :marja="marja" />
    <p v-else-if="view.kind === 'missing'" class="mt-2 rounded-[10px] border border-dashed px-3 py-2.5 text-[13.5px]" data-testid="step-missing">Not added yet. Refer to his risala.</p>
    <template v-else>
      <blockquote class="mt-2 whitespace-pre-line border-l-2 pl-3.5 text-[15px] leading-relaxed" :class="view.lang === 'ur' ? 'ur' : ''" :lang="view.lang" :dir="view.lang === 'ur' ? 'rtl' : 'ltr'" data-testid="step-quote">{{ view.text }}</blockquote>
      <p v-if="view.urduOnly" class="mt-2 border-l-2 border-dashed pl-3.5 text-[13px]" role="note">The official text of this ruling is in Urdu only: there is no official English translation, and the app does not translate rulings itself.</p>
      <FiqhRecitation v-for="r in recitations" :key="r!.id" :recitation="r!" :marja="marja" />
      <FiqhSourceLine :source="view.source" :marja-name="marja.name.en" :verification="view.verification" :urdu="view.lang === 'ur'" />
    </template>
    <p v-if="note && view.kind === 'text'" class="mt-1.5 text-[12.5px] text-ink-2" data-testid="step-note">Written by the app: {{ note }}</p>
  </div>
</template>
