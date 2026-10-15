// Calendar-day helpers. "Today" is always the device's LOCAL calendar day, built from the local year, month and
// day fields. Never `toISOString().slice(0, 10)`: that is the UTC date and is wrong for several hours a day
// everywhere except UTC itself (CLAUDE.md, "Use local-calendar-day keys").
const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" in the device's local calendar. */
export const localDateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM" in the device's local calendar. */
export const localMonthKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/**
 * The UTC date, "YYYY-MM-DD". Exists ONLY to write the `date` field of the legacy `ayah-of-day` entry exactly the way
 * the legacy app compares it. Never use it to decide what "today" is.
 */
export const legacyUtcDateKey = (d: Date): string => d.toISOString().slice(0, 10);

/** Days in a month; `month` is 1 to 12. */
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** The month after "YYYY-MM". */
export const nextMonthKey = (key: string): string => {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
};

/** Days left in the local month including today (1 on the last day). */
export const daysLeftInMonth = (d: Date): number => daysInMonth(d.getFullYear(), d.getMonth() + 1) - d.getDate() + 1;
