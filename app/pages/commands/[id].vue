<script setup lang="ts">
// /commands/[id] is the legacy route; the page is the shared knowledge detail for one entry.
const route = useRoute();
const id = computed(() => String(route.params.id ?? ""));
</script>

<template>
  <KnowledgeDetailPage :id="id" module="commands" />
</template>
