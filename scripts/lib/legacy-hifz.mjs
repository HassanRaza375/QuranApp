// Loads the LEGACY Hifz composables (app/composables/useHifz.ts and useHifzSession.ts) as plain modules, so tests/hifzParity.test.ts can run the
// legacy grading, strength, new-ayah budget, migration and queue code itself against the same histories as the revamp's lib/hifz. The legacy
// files are not edited and not copied: they are transpiled in memory, with Nuxt's auto-imported names (`useState`, `useNuxtApp`, `computed`,
// `useHifz`) and `import.meta.client` stubbed, and the one data import (`~/assets/data/surah.json`) replaced by the two fields it reads.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const HIFZ = path.resolve(here, "../../legacy/app/composables/useHifz.ts");
const SESSION = path.resolve(here, "../../legacy/app/composables/useHifzSession.ts");
const SURAHS = path.resolve(here, "../../legacy/app/assets/data/surah.json");
const require = createRequire(path.resolve(here, "../../package.json"));

let loads = 0;

const toModule = (code) => import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);

/**
 * `storage` is `{ get(key, default), set(key, value) }` (the JSON-safe wrapper the legacy `$storage` plugin is).
 * Returns `{ hifz, session }`: the two legacy modules (`hifz.useHifz`, `session.useHifzSession`), sharing one state and one storage.
 */
export async function loadLegacyHifz(storage) {
  const ts = require("typescript");
  const id = `__legacyHifz${loads++}`;
  const transpile = (file) => ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const registry = (globalThis[id] = { storage, states: new Map() });

  const surahs = JSON.parse(fs.readFileSync(SURAHS, "utf8")).map((s) => ({ surahNo: s.surahNo, surahNameTranslation: s.surahNameTranslation }));
  const prelude =
    `const __r = globalThis[${JSON.stringify(id)}];\n` +
    "const useState = (key, init) => { if (!__r.states.has(key)) __r.states.set(key, { value: init() }); return __r.states.get(key); };\n" +
    "const useNuxtApp = () => ({ $storage: __r.storage });\n" +
    "const computed = (fn) => ({ get value() { return fn(); } });\n";

  let hifzSrc = transpile(HIFZ);
  const importLine = /import surahList from "~\/assets\/data\/surah\.json";/;
  if (!importLine.test(hifzSrc)) throw new Error("legacy useHifz.ts no longer imports surah.json the way the loader expects");
  hifzSrc = hifzSrc.replace(importLine, `const surahList = ${JSON.stringify(surahs)};`).replaceAll("import.meta.client", "true");
  const hifz = await toModule(prelude + hifzSrc);
  registry.useHifz = hifz.useHifz;

  const sessionSrc = transpile(SESSION).replaceAll("import.meta.client", "true");
  const session = await toModule(prelude + `const useHifz = __r.useHifz;\n` + sessionSrc);
  return { hifz, session };
}
