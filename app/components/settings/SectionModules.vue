<script setup lang="ts">
const store = usePreferencesStore();
</script>

<template>
  <SettingsGroup>
    <SettingsRow
      inline
      label="Show literary modules in the sidebar"
      desc="Extra sections for community-contributed literary study modules (for example, Mir Anis) as they are added. Off by default so the sidebar stays uncluttered."
    >
      <template #default="{ labelId }">
        <Switch :model-value="store.prefs.literaryModules" :aria-labelledby="labelId" @update:model-value="(v) => store.set('literaryModules', !!v)" />
      </template>
    </SettingsRow>
  </SettingsGroup>
</template>
