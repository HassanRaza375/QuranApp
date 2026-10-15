<script setup lang="ts">
// Any route that is not rebuilt yet. The legacy routes are kept (docs/PLAN.md), so a legacy link lands here
// until its phase is done, with a clear message instead of a blank page.
useSeoMeta({ title: "Not available yet · Quran App", robots: "noindex" });
const route = useRoute();
</script>

<template>
  <section>
    <h1 class="font-serif text-[24px] font-medium">This page is not rebuilt yet</h1>
    <p class="mt-2 text-ink-2">
      <code class="rounded bg-sunken px-1.5 py-0.5 text-[13px]">{{ route.path }}</code> is still being moved to the new design.
    </p>
    <p class="mt-4"><NuxtLink class="text-brand underline" to="/">Go to Home</NuxtLink></p>
  </section>
</template>
