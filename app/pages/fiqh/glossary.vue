<script setup lang="ts">
// /fiqh/glossary is the legacy route.
import FiqhUnavailable from "~/components/fiqh/FiqhUnavailable.vue";

// If the page (or the data it imports) cannot be loaded, the answer is the plain "not on this device" page: the failure is caught here, so it never reaches Nuxt's error page.
const Page = defineAsyncComponent(() => import("~/components/fiqh/FiqhGlossary.vue").catch(() => FiqhUnavailable));
</script>

<template>
  <Page />
</template>
