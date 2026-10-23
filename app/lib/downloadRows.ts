// The Saved list: one row per surah that has anything saved, and for each part what is true NOW. A part the list says was saved but the device
// no longer holds (the browser cleared it, or Clear all data removed the reader's store) is "missing" and is shown as "Not saved" with a one-tap
// repair; a part that is only in the browser's reading cache, without the user having saved it, is not a row at all. Pure.
import type { SavedAudio } from "./downloadPlan";
import type { ManifestEntry } from "./downloadsManifest";
import { AYAH_COUNTS } from "./quranMeta";

export type PartState = "saved" | "missing" | "none";
export interface AudioPart {
  reciterId: string;
  /** "older": saved by the legacy app as an opaque copy that cannot be played from the device. */
  state: "saved" | "older";
}
export interface SavedRow {
  surah: number;
  text: PartState;
  tafsir: PartState;
  audio: AudioPart[];
  bytes: number;
}
export interface DeviceState {
  /** surah numbers whose chapter text is in the reader's store */
  chapters: ReadonlySet<number>;
  /** how many ayahs of each surah have their tafsir stored */
  tafsirCount: ReadonlyMap<number, number>;
}

export function buildRows(manifest: readonly ManifestEntry[], audio: readonly SavedAudio[], device: DeviceState, audioBytes: (reciterId: string, surah: number) => number | null): SavedRow[] {
  const surahs = new Set<number>([...manifest.map((e) => e.surahNo), ...audio.map((a) => a.surah)]);
  const rows: SavedRow[] = [];
  for (const surah of [...surahs].sort((a, b) => a - b)) {
    const e = manifest.find((m) => m.surahNo === surah);
    const total = AYAH_COUNTS[surah - 1] ?? 0;
    const text: PartState = e ? (device.chapters.has(surah) ? "saved" : "missing") : "none";
    const tafsir: PartState = e?.hasTafsir ? ((device.tafsirCount.get(surah) ?? 0) >= total && total > 0 ? "saved" : "missing") : "none";
    const files = audio.filter((a) => a.surah === surah);
    const parts: AudioPart[] = files.map((a) => ({ reciterId: a.reciterId, state: a.opaque ? "older" : "saved" }));
    let bytes = 0;
    if (e) bytes += (text === "saved" ? (e.bytes?.text ?? 0) : 0) + (tafsir === "saved" ? (e.bytes?.tafsir ?? 0) : 0);
    for (const f of files) if (!f.opaque) bytes += audioBytes(f.reciterId, surah) ?? 0;
    rows.push({ surah, text, tafsir, audio: parts, bytes });
  }
  return rows;
}

/** [first, last] position in the Qur'an of every surah that has anything saved, for the thread. */
export function threadFills(rows: readonly SavedRow[]): [number, number][] {
  let start = 1;
  const starts = AYAH_COUNTS.map((c) => {
    const s = start;
    start += c;
    return [s, s + c - 1] as [number, number];
  });
  return rows.map((r) => starts[r.surah - 1]!);
}
