// The Khums category's data chunk (rulings only).
import type { CategoryData } from "../types";
import { KHUMS_RULINGS } from "../rulings/khums";

export const DATA: CategoryData = { rulings: KHUMS_RULINGS, procedures: [], recitations: [], decisionTrees: [] };

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
