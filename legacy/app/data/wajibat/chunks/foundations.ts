// The Foundations category's data chunk (rulings only). Loaded by runtime.ts when a Foundations page opens.
import type { CategoryData } from "../types";
import { FOUNDATIONS_RULINGS } from "../rulings/foundations";

export const DATA: CategoryData = { rulings: FOUNDATIONS_RULINGS, procedures: [], recitations: [], decisionTrees: [] };

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
