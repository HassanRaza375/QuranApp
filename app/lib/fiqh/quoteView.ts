// What a guided step or a helper answer may show of a ruling it quotes (Phase 13b). The same rule as a ruling card (`visibility.ts`): the marja's own entry, or, where that ruling is held for
// review, has its English withheld or is on our needs-human hold, a pointer to his book and NO text, in any language. A step or an answer that quotes such a ruling therefore shows the pointer
// in the quote's place; the quote stored in the step is never shown. Pure.
import type { MarjaId, MarjaRuling, Ruling, SourceCitation, VerificationLevel } from "@legacy/data/wajibat/types";
import { pointerReason, readerNote, type PointerReason } from "./visibility";

/** The sentence under "Refer to his risala", by reason (the legacy's words, and ours for the hold list). */
export const POINTER_TEXT: Record<PointerReason, string> = {
  held: "This ruling is held for review: an automated comparison found a difference between its versions that the Persian original did not settle, so it is not shown until a person has checked it.",
  "english-differs": "The official English edition of this ruling differs from the Persian original, so it is not shown. The app does not translate rulings itself.",
  "check-pending": "This ruling is held for review: its English and Urdu versions differ in a number or a negation, and there is no Persian original to settle it, so it is not shown until a person has checked it.",
};

export type QuoteView =
  | { kind: "missing" }
  | { kind: "pointer"; reason: PointerReason; source: SourceCitation }
  | { kind: "text"; text: string; lang: "en" | "ur"; source: SourceCitation; verification: VerificationLevel; urduOnly: boolean; note: string | null; entry: MarjaRuling };

/** `text` is the quote as the step or the answer stores it, in `lang`. */
export function quoteView(ruling: Ruling | undefined, marjaId: MarjaId, text: string, lang: "en" | "ur"): QuoteView {
  const entry = ruling?.rulings.find((e) => e.marjaId === marjaId);
  if (!ruling || !entry) return { kind: "missing" };
  const reason = pointerReason(ruling, entry);
  if (reason) return { kind: "pointer", reason, source: entry.source };
  return {
    kind: "text",
    text,
    lang,
    source: lang === "ur" && entry.urSource ? entry.urSource : entry.source,
    verification: entry.verification,
    urduOnly: !!entry.urduOnly,
    // the Urdu-only label is shown on its own, so its data note is not repeated
    note: entry.urduOnly ? null : readerNote(entry.note),
    entry,
  };
}
