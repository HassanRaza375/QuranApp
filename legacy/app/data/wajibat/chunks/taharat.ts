// The Taharat category's data chunk: rulings, step-by-step procedures and the wuḍūʾ helpers.
import type { CategoryData } from "../types";
import { TAHARAT_RULINGS } from "../rulings/taharat";
import { TAHARAT_PROCEDURES } from "../procedures/taharat";
import { TAHARAT_TREES } from "../decisionTrees/taharat";

export const DATA: CategoryData = { rulings: TAHARAT_RULINGS, procedures: TAHARAT_PROCEDURES, recitations: [], decisionTrees: TAHARAT_TREES };

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
