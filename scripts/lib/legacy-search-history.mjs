// Loads the LEGACY search-history composable (app/composables/useSearchHistory.ts) as a plain module so a test can run its own code beside the
// revamp's. It is not edited or copied: it is transpiled in memory with Nuxt's auto-imported names stubbed (`useState`, `useNuxtApp`) and
// `import.meta.client` replaced. `storage` is the legacy `$storage` wrapper's shape: { get(key, default), set(key, value) }.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, "../../legacy/app/composables/useSearchHistory.ts");
const require = createRequire(path.resolve(here, "../../package.json"));

export async function loadLegacySearchHistory(storage) {
  const ts = require("typescript");
  const out = ts.transpileModule(fs.readFileSync(SOURCE, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const prelude = "const useState = (_k, init) => ({ value: init() });\nconst useNuxtApp = () => ({ $storage: globalThis.__legacyStorage });\n";
  const code = prelude + out.replaceAll("import.meta.client", "true");
  globalThis.__legacyStorage = storage;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);
}
