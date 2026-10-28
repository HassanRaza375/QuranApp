// Loads the LEGACY reading-goals and reminders composables (app/composables/useReadingGoals.ts, useReminders.ts) as plain modules, so
// tests/goalsParity.test.ts can run the legacy goal arithmetic, log and status changes beside the revamp's lib/goals on the same inputs. The legacy
// files are not edited and not copied: they are transpiled in memory with Nuxt's auto-imported names stubbed (`useState`, `useNuxtApp`, `computed`, `ref`,
// `watch`, `useReadingProgress`) and the legacy counts file (app/utils/quranAyahCounts.js, also vendored) loaded as it is, except that its one dynamic
// import of the surah list is answered with the vendored list.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const GOALS = path.resolve(here, "../../legacy/app/composables/useReadingGoals.ts");
const REMINDERS = path.resolve(here, "../../legacy/app/composables/useReminders.ts");
const COUNTS = path.resolve(here, "../../legacy/app/utils/quranAyahCounts.js");
const SURAHS = path.resolve(here, "../../legacy/app/assets/data/surah.json");
const require = createRequire(path.resolve(here, "../../package.json"));

let loads = 0;
const toModule = (code) => import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);

/**
 * `storage` is `{ get(key, default), set(key, value) }`. Returns `{ goals, reminders }`: `goals.useReadingGoals()` and `reminders.useReminders()`
 * sharing one state and one storage.
 */
export async function loadLegacyGoals(storage) {
  const ts = require("typescript");
  const id = `__legacyGoals${loads++}`;
  const transpile = (file) => ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  globalThis[id] = { storage, states: new Map() };

  const list = JSON.parse(fs.readFileSync(SURAHS, "utf8")).map((s) => ({ totalAyah: s.totalAyah }));
  let counts = fs.readFileSync(COUNTS, "utf8");
  const dyn = /import\("~\/assets\/data\/surah\.json"\)/;
  if (!dyn.test(counts)) throw new Error("legacy quranAyahCounts.js no longer imports surah.json the way the loader expects");
  counts = counts.replace(dyn, `Promise.resolve({ default: ${JSON.stringify(list)} })`);
  const countsModule = await toModule(counts);

  const prelude =
    `const __r = globalThis[${JSON.stringify(id)}];\n` +
    "const useState = (key, init) => { if (!__r.states.has(key)) __r.states.set(key, { value: init() }); return __r.states.get(key); };\n" +
    "const useNuxtApp = () => ({ $storage: __r.storage });\n" +
    "const computed = (fn) => ({ get value() { return fn(); } });\n" +
    "const ref = (v) => ({ value: v });\n" +
    "const watch = () => {};\n" +
    "const useReadingProgress = () => ({ progress: { value: null } });\n" +
    `const { TOTAL_QURAN_AYAHS, AYAHS_PER_PAGE, AYAHS_PER_JUZ, getAbsoluteAyahPosition } = globalThis[${JSON.stringify(id)}].counts;\n`;
  globalThis[id].counts = countsModule;

  const goals = await toModule(prelude + transpile(GOALS).replaceAll("import.meta.client", "true"));
  const reminders = await toModule(prelude + transpile(REMINDERS).replaceAll("import.meta.client", "true"));
  return { goals, reminders, counts: countsModule };
}
