// Legacy downloads at cutover. The legacy app kept a downloaded surah's text and tafsir in ITS database (`quran-app-db`, which the revamp must
// not open) and, through the service worker, in `quran-api-cache`. The same responses are normally still in that cache, so on first start the
// revamp copies what it finds there into the reader's own store: no network, nothing invented. Whatever is not found stays "Not saved" with an
// Add button. Every entry is marked checked (`revamp: 1`) so this never runs twice.
import { parseChapter, parseTafsir, type Chapter, type TafsirEntry } from "./chapter";
import type { ManifestEntry } from "./downloadsManifest";

export interface AdoptDeps {
  /** The cached JSON for an API url, or undefined. Reads Cache Storage only. */
  cached(url: string): Promise<unknown | undefined>;
  hasChapter(n: number): boolean;
  hasTafsir(surah: number, ayah: number): boolean;
  putChapter(n: number, chapter: Chapter): Promise<void>;
  putTafsir(key: string, entries: TafsirEntry[]): Promise<void>;
  apiBase: string;
}

export const needsAdoption = (list: readonly ManifestEntry[]): boolean => list.some((e) => e.revamp !== 1);

export async function adoptLegacy(list: readonly ManifestEntry[], deps: AdoptDeps): Promise<ManifestEntry[]> {
  const out: ManifestEntry[] = [];
  for (const e of list) {
    if (e.revamp === 1) {
      out.push(e);
      continue;
    }
    if (!deps.hasChapter(e.surahNo)) {
      try {
        const raw = await deps.cached(`${deps.apiBase}/${e.surahNo}.json`);
        if (raw !== undefined) await deps.putChapter(e.surahNo, parseChapter(raw, e.surahNo));
      } catch {
        /* not found or damaged: stays "Not saved" */
      }
    }
    if (e.hasTafsir) {
      for (let a = 1; a <= e.totalAyah; a++) {
        if (deps.hasTafsir(e.surahNo, a)) continue;
        try {
          const raw = await deps.cached(`${deps.apiBase}/tafsir/${e.surahNo}_${a}.json`);
          if (raw !== undefined) await deps.putTafsir(`${e.surahNo}_${a}`, parseTafsir(raw));
        } catch {
          /* leave it */
        }
      }
    }
    out.push({ ...e, revamp: 1 });
  }
  return out;
}
