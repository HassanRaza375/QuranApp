<script setup lang="ts">
// A bordered container of rows with hairline dividers (design system: "set-group"). `dim` greys it out when its master
// switch is off (the controls inside are disabled by the caller).
defineProps<{ dim?: boolean }>();
</script>

<template>
  <div class="divide-y rounded-[10px] border bg-surface" :class="dim ? 'opacity-60' : ''">
    <slot />
  </div>
</template>
