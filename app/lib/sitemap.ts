// The Sitemap's sections (Phase 15), built from the one list of destinations (lib/nav.ts) so a page added to the sidebar is here too, plus the few pages
// that have no sidebar row. The optional Literary group is left out: its page is not built. Counts are not shown (the legacy page typed them in).
import { HOME_ITEM, NAV, NAV_FOOTER } from "./nav";

export interface SitemapLink {
  label: string;
  to: string;
  /** a plain note under the link */
  note?: string;
  icon: string;
}
export interface SitemapSection {
  id: string;
  label: string;
  links: SitemapLink[];
}

export function sitemapSections(): SitemapSection[] {
  const groups = NAV.filter((g) => !g.optional);
  const sections: SitemapSection[] = groups.map((g) => ({ id: g.id, label: g.label, links: g.items.map((i) => ({ label: i.label, to: i.to, icon: i.icon })) }));
  sections[0]!.links.unshift({ label: HOME_ITEM.label, to: HOME_ITEM.to, icon: HOME_ITEM.icon });
  sections.push({
    id: "app",
    label: "The app",
    links: [
      ...NAV_FOOTER.map((i) => ({ label: i.label, to: i.to, icon: i.icon })),
      { label: "Sitemap", to: "/sitemap", icon: "lucide:network" },
      { label: "Surah videos", to: "/surah-vedios", icon: "lucide:video", note: "No videos yet. Every surah has audio." },
    ],
  });
  return sections;
}
