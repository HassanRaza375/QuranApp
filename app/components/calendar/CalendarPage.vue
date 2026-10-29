<script setup lang="ts">
// Calendar (Phase 15; prototype `pgCal`): one Hijri month as a grid, the selected day beside it (its events and your reminders), and what is coming up.
// Dates and month names are the calendar service's own; the Settings Hijri adjustment moves the Gregorian dates shown. Offline level B: a month seen
// before is on this device; a month never loaded says so and offers Try again. No Suhoor or Iftar times here (the Ramadan page has the timetable).
import { calendarBasis } from "~/lib/hijriMonths";
import { adjustNote } from "~/lib/hijriAdjust";
import { relativeDays, TRADITION_TAG, wordingFor, categoryLabel } from "~/lib/islamicEvents";
import { formatLongDate, formatShortDate } from "~/lib/ramadanText";
import type { ReminderRepeat } from "~/lib/reminders";

const cal = useCalendar();
const undo = useUndoToast();
const remOpen = ref(false);
const lastDir = ref<1 | -1>(1);
const grid = ref<HTMLElement | null>(null);

onMounted(() => cal.load());

const month = computed(() => cal.month.value);
const sel = computed(() => cal.selected.value);
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthShort = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
const range = computed(() => (month.value ? `${formatShortDate(month.value.start).replace(/^\w+ /, "")} – ${formatShortDate(month.value.end).replace(/^\w+ /, "")} ${month.value.end.slice(0, 4)}` : ""));
const basis = computed(() => (month.value ? calendarBasis(month.value.method) : ""));
const title = computed(() => (month.value ? (month.value.name ?? `Hijri month ${month.value.id.m}`) : ""));
const isCurrentMonth = computed(() => !!cal.todayId.value && !!cal.cur.value && cal.todayId.value.y === cal.cur.value.y && cal.todayId.value.m === cal.cur.value.m);
const hijriText = computed(() => (sel.value && month.value ? `${sel.value.day.hDay} ${title.value} ${month.value.id.y}` : ""));
const selHeading = computed(() => (sel.value ? (sel.value.day.date === cal.today.value ? "Today" : formatLongDate(sel.value.day.date).split(" ")[0]) : ""));
const firstOptions = [
  { value: "hijri", label: "Hijri" },
  { value: "gregorian", label: "Gregorian" },
];

function label(d: { date: string; hDay: number }) {
  const m = cal.marks(d.date, d.hDay);
  const e = sel.value && d.date === sel.value.day.date ? sel.value.events : null;
  const names = e ? e.map((x) => x.name) : [];
  return `${d.hDay} ${title.value}, ${formatLongDate(d.date)}${d.date === cal.today.value ? ", today" : ""}${m.events ? `, ${names.length ? names.join(", ") : m.events === 1 ? "1 event" : `${m.events} events`}` : ""}${m.reminders ? `, ${m.reminders === 1 ? "1 reminder" : `${m.reminders} reminders`}` : ""}`;
}

async function step(dir: 1 | -1) {
  lastDir.value = dir;
  await cal.step(dir);
}
function onKey(e: KeyboardEvent) {
  const m = month.value;
  if (!m || !cal.sel.value) return;
  const i = m.days.findIndex((d) => d.date === cal.sel.value);
  const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
  const to = e.key === "Home" ? 0 : e.key === "End" ? m.days.length - 1 : delta === undefined ? null : Math.min(m.days.length - 1, Math.max(0, i + delta));
  if (to === null || to === i) return;
  e.preventDefault();
  cal.sel.value = m.days[to]!.date;
  nextTick(() => grid.value?.querySelector<HTMLElement>(`[data-date="${cal.sel.value}"]`)?.focus());
}

