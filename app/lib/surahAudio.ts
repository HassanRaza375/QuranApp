// Finding a surah's audio file. The legacy data keeps, for each surah, a map of five reciters with a URL each, and the
// app stores only the chosen reciter's NAME (`reciter` key), so the URL is found per surah by that name: one reciter's
// URL for one surah says nothing about another surah. The 171 KB legacy file is loaded only when Play is pressed.
import recitersJson from "@legacy/assets/data/reciters.json";

export interface AudioEntry {
  reciter: string;
  url: string;
  originalUrl?: string;
}
export type AudioMap = Record<string, AudioEntry>;

export const RECITER_NAMES: string[] = (recitersJson as { reciter: string }[]).map((r) => r.reciter);
export const DEFAULT_RECITER = RECITER_NAMES[0]!;

/** The reciter name stored in the `reciter` preference, or the default when none is stored (or it is unknown). */
export function reciterName(stored: Record<string, unknown> | null | undefined): string {
  const n = stored && typeof stored.reciter === "string" ? stored.reciter : "";
  return RECITER_NAMES.includes(n) ? n : DEFAULT_RECITER;
}

/** The URL for `reciter` in one surah's audio map, or null when that surah has no file for them. */
export function audioUrlFor(map: AudioMap | undefined, reciter: string): string | null {
  if (!map) return null;
  const hit = Object.values(map).find((e) => e && e.reciter === reciter && typeof e.url === "string" && e.url);
  return hit ? hit.url : null;
}

let legacy: Promise<{ surahNo: number; audio?: AudioMap }[]> | null = null;
const loadLegacy = () => (legacy ??= import("@legacy/assets/data/surah.json").then((m) => m.default as unknown as { surahNo: number; audio?: AudioMap }[]));

export async function resolveSurahAudio(surahNo: number, reciter: string): Promise<string | null> {
  const all = await loadLegacy();
  return audioUrlFor(all.find((s) => s.surahNo === surahNo)?.audio, reciter);
}
