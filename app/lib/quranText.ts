// Loading a surah and an ayah's tafsir: the revamp's own cache first (quran-revamp-db), then the network, then the cache is
// filled. The dependencies are passed in so the order and the failure cases are unit-tested without a browser.
// Never load-bearing: a cache that fails is a cache miss.
import { ChapterError, parseChapter, parseTafsir, type Chapter, type TafsirEntry } from "./chapter";

export interface TextDeps {
  readChapter(n: number): Promise<unknown | undefined>;
  writeChapter(n: number, chapter: Chapter): Promise<void>;
  fetchChapter(n: number): Promise<unknown>;
  readTafsir(key: string): Promise<unknown | undefined>;
  writeTafsir(key: string, entries: TafsirEntry[]): Promise<void>;
  fetchTafsir(surah: number, ayah: number): Promise<unknown>;
}

export interface Loaded<T> {
  value: T;
  from: "cache" | "network";
}

const httpStatus = (e: unknown): number | undefined => {
  const x = e as { statusCode?: number; status?: number; response?: { status?: number } } | null;
  return x?.statusCode ?? x?.status ?? x?.response?.status;
};

/** A failed request becomes "missing" (a 404) or "unavailable" (no answer: offline, a timeout, a server error). */
const asLoadError = (e: unknown, what: string): ChapterError => {
  if (e instanceof ChapterError) return e;
  return httpStatus(e) === 404 ? new ChapterError(`${what} was not found`, "missing") : new ChapterError(`${what} could not be loaded`, "unavailable");
};

export async function loadChapter(n: number, deps: TextDeps): Promise<Loaded<Chapter>> {
  const stored = await deps.readChapter(n).catch(() => undefined);
  if (stored !== undefined) {
    try {
      return { value: parseChapter(stored, n), from: "cache" };
    } catch {
      /* a damaged record is treated as a miss and replaced below */
    }
  }
  let chapter: Chapter;
  try {
    chapter = parseChapter(await deps.fetchChapter(n), n);
  } catch (e) {
    throw asLoadError(e, `Surah ${n}`);
  }
  await deps.writeChapter(n, chapter).catch(() => undefined);
  return { value: chapter, from: "network" };
}

export async function loadTafsir(surah: number, ayah: number, deps: TextDeps): Promise<Loaded<TafsirEntry[]>> {
  const key = `${surah}_${ayah}`;
  const stored = await deps.readTafsir(key).catch(() => undefined);
  if (stored !== undefined) {
    try {
      return { value: parseTafsir({ tafsirs: stored }), from: "cache" };
    } catch {
      /* damaged: fetch again */
    }
  }
  let entries: TafsirEntry[];
  try {
    entries = parseTafsir(await deps.fetchTafsir(surah, ayah));
  } catch (e) {
    throw asLoadError(e, `The tafsir of ${surah}:${ayah}`);
  }
  await deps.writeTafsir(key, entries).catch(() => undefined);
  return { value: entries, from: "network" };
}
