import { defineConfig, devices } from "@playwright/test";

// Runs against the PRODUCTION build (offline and the service worker do not work in dev):
//   npm run build && npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // One worker, fixed, and no retries (a test that passes only on a second try is a flake we want to see). The suite has timing tests (the reader at 4x CPU, request counts, a
  // search cancelled by the next keystroke) and a single server on port 3011: with more than one worker, or with other programs loading the machine, those fail in a different
  // place every run (Phase 13: three full runs, three different sets of 30-second timeouts, each passing alone). See CLAUDE.md, "Working rules".
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", baseURL: "http://localhost:3011", ...devices["Desktop Chrome"], serviceWorkers: "allow" },
  webServer: {
    command: "node .output/server/index.mjs",
    env: { PORT: "3011", NITRO_PORT: "3011" },
    url: "http://localhost:3011",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
