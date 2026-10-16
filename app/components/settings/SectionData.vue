<script setup lang="ts">
// Data & privacy: storage use, Export, Reset settings (with Undo), Clear all local data (with a confirmation).
import { closeRevampDb, deleteDatabase } from "~/db/revampDb";
import { buildExport, clearAllLocalData, exportFileName, resetSettings, restoreSettings } from "~/lib/settingsData";

const store = usePreferencesStore();
const undo = useUndoToast();

/* ---- storage use (real figure from the browser, covering IndexedDB and Cache Storage together) ---- */
const usage = ref("");
const formatBytes = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
onMounted(async () => {
  try {
    const est = await navigator.storage?.estimate?.();
    usage.value = est?.usage != null ? `About ${formatBytes(est.usage)} used by this site${est.quota ? ` of ${formatBytes(est.quota)} available` : ""}.` : "Not reported by this browser.";
  } catch {
    usage.value = "Not reported by this browser.";
  }
});

/* ---- export ---- */
const exportMessage = ref("");
function exportData() {
  const name = exportFileName(new Date());
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  exportMessage.value = `Saved ${name}.`;
}

/* ---- reset settings: no confirm, an Undo toast ---- */
function reset() {
  const before = resetSettings();
  store.reloadAll();
  undo.withUndo("Settings restored to their defaults", () => {
    restoreSettings(before);
    store.reloadAll();
  });
}

/* ---- clear all: an inline confirmation that says exactly what happens ---- */
const confirming = ref(false);
const cancelButton = ref<{ $el?: HTMLElement } | null>(null);
const clearing = ref(false);
async function ask() {
  confirming.value = true;
  await nextTick();
  (cancelButton.value?.$el ?? (cancelButton.value as unknown as HTMLElement | null))?.focus?.();
}
async function clearAll() {
  clearing.value = true;
  await closeRevampDb();
  await clearAllLocalData(deleteDatabase);
  location.reload();
}
</script>

<template>
  <div class="space-y-4">
    <p class="rounded-[10px] bg-sunken px-4 py-3 text-[13px] text-ink-2">Everything in this app is stored locally on this device. Nothing is uploaded anywhere.</p>

    <SettingsGroup>
      <SettingsRow label="Offline data and audio" :desc="usage || 'Checking…'">
        <NuxtLink to="/downloads" class="inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-[13.5px] font-medium hover:bg-accent md:min-h-9" data-testid="manage-downloads">
          <Icon name="lucide:download" size="15" />Manage downloads
        </NuxtLink>
      </SettingsRow>
      <SettingsRow label="Export my data" desc="Save your bookmarks, goals, Hifz progress and settings as a file. It includes your saved places.">
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" data-testid="export" @click="exportData"><Icon name="lucide:download" size="15" />Export</Button>
        <template #extra>
          <span v-if="exportMessage" class="mt-1 block text-[12.5px] text-ink-2" role="status" data-testid="export-message">{{ exportMessage }}</span>
        </template>
      </SettingsRow>
      <SettingsRow label="Place search" desc="Entering a city sends only the city you type to Open-Meteo’s place search, when you press Search. Prayer times are fetched from AlAdhan for your saved place. Nothing else leaves this device." data-testid="privacy-place-search">
        <a href="https://open-meteo.com/" class="inline-flex min-h-11 items-center text-[12.5px] text-brand underline md:min-h-9" target="_blank" rel="noopener noreferrer">Place search by Open-Meteo.com, with location data from GeoNames</a>
      </SettingsRow>
      <SettingsRow label="Reset settings" desc="Restore every setting to its default. Your bookmarks, progress, saved place and Daily Fiqh marja’ are kept.">
        <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="reset" @click="reset">Reset settings</Button>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup>
      <div v-if="confirming" class="space-y-3 px-4 py-4" role="group" aria-label="Confirm: clear all local data" data-testid="clear-confirm" @keydown.esc="confirming = false">
        <p class="text-[14px] font-medium">Clear all local data on this device? This can’t be undone.</p>
        <div class="space-y-1.5 text-[13px] text-ink-2">
          <p><span class="font-medium text-foreground">This removes:</span> your settings, bookmarks, notes and collections, reading goals and progress, Hifz progress, reminders, tasbeeh counts, saved places, and the saved prayer times.</p>
          <p>
            <span class="font-medium text-foreground">This stays:</span> downloaded audio and cached Qur’an text stay on this device. Remove audio under
            <NuxtLink to="/downloads" class="text-brand underline" data-testid="confirm-downloads-link">Manage downloads</NuxtLink>.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button ref="cancelButton" variant="outline" class="min-h-11 md:min-h-9" data-testid="clear-cancel" @click="confirming = false">Cancel</Button>
          <Button class="min-h-11 bg-destructive text-background hover:bg-destructive/90 md:min-h-9" :disabled="clearing" data-testid="clear-yes" @click="clearAll">Yes, delete everything</Button>
        </div>
      </div>
      <SettingsRow v-else label="Clear all local data" desc="Permanently deletes your settings, bookmarks, notes, progress and saved prayer times from this device. Downloaded audio stays.">
        <Button variant="destructive" class="min-h-11 gap-2 md:min-h-9" data-testid="clear" @click="ask"><Icon name="lucide:trash-2" size="15" />Clear all data</Button>
      </SettingsRow>
    </SettingsGroup>

    <p class="px-1 text-[12.5px] text-ink-2"><NuxtLink to="/about" class="underline">About</NuxtLink> · <NuxtLink to="/sitemap" class="underline">Sitemap</NuxtLink> · © 2026 Quran App</p>
  </div>
</template>
