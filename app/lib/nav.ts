// Navigation, grouped by intent (docs/design/DESIGN_SYSTEM.md, principle 4). Routes are the LEGACY routes, unchanged.
// One row per real destination. Groups are collapsible; Read is open by default. "Continue reading" sits above the
// groups and only shows when there is reading progress. `phase` says which phase builds the page (until then the link
// lands on the "not rebuilt yet" page).
//
// Intentional change from the prototype (decision, Phase 1 review): every row has a Lucide icon (16px, ink-2, accent
// when active), and rows are one per destination instead of the prototype's merged rows ("Places · Stories · Themes").
export interface NavItem {
  label: string;
  to: string;
  icon: string;
  phase: number;
}
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  optional?: "literaryModules";
}

export const HOME_ITEM: NavItem = { label: "Home", to: "/", icon: "lucide:house", phase: 1 };

export const NAV: NavGroup[] = [
  { id: "read", label: "Read", items: [
    { label: "Surahs", to: "/surah-listing", icon: "lucide:book-open", phase: 3 },
    { label: "Juz", to: "/juz", icon: "lucide:layers", phase: 3 },
    { label: "Per page", to: "/per-page-read", icon: "lucide:file-text", phase: 9 },
    { label: "Search", to: "/search", icon: "lucide:search", phase: 10 },
  ] },
  { id: "study", label: "Study", items: [
    { label: "Hifz", to: "/hifz", icon: "lucide:brain", phase: 14 },
    { label: "Reading goals", to: "/goals", icon: "lucide:target", phase: 15 },
    { label: "Library", to: "/bookmarks", icon: "lucide:bookmark", phase: 6 },
    { label: "Downloads", to: "/downloads", icon: "lucide:download", phase: 11 },
  ] },
  { id: "knowledge", label: "Knowledge base", items: [
    { label: "Prophets & People", to: "/persons", icon: "lucide:users", phase: 7 },
    { label: "Stories", to: "/stories", icon: "lucide:scroll-text", phase: 7 },
    { label: "Peoples", to: "/peoples", icon: "lucide:globe", phase: 12 },
    { label: "Places", to: "/places", icon: "lucide:map-pin", phase: 12 },
    { label: "Themes", to: "/themes", icon: "lucide:tags", phase: 12 },
    { label: "Duas", to: "/duas", icon: "lucide:hand-heart", phase: 12 },
    { label: "Events", to: "/events", icon: "lucide:calendar-days", phase: 12 },
    { label: "Signs", to: "/signs", icon: "lucide:sparkles", phase: 12 },
    { label: "Commands", to: "/commands", icon: "lucide:list-checks", phase: 12 },
  ] },
  { id: "worship", label: "Worship", items: [
    { label: "Prayer times", to: "/prayerTime", icon: "lucide:clock", phase: 5 },
    { label: "Qibla", to: "/qibla-direction", icon: "lucide:compass", phase: 5 },
    { label: "Ramadan", to: "/ramadan", icon: "lucide:moon", phase: 8 },
    { label: "Tasbeeh", to: "/tasbeeh", icon: "lucide:circle-dot", phase: 9 },
    { label: "Sajda", to: "/sajda", icon: "lucide:arrow-down-to-line", phase: 9 },
    { label: "Asma-ul-Husna", to: "/asma-ul-husna", icon: "lucide:badge-info", phase: 9 },
    { label: "Daily Fiqh", to: "/fiqh", icon: "lucide:scale", phase: 13 },
  ] },
  { id: "literary", label: "Literary modules", optional: "literaryModules", items: [
    { label: "Poets", to: "/poets", icon: "lucide:feather", phase: 12 },
  ] },
];
export const NAV_FOOTER: NavItem[] = [
  { label: "Settings", to: "/settings", icon: "lucide:settings", phase: 2 },
  { label: "About", to: "/about", icon: "lucide:info", phase: 15 },
];

export const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path === to || path.startsWith(to + "/"));

const ALL_ITEMS: NavItem[] = [HOME_ITEM, ...NAV.flatMap((g) => g.items), ...NAV_FOOTER];

/** The group that holds the page at `path`, or null (Home, Settings, About, unknown). */
export const groupForPath = (path: string): string | null => NAV.find((g) => g.items.some((i) => isActive(i.to, path)))?.id ?? null;

/** The title shown in the header for a route. Pages that are not in the nav get a sensible fallback. */
export function titleForPath(path: string): string {
  if (path === "/foundation") return "Foundation check";
  const item = ALL_ITEMS.filter((i) => isActive(i.to, path)).sort((a, b) => b.to.length - a.to.length)[0];
  return item ? item.label : "Quran App";
}
