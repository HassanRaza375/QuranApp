<script setup lang="ts">
const navOpen = ref(false);
usePrayerNotifications(); // reminders while the app is open, on any page (no permission prompt, no location prompt)
const route = useRoute();
watch(() => route.path, () => {
  navOpen.value = false;
});
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
    <aside class="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r bg-sunken px-3 py-5 md:block" aria-label="Sidebar">
      <NuxtLink to="/" class="mb-6 block px-3 font-serif text-[20px] font-medium tracking-tight">Quran App</NuxtLink>
      <LayoutNavList />
    </aside>

    <Sheet v-model:open="navOpen">
      <SheetContent side="left" class="w-72 overflow-y-auto bg-sunken p-3 md:hidden">
        <SheetHeader>
          <SheetTitle class="px-3 font-serif text-[20px] font-medium">Quran App</SheetTitle>
          <SheetDescription class="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <LayoutNavList @navigate="navOpen = false" />
      </SheetContent>
    </Sheet>

    <div class="md:pl-64">
      <LayoutAppHeader @open-nav="navOpen = true" />
      <main id="main" class="mx-auto max-w-4xl px-4 py-8 pb-28 md:px-8" tabindex="-1">
        <slot />
      </main>
    </div>
    <LayoutMiniPlayer />
    <Toaster
      position="bottom-center"
      :toast-options="{ classes: { toast: '!rounded-[10px] !border !border-border', actionButton: '!bg-primary !text-primary-foreground', cancelButton: '!bg-muted !text-foreground' } }"
    />
    <LayoutPwaUpdateToast />
  </div>
</template>
