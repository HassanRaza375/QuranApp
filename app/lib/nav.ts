// Navigation, grouped by intent (docs/design/DESIGN_SYSTEM.md, principle 4). Routes are the LEGACY routes, unchanged.
// `built: false` entries are shown but lead to the "not rebuilt yet" page until their phase lands.
export interface NavItem { label: string; to: string; icon: string; phase: number }
export interface NavGroup { id: string; label: string; items: NavItem[]; optional?: "literaryModules" }

export const NAV: NavGroup[] = [
  { id: "read", label: "Read", items: [
    { label: "Home", to: "/", icon: "lucide:house", phase: 1 },
    { label: "Surahs", to: "/surah-listing", icon: "lucide:book-open", phase: 3 },
    { label: "Juz", to: "/juz", icon: "lucide:layers", phase: 3 },
    { label: "Per page", to: "/per-page-read", icon: "lucide:file-text", phase: 9 },
    { label: "Search", to: "/search", icon: "lucide:search", phase: 10 },
  ] },
  { id: "study", label: "Study", items: [
    { label: "Library", to: "/bookmarks", icon: "lucide:bookmark", phase: 6 },
    { label: "Reading goals", to: "/goals", icon: "lucide:target", phase: 15 },
    { label: "Hifz", to: "/hifz", icon: "lucide:brain", phase: 14 },
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
