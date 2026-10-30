// The seven knowledge modules (Phase 12): their routes, the words the legacy app used for them, the legacy bookmark key of each, and whether their pages
// exist yet (a link to a page that does not exist is never drawn: it is plain text). The page strings are ours; the entries' words are the data's.
import type { KnowledgeModuleId } from "./types";

export type GraphModule = KnowledgeModuleId | "persons" | "stories";

export interface ModuleInfo {
  id: KnowledgeModuleId;
  route: string;
  title: string;
  /** one short question the list answers (the prototype's) */
  question: string;
  icon: string;
  /** the legacy bookmark key prefix: `community:ad` */
  bookmark: string;
  singular: string;
}

export const MODULES: Record<KnowledgeModuleId, ModuleInfo> = {
  peoples: { id: "peoples", route: "/peoples", title: "Peoples & Nations", question: "Which communities?", icon: "lucide:users", bookmark: "community", singular: "people" },
  places: { id: "places", route: "/places", title: "Places", question: "Where?", icon: "lucide:map-pin", bookmark: "place", singular: "place" },
  themes: { id: "themes", route: "/themes", title: "Themes", question: "What does it teach?", icon: "lucide:tags", bookmark: "theme", singular: "theme" },
  duas: { id: "duas", route: "/duas", title: "Duas", question: "What was asked?", icon: "lucide:hand-heart", bookmark: "dua", singular: "dua" },
  events: { id: "events", route: "/events", title: "Events in the Qur’an", question: "What happened?", icon: "lucide:calendar-days", bookmark: "event", singular: "event" },
  signs: { id: "signs", route: "/signs", title: "Signs & Miracles", question: "What was shown?", icon: "lucide:sparkles", bookmark: "sign", singular: "sign" },
  commands: { id: "commands", route: "/commands", title: "Commands & Prohibitions", question: "What is commanded?", icon: "lucide:list-checks", bookmark: "command", singular: "command" },
};
export const MODULE_ORDER: KnowledgeModuleId[] = ["peoples", "places", "themes", "duas", "events", "signs", "commands"];

/** Which modules have their pages built (all seven since Phase 12). A module that is not ready is never linked: its names are plain text. */
export const KNOWLEDGE_READY: Record<KnowledgeModuleId, boolean> = { peoples: true, places: true, themes: true, duas: true, events: true, signs: true, commands: true };

export const GRAPH_LABELS: Record<GraphModule, string> = {
  persons: "People",
  stories: "Stories",
  peoples: "Peoples & Nations",
  places: "Places",
  themes: "Themes",
  duas: "Duas",
  events: "Events",
  signs: "Signs & Miracles",
  commands: "Commands & Prohibitions",
};
export const GRAPH_ORDER: GraphModule[] = ["persons", "peoples", "places", "stories", "themes", "duas", "events", "signs", "commands"];

/** Where an entity of a module opens, or null when that page does not exist yet. */
export function hrefFor(module: GraphModule, id: string): string | null {
  if (module === "persons") return `/persons/${id}`;
  if (module === "stories") return `/stories/${id}`;
  return KNOWLEDGE_READY[module] ? `${MODULES[module].route}/${id}` : null;
}

export const bookmarkKey = (module: KnowledgeModuleId, id: string) => `${MODULES[module].bookmark}:${id}`;
export const isModule = (v: unknown): v is KnowledgeModuleId => typeof v === "string" && v in MODULES;
