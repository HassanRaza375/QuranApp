<script setup lang="ts">
// Ramadan (prototype d-page-ramadan / m-page-ramadan): Today and Timetable (8A) and Events (8B). Everything comes from the calendar service's Hijri
// month, the cached prayer months and the legacy record, with the Settings Hijri adjustment applied in the app. Events (8B) place the legacy events on the calendar service's days.
// See docs/phases/phase-08a-ramadan.md.
import { onBeforeUnmount } from "vue";

useSeoMeta({ title: "Ramadan · Quran App", description: "Ramadan day, suhoor and iftar times, a private fasting tracker, Laylat al-Qadr, and Islamic events." });

const route = useRoute();
const router = useRouter();
const prefs = usePreferencesStore();
const location = useLocation();
const prayer = usePrayerTimes();
const ramadan = useRamadan();

const TABS = [
  { id: "today", label: "Today" },
  { id: "timetable", label: "Timetable" },
  { id: "events", label: "Events" },
] as const;
const tab = computed(() => (route.query.tab === "timetable" ? "timetable" : route.query.tab === "events" ? "events" : "today"));
const setTab = (t: string) => void router.replace({ query: t === "today" ? {} : { tab: t } });

let timer: ReturnType<typeof setInterval> | undefined;
const onVisible = () => {
  if (document.visibilityState === "visible") prayer.tick();
};
async function boot() {
  location.load();
  await prayer.load();
  await ramadan.load({ network: true, times: tab.value === "timetable" });
}
onMounted(async () => {
  await boot();
  timer = setInterval(() => {
    if (document.visibilityState === "visible") prayer.tick();
  }, 30_000);
  document.addEventListener("visibilitychange", onVisible);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", onVisible);
});

// Changing the fiqh or the calculation method means the saved months in memory are for something else.
watch(
  () => [prefs.prefs.fiqh, prefs.prefs.calc.sunniMethod, prefs.prefs.calc.jafariMethod, prefs.prefs.calc.asr, prefs.prefs.hijriAdjust] as const,
  async (n, o) => {
    if (n.join() === o.join()) return;
    await prayer.load();
    await ramadan.load({ network: true, times: true });
  },
);
watch(tab, (t) => {
  if (t === "timetable" && ramadan.timesState.value !== "ready" && ramadan.plan.value.start) void ramadan.loadTimes();
});

const onFiqh = (v: string) => prefs.set("fiqh", v as "sunni" | "jafari");
</script>

<template>
  <section>
    <h1 class="font-serif text-[28px] font-medium">Ramadan</h1>
    <p class="mt-1 text-[14px] text-ink-2">Suhoor and iftar times, a private fasting tracker, and the nights to seek Laylat al-Qadr. Stored on this device.</p>

    <div class="mt-4 flex flex-wrap items-center gap-3" data-testid="following">
      <span id="following-label" class="text-[13px] text-ink-2">Following</span>
      <SettingsSegmentedControl
        :model-value="prefs.prefs.fiqh"
        :options="[{ value: 'sunni', label: 'Sunni' }, { value: 'jafari', label: 'Ja’fari' }]"
        label="Fiqh school"
        labelledby="following-label"
        @update:model-value="onFiqh"
      />
    </div>

    <nav aria-label="Ramadan views" class="mt-4 flex border-b" data-testid="ramadan-tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="t.id === tab ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="t.id === tab ? 'page' : undefined"
        :data-testid="`tab-${t.id}`"
        @click="setTab(t.id)"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="mt-4">
      <RamadanTodayPanel v-if="tab === 'today'" />
      <RamadanTimetablePanel v-else-if="tab === 'timetable'" />
      <RamadanEventsPanel v-else />
    </div>
  </section>
</template>
