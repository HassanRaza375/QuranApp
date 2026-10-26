<script setup lang="ts">
// "According to <marja'> — <book>, <number>" with a link to the official text and the level it was checked at. An Urdu line names the Urdu book itself and nothing
// else: it never says the Urdu is a translation of the English, or the other way round.
import type { SourceCitation, VerificationLevel } from "@legacy/data/wajibat/types";
import { VERIFICATION_META } from "@legacy/utils/wajibatLabels";

defineProps<{ source: SourceCitation; marjaName: string; verification?: VerificationLevel; urdu?: boolean }>();
</script>

<template>
  <p class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-2" data-testid="fiqh-source">
    <Icon name="lucide:book-open-text" size="14" />
    <span v-if="urdu" lang="ur" dir="rtl">{{ source.title }} — {{ source.reference }}</span>
    <span v-else>According to {{ marjaName }} — <em>{{ source.title }}</em>, {{ source.reference }}</span>
    <a :href="source.url" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center underline md:min-h-6" :aria-label="`Open ${source.title}, ${source.reference} on the official website (opens in a new tab)`">official text</a>
    <span v-if="verification" class="rounded-full border px-2 py-0.5 text-[11.5px]">{{ VERIFICATION_META[verification].label }}</span>
  </p>
</template>