function addReminder(r: { title: string; date: string; repeat: ReminderRepeat | null }) {
  const made = cal.saveReminder(r.title, r.date, r.repeat);
  if (!made) return;
  if (made.exists) undo.info(`“${r.title}” is already in your list for that day.`);
  else undo.withUndo(`Saved to your list: ${r.title}. No alert is sent.`, made.undo);
}
function removeReminder(id: string, titleText: string) {
  const back = cal.deleteReminder(id);
  if (back) undo.withUndo(`Removed “${titleText}”.`, back);
}
const repeatText = (r: { repeat?: ReminderRepeat }) => (r.repeat ? (r.repeat.by === "hijri" ? "Every year · by Hijri date" : "Every year · by Gregorian date") : "");
</script>

<template>
  <section class="mx-auto max-w-[1040px]" data-testid="cal-page">
    <!-- loading / needs the service once -->
    <div v-if="cal.state.value === 'loading'" class="space-y-3" aria-busy="true" aria-label="Loading the calendar" data-testid="cal-loading">
      <Skeleton class="h-10 w-72" />
      <Skeleton class="h-[420px] w-full" />
    </div>
    <div v-else-if="!month" class="rounded-[10px] border border-dashed px-4 py-8 text-center" role="status" data-testid="cal-unavailable">
      <h1 class="font-serif text-[26px] font-medium">Calendar</h1>
      <p class="mx-auto mt-2 max-w-[46ch] text-[14.5px]">{{ cal.state.value === "error" ? "The calendar could not be loaded just now." : "The calendar needs a connection once. After that, the months you have seen are kept on this device." }}</p>
      <Button variant="outline" class="mt-4 min-h-11" data-testid="cal-retry" @click="cal.load()">Try again</Button>
    </div>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <h1 class="min-w-0 flex-1 font-serif text-[28px] font-medium leading-tight md:text-[32px]" data-testid="cal-title">
          <span>{{ title }}</span> <span class="text-[0.7em] text-ink-2 tabular-nums" data-testid="cal-year">{{ month.id.y }}</span>
        </h1>
        <div class="flex items-center gap-1.5">
          <button type="button" class="grid size-11 place-items-center rounded-lg border hover:bg-accent disabled:opacity-40 md:size-9" :disabled="!cal.canPrev.value" aria-label="Previous month" data-testid="cal-prev" @click="step(-1)"><Icon name="lucide:chevron-left" size="18" /></button>
          <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="isCurrentMonth && cal.sel.value === cal.today.value" data-testid="cal-today" @click="cal.showToday()">Today</Button>
          <button type="button" class="grid size-11 place-items-center rounded-lg border hover:bg-accent disabled:opacity-40 md:size-9" :disabled="!cal.canNext.value" aria-label="Next month" data-testid="cal-next" @click="step(1)"><Icon name="lucide:chevron-right" size="18" /></button>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span v-if="month.nameAr" class="ar leading-snug text-brand" style="font-size: calc(22px * var(--arabic-font-scale))" lang="ar" dir="rtl" data-testid="cal-title-ar">{{ month.nameAr }}</span>
        <span class="min-w-0 basis-full text-[13px] text-ink-2 tabular-nums sm:flex-1 sm:basis-0" data-testid="cal-range">{{ range }} · {{ basis }}<template v-if="cal.adjust.value"> · {{ adjustNote(cal.adjust.value) }}</template></span>
        <SettingsSegmentedControl :model-value="cal.first.value" :options="firstOptions" label="Number shown first" @update:model-value="cal.setFirst($event as 'hijri' | 'gregorian')" />
      </div>

      <p v-if="cal.navState.value === 'loading'" class="mb-3 text-[13.5px] text-ink-2" role="status" data-testid="cal-nav-loading">Loading the month…</p>
      <p v-else-if="cal.navState.value !== 'idle'" class="mb-3 flex flex-wrap items-center gap-x-3 text-[13.5px]" role="status" data-testid="cal-nav-problem">
        {{ cal.navState.value === "error" ? "That month could not be loaded just now." : "That month is not saved on this device. It needs a connection once." }}
        <button type="button" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2 md:min-h-9" data-testid="cal-nav-retry" @click="step(lastDir)">Try again</button>
      </p>

      <div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div ref="grid" class="grid grid-cols-7 border-l border-t" role="group" :aria-label="`${title} ${month.id.y}`" data-testid="cal-grid" @keydown="onKey">
            <div v-for="w in WEEK" :key="w" class="border-b border-r px-2 py-2 text-[12px] text-ink-2" aria-hidden="true">{{ w }}</div>
            <span v-for="n in month.days[0]!.weekday" :key="`pad${n}`" class="border-b border-r" aria-hidden="true" />
            <button
              v-for="(d, i) in month.days"
              :key="d.date"
              type="button"
              class="relative flex min-h-[58px] flex-col gap-0.5 border-b border-r bg-surface p-1.5 text-left hover:bg-sunken focus-visible:z-10 md:min-h-[86px] md:p-2"
              :class="[cal.sel.value === d.date ? '!bg-accent' : '', d.date === cal.today.value ? 'cal-today' : '']"
              :aria-pressed="cal.sel.value === d.date"
              :aria-label="label(d)"
              :tabindex="cal.sel.value === d.date ? 0 : -1"
              :data-date="d.date"
              :data-hday="d.hDay"
              :data-today="d.date === cal.today.value || undefined"
              data-testid="cal-day"
              @click="cal.sel.value = d.date"
            >
              <span class="font-serif text-[18px] font-medium leading-none tabular-nums md:text-[22px]" :class="d.date === cal.today.value ? 'text-brand' : ''" aria-hidden="true">{{ cal.first.value === "hijri" ? d.hDay : Number(d.date.slice(8, 10)) }}</span>
              <span class="text-[10.5px] text-ink-2 tabular-nums md:text-[11px]" aria-hidden="true">{{ cal.first.value === "hijri" ? (Number(d.date.slice(8, 10)) === 1 || i === 0 ? `${monthShort(d.date)} ` : "") + Number(d.date.slice(8, 10)) : d.hDay }}</span>
              <span class="mt-auto flex flex-wrap gap-[3px]" aria-hidden="true">
                <i v-if="cal.marks(d.date, d.hDay).events" class="block size-1.5 rounded-full bg-brand" data-testid="cal-dot-event" />
                <i v-if="cal.marks(d.date, d.hDay).reminders" class="block size-1.5 rounded-full shadow-[inset_0_0_0_1.5px_var(--ink-2)]" data-testid="cal-dot-reminder" />
              </span>
            </button>
          </div>
          <div class="mt-2.5 flex flex-wrap gap-x-4 text-[12px] text-ink-2" aria-hidden="true">
            <span class="inline-flex items-center gap-1.5"><i class="block size-2 rounded-full bg-brand" />Islamic event</span>
            <span class="inline-flex items-center gap-1.5"><i class="block size-2 rounded-full shadow-[inset_0_0_0_1.5px_var(--ink-2)]" />Your reminder</span>
          </div>
          <p class="mt-3 text-[12.5px] text-ink-2" data-testid="cal-note">Dates follow the calendar named above. Local moon sighting can differ by a day: <NuxtLink to="/settings" class="text-brand underline underline-offset-2">Settings</NuxtLink> has a Hijri date adjustment.</p>
        </div>

        <aside class="space-y-6">
          <div v-if="sel" class="rounded-[10px] border p-4" data-testid="cal-day-panel">
            <div class="text-[13px] text-ink-2" data-testid="cal-day-kicker">{{ selHeading }}</div>
            <h2 class="mt-0.5 font-serif text-[22px] font-medium leading-tight" data-testid="cal-day-hijri">{{ hijriText }}</h2>
            <div class="text-[13px] text-ink-2 tabular-nums" data-testid="cal-day-greg">{{ formatLongDate(sel.day.date) }}</div>

            <ul class="mt-3" data-testid="cal-day-items">
              <li v-for="e in sel.events" :key="e.id" class="flex items-start gap-3 border-t py-3" data-testid="cal-event">
                <Icon name="lucide:star" size="16" class="mt-0.5 shrink-0 text-brand" />
                <div class="min-w-0 flex-1">
                  <p class="text-[15px] font-medium" data-testid="cal-event-name">{{ e.name }}</p>
                  <p class="mt-0.5 flex flex-wrap gap-1.5">
                    <span v-if="e.tradition !== 'shared'" class="rounded-full border border-dashed px-2 py-0.5 text-[11.5px]">{{ TRADITION_TAG[e.tradition] }}</span>
                    <span class="rounded-full border px-2 py-0.5 text-[11.5px]">{{ categoryLabel(e.category) }}</span>
                  </p>
                  <p v-if="e.note" class="mt-1 text-[13.5px]" data-testid="cal-event-note">{{ e.note }}</p>
                  <p v-for="(w, k) in wordingFor(e, cal.tradition.value)" :key="k" class="mt-1 text-[13.5px]"><b v-if="w.label">{{ w.label }}: </b>{{ w.text }}</p>
                </div>
              </li>
              <li v-for="r in sel.reminders" :key="r.id" class="flex items-start gap-3 border-t py-3" data-testid="cal-reminder">
                <Icon name="lucide:bell" size="16" class="mt-0.5 shrink-0 text-ink-2" />
                <div class="min-w-0 flex-1">
                  <p class="break-words text-[15px]" data-testid="cal-reminder-title">{{ r.title }}</p>
                  <p v-if="r.repeat" class="text-[12.5px] text-ink-2" data-testid="cal-reminder-repeat">{{ repeatText(r) }}</p>
                </div>
                <button type="button" class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-sunken md:size-9" :aria-label="`Remove the reminder ${r.title}`" data-testid="cal-reminder-remove" @click="removeReminder(r.id, r.title)"><Icon name="lucide:trash-2" size="16" /></button>
              </li>
            </ul>
            <p v-if="!sel.events.length && !sel.reminders.length" class="mt-3 text-[13.5px] text-ink-2" data-testid="cal-day-empty">Nothing on this day.</p>
            <Button variant="outline" class="mt-3 min-h-11 w-full md:min-h-9" data-testid="cal-add" @click="remOpen = true"><Icon name="lucide:plus" size="16" />Add reminder</Button>
          </div>

          <section aria-labelledby="cal-up-h" data-testid="cal-upcoming">
            <h2 id="cal-up-h" class="mb-1 font-serif text-[18px] font-medium">Coming up</h2>
            <ul v-if="cal.upcoming.value.length" class="divide-y border-y">
              <li v-for="u in cal.upcoming.value" :key="`${u.kind}${u.id ?? u.title}${u.date}`" class="flex items-center gap-3 py-2.5" data-testid="cal-up-row" :data-kind="u.kind" :data-date="u.date">
                <span class="inline-flex h-[30px] w-[62px] shrink-0 items-center justify-center rounded-lg bg-sunken px-1 text-[12.5px] text-ink-2 tabular-nums">{{ formatShortDate(u.date).replace(/^\w+ /, "") }}</span>
                <div class="min-w-0 flex-1">
                  <p class="break-words text-[14.5px] font-medium">{{ u.title }}</p>
                  <p class="text-[12.5px] text-ink-2">{{ u.sub }} · {{ relativeDays(u.daysUntil) }}</p>
                </div>
              </li>
            </ul>
            <p v-else class="py-2 text-[13.5px] text-ink-2" data-testid="cal-up-empty">Nothing coming up in the months saved on this device.</p>
          </section>
        </aside>
      </div>

      <CalendarReminderSheet v-model:open="remOpen" :default-date="sel?.day.date ?? cal.today.value" :default-title="sel?.events[0]?.name ?? ''" :hijri-of="cal.hijriOf" @save="addReminder" />
    </template>
  </section>
</template>

<style scoped>
.cal-today::after {
  content: "";
  position: absolute;
  inset: 3px;
  border: 1.5px solid var(--accent);
  border-radius: 6px;
  pointer-events: none;
}
</style>
