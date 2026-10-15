// The legacy bridge (@legacy alias), public meta, and navigation.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_APP } from "../build/legacyBridge";
import { PUBLIC_META, injectPublicMeta } from "../app/lib/publicMeta";
import { NAV, NAV_FOOTER } from "../app/lib/nav";

describe("legacy bridge", () => {
  it("imports a pure legacy util whose own data import uses the ~/ alias", async () => {
    const { searchCommands, COMMAND_TYPE_FILTERS } = await import("@legacy/utils/commandsSearch");
    const { QURAN_COMMANDS } = await import("@legacy/data/quranCommands");
    expect(QURAN_COMMANDS.length).toBeGreaterThan(0);
    expect(COMMAND_TYPE_FILTERS.length).toBeGreaterThan(0);
    expect(searchCommands(QURAN_COMMANDS, "").length).toBeGreaterThan(0);
  });

  it("imports legacy plain-JS and JSON data", async () => {
    const { FIQH_PARAMS } = await import("@legacy/utils/prayerFiqh.js");
    expect(Object.keys(FIQH_PARAMS).sort()).toEqual(["jafari", "sunni"]);
    const surahs = (await import("@legacy/assets/data/surah.json")).default;
    expect(surahs).toHaveLength(114);
  });

  it("points at the legacy app folder", () => {
    expect(fs.existsSync(path.join(LEGACY_APP, "pages", "index.vue"))).toBe(true);
  });
});

describe("prerendered public pages", () => {
  const html = "<html><head><title>Quran App</title></head><body></body></html>";

  it("injects the page's own title, description and Open Graph tags", () => {
    const out = injectPublicMeta("/about", html);
    expect(out).toContain("<title>About · Quran App</title>");
    expect(out).toContain('<meta name="description" content="About the Quran App.">');
    expect(out).toContain('<meta property="og:title" content="About · Quran App">');
  });

  it("leaves other routes alone and handles a trailing slash", () => {
    expect(injectPublicMeta("/settings", html)).toBe(html);
    expect(injectPublicMeta("/about/", html)).toContain("About · Quran App");
  });

  it("covers exactly the three public pages", () => {
    expect(Object.keys(PUBLIC_META).sort()).toEqual(["/", "/about", "/surah-listing"]);
  });
});

describe("navigation uses the legacy routes", () => {
  const pagesDir = path.join(LEGACY_APP, "pages");
  const legacyRoutes = (() => {
    const out: string[] = [];
    const walk = (dir: string, prefix: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name), `${prefix}/${e.name}`);
        else if (e.name.endsWith(".vue")) {
          const name = e.name.replace(/\.vue$/, "");
          out.push(name === "index" ? prefix || "/" : `${prefix}/${name}`);
        }
      }
    };
    walk(pagesDir, "");
    return new Set(out);
  })();

  it("every nav link is an existing legacy route, unchanged", () => {
    const links = [...NAV.flatMap((g) => g.items), ...NAV_FOOTER].map((i) => i.to);
    expect(links.length).toBeGreaterThan(20);
    for (const to of links) expect(legacyRoutes.has(to), to).toBe(true);
    expect(new Set(links).size).toBe(links.length);
  });

  it("groups follow the design system order", () => {
    expect(NAV.map((g) => g.label)).toEqual(["Read", "Study", "Knowledge base", "Worship", "Literary modules"]);
    expect(NAV.at(-1)!.optional).toBe("literaryModules");
  });
});
