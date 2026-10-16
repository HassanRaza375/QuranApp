<script setup lang="ts">
// "Saved prayer times": which months are saved, when they were last updated, and Update now (the atomic swap of Phase 1:
// fetch first, replace only if it succeeds, keep the old times if it fails). Used by the Prayer page and Settings.
import { useOnline } from "@vueuse/core";
import { lastUpdatedText } from "~/lib/prayerClock";

const prayer = usePrayerTimes();
const { location } = useLocation();
const online = useOnline();
const prefs = usePreferencesStore();

const fiqhName = computed(() => (prefs.prefs.fiqh === "jafari" ? "Ja’fari" : "Sunni"));
const monthLabel = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const months = computed(() => [prayer.record.value, prayer.nextRecord.value].filter(Boolean).map((r) => monthLabel(r!.month)).join(" and "));
const updated = computed(() => (prayer.record.value ? lastUpdatedText(prayer.record.value.fetchedAt, new Date(prayer.now.value)) : ""));
const updating = ref(false);
const updateMessage = ref("");

async function updateNow() {
  updating.value = true;
  updateMessage.value = "";
  await prayer.refresh();
  updating.value = false;
  const f = prayer.failure.value;
  updateMessage.value = f ? `Couldn’t update (${f.reason}). The saved times are still in use.` : `Updated just now for ${months.value}.`;
}

const savedText = computed(() => {
  if (!location.value) return "Set your location first. Prayer times are saved for the place you choose.";
  if (updating.value) return "Updating… the saved times stay in use until the new ones arrive.";
  if (prayer.status.value === "loading") return `Loading ${fiqhName.value} times…`;
  if (!prayer.record.value) return `Saved times for ${fiqhName.value}: none yet. They need a connection once.`;
  if (!online.value) return `You’re offline, so the saved times are still in use. Last updated ${updated.value}.`;
  return `Saved for ${months.value}, so prayer times work offline. Last updated ${updated.value}. The app refreshes itself when fewer than 7 days are left.`;
});
</script>

<template>
  <SettingsRow label="Saved prayer times" :desc="savedText">
    <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="!location || !online || updating" data-testid="update-now" @click="updateNow">
      <Icon name="lucide:refresh-cw" size="15" />{{ updating ? "Updating" : "Update now" }}
    </Button>
    <template #extra>
      <span v-if="!online && location" class="mt-1 block text-[12.5px] text-ink-2" data-testid="update-offline">You’re offline. Update now needs a connection.</span>
      <span v-if="updateMessage" class="mt-1 block text-[12.5px] text-ink-2" role="status" data-testid="update-message">{{ updateMessage }}</span>
    </template>
  </SettingsRow>
</template>
