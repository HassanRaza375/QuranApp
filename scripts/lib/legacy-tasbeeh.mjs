// Loads the LEGACY Tasbeeh composable (app/composables/useTasbeeh.ts) as a plain module, so the generator can read its dhikr presets and the
// tests can run the legacy counting code itself against the same data as the revamp's. The legacy file is not edited and not copied: it is
// transpiled in memory, with Nuxt's auto-imported names (`useState`, `useNuxtApp`) and `import.meta.client` stubbed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, "../../legacy/app/composables/useTasbeeh.ts");
const require = createRequire(path.resolve(here, "../../package.json"));

/** `storage` is `{ get(key, default), set(key, value) }` (the JSON-safe wrapper the legacy `$storage` plugin is). */
export async function loadLegacyTasbeeh(storage) {
  const ts = require("typescript");
  const out = ts.transpileModule(fs.readFileSync(SOURCE, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const prelude = "const useState = (_k, init) => ({ value: init() });\nconst useNuxtApp = () => ({ $storage: globalThis.__legacyStorage });\n";
  const code = prelude + out.replaceAll("import.meta.client", "true");
  globalThis.__legacyStorage = storage;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);
}
