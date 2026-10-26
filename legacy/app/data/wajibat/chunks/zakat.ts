// The Zakat category's data chunk (rulings only).
import type { CategoryData } from "../types";
import { ZAKAT_RULINGS } from "../rulings/zakat";

export const DATA: CategoryData = { rulings: ZAKAT_RULINGS, procedures: [], recitations: [], decisionTrees: [] };

/** The URL of the built chunk file this module ends up in (what the offline cache stores). */
export const CHUNK_URL: string = import.meta.url;
