// The words and icons of the Daily Fiqh badges. The words are the legacy app's own (`@legacy/utils/wajibatLabels`); only the icons are ours (Lucide). A badge always pairs a text
// label with an icon: never colour alone.
import type { Hukm, RulingBasis } from "@legacy/data/wajibat/types";
import { BASIS_META, HUKM_META } from "@legacy/utils/wajibatLabels";

const HUKM_ICON: Record<Hukm, string> = { wajib: "lucide:badge-alert", haram: "lucide:ban", mustahab: "lucide:star", makruh: "lucide:thumbs-down", mubah: "lucide:circle" };
const BASIS_ICON: Record<RulingBasis, string> = { fatwa: "lucide:gavel", ihtiyat_wajib: "lucide:shield-alert", ihtiyat_mustahab: "lucide:shield", ihtiyat_unspecified: "lucide:shield-question" };

export const hukmBadge = (h: Hukm) => ({ label: HUKM_META[h].label, icon: HUKM_ICON[h] });
export const basisBadge = (b: RulingBasis) => ({ label: BASIS_META[b].label, icon: BASIS_ICON[b], hint: BASIS_META[b].hint });

/** The icon of a category (the legacy data names Material icons, which this app does not bundle). */
const CATEGORY_ICON: Record<string, string> = {
  foundations: "lucide:book-open",
  taharat: "lucide:droplets",
  salat: "lucide:person-standing",
  sawm: "lucide:moon",
  khums: "lucide:coins",
  zakat: "lucide:hand-coins",
  hajj: "lucide:landmark",
  otherfuru: "lucide:scale",
  dailylife: "lucide:sun",
};
export const categoryIcon = (id: string) => CATEGORY_ICON[id] ?? "lucide:scroll-text";
