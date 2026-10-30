// Which page file answers a route pattern (shared by the route and sitemap tests).
import fs from "node:fs";
import path from "node:path";

export const PAGES = path.resolve(__dirname, "../app/pages");

/** The page file that answers a route pattern, or null. Vue Router: `[x].vue` is a parameter, `index.vue` is the folder's route; a catch-all does not count. */
export function pageFor(route: string): string | null {
  if (route === "/") return fs.existsSync(path.join(PAGES, "index.vue")) ? "index.vue" : null;
  const segs = route.replace(/^\//, "").split("/");
  const walk = (dir: string, i: number): string | null => {
    if (!fs.existsSync(dir)) return null;
    const last = i === segs.length - 1;
    const names = fs.readdirSync(dir);
    const seg = segs[i]!;
    const param = /^\[.+\]$/.test(seg);
    // a file or a folder named exactly like the segment (or, for a parameter, any [x])
    const matches = (n: string) => (param ? /^\[.+\](\.vue)?$/.test(n) : n === seg || n === `${seg}.vue`);
    for (const n of names.filter(matches)) {
      const full = path.join(dir, n);
      if (last) {
        if (n.endsWith(".vue")) return path.relative(PAGES, full);
        if (fs.existsSync(path.join(full, "index.vue"))) return path.relative(PAGES, path.join(full, "index.vue"));
      } else if (fs.statSync(full).isDirectory()) {
        const r = walk(full, i + 1);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(PAGES, 0);
}

