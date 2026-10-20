<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <StoriesStoryReader :id="String(route.params.id)" />
</template>
