<script setup lang="ts">
// /peoples/[id] is the legacy route; the page is the shared knowledge detail for one people.
const route = useRoute();
const id = computed(() => String(route.params.id ?? ""));
</script>

<template>
  <KnowledgeDetailPage :id="id" module="peoples" />
</template>
