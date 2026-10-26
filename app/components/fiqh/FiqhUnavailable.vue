<script setup lang="ts">
// Shown instead of a Daily Fiqh page when its data could not be loaded: offline, and this device has never opened Daily Fiqh online (the data is not part of the install; it is saved
// when you open it, or when you press "Save all for offline"). Never a blank page.
const router = useRouter();
</script>

<template>
  <section class="mx-auto max-w-2xl" data-testid="fiqh-unavailable">
    <h1 class="font-serif text-[26px] font-medium">Daily Fiqh isn’t on this device yet</h1>
    <p class="mt-2 text-[15px] text-ink-2">Daily Fiqh is saved when you first open it online. Connect once and open it again; after that the topics you have opened work with no connection, and “Save all for offline” saves the rest.</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <Button class="min-h-11 md:min-h-9" data-testid="fiqh-unavailable-retry" @click="router.go(0)">Try again</Button>
      <NuxtLink to="/" class="inline-flex min-h-11 items-center rounded-md border px-4 text-[14px] hover:bg-accent md:min-h-9">Home</NuxtLink>
    </div>
  </section>
</template>
