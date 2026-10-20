<script setup lang="ts">
// The Timetable: Suhoor ends and Iftar for each Ramadan day, from the cached prayer months for the chosen method. The rows are as many as
// the calendar gives (29 or 30). A day whose times are not saved says so; nothing is estimated.
import { methodName } from "~/lib/calcMethods";
import { formatClock12 } from "~/lib/prayerClock";
import { missingRows, timetableRows } from "~/lib/ramadan";
import { formatShortDate } from "~/lib/ramadanText";

const prefs = usePreferencesStore();
const ramadan = useRamadan();
const prayer = usePrayerTimes();
const { location } = useLocation();
const rows = computed(() => timetableRows(ramadan.plan.value, ramadan.todayKey.value, ramadan.allDays.value));
const missing = computed(() => missingRows(rows.value));
const methodText = computed(() => prayer.record.value?.methodName || methodName(prefs.prefs.fiqh === "jafari" ? prefs.prefs.calc.jafariMethod : prefs.prefs.calc.sunniMethod));
const retry = () => ramadan.load({ network: true, times: true });
const loading = computed(() => ramadan.timesState.value === "loading" || ramadan.monthState.value === "loading" || ramadan.monthState.value === "idle");
</script>

<template>
  <div data-testid="timetable-panel">
    <div v-if="!location" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="tt-no-location">
      <p class="text-[15px]">Set your location to see Ramadan’s times.</p>
      <Button as-child variant="outline" class="mt-3 min-h-11 md:min-h-9"><NuxtLink to="/settings?section=prayer">Set location</NuxtLink></Button>
    </div>
    <div v-else-if="ramadan.plan.value.state === 'unknown'" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="tt-no-dates">
      <p v-if="loading" class="text-[15px]" aria-busy="true">Loading Ramadan’s dates…</p>
      <template v-else>
        <p class="text-[15px]">Dates need a connection once.</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="tt-retry" @click="retry">Try again</Button>
      </template>
    </div>
    <template v-else>
      <p class="text-[13px] text-ink-2" data-testid="tt-method">Times: {{ methodText }}. Suhoor ends at Fajr; iftar is the Maghrib time.</p>
      <div v-if="loading && !rows.some((r) => r.iftar)" class="mt-3" aria-busy="true" data-testid="tt-loading"><Skeleton class="h-40 w-full" /></div>
      <div v-else-if="missing === rows.length" class="mt-3 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="tt-not-saved">
        <p class="text-[15px]">Ramadan’s times are not saved on this device yet. Connect once to get them.</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="tt-retry" @click="retry">Try again</Button>
      </div>
      <template v-else>
        <div class="mt-3 overflow-x-auto rounded-[10px] border">
          <table class="w-full text-[14px]" data-testid="timetable">
            <caption class="sr-only">Suhoor and iftar times for each day of Ramadan</caption>
            <thead>
              <tr class="border-b text-left text-[12.5px] text-ink-2"><th scope="col" class="px-3 py-2 font-medium">Day</th><th scope="col" class="px-3 py-2 font-medium">Date</th><th scope="col" class="px-3 py-2 font-medium">Suhoor ends</th><th scope="col" class="px-3 py-2 font-medium">Iftar</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.date" class="border-b last:border-b-0" :class="[r.today ? 'bg-accent' : '', r.friday ? 'font-medium' : '']" :aria-current="r.today ? 'date' : undefined" :data-day="r.day" data-testid="tt-row">
                <th scope="row" class="px-3 py-2 text-left font-medium">{{ r.day }}</th>
                <td class="px-3 py-2">{{ formatShortDate(r.date) }}<span v-if="r.friday" class="ml-1 text-[11.5px] text-ink-2">Friday</span></td>
                <td class="px-3 py-2" data-testid="tt-suhoor">{{ r.suhoorEnds ? formatClock12(r.suhoorEnds) : "Not saved" }}</td>
                <td class="px-3 py-2" data-testid="tt-iftar">{{ r.iftar ? formatClock12(r.iftar) : "Not saved" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="missing" class="mt-2 text-[12.5px] text-ink-2" data-testid="tt-partial">{{ missing }} {{ missing === 1 ? "day is" : "days are" }} not saved on this device yet. Connect once to get them.</p>
        <p class="mt-2 text-[12.5px] text-ink-2" data-testid="tt-note">Ramadan lasts {{ rows.length }} days this year by the calendar. Dates follow the calendar service and can differ by a day with local sighting.</p>
      </template>
    </template>
  </div>
</template>
