// Small display helpers for the Ramadan page. Pure.

/** "Monday 8 February 2027" for a "YYYY-MM-DD" key (a calendar day, never shifted by a time zone). */
export const formatLongDate = (key: string): string => {
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).formatToParts(new Date(`${key}T12:00:00Z`));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`;
};
/** "Mon 8 Feb". */
export const formatShortDate = (key: string): string => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/**
 * One flag for the calendar's name on the page. While it is true the basis line names the calendar the service reports ("Hijri Calendar of
 * Saudi Arabia (HJCoSA)", the service's own code); set it to false to show only "Dates are calculated." until the name is reviewed
 * (CONTENT_TO_VERIFY.md). Nothing else changes.
 */
export const SHOW_CALENDAR_BASIS = true;

/** The line under a date: who set it, or what it follows, and that local sighting can differ. */
export function basisLine(source: "manual" | "calendar" | null, basis: string | null, show: boolean = SHOW_CALENDAR_BASIS): string {
  if (source === "manual") return "The start date was set by you.";
  return show && basis ? `Dates follow the ${basis}. Local sighting can differ by a day.` : "Dates are calculated. Local sighting can differ by a day.";
}
