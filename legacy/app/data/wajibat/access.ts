// Pure lookups shared by the full dataset (index.ts: tests and scripts) and the lazy runtime
// (runtime.ts: the app). No data is imported here.
import type { MarjaId, MarjaRuling, Ruling } from "./types";

/** The chosen marja's entry for a ruling, or undefined. Deliberately has no
 * fallback to another marja' (decision P1 / spec §2 consequences). */
export const getMarjaRuling = (ruling: Ruling, marjaId: MarjaId): MarjaRuling | undefined =>
  ruling.rulings.find((r) => r.marjaId === marjaId);

/** Whether a ruling is shown to followers of `marjaId`. Supplementary Q&A entries (P13 / R7)
 * belong to one marja' and are hidden from everyone else — never shown as "not added yet". */
export const isRulingVisibleFor = (ruling: Ruling, marjaId: MarjaId | null | undefined): boolean =>
  (!ruling.supplementary || ruling.supplementary.marjaId === marjaId) && (!ruling.audience || ruling.audience === marjaId);
