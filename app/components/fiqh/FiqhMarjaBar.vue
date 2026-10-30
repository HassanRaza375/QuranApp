<script setup lang="ts">
// "Showing rulings of <marja'>" with a Change link (prototype `marjaBar`). Shown only once a marja' is chosen.
import { MARJA_SHORT } from "~/lib/fiqh/visibility";

const { marja } = useFiqh();
</script>

<template>
  <div v-if="marja" class="flex items-center gap-3 rounded-[10px] border px-4 py-3" data-testid="marja-bar">
    <span class="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-[13px] font-medium" aria-hidden="true">{{ MARJA_SHORT[marja.id].charAt(0) }}</span>
    <div class="min-w-0 flex-1">
      <div class="text-[12.5px] text-ink-2">Showing rulings of</div>
      <div class="truncate text-[15px] font-medium" data-testid="marja-name">{{ marja.name.en }}</div>
    </div>
    <NuxtLink to="/fiqh/choose-marja" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13.5px] hover:bg-accent md:min-h-9" data-testid="marja-change">Change</NuxtLink>
  </div>
</template>
