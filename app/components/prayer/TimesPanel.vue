<script setup lang="ts">
// The Prayer times tab, on the Phase 1 data layer (cache first, background refresh, atomic swap). Offline level B.
import { onBeforeUnmount } from "vue";
import { useOnline } from "@vueuse/core";
import { methodName } from "~/lib/calcMethods";
import { adjustNote, hijriShown } from "~/lib/hijriAdjust";
import { formatHijri } from "~/lib/hijri";
import { countdownLabel, formatClock12, fractionBetween, zonedInstant } from "~/lib/prayerClock";
import { buildRows } from "~/lib/prayerRows";
import { PRAYERS } from "~/lib/prayerMonth";

const prefs = usePreferencesStore();
const prayer = usePrayerTimes();
const { location, loaded, load: loadLocation } = useLocation();
const online = useOnline();

const fiqhName = computed(() => (prefs.prefs.fiqh === "jafari" ? "Ja’fari" : "Sunni"));

// ---- the clock: every 30 s, and every second only while the next prayer is within a minute and a half
let timer: ReturnType<typeof setTimeout> | undefined;
function schedule() {
  clearTimeout(timer);
  const n = prayer.next.value;
  const ms = n?.at ? n.at.getTime() - Date.now() : Infinity;
  timer = setTimeout(() => {
    if (document.visibilityState === "visible") prayer.tick();
    schedule();
  }, ms < 90_000 ? 1000 : 30_000);
}
const onVisible = () => {
  if (document.visibilityState === "visible") {
    prayer.tick();
    schedule();
  }
};
onMounted(async () => {
  if (!loaded.value) loadLocation();
  if (location.value) await prayer.load();
  prayer.tick();
  schedule();
  document.addEventListener("visibilitychange", onVisible);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  document.removeEventListener("visibilitychange", onVisible);
});
watch(() => prayer.now.value, schedule);

// ---- what to show
const nowDate = computed(() => new Date(prayer.now.value));
const tz = computed(() => prayer.timezone.value);
const rows = computed(() => (prayer.today.value && tz.value ? buildRows(prayer.today.value, nowDate.value, tz.value, prayer.next.value) : []));

const next = computed(() => prayer.next.value);
const nextTime = computed(() => {
  const n = next.value;
  if (!n) return "";
  const day = n.isTomorrow ? prayer.tomorrow.value : prayer.today.value;
  return day ? formatClock12(day.timings[n.name]) : "";
});
const countdown = computed(() => (next.value?.at ? countdownLabel(next.value.at.getTime() - nowDate.value.getTime()) : ""));

// the bar between the latest prayer and the next one, drawn only when both ends are known (never guessed)
const fraction = computed(() => {
  const n = next.value;
  const day = prayer.today.value;
  if (!n?.at || !day || !tz.value) return null;
  let from: Date | null = null;
  for (const p of PRAYERS) {
    const at = zonedInstant(day.date, day.timings[p], tz.value);
    if (at.getTime() <= nowDate.value.getTime()) from = at;
  }
  return fractionBetween(from, n.at, nowDate.value);
});

