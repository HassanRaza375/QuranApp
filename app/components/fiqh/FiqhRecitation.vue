<script setup lang="ts">
// A recited text (a dhikr) shown beside a ruling or a step, from its own source: the Arabic is quoted from the marja's official book (his Urdu edition where his English edition shows it as an image),
// never typed here and never spliced into the ruling's text. Only the chosen marja's own recitations are shown.
import type { Marja, Recitation } from "@legacy/data/wajibat/types";
import { readerNote } from "~/lib/fiqh/visibility";

defineProps<{ recitation: Recitation; marja: Marja }>();
</script>

<template>
  <div class="mt-3 border-l-2 pl-3.5" data-testid="ruling-recitation">
    <p class="ar text-right" lang="ar" dir="rtl">{{ recitation.arabic }}</p>
    <p v-if="recitation.transliteration" class="mt-1 text-[13.5px] text-ink-2">{{ recitation.transliteration }}</p>
    <FiqhSourceLine :source="recitation.source" :marja-name="marja.name.en" verification="A" urdu />
    <p v-if="readerNote(recitation.note)" class="mt-1 text-[12.5px] text-ink-2">{{ readerNote(recitation.note) }}</p>
  </div>
</template>
