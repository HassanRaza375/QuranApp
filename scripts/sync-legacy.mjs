// DEV-ONLY. Refreshes ./legacy (the read-only snapshot of the legacy Quran App) from a checkout of the legacy repo.
//
//   LEGACY_REPO=/path/to/legacy-repo node scripts/sync-legacy.mjs          copy, then print what changed
//   LEGACY_REPO=/path/to/legacy-repo node scripts/sync-legacy.mjs --check  print what would change, write nothing
//   node scripts/sync-legacy.mjs --rehash                                 after a deliberate edit here (a cutover data fix, see
//                                                                         legacy/README.md): re-record sizes and hashes; needs no checkout
//
// What it copies is the list in scripts/lib/legacy-files.mjs and nothing else. Tracked files come from the legacy HEAD commit
// (git blobs), so the result does not depend on that checkout's line endings or uncommitted edits. The legacy service worker comes
// from its (untracked) `dist/` build. It records the commit in legacy/manifest.json and in the marked block of legacy/README.md.
//
// No npm script calls this and the build must never call it: `npm run build` works with no legacy checkout and no network.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIST_DIR, DIST_SW, MANIFEST_FILE, PAGES_DIR, README_FILE, ROUTES_FILE, TRACKED_FILES, routesOf } from "./lib/legacy-files.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../legacy");
const check = process.argv.includes("--check");
const fail = (msg) => {
  console.error(`sync-legacy: ${msg}`);
  process.exit(1);
};

if (process.env.VERCEL || process.env.CI) fail("this is a dev-only script and must not run in a build or CI.");

if (process.argv.includes("--rehash")) {
  const file = path.join(OUT, MANIFEST_FILE);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [rel, entry] of Object.entries(manifest.files)) {
    const data = fs.readFileSync(path.join(OUT, rel));
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    if (hash === entry.sha256) continue;
    console.log(`re-recorded ${rel}`);
    manifest.files[rel] = { ...entry, bytes: data.length, sha256: hash };
  }
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log("manifest.json updated. Note the edit under \"Local edits\" in legacy/README.md.");
  process.exit(0);
}

const repoArg = process.env.LEGACY_REPO;
if (!repoArg) fail("set LEGACY_REPO to a checkout of the legacy repo, e.g. LEGACY_REPO=../legacy-repo node scripts/sync-legacy.mjs");
const repo = path.resolve(repoArg);

const git = (...args) => execFileSync("git", ["-C", repo, ...args], { maxBuffer: 256 * 1024 * 1024 });
const gitText = (...args) => git(...args).toString("utf8").trim();
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

let commit;
try {
  commit = gitText("rev-parse", "HEAD");
} catch {
  fail(`${repo} is not a git checkout.`);
}
const branch = gitText("rev-parse", "--abbrev-ref", "HEAD");
const committedAt = gitText("show", "-s", "--format=%cI", "HEAD");

/** relative path -> { data: Buffer, source, builtAt? } */
const incoming = new Map();
const missing = [];
for (const rel of TRACKED_FILES) {
  try {
    incoming.set(rel, { data: git("show", `HEAD:${rel}`), source: "git" });
  } catch {
    missing.push(rel);
  }
}
if (missing.length) fail(`not in legacy commit ${commit.slice(0, 7)}:\n  ${missing.join("\n  ")}\nThe code imports a file that no longer exists there; fix the import or the list.`);

const dirty = gitText("status", "--porcelain", "--", ...TRACKED_FILES);
if (dirty) console.warn(`warning: uncommitted edits in the legacy checkout; the committed version of these files is copied:\n${dirty}\n`);

// routes: derived from the pages folder of the commit
const pages = gitText("ls-tree", "-r", "--name-only", "HEAD", PAGES_DIR)
  .split("\n")
  .filter(Boolean)
  .map((f) => f.slice(PAGES_DIR.length + 1));
const routes = routesOf(pages);
if (!routes.length) fail(`no pages found under ${PAGES_DIR} in the legacy commit.`);
incoming.set(ROUTES_FILE, { data: Buffer.from(JSON.stringify({ source: PAGES_DIR, routes }, null, 2) + "\n"), source: "derived" });

