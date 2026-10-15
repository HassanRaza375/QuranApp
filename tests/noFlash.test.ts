// The inline no-flash script and applyPreferences must agree, for the same stored values.
import { describe, expect, it } from "vitest";
import { applyPreferences } from "../app/lib/applyPreferences";
import { NO_FLASH_SCRIPT } from "../app/lib/noFlashScript";
import { loadPreferences } from "../app/lib/preferences";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

function fakeRoot() {
  const classes = new Set<string>();
  const style: Record<string, string> = {};
  const props: Record<string, string> = {};
  return {
    classList: { add: (c: string) => classes.add(c), toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)), contains: (c: string) => classes.has(c) },
    style: Object.assign(style, { setProperty: (k: string, v: string) => (props[k] = v) }),
    dataset: {} as Record<string, string>,
    props,
    classes,
  };
}

function runScript(stored: Record<string, string>, systemDark: boolean, osReduced = false) {
  const root = fakeRoot();
  const win = {
    localStorage: memoryStore(stored),
    matchMedia: (q: string) => ({ matches: q.includes("dark") ? systemDark : osReduced }),
  };
  new Function("document", "window", NO_FLASH_SCRIPT)({ documentElement: root }, win);
  return root;
}

function runApply(stored: Record<string, string>, systemDark: boolean, osReduced = false) {
  setStorageBackend(memoryStore(stored));
  const root = fakeRoot();
  const g = globalThis as unknown as Record<string, unknown>;
  const before = g.matchMedia;
  g.matchMedia = (q: string) => ({ matches: q.includes("reduced") ? osReduced : false });
  applyPreferences(loadPreferences(), root as unknown as HTMLElement, systemDark);
  g.matchMedia = before;
  setStorageBackend(null);
  return root;
}

const CASES: [string, Record<string, string>, boolean, boolean][] = [
  ["nothing stored: light", {}, true, false],
  ["dark", { themeMode: "dark" }, false, false],
  ["system + OS dark", { themeMode: "system" }, true, false],
  ["system + OS light", { themeMode: "system" }, false, false],
  ["accessibility flags and scale", { themeMode: "light", "quran:accessibility:v1": JSON.stringify({ highContrast: true, largeTouchTargets: true, reducedMotion: true, arabicFontScale: 1.4 }) }, false, false],
  ["OS reduced motion", {}, false, true],
  ["corrupt accessibility JSON", { "quran:accessibility:v1": "{oops" }, false, false],
];

describe("no-flash script vs applyPreferences", () => {
  for (const [name, stored, dark, reduced] of CASES) {
    it(name, () => {
      const a = runScript(stored, dark, reduced);
      const b = runApply(stored, dark, reduced);
      expect(a.classes.has("dark")).toBe(b.classes.has("dark"));
      expect(a.dataset).toEqual(b.dataset);
      expect(a.props["--arabic-font-scale"] ?? "1").toBe(b.props["--arabic-font-scale"] ?? "1");
    });
  }

  it("defaults to light when nothing is stored, even if the OS is dark", () => {
    expect(runScript({}, true).classes.has("dark")).toBe(false);
  });

  it("never throws if storage is blocked", () => {
    const root = fakeRoot();
    const win = { get localStorage(): never { throw new Error("blocked"); }, matchMedia: () => ({ matches: false }) };
    expect(() => new Function("document", "window", NO_FLASH_SCRIPT)({ documentElement: root }, win)).not.toThrow();
  });
});
