export interface DownloadedSurah {
  surahNo: number;
  surahName: string;
  totalAyah: number;
  hasTafsir: boolean;
  reciterKey: string | null;
  reciterName: string | null;
  audioUrl: string | null;
  sizeBytesEstimate: number;
  downloadedAt: number;
}

const MANIFEST_KEY = "quran:downloads:v1";
const TAFSIR_CONCURRENCY = 6;
// Separate from the service worker's own opportunistic `quran-audio-cache`
// (Pass 1/10) so "clear temporary cache" can wipe that one without also
// deleting audio the user explicitly downloaded.
const DOWNLOADS_AUDIO_CACHE = "quran-downloads-audio-cache";

export const useDownloads = () => {
  const manifest = useState<DownloadedSurah[]>("downloads-manifest", () => []);
  const downloadingSurah = useState<number | null>("downloads-active-surah", () => null);
  const downloadProgress = useState<{ done: number; total: number }>("downloads-progress", () => ({
    done: 0,
    total: 0,
  }));
  const downloadError = useState<string | null>("downloads-error", () => null);

  const getStorage = () => useNuxtApp().$storage;

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    manifest.value = $storage.get(MANIFEST_KEY, []);
  };

  const persist = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    $storage.set(MANIFEST_KEY, manifest.value);
  };

  const isDownloaded = (surahNo: number) => manifest.value.some((d) => d.surahNo === surahNo);
  const getDownload = (surahNo: number) => manifest.value.find((d) => d.surahNo === surahNo) ?? null;

  const estimateUsage = async (): Promise<number> => {
    if (!import.meta.client || !navigator.storage?.estimate) return 0;
    try {
      const { usage } = await navigator.storage.estimate();
      return usage ?? 0;
    } catch {
      return 0;
    }
  };

  const estimateQuota = async (): Promise<{ usage: number; quota: number }> => {
    if (!import.meta.client || !navigator.storage?.estimate) return { usage: 0, quota: 0 };
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage ?? 0, quota: quota ?? 0 };
    } catch {
      return { usage: 0, quota: 0 };
    }
  };

  /**
   * Explicitly makes a surah available offline: text + all translations
   * (one chapter fetch already returns every language), optionally full
   * tafsir for every ayah, optionally one reciter's audio. Never throws —
   * failures are surfaced via `downloadError`, reading elsewhere is never
   * blocked by a failed download.
   */
  const downloadSurah = async (
    surahNo: number,
    opts: { includeTafsir?: boolean; reciterKey?: string | null } = {}
  ) => {
    if (downloadingSurah.value) return;
    downloadingSurah.value = surahNo;
    downloadError.value = null;
    downloadProgress.value = { done: 0, total: 0 };

    const usageBefore = await estimateUsage();

    try {
      const { getChapter } = useChapters();
      const chapter = await getChapter(surahNo);
      if (!chapter) throw new Error("Could not load this surah's text.");

      let reciterName: string | null = null;
      let audioUrl: string | null = null;
      if (opts.reciterKey && chapter.audio?.[opts.reciterKey]) {
        const candidateUrl = chapter.audio[opts.reciterKey].url;
        try {
          if (import.meta.client && "caches" in window) {
            // `no-cors`, not the default `cache.add()` (cors) mode: some
            // audio hosts (e.g. a github.com/.../raw/ URL redirecting to
            // raw.githubusercontent.com) send a broken empty
            // Access-Control-Allow-Origin on the *redirect* response,
            // which fails a cors fetch outright even though the final
            // destination is properly CORS-enabled. An opaque no-cors
            // response can still be cached and played back via <audio>,
            // it just can't be read by JS — which this never needs to do.
            const response = await fetch(candidateUrl, { mode: "no-cors" });
            const cache = await caches.open(DOWNLOADS_AUDIO_CACHE);
            await cache.put(candidateUrl, response);
            reciterName = chapter.audio[opts.reciterKey].reciter;
            audioUrl = candidateUrl;
          }
        } catch {
          // Audio caching failing shouldn't block the rest of the download,
          // and the manifest should only claim audio was included if it
          // genuinely was — reciterName/audioUrl stay null on failure.
        }
      }

      if (opts.includeTafsir) {
        const { getTafsir } = useTafsir();
        const total = chapter.totalAyah || 0;
        downloadProgress.value = { done: 0, total };

        let next = 1;
        const worker = async () => {
          while (next <= total) {
            const ayah = next++;
            try {
              await getTafsir(surahNo, ayah);
            } catch {
              // skip a failed ayah rather than aborting the whole download
            }
            downloadProgress.value = { done: downloadProgress.value.done + 1, total };
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(TAFSIR_CONCURRENCY, total) }, worker)
        );
      }

      const usageAfter = await estimateUsage();

      const entry: DownloadedSurah = {
        surahNo,
        surahName: chapter.surahNameArabicLong || chapter.surahName,
        totalAyah: chapter.totalAyah || 0,
        hasTafsir: !!opts.includeTafsir,
        reciterKey: opts.reciterKey || null,
        reciterName,
        audioUrl,
        sizeBytesEstimate: Math.max(0, usageAfter - usageBefore),
        downloadedAt: Date.now(),
      };

      manifest.value = [...manifest.value.filter((d) => d.surahNo !== surahNo), entry].sort(
        (a, b) => a.surahNo - b.surahNo
      );
      persist();
    } catch (e: any) {
      downloadError.value = e?.message || "Download failed. Please try again.";
    } finally {
      downloadingSurah.value = null;
    }
  };

  const removeDownload = async (surahNo: number) => {
    const entry = getDownload(surahNo);
    if (!entry) return;

    const { deleteChapter, deleteTafsirsForSurah } = useQuranDB();
    await deleteChapter(surahNo);
    if (entry.hasTafsir && entry.totalAyah) {
      await deleteTafsirsForSurah(surahNo, entry.totalAyah);
    }
    if (entry.audioUrl && import.meta.client && "caches" in window) {
      try {
        const cache = await caches.open(DOWNLOADS_AUDIO_CACHE);
        await cache.delete(entry.audioUrl);
      } catch {
        // best-effort
      }
    }

    manifest.value = manifest.value.filter((d) => d.surahNo !== surahNo);
    persist();
  };

  /** Clears the app's opportunistic HTTP cache (Pass 1/10) — content that
   * will just get re-fetched next time it's needed — without touching
   * anything explicitly downloaded via this module. */
  const clearTemporaryCache = async () => {
    if (!import.meta.client || !("caches" in window)) return;
    try {
      await caches.delete("quran-api-cache");
      await caches.delete("quran-audio-cache");
    } catch {
      // best-effort
    }
  };

  return {
    manifest,
    downloadingSurah,
    downloadProgress,
    downloadError,
    load,
    isDownloaded,
    getDownload,
    estimateUsage,
    estimateQuota,
    downloadSurah,
    removeDownload,
    clearTemporaryCache,
  };
};