// service worker: build output, not in git
const distDir = path.join(repo, DIST_DIR);
const swPath = path.join(distDir, DIST_SW);
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath);
  const workbox = /["']\.\/(workbox-[\w-]+)["']/.exec(sw.toString("utf8"))?.[1];
  if (!workbox || !fs.existsSync(path.join(distDir, `${workbox}.js`))) fail(`${DIST_SW} imports a workbox runtime that is not next to it in ${distDir}.`);
  const builtAt = fs.statSync(swPath).mtime.toISOString();
  incoming.set(`${DIST_DIR}/${DIST_SW}`, { data: sw, source: "build", builtAt });
  incoming.set(`${DIST_DIR}/${workbox}.js`, { data: fs.readFileSync(path.join(distDir, `${workbox}.js`)), source: "build", builtAt });
} else {
  console.warn(`warning: ${swPath} not found; the vendored service worker (if any) is left as it is.\n`);
}

// compare with what is vendored now
const manifestPath = path.join(OUT, MANIFEST_FILE);
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { commit: null, files: {} };
const keepOldDist = !fs.existsSync(swPath);
const changes = { added: [], changed: [], removed: [], unchanged: [], locallyEdited: [] };
const files = {};
for (const [rel, { data, source, builtAt }] of [...incoming].sort(([a], [b]) => a.localeCompare(b))) {
  const hash = sha256(data);
  files[rel] = { bytes: data.length, sha256: hash, source, ...(builtAt ? { builtAt } : {}) };
  const before = old.files[rel];
  const onDisk = path.join(OUT, rel);
  if (before && fs.existsSync(onDisk) && sha256(fs.readFileSync(onDisk)) !== before.sha256) changes.locallyEdited.push(rel);
  (!before ? changes.added : before.sha256 !== hash ? changes.changed : changes.unchanged).push(rel);
}
for (const [rel, entry] of Object.entries(old.files)) {
  if (incoming.has(rel)) continue;
  if (keepOldDist && rel.startsWith(`${DIST_DIR}/`)) files[rel] = entry;
  else changes.removed.push(rel);
}

if (!check) {
  for (const rel of changes.removed) fs.rmSync(path.join(OUT, rel), { force: true });
  for (const [rel, { data }] of incoming) {
    const target = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
  const manifest = {
    note: "Written by scripts/sync-legacy.mjs. A read-only snapshot of the legacy app; see README.md.",
    commit,
    branch,
    committedAt,
    syncedAt: new Date().toISOString().slice(0, 10),
    files,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  const readmePath = path.join(OUT, README_FILE);
  const total = Object.values(files).reduce((n, f) => n + f.bytes, 0);
  const block = `<!-- sync-legacy:begin -->\n- Commit: \`${commit}\` (branch \`${branch}\`, committed ${committedAt.slice(0, 10)})\n- Synced: ${manifest.syncedAt}\n- Files: ${Object.keys(files).length}, ${(total / 1024).toFixed(0)} KB (listed in \`manifest.json\`)\n<!-- sync-legacy:end -->`;
  if (fs.existsSync(readmePath)) {
    const text = fs.readFileSync(readmePath, "utf8");
    const next = text.replace(/<!-- sync-legacy:begin -->[\s\S]*?<!-- sync-legacy:end -->/, () => block);
    if (next === text && !text.includes(block)) console.warn(`warning: ${README_FILE} has no sync-legacy markers; add them so the commit line is kept up to date.`);
    else fs.writeFileSync(readmePath, next);
  }
}

const list = (label, items) => {
  if (items.length) console.log(`${label} (${items.length}):\n  ${items.join("\n  ")}`);
};
console.log(`${check ? "[check only, nothing written] " : ""}legacy ${commit.slice(0, 7)} (${branch})${old.commit ? `, vendored before: ${old.commit.slice(0, 7)}` : ", first sync"}`);
list("added", changes.added);
list("changed", changes.changed);
list("removed", changes.removed);
list("edited here since the last sync (the copy from the legacy commit overwrites these)", changes.locallyEdited);
console.log(`unchanged: ${changes.unchanged.length}`);
