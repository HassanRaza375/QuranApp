<script setup lang="ts">
// One quoted ruling in a helper's answer: the marja's own words (highlighting the phrases that state the answer), or the pointer where that ruling may not be shown.
import type { DecisionQuote, Marja } from "@legacy/data/wajibat/types";
import { highlight } from "~/lib/fiqh/helperWalk";
import type { QuoteView } from "~/lib/fiqh/quoteView";

defineProps<{ quote: DecisionQuote; view: QuoteView; marja: Marja; phrases: readonly string[]; first: boolean; last: boolean }>();
defineEmits<{ open: [id: string] }>();
</script>

<template>
  <div class="mt-3" data-testid="helper-quote">
    <FiqhPointer v-if="view.kind === 'pointer'" :reason="view.reason" :source="view.source" :marja="marja" />
    <template v-else-if="view.kind === 'text'">
      <p v-if="first && view.urduOnly" class="mb-2 border-l-2 border-dashed pl-3.5 text-[13.5px]" role="note">No official English translation exists for this text, so it is shown in Urdu, exactly as published. English readers can check it in {{ marja.name.en }}’s own risala ({{ view.source.title }}) or ask his office through <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="underline">his official website</a>.</p>
      <blockquote class="whitespace-pre-line border-l-2 bg-sunken px-3.5 py-2 text-[15px] leading-relaxed" :class="quote.lang === 'ur' ? 'ur' : ''" :lang="quote.lang" :dir="quote.lang === 'ur' ? 'rtl' : 'ltr'" data-testid="helper-quote-text"><template v-for="(seg, j) in highlight(quote.text, phrases)" :key="j"><mark v-if="seg.hit" class="rounded bg-accent px-0.5 text-inherit">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></blockquote>
      <FiqhSourceLine :source="view.source" :marja-name="marja.name.en" :verification="view.verification" :urdu="quote.lang === 'ur'" />
      <p v-if="last && view.note" class="mt-1 text-[12.5px] text-ink-2">{{ view.note }}</p>
    </template>
    <p v-else class="rounded-[10px] border border-dashed px-3 py-2.5 text-[13.5px]">Not added yet for {{ marja.name.en }}. Refer to his risala.</p>
    <button v-if="last" type="button" class="mt-1 inline-flex min-h-11 items-center text-[12.5px] text-brand underline md:min-h-8" data-testid="helper-open-ruling" @click="$emit('open', quote.rulingId)">Open the full ruling on this page</button>
  </div>
</template>
