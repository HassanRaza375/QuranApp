// Prayer reminders: timers in the open page, from the cached monthly times, in the LOCATION's time zone.
// They cannot arrive while the app is closed (see lib/notifySchedule.ts). Mounted once, in the default layout, so it
// runs on every page; it asks for no permission and never asks for the device location (the saved place is used).
import { nextDelay, pendingReminders, reminderText } from "~/lib/notifySchedule";
import { notificationPermission, showNotificationNow } from "~/lib/notifyBrowser";

const MAX_WAIT_MS = 12 * 60 * 60 * 1000; // re-check at least twice a day (new month, settings, clock changes)

export const usePrayerNotifications = () => {
  const prefs = usePreferencesStore();
  const { location, loaded, load: loadLocation } = useLocation();
  const prayer = usePrayerTimes();
  const shown = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reloaded = false;

  const allDays = () => [...(prayer.record.value?.days ?? []), ...(prayer.nextRecordDays.value ?? [])];

  function schedule() {
    clearTimeout(timer);
    const cfg = prefs.prefs.notifications;
    const tz = prayer.record.value?.timezone;
    if (!cfg.enabled || !tz || notificationPermission() !== "granted") return;
    const now = new Date();
    const list = pendingReminders(cfg, allDays(), tz, now, shown);
    const delay = nextDelay(list, now);
    if (delay === null) {
      // nothing left in the cached months: fetch the next one once, then look again
      if (!reloaded) {
        reloaded = true;
        void prayer.load().then(schedule);
      }
      return;
    }
    timer = setTimeout(fire, Math.min(delay, MAX_WAIT_MS));
  }

  async function fire() {
    const cfg = prefs.prefs.notifications;
    const tz = prayer.record.value?.timezone;
    if (!cfg.enabled || !tz) return;
    const now = new Date();
    const due = pendingReminders(cfg, allDays(), tz, now, shown).filter((r) => r.fireAt.getTime() <= now.getTime() + 1000);
    for (const r of due) {
      shown.add(r.key);
      const text = reminderText(r, cfg.offset);
      await showNotificationNow({ ...text, tag: `prayer-${r.key}` });
    }
    schedule();
  }

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      // A reminder whose time passed while the tab was paused is shown if it is at most 5 minutes late, else skipped.
      void fire();
    }
  };

  onMounted(async () => {
    if (!loaded.value) loadLocation();
    if (prefs.prefs.notifications.enabled && location.value) await prayer.load();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
  });
  onBeforeUnmount(() => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  });

  watch(
    () => [prefs.prefs.notifications, prayer.record.value?.key, prayer.record.value?.fetchedAt, prayer.nextRecordDays.value?.length],
    () => {
      reloaded = false;
      schedule();
    },
    { deep: true },
  );

  return { schedule, fire };
};
