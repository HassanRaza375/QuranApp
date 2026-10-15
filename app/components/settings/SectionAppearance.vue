<script setup lang="ts">
import type { Segment } from "./SegmentedControl.vue";

const store = usePreferencesStore();
const themes: Segment[] = [
  { value: "light", label: "Light", icon: "lucide:sun" },
  { value: "dark", label: "Dark", icon: "lucide:moon" },
  { value: "system", label: "System", icon: "lucide:monitor" },
];
</script>

<template>
  <SettingsGroup>
    <SettingsRow label="Theme" desc="Light is the default. System follows your device setting.">
      <template #default="{ labelId }">
        <SettingsSegmentedControl :model-value="store.prefs.theme" :options="themes" label="Theme" :labelledby="labelId" @update:model-value="(v) => store.set('theme', v as 'light' | 'dark' | 'system')" />
      </template>
    </SettingsRow>
  </SettingsGroup>
</template>
