// The FULL, synchronous Wajibat dataset + lookups: for the tests and the generator scripts only.
// The app must not import this file (it would pull every category into one chunk): it uses runtime.ts.
// Aggregated Wajibat dataset + lookups. Rulings are split per category
// (./rulings/*.ts) so later phases can lazy-load them per category (spec
// Phase 10); for now every category's file is small enough to import eagerly.
import type { Ruling, WajibatCategory, WajibatTopic, GlossaryTerm, Procedure, Recitation, DecisionTree } from "./types";
import type { TreeReviews } from "../../utils/wajibatReview";
import { WAJIBAT_CATEGORIES } from "./categories";
import { WAJIBAT_TOPICS } from "./topics";
import { WAJIBAT_GLOSSARY } from "./glossary";
import { WAJIBAT_RECITATIONS } from "./recitations";
import { FOUNDATIONS_RULINGS } from "./rulings/foundations";
import { TAHARAT_RULINGS } from "./rulings/taharat";
import { TAHARAT_PROCEDURES } from "./procedures/taharat";
import { SALAT_RULINGS } from "./rulings/salat";
import { SALAT_PROCEDURES } from "./procedures/salat";
import { SALAT_QA_RULINGS } from "./rulings/salatQa";
import { DOUBTS_RULINGS } from "./rulings/doubts";
import { SAWM_RULINGS } from "./rulings/sawm";
import { SAWM_QA_RULINGS } from "./rulings/sawmQa";
import { KHUMS_RULINGS } from "./rulings/khums";
import { ZAKAT_RULINGS } from "./rulings/zakat";
import { DECISION_TREES } from "./decisionTrees";
import treeReviewsJson from "./treeReviews.json";

export * from "./types";
export { MARAJI, getMarjaById, isMarjaId } from "./marja";
export { WAJIBAT_CATEGORIES, WAJIBAT_TOPICS, WAJIBAT_GLOSSARY, WAJIBAT_RECITATIONS };

export const WAJIBAT_RULINGS: Ruling[] = [...FOUNDATIONS_RULINGS, ...TAHARAT_RULINGS, ...SALAT_RULINGS, ...SALAT_QA_RULINGS, ...DOUBTS_RULINGS, ...SAWM_RULINGS, ...SAWM_QA_RULINGS, ...KHUMS_RULINGS, ...ZAKAT_RULINGS];
export const WAJIBAT_PROCEDURES: Procedure[] = [...TAHARAT_PROCEDURES, ...SALAT_PROCEDURES];

export interface WajibatDataset {
  categories: WajibatCategory[];
  topics: WajibatTopic[];
  rulings: Ruling[];
  glossary: GlossaryTerm[];
  procedures: Procedure[];
  recitations: Recitation[];
  decisionTrees: DecisionTree[];
}

export const WAJIBAT_DATASET: WajibatDataset = {
  categories: WAJIBAT_CATEGORIES,
  topics: WAJIBAT_TOPICS,
  rulings: WAJIBAT_RULINGS,
  glossary: WAJIBAT_GLOSSARY,
  procedures: WAJIBAT_PROCEDURES,
  recitations: WAJIBAT_RECITATIONS,
  decisionTrees: DECISION_TREES,
};

export const getCategoryById = (id: string) => WAJIBAT_CATEGORIES.find((c) => c.id === id);
export const getTopicById = (id: string) => WAJIBAT_TOPICS.find((t) => t.id === id);
export const getRulingById = (id: string) => WAJIBAT_RULINGS.find((r) => r.id === id);
export const getGlossaryTermById = (id: string) => WAJIBAT_GLOSSARY.find((g) => g.id === id);
export const getProcedureById = (id: string) => WAJIBAT_PROCEDURES.find((p) => p.id === id);
/** Reviewer sign-offs per tree and path (decision A6); see app/utils/wajibatReview.ts. */
export const TREE_REVIEWS = treeReviewsJson as unknown as TreeReviews;
export const getDecisionTreeById = (id: string) => DECISION_TREES.find((t) => t.id === id);
export const getRecitationById = (id: string) => WAJIBAT_RECITATIONS.find((r) => r.id === id);

export { getMarjaRuling, isRulingVisibleFor } from "./access";
