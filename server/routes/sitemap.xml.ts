// /sitemap.xml (Phase 16): the real, indexable routes at the project's production address (see app/lib/seo.ts). Written at build time.
import { sitemapXml } from "../../app/lib/seo";

export default defineEventHandler((event) => {
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return sitemapXml(String(useRuntimeConfig().public.siteUrl ?? ""));
});
