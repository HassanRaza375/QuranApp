// Lets the revamp import pure legacy code (data, utils) without copying it.
//   import { ... } from "@legacy/utils/commandsSearch"
// Legacy files import their own data with the Nuxt alias `~/data/...`. Inside the revamp, `~` is the revamp's
// own app folder, so this plugin rewrites `~/...` to the legacy folder, but only for files that live in the
// legacy app. Revamp code is unaffected.
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Plugin } from "vite";

export const LEGACY_APP = path.resolve(fileURLToPath(new URL("../../app", import.meta.url)));

const slash = (p: string) => p.replace(/\\/g, "/");

export function legacyBridge(): Plugin {
  const root = slash(LEGACY_APP);
  return {
    name: "legacy-bridge",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith("~/")) return null;
      if (!slash(importer).startsWith(root + "/")) return null;
      return this.resolve(path.join(LEGACY_APP, source.slice(2)), importer, { ...options, skipSelf: true });
    },
  };
}
