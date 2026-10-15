// DOM side effects of the preferences. The same flags the legacy useAccessibilityPrefs sets, so the CSS can
// key off them. The inline script in nuxt.config.ts (app/lib/noFlashScript.ts) does the same work before first
// paint; this runs after the store loads and on every change.
import { resolveTheme, type Preferences } from "./preferences";

export function applyPreferences(p: Preferences, root: HTMLElement = document.documentElement, systemDark = false) {
  const theme = resolveTheme(p.theme, systemDark);
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.dataset.highContrast = String(p.highContrast);
  root.dataset.largeTouch = String(p.largeTouchTargets);
  // The OS-level reduced-motion setting also counts, as in the legacy app.
  const osReduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.dataset.reducedMotion = String(p.reducedMotion || osReduced);
  root.style.setProperty("--arabic-font-scale", String(p.arabicScale));
}
