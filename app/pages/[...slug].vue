<script setup lang="ts">
// Any address that is not a page of the app (Phase 16). Every legacy route has a page, a redirect or a stub, so what lands here is a mistyped or old
// address. A single-page app answers 200 for any address, so the page says plainly that nothing is here and carries `noindex`.
useSeoMeta({ title: "Page not found · Quran App", robots: "noindex" });
const route = useRoute();
</script>

<template>
  <section class="mx-auto max-w-[560px] py-6" data-testid="not-found-page">
    <h1 class="font-serif text-[28px] font-medium">Page not found</h1>
    <p class="mt-2 text-[15px] text-ink-2">
      There is no page at <code class="rounded bg-sunken px-1.5 py-0.5 text-[13px]" data-testid="not-found-path">{{ route.path }}</code>.
    </p>
    <ul class="mt-4">
      <li><NuxtLink class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/" data-testid="not-found-home">Go to Home</NuxtLink></li>
      <li><NuxtLink class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/search" data-testid="not-found-search">Search</NuxtLink></li>
      <li><NuxtLink class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/sitemap" data-testid="not-found-sitemap">See every page in the Sitemap</NuxtLink></li>
    </ul>
  </section>
</template>
