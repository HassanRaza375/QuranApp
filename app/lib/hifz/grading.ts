// From what happened in a recitation to a grade (Phase 14, the owner's rules): no slips and no hints is `good`; any slip is `again`; `easy` only from the
// optional "This was easy" button, and only after a clean recitation. A slip is a word you stumbled on, and also a word you had to reveal to go on.
// "First word" is a cue, not a slip: it grades `good`, is recorded as hint level 1 (the legacy hint fields), and takes the "This was easy" button away.
import type { Grade } from "./engine";

export interface Recitation {
  /** indices of the words slipped on (a revealed word counts) */
  slips: readonly number[];
  /** the first-word cue was used */
  cue: boolean;
  /** "This was easy" was pressed */
  easy: boolean;
}

export const canOfferEasy = (r: Pick<Recitation, "slips" | "cue">): boolean => r.slips.length === 0 && !r.cue;

export function gradeFor(r: Recitation): { grade: Grade; hintLevel: number } {
  const hintLevel = r.cue ? 1 : 0;
  if (r.slips.length > 0) return { grade: "again", hintLevel };
  if (r.easy && canOfferEasy(r)) return { grade: "easy", hintLevel };
  return { grade: "good", hintLevel };
}
