// The reader's text: surahs and tafsir, cache first (quran-revamp-db), then the network. The rules and the failure cases live in
// `lib/quranText.ts` (unit-tested); this only wires the real cache and the real services in.
import { CHAPTERS, getCached, putCached, TAFSIRS } from "~/db/revampDb";
import type { Chapter, TafsirEntry } from "~/lib/chapter";
import { loadChapter, loadTafsir, type Loaded, type TextDeps } from "~/lib/quranText";
import { ChaptersService } from "~/services/chapters.service";
import { TafsirService } from "~/services/tafsir.service";

const deps: TextDeps = {
  readChapter: (n) => getCached(CHAPTERS, n),
  writeChapter: (n, c) => putCached(CHAPTERS, n, c),
  fetchChapter: (n) => ChaptersService.getChapterByNumber(n),
  readTafsir: (key) => getCached(TAFSIRS, key),
  writeTafsir: (key, e) => putCached(TAFSIRS, key, e),
  fetchTafsir: (s, a) => TafsirService.getTafsirByAyah(s, a),
};

// Within one visit a surah or an ayah's tafsir is not asked for twice, and two callers asking at once share one request.
const chapters = new Map<number, Promise<Loaded<Chapter>>>();
const tafsirs = new Map<string, Promise<Loaded<TafsirEntry[]>>>();

const shared = <K, V>(map: Map<K, Promise<V>>, key: K, make: () => Promise<V>): Promise<V> => {
  let p = map.get(key);
  if (!p) {
    p = make();
    map.set(key, p);
    p.catch(() => map.delete(key)); // a failure is not remembered: Retry asks again
  }
  return p;
};

export const useQuranText = () => ({
  getChapter: (n: number) => shared(chapters, n, () => loadChapter(n, deps)),
  getTafsir: (surah: number, ayah: number) => shared(tafsirs, `${surah}_${ayah}`, () => loadTafsir(surah, ayah, deps)),
});
