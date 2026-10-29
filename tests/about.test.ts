// Phase 15: what the About page says is true of the code. Every service the app asks is named on the page, and every service named is one the app asks.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ABOUT, DATA_SOURCES, SOURCE_HOSTS } from "../app/lib/about";
import { GEOCODE_BASE } from "../app/lib/geocode";
import { PUBLIC_META } from "../app/lib/publicMeta";
import { ALADHAN_BASE } from "../app/services/prayer.service";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const hostOf = (url: string) => new URL(url).host;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|vue)$/.test(e.name) && !p.endsWith("about.ts") && !p.endsWith(".generated.ts")) out.push(p);
  }
  return out;
}

describe("the data sources on the About page", () => {
  it("name every service the app is configured to ask", () => {
    const config = read("nuxt.config.ts");
    const bases = [...config.matchAll(/quranApiBase2?:\s*process\.env\.\w+\s*\|\|\s*"(https:\/\/[^"]+)"/g)].map((m) => hostOf(m[1]!));
    expect(bases).toHaveLength(2);
    for (const host of [...bases, hostOf(ALADHAN_BASE), hostOf(GEOCODE_BASE)]) expect(SOURCE_HOSTS, host).toContain(host);
    const audio = read("app/lib/downloadPlan.ts");
    for (const host of ["raw.githubusercontent.com", "media.githubusercontent.com"]) {
      expect(audio, host).toContain(host);
      expect(SOURCE_HOSTS, host).toContain(host);
    }
  });
  it("name only services the code really uses", () => {
    const code = [...walk(path.join(ROOT, "app")).map((f) => fs.readFileSync(f, "utf8")), read("nuxt.config.ts")].join("\n");
    for (const s of DATA_SOURCES) expect(code, s.host).toContain(s.host);
  });
  it("say what each one provides and what is sent, with a link", () => {
    for (const s of DATA_SOURCES) {
      expect(s.provides.length, s.id).toBeGreaterThan(10);
      expect(s.sends.length, s.id).toBeGreaterThan(10);
      expect(s.href, s.id).toMatch(/^https:\/\//);
    }
    expect(new Set(DATA_SOURCES.map((s) => s.id)).size).toBe(DATA_SOURCES.length);
  });
  it("describe the prayer-time request the way the code makes it: coordinates rounded, and no coordinates for the calendar", () => {
    const aladhan = DATA_SOURCES.find((s) => s.id === "aladhan")!;
    expect(aladhan.sends).toMatch(/rounded to about 1 km/);
    expect(read("app/lib/prayerMonth.ts")).toContain("Rounds a coordinate to 2 decimals (about 1 km)");
    expect(read("app/lib/gregorianMonths.ts")).toMatch(/gToHCalendar\/\$\{m\}\/\$\{y\}/); // a month and a year, nothing else
  });
});

describe("the words about the study pages", () => {
  it("use labels the study pages actually show", () => {
    const labels = [...ABOUT.grounding.matchAll(/“([^”]+)”/g)].map((m) => m[1]!);
    expect(labels).toEqual(["Traditional identification", "Scholarly interpretation", "Disputed interpretation"]);
    const source = walk(path.join(ROOT, "app/lib/knowledge")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
    for (const l of labels) expect(source, l).toContain(l);
  });
  it("end with the rule for rulings: follow your own marja' or local scholar", () => {
    expect(ABOUT.limits).toContain("follow your own marja’ or a local scholar");
    expect(ABOUT.limits).toContain("nothing in it is a ruling");
  });
});

describe("the page's head", () => {
  it("is the same in the prerendered tags and in the page", () => {
    expect(PUBLIC_META["/about"]!.description).toBe(ABOUT.metaDescription);
    expect(ABOUT.metaDescription.startsWith("About the Quran App")).toBe(true);
    expect(PUBLIC_META["/about"]!.title).toBe("About · Quran App");
  });
  it("names no interface library or emoji (the legacy page named Vuetify and used emoji headings)", () => {
    const text = JSON.stringify(ABOUT) + JSON.stringify(DATA_SOURCES);
    expect(text).not.toMatch(/vuetify|nuxt/i);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
