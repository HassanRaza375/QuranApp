<script setup lang="ts">
// "Done for today" (Phase 14): how many were practised, which words slipped, and the way back. No score, no streak, nothing about yesterday.
defineProps<{ practised: number; needAnother: number; slipped: string[]; free?: boolean; title?: string }>();
</script>

<template>
  <div class="pt-10 text-center" data-testid="hifz-done">
    <span class="mx-auto grid size-14 place-items-center rounded-full border-[1.5px] border-gold text-gold"><Icon name="lucide:check" size="24" /></span>
    <h1 class="mt-5 font-serif text-[28px] font-medium">{{ title ?? "Done for today" }}</h1>
    <p class="mx-auto mt-2 max-w-[44ch] text-[15px] text-ink-2" data-testid="hifz-done-summary">
      {{ practised }} {{ practised === 1 ? "step" : "steps" }} practised<template v-if="free">. Free practice doesn’t change your schedule.</template><template v-else-if="needAnother">, {{ needAnother }} to try again. {{ needAnother === 1 ? "That one comes" : "Those come" }} back tomorrow.</template><template v-else>, no slips.</template>
    </p>
    <div v-if="slipped.length && !free" class="mx-auto mt-6 max-w-md">
      <p class="mb-2 text-[13px] text-ink-2">Words that slipped today</p>
      <p class="flex flex-wrap justify-center gap-2" data-testid="hifz-done-words">
        <span v-for="(w, i) in slipped" :key="i" class="ar !text-[22px] !leading-[1.7] rounded-lg bg-weak/15 px-3 text-weak" dir="rtl" lang="ar">{{ w }}</span>
      </p>
      <p class="mt-2 text-[12.5px] text-ink-2">A word you slip on, on more than one day, is marked tricky and shown to you before you recite that ayah.</p>
    </div>
    <div class="mt-8"><Button as-child class="h-12 min-h-12 px-8"><NuxtLink to="/hifz" data-testid="hifz-back">Back to Hifz</NuxtLink></Button></div>
  </div>
</template>
