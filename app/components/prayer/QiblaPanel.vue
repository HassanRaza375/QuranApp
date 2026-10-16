<script setup lang="ts">
// The Qibla tab. Offline level A: the bearing is calculated on the device and the compass needs no network; it only needs a
// saved place. See docs/phases/phase-05-prayer-qibla.md.
import { cardinal16 } from "~/lib/compass";
import { VALID_UNTIL_TEXT } from "~/lib/declination";
import { qiblaBearing } from "~/lib/qibla";

const { location, loaded, load: loadLocation } = useLocation();
const bearing = computed(() => (location.value ? qiblaBearing(location.value.lat, location.value.lon) : null));
const compass = useCompass(bearing, computed(() => (location.value ? { lat: location.value.lat, lon: location.value.lon } : null)));

onMounted(() => {
  if (!loaded.value) loadLocation();
  if (location.value) compass.start();
});
// a place chosen on this page starts the compass (an iPhone still waits for its tap)
watch(
  () => location.value?.updatedAt,
  () => {
    if (location.value && compass.mode.value === "idle") compass.start();
  },
);

const live = computed(() => compass.mode.value === "live");
const declinationText = computed(() => {
  const r = compass.declinationResult.value;
  if (!r) return "";
  if (r.ok) return `Corrected for your location (${Math.abs(r.degrees).toFixed(1)}° ${r.degrees >= 0 ? "east" : "west"}) using the World Magnetic Model, valid to ${VALID_UNTIL_TEXT}.`;
  return "Not corrected for magnetic declination: the World Magnetic Model is not available for this date or place, so the compass points to magnetic north.";
});
</script>

<template>
  <div>
    <div v-if="!location || bearing === null" data-testid="qibla-no-location">
      <div class="rounded-[10px] border border-dashed px-4 py-6">
        <p class="font-serif text-[18px] font-medium">Set your location to find the Qibla</p>
        <p class="mt-1 text-[13.5px] text-ink-2">The direction is calculated on this device from your location. It works offline once a place is saved.</p>
      </div>
      <SettingsGroup class="mt-4"><PrayerLocationRow /></SettingsGroup>
    </div>

    <template v-else>
      <div class="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
        <PrayerQiblaCompass :bearing="bearing" :heading="compass.heading.value" :aligned="compass.aligned.value" :live="live" />

        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-ink-2">Qibla bearing</p>
          <p class="font-serif text-[36px] font-medium leading-tight" data-testid="bearing">{{ bearing.toFixed(1) }}°</p>
          <p class="text-[14px] text-ink-2" data-testid="cardinal">{{ cardinal16(bearing) }}, measured from true north</p>

          <!-- live facing status: a polite live region, updated at most about once a second -->
          <p v-if="live" class="mt-3 inline-flex min-h-6 items-center gap-1.5 text-[15px] font-medium" :class="compass.aligned.value ? 'text-brand' : ''" role="status" aria-live="polite" data-testid="facing-status">
            <Icon v-if="compass.aligned.value" name="lucide:check" size="16" />{{ compass.status.value }}
          </p>

          <div v-if="compass.mode.value === 'needs-permission'" class="mt-4 rounded-[10px] border p-4" data-testid="compass-permission">
            <p class="text-[14px] font-medium">Use your phone’s compass</p>
            <p class="mt-1 text-[13px] text-ink-2">Your browser asks for permission to read the phone’s motion and orientation sensors. They are used only to point the dial and nothing is sent anywhere.</p>
            <Button class="mt-3 min-h-11 md:min-h-9" data-testid="enable-compass" @click="compass.enable()">Enable compass</Button>
          </div>
          <p v-else-if="compass.mode.value === 'denied'" class="mt-4 rounded-[10px] border p-4 text-[13.5px]" role="status" data-testid="compass-denied">
            Compass access was declined, so the dial is fixed. To allow it, quit and reopen your browser, then tap Enable compass and choose Allow (on an iPhone: Settings, then Safari, then Motion &amp; Orientation Access). Meanwhile face {{ bearing.toFixed(0) }}° ({{ cardinal16(bearing) }}) from north.
            <Button class="mt-3 block min-h-11 md:min-h-9" variant="outline" data-testid="enable-compass-again" @click="compass.enable()">Try again</Button>
          </p>
          <p v-else-if="compass.mode.value === 'starting'" class="mt-4 text-[13.5px] text-ink-2" role="status" data-testid="compass-starting">Looking for the compass…</p>
          <p v-else-if="compass.mode.value === 'no-sensor'" class="mt-4 rounded-[10px] border p-4 text-[13.5px]" data-testid="compass-none">
            This device has no compass, so the dial is fixed with north at the top. Face {{ bearing.toFixed(0) }}° ({{ cardinal16(bearing) }}) from north, or open this page on a phone for a live compass.
          </p>

          <template v-if="live">
            <p v-if="compass.note.value" class="mt-3 text-[13px] text-ink-2" data-testid="compass-note">{{ compass.note.value }}</p>
            <p class="mt-3 text-[12.5px] text-ink-2" data-testid="declination-note">{{ declinationText }}</p>
          </template>
          <p class="mt-3 text-[12.5px] text-ink-2" data-testid="interference-note">
            The compass may be a few degrees off, especially near metal, magnets or electronics. Hold the phone flat and away from them. Phone compasses can be off by 10° or more.
          </p>
        </div>
      </div>
      <SettingsGroup class="mt-6"><PrayerLocationRow /></SettingsGroup>
    </template>
  </div>
</template>
