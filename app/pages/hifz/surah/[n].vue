<script setup lang="ts">
// /hifz/surah/<n> is new in the revamp (the legacy has no such page): one surah in Hifz. n is the surah number; anything else shows "not in My surahs".
const route = useRoute();
const n = computed(() => {
  const v = Number(route.params.n);
  return Number.isInteger(v) && v >= 1 && v <= 114 ? v : 0;
});
</script>

<template>
  <HifzSurah :key="n" :surah="n" />
</template>
