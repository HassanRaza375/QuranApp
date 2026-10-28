// Search over Daily Fiqh: topic titles and Arabic terms, ruling subjects and glossary terms, in English and Urdu, insensitive to Arabic marks and Latin diacritics. It runs over the
// one-line ruling index, so no category chunk is needed (the legacy util, unchanged). A ruling that belongs to one marja' only is found by his followers only.
import type { MarjaId } from "@legacy/data/wajibat/types";
import { searchWajibat } from "@legacy/utils/wajibatSearch";
import { WAJIBAT_GLOSSARY, WAJIBAT_RULING_INDEX, WAJIBAT_TOPICS, getCategoryById, getTopicById } from "./data";

export const searchFiqh = (query: string, marjaId?: MarjaId | null) => searchWajibat({ topics: WAJIBAT_TOPICS, rulings: WAJIBAT_RULING_INDEX, glossary: WAJIBAT_GLOSSARY }, query, marjaId);

export const topicHref = (topicId: string): string => {
  const t = getTopicById(topicId);
  return t ? `/fiqh/${t.categoryId}/${t.id}` : "/fiqh";
};
export const rulingHref = (topicId: string, rulingId: string): string => `${topicHref(topicId)}#${rulingId}`;
export const categoryTitle = (id: string): string => getCategoryById(id)?.title.en ?? id;
