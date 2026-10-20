// The reminders list, in the legacy shape `quran:reminders:v1` = [{ id, title, date, note, recurringYearly, done, createdAt }]. A reminder is an
// item in this list: nothing is scheduled and no alert is sent (the app cannot notify when it is closed). Hifz and the legacy calendar read
// the same list. Unknown fields are kept; a damaged value reads as empty. Pure over the storage wrapper.
import { getJSON, setJSON } from "./storage";

export const REMINDERS_KEY = "quran:reminders:v1";

export interface Reminder {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  note: string;
  recurringYearly: boolean;
  done: boolean;
  createdAt: number;
  [k: string]: unknown;
}
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function readReminders(): Reminder[] {
  const raw = getJSON<unknown>(REMINDERS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const x = r as Partial<Reminder> | null;
    if (!x || typeof x !== "object" || typeof x.id !== "string" || typeof x.title !== "string" || typeof x.date !== "string" || !DAY_KEY.test(x.date)) return [];
    return [{ ...x, id: x.id, title: x.title, date: x.date, note: typeof x.note === "string" ? x.note : "", recurringYearly: !!x.recurringYearly, done: !!x.done, createdAt: typeof x.createdAt === "number" ? x.createdAt : 0 } as Reminder];
  });
}
const write = (list: Reminder[]): boolean => setJSON(REMINDERS_KEY, list);

const makeId = (): string => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/** The reminder for this title on this day, if there is one. */
export const findReminder = (list: Reminder[], title: string, date: string): Reminder | undefined => list.find((r) => r.title === title && r.date === date);

export function addReminder(title: string, date: string, now = Date.now()): Reminder | null {
  const list = readReminders();
  if (findReminder(list, title, date)) return findReminder(list, title, date)!;
  const r: Reminder = { id: makeId(), title: title.trim(), date, note: "", recurringYearly: false, done: false, createdAt: now };
  return write([...list, r]) ? r : null;
}
export function removeReminder(id: string): Reminder | null {
  const list = readReminders();
  const gone = list.find((r) => r.id === id) ?? null;
  if (!gone) return null;
  write(list.filter((r) => r.id !== id));
  return gone;
}
/** Puts a removed reminder back (Undo), in its old place when it can. */
export function restoreReminder(r: Reminder): boolean {
  const list = readReminders();
  if (list.some((x) => x.id === r.id)) return true;
  return write([...list, r].sort((a, b) => a.createdAt - b.createdAt));
}
export function setDone(id: string, done: boolean): boolean {
  return write(readReminders().map((r) => (r.id === id ? { ...r, done } : r)));
}

/** Upcoming (not done, today or later) first, then overdue (not done, earlier). Done reminders are not listed (as in the legacy list). */
export function split(list: Reminder[], today: string): { upcoming: Reminder[]; overdue: Reminder[] } {
  const open = list.filter((r) => !r.done);
  return { upcoming: open.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date)), overdue: open.filter((r) => r.date < today).sort((a, b) => a.date.localeCompare(b.date)) };
}
