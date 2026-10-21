// Loads the LEGACY player composable (app/composables/useAudioPlayer.ts) as a plain module so tests can run its own storage code beside the
// revamp's. The file is not edited or copied: it is transpiled in memory with Nuxt's auto-imported names stubbed (`useState`, `useNuxtApp`,
// `onMounted` (run at once), `watch`, `computed`) and a recording `Audio` class. `storage` is the legacy `$storage` wrapper's shape.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, "../../../app/composables/useAudioPlayer.ts");
const require = createRequire(path.resolve(here, "../../package.json"));

export async function loadLegacyAudioPlayer(storage) {
  const ts = require("typescript");
  const out = ts.transpileModule(fs.readFileSync(SOURCE, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const prelude = `
const useState = (_k, init) => ({ value: init() });
const useNuxtApp = () => ({ $storage: globalThis.__legacyStorage });
const onMounted = (fn) => fn();
const watch = () => {};
const computed = (fn) => ({ get value() { return fn(); } });
const useChapters = () => ({});
const useReciter = () => ({ selected: { value: null } });
class Audio {
  constructor() { this.src = ""; this.currentTime = 0; this.playbackRate = 1; this.h = {}; (globalThis.__legacyAudios ??= []).push(this); }
  addEventListener(n, f) { (this.h[n] ??= []).push(f); }
  emit(n) { (this.h[n] ?? []).forEach((f) => f()); }
  play() { return Promise.resolve(); }
  pause() { this.emit("pause"); }
}
`;
  const code = prelude + out.replaceAll("import.meta.client", "true");
  globalThis.__legacyStorage = storage;
  globalThis.__legacyAudios = [];
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`);
  return { ...mod, audios: globalThis.__legacyAudios };
}
