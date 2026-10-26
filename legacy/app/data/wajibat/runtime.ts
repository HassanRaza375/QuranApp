// The app's view of the Wajibat dataset. The small, always-needed part (categories, topics, glossary,
// the maraji', helper sign-offs, a one-line index of every ruling for search) is imported normally; the
// ruling text, procedures, recitations and helpers of each category live in their own chunk
// (chunks/<category>.ts -> wajibat-data-<category>-<hash>.js, see nuxt.config.ts) and are loaded on demand.
//
// A page calls `await loadCategory(id)` before it reads rulings; the lookups below then work
// synchronously, as the components expect. Do not import index.ts from app code: it is the full dataset
// and would pull every chunk back into one.
import type { CategoryData, DecisionTree, Procedure, Recitation, Ruling } from "./types";
import type { TreeReviews } from "../../utils/wajibatReview";
import { WAJIBAT_CATEGORIES } from "./categories";
import { WAJIBAT_TOPICS } from "./topics";
import { WAJIBAT_GLOSSARY } from "./glossary";
import { WAJIBAT_RULING_INDEX, type RulingIndexEntry } from "./rulingIndex";
import treeReviewsJson from "./treeReviews.json";

export * from "./types";
export { MARAJI, getMarjaById, isMarjaId } from "./marja";
export { getMarjaRuling, isRulingVisibleFor } from "./access";
export { WAJIBAT_CATEGORIES, WAJIBAT_TOPICS, WAJIBAT_GLOSSARY, WAJIBAT_RULING_INDEX };
export type { RulingIndexEntry };

export const TREE_REVIEWS = treeReviewsJson as unknown as TreeReviews;

export const getCategoryById = (id: string) => WAJIBAT_CATEGORIES.find((c) => c.id === id);
export const getTopicById = (id: string) => WAJIBAT_TOPICS.find((t) => t.id === id);
export const getGlossaryTermById = (id: string) => WAJIBAT_GLOSSARY.find((g) => g.id === id);

type Loader = () => Promise<{ DATA: CategoryData; CHUNK_URL: string }>;
/** One entry per category that has data; the literal paths let the bundler cut one chunk per category. */
const LOADERS: Record<string, Loader> = {
  foundations: () => import("./chunks/foundations"),
  taharat: () => import("./chunks/taharat"),
  salat: () => import("./chunks/salat"),
  sawm: () => import("./chunks/sawm"),
  khums: () => import("./chunks/khums"),
  zakat: () => import("./chunks/zakat"),
};

const rulings = new Map<string, Ruling>();
const procedures = new Map<string, Procedure>();
const recitations = new Map<string, Recitation>();
const trees = new Map<string, DecisionTree>();
const loaded = new Map<string, Promise<void>>();
const chunkUrls = new Map<string, string>();

/** Loads one category's chunk (once). Categories without data (khums, ...) resolve at once. */
export const loadCategory = (categoryId: string): Promise<void> => {
  const existing = loaded.get(categoryId);
  if (existing) return existing;
  const loader = LOADERS[categoryId];
  const p = loader
    ? loader().then(({ DATA, CHUNK_URL }) => {
        chunkUrls.set(categoryId, CHUNK_URL);
        for (const r of DATA.rulings) rulings.set(r.id, r);
        for (const x of DATA.procedures) procedures.set(x.id, x);
        for (const x of DATA.recitations) recitations.set(x.id, x);
        for (const x of DATA.decisionTrees) trees.set(x.id, x);
      })
    : Promise.resolve();
  // a failed load (offline, missing chunk) can be retried by the next page
  p.catch(() => loaded.delete(categoryId));
  loaded.set(categoryId, p);
  return p;
};

/** Every category that has a data chunk (for "Save all for offline" and the full-text tools). */
export const loadAllCategories = async (): Promise<void> => {
  await Promise.all(Object.keys(LOADERS).map(loadCategory));
};

export const isCategoryLoaded = (categoryId: string) => loaded.has(categoryId);

// Synchronous lookups: valid for the categories whose chunk has been loaded.
export const getRulingById = (id: string) => rulings.get(id);
export const getProcedureById = (id: string) => procedures.get(id);
export const getRecitationById = (id: string) => recitations.get(id);
export const getDecisionTreeById = (id: string) => trees.get(id);

/** Number of categories that have a data chunk. */
export const CATEGORY_CHUNK_COUNT = Object.keys(LOADERS).length;

/** URLs of the chunk files loaded so far: the core chunk plus every category chunk opened (for the offline cache). */
export const loadedChunkUrls = (): string[] => [...new Set([import.meta.url, ...chunkUrls.values()])];
