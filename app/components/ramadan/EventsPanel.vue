<script setup lang="ts">
// The Events tab: the legacy events (and any reviewed file) on the days the calendar service gives, grouped by month, with "Next", the
// Both / Sunni / Ja'fari view (only when events carry a tradition tag), and the bell. Dates read "Expected" and follow the Hijri adjustment for
// display only. Nothing is invented: a month that is not saved is said to need a connection once.
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { calendarBasis } from "~/lib/hijriMonths";
import { ALL_EVENTS } from "~/composables/useEvents";
import { adjustNote } from "~/lib/hijriAdjust";
import { FEW_LINE, groupByMonth, hasTraditionTags, isFew, monthHeading, showFromQuery, traditionOf, visible, type Show } from "~/lib/islamicEvents";
import { basisLine } from "~/lib/ramadanText";

const route = useRoute();
const router = useRouter();
const prefs = usePreferencesStore();
const undo = useUndoToast();
const events = useEvents();

const fiqhSet = ref(false);
onMounted(() => {
  fiqhSet.value = events.fiqhSet();
  events.loadReminders();
  void events.load({ network: true });
});

const show = computed<Show>(() => showFromQuery(route.query.show, fiqhSet.value));
const tradition = computed(() => traditionOf(show.value, prefs.prefs.fiqh));
const setShow = (v: string) => void router.replace({ query: { ...route.query, tab: "events", show: v } });
const showOptions = computed<MenuOption[]>(() => [
  { value: "following", label: `Following (${prefs.prefs.fiqh === "jafari" ? "Ja’fari" : "Sunni"})` },
  { value: "both", label: "Both" },
  { value: "sunni", label: "Sunni" },
  { value: "jafari", label: "Ja’fari" },
]);
const filterShown = computed(() => hasTraditionTags(ALL_EVENTS));

const list = computed(() => events.placed.value.filter((p) => visible(p.event, tradition.value)));
const groups = computed(() => groupByMonth(list.value));
const first = computed(() => list.value[0] ?? null);
const markerFor = (p: { event: { id: string }; date: string }) => (first.value && p.event.id === first.value.event.id && p.date === first.value.date ? (p.date === events.todayKey.value ? "today" : "next") : null);
const few = computed(() => isFew(ALL_EVENTS, tradition.value));

const basis = computed(() => {
  const rec = Object.values(events.months.value)[0];
  return basisLine("calendar", rec ? calendarBasis(rec.method) : null);
});
const adjust = computed(() => (prefs.prefs.hijriAdjust ? adjustNote(prefs.prefs.hijriAdjust) : ""));
const retry = () => events.load({ network: true });

function bell(p: { event: { name: string }; date: string }) {
  const r = events.toggleReminder(p.event.name, p.date);
  if (!r) return;
  undo.withUndo(r.added ? `Saved to your list: ${p.event.name}. No alert is sent.` : `Removed the reminder for ${p.event.name}`, r.undo);
}
const state = events.state;
const noMonths = computed(() => state.value === "needs-connection" || state.value === "error");
</script>

<template>
  <div data-testid="events-panel">
    <p class="text-[14px] text-ink-2">Dates for the coming months.</p>

    <div v-if="filterShown" class="mt-3 flex flex-wrap items-center gap-2" data-testid="events-filter">
      <ResponsiveMenu :model-value="show" :options="showOptions" label="Show" title="Show events for" @update:model-value="setShow" />
    </div>

    <div v-if="noMonths && !list.length" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="events-no-dates">
      <p class="text-[15px]">{{ state === "error" ? "Couldn’t load the calendar. Try again in a moment." : "Dates need a connection once." }}</p>
      <p class="mt-1 text-[13px] text-ink-2">Each month’s dates come from the calendar service and are saved on this device after that.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="events-retry" @click="retry">Try again</Button>
    </div>
    <div v-else-if="state === 'idle' || (state === 'loading' && !list.length)" class="mt-4 space-y-2" aria-busy="true" aria-label="Loading events" data-testid="events-loading"><Skeleton class="h-16 w-full" /><Skeleton class="h-16 w-full" /><Skeleton class="h-16 w-full" /></div>
    <template v-else>
      <p class="mt-3 text-[12.5px] text-ink-2" data-testid="events-basis">{{ basis }}<template v-if="adjust"> {{ adjust }}.</template></p>
      <p v-if="few" class="mt-2 rounded-lg border border-dashed px-3 py-2 text-[13px]" data-testid="events-few">{{ FEW_LINE }}</p>

      <div v-if="!list.length" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="events-empty">
        <p class="text-[15px]">No events for this view in these months.</p>
        <Button v-if="show !== 'both'" variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="events-show-both" @click="setShow('both')">Show both</Button>
      </div>
      <section v-for="g in groups" :key="g.month" :aria-label="monthHeading(g.month)" data-testid="events-group">
        <h2 class="mt-5 text-[13px] font-medium uppercase tracking-wide text-ink-2" data-testid="events-month">{{ monthHeading(g.month) }}</h2>
        <ul>
          <RamadanEventRow v-for="p in g.items" :key="`${p.event.id}|${p.date}`" :placed="p" :tradition="tradition" :marker="markerFor(p)" :reminded="!!events.reminderFor(p.event.name, p.date)" @bell="bell(p)" />
        </ul>
      </section>

      <p v-if="events.missing.value.length" class="mt-3 text-[13px] text-ink-2" data-testid="events-partial">Dates for later months need a connection once.</p>
      <Button v-if="events.horizon.value < 24" variant="outline" class="mt-4 min-h-11 md:min-h-9" data-testid="events-later" @click="events.showLater()">Show later events</Button>
      <p class="mt-4 text-[12.5px] text-ink-2" data-testid="events-footer">Dates and this list follow this app’s data. They are not a ruling.</p>
    </template>

    <RamadanRemindersList />
  </div>
</template>
