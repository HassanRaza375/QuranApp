// Calendar-day arithmetic on "YYYY-MM-DD" keys, done at noon UTC so a day never shifts (no `toISOString` of a local date). Pure.
const toDate = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12));
};
export const addDaysKey = (key: string, days: number): string => {
  const d = toDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
/** `to` minus `from` in whole days. */
export const daysBetweenKeys = (from: string, to: string): number => Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
/** 0 (Sunday) to 6 (Saturday). */
export const weekdayOfKey = (key: string): number => toDate(key).getUTCDay();
