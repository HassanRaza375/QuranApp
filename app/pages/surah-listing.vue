<script setup lang="ts">
// /surah-listing is the Surah tab; /surah-listing?tab=page is the Page tab. The Juz tab is /juz (a legacy route).
const route = useRoute();
const tab = computed(() => (route.query.tab === "page" ? "page" : "surah"));
</script>

<template>
  <ListingPage :tab="tab" />
</template>
