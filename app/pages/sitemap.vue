<script setup lang="ts">
// Sitemap (Phase 15; no prototype): every page of the app in one place, grouped as the sidebar groups them. Built from lib/nav.ts, so it cannot drift from
// the sidebar. Level A: static; the links are plain links (no prefetching of fifty routes).
import { sitemapSections } from "~/lib/sitemap";

useSeoMeta({ title: "Sitemap · Quran App", description: "Every page of the Quran App in one place." });
const sections = sitemapSections();
</script>

<template>
  <article class="mx-auto max-w-[920px]" data-testid="sitemap-page">
    <h1 class="font-serif text-[30px] font-medium leading-tight md:text-[36px]">Sitemap</h1>
    <p class="mt-2 text-[16px] text-ink-2">Every page of the app, in one place.</p>

    <div class="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      <section v-for="s in sections" :key="s.id" :aria-labelledby="`sitemap-${s.id}`" data-testid="sitemap-section" :data-section="s.id">
        <h2 :id="`sitemap-${s.id}`" class="border-b pb-2 font-serif text-[19px] font-medium">{{ s.label }}</h2>
        <ul>
          <li v-for="l in s.links" :key="l.to" class="border-b">
            <NuxtLink :to="l.to" :prefetch="false" class="flex min-h-11 items-center gap-2.5 py-2 hover:text-brand" data-testid="sitemap-link">
              <Icon :name="l.icon" size="16" class="shrink-0 text-ink-2" />
              <span class="text-[15px]">{{ l.label }}</span>
            </NuxtLink>
            <p v-if="l.note" class="-mt-1 pb-2 pl-[26px] text-[12.5px] text-ink-2">{{ l.note }}</p>
          </li>
        </ul>
      </section>
    </div>
  </article>
</template>
