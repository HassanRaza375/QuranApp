// Dev-only (not part of verify): an accessibility sweep over every legacy route that has a page, and a keyboard walk of each page.
//   npm run build && npm run test:a11y        (OUT=<result.json> keeps the full result; not part of verify: run at the end of each phase)
// It fails when any route has a violation of the rules below, or when focus gets stuck on a page.
// 1. axe-core (WCAG 2.0 A and AA, 2.1 AA, 2.2 AA rules) on each route at 1280 and 375 px, light and dark. Services are mocked (recorded or synthetic answers), so
//    pages show content; anything a mock does not answer is blocked, so some pages show their empty or offline state.
// 2. A keyboard walk at 1280 px: Tab through the page, and record every stop (what it is, whether it has a visible focus indicator, whether it is on screen),
//    whether focus gets stuck, and the interactive elements that Tab never reached (members of a roving group, such as radio groups and the calendar grid, are
//    counted separately: only one of them is a tab stop by design).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { concrete, DEFERRED_ROUTES, LEGACY_ROUTES } from "../../tests/legacyRoutes";
import { forbidRealApis, freezeClock, LAHORE_LEGACY, mockAladhan, mockHijri, mockQuranText, mockVerse, seed } from "../../e2e/mocks";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ?? path.resolve(HERE, "a11y-result.json");
const ROUTES = LEGACY_ROUTES.filter((r) => !(DEFERRED_ROUTES as readonly string[]).includes(r)).map(concrete);
const VIEWS = [
  { name: "1280", width: 1280, height: 900 },
  { name: "375", width: 375, height: 812 },
];

const result: { axe: Record<string, unknown[]>; keys: Record<string, unknown> } = { axe: {}, keys: {} };
const save = () => fs.writeFileSync(OUT, JSON.stringify(result, null, 1));

async function setup(context: BrowserContext, theme: string) {
  await forbidRealApis(context);
  await freezeClock(context, "2026-10-15T09:14:00+05:00");
  await mockAladhan(context);
  await mockHijri(context);
  await mockQuranText(context);
  await mockVerse(context);
  await seed(context, {
    themeMode: theme,
    last_location: LAHORE_LEGACY,
    "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10, surahName: "x", surahNameArabic: "x", totalAyah: 110, updatedAt: 1 }),
    "quran:reading-goals:v1": JSON.stringify({ goals: [{ id: "a", type: "ayahs-per-day", label: "10 ayahs/day", startDate: "2026-10-01", targetDate: null, dailyAyahTarget: 10, startAbsoluteAyah: 0, preferredDays: [0, 1, 2, 3, 4, 5, 6], status: "active", createdAt: 1 }], activeGoalId: "a", dailyLog: { "2026-10-15": ["2:1"] } }),
  });
}
async function open(page: Page, route: string) {
  await page.goto(route).catch(() => undefined);
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#__nuxt").waitFor();
  await page.waitForTimeout(900);
}

test.describe.configure({ mode: "serial" });
test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });

test("axe: every route, 1280 and 375, light and dark", async ({ browser }) => {
  test.setTimeout(3_000_000);
  for (const theme of ["light", "dark"]) {
    for (const v of VIEWS) {
      const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
      await setup(context, theme);
      const page = await context.newPage();
      for (const route of ROUTES) {
        await open(page, route);
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        result.axe[`${theme} ${v.name} ${route}`] = r.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, count: x.nodes.length, first: x.nodes[0]?.target?.join(" ") ?? "", html: String(x.nodes[0]?.html ?? "").slice(0, 160) }));
      }
      save();
      await context.close();
    }
  }
  const failing = Object.entries(result.axe).filter(([, v]) => v.length);
  expect(failing.map(([k, v]) => `${k}: ${(v as Array<{ id: string }>).map((x) => x.id).join(", ")}`), "pages with accessibility violations").toEqual([]);
});

test("keyboard walk: every route at 1280 px", async ({ browser }) => {
  test.setTimeout(3_000_000);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await setup(context, "light");
  const page = await context.newPage();
  for (const route of ROUTES) {
    await open(page, route);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const reachable = await page.evaluate(() => {
      const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"]';
      const vis = (e: Element) => {
        const r = (e as HTMLElement).getBoundingClientRect();
        const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
      };
      return [...document.querySelectorAll(sel)].filter(vis).length;
    });
    const stops: Array<{ tag: string; name: string; indicator: boolean; onScreen: boolean }> = [];
    let stuck = 0;
    let prev = "";
    const cap = Math.min(220, reachable + 12);
    for (let i = 0; i < cap; i++) {
      await page.keyboard.press("Tab");
      const s = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement | null;
        if (!e || e === document.body) return null;
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
        const after = getComputedStyle(e, "::after");
        const shadow = cs.boxShadow !== "none" || after.boxShadow !== "none";
        const name = (e.getAttribute("aria-label") || e.getAttribute("title") || e.textContent || (e as HTMLInputElement).value || e.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 50);
        const id = `${e.tagName}|${e.getAttribute("data-testid") ?? ""}|${name}|${Math.round(r.top)}|${Math.round(r.left)}`;
        return { tag: e.tagName.toLowerCase() + (e.getAttribute("role") ? `[${e.getAttribute("role")}]` : ""), name, indicator: outline || shadow, onScreen: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, id };
      });
      if (!s) {
        stops.push({ tag: "(left the page)", name: "", indicator: true, onScreen: true });
        break;
      }
      if (s.id === prev) {
        stuck++;
        if (stuck >= 2) break;
      } else stuck = 0;
      prev = s.id;
      stops.push({ tag: s.tag, name: s.name, indicator: s.indicator, onScreen: s.onScreen });
    }
    result.keys[route] = {
      reachable,
      stops: stops.length,
      stuck: stuck >= 2,
      noIndicator: stops.filter((x) => !x.indicator).map((x) => `${x.tag} "${x.name}"`).slice(0, 8),
      offScreen: stops.filter((x) => !x.onScreen).length,
      noName: stops.filter((x) => !x.name && x.tag !== "(left the page)").map((x) => x.tag).slice(0, 8),
      capped: stops.length >= cap,
    };
  }
  save();
  await context.close();
  const bad = Object.entries(result.keys).filter(([, v]) => (v as { stuck: boolean; noIndicator: string[] }).stuck || (v as { noIndicator: string[] }).noIndicator.length);
  expect(bad.map(([k]) => k), "pages where focus gets stuck or a stop has no focus indicator").toEqual([]);
});
