// This repository stands alone: no code, config or script reaches outside it. (The legacy app is vendored in ./legacy.)
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const slash = (p: string) => p.replaceAll("\\", "/");
const SKIP = new Set(["node_modules", ".nuxt", ".output", ".git", ".nitro", "legacy", "test-results", "playwright-report", "coverage"]);
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (SKIP.has(e.name) ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const SELF = slash(path.join(ROOT, "tests/independence.test.ts"));
const code = walk(ROOT)
  .filter((f) => /\.(ts|vue|mjs|js)$/.test(f) && !/\.generated\.ts$/.test(f) && slash(f) !== SELF)
  .map((f) => ({ file: slash(path.relative(ROOT, f)), text: fs.readFileSync(f, "utf8") }));

describe("independence", () => {
  it("no string path climbs above the repository root", () => {
    // `../` steps count from the file's own folder. A file at depth d (folders below the root) may climb d steps, no more.
    const bad: string[] = [];
    for (const { file, text } of code) {
      const depth = file.split("/").length - 1;
      for (const m of text.matchAll(/["'`]((?:\.\.\/)+|\.\.)(?=[^"'`]*["'`])/g)) {
        const steps = m[1] === ".." ? 1 : m[1]!.length / 3;
        if (steps > depth) bad.push(`${file}: "${m[0].slice(1)}…" climbs ${steps} above a file at depth ${depth}`);
      }
      if (/process\.cwd\(\)\s*,\s*["'`]\.\./.test(text)) bad.push(`${file}: a path built from process.cwd() starts with ..`);
    }
    expect(bad).toEqual([]);
  });

  it("nothing names the old repository layout", () => {
    const bad = code.filter(({ text }) => /Quran-App|revamp-quran/.test(text)).map(({ file }) => file);
    expect(bad).toEqual([]);
  });

  it("package.json has no linked or file: dependencies, no install hooks beyond nuxt prepare, and never calls the legacy sync", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string>; engines: { node: string } };
    for (const [name, range] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) expect(range, name).not.toMatch(/^(file|link|portal|workspace):|\.\./);
    const hooks = Object.keys(pkg.scripts).filter((s) => /^(pre|post)(install|publish|prepare)$|^(prepare|install)$/.test(s));
    expect(hooks.map((h) => `${h}: ${pkg.scripts[h]}`)).toEqual(["postinstall: nuxt prepare"]);
    expect(Object.values(pkg.scripts).filter((s) => /sync-legacy|scripts\/gen-|LEGACY_REPO/.test(s))).toEqual([]);
    expect(pkg.scripts.build).toBe("nuxt build");
    expect(pkg.engines.node).toMatch(/^22(\.|$)/);
  });

  it(".nvmrc says Node 22", () => {
    expect(fs.readFileSync(path.join(ROOT, ".nvmrc"), "utf8").trim()).toMatch(/^22(\.|$)/);
  });

  it(".gitignore covers dependencies, build output, env files and test artefacts (and has no byte-order mark)", () => {
    const raw = fs.readFileSync(path.join(ROOT, ".gitignore"));
    expect(raw.subarray(0, 3).toString("hex")).not.toBe("efbbbf");
    const lines = new Set(raw.toString("utf8").split(/\r?\n/).map((l) => l.trim()));
    for (const must of ["node_modules", ".nuxt", ".output", ".env", ".env.*", "!.env.example", "test-results", "playwright-report", "coverage", ".vercel"]) expect(lines.has(must), must).toBe(true);
  });
});
