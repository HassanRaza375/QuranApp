// What a follower of one marja' sees of one ruling (Phase 13). Pure: no data is imported here, so a test can walk every ruling of every marja'.
//
// Ported rule for rule from the legacy app (`RulingCard.vue`, `data/wajibat/access.ts`) with the changes you decided on 2026-10-26:
//  - the marja's own entry or nothing: there is NO fallback to another marja's text (legacy decision P1);
//  - an entry that is held for review, whose English is withheld because it differs from his Persian original, or that is on our needs-human hold list shows a
//    pointer to his own book and NO text, in any reading language: no Urdu is shown in its place;
//  - "Both" shows each language with its own source line, and nothing says or implies that one is a translation of the other;
//  - a ruling with no entry says "Not added yet for <marja'>. Refer to his risala."
import type { MarjaId, MarjaRuling, Ruling, SourceCitation } from "@legacy/data/wajibat/types";
import { isNeedsHumanHold } from "./holds";

export type FiqhLang = "en" | "ur" | "both";
export const FIQH_LANGS: FiqhLang[] = ["en", "ur", "both"];
export const isFiqhLang = (v: unknown): v is FiqhLang => v === "en" || v === "ur" || v === "both";

/** How the marja' is named in a sentence ("Not added yet for Khamenei"). */
export const MARJA_SHORT: Record<MarjaId, string> = { sistani: "Sistani", khamenei: "Khamenei", makarem: "Makarem Shirazi" };

/** Why a ruling is shown as a pointer and not as text. */
export type PointerReason =
  /** the legacy data holds it for review (`referToRisala`) */
  | "held"
  /** his English edition differs from his Persian original, so the English is withheld (R11, B1) */
  | "english-differs"
  /** the check could not settle it and no person has decided yet: our own hold, from the needs-human rows */
  | "check-pending";

export interface TextBlock {
  /** the question, for a Q&A entry */
  question?: string;
  text: string;
  source: SourceCitation;
}

export type Notice =
  /** (P19) his only official text of this ruling is Urdu: no official English exists */
  | { kind: "urdu-only" }
  /** (P6a) the official Urdu edition is older than the revised English ruling */
  | { kind: "urdu-lag" }
  /** an Urdu reader gets the English where there is no official Urdu */
  | { kind: "no-urdu"; reason?: string };

/**
 * The legacy page prints a ruling's `note`, and the notes carry the legacy author's working references ("(decision P6)", "rule R7") and, in one, a sentence that says it is "not shown in
 * the UI". Only the reader-facing part is shown: those references and that data note are cut, and nothing else is changed. Null when nothing is left.
 */
export function readerNote(note: string | undefined): string | null {
  if (!note) return null;
  const cut = note
    .replace(/\s*Data note \([^)]*\)[\s\S]*$/, "")
    .replace(/\s*\((?:decision|rule|P\d+|R\d+)[^)]*\)/gi, "")
    .replace(/\s*\(\/[^)\s]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cut || null;
}

export type RulingView =
  | { kind: "missing"; pending: boolean; seeAlsoRulingId?: string }
  | { kind: "pointer"; reason: PointerReason; source: SourceCitation }
  | {
      kind: "text";
      english: TextBlock | null;
      urdu: (TextBlock & { persian?: SourceCitation }) | null;
      notices: Notice[];
      note: string | null;
      entry: MarjaRuling;
    };

/** Which of the ruling's entries is held back, and why; null when its text may be shown. */
export function pointerReason(ruling: Pick<Ruling, "id">, entry: MarjaRuling): PointerReason | null {
  if (entry.referToRisala !== undefined) return "held";
  if (isNeedsHumanHold(ruling.id, entry.marjaId)) return "check-pending";
  if (entry.englishWithheld !== undefined) return "english-differs";
  return null;
}

/** The entry of `marjaId` in `ruling`, or undefined. Deliberately no fallback to another marja' (P1). */
export const entryOf = (ruling: Pick<Ruling, "rulings">, marjaId: MarjaId): MarjaRuling | undefined => ruling.rulings.find((r) => r.marjaId === marjaId);

/** Whether a ruling is shown to followers of `marjaId` at all. An entry that belongs to one marja' (a supplementary Q&A, or his own point) is invisible to every other. */
export const visibleTo = (ruling: Pick<Ruling, "supplementary" | "audience">, marjaId: MarjaId | null | undefined): boolean =>
  (!ruling.supplementary || ruling.supplementary.marjaId === marjaId) && (!ruling.audience || ruling.audience === marjaId);

export function viewOf(ruling: Ruling, marjaId: MarjaId, lang: FiqhLang, pending: boolean): RulingView {
  const entry = entryOf(ruling, marjaId);
  if (!entry) {
    const see = (ruling.seeAlso ?? []).find((s) => s.marjaId === marjaId);
    return { kind: "missing", pending, seeAlsoRulingId: see?.rulingId };
  }
  const reason = pointerReason(ruling, entry);
  if (reason) return { kind: "pointer", reason, source: entry.source };

  const hasUrdu = !!entry.text.ur;
  const urduOnly = !!entry.urduOnly;
  const showUrdu = hasUrdu && (lang !== "en" || urduOnly);
  const showEnglish = !urduOnly && (lang !== "ur" || !hasUrdu);
  const notices: Notice[] = [];
  if (urduOnly) notices.push({ kind: "urdu-only" });
  if (lang !== "en" && !hasUrdu) {
    if (entry.urduEditionLag) notices.push({ kind: "urdu-lag" });
    notices.push({ kind: "no-urdu", reason: readerNote(entry.urduNote) ?? undefined });
  }
  return {
    kind: "text",
    entry,
    notices,
    note: readerNote(entry.note),
    english: showEnglish ? { question: entry.question?.en, text: entry.text.en, source: entry.source } : null,
    urdu: showUrdu && entry.urSource ? { question: entry.question?.ur, text: entry.text.ur!, source: entry.urSource, persian: entry.persianSource } : null,
  };
}
