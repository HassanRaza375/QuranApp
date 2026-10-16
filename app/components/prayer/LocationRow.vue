<script setup lang="ts">
// The Location row: where prayer times and Qibla are calculated for. Used by the Prayer page, the Qibla tab and Settings.
// No default city, ever: with no place it says "Set location". The device position is asked for only after a tap.
const prayer = usePrayerTimes();
const { location, loaded, asking, error: locationError, load: loadLocation, requestDevice } = useLocation();
const emit = defineEmits<{ changed: [] }>();
const entering = ref(false);

onMounted(() => {
  if (!loaded.value) loadLocation();
});

const place = computed(() => (location.value ? describePlace(location.value) : ""));
const desc = computed(() => {
  const l = location.value;
  if (!l) return "Not set yet. Prayer times and Qibla direction need your location.";
  if (l.source === "manual") return `Using the place you chose: ${place.value}. It stays on this device.`;
  return `Using your saved place (${place.value}). It stays on this device.`;
});

async function useMyLocation() {
  if (await requestDevice()) {
    await prayer.load();
    emit("changed");
  }
}
async function onSaved() {
  entering.value = false;
  await prayer.load();
  emit("changed");
}
</script>

<template>
  <div>
    <SettingsRow label="Location" :desc="desc">
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="asking" :aria-busy="asking" data-testid="use-location" @click="useMyLocation">
          <Icon name="lucide:map-pin" size="15" />{{ asking ? "Asking…" : location ? "Use my location" : "Set location" }}
        </Button>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-expanded="entering" data-testid="enter-city" @click="entering = !entering">
          <Icon name="lucide:search" size="15" />Enter a city
        </Button>
      </div>
      <template #extra>
        <span v-if="locationError" class="mt-1 block text-[12.5px] text-destructive" role="status" data-testid="location-error">{{ locationError }}</span>
      </template>
    </SettingsRow>
    <div v-if="entering" class="px-4 pb-4"><PrayerCityEntry @saved="onSaved" @cancel="entering = false" /></div>
  </div>
</template>
