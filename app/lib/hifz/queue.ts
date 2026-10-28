// Today's plan (Phase 14): what the Home screen says before you press Start. It is the session's own queue (`buildDailyItems`), grouped into the three
// lines of the prototype (Fix tricky ayahs, Review, Learn new), with the time estimate. Pure: the text lengths and the clock come from the caller.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import type { HifzData } from "./engine";
import { buildDailyItems, type SessionItem } from "./session";
import { slippedIn, ayahKey, type WordsRecord } from "./slips";
import { aboutMinutes, estimateSeconds, type Timing, type TimedItem } from "./timing";
import { estimateWordCount } from "./words";

export interface PlanLine {
  kind: "tricky" | "review" | "new";
  count: number;
  title: string;
  detail: string;
}

export interface Plan {
  items: SessionItem[];
  lines: PlanLine[];
  seconds: number;
  minutes: number;
  empty: boolean;
}

export const surahLabel = (surahNo: number): string => SURAH_ROWS[surahNo - 1]?.name ?? `Surah ${surahNo}`;

/** "1", "1–2", "1 and 4", "1, 4 and 6", "1–3 and 7": the ayah numbers of one surah, joined for reading. */
export function ayahList(ayahs: number[]): string {
  const sorted = [...new Set(ayahs)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    parts.push(j > i ? `${sorted[i]}–${sorted[j]}` : `${sorted[i]}`);
    i = j + 1;
  }
  return parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

/** "Al-Mulk 1–2, Al-Ikhlas 1 and 4": the items, grouped by surah in the order they first appear. */
export function refsLabel(d: HifzData, items: readonly SessionItem[]): string {
  const bySurah = new Map<number, number[]>();
  for (const it of items) {
    const surah = d.targets.find((t) => t.id === it.targetId)?.surahNo;
    const ayah = it.ayahNo ?? it.fromAyah;
    if (surah == null || ayah == null) continue;
    bySurah.set(surah, [...(bySurah.get(surah) ?? []), ayah]);
  }
  return [...bySurah].map(([s, a]) => `${surahLabel(s)} ${ayahList(a)}`).join(", ");
}

export interface PlanInputs {
  data: HifzData;
  today: string;
  words: WordsRecord;
  timing: Timing;
  /** characters in an ayah's Arabic text (numbers only, bundled), for the time estimate */
  chars: (surah: number, ayah: number) => number;
  newId: () => string;
  targetIds?: string[];
}

export function buildPlan(i: PlanInputs): Plan {
  const items = buildDailyItems(i.data, i.today, i.newId, { targetIds: i.targetIds });
  const surahOf = (it: SessionItem) => i.data.targets.find((t) => t.id === it.targetId)?.surahNo ?? 0;
  const tricky = items.filter((it) => it.type === "weak-ayah" || it.type === "weak-transition");
  const review = items.filter((it) => it.type === "revision");
  const fresh = items.filter((it) => it.type === "new");

  const lines: PlanLine[] = [];
  if (tricky.length) {
    const only = tricky.length === 1 ? tricky[0]! : null;
    const slipped = only?.ayahNo != null ? slippedIn(i.words, ayahKey(surahOf(only), only.ayahNo)).length : 0;
    const base = only?.ayahNo != null ? `${surahLabel(surahOf(only))} ${surahOf(only)}:${only.ayahNo}` : refsLabel(i.data, tricky);
    lines.push({
      kind: "tricky",
      count: tricky.length,
      title: `Fix ${tricky.length} tricky ${tricky.length === 1 ? "ayah" : "ayahs"}`,
      detail: slipped ? `${base} · ${slipped} ${slipped === 1 ? "word" : "words"} slipped last time` : base,
    });
  }
  if (review.length) lines.push({ kind: "review", count: review.length, title: `Review ${review.length} ${review.length === 1 ? "ayah" : "ayahs"}`, detail: refsLabel(i.data, review) });
  if (fresh.length) lines.push({ kind: "new", count: fresh.length, title: `Learn ${fresh.length} new ${fresh.length === 1 ? "ayah" : "ayahs"}`, detail: refsLabel(i.data, fresh) });

  const timed: TimedItem[] = items.map((it) => ({
    words: it.ayahNo != null ? estimateWordCount(i.chars(surahOf(it), it.ayahNo)) : 6, // a join is the end of one ayah and the start of the next
    isNew: !!it.isNew,
  }));
  const seconds = estimateSeconds(timed, i.timing);
  return { items, lines, seconds, minutes: aboutMinutes(seconds), empty: items.length === 0 };
}

/** How many ayahs are waiting, for the Home tile: the number of items in today's plan. */
export const practiceCount = (d: HifzData, today: string): number => buildDailyItems(d, today, () => "x").length;
