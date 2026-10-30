export interface Reminder {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD", local
  note: string;
  recurringYearly: boolean;
  done: boolean;
  createdAt: number;
}

const STORAGE_KEY = "quran:reminders:v1";

// Local-calendar-day keys — same convention used across the goals/Ramadan/Hifz modules.
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => toDateKey(new Date());

export const useReminders = () => {
  const reminders = useState<Reminder[]>("reminders", () => []);

  const getStorage = () => useNuxtApp().$storage;

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    reminders.value = $storage.get(STORAGE_KEY, []) ?? [];
  };

  const persist = () => {
    if (!import.meta.client) return;
    getStorage()?.set(STORAGE_KEY, reminders.value);
  };

  const createReminder = (opts: { title: string; date: string; note?: string; recurringYearly?: boolean }) => {
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: opts.title.trim(),
      date: opts.date,
      note: opts.note?.trim() ?? "",
      recurringYearly: !!opts.recurringYearly,
      done: false,
      createdAt: Date.now(),
    };
    reminders.value = [...reminders.value, reminder];
    persist();
    return reminder;
  };

  const toggleDone = (id: string) => {
    reminders.value = reminders.value.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
    persist();
  };

  const deleteReminder = (id: string) => {
    reminders.value = reminders.value.filter((r) => r.id !== id);
    persist();
  };

  const upcoming = computed(() =>
    reminders.value
      .filter((r) => !r.done && r.date >= todayKey())
      .sort((a, b) => a.date.localeCompare(b.date))
  );

  const overdue = computed(() =>
    reminders.value
      .filter((r) => !r.done && r.date < todayKey())
      .sort((a, b) => a.date.localeCompare(b.date))
  );

  return { reminders, upcoming, overdue, load, createReminder, toggleDone, deleteReminder, todayKey };
};
