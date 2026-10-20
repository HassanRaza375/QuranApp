<script setup lang="ts">
// Home (prototype d-page-home / m-page-home). Offline level A for the page, B for the ayah and the prayer times.
import { onBeforeUnmount } from "vue";

useSeoMeta({
  title: "Quran App",
  description: "A local-first Quran companion: reading, translations, tafsir, audio, prayer times and more.",
});

const location = useLocation();
const home = useHomeState();
const prayer = usePrayerTimes();
const ramadan = useRamadan();

let timer: ReturnType<typeof setInterval> | undefined;
const onVisible = () => {
  if (document.visibilityState === "visible") prayer.tick();
};

onMounted(async () => {
  location.load();
  void home.load();
  await prayer.load();
  void ramadan.loadForHome(); // saved data only, except in Sha'ban, when Ramadan is fetched ahead
  // Minute precision is enough for the countdown; update every 30 seconds, and straight away when the tab comes back.
  timer = setInterval(() => {
    if (document.visibilityState === "visible") prayer.tick();
  }, 30_000);
  document.addEventListener("visibilitychange", onVisible);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", onVisible);
});

// If the day rolls over while the page is open and today's times are missing, load again.
watch(
  () => prayer.today.value,
  (t) => {
    if (!t && prayer.status.value === "ready" && !prayer.refreshing.value) void prayer.load();
  },
);
</script>

<template>
  <div>
    <h1 class="sr-only">Home</h1>
    <HomeAyahOfDay />
    <HomeRamadanBanner />
    <HomeResumeCard />
    <HomeUtilStrip />
    <HomePrayerSchedule />
  </div>
</template>
