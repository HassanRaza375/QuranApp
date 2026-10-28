// The Duas and Knowledge base groups of Search (Phase 12; deferred from Phase 10 until the pages existed). Loaded by Search after the page opens, because the
// seven datasets are their own chunk. A hit opens the entry's page; its second line says which module it is from and its type, in the data's own terms.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import type { LocalHit, LocalProvider } from "~/lib/searchLocal";
import { commandsAdapter } from "./commands";
import { duasAdapter } from "./duas";
import { eventsAdapter } from "./events";
import { MODULES } from "./modules";
import { peoplesAdapter } from "./peoples";
import { placesAdapter } from "./places";
import { passageLabel } from "./refs";
import { signsAdapter } from "./signs";
import { themesAdapter } from "./themes";
import type { KAdapter, KEntry } from "./types";

const hit = (group: string, e: KEntry, subtitle: string): LocalHit => ({ group, id: `${e.module}:${e.id}`, title: e.name, subtitle, arabic: e.arabic || undefined, href: `${MODULES[e.module].route}/${e.id}` });

const duas: LocalProvider = {
  group: "duas",
  label: "Duas",
  search: (q) =>
    duasAdapter()
      .search("all", q)
      .map((e) => {
        const p = e.passages[0]!;
        return hit("duas", e, `${e.typeLabel} · ${SURAH_ROWS[p.surah - 1]?.name ?? `Surah ${p.surah}`} ${passageLabel(p)}`);
      }),
};

const KNOWLEDGE: (() => KAdapter)[] = [peoplesAdapter, placesAdapter, themesAdapter, eventsAdapter, signsAdapter, commandsAdapter];
const knowledge: LocalProvider = {
  group: "knowledge",
  label: "Knowledge base",
  search: (q) => KNOWLEDGE.flatMap((a) => a().search("all", q)).map((e) => hit("knowledge", e, `${MODULES[e.module].title} · ${e.typeLabel}`)),
};

export const KNOWLEDGE_SEARCH_PROVIDERS: LocalProvider[] = [duas, knowledge];
