// "Connected" and "Referenced by", from the legacy graph index (`@legacy/utils/graphIndex`), which this only reads. An edge is either STORED (this entry's
// own data names the other: it is "Connected") or DERIVED (only the other entry's data names this one: it is "Referenced by", and is worded as that, never as
// if this entry said it). Person-to-person family relations are never reversed by the index. A link is drawn only where the target's page exists.
import { getEntity, getRelatedEntities, type EntityModule, type GraphEdge } from "@legacy/utils/graphIndex";
import { GRAPH_LABELS, GRAPH_ORDER, hrefFor, type GraphModule } from "./modules";

export interface LinkItem {
  module: GraphModule;
  id: string;
  name: string;
  href: string | null;
}
export interface LinkGroup {
  module: GraphModule;
  label: string;
  items: LinkItem[];
}

const nameOf = (module: GraphModule, id: string): string => {
  const e = getEntity({ module: module as EntityModule, id }) as { name?: unknown; title?: unknown } | undefined;
  return typeof e?.name === "string" ? e.name : typeof e?.title === "string" ? e.title : id;
};

function group(edges: GraphEdge[]): LinkGroup[] {
  const by = new Map<GraphModule, Map<string, LinkItem>>();
  for (const e of edges) {
    const m = e.to.module as GraphModule;
    const items = by.get(m) ?? new Map<string, LinkItem>();
    if (!items.has(e.to.id)) items.set(e.to.id, { module: m, id: e.to.id, name: nameOf(m, e.to.id), href: hrefFor(m, e.to.id) });
    by.set(m, items);
  }
  return GRAPH_ORDER.filter((m) => by.has(m)).map((m) => ({ module: m, label: GRAPH_LABELS[m], items: [...by.get(m)!.values()] }));
}

/** The entry's stored links (grouped by module) and, separately, those that only another entry's data states. */
export function linksFor(module: GraphModule, id: string): { connected: LinkGroup[]; referencedBy: LinkGroup[] } {
  const edges = getRelatedEntities({ module: module as EntityModule, id }).filter((e) => !(e.to.module === module && e.to.id === id));
  const stored = edges.filter((e) => e.direction === "stored");
  const storedKeys = new Set(stored.map((e) => `${e.to.module}:${e.to.id}`));
  const derived = edges.filter((e) => e.direction === "derived_reverse" && !storedKeys.has(`${e.to.module}:${e.to.id}`));
  return { connected: group(stored), referencedBy: group(derived) };
}
