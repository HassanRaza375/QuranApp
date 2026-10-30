<script setup lang="ts">
// About (Phase 15; no prototype): a calm reading page from the existing type scale. What it says is checked against the code: the services are the list in
// lib/about.ts (a test compares it with the hosts the app calls); the knowledge modules are read from the one module list. Level A: static, nothing is
// read from storage and nothing is requested. Its title and description are repeated in lib/publicMeta.ts for the prerendered head tags.
import { ABOUT, DATA_SOURCES } from "~/lib/about";
import { MODULE_ORDER, MODULES } from "~/lib/knowledge/modules";
import { PUBLIC_META } from "~/lib/publicMeta";

useSeoMeta({ title: PUBLIC_META["/about"]!.title, description: ABOUT.metaDescription });
const modules = MODULE_ORDER.map((id) => MODULES[id]);
</script>

<template>
  <article class="mx-auto max-w-[680px]" data-testid="about-page">
    <h1 class="font-serif text-[30px] font-medium leading-tight md:text-[36px]">{{ ABOUT.title }}</h1>
    <p class="mt-2 text-[16px] leading-relaxed text-ink-2" data-testid="about-lede">{{ ABOUT.lede }}</p>

    <section class="mt-8 border-t pt-6" aria-labelledby="about-device">
      <h2 id="about-device" class="font-serif text-[22px] font-medium">What stays on your device</h2>
      <p class="mt-2 text-[15px] leading-relaxed" data-testid="about-device">{{ ABOUT.what }}</p>
      <p class="mt-2 text-[15px] leading-relaxed" data-testid="about-fresh">{{ ABOUT.fresh }}</p>
      <p class="mt-2 text-[15px] leading-relaxed">Export your data, reset the settings, or clear everything, in Settings.</p>
      <NuxtLink to="/settings" class="inline-flex min-h-11 items-center text-[15px] text-brand underline underline-offset-2 md:min-h-9" data-testid="about-settings">Open Settings, Data &amp; privacy</NuxtLink>
    </section>

    <section class="mt-6 border-t pt-6" aria-labelledby="about-sources">
      <h2 id="about-sources" class="font-serif text-[22px] font-medium">Where things come from</h2>
      <p class="mt-2 text-[15px] leading-relaxed">{{ ABOUT.sources }}</p>
      <dl class="mt-3 divide-y border-y" data-testid="about-sources">
        <div v-for="s in DATA_SOURCES" :key="s.id" class="py-3" data-testid="about-source" :data-host="s.host">
          <dt class="flex flex-wrap items-baseline gap-x-2">
            <a :href="s.href" class="inline-flex min-h-11 items-center text-[15px] font-medium text-brand underline underline-offset-2 md:min-h-9" target="_blank" rel="noopener noreferrer">{{ s.name }}</a>
            <span class="text-[12.5px] text-ink-2">{{ s.host }}</span>
          </dt>
          <dd class="text-[14.5px]">{{ s.provides }}</dd>
          <dd class="mt-0.5 text-[13px] text-ink-2"><b class="font-medium">Sent:</b> {{ s.sends }}</dd>
        </div>
      </dl>
    </section>

    <section class="mt-6 border-t pt-6" aria-labelledby="about-study">
      <h2 id="about-study" class="font-serif text-[22px] font-medium">The study pages</h2>
      <p class="mt-2 text-[15px] leading-relaxed" data-testid="about-grounding">{{ ABOUT.grounding }}</p>
      <ul class="mt-3 grid gap-x-6 sm:grid-cols-2" data-testid="about-modules">
        <li v-for="m in modules" :key="m.id">
          <NuxtLink :to="m.route" class="flex min-h-11 items-center gap-2.5 border-b py-2 hover:text-brand" :data-testid="`about-module-${m.id}`">
            <Icon :name="m.icon" size="16" class="shrink-0 text-ink-2" />
            <span class="min-w-0"><span class="block text-[14.5px]">{{ m.title }}</span><span class="block text-[12.5px] text-ink-2">{{ m.question }}</span></span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="mt-6 border-t pt-6" aria-labelledby="about-limits">
      <h2 id="about-limits" class="font-serif text-[22px] font-medium">What it is not</h2>
      <p class="mt-2 text-[15px] leading-relaxed" data-testid="about-limits">{{ ABOUT.limits }}</p>
    </section>

    <p class="mt-8 border-t pt-4 text-[14px] text-ink-2">
      <NuxtLink to="/sitemap" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2 md:min-h-9" data-testid="about-sitemap">See every page in the Sitemap</NuxtLink>
    </p>
  </article>
</template>
