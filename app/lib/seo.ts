// Search-engine facts that depend on where the build is made (Phase 16). Pure; the environment is passed in so every rule is tested.
//   * The production address is the one Vercel names for the project (`VERCEL_PROJECT_PRODUCTION_URL`), or `NUXT_PUBLIC_SITE_URL` when set. A preview
//     deployment gets the SAME canonical address (a preview is not a second site) but is told not to be indexed.
//   * Only a Vercel production build is indexable (`VERCEL_ENV=production`, or `ALLOW_INDEXING=1` to rehearse one). A preview, a local build and a dev
//     server send `X-Robots-Tag: noindex, nofollow`, have a robots meta tag, and serve a robots.txt that disallows everything.
//   * sitemap.xml lists only real, indexable routes: no personal page, no test page, no Poets.
export const NOINDEX = "noindex, nofollow";

type Env = Record<string, string | undefined>;

/** "https://host" with no trailing slash, or "" when the build does not know the production address. */
export function siteUrl(env: Env): string {
  const raw = (env.NUXT_PUBLIC_SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

export const isIndexable = (env: Env): boolean => env.VERCEL_ENV === "production" || env.ALLOW_INDEXING === "1";

/** The path of a canonical address: no query, no hash, no trailing slash (except the home page). */
export function canonicalPath(path: string): string {
  const p = path.split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}
export const canonicalUrl = (site: string, path: string): string => (site ? `${site}${canonicalPath(path) === "/" ? "/" : canonicalPath(path)}` : "");

/** Public, indexable pages (the personal ones are `noindex`: Library, Downloads, Hifz, Goals, Calendar, Settings, Tasbeeh, Per page, Surah videos). */
export const STATIC_ROUTES = [
  "/",
  "/about",
  "/surah-listing",
  "/juz",
  "/asma-ul-husna",
  "/sajda",
  "/persons",
  "/persons/timeline",
  "/stories",
  "/peoples",
  "/places",
  "/themes",
  "/duas",
  "/events",
  "/signs",
  "/commands",
  "/prayerTime",
  "/qibla-direction",
  "/ramadan",
  "/fiqh",
  "/fiqh/glossary",
  "/sitemap",
] as const;

/** Every route the sitemap lists: the static ones and the 114 surah pages. (The detail pages of the study modules are not listed.) */
export const sitemapRoutes = (): string[] => [...STATIC_ROUTES, ...Array.from({ length: 114 }, (_, i) => `/surah/${i + 1}`)];

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function sitemapXml(site: string, routes: string[] = sitemapRoutes()): string {
  const urls = (site ? routes : []).map((r) => `  <url><loc>${xml(canonicalUrl(site, r))}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(site: string, indexable: boolean): string {
  if (!indexable) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /api/\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ""}`;
}

/** Tags written into the head of a prerendered page: the canonical address, a robots tag when the build is not indexable, the Search Console key in production. */
export function seoHeadTags(o: { site: string; path: string; indexable: boolean; verification?: string }): string {
  const tags: string[] = [];
  const canonical = canonicalUrl(o.site, o.path);
  if (canonical) tags.push(`<link rel="canonical" href="${xml(canonical)}">`);
  if (!o.indexable) tags.push(`<meta name="robots" content="${NOINDEX}">`);
  if (o.indexable && o.verification) tags.push(`<meta name="google-site-verification" content="${xml(o.verification)}">`);
  return tags.join("");
}
