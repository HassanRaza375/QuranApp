// Display vocabulary for the Wajibat module. Every badge pairs a colour with
// a text label AND an icon — never colour alone (spec §8, Module 17 §24).
import type { Explanation, Hukm, RulingBasis, RulingPanel, VerificationLevel } from "~/data/wajibat/types";

export const HUKM_META: Record<Hukm, { label: string; icon: string; color?: string }> = {
  wajib: { label: "Wājib · obligatory", icon: "mdi-alert-decagram-outline", color: "primary" },
  haram: { label: "Ḥarām · unlawful", icon: "mdi-cancel", color: "error" },
  mustahab: { label: "Mustaḥabb · recommended", icon: "mdi-star-outline", color: "success" },
  makruh: { label: "Makrūh · disapproved", icon: "mdi-thumb-down-outline", color: "warning" },
  mubah: { label: "Mubāḥ · permissible", icon: "mdi-circle-outline" },
};

export const BASIS_META: Record<RulingBasis, { label: string; icon: string; hint: string }> = {
  fatwa: {
    label: "Fatwa",
    icon: "mdi-gavel",
    hint: "A definite ruling of the marja'.",
  },
  ihtiyat_wajib: {
    label: "Obligatory precaution",
    icon: "mdi-shield-alert-outline",
    hint: "You may follow the next most learned marja' on this point.",
  },
  ihtiyat_mustahab: {
    label: "Recommended precaution",
    icon: "mdi-shield-outline",
    hint: "Acting on this precaution is recommended, not required.",
  },
  ihtiyat_unspecified: {
    label: "Precaution (type not specified in the source)",
    icon: "mdi-shield-half-full",
    hint: "The marja's text says 'caution' without saying whether it is obligatory or recommended. The app does not guess; ask his office if it matters for you.",
  },
};

/** App-written notice (decision P6a), shown in the Urdu view when the official Urdu edition
 * still carries the pre-revision text of a ruling. */
export const URDU_EDITION_LAG_NOTICE: Explanation = {
  kind: "explanation",
  text: {
    en: "The Urdu edition has not been updated for this ruling yet, so the revised English (4th edition) text is shown.",
    ur: "اس مسئلے کے لیے اردو ایڈیشن ابھی تازہ نہیں ہوا، اس لیے انگریزی (چوتھے ایڈیشن) کا نظرثانی شدہ متن دکھایا گیا ہے۔",
  },
};

/** Neutral headings for collapsed ruling panels (decision P8). */
export const PANEL_META: Record<RulingPanel, { heading: string; icon: string }> = {
  persons: { heading: "Purity of persons", icon: "mdi-account-group-outline" },
};

export const VERIFICATION_META: Record<VerificationLevel, { label: string; icon: string; color?: string }> = {
  A: { label: "Level A · checked against the official text", icon: "mdi-check-decagram-outline", color: "success" },
  B: { label: "Level B · secondary source", icon: "mdi-book-arrow-right-outline", color: "warning" },
  D: { label: "Disputed · sources disagree", icon: "mdi-alert-outline", color: "error" },
};
