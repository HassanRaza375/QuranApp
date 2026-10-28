<script setup lang="ts">
// The four tiles: Next prayer, Qibla, Today's goal, Hifz.
import { countdownText } from "~/lib/prayerClock";
import { qiblaBearing } from "~/lib/qibla";

const { state } = useHomeState();
const { location, asking, error, requestDevice } = useLocation();
const prayer = usePrayerTimes();

const nextValue = computed(() => {
  if (prayer.status.value === "failed") return prayer.failure.value?.kind === "offline" ? "Needs a connection" : "Unavailable";
  const n = prayer.next.value;
  if (!n) return prayer.status.value === "ready" ? "Unavailable" : "";
  if (!n.at) return `${n.name} · tomorrow`;
  return `${n.name} · ${countdownText(n.at.getTime() - prayer.now.value)}`;
});
const prayerBusy = computed(() => prayer.status.value === "loading" || (prayer.status.value === "ready" && !prayer.next.value && prayer.refreshing.value));

const qibla = computed(() => (location.value ? `${Math.round(qiblaBearing(location.value.lat, location.value.lon))}°` : ""));
const goal = computed(() => (state.value?.goal ? `${state.value.goal.count} / ${state.value.goal.target} ayahs` : "Not set"));
const hifz = computed(() => (state.value?.hifz !== "has-data" ? "Not started" : state.value.hifzDue > 0 ? `${state.value.hifzDue} to practice` : "Open Hifz"));

async function setLocation() {
  if (await requestDevice()) await prayer.load();
}
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-2.5 md:grid-cols-4" data-testid="util-strip">
      <HomeTile v-if="!location" label="Next prayer" testid="tile-prayer" @click="setLocation">{{ asking ? "Asking…" : "Set location" }}</HomeTile>
      <HomeTile v-else label="Next prayer" to="/prayerTime" :value="nextValue" :busy="prayerBusy" testid="tile-prayer" />

      <HomeTile v-if="!location" label="Qibla" testid="tile-qibla" @click="setLocation">{{ asking ? "Asking…" : "Set location" }}</HomeTile>
      <HomeTile v-else label="Qibla" to="/qibla-direction" :value="qibla" testid="tile-qibla" />

      <HomeTile label="Today’s goal" to="/goals" :value="goal" testid="tile-goal" />
      <HomeTile label="Hifz" to="/hifz" :value="hifz" testid="tile-hifz" />
    </div>
    <p v-if="error" class="mt-2 text-[12.5px] text-ink-2" role="status" data-testid="location-error">{{ error }}</p>
  </div>
</template>
