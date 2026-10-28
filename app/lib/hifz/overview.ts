// What a surah looks like in Hifz (Phase 14): one cell per ayah of the plan, coloured by strength, with a mark where the join to the ayah before needs
// work. Pure. The strip is also read out in words (`summarize`), because colour alone is not enough.
import type { HifzData, HifzTarget } from "./engine";

export type Cell = "none" | "learning" | "memorized" | "strong" | "weak";

export interface AyahCell {
  ayah: number;
  s: Cell;
  /** the join from the ayah before to this one needs work */
  joinWeak: boolean;
}

export const CELL_LABEL: Record<Cell, string> = { strong: "Strong", memorized: "Memorized", learning: "Learning", weak: "Needs work", none: "Not started" };

/** One cell per ayah from `startAyah` to `endAyah`. An ayah with no state yet is "none"; a legacy "not-started" is shown the same way. */
export function cellsFor(d: HifzData, t: Pick<HifzTarget, "id" | "startAyah" | "endAyah">): AyahCell[] {
  const ayahs = new Map(d.ayahStates.filter((a) => a.targetId === t.id).map((a) => [a.ayahNo, a.strength]));
  const joins = new Set(d.transitionStates.filter((x) => x.targetId === t.id && x.strength === "weak").map((x) => x.toAyah));
  const out: AyahCell[] = [];
  for (let ayah = t.startAyah; ayah <= t.endAyah; ayah++) {
    const s = ayahs.get(ayah);
    out.push({ ayah, s: s === "learning" || s === "memorized" || s === "strong" || s === "weak" ? s : "none", joinWeak: joins.has(ayah) });
  }
  return out;
}

export function counts(cells: readonly AyahCell[]): Record<Cell, number> & { started: number; joinsWeak: number } {
  const c = { none: 0, learning: 0, memorized: 0, strong: 0, weak: 0 };
  let joinsWeak = 0;
  for (const cell of cells) {
    c[cell.s]++;
    if (cell.joinWeak) joinsWeak++;
  }
  return { ...c, started: cells.length - c.none, joinsWeak };
}

/** "4 of 30 ayahs started: 2 learning, 1 memorized, 1 needs work" — what a screen reader says for the strip. */
export function summarize(cells: readonly AyahCell[]): string {
  const c = counts(cells);
  const parts = ([["strong", "strong"], ["memorized", "memorized"], ["learning", "learning"], ["weak", "need work"]] as const)
    .filter(([k]) => c[k] > 0)
    .map(([k, w]) => `${c[k]} ${k === "weak" ? (c[k] === 1 ? "needs work" : w) : w}`);
  if (c.joinsWeak) parts.push(`${c.joinsWeak} ${c.joinsWeak === 1 ? "join needs" : "joins need"} work`);
  return `${c.started} of ${cells.length} ayahs started${parts.length ? `: ${parts.join(", ")}` : ""}`;
}
