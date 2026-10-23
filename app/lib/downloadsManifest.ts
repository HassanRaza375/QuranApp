// `quran:downloads:v1`: the legacy list of surahs saved on purpose, kept in the legacy shape so the legacy app still reads it after a rollback
// (tests/downloadsParity.test.ts runs the legacy composable against it). An entry means "this surah's TEXT was saved"; the revamp adds optional
// fields the legacy app ignores (`revamp`, `bytes`). Audio is not recorded here as the truth: the files in Cache Storage are.
import { getJSON, setJSON } from "./storage";

export const MANIFEST_KEY = "quran:downloads:v1";

export interface ManifestEntry {
  surahNo: number;
  surahName: string;
  totalAyah: number;
  hasTafsir: boolean;
  reciterKey: string | null;
  reciterName: string | null;
  audioUrl: string | null;
  sizeBytesEstimate: number;
  downloadedAt: number;
  /** 1 once the revamp has checked this entry against its own stores (legacy entries start without it). */
  revamp?: 1;
  bytes?: { text?: number; tafsir?: number; audio?: number };
  [extra: string]: unknown;
}

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** Tolerant: anything that is not a list gives an empty list, and an entry without a real surah number is skipped. Extra fields are kept. */
export function parseManifest(raw: unknown): ManifestEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ManifestEntry[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const n = o.surahNo;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 114) continue;
    out.push({ ...o, surahNo: n, surahName: str(o.surahName) ?? "", totalAyah: num(o.totalAyah), hasTafsir: o.hasTafsir === true, reciterKey: str(o.reciterKey), reciterName: str(o.reciterName), audioUrl: str(o.audioUrl), sizeBytesEstimate: num(o.sizeBytesEstimate), downloadedAt: num(o.downloadedAt) });
  }
  return out.sort((a, b) => a.surahNo - b.surahNo);
}

export const readManifest = (): ManifestEntry[] => parseManifest(getJSON<unknown>(MANIFEST_KEY, []));
export const writeManifest = (list: readonly ManifestEntry[]): boolean => setJSON(MANIFEST_KEY, [...list].sort((a, b) => a.surahNo - b.surahNo));

/** The list with `entry` added or replacing the one for the same surah. */
export const upsertEntry = (list: readonly ManifestEntry[], entry: ManifestEntry): ManifestEntry[] => [...list.filter((e) => e.surahNo !== entry.surahNo), entry].sort((a, b) => a.surahNo - b.surahNo);
export const withoutEntry = (list: readonly ManifestEntry[], surah: number): ManifestEntry[] => list.filter((e) => e.surahNo !== surah);
/** The entry's recorded size: text, tafsir and audio that this app measured. */
export const entryBytes = (e: ManifestEntry): number => (e.bytes?.text ?? 0) + (e.bytes?.tafsir ?? 0) + (e.bytes?.audio ?? 0);
