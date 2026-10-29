<script setup lang="ts">
// Settings (prototype d-page-settings / m-page-settings): eight sections. Desktop: a section list on the left.
// Mobile: a section picker. The section is in the URL (`?section=prayer`), so links and the back button work.
// Every control reads and writes the global preferences store (legacy keys and formats); the page keeps no copy.
import type { MenuOption } from "~/components/ResponsiveMenu.vue";

useSeoMeta({ title: "Settings · Quran App", robots: "noindex, follow" });

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: "lucide:palette" },
  { id: "reading", label: "Reading", icon: "lucide:book-open" },
  { id: "audio", label: "Audio", icon: "lucide:volume-2" },
  { id: "prayer", label: "Prayer & location", icon: "lucide:map-pin" },
  { id: "notifications", label: "Notifications", icon: "lucide:bell" },
  { id: "accessibility", label: "Accessibility", icon: "lucide:accessibility" },
  { id: "data", label: "Data & privacy", icon: "lucide:shield" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const route = useRoute();
const router = useRouter();
const current = computed<SectionId>(() => {
  const q = Array.isArray(route.query.section) ? route.query.section[0] : route.query.section;
  return SECTIONS.find((s) => s.id === q)?.id ?? "appearance";
});
const currentLabel = computed(() => SECTIONS.find((s) => s.id === current.value)!.label);
const go = (id: string) => router.replace({ path: "/settings", query: id === "appearance" ? {} : { section: id } });
const pickerOptions: MenuOption[] = SECTIONS.map((s) => ({ value: s.id, label: s.label, icon: s.icon }));
</script>

<template>
  <div>
    <h1 class="sr-only">Settings</h1>

    <!-- mobile: the section picker -->
    <div class="mb-5 md:hidden">
      <ResponsiveMenu :model-value="current" :options="pickerOptions" label="Settings section" title="Settings section" @update:model-value="go">
        <template #trigger="{ current: cur }">
          <Button variant="outline" class="min-h-11 w-full justify-between gap-2" aria-label="Settings section" data-testid="section-picker">
            <span class="flex items-center gap-2"><Icon :name="cur?.icon ?? 'lucide:settings'" size="16" />{{ cur?.label }}</span>
            <Icon name="lucide:chevron-down" size="14" class="text-ink-2" />
          </Button>
        </template>
      </ResponsiveMenu>
    </div>

    <div class="md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
      <!-- desktop: the section list -->
      <nav class="hidden md:block" aria-label="Settings sections">
        <ul class="sticky top-20 space-y-0.5">
          <li v-for="s in SECTIONS" :key="s.id">
            <button
              type="button"
              class="relative flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-[13.5px] text-ink-2 hover:bg-accent hover:text-foreground"
              :class="current === s.id ? 'bg-accent font-medium text-foreground' : ''"
              :aria-current="current === s.id ? 'page' : undefined"
              :data-testid="`section-${s.id}`"
              @click="go(s.id)"
            >
              <span v-if="current === s.id" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
              <Icon :name="s.icon" size="16" :class="current === s.id ? 'text-brand' : 'text-ink-2'" />{{ s.label }}
            </button>
          </li>
        </ul>
      </nav>

      <section :aria-labelledby="'section-title'" class="min-w-0">
        <h2 id="section-title" class="font-serif text-[22px] font-medium" data-testid="section-title">{{ currentLabel }}</h2>
        <p class="mb-4 mt-0.5 text-[13px] text-ink-2">Changes save automatically on this device.</p>
        <SettingsSectionAppearance v-if="current === 'appearance'" />
        <SettingsSectionReading v-else-if="current === 'reading'" />
        <SettingsSectionAudio v-else-if="current === 'audio'" />
        <SettingsSectionPrayer v-else-if="current === 'prayer'" />
        <SettingsSectionNotifications v-else-if="current === 'notifications'" />
        <SettingsSectionAccessibility v-else-if="current === 'accessibility'" />
        <SettingsSectionData v-else />
      </section>
    </div>
  </div>
</template>
