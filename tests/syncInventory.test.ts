// Phase 17E: the storage inventory guard. Every localStorage key the app uses is classified in app/lib/sync/inventory.ts, so a future change cannot add a key that
// silently syncs, or one that silently does not. The classification must agree with the adapters that really read and write the keys.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADAPTERS, SYNCED_KEYS } from "../app/lib/sync/adapters";
import { INVENTORY } from "../app/lib/sync/inventory";

const APP = path.resolve(__dirname, "../app");
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|vue)$/.test(e.name) && !/generated/.test(e.name)) out.push(p);
  }
  return out;
};
const files = walk(APP).filter((f) => !f.endsWith(path.join("sync", "inventory.ts")));
const text = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");

describe("the inventory", () => {
  it("lists every `quran:…:vN` key literal that the app uses (except the legacy-only ones that are read through other code)", () => {
    const found = new Set([...text.matchAll(/"(quran:[a-z0-9-]+(?::[a-z0-9-]+)*:v\d+)"/g)].map((m) => m[1]!));
    const missing = [...found].filter((k) => !INVENTORY[k]);
    expect(missing).toEqual([]);
  });
  it("lists every key that is read or written through the storage wrapper with a literal name", () => {
    const found = new Set([...text.matchAll(/\b(?:getRaw|setRaw|getJSON|setJSON|mergeJSON)\(\s*"([^"]+)"/g)].map((m) => m[1]!));
    expect([...found].filter((k) => !INVENTORY[k])).toEqual([]);
  });
  it("lists the legacy raw keys by name", () => {
    for (const k of ["prayerFiqh", "themeMode", "translationDefaultLang", "tafsirDefaultAuthor", "preferredVerseDisplay", "prayerSettings", "reciter", "last_location", "ayah-of-day"]) expect(INVENTORY[k], k).toBeTruthy();
  });
  it("has no entry that the app never uses (a stale classification)", () => {
    const stale = Object.keys(INVENTORY).filter((k) => !text.includes(`"${k}"`) && !text.includes(`'${k}'`));
    expect(stale).toEqual([]);
  });
  it("gives every `never` key a reason", () => {
    for (const [k, v] of Object.entries(INVENTORY)) if (v.to === "never") expect(v.why, k).toBeTruthy();
  });
});

describe("the inventory and the adapters agree", () => {
  it("every key the adapters touch is classified into the adapter's own category", () => {
    for (const a of ADAPTERS) for (const k of a.keys) expect(INVENTORY[k]?.to === a.category || INVENTORY[k]?.to === "meta" || (a.category === "account" && INVENTORY[k]?.to === "meta"), `${k} (${a.ns})`).toBe(true);
  });
  it("every key classified into a category is synced by some adapter", () => {
    for (const [k, v] of Object.entries(INVENTORY)) if (v.to === "library" || v.to === "progress" || v.to === "settings") expect(SYNCED_KEYS, k).toContain(k);
  });
  it("a key that is never synced is not touched by any adapter", () => {
    for (const [k, v] of Object.entries(INVENTORY)) if (v.to === "never") expect(SYNCED_KEYS, k).not.toContain(k);
  });
});
