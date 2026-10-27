import { defineConfig, devices } from "@playwright/test";

// The Daily Fiqh decision helpers are hidden in a production build until every path is signed off, and a production build FAILS if the flag that shows them is on (legacy decision B3).
// So they can only be exercised on the development server with the flag on. This config starts one (port 3013) and runs e2e-helpers/. One worker and no retries, as for the main suite.
//   npm run test:helpers
export default defineConfig({
  testDir: "./e2e-helpers",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 90_000,
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", baseURL: "http://localhost:3013", ...devices["Desktop Chrome"], serviceWorkers: "block" },
  webServer: {
    command: "npx nuxt dev --port 3013 --host localhost",
    env: { NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS: "true", NODE_ENV: "development" },
    url: "http://localhost:3013",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