const allDays = computed(() => [...(prayer.record.value?.days ?? []), ...(prayer.nextRecordDays.value ?? [])]);
const hijri = computed(() => (prayer.today.value ? hijriShown(allDays.value, prayer.today.value.date, prefs.prefs.hijriAdjust) : null));
const gregorian = computed(() => (prayer.today.value ? new Date(`${prayer.today.value.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""));

const calcText = computed(() => {
  const r = prayer.record.value;
  const name = r?.methodName || methodName(prefs.prefs.fiqh === "jafari" ? prefs.prefs.calc.jafariMethod : prefs.prefs.calc.sunniMethod);
  const asr = prefs.prefs.fiqh === "sunni" ? ` · ${prefs.prefs.calc.asr === "hanafi" ? "Hanafi" : "Standard"} Asr` : "";
  return `${name}${asr} · ${fiqhName.value}`;
});

const note = computed(() => {
  if (prayer.status.value !== "ready") return "";
  if (prayer.refreshing.value && online.value) return "Updating… the saved times stay in use until the new ones arrive.";
  if (!online.value) return "You’re offline, so the saved times are still in use.";
  if (prayer.failure.value) return `Couldn’t refresh the times (${prayer.failure.value.reason}). The saved times are still in use.`;
  return "";
});
</script>

<template>
  <div>
    <!-- no place yet -->
    <div v-if="!location" class="rounded-[10px] border border-dashed px-4 py-6" data-testid="times-no-location">
      <p class="font-serif text-[18px] font-medium">Set your location to see prayer times</p>
      <p class="mt-1 text-[13.5px] text-ink-2">Prayer times are calculated for a place. Your location stays on this device.</p>
    </div>

    <!-- loading, nothing cached -->
    <div v-else-if="prayer.status.value === 'loading'" aria-busy="true" data-testid="times-loading">
      <Skeleton class="mb-3 h-36 w-full" />
      <Skeleton v-for="i in 6" :key="i" class="mb-2 h-14 w-full" />
      <p class="sr-only" role="status">Loading {{ fiqhName }} prayer times…</p>
    </div>

    <!-- nothing cached and it failed -->
    <div v-else-if="prayer.status.value === 'failed'" class="rounded-[10px] border px-4 py-5" data-testid="times-failed">
      <p class="text-[14px]">
        {{ prayer.failure.value?.kind === "offline" ? `${fiqhName} prayer times need a connection once.${prefs.prefs.fiqh === "jafari" ? " Your Sunni times, if saved, are still on this device." : ""}` : `Couldn’t load prayer times (${prayer.failure.value?.reason}).` }}
      </p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="times-retry" @click="prayer.load()">Try again</Button>
    </div>

    <template v-else-if="prayer.today.value">
      <!-- the next prayer -->
      <section class="rounded-[10px] border bg-surface p-5 md:flex md:items-start md:justify-between md:gap-6" aria-label="Next prayer" data-testid="next-card">
        <div class="min-w-0">
          <p class="text-[11px] font-medium uppercase tracking-wide text-ink-2">Next prayer</p>
          <p class="mt-1 font-serif text-[28px] font-medium leading-tight" data-testid="next-name">
            {{ next?.name }}<span v-if="nextTime" class="ml-3 text-[20px] text-ink-2" data-testid="next-time">{{ nextTime }}</span>
          </p>
          <p v-if="next && !next.at" class="mt-1 text-[14px] text-ink-2" data-testid="next-tomorrow">Fajr, tomorrow</p>
          <p v-else-if="next" class="mt-1 text-[14px] text-ink-2" data-testid="next-countdown">{{ countdown === "now" ? "now" : `in ${countdown}` }}<span v-if="next.isTomorrow"> (tomorrow)</span></p>
          <div v-if="fraction !== null" class="mt-3 h-1 w-full max-w-xs rounded bg-border" aria-hidden="true"><i class="block h-full rounded bg-brand" :style="{ width: `${(fraction * 100).toFixed(1)}%` }" /></div>
        </div>
        <div class="mt-4 md:mt-0 md:text-right">
          <p v-if="hijri" class="text-[14px] font-medium" data-testid="hijri">{{ formatHijri(hijri.date) }}</p>
          <p v-if="hijri && hijri.applied" class="text-[12px] text-ink-2" data-testid="hijri-note">{{ adjustNote(hijri.applied) }}</p>
          <p v-else-if="hijri?.unavailable" class="text-[12px] text-ink-2" data-testid="hijri-unavailable">Your {{ prefs.prefs.hijriAdjust > 0 ? "+" : "−" }}{{ Math.abs(prefs.prefs.hijriAdjust) }} day adjustment is shown when the neighbouring day is saved.</p>
          <p class="text-[13px] text-ink-2" data-testid="gregorian">{{ gregorian }}</p>
        </div>
      </section>

      <PrayerScheduleList :rows="rows" />

      <p v-if="note" class="mt-3 text-[12.5px] text-ink-2" role="status" data-testid="times-note">{{ note }}</p>
    </template>

    <!-- a month is saved but today is not in it (a place far from the device's day, or a very old cache) -->
    <div v-else-if="location" class="rounded-[10px] border px-4 py-5" data-testid="times-no-today">
      <p class="text-[14px]">Today’s times are not in the saved month yet.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" @click="prayer.load()">Try again</Button>
    </div>

    <h2 class="sr-only">Calculation, location and saved times</h2>
    <SettingsGroup class="mt-4">
      <SettingsRow label="Calculation" :desc="calcText">
        <NuxtLink to="/settings?section=prayer" class="inline-flex min-h-11 items-center rounded-md border px-3 text-[12.5px] md:min-h-9" data-testid="calc-change">Change</NuxtLink>
      </SettingsRow>
      <PrayerLocationRow />
      <PrayerSavedRow />
    </SettingsGroup>
  </div>
</template>
