// The Arabic snippet under a saved ayah. It is NEVER typed in the code: it comes from the device's cache or from one small request.
// Order: the cached chapter (filled by the reader), then the ayah-text store, then (online only) one request for just that ayah,
// which is then stored. A whole surah is never fetched for a snippet.
import type { Chapter } from "./chapter";

export interface SnippetDeps {
  cachedChapter(surah: number): Promise<Chapter | undefined>;
  readAyah(key: string): Promise<string | undefined>;
  writeAyah(key: string, text: string): Promise<void>;
  fetchAyah(surah: number, ayah: number): Promise<unknown>;
}

export type Snippet = { state: "text"; text: string } | { state: "none" } | { state: "failed" };

export const ayahTextKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export async function loadSnippet(surah: number, ayah: number, deps: SnippetDeps, online: boolean): Promise<Snippet> {
  const ch = await deps.cachedChapter(surah).catch(() => undefined);
  const fromChapter = ch?.arabic1?.[ayah - 1];
  if (typeof fromChapter === "string" && fromChapter) return { state: "text", text: fromChapter };
  const key = ayahTextKey(surah, ayah);
  const stored = await deps.readAyah(key).catch(() => undefined);
  if (typeof stored === "string" && stored) return { state: "text", text: stored };
  if (!online) return { state: "none" };
  try {
    const raw = (await deps.fetchAyah(surah, ayah)) as { arabic1?: unknown } | null;
    const text = raw && typeof raw.arabic1 === "string" ? raw.arabic1 : "";
    if (!text) return { state: "failed" };
    await deps.writeAyah(key, text).catch(() => undefined);
    return { state: "text", text };
  } catch {
    return { state: "failed" };
  }
}
