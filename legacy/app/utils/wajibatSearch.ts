// Pure search over the Wajibat dataset (spec §7.3): topic titles and Arabic
// terms, ruling subjects, and glossary terms/definitions, in English and Urdu.
// Insensitive to Arabic tashkeel and to transliteration diacritics, so
// "ihtiyat" finds "iḥtiyāṭ" and "تقليد" finds "تقلید". Separate from the
// site-wide /search page, same as every other module (Shared Foundation #8).
import type { GlossaryTerm, MarjaId, WajibatTopic } from "~/data/wajibat/types";

/** What search needs of a ruling: the full Ruling or the one-line index entry (rulingIndex.ts) both fit. */
export interface SearchableRuling {
  id: string;
  topicId: string;
  subject: { en: string; ur?: string };
  supplementary?: { marjaId: MarjaId };
  audience?: MarjaId;
  /** On a ruling-index entry: the marja' it is shown to when it belongs to one marja' only. */
  audienceMarja?: MarjaId;
}

export interface SearchableData<R extends SearchableRuling = SearchableRuling> {
  topics: WajibatTopic[];
  rulings: R[];
  glossary: GlossaryTerm[];
}

export interface WajibatSearchResults<R extends SearchableRuling = SearchableRuling> {
  topics: WajibatTopic[];
  rulings: R[];
  glossary: GlossaryTerm[];
}

export const normalizeWajibatText = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Latin diacritics (ḥ → h, ā → a)
    .replace(/[ً-ٰٟۖ-ۭ]/g, "") // Arabic/Urdu tashkeel
    .replace(/[ʿʾ‘’'`ʻʼ]/g, "") // ayn/hamza marks and apostrophes
    .replace(/[يى]/g, "ی") // Arabic ya / alif maqsura → Persian/Urdu ya
    .replace(/ك/g, "ک") // Arabic kaf → Persian/Urdu kaf
    .replace(/[ةۃ]/g, "ہ") // ta marbuta → Urdu he
    .replace(/[‐-―-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** The one marja' a ruling is shown to (a supplementary Q&A entry, or his own point), or undefined. */
const ownerOf = (r: SearchableRuling) => r.supplementary?.marjaId ?? r.audience ?? r.audienceMarja;

const matches = (query: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f !== undefined && normalizeWajibatText(f).includes(query));

/** `marjaId`: hides other maraji' supplementary Q&A entries (P13 / R7). */
export const searchWajibat = <R extends SearchableRuling>(data: SearchableData<R>, rawQuery: string, marjaId?: MarjaId | null): WajibatSearchResults<R> => {
  const q = normalizeWajibatText(rawQuery);
  if (!q) return { topics: [], rulings: [], glossary: [] };

  return {
    topics: data.topics.filter((t) => matches(q, t.title.en, t.title.ur, t.arabicTerm, t.summary.text.en)),
    rulings: data.rulings.filter((r) => (ownerOf(r) === undefined || ownerOf(r) === marjaId) && matches(q, r.subject.en, r.subject.ur)),
    glossary: data.glossary.filter((g) => matches(q, g.term, g.arabic, g.urdu, g.definition.en, g.definition.ur)),
  };
};
