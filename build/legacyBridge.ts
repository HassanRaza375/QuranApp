// Lets the revamp import pure legacy code (data, utils) without copying it.
//   import { ... } from "@legacy/utils/commandsSearch"
// Legacy files import their own data with the Nuxt alias `~/data/...` (no file extension). Inside the revamp, `~` is
// the revamp's own app folder, so a legacy file's `~/utils/x` would point at `revamp-quran/app/utils/x`, which does
// not exist. This plugin sends such imports, made by files that live in the legacy app, to the legacy folder.
// Revamp code is unaffected.
//
// Two forms reach the plugin: `~/utils/x` as written (Vitest), and `<revamp>/app/utils/x` after Vite's alias step has
// already replaced `~` (the Nuxt build). Both are handled. The file is located here with explicit extensions, because
// Vite 8's resolver does not add extensions to an absolute path.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

export const LEGACY_APP = path.resolve(fileURLToPath(new URL("../../app", import.meta.url)));
export const REVAMP_APP = path.resolve(fileURLToPath(new URL("../app", import.meta.url)));

const slash = (p: string) => p.replace(/\\/g, "/");
const SUFFIXES = ["", ".ts", ".js", ".mjs", ".json", "/index.ts", "/index.js"];

function locate(base: string): string | null {
  for (const suffix of SUFFIXES) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return slash(candidate);
  }
  return null;
}

/** `~/data/x` (as written) to the legacy file, or null. */
export const resolveLegacyFile = (spec: string): string | null => locate(path.join(LEGACY_APP, spec.slice(2)));

export function legacyBridge(): Plugin {
  const legacyRoot = slash(LEGACY_APP);
  const revampRoot = slash(REVAMP_APP);
  return {
    name: "legacy-bridge",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null;
      if (!slash(importer.split("?")[0]!).startsWith(legacyRoot + "/")) return null;
      const s = slash(source.split("?")[0]!);
      if (s.startsWith("~/")) return resolveLegacyFile(s);
      // the alias step already turned `~/x` into `<revamp>/app/x`: if that file does not exist but the legacy one does, use it
      if (s.startsWith(revampRoot + "/") && !locate(s)) return locate(path.join(LEGACY_APP, s.slice(revampRoot.length + 1)));
      return null;
    },
  };
}
