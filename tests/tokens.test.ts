// The hex tokens in tailwind.css are the source of truth (docs/design/DESIGN_SYSTEM.md). This reads them from
// the CSS itself and checks the design-system table and WCAG contrast, so a token edit cannot silently break either.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.resolve(__dirname, "../app/assets/css/tailwind.css"), "utf8");

function block(selector: string): Record<string, string> {
  const m = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
  expect(m, selector).toBeTruthy();
  return Object.fromEntries([...m![1]!.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((x) => [x[1]!, x[2]!.toLowerCase()]));
}
const light = block(":root");
const dark = block(".dark");

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe("design tokens (DESIGN_SYSTEM.md table)", () => {
  it("light values", () => {
    expect(light).toMatchObject({
      bg: "#f3f1ea", surface: "#fbfaf6", sunken: "#ece7da", ink: "#1c1b17", "ink-2": "#6b6558", "ink-3": "#9c978a",
      border: "#e1ddd0", accent: "#2b6777", "accent-soft": "#e3edef", gold: "#9c7a3c", "gold-soft": "#f1e6d2", danger: "#a5433a",
    });
  });
  it("dark values", () => {
    expect(dark).toEqual({
      bg: "#14161c", surface: "#1b1e26", sunken: "#191b22", ink: "#edeae2", "ink-2": "#b4afa0", "ink-3": "#75726a",
      border: "#2a2d36", accent: "#5ca0af", "accent-soft": "#1b2a2d", gold: "#c9a15e", "gold-soft": "#2e2717", danger: "#d97b72",
    });
  });
});

describe("contrast (WCAG AA, 4.5:1 for text)", () => {
  for (const [mode, t] of [["light", light], ["dark", dark]] as const) {
    const pairs: [string, string, string][] = [
      ["ink on bg", "ink", "bg"], ["ink on surface", "ink", "surface"], ["ink-2 on bg", "ink-2", "bg"],
      ["ink-2 on surface", "ink-2", "surface"], ["ink-2 on sunken", "ink-2", "sunken"], ["accent on bg", "accent", "bg"],
      ["accent on surface", "accent", "surface"], ["accent on accent-soft", "accent", "accent-soft"],
      ["button text (bg on accent)", "bg", "accent"], ["danger on bg", "danger", "bg"],
    ];
    for (const [name, fg, bg] of pairs) {
      it(`${mode}: ${name}`, () => expect(contrast(t[fg]!, t[bg === "accent" ? "accent" : bg]!)).toBeGreaterThanOrEqual(4.5));
    }
  }

  it("high contrast mode lifts the muted tokens above 4.5:1 in both themes", () => {
    const hcLight = block(':root[data-high-contrast="true"]');
    const hcDark = block('.dark[data-high-contrast="true"]');
    expect(contrast(hcLight["ink-3"]!, light.bg!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hcDark["ink-3"]!, dark.bg!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hcLight.border!, light.bg!)).toBeGreaterThanOrEqual(3);
  });

  it("KNOWN: --ink-3 is below AA for text in normal mode, so it must not carry essential text", () => {
    // Recorded in docs/phases/phase-00-foundation.md. Use ink-2 for any text that matters; ink-3 is for decoration.
    expect(contrast(light["ink-3"]!, light.bg!)).toBeLessThan(4.5);
    expect(contrast(dark["ink-3"]!, dark.bg!)).toBeLessThan(4.5);
  });

  it("gold on the page is at least 3:1 (it is a graphic mark, never body text)", () => {
    expect(contrast(light.gold!, light.bg!)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.gold!, dark.bg!)).toBeGreaterThanOrEqual(3);
  });
});

describe("offline rule: no remote resources in the CSS", () => {
  it("has no http(s) import or url() (fonts and icons are bundled; `npx shadcn-vue add` re-adds a Google Fonts import, remove it)", () => {
    expect(css).not.toMatch(/@import\s+url\(\s*['"]?https?:/i);
    expect(css).not.toMatch(/url\(\s*['"]?https?:/i);
    expect(css).not.toMatch(/googleapis|gstatic/i);
  });
  it("has one base layer (shadcn add appends a duplicate)", () => {
    expect((css.match(/@layer base\s*\{/g) ?? []).length).toBe(1);
  });
});
