// /robots.txt (Phase 16): written at build time from the environment (see app/lib/seo.ts). Production allows crawling and names the sitemap; a preview, a local
// build and a dev server disallow everything.
import { robotsTxt } from "../../app/lib/seo";

export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  const c = useRuntimeConfig().public;
  return robotsTxt(String(c.siteUrl ?? ""), !!c.indexable);
});
