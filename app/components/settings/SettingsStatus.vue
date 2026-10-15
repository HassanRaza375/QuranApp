<script setup lang="ts">
// A message under a group: polite live region (announced, not stealing focus). Never `alert()`.
defineProps<{ tone?: "info" | "warn" }>();
</script>

<template>
  <p class="mt-2 px-1 text-[13px] leading-snug" :class="tone === 'warn' ? 'text-destructive' : 'text-ink-2'" role="status"><slot /></p>
</template>
