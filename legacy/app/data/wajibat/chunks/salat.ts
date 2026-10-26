// The Salat category's data chunk: rulings (with doubts and Khamenei's Q&A entries), the guided prayers,
// their recitations and the prayer-doubts helpers.
import type { CategoryData } from "../types";
import { SALAT_RULINGS } from "../rulings/salat";
import { SALAT_QA_RULINGS } from "../rulings/salatQa";
import { DOUBTS_RULINGS } from "../rulings/doubts";
import { SALAT_PROCEDURES } from "../procedures/salat";
import { WAJIBAT_RECITATIONS } from "../recitations";
import { SALAT_TREES } from "../decisionTrees/salat";

export const DATA: CategoryData = {
  rulings: [...SALAT_RULINGS, ...SALAT_QA_RULINGS, ...DOUBTS_RULINGS],
  procedures: SALAT_PROCEDURES,
  recitations: WAJIBAT_RECITATIONS,
  decisionTrees: SALAT_TREES,
};

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
