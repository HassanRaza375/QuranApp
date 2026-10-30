<script setup lang="ts">
// English, Urdu or both. Urdu shows only where the marja's own official Urdu book has the ruling (decision R1); nothing is translated by the app.
import { URDU } from "~/lib/fiqh/ui";
import type { FiqhLang } from "~/lib/fiqh/visibility";

const { lang, setLang } = useFiqh();
const options = [
  { value: "en", label: "English" },
  { value: "ur", label: URDU },
  { value: "both", label: "Both" },
];
</script>

<template>
  <SettingsSegmentedControl :model-value="lang" :options="options" label="Reading language" data-testid="fiqh-lang" @update:model-value="(v) => setLang(v as FiqhLang)" />
</template>
