// Where an old `/juz/<n>` link goes (Phase 15): the reader at the juz's first ayah for 1 to 30, the Juz tab for anything else. Pure.
import { JUZ } from "./quranMeta";
import { juzHref } from "./readerLinks";

export function juzTarget(param: unknown): string {
  const raw = Array.isArray(param) ? param[0] : param;
  if (typeof raw !== "string" || !/^\d{1,2}$/.test(raw)) return "/juz";
  const j = JUZ[Number(raw) - 1];
  return j ? juzHref(j.startSurah, j.startAyah) : "/juz";
}
