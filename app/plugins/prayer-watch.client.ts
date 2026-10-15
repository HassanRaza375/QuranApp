// Keeps the prayer times in step with the settings: when the fiqh or the calculation method/school change (in Settings,
// in another tab, or by the legacy app writing the same keys), or the saved place moves to a different one, the right
// month is loaded for the new combination. Without this, Home would keep showing the old combination until a reload.
//
// It reacts to CHANGES only. The first time the saved place is read (null to a place, on any page) it does nothing:
// the page that needs prayer times (Home, Settings, the reminders) loads them itself, so opening an unrelated page
// never makes a network request.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", () => {
    nuxtApp.runWithContext(() => {
      const prefs = usePreferencesStore();
      const { location } = useLocation();
      const prayer = usePrayerTimes();
      watch(
        () => [location.value?.lat, location.value?.lon, prefs.prefs.fiqh, prefs.prefs.calc.sunniMethod, prefs.prefs.calc.jafariMethod, prefs.prefs.calc.asr] as const,
        (now, before) => {
          const firstRead = before[0] === undefined && before[1] === undefined; // the place was not known yet
          if (location.value && !firstRead) void prayer.load();
        },
      );
    });
  });
});
