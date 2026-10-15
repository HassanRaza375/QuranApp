<script setup lang="ts">
import type { MenuOption } from "~/components/ResponsiveMenu.vue";

defineEmits<{ "open-nav": [] }>();
const prefs = usePreferencesStore();
const themes: MenuOption[] = [
  { value: "light", label: "Light", icon: "lucide:sun" },
  { value: "dark", label: "Dark", icon: "lucide:moon" },
  { value: "system", label: "System", icon: "lucide:monitor" },
];
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-surface px-4 md:px-6">
    <Button variant="ghost" size="icon" class="size-11 md:hidden" aria-label="Open menu" @click="$emit('open-nav')">
      <Icon name="lucide:menu" size="20" />
    </Button>
    <NuxtLink to="/" class="font-serif text-[19px] font-medium tracking-tight md:hidden">Quran App</NuxtLink>
    <div class="ml-auto flex items-center gap-2">
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
    </div>
  </header>
</template>
