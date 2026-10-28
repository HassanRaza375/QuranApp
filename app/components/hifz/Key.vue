<script setup lang="ts">
// The colour key of the strength strip. Shown once on a page; the strip itself is read out in words for a screen reader.
const KEY = [
  { cls: "bg-s1", label: "Not started" },
  { cls: "bg-s2", label: "Learning" },
  { cls: "bg-s3", label: "Memorized" },
  { cls: "bg-gold", label: "Strong" },
  { cls: "bg-transparent ring-2 ring-inset ring-weak", label: "Needs work" },
];
</script>

<template>
  <ul class="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2" data-testid="hifz-key">
    <li v-for="k in KEY" :key="k.label" class="inline-flex items-center gap-1.5"><i class="inline-block size-2.5 rounded-[2px]" :class="k.cls" aria-hidden="true" />{{ k.label }}</li>
    <li class="inline-flex items-center gap-1.5"><i class="relative inline-block size-2.5 bg-s3 after:absolute after:-left-[3px] after:top-[30%] after:h-[40%] after:w-[3px] after:bg-weak" aria-hidden="true" />A join needs work</li>
  </ul>
</template>
