<template>
  <div role="status" aria-busy="true" aria-label="Loading the surah" data-testid="reader-skeleton">
    <div v-for="i in 3" :key="i" class="border-b py-8">
      <Skeleton class="mb-4 ml-auto h-9 w-4/5" />
      <Skeleton class="mb-3 ml-auto h-9 w-3/5" />
      <Skeleton class="h-4 w-2/3" />
    </div>
  </div>
</template>
