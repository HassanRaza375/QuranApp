// Prayer reminders: which reminders exist and when they fire. Pure, so it is unit-tested without a browser.
//
// What this can and cannot do (docs/phases/phase-02-settings-plan.md, section 4): reminders are timers in the open
// page. They cannot arrive while the app is closed (no push backend; scheduled local notifications are not available
// in any stable browser). The Settings page says so in one fixed sentence.
import { zonedInstant } from "./prayerClock";
import { PRAYERS, type PrayerDay, type PrayerName } from "./prayerMonth";

export interface NotifyConfig {
  enabled: boolean;
  prayers: Record<PrayerName, boolean>;
  /** minutes before the prayer; 0 = at prayer time */
  offset: number;
}

export const REMINDER_OFFSETS = [0, 5, 10, 15, 30] as const;
/** A reminder whose time passed while the tab was paused is still shown if it is at most this late. Older ones are skipped. */
export const LATE_GRACE_MS = 5 * 60 * 1000;

export interface Reminder {
  /** `YYYY-MM-DD:Prayer`, also used as the notification tag, so the same reminder never shows twice (even across tabs) */
  key: string;
  prayer: PrayerName;
  /** the prayer time itself */
  prayerAt: Date;
  /** when the reminder fires (prayer time minus the offset) */
  fireAt: Date;
}

/** All reminders for the given days, in time order, that are still worth showing at `now` and not already shown. */
export function pendingReminders(config: NotifyConfig, days: PrayerDay[], tz: string, now: Date, shown: ReadonlySet<string>): Reminder[] {
  if (!config.enabled) return [];
  const out: Reminder[] = [];
  for (const day of days) {
    for (const prayer of PRAYERS) {
      if (!config.prayers[prayer]) continue;
      const key = `${day.date}:${prayer}`;
      if (shown.has(key)) continue;
      const prayerAt = zonedInstant(day.date, day.timings[prayer], tz);
      const fireAt = new Date(prayerAt.getTime() - config.offset * 60_000);
      if (now.getTime() - fireAt.getTime() > LATE_GRACE_MS) continue; // too late: skipped, never shown stale
      out.push({ key, prayer, prayerAt, fireAt });
    }
  }
  return out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/** Milliseconds until the first reminder (0 when one is due or within the late allowance), or null when there is none. */
export function nextDelay(reminders: Reminder[], now: Date): number | null {
  const first = reminders[0];
  return first ? Math.max(0, first.fireAt.getTime() - now.getTime()) : null;
}

/** Notification text. */
export function reminderText(r: Reminder, offset: number): { title: string; body: string } {
  return offset > 0
    ? { title: `${r.prayer} soon`, body: `${r.prayer} begins in ${offset} minute${offset === 1 ? "" : "s"}.` }
    : { title: `${r.prayer} time`, body: `It is time for ${r.prayer} prayer.` };
}

export const DEFAULT_NOTIFY: NotifyConfig = {
  enabled: false,
  prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  offset: 0,
};

/** The fixed sentence the page shows next to the switch. */
export const NOTIFY_LIMIT_SENTENCE = "Reminders only appear while Quran App is open.";
