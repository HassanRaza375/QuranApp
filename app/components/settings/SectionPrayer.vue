<script setup lang="ts">
// Prayer & location: fiqh, calculation method, Asr school, Hijri adjustment, the Daily Fiqh marja', the place, and the
// saved prayer times with Update now. No silent default city: with no place the page says "Set location".
import { MARAJI } from "@legacy/data/wajibat/marja";
import { useOnline } from "@vueuse/core";
import type { Segment } from "./SegmentedControl.vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { methodsFor } from "~/lib/calcMethods";
import { formatHijri, hijriPreview } from "~/lib/hijri";
import { dateKeyInZone, lastUpdatedText } from "~/lib/prayerClock";

const store = usePreferencesStore();
const p = computed(() => store.prefs);
const prayer = usePrayerTimes();
const { location, loaded, asking, error: locationError, load: loadLocation, requestDevice } = useLocation();
const online = useOnline();

const fiqhOptions: Segment[] = [
  { value: "sunni", label: "Sunni" },
  { value: "jafari", label: "Ja’fari" },
];
const asrOptions: Segment[] = [
  { value: "standard", label: "Standard" },
  { value: "hanafi", label: "Hanafi" },
];
const hijriOptions: Segment[] = [-2, -1, 0, 1, 2].map((d) => ({ value: String(d), label: d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : "0" }));

const methodOptions = computed<MenuOption[]>(() => methodsFor(p.value.fiqh).map((m) => ({ value: String(m.id), label: m.name })));
const methodValue = computed(() => String(p.value.fiqh === "jafari" ? p.value.calc.jafariMethod : p.value.calc.sunniMethod));
const setMethod = (v: string) => store.set("calc", { ...p.value.calc, ...(p.value.fiqh === "jafari" ? { jafariMethod: Number(v) } : { sunniMethod: Number(v) }) });

const marjaOptions: MenuOption[] = [
  { value: "", label: "Not chosen yet" },
  ...MARAJI.map((m) => ({ value: m.id, label: m.status === "pending-sources" ? `${m.name.en} (rulings being added)` : m.name.en })),
];

const fiqhName = computed(() => (p.value.fiqh === "jafari" ? "Ja’fari" : "Sunni"));

onMounted(async () => {
  if (!loaded.value) loadLocation();
  if (location.value) await prayer.load();
});

/* ---- Hijri preview, read from the cached months ---- */
const preview = computed(() => {
  const tz = prayer.timezone.value;
  if (!tz) return null;
  const days = [...(prayer.record.value?.days ?? []), ...(prayer.nextRecordDays.value ?? [])];
  return hijriPreview(days, dateKeyInZone(new Date(prayer.now.value), tz), p.value.hijriAdjust);
});

/* ---- place ---- */
const place = computed(() => (location.value ? `${location.value.lat.toFixed(2)}, ${location.value.lon.toFixed(2)}` : ""));
async function useMyLocation() {
  if (await requestDevice()) await prayer.load();
}

/* ---- saved prayer times ---- */
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
  return `Saved for ${months.value}, so Home works offline. Last updated ${updated.value}. The app refreshes itself when fewer than 7 days are left.`;
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Calculation</h3>
      <SettingsGroup>
        <SettingsRow label="Fiqh school" desc="Changes how Fajr, Dhuhr, Asr, Maghrib and Isha are calculated. Applied instantly and used everywhere prayer times appear.">
          <template #default="{ labelId }">
            <SettingsSegmentedControl :model-value="p.fiqh" :options="fiqhOptions" label="Fiqh school" :labelledby="labelId" @update:model-value="(v) => store.set('fiqh', v as 'sunni' | 'jafari')" />
          </template>
        </SettingsRow>
        <SettingsRow label="Calculation method">
          <ResponsiveMenu :model-value="methodValue" :options="methodOptions" label="Calculation method" @update:model-value="setMethod" />
        </SettingsRow>
        <SettingsRow v-if="p.fiqh === 'sunni'" label="Asr calculation" desc="Hanafi uses the later Asr time, when a shadow is twice the object’s length.">
          <template #default="{ labelId }">
            <SettingsSegmentedControl :model-value="p.calc.asr" :options="asrOptions" label="Asr calculation" :labelledby="labelId" @update:model-value="(v) => store.set('calc', { ...p.calc, asr: v as 'standard' | 'hanafi' })" />
          </template>
        </SettingsRow>
        <SettingsRow label="Hijri date adjustment" desc="Shift the Islamic calendar by a day to match your local moon sighting.">
          <template #default="{ labelId }">
            <SettingsSegmentedControl :model-value="String(p.hijriAdjust)" :options="hijriOptions" label="Hijri date adjustment" :labelledby="labelId" @update:model-value="(v) => store.set('hijriAdjust', Number(v))" />
          </template>
          <template #extra>
            <span v-if="preview" class="mt-1 block text-[12.5px] text-ink-2" data-testid="hijri-preview">
              Today: {{ formatHijri(preview.today) }}<template v-if="p.hijriAdjust !== 0">. With your adjustment: {{ formatHijri(preview.adjusted) }}</template>.
            </span>
          </template>
        </SettingsRow>
        <SettingsRow v-if="p.fiqh === 'jafari'" label="Marja’ for Daily Fiqh rulings" desc="Which marja’s rulings the Daily Fiqh pages show. This is separate from the calculation method above.">
          <ResponsiveMenu :model-value="p.marjaId ?? ''" :options="marjaOptions" label="Marja’ for Daily Fiqh rulings" @update:model-value="(v) => store.set('marjaId', v || null)" />
        </SettingsRow>
      </SettingsGroup>
    </div>

    <div>
      <h3 class="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Location</h3>
      <SettingsGroup>
        <SettingsRow label="Location" :desc="location ? `Using your saved place (${place}). It stays on this device.` : 'Not set yet. Prayer times and Qibla direction need your location.'">
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="asking" :aria-busy="asking" data-testid="use-location" @click="useMyLocation">
            <Icon name="lucide:map-pin" size="15" />{{ asking ? "Asking…" : location ? "Use my location" : "Set location" }}
          </Button>
          <template #extra>
            <span v-if="locationError" class="mt-1 block text-[12.5px] text-destructive" role="status" data-testid="location-error">{{ locationError }}</span>
          </template>
        </SettingsRow>
        <SettingsRow label="Saved prayer times" :desc="savedText">
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="!location || !online || updating" data-testid="update-now" @click="updateNow">
            <Icon name="lucide:refresh-cw" size="15" />{{ updating ? "Updating" : "Update now" }}
          </Button>
          <template #extra>
            <span v-if="!online && location" class="mt-1 block text-[12.5px] text-ink-2" data-testid="update-offline">You’re offline. Update now needs a connection.</span>
            <span v-if="updateMessage" class="mt-1 block text-[12.5px] text-ink-2" role="status" data-testid="update-message">{{ updateMessage }}</span>
          </template>
        </SettingsRow>
      </SettingsGroup>
    </div>
  </div>
</template>
