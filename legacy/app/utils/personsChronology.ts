// Shared chronology-display formatting for the Prophets & Qur'anic Persons
// feature — used by PersonCard, the detail page, and the Timeline so the same
// person's chronology never reads differently in two places. Kept
// dependency-free like the rest of app/utils/persons*.ts.
import type { ChronologyStatus } from "~/data/quranPersons";

export const CHRONOLOGY_STATUS_LABELS: Record<ChronologyStatus, string | null> = {
  strong: null, // established enough to not need a qualifier badge
  traditional: "Traditional chronology",
  uncertain: "Chronology uncertain",
  unknown: "Chronology unknown",
};

/** Never let an uncertain/traditional date read with the same confidence as
 * a verified one (prophets-quran-feature.md §30) — a `strong` chronology's
 * label stands alone, everything else is explicitly qualified. */
export const chronologyText = (chronology?: { label?: string; status: ChronologyStatus } | null): string => {
  if (!chronology) return "";
  if (chronology.label && chronology.status === "strong") return chronology.label;
  const statusLabel = CHRONOLOGY_STATUS_LABELS[chronology.status];
  if (chronology.label && statusLabel) return `${chronology.label} — ${statusLabel}`;
  return statusLabel ?? chronology.label ?? "";
};
