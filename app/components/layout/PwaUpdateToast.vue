<script setup lang="ts">
// registerType is "prompt" (same as the legacy app): a new service worker waits until the user opts in, so the
// app never swaps under someone mid-read. The notice is a persistent toast with a Reload action.
import { toast } from "vue-sonner";

const { $pwa } = useNuxtApp();
let toastId: string | number | undefined;

watch(
  () => $pwa?.needRefresh,
  (need) => {
    if (need && toastId === undefined) {
      toastId = toast("A new version of Quran App is available.", {
        duration: Infinity,
        action: { label: "Reload", onClick: () => $pwa?.updateServiceWorker(true) },
        cancel: { label: "Later", onClick: () => $pwa?.cancelPrompt() },
        onDismiss: () => {
          toastId = undefined;
        },
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <span hidden />
</template>
