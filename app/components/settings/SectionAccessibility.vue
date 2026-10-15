<script setup lang="ts">
const store = usePreferencesStore();
const p = computed(() => store.prefs);
</script>

<template>
  <div>
    <SettingsGroup>
      <SettingsRow inline label="Reduce motion" desc="Turns off animations and transitions.">
        <template #default="{ labelId }"><Switch :model-value="p.reducedMotion" :aria-labelledby="labelId" @update:model-value="(v) => store.set('reducedMotion', !!v)" /></template>
      </SettingsRow>
      <SettingsRow inline label="High contrast" desc="Stronger text and border contrast.">
        <template #default="{ labelId }"><Switch :model-value="p.highContrast" :aria-labelledby="labelId" @update:model-value="(v) => store.set('highContrast', !!v)" /></template>
      </SettingsRow>
      <SettingsRow inline label="Larger touch targets" desc="Bigger tap areas for buttons and menu rows.">
        <template #default="{ labelId }"><Switch :model-value="p.largeTouchTargets" :aria-labelledby="labelId" @update:model-value="(v) => store.set('largeTouchTargets', !!v)" /></template>
      </SettingsRow>
    </SettingsGroup>
    <p class="mt-3 px-1 text-[13px] text-ink-2">Arabic text size is under <NuxtLink class="text-brand underline" to="/settings?section=reading">Reading</NuxtLink>.</p>
  </div>
</template>
