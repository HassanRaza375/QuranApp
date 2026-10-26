<script setup lang="ts">
// /fiqh is the legacy route. The page (and the data it imports) loads on demand; if that fails (offline, and Daily Fiqh was never opened online) the reader gets a plain page, not a blank one.
import FiqhUnavailable from "~/components/fiqh/FiqhUnavailable.vue";

// If the page (or the data it imports) cannot be loaded, the answer is the plain "not on this device" page: the failure is caught here, so it never reaches Nuxt's error page.
const Page = defineAsyncComponent(() => import("~/components/fiqh/FiqhHome.vue").catch(() => FiqhUnavailable));
</script>

<template>
  <Page />
</template>
