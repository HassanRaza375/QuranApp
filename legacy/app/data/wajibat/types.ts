// Wajibat & Daily Fiqh (Module 18) — dataset types.
// Spec: wajibat-fiqh-jafari-module.md §7.1, adjusted in Phase 0/1 (see
// wajibat_progress_log.md for every deviation and why).
//
// SOURCE DISCIPLINE — this module's vocabulary is deliberately separate from
// the Knowledge Platform's SourceType / IdentificationBasis
// (app/utils/quranReference.ts). Those answer "how certain is a Qur'anic /
// historical identification"; `VerificationLevel` + `RulingBasis` answer
// "which marja's text does this fiqh ruling rest on, and with what force".
// Same precedent as CommandSourceBasis in app/data/quranCommands.ts.
import type { QuranReference } from "~/utils/quranReference";

export type FiqhId = "jafari"; // extend later: "hanafi" | "shafii" | ...
export type MarjaId = "sistani" | "khamenei" | "makarem";
export type Hukm = "wajib" | "haram" | "mustahab" | "makruh" | "mubah";
/** "ihtiyat_unspecified": the source says "caution/precaution" without stating whether it is
 * obligatory or recommended, and the book defines no default (decision P5 / rule R3). Never guessed. */
export type RulingBasis = "fatwa" | "ihtiyat_wajib" | "ihtiyat_mustahab" | "ihtiyat_unspecified";
/** A = checked against the marja's official text; B = reputable secondary
 * source citing the marja'; D = sources disagree (shown only with a disputed
 * notice). "C" (unverified) is never stored — it is excluded from the dataset. */
export type VerificationLevel = "A" | "B" | "D";
export type ContentLang = "en" | "ur";

export interface LocalizedText {
  en: string;
  ur?: string;
}

/** App-written text. Never displayed as a ruling (spec §4.9). */
export interface Explanation {
  kind: "explanation";
  text: LocalizedText;
}

export interface SourceCitation {
  title: string;
  /** Issue/ruling number ("Ruling 12*") or Q&A number ("Q 7"), exactly as the book labels it. */
  reference: string;
  url: string;
}

export interface MarjaBook {
  title: string;
  lang: ContentLang | "ar" | "fa";
  edition?: string;
  url: string;
  pdfUrl?: string;
  numbering: string;
}

export interface Marja {
  id: MarjaId;
  name: LocalizedText;
  officialSite: string;
  /** "pending-sources": selectable in the picker, but no rulings are shown yet
   * (decision P1) — the UI shows a "please refer to his official risala" notice. */
  status: "active" | "pending-sources";
  books: MarjaBook[];
}

export interface WajibatCategory {
  id: string;
  fiqh: FiqhId;
  title: LocalizedText;
  arabicTerm: string;
  icon: string;
  order: number;
  /** Spec §12 phase in which this category's content is scheduled. */
  phase: number;
  summary: Explanation;
  topicIds: string[];
}

export interface WajibatTopic {
  id: string;
  fiqh: FiqhId;
  categoryId: string;
  title: LocalizedText;
  arabicTerm?: string;
  summary: Explanation;
  /** Additional app-written sections (e.g. the list of the five uṣūl). */
  explanations?: { heading: LocalizedText; body: Explanation }[];
  /** Shown via AyahReferenceCard, labelled "Qur'anic basis" — only ayahs whose own text names the act (R2). */
  quranicBasis?: QuranReference[];
  /** One-line app-written notes on a specific basis ayah, each citing a tafsir (decision P9). */
  quranicBasisNotes?: QuranicBasisNote[];
  rulingIds: string[];
  /** Step-by-step guides; each belongs to one marja' (the UI shows only the chosen marja's). */
  procedureIds?: string[];
  /** Decision helpers shown on this topic page (each belongs to one marja'; the UI shows only the chosen marja's). */
  decisionTreeIds?: string[];
  relatedTopicIds?: string[];
  glossaryIds?: string[];
  /** Live data from another app module shown on the topic page, never recomputed here (spec §6.3). */
  liveTool?: "prayertimes" | "qibla" | "sawm";
  /** Phase 6 (decision G3): the page tells the reader where to pay by pointing to his marja's official website only; the app gives no bank details, representatives or addresses. */
  payLink?: boolean;
  sensitive?: boolean;
  /** Only if a real reviewer exists (Q10). */
  reviewedBy?: { name: string; date: string };
  /** YYYY-MM-DD, local calendar day. */
  lastSourceCheck: string;
}

