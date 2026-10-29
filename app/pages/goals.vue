<script setup lang="ts">
// /goals is the legacy route; the screen is in components/goals (Phase 15). Personal page: noindex.
useSeoMeta({ title: "Reading goals · Quran App", description: "Plan your Qur’an reading by a daily amount or a day to finish by. Everything stays on this device.", robots: "noindex, follow" });
</script>

<template>
  <GoalsPage />
</template>
