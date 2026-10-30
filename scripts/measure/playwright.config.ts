// Config for the dev-only measurements in this folder (not part of verify). The server is the production build on port 3014.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /(play|a11y)\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3014", ...devices["Desktop Chrome"], serviceWorkers: "block" },
  webServer: { command: "node ../../.output/server/index.mjs", env: { PORT: "3014", NITRO_PORT: "3014" }, url: "http://localhost:3014", reuseExistingServer: false, timeout: 60_000 },
});
