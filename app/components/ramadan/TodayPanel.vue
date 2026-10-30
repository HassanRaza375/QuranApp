<script setup lang="ts">
// Ramadan, Today: before (when it begins), during (the day, the times, iftar countdown, tracker, Khatmah, Laylat al-Qadr, the Qur'anic dua)
// and the states when the dates are not available. Wording is neutral: the times are the cached prayer times for the chosen method; nothing
// states a ruling.
import { adjustNote } from "~/lib/hijriAdjust";
import { countdownLabel, formatClock12, fractionBetween, zonedInstant } from "~/lib/prayerClock";
import { methodName } from "~/lib/calcMethods";
import { expectedText, relativeDays, traditionOf, visible } from "~/lib/islamicEvents";
import { basisLine, formatLongDate } from "~/lib/ramadanText";

const prefs = usePreferencesStore();
const ramadan = useRamadan();
const prayer = usePrayerTimes();
const { location } = useLocation();

const plan = ramadan.plan;
const day = computed(() => ramadan.todayDay.value);
const tz = computed(() => prayer.timezone.value ?? prayer.record.value?.timezone ?? null);
const methodText = computed(() => prayer.record.value?.methodName || methodName(prefs.prefs.fiqh === "jafari" ? prefs.prefs.calc.jafariMethod : prefs.prefs.calc.sunniMethod));

const iftarAt = computed(() => (day.value && tz.value ? zonedInstant(day.value.date, day.value.timings.Maghrib, tz.value) : null));
const suhoorAt = computed(() => (day.value && tz.value ? zonedInstant(day.value.date, day.value.timings.Fajr, tz.value) : null));
const nowDate = computed(() => new Date(prayer.now.value));
const toIftar = computed(() => (iftarAt.value ? iftarAt.value.getTime() - nowDate.value.getTime() : null));
const bar = computed(() => fractionBetween(suhoorAt.value, iftarAt.value, nowDate.value));

const untilText = computed(() => {
  const n = plan.value.daysUntil;
  if (n === null) return "";
  return n === 0 ? "Ramadan begins today" : n === 1 ? "Ramadan begins tomorrow" : `Ramadan begins in ${n} days`;
});
const yearText = computed(() => (ramadan.month.value ? ` ${ramadan.month.value.hYear}` : ""));
const basisText = computed(() => basisLine(plan.value.source, plan.value.basis));
const adjustText = computed(() => (prefs.prefs.hijriAdjust ? adjustNote(prefs.prefs.hijriAdjust) : ""));
const dayText = computed(() => (plan.value.day ? `Day ${plan.value.day}${plan.value.length ? ` of ${plan.value.length}` : ""}` : ""));
const retry = () => ramadan.load({ network: true, times: true });

// Before Ramadan: the next event, from the same saved months as the Events tab (no change to Home)
const events = useEvents();
const fiqhSet = ref(false);
onMounted(() => {
  fiqhSet.value = events.fiqhSet();
  void events.load({ network: true });
});
const nextEvent = computed(() => {
  const t = traditionOf(fiqhSet.value ? "following" : "both", prefs.prefs.fiqh);
  return events.placed.value.find((p) => visible(p.event, t)) ?? null;
});
const noRamadanDates = computed(() => plan.value.state === "unknown");
</script>

