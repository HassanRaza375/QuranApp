<script setup lang="ts">
// /fiqh/[category]/[topic] is the legacy route. The same key per topic keeps the page from being reused across topics.
import FiqhUnavailable from "~/components/fiqh/FiqhUnavailable.vue";

const route = useRoute();
// If the page (or the data it imports) cannot be loaded, the answer is the plain "not on this device" page: the failure is caught here, so it never reaches Nuxt's error page.
const Page = defineAsyncComponent(() => import("~/components/fiqh/FiqhTopic.vue").catch(() => FiqhUnavailable));
</script>

<template>
  <Page :key="`${route.params.category}/${route.params.topic}`" />
</template>
