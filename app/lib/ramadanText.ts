// Small display helpers for the Ramadan page. Pure.

/** "Monday 8 February 2027" for a "YYYY-MM-DD" key (a calendar day, never shifted by a time zone). */
export const formatLongDate = (key: string): string => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** "Mon 8 Feb". */
export const formatShortDate = (key: string): string => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
