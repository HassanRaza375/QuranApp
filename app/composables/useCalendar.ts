// The Calendar (Phase 15): a Hijri month from the calendar service's own days (the Gregorian months the Events page already saves), the events of the
// fiqh view on their days, your reminders, and "Coming up". A saved month is used first; a month never saved needs a connection once and says so (level B).
// The Hijri adjustment from Settings is applied to the dates shown, never to a record. Reminders are the legacy list (`quran:reminders:v1`).
import * as C from "~/lib/calendar/month";
import { readFirst, writeFirst, type First } from "~/lib/calendar/prefs";
import { ALL_EVENTS } from "~/composables/useEvents";
import type { GregorianMonthRecord } from "~/lib/gregorianMonths";
import { defaultShow, traditionOf, visible } from "~/lib/islamicEvents";
import { addReminder, removeReminder, restoreReminder, type ReminderRepeat } from "~/lib/reminders";
import { getGregorianMonth, hijriDeps } from "~/services/hijri.service";

export type CalendarState = "loading" | "ready" | "needs-connection" | "error";
/** How far from this month you can step (a Hijri month at a time). */
export const MAX_STEPS = 60;
const monthIndex = (id: C.HijriId) => id.y * 12 + id.m;

export const useCalendar = () => {
  const ev = useEvents();
  const prefs = usePreferencesStore();
  const cur = useState<C.HijriId | null>("calendar-cur", () => null);
  const sel = useState<string | null>("calendar-sel", () => null);
  const state = useState<CalendarState>("calendar-state", () => "loading");
  const navState = useState<"idle" | "loading" | "needs-connection" | "error">("calendar-nav", () => "idle");
  const first = useState<First>("calendar-first", () => "hijri");

  const adjust = computed(() => prefs.prefs.hijriAdjust);
  const today = computed(() => ev.todayKey.value);
  const pool = computed(() => C.poolOf(Object.values(ev.months.value)));
  const month = computed(() => (cur.value ? C.monthOf(pool.value, cur.value, adjust.value) : null));
  const todayId = computed(() => C.idOfDate(pool.value, today.value, adjust.value));
  const tradition = computed(() => traditionOf(defaultShow(ev.fiqhSet()), prefs.prefs.fiqh));

  /** How many months the shown one is from today's (negative = earlier). */
  const offset = computed(() => (cur.value && todayId.value ? monthIndex(cur.value) - monthIndex(todayId.value) : 0));
  const canPrev = computed(() => !!month.value && navState.value !== "loading" && offset.value > -MAX_STEPS);
  const canNext = computed(() => !!month.value && navState.value !== "loading" && offset.value < MAX_STEPS);

  async function ensure(keys: string[]): Promise<"ok" | "offline" | "error"> {
    const deps = hijriDeps();
    let result: "ok" | "offline" | "error" = "ok";
    const got: Record<string, GregorianMonthRecord> = {};
    for (const k of keys) {
      if (ev.months.value[k]) continue;
      const r = await getGregorianMonth(deps, k, { network: true });
      if (r.status === "ok") got[k] = r.record;
      else if (result === "ok") result = r.kind;
    }
    if (Object.keys(got).length) ev.months.value = { ...ev.months.value, ...got };
    return result;
  }

  function showToday() {
    const id = todayId.value;
    if (!id) return false;
    cur.value = id;
    sel.value = today.value;
    navState.value = "idle";
    return true;
  }

  /** Opens on today's month: the saved months first, the network for the ones missing. */
  async function load() {
    first.value = readFirst();
    ev.loadReminders();
    state.value = "loading";
    await ev.load({ network: true, limit: 3 });
    if (showToday()) {
      state.value = "ready";
      void ev.load({ network: true }); // the rest of the window, for "Coming up"
    } else state.value = ev.state.value === "error" ? "error" : "needs-connection";
  }

  /** Steps to the next (+1) or previous (-1) Hijri month. A month that is not saved and cannot be fetched stays where it is and says so. */
  async function step(dir: 1 | -1) {
    const m = month.value;
    if (!m || navState.value === "loading") return;
    navState.value = "loading";
    const res = await ensure(C.monthsToStep(m, dir));
    const target = dir > 0 ? C.nextId(m.id) : C.prevId(m.id);
    const t = C.monthOf(pool.value, target, adjust.value);
    if (t) {
      cur.value = target;
      sel.value = t.days.some((d) => d.date === today.value) ? today.value : t.days[0]!.date;
      navState.value = "idle";
    } else navState.value = res === "error" ? "error" : "needs-connection";
  }

  function setFirst(v: First) {
    first.value = v;
    writeFirst(v);
  }

  // ---- what is on the selected day
  const selected = computed(() => {
    const m = month.value;
    const d = m?.days.find((x) => x.date === sel.value);
    if (!m || !d) return null;
    const h = { month: m.id.m, day: d.hDay };
    return {
      day: d,
      hijri: h,
      events: C.eventsOn(ALL_EVENTS, h.month, h.day, tradition.value),
      reminders: C.remindersOn(ev.reminders.value, d.date, h),
    };
  });
  /** Marks for one cell. */
  const marks = (date: string, hDay: number): { events: number; reminders: number } => {
    const m = month.value;
    if (!m) return { events: 0, reminders: 0 };
    const h = { month: m.id.m, day: hDay };
    return { events: C.eventsOn(ALL_EVENTS, h.month, h.day, tradition.value).length, reminders: C.remindersOn(ev.reminders.value, date, h).length };
  };

  const upcoming = computed(() =>
    C.comingUp({
      events: ev.placed.value.filter((p) => visible(p.event, tradition.value)),
      reminders: ev.reminders.value,
      pool: pool.value,
      adjust: adjust.value,
      today: today.value,
      end: ev.end.value,
      limit: 5,
    }),
  );

  // ---- reminders
  function saveReminder(title: string, date: string, repeat: ReminderRepeat | null): { undo: () => void; exists: boolean } | null {
    const before = ev.reminders.value.length;
    const r = addReminder(title, date, Date.now(), repeat);
    ev.loadReminders();
    if (!r) return null;
    const added = ev.reminders.value.length > before;
    return {
      exists: !added,
      undo: () => {
        if (added) removeReminder(r.id);
        ev.loadReminders();
      },
    };
  }
  function deleteReminder(id: string): (() => void) | null {
    const gone = removeReminder(id);
    ev.loadReminders();
    return gone
      ? () => {
          restoreReminder(gone);
          ev.loadReminders();
        }
      : null;
  }
  const hijriOf = (date: string) => C.hijriOfDate(pool.value, date, adjust.value);

  return { cur, sel, state, navState, first, month, today, todayId, adjust, tradition, selected, marks, upcoming, canPrev, canNext, offset, load, step, showToday, setFirst, saveReminder, deleteReminder, hijriOf, reminders: ev.reminders };
};
