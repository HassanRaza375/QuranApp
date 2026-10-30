// The Daily Fiqh group of Search (Phase 13): topics, rulings and glossary terms, from the one-line ruling index (no category chunk is needed). Loaded by Search after the page opens, like the
// knowledge groups, because the index is part of the Daily Fiqh data chunk. A ruling that belongs to one marja' only is found by his followers only; a hit opens its topic (a ruling at its card).
import type { MarjaId } from "@legacy/data/wajibat/types";
import type { LocalHit, LocalProvider } from "~/lib/searchLocal";
import { getTopicById } from "./data";
import { categoryTitle, rulingHref, searchFiqh, topicHref } from "./search";

const fiqh: LocalProvider = {
  group: "fiqh",
  label: "Daily Fiqh",
  search: (q, ctx) => {
    const r = searchFiqh(q, (ctx.marjaId ?? null) as MarjaId | null);
    const hits: LocalHit[] = [];
    for (const t of r.topics) hits.push({ group: "fiqh", id: `topic:${t.id}`, title: t.title.en, subtitle: `Topic · ${categoryTitle(t.categoryId)}`, arabic: t.arabicTerm, href: topicHref(t.id) });
    for (const x of r.rulings) hits.push({ group: "fiqh", id: `ruling:${x.id}`, title: x.subject.en, subtitle: `Ruling · ${getTopicById(x.topicId)?.title.en ?? x.topicId}`, href: rulingHref(x.topicId, x.id) });
    for (const g of r.glossary) hits.push({ group: "fiqh", id: `term:${g.id}`, title: g.term, subtitle: `Glossary · ${g.definition.en}`, arabic: g.arabic, href: `/fiqh/glossary#${g.id}` });
    return hits;
  },
};

export const FIQH_SEARCH_PROVIDERS: LocalProvider[] = [fiqh];
