<script setup lang="ts">
// Prayer & location: fiqh, calculation method, Asr school, Hijri adjustment, the Daily Fiqh marja', the place, and the
// saved prayer times with Update now. No silent default city: with no place the page says "Set location".
import { MARAJI } from "@legacy/data/wajibat/marja";
import type { Segment } from "./SegmentedControl.vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { methodsFor } from "~/lib/calcMethods";
import { formatHijri, hijriPreview } from "~/lib/hijri";
import { dateKeyInZone } from "~/lib/prayerClock";

const store = usePreferencesStore();
const p = computed(() => store.prefs);
const prayer = usePrayerTimes();
const { location, loaded, load: loadLocation } = useLocation();

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
        <SettingsRow v-if="p.fiqh === 'sunni'" label="Asr calculation" desc="Hanafi uses the later Asr time.">
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
        <PrayerLocationRow />
        <PrayerSavedRow />
      </SettingsGroup>
    </div>
  </div>
</template>
