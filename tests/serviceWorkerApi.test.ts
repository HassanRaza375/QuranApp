// Phase 17A: the service worker never answers /api/* (and above all /api/auth/*) with the app shell or from a cache. Reads the real
// workbox block of nuxt.config.ts and runs each runtimeCaching urlPattern and the navigation denylist over API addresses. The browser
// half (a page controlled by the real worker) is e2e/apiServiceWorker.spec.ts.
import { beforeAll, describe, expect, it } from "vitest";

type Pattern = (o: { url: URL; request: { cache: string; destination: string; mode: string } }) => boolean;
interface Workbox {
  navigateFallback: string;
  navigateFallbackDenylist: RegExp[];
  runtimeCaching: { urlPattern: Pattern | RegExp; handler: string }[];
}

let workbox: Workbox;
let routeRules: Record<string, { headers?: Record<string, string> }>;

beforeAll(async () => {
  (globalThis as { defineNuxtConfig?: unknown }).defineNuxtConfig = (c: unknown) => c;
  const config = (await import("../nuxt.config")).default as unknown as { pwa: { workbox: Workbox }; nitro: { routeRules: typeof routeRules } };
  workbox = config.pwa.workbox;
  routeRules = config.nitro.routeRules;
});

const ORIGIN = "https://quran-app-znfc.vercel.app";
const API = ["/api/health", "/api/sync/pull?since=0", "/api/sync/push", "/api/auth/get-session", "/api/auth/sign-in/email", "/api/auth/callback/google?code=x&state=y", "/api/avatar/sign"];
const requests = [
  { cache: "default", destination: "", mode: "cors" }, // fetch() from the page
  { cache: "default", destination: "document", mode: "navigate" }, // a navigation (the OAuth callback)
  { cache: "no-store", destination: "", mode: "cors" },
];

describe("the service worker and /api", () => {
  it("navigations to /api/* are never answered with the app shell", () => {
    expect(workbox.navigateFallback).toBe("/");
    for (const p of API) {
      const pathname = new URL(p, ORIGIN).pathname;
      expect(
        workbox.navigateFallbackDenylist.some((re) => re.test(pathname)),
        p,
      ).toBe(true);
    }
  });

  it("no runtime caching rule matches a same-origin /api/ request, so the worker leaves it to the network", () => {
    expect(workbox.runtimeCaching.length).toBeGreaterThan(0);
    for (const rule of workbox.runtimeCaching) {
      for (const p of API) {
        const url = new URL(p, ORIGIN);
        for (const request of requests) {
          const hit = rule.urlPattern instanceof RegExp ? rule.urlPattern.test(url.href) : rule.urlPattern({ url, request });
          expect(hit, `${rule.handler} rule matched ${p} (${request.mode})`).toBe(false);
        }
      }
    }
  });

  it("the denylist still lets every app route fall back to the shell", () => {
    for (const p of ["/", "/settings", "/surah/18", "/api-notes", "/library"]) expect(workbox.navigateFallbackDenylist.some((re) => re.test(p)), p).toBe(false);
  });

  it("every /api/ answer is sent with Cache-Control: no-store", () => {
    expect(routeRules["/api/**"]?.headers?.["cache-control"]).toBe("no-store");
  });
});
