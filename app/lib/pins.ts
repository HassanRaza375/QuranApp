// "Pin as where I stopped": `quran:pins:v1` = { v: 1, reading: { surahNo, ayahNo, pinnedAt } | null }. One reading pin (the
// study pin arrives with Prophets & People, Phase 7). Additive: the legacy app ignores it; the Library shows it (Phase 6). Pure.
import { isAyah } from "./quranMeta";
import { getJSON, setJSON } from "./storage";

export const PINS_KEY = "quran:pins:v1";

export interface ReadingPin {
  surahNo: number;
  ayahNo: number;
  pinnedAt: number;
}

const readRecord = (): Record<string, unknown> => {
  const v = getJSON<unknown>(PINS_KEY, null);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
};

export function readReadingPin(): ReadingPin | null {
  const p = readRecord().reading as Partial<ReadingPin> | null | undefined;
  if (!p || typeof p !== "object" || typeof p.surahNo !== "number" || typeof p.ayahNo !== "number" || !isAyah(p.surahNo, p.ayahNo)) return null;
  return { surahNo: p.surahNo, ayahNo: p.ayahNo, pinnedAt: typeof p.pinnedAt === "number" ? p.pinnedAt : 0 };
}

/** Pins an ayah (replacing any earlier pin) or clears the pin with null. Other fields in the record are kept. */
export function writeReadingPin(pin: ReadingPin | null): boolean {
  return setJSON(PINS_KEY, { ...readRecord(), v: 1, reading: pin });
}

/** The page pin (written by the page reader, Phase 9). Nothing sets it yet; the Library shows "Not set" until then. */
export interface PagePin {
  pageNo: number;
  pinnedAt: number;
}

export function readPagePin(): PagePin | null {
  const p = readRecord().page as Partial<PagePin> | null | undefined;
  if (!p || typeof p !== "object" || typeof p.pageNo !== "number" || !Number.isInteger(p.pageNo) || p.pageNo < 1 || p.pageNo > 604) return null;
  return { pageNo: p.pageNo, pinnedAt: typeof p.pinnedAt === "number" ? p.pinnedAt : 0 };
}

/** Sets or clears the page pin. Every other field of the record (the reading pin, unknown fields) is kept. */
export function writePagePin(pin: PagePin | null): boolean {
  return setJSON(PINS_KEY, { ...readRecord(), v: 1, page: pin });
}
