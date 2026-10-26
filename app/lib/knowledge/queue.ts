// "Play all" for a knowledge entry: its passages as one queue of ayahs, built from the data every time (nothing is stored but the place in it).
import type { BuiltQueue } from "~/lib/audioEngine";
import { knowledgeQueueId } from "~/lib/audioQueue";
import { adapterFor } from "./index";
import { isModule } from "./modules";
import { playableAyahs } from "./refs";

export async function knowledgeQueue(module: string, id: string): Promise<BuiltQueue | null> {
  if (!isModule(module)) return null;
  const entry = (await adapterFor(module)).get(id);
  if (!entry) return null;
  const items = playableAyahs(entry);
  return items.length ? { id: knowledgeQueueId(module, id), label: entry.name, items } : null;
}
