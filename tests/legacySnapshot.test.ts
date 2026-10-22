// The vendored legacy snapshot (./legacy): it holds exactly the files the code uses, byte for byte what its manifest records.
// Refresh it with scripts/sync-legacy.mjs; the rules are in legacy/README.md.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DIST_DIR, DIST_SW, MANIFEST_FILE, README_FILE, ROUTES_FILE, TRACKED_FILES } from "../scripts/lib/legacy-files.mjs";

const ROOT = path.resolve(__dirname, "..");
const LEGACY = path.join(ROOT, "legacy");
type Entry = { bytes: number; sha256: string; source: string };
const manifest = JSON.parse(fs.readFileSync(path.join(LEGACY, MANIFEST_FILE), "utf8")) as { commit: string; files: Record<string, Entry> };

const slash = (p: string) => p.replaceAll("\\", "/");
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [slash(path.join(dir, e.name))]));
const vendored = walk(LEGACY).map((f) => slash(path.relative(LEGACY, f))).filter((f) => f !== README_FILE && f !== MANIFEST_FILE).sort();

describe("legacy snapshot", () => {
  it("records the legacy commit, and the README says the same one", () => {
    expect(manifest.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(fs.readFileSync(path.join(LEGACY, README_FILE), "utf8")).toContain(manifest.commit);
  });

  it("holds exactly the listed files, the routes list and the legacy service worker", () => {
    const workbox = vendored.filter((f) => /^dist\/workbox-[\w-]+\.js$/.test(f));
    expect(workbox).toHaveLength(1);
    expect(vendored).toEqual([...TRACKED_FILES, ROUTES_FILE, `${DIST_DIR}/${DIST_SW}`, workbox[0]!].sort());
    expect(Object.keys(manifest.files).sort()).toEqual(vendored);
    // the worker's import of its runtime is satisfied by the vendored file
    expect(fs.readFileSync(path.join(LEGACY, DIST_DIR, DIST_SW), "utf8")).toContain(`./${path.basename(workbox[0]!, ".js")}`);
  });

  it("is read-only: every file is exactly what the manifest recorded (after a deliberate edit: node scripts/sync-legacy.mjs --rehash)", () => {
    for (const rel of vendored) {
      const data = fs.readFileSync(path.join(LEGACY, rel));
      expect(crypto.createHash("sha256").update(data).digest("hex"), rel).toBe(manifest.files[rel]!.sha256);
      expect(data.length, rel).toBe(manifest.files[rel]!.bytes);
    }
  });

  // A clean checkout must contain every vendored file. (--no-index: tracked files are otherwise never reported as ignored.) (Not run from a copy without .git, such as the independence check.)
  it.skipIf(!fs.existsSync(path.join(ROOT, ".git")))("none of the files is git-ignored", () => {
    const r = spawnSync("git", ["check-ignore", "--no-index", "--", ...vendored.map((f) => `legacy/${f}`)], { cwd: ROOT, encoding: "utf8" });
    if (r.error) return; // no git on this machine: nothing to check
    expect(r.stdout.trim().split("\n").filter(Boolean)).toEqual([]);
  });

  it("holds no file that nothing uses: every legacy/app file is imported by the code, read by path, or imported by another legacy file", () => {
    const SCAN = ["app", "build", "e2e", "scripts", "tests", "nuxt.config.ts", "vitest.config.ts"];
    const own = new Set([slash(path.join(ROOT, "tests/legacySnapshot.test.ts")), slash(path.join(ROOT, "scripts/lib/legacy-files.mjs"))]);
    const code = SCAN.flatMap((p) => {
      const full = path.join(ROOT, p);
      return fs.statSync(full).isDirectory() ? walk(full) : [slash(full)];
    })
      .filter((f) => /\.(ts|vue|mjs|js)$/.test(f) && !own.has(f))
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n");

    const used = new Set<string>();
    const noExt = (rel: string) => rel.replace(/\.(ts|js|json)$/, "");
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const appFiles = vendored.filter((f) => f.startsWith("app/"));
    // imported through the alias (`@legacy/utils/x`, with or without the extension) or read by path (`legacy/app/...`)
    for (const rel of appFiles) {
      const inApp = rel.slice("app/".length);
      const named = new RegExp(`(?:@legacy/${escape(noExt(inApp))}|legacy/${escape(rel)})(?![\\w/])`);
      if (named.test(code) || new RegExp(`@legacy/${escape(inApp)}(?![\\w/])`).test(code)) used.add(rel);
    }
    // imported by a legacy file that is itself used: follow `~/x` and `./x`
    const resolve = (spec: string, from: string) => {
      const base = spec.startsWith("~/") ? `app/${spec.slice(2)}` : slash(path.posix.join(path.posix.dirname(from), spec));
      return appFiles.find((f) => noExt(f) === noExt(base) || f === base);
    };
    const queue = [...used];
    while (queue.length) {
      const from = queue.pop()!;
      if (!/\.(ts|js)$/.test(from)) continue;
      const src = fs.readFileSync(path.join(LEGACY, from), "utf8");
      for (const m of src.matchAll(/(?:from\s*|import\(\s*)["']((?:~\/|\.\/|\.\.\/)[^"']+)["']/g)) {
        const target = resolve(m[1]!, from);
        if (target && !used.has(target)) {
          used.add(target);
          queue.push(target);
        }
      }
    }
    expect(appFiles.filter((f) => !used.has(f))).toEqual([]);
  });
});
