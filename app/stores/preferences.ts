// The one preferences store. Reads and writes the legacy localStorage keys through app/lib/preferences.ts.
// SPA-only (ssr: false), so it can read storage synchronously on creation; every change is persisted at once.
import { defineStore } from "pinia";
import { applyPreferences } from "~/lib/applyPreferences";
import { DEFAULTS, loadPreferences, preferencesForKey, savePreference, type Preferences } from "~/lib/preferences";

export const usePreferencesStore = defineStore("preferences", () => {
  const prefs = ref<Preferences>({ ...DEFAULTS });
  const loaded = ref(false);

  const systemDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  const apply = () => applyPreferences(prefs.value, document.documentElement, systemDark());

  function load() {
    prefs.value = loadPreferences();
    loaded.value = true;
    apply();
  }

  /** Re-reads every preference from storage (after Reset, Undo, or a bulk change) and applies it. */
  function reloadAll() {
    prefs.value = loadPreferences();
    apply();
  }

  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    prefs.value = { ...prefs.value, [key]: value };
    savePreference(key, value);
    apply();
  }

  /** Keeps several open tabs consistent, and follows the OS theme while the mode is "system". */
  function listen() {
    window.addEventListener("storage", (e) => {
      const keys = preferencesForKey(e.key);
      if (!keys.length) return;
      const fresh = loadPreferences();
      const next = { ...prefs.value } as Record<string, unknown>;
      for (const k of keys) next[k] = fresh[k];
      prefs.value = next as unknown as Preferences;
      apply();
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (prefs.value.theme === "system") apply();
    });
  }

  return { prefs, loaded, load, reloadAll, set, listen };
});
