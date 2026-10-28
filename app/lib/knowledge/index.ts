// The adapter of a module, loaded when its page opens (each module's data is its own chunk).
import type { KAdapter, KnowledgeModuleId } from "./types";

export async function adapterFor(module: KnowledgeModuleId): Promise<KAdapter> {
  switch (module) {
    case "peoples":
      return (await import("./peoples")).peoplesAdapter();
    case "places":
      return (await import("./places")).placesAdapter();
    case "themes":
      return (await import("./themes")).themesAdapter();
    case "duas":
      return (await import("./duas")).duasAdapter();
    case "events":
      return (await import("./events")).eventsAdapter();
    case "signs":
      return (await import("./signs")).signsAdapter();
    case "commands":
      return (await import("./commands")).commandsAdapter();
  }
}