export interface QuranicBasisNote {
  surahNumber: number;
  ayahNumber: number;
  note: Explanation;
  /** Verbatim quote from the cited tafsir (original language). */
  quote: { text: string; lang: "ar" | "fa" | "ur" | "en" };
  source: { title: string; reference: string; urls: string[] };
}

export interface MarjaRuling {
  marjaId: MarjaId;
  /** "issue" = numbered risala ruling; "qa" = numbered istifta' (question + answer). */
  format: "issue" | "qa";
  /** The question, verbatim, for Q&A-format rulings. */
  question?: LocalizedText;
  /** Verbatim text of the ruling / answer. `ur` only from the marja's official Urdu book (decision R1). */
  text: LocalizedText;
  /** Set only when the source itself states the hukm explicitly — never inferred. */
  hukm?: Hukm;
  basis: RulingBasis;
  /** True when `text` is a verbatim excerpt of a longer numbered ruling. */
  excerpt?: boolean;
  source: SourceCitation;
  /** Citation for `text.ur` / `question.ur` — the Urdu book has its own numbering. Required iff Urdu text exists. */
  urSource?: SourceCitation;
  verification: VerificationLevel;
  /** Why no official Urdu text is shown for this ruling (listed in the phase summary). */
  urduNote?: string;
  /** Decision P19: the marja's only official text for this ruling is Urdu (e.g. Khamenei's
   * *Ahkam-e Amozeshi*, the official Urdu translation of his Persian practical treatise; no
   * official English exists). `text.en` is then "", the Urdu is shown in every language mode with
   * a "no official English translation" label, and the app never translates it. */
  urduOnly?: boolean;
  /** Decision R11 (Khamenei only): his English and Urdu books both translate the same Persian
   * original. Where the official English text differs from the Persian, the English is withheld:
   * `text.en` stays in the data for audit but is never displayed, the official Urdu (which matches
   * the Persian) is shown in every language mode, and the app never translates it itself.
   * The value is the audit reason (data/log only, not shown). */
  /** Decision B1 follow-up: this ruling is held for review (an automated comparison found a difference
   * that the Persian original did not settle). Neither language is shown; the card points to the
   * marja's own book instead. Set only by a recorded decision (`held-pending-review`). */
  referToRisala?: string;
  englishWithheld?: string;
  /** Where the Persian original of this ruling was read to compare the English and Urdu editions
   * (decision R11). Metadata only: the Persian text itself is never displayed. */
  persianSource?: SourceCitation;
  /** The official Urdu edition still has the pre-revision text of this ruling (decision P6):
   * Urdu is withheld, and the Urdu view shows URDU_EDITION_LAG_NOTICE instead. */
  urduEditionLag?: boolean;
  note?: string;
  /** Set true only when `text.en` (or `question.en`) legitimately contains Arabic
   * script because the cited English `source` book itself prints that Arabic as
   * real text (e.g. Khamenei's Rules on Prayer & Fasting). The validator flags any
   * Arabic in `text.en`/`question.en` that doesn't set this — Arabic sourced from a
   * *different* book (e.g. a marja's Urdu edition) must go in a `Recitation`
   * instead, never spliced into another book's quote (decision P12). */
  arabicInSource?: boolean;
}

export interface Ruling {
  id: string;
  topicId: string;
  subject: LocalizedText;
  /** Target: one per marja'. A missing marja' = not sourced yet — the UI never falls back to another marja'. */
  rulings: MarjaRuling[];
  differsBetweenMaraji?: boolean;
  status?: "disputed";
  /** Women-specific / sensitive content: rendered inside a collapsed panel (Q8). */
  sensitive?: boolean;
  /** Other collapsed panels with a neutral heading (decision P8: "persons" = purity of persons).
   * Rulings in a panel are quoted exactly, with no app commentary. */
  panel?: RulingPanel;
  /** Recitation(s) shown alongside this ruling (decision P12) — kept separate
   * from `MarjaRuling.text` rather than spliced into it, because the Arabic
   * is often sourced from a *different* official book than the ruling text
   * itself (e.g. the marja's Urdu book, when his English book shows the
   * same dhikr only as an image). */
  recitationIds?: string[];
  /** Decision P13 / rule R7: an extra entry from one marja's own Q&A book, quoted under its
   * own number. It holds that marja's entry only and is shown only to his followers — other
   * maraji' never see it (not even as "not added yet"), and it is never a translation of the
   * ruling(s) it was compared with. `agreesWith` cites those rulings; a Q&A that differs from
   * them is not added at all. */
  supplementary?: { marjaId: MarjaId; agreesWith: SourceCitation[] };
  /** Phase 6: a point that only this marja's own book states, with no counterpart in the other's
   * (for example Khamenei's Q&A in *The Rulings of Khums*). It holds his entry only and is shown to
   * his followers only: other maraji' never see it, not even as "not added yet". Unlike a
   * `supplementary` entry it is his primary text, so it needs no ruling to agree with. */
  audience?: MarjaId;
  /** For a marja' with no entry in this ruling whose own book states the same point inside
   * another ruling of the same topic: the UI points there instead of showing "not added yet".
   * Used only where that other entry really covers this point (Phase 4a). */
  seeAlso?: { marjaId: MarjaId; rulingId: string }[];
}

