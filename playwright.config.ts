import { defineConfig, devices } from "@playwright/test";

// Runs against the PRODUCTION build (offline and the service worker do not work in dev):
//   npm run build && npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
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
