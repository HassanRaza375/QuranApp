<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <PeoplePersonPage :id="String(route.params.id)" />
</template>
