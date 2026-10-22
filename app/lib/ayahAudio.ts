// Finding one ayah's recording (Phase 4C). The per-ayah endpoint (`quranapi.pages.dev/api/<surah>/<ayah>.json`) answers with an `audio` object, one
// entry per reciter, each with the file's `url`. The URL is TAKEN FROM THAT ANSWER, matched by the reciter's NAME (as for surahs), never built
// from a pattern. The answer is small and the service worker already caches that host; remembered here only for the current visit.
import { audioUrlFor, type AudioMap } from "./surahAudio";

/** The reciter's url in one ayah's answer, or null when the answer has none for them. */
export function ayahAudioUrl(answer: unknown, reciter: string): string | null {
  const map = (answer as { audio?: AudioMap } | null)?.audio;
  return audioUrlFor(map && typeof map === "object" ? map : undefined, reciter);
}

export type AyahResolver = (surah: number, ayah: number, reciter: string, fresh?: boolean) => Promise<string | null>;

/** A resolver over any "fetch this ayah's answer" function. An answer without a file, or a failed request, is not remembered. */
export function makeAyahResolver(fetchAnswer: (surah: number, ayah: number) => Promise<unknown>): AyahResolver {
  const memo = new Map<string, string>();
  return async (surah, ayah, reciter, fresh = false) => {
    const key = `${surah}:${ayah}|${reciter}`;
    if (!fresh && memo.has(key)) return memo.get(key)!;
    const url = ayahAudioUrl(await fetchAnswer(surah, ayah), reciter);
    if (url) memo.set(key, url);
    return url;
  };
}