/** A recited Arabic text (dhikr, tashahhud, etc.) shown separately from
 * `MarjaRuling.text` so it can be cited to its own source even when that
 * differs from the ruling's own book (decision P12). Never typed from memory
 * — `arabic` must be a verbatim copy of `source`, checked letter by letter. */
export interface Recitation {
  id: string;
  marjaId: MarjaId;
  arabic: string;
  transliteration?: string;
  translation?: LocalizedText;
  source: SourceCitation;
  note?: string;
}

export type RulingPanel = "persons";

export interface ProcedureStep {
  id: string;
  /** 1..n without gaps (validator). */
  order: number;
  /** App-written short label (explanation, not a ruling). */
  title: LocalizedText;
  /** Verbatim excerpt of the procedure marja's entry in `rulingId` (validator checks it is a substring). */
  instruction: LocalizedText;
  rulingId: string;
  /** Only where the cited ruling states it. */
  hukm?: Hukm;
  isRukn?: boolean;
  /** Recitation(s) to show with this step (decision P12); see `Ruling.recitationIds`. */
  recitationIds?: string[];
  note?: string;
}

export interface Procedure {
  id: string;
  topicId: string;
  marjaId: MarjaId;
  title: LocalizedText;
  steps: ProcedureStep[];
}

/** An option of a helper question. Questions describe the user's situation only and never state a
 * ruling (decision P17a); `basedOn` lists the ruling(s) that make this option lead where it does
 * (P17b), each with the exact phrase of the marja's text that states the condition. */
export interface DecisionOption {
  id: string;
  label: LocalizedText;
  nextId: string;
  basedOn: { rulingId: string; phrase: string }[];
}

/** A quoted part of one of the marja's rulings, shown as the answer. `text` is a verbatim
 * substring of that marja's entry (English, or Urdu where the entry is Urdu-only). */
export interface DecisionQuote {
  rulingId: string;
  text: string;
  lang: "en" | "ur";
}

export interface DecisionNode {
  id: string;
  /** Question node: one question per screen; an "I'm not sure" option is always offered and leads to `notSureId`. */
  question?: Explanation;
  options?: DecisionOption[];
  notSureId?: string;
  /** Outcome nodes. "ruling": the marja's own words; "refer": a pointer to his risala, never a guessed answer. */
  outcome?:
    | {
        kind: "ruling";
        quotes: DecisionQuote[];
        /** Phrases that must occur in the quotes: what this outcome says, checked by the tests (P17c). */
        verdictPhrases: string[];
        /** Related rulings to open in full (not quotes). */
        seeRulingIds?: string[];
      }
    | { kind: "refer"; reason: Explanation };
}

export interface DecisionTree {
  id: string;
  topicId: string;
  marjaId: MarjaId;
  title: LocalizedText;
  intro: Explanation;
  rootId: string;
  /** Where to look in his own book when the helper can't answer (shown on every "refer" outcome). */
  risala: { book: string; location: string; url: string };
  nodes: DecisionNode[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  arabic?: string;
  urdu?: string;
  definition: LocalizedText;
  /** The book the definition is taken from; absent = app-written explanation. */
  source?: SourceCitation;
}

/** What one category's lazily loaded data chunk holds (see runtime.ts). */
export interface CategoryData {
  rulings: Ruling[];
  procedures: Procedure[];
  recitations: Recitation[];
  decisionTrees: DecisionTree[];
}
