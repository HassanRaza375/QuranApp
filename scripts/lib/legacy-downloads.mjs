// Loads the LEGACY downloads composable (app/composables/useDownloads.ts) as a plain module so a test can run its own code beside the revamp's
// manifest. It is not edited or copied: it is transpiled in memory with Nuxt's auto-imported names stubbed (`useState`, `useNuxtApp`,
// `useChapters`, `useTafsir`, `useQuranDB`) and `import.meta.client` replaced. `deps` supplies what those stubs return; the Cache Storage API
// the legacy code calls (`caches`, `window`, `fetch`) is read from `globalThis`, which the test sets and restores.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, "../../legacy/app/composables/useDownloads.ts");
const require = createRequire(path.resolve(here, "../../package.json"));

/** @param {{ storage: { get(k: string, d: unknown): unknown; set(k: string, v: unknown): void }, chapters: object, tafsir: object, db: object }} deps */
export async function loadLegacyDownloads(deps) {
  const ts = require("typescript");
  const out = ts.transpileModule(fs.readFileSync(SOURCE, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const prelude = [
    "const useState = (k, init) => (globalThis.__legacyDl.state[k] ??= { value: init() });",
    "const useNuxtApp = () => ({ $storage: globalThis.__legacyDl.storage });",
    "const useChapters = () => globalThis.__legacyDl.chapters;",
    "const useTafsir = () => globalThis.__legacyDl.tafsir;",
    "const useQuranDB = () => globalThis.__legacyDl.db;",
    "",
  ].join("\n");
  const code = prelude + out.replaceAll("import.meta.client", "true");
  globalThis.__legacyDl = { state: {}, ...deps };
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);
}
