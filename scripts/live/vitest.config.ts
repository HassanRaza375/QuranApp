// One-off live checks against the real services (NOT part of `npm test` or CI, which only run tests/**):
//   npx vitest run --config scripts/live/vitest.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { legacyBridge, LEGACY_APP } from "../../build/legacyBridge.ts";

export default defineConfig({
  plugins: [legacyBridge()],
  resolve: { alias: { "~": fileURLToPath(new URL("../../app", import.meta.url)), "@legacy": LEGACY_APP } },
  test: { include: ["scripts/live/*.live.ts"], testTimeout: 600_000 },
});
