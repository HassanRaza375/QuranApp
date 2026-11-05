// Phase 17A: with the real service worker controlling the page, /api/* and /api/auth/* reach the server, never the app shell or a
// cache (the config half is tests/serviceWorkerApi.test.ts). Also /api/health on both servers: sync off (3011) and sync on with a
// database that cannot be reached (3013, playwright.config.ts).
import { expect, test } from "@playwright/test";
import { localDateKey } from "../app/lib/dates";
import { loadAndControl } from "./helpers";
import { ayahEntry, forbidRealApis, seed } from "./mocks";

test.describe("the service worker leaves /api alone", () => {
  test.beforeEach(async ({ context }) => {
    await forbidRealApis(context);
    await seed(context, { "ayah-of-day": ayahEntry(localDateKey(new Date())) });
  });

  test("navigations to /api/health and to the Google sign-in callback reach the server, not the shell", async ({ page }) => {
    await loadAndControl(page);
    const health = await page.goto("/api/health");
    expect(health!.fromServiceWorker()).toBe(false);
    expect(health!.headers()["content-type"]).toContain("application/json");
    expect(health!.headers()["cache-control"]).toBe("no-store");
    expect(await health!.json()).toEqual({ ok: true, sync: "off" });

    const callback = await page.goto("/api/auth/callback/google?code=x&state=y");
    expect(callback!.fromServiceWorker()).toBe(false);
    expect(callback!.status()).toBe(404); // until 17B adds Better Auth's route: the /api catch-all, not the shell
    expect(callback!.headers()["content-type"] ?? "").not.toContain("text/html");
    expect(await callback!.text()).not.toContain('id="__nuxt"');
  });

  test("fetches to /api/auth/* and /api/sync/* from a controlled page go to the network, and fail offline instead of showing the shell", async ({ page, context }) => {
    await loadAndControl(page);
    const seen: { url: string; fromSW: boolean }[] = [];
    page.on("response", (r) => {
      if (new URL(r.url()).pathname.startsWith("/api/")) seen.push({ url: r.url(), fromSW: r.fromServiceWorker() });
    });
    const online = await page.evaluate(async () => {
      const out: string[] = [];
      for (const p of ["/api/auth/get-session", "/api/sync/pull?since=0", "/api/health"]) {
        const r = await fetch(p);
        out.push(`${p} ${r.status} ${r.headers.get("content-type")?.includes("text/html") ? "html" : "not-html"}`);
      }
      return out;
    });
    expect(online).toEqual(["/api/auth/get-session 404 not-html", "/api/sync/pull?since=0 404 not-html", "/api/health 200 not-html"]);
    expect(seen.length).toBe(3);
    expect(seen.filter((s) => s.fromSW)).toEqual([]);

    await context.setOffline(true);
    const offline = await page.evaluate(async () =>
      Promise.all(
        ["/api/auth/get-session", "/api/health"].map((p) =>
          fetch(p).then(
            (r) => (r.headers.get("content-type")?.includes("text/html") ? "html-shell" : `status-${r.status}`),
            () => "network-error",
          ),
        ),
      ),
    );
    expect(offline).toEqual(["network-error", "network-error"]);
  });
});

test("the server answers an /api/ address no route serves with a JSON 404, never the app shell", async ({ request }) => {
  for (const p of ["/api/nothing-here", "/api/sync/pull", "/api/auth/get-session", "/api/a/b/c?x=1"]) {
    for (const method of ["get", "post"] as const) {
      const r = await request[method](p);
      expect(r.status(), `${method} ${p}`).toBe(404);
      expect(r.headers()["content-type"], `${method} ${p}`).toContain("application/json");
      expect(await r.json()).toEqual({ error: "not_found" });
    }
  }
  // the existing routes still answer, and the app's own pages still get the shell
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/settings")).headers()["content-type"]).toContain("text/html");
});

test.describe("/api/health", () => {
  test("with sync off it says so (and touches no database)", async ({ request }) => {
    const r = await request.get("/api/health");
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true, sync: "off" });
  });

  test("with sync on and an unreachable database it answers 503 quickly, naming no host", async ({ request }) => {
    const t0 = Date.now();
    const r = await request.get("http://localhost:3013/api/health");
    expect(r.status()).toBe(503);
    expect(r.headers()["cache-control"]).toBe("no-store");
    const text = await r.text();
    expect(JSON.parse(text)).toEqual({ ok: false, sync: "on", db: "down" });
    expect(text).not.toMatch(/blocked|invalid|postgres/);
    expect(Date.now() - t0).toBeLessThan(10_000);
  });
});
