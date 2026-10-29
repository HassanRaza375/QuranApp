<script setup lang="ts">
// Literary modules (/poets and every /poets/<slug>), Phase 16: the legacy module (Mir Anis) is 278 KB of Urdu verse that its own data labels "seed data,
// not yet fully verified", so it is not rebuilt for cutover. The routes stay alive and say so; nothing from the legacy module is shown. The setting that
// turns the sidebar row on (`quran:additional-modules-enabled:v1`) is kept as it is.
useSeoMeta({ title: "Literary modules · Quran App", description: "Literary modules are not in this version of the Quran App yet.", robots: "noindex" });
</script>

<template>
  <section class="mx-auto max-w-[560px] py-6" data-testid="poets-stub">
    <h1 class="font-serif text-[28px] font-medium">Literary modules</h1>
    <p class="mt-2 text-[15px]" data-testid="poets-stub-text">Literary modules are not in this version yet. Your setting is kept.</p>
    <ul class="mt-4">
      <li><NuxtLink class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/" data-testid="poets-stub-home">Go to Home</NuxtLink></li>
      <li><NuxtLink class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/sitemap">See every page in the Sitemap</NuxtLink></li>
    </ul>
  </section>
</template>
