// Saved surah audio, for the Downloads page: the queue (DownloadManager) and the list of what is saved, read from Cache Storage. A removal waits
// behind an Undo toast and is carried out when the toast ends or the page is hidden; until then the file is only hidden.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { DownloadManager, type Job } from "~/lib/downloadManager";
import { DOWNLOADS_AUDIO_CACHE, expectedBytes, RECITER_IDS, type SavedAudio } from "~/lib/downloadPlan";
import { reciterName, resolveSurahAudio } from "~/lib/surahAudio";

const REMOVE_AFTER_MS = 6000;
const keyOf = (s: { surah: number; reciterId: string }) => `${s.surah}/${s.reciterId}`;

export const useDownloadsStore = defineStore("downloads", () => {
  const prefs = usePreferencesStore();
  const undo = useUndoToast();
  const jobs = ref<Job[]>([]);
  const saved = ref<SavedAudio[]>([]);
  const hidden = ref<Set<string>>(new Set());
  const ready = ref(false);
  /** Whether this browser can keep files at all (Cache Storage needs a secure page and is missing in some private modes). */
  const supported = ref(true);
  const persisted = ref<boolean | null>(null);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const manager = new DownloadManager(
    {
      fetch: (url, init) => fetch(url, init),
      openCache: () => caches.open(DOWNLOADS_AUDIO_CACHE),
      estimate: async () => (await navigator.storage?.estimate?.()) ?? null,
      resolveUrl: resolveSurahAudio,
      reciterId: (name) => RECITER_IDS[name] ?? null,
      persist: async () => {
        const ok = (await navigator.storage?.persist?.()) ?? false;
        persisted.value = ok;
        return ok;
      },
    },
    () => {
      jobs.value = [...manager.jobs];
      saved.value = [...manager.saved];
    },
  );

  /** The reciter used for new downloads: the one chosen in Settings (the same name the player uses). */
  const reciter = computed(() => reciterName(prefs.prefs.reciter));
  const visibleSaved = computed(() => saved.value.filter((s) => !hidden.value.has(keyOf(s))));
  const active = computed(() => jobs.value.filter((j) => j.status !== "done"));

  async function init() {
    supported.value = typeof caches !== "undefined";
    if (supported.value) await manager.refresh();
    try {
      persisted.value = (await navigator.storage?.persisted?.()) ?? null;
    } catch {
      persisted.value = null;
    }
    ready.value = true;
  }

  const add = (surah: number) => manager.enqueue(surah, reciter.value);
  const retry = (id: string) => manager.retry(id);
  const cancel = (id: string) => manager.cancel(id);
  const proceed = (id: string) => manager.proceed(id);
  const dismiss = (id: string) => manager.dismiss(id);
  const sizeOf = (surah: number, reciterId: string) => expectedBytes(reciterId, surah);

  async function commit(s: SavedAudio) {
    const k = keyOf(s);
    clearTimeout(timers.get(k));
    timers.delete(k);
    await manager.remove(s.surah, s.reciterId);
    hidden.value.delete(k);
    hidden.value = new Set(hidden.value);
  }

  /** Remove with Undo: the file is hidden now and deleted when the toast ends (or the page is hidden). */
  function remove(s: SavedAudio, label: string) {
    const k = keyOf(s);
    hidden.value = new Set(hidden.value).add(k);
    timers.set(k, setTimeout(() => void commit(s), REMOVE_AFTER_MS + 500));
    undo.withUndo(
      `Removed ${label}`,
      () => {
        clearTimeout(timers.get(k));
        timers.delete(k);
        hidden.value.delete(k);
        hidden.value = new Set(hidden.value);
      },
      REMOVE_AFTER_MS,
    );
  }

  /** Carries out removals that are still waiting (the page is being hidden or closed). */
  function flush() {
    for (const s of saved.value) if (hidden.value.has(keyOf(s))) void commit(s);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
    window.addEventListener("pagehide", flush);
  }

  return { jobs, saved, visibleSaved, active, ready, supported, persisted, reciter, init, add, retry, cancel, proceed, dismiss, remove, flush, sizeOf, refresh: () => manager.refresh() };
});
