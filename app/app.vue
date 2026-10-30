<script setup lang="ts">
// Head tags that depend on the address and on where the build was made (app/lib/seo.ts): the canonical address of every real page, a robots tag when
// the build is not indexable (a preview or a local build), and the Search Console key in production. An address that is not a page says nothing here.
import { canonicalUrl, NOINDEX } from "~/lib/seo";

const route = useRoute();
const cfg = useRuntimeConfig().public;
useHead(() => {
  const isPage = !!route.name && route.name !== "slug";
  const canonical = isPage ? canonicalUrl(String(cfg.siteUrl ?? ""), route.path) : "";
  return {
    link: canonical ? [{ rel: "canonical", href: canonical }] : [],
    meta: [
      ...(cfg.indexable ? [] : [{ name: "robots", content: NOINDEX }]),
      ...(cfg.indexable && cfg.googleSiteVerification ? [{ name: "google-site-verification", content: String(cfg.googleSiteVerification) }] : []),
    ],
  };
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
