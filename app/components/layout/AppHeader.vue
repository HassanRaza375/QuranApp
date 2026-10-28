<script setup lang="ts">
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { titleForPath } from "~/lib/nav";

defineEmits<{ "open-nav": [] }>();
const prefs = usePreferencesStore();
const route = useRoute();
const title = computed(() => titleForPath(route.path));
const themes: MenuOption[] = [
  { value: "light", label: "Light", icon: "lucide:sun" },
  { value: "dark", label: "Dark", icon: "lucide:moon" },
  { value: "system", label: "System", icon: "lucide:monitor" },
];
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-surface px-3 md:gap-4 md:px-6">
    <Button variant="ghost" size="icon" class="size-11 md:hidden" aria-label="Open menu" @click="$emit('open-nav')">
      <Icon name="lucide:menu" size="20" />
    </Button>
    <p class="font-serif text-[18px] font-medium tracking-tight" data-testid="page-title">{{ title }}</p>

    <!-- Search is a link to /search; "/" opens it from any page (useSearchShortcut). -->
    <NuxtLink
      to="/search"
      class="ml-4 hidden h-9 max-w-md flex-1 items-center gap-2 rounded-full border bg-sunken px-4 text-[13px] text-ink-2 hover:bg-accent md:flex"
    >
      <Icon name="lucide:search" size="16" />Search the Qur’an, people, places…
    </NuxtLink>

    <div class="ml-auto flex items-center gap-1">
      <NuxtLink to="/search" class="inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-accent md:hidden" aria-label="Search">
        <Icon name="lucide:search" size="20" />
      </NuxtLink>
      <ResponsiveMenu
        :model-value="prefs.prefs.theme"
        :options="themes"
        label="Theme"
        @update:model-value="(v) => prefs.set('theme', v as 'light' | 'dark' | 'system')"
      >
        <template #trigger="{ current }">
          <Button variant="ghost" size="icon" class="size-11 md:size-9" aria-label="Theme">
            <Icon :name="current?.icon ?? 'lucide:sun'" size="18" />
          </Button>
        </template>
      </ResponsiveMenu>
      <NuxtLink to="/settings" class="inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-accent md:size-9" aria-label="Settings">
        <Icon name="lucide:settings" size="18" />
      </NuxtLink>
    </div>
  </header>
</template>
