// The Sawm category's data chunk (fasting and zakāt al-fiṭrah, with Khamenei's Q&A entries).
import type { CategoryData } from "../types";
import { SAWM_RULINGS } from "../rulings/sawm";
import { SAWM_QA_RULINGS } from "../rulings/sawmQa";

export const DATA: CategoryData = { rulings: [...SAWM_RULINGS, ...SAWM_QA_RULINGS], procedures: [], recitations: [], decisionTrees: [] };

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
