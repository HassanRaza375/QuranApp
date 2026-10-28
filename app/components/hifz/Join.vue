<script setup lang="ts">
// A graded join (Phase 14): the end of one ayah, then the start of the next said from memory. "I said it" is good, "Not yet" is again (the join
// becomes weak after one miss, as in the legacy). Used for a weak join in today's plan and for the joins of "Check the whole surah".
import { lastWords } from "~/lib/hifz/words";

defineProps<{ from: number; to: number; fromWords: string[] }>();
const emit = defineEmits<{ said: [boolean] }>();
</script>

<template>
  <div class="text-center" data-testid="hifz-join">
    <h2 class="font-serif text-[22px] font-medium">Join ayah {{ from }} to ayah {{ to }}</h2>
    <p class="ar mt-3 text-ink-2" dir="rtl" lang="ar" data-testid="hifz-join-prompt">… {{ lastWords(fromWords).join(" ") }}</p>
    <p class="mt-2 text-[14px] text-ink-2">Say how ayah {{ to }} begins, aloud, from memory. Then say whether you got it.</p>
    <div class="mt-5 flex gap-2.5">
      <Button variant="outline" class="h-12 min-h-12 flex-1" data-testid="hifz-join-no" @click="emit('said', false)">Not yet</Button>
      <Button class="h-12 min-h-12 flex-1" data-testid="hifz-join-yes" @click="emit('said', true)">I said it</Button>
    </div>
  </div>
</template>
