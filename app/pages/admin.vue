<script setup lang="ts">
// Admin panel (view only, one page): a super admin signs in here and sees every user. It is not linked from anywhere and carries noindex. With sync off, or for anyone
// who is not a super admin, it looks exactly like any address that is not a page (the server answers 404 for them and this page does the same).
import { isSyncOn } from "~/lib/sync/flag";

useSeoMeta({ title: "Admin · Quran App", robots: "noindex, nofollow" });
const on = isSyncOn(useRuntimeConfig().public.syncEnabled);
</script>

<template>
  <LazyAdminUsers v-if="on" />
  <section v-else class="mx-auto max-w-[560px] py-6" data-testid="not-found-page">
    <h1 class="font-serif text-[28px] font-medium">Page not found</h1>
    <p class="mt-2 text-[15px] text-ink-2">There is no page at this address.</p>
    <NuxtLink class="mt-3 inline-flex min-h-11 items-center text-brand underline underline-offset-2" to="/">Go to Home</NuxtLink>
  </section>
</template>
