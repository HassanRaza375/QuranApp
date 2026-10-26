// The adapter of a module, loaded when its page opens (each module's data is its own chunk). Modules whose pages are not built yet are not loaded.
import type { KAdapter, KnowledgeModuleId } from "./types";

export async function adapterFor(module: KnowledgeModuleId): Promise<KAdapter> {
  switch (module) {
    case "peoples":
      return (await import("./peoples")).peoplesAdapter();
    default:
      throw new Error(`The ${module} module is not built yet`);
  }
}
