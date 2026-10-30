<script setup lang="ts">
// "Refer to his risala": what is shown in place of a ruling (or of a quote of one) that is held for review, whose English differs from his Persian original, or that is on our hold list. His
// book and number and a link to the official text; no text of the ruling, in any language.
import type { Marja, SourceCitation } from "@legacy/data/wajibat/types";
import { POINTER_TEXT } from "~/lib/fiqh/quoteView";
import type { PointerReason } from "~/lib/fiqh/visibility";

defineProps<{ reason: PointerReason; source: SourceCitation; marja: Marja }>();
</script>

<template>
  <div class="rounded-[10px] border border-dashed px-3.5 py-3 text-[13.5px]" role="note" data-testid="ruling-pointer" :data-reason="reason">
    <p class="flex items-center gap-1.5 font-medium"><Icon name="lucide:book-open" size="15" />Refer to his risala</p>
    <p class="mt-1 text-ink-2">{{ POINTER_TEXT[reason] }}</p>
    <p class="mt-1.5">Please read it in {{ marja.name.en }}’s own book: <em>{{ source.title }}</em>, {{ source.reference }}
      <a :href="source.url" target="_blank" rel="noopener noreferrer" class="ml-1 underline" :aria-label="`Open ${source.title}, ${source.reference} on the official website (opens in a new tab)`">official text</a>
    </p>
  </div>
</template>
