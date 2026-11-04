import { defineConfig, devices } from "@playwright/test";

// Phase 17: the servers under test can reach no real service, whatever the shell or a local .env holds. `.invalid` never resolves, and
// every service key is blank (tests/syncFoundation.test.ts checks this file).
const NO_SERVICES = {
  DATABASE_URL: "postgres://blocked.invalid:5432/none",
  BETTER_AUTH_SECRET: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  CLOUDINARY_URL: "",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  RESEND_API_KEY: "",
};

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
  webServer: [
    {
      // The app as production runs it today: sync off.
      command: "node .output/server/index.mjs",
      env: { PORT: "3011", NITRO_PORT: "3011", NUXT_PUBLIC_SYNC_ENABLED: "false", ...NO_SERVICES },
      url: "http://localhost:3011",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Phase 17: the same build with the server's sync flag on (Nuxt reads NUXT_PUBLIC_SYNC_ENABLED at request time), for the server
      // routes only. Its database URL cannot resolve, so /api/health must answer "down" quickly instead of hanging.
      command: "node .output/server/index.mjs",
      env: { PORT: "3013", NITRO_PORT: "3013", NUXT_PUBLIC_SYNC_ENABLED: "1", ...NO_SERVICES },
      url: "http://localhost:3013",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
