import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { legacyBridge, LEGACY_APP } from "./build/legacyBridge.ts";

export default defineConfig({
  plugins: [legacyBridge()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
      "@legacy": LEGACY_APP,
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
