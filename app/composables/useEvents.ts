// Events: the legacy events (and any reviewed file) placed on Gregorian days from the calendar service's saved months, with the Hijri
// adjustment applied for display only. Months are fetched in the background (3 at a time) the first time and saved for 30 days; offline, only
// saved months are used and an unsaved one is said to need a connection once. The horizon is 6 months from today's month; "Show later events"
// adds 6 more. One month on each side is also loaded so the adjustment can move an event across a month edge.
import { localDateKey } from "~/lib/dates";
import { monthRange, shiftMonth, windowEnd, type GregorianMonthRecord } from "~/lib/gregorianMonths";
import { legacyEvents, mergeEvents, placeEvents, validateReviewed, type EventDef } from "~/lib/islamicEvents";
import { addReminder, findReminder, readReminders, removeReminder, restoreReminder, setDone, split, type Reminder } from "~/lib/reminders";
import { getRaw } from "~/lib/storage";
import reviewed from "~/data/events/reviewed-events.json";
import { getGregorianMonth, hijriDeps } from "~/services/hijri.service";

export const HORIZON_STEP = 6;
export const HORIZON_MAX = 24;
const POOL = 3;

export type EventsState = "idle" | "loading" | "ready" | "needs-connection" | "error";

/** Every source merged once: the legacy events and the reviewed file (empty today). */
const merged = validateReviewed(reviewed);
export const ALL_EVENTS: EventDef[] = mergeEvents(legacyEvents(), merged.events);

export const useEvents = () => {
  const prefs = usePreferencesStore();
  const prayer = usePrayerTimes();
  const months = useState<Record<string, GregorianMonthRecord>>("events-months", () => ({}));
  const horizon = useState<number>("events-horizon", () => HORIZON_STEP);
  const state = useState<EventsState>("events-state", () => "idle");
  const failed = useState<string[]>("events-failed", () => []);
  const reminders = useState<Reminder[]>("events-reminders", () => []);

  const todayKey = computed(() => localDateKey(new Date(prayer.now.value)));
  const fiqhSet = () => getRaw("prayerFiqh") !== null;
  const wanted = computed(() => monthRange(shiftMonth(todayKey.value.slice(0, 7), -1), horizon.value + 2));
  const windowMonths = computed(() => monthRange(todayKey.value.slice(0, 7), horizon.value));
  const missing = computed(() => windowMonths.value.filter((m) => !months.value[m]));
  const end = computed(() => windowEnd(todayKey.value, horizon.value));
  const placed = computed(() => placeEvents({ events: ALL_EVENTS, months: Object.values(months.value), adjust: prefs.prefs.hijriAdjust, today: todayKey.value, end: end.value }));

  async function load(opts: { network?: boolean; limit?: number } = {}) {
    const network = opts.network ?? true;
    state.value = Object.keys(months.value).length ? state.value : "loading";
    const deps = hijriDeps();
    const todo = wanted.value.slice(0, opts.limit ?? wanted.value.length).filter((m) => !months.value[m] || network);
    const got: Record<string, GregorianMonthRecord> = { ...months.value };
    const bad: string[] = [];
    let kind: "offline" | "error" | null = null;
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const m = todo[next++]!;
        const r = await getGregorianMonth(deps, m, { network });
        if (r.status === "ok") got[m] = r.record;
        else {
          bad.push(m);
          kind ??= r.kind;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(POOL, todo.length) }, worker));
    months.value = got;
    failed.value = bad;
    const haveWindow = windowMonths.value.some((m) => got[m]);
    state.value = haveWindow ? "ready" : kind === "error" ? "error" : "needs-connection";
    return got;
  }

  function showLater() {
    if (horizon.value >= HORIZON_MAX) return;
    horizon.value += HORIZON_STEP;
    return load({ network: true });
  }

  // ---- reminders (the legacy list)
  const loadReminders = () => {
    reminders.value = readReminders();
  };
  const reminderFor = (title: string, date: string) => findReminder(reminders.value, title, date);
  function toggleReminder(title: string, date: string): { added: boolean; undo: () => void } | null {
    const have = reminderFor(title, date);
    if (have) {
      const gone = removeReminder(have.id);
      loadReminders();
      return gone ? { added: false, undo: () => (restoreReminder(gone), loadReminders()) } : null;
    }
    const r = addReminder(title, date);
    loadReminders();
    return r ? { added: true, undo: () => (removeReminder(r.id), loadReminders()) } : null;
  }
  function deleteReminder(id: string): (() => void) | null {
    const gone = removeReminder(id);
    loadReminders();
    return gone ? () => (restoreReminder(gone), loadReminders()) : null;
  }
  const markDone = (id: string, done: boolean) => {
    setDone(id, done);
    loadReminders();
  };
  const lists = computed(() => split(reminders.value, todayKey.value));

  return { months, horizon, state, failed, missing, placed, end, todayKey, fiqhSet, load, showLater, reminders, loadReminders, reminderFor, toggleReminder, deleteReminder, markDone, lists, issues: merged.issues };
};