<template>
  <div class="space-y-6" data-testid="today-panel">
    <!-- the dates are not available -->
    <div v-if="noRamadanDates && (ramadan.monthState.value === 'needs-connection' || ramadan.monthState.value === 'error')" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="no-dates">
      <p class="text-[15px]">
        {{ ramadan.monthState.value === "error" ? "Couldn’t load the calendar. Try again in a moment." : "Dates need a connection once." }}
      </p>
      <p class="mt-1 text-[13px] text-ink-2">Ramadan’s dates come from the calendar service and are saved on this device after that.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="dates-retry" @click="retry">Try again</Button>
    </div>
    <div v-else-if="noRamadanDates" role="status" aria-busy="true" aria-label="Loading Ramadan" data-testid="dates-loading"><Skeleton class="h-28 w-full" /></div>

    <!-- before -->
    <section v-else-if="plan.state === 'before'" aria-labelledby="before-h" data-testid="before">
      <div class="rounded-[10px] border bg-surface p-5">
        <p class="text-[12px] text-ink-2">Ramadan{{ yearText }}</p>
        <h2 id="before-h" class="mt-1 font-serif text-[28px] font-medium" data-testid="until">{{ untilText }}</h2>
        <p class="mt-1 text-[14.5px]" data-testid="expected">Expected {{ formatLongDate(plan.start!) }}</p>
        <p class="mt-2 text-[12.5px] text-ink-2" data-testid="basis">{{ basisText }}<template v-if="adjustText"> {{ adjustText }}.</template></p>
      </div>
      <RamadanGetReady class="mt-5" />
      <section v-if="nextEvent" class="mt-5 rounded-[10px] border p-4" aria-labelledby="next-ev-h" data-testid="next-event">
        <h2 id="next-ev-h" class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Next event</h2>
        <p class="mt-1 text-[15px] font-medium" data-testid="next-event-name">{{ nextEvent.event.name }}</p>
        <p class="text-[13px] text-ink-2" data-testid="next-event-date">{{ expectedText(nextEvent.date) }} · {{ nextEvent.hijriLabel }} · {{ relativeDays(nextEvent.daysUntil) }}</p>
        <NuxtLink to="/ramadan?tab=events" class="mt-1 inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-9" data-testid="next-event-link">See all coming events</NuxtLink>
      </section>
    </section>

    <!-- over -->
    <section v-else-if="plan.state === 'over'" data-testid="over">
      <div class="rounded-[10px] border p-5"><p class="text-[15px]">Ramadan{{ yearText }} has ended.</p></div>
    </section>

    <!-- during -->
    <template v-else>
      <section aria-labelledby="during-h" data-testid="during">
        <div class="rounded-[10px] border bg-surface p-5">
          <p class="text-[12px] text-ink-2">Ramadan{{ yearText }}<template v-if="plan.source === 'manual'"> · Set by you</template></p>
          <h2 id="during-h" class="mt-1 font-serif text-[28px] font-medium" data-testid="day-count">{{ dayText }}</h2>
          <p v-if="day" class="text-[14px] text-ink-2" data-testid="today-date">{{ formatLongDate(day.date) }}</p>
          <template v-if="day && toIftar !== null">
            <p class="mt-3 text-[15px]" data-testid="iftar-countdown">
              <template v-if="toIftar > 0">Iftar in <b>{{ countdownLabel(toIftar) }}</b></template>
              <template v-else>Iftar time has passed</template>
            </p>
            <div v-if="bar !== null" class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><i class="block h-full bg-brand" :style="{ width: `${Math.round(bar * 100)}%` }" /></div>
          </template>
          <p class="mt-2 text-[12.5px] text-ink-2" data-testid="basis">{{ basisText }}<template v-if="adjustText"> {{ adjustText }}.</template></p>
        </div>

        <div v-if="day" class="mt-4 grid grid-cols-2 gap-3" data-testid="times">
          <div class="rounded-[10px] border p-4">
            <p class="text-[12.5px] text-ink-2">Suhoor ends</p>
            <p class="mt-1 text-[22px] font-medium" data-testid="suhoor-time">{{ formatClock12(day.timings.Fajr) }}</p>
          </div>
          <div class="rounded-[10px] border p-4">
            <p class="text-[12.5px] text-ink-2">Iftar</p>
            <p class="mt-1 text-[22px] font-medium" data-testid="iftar-time">{{ formatClock12(day.timings.Maghrib) }}</p>
          </div>
          <p class="col-span-2 text-[12.5px] text-ink-2" data-testid="times-method">
            <template v-if="day.timings.Imsak">Imsak, as the service gives it: {{ formatClock12(day.timings.Imsak) }}. </template>Times: {{ methodText }}.
          </p>
        </div>
        <div v-else class="mt-4 rounded-[10px] border border-dashed px-4 py-6 text-center" data-testid="no-times">
          <p class="text-[14.5px]">{{ !location ? "Set your location to see today’s times." : "Today’s times are not saved on this device yet. Connect once to get them." }}</p>
          <Button v-if="location" variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="times-retry" @click="retry">Try again</Button>
          <Button v-else as-child variant="outline" class="mt-3 min-h-11 md:min-h-9"><NuxtLink to="/settings?section=prayer" data-testid="set-location">Set location</NuxtLink></Button>
        </div>
      </section>

      <RamadanFastingStrip />
      <RamadanKhatmahCard />
      <RamadanQadrCard />
      <RamadanDuaCard />
      <HomeAyahOfDay />
    </template>

    <RamadanStartDateControl />
  </div>
</template>
