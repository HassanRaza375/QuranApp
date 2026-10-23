// Saved surahs (text, tafsir, audio), for the Downloads page, the Surah audios page and the player sheet: the queue (DownloadManager) and the
// list of what is really on the device. A removal waits behind an Undo toast and is carried out when the toast ends or the page is hidden; until
// then the surah is only hidden. Starting reads only local stores (no network), and only when something was ever saved.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { textDeps } from "~/composables/useQuranText";
import { cachedKeys, CHAPTERS, deleteCached, putCached, TAFSIRS } from "~/db/revampDb";
import type { Chapter } from "~/lib/chapter";
import { connectionKnown, readNet, type NavLike } from "~/lib/connection";
import { adoptLegacy, needsAdoption } from "~/lib/downloadAdopt";
import { DownloadManager, type Job } from "~/lib/downloadManager";
import { DOWNLOADS_AUDIO_CACHE, expectedBytes, RECITER_IDS, TAFSIR_BYTES_PER_AYAH, TEXT_BYTES_PER_AYAH } from "~/lib/downloadPlan";
import { threadFills, type SavedRow } from "~/lib/downloadRows";
import { readManifest, writeManifest } from "~/lib/downloadsManifest";
import { loadChapter, loadTafsir } from "~/lib/quranText";
import { AYAH_COUNTS } from "~/lib/quranMeta";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { reciterName, resolveSurahAudio } from "~/lib/surahAudio";

const REMOVE_AFTER_MS = 6000;
const bytesOf = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;
const nav = () => (typeof navigator === "undefined" ? undefined : (navigator as unknown as NavLike));

export const useDownloadsStore = defineStore("downloads", () => {
  const prefs = usePreferencesStore();
  const undo = useUndoToast();
  const config = useRuntimeConfig();
  const jobs = ref<Job[]>([]);
  const rows = ref<SavedRow[]>([]);
  const audioFiles = ref(0);
  const hidden = ref<Set<number>>(new Set());
  const ready = ref(false);
  const supported = ref(true);
  const persisted = ref<boolean | null>(null);
  const online = ref(true);
  const cellular = ref(false);
  const knowsConnection = ref(false);
  const usage = ref<{ used: number; quota: number } | null>(null);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  const manager = new DownloadManager(
    {
      fetch: (url, init) => fetch(url, init),
      hasCache: async () => typeof caches !== "undefined" && (await caches.has(DOWNLOADS_AUDIO_CACHE)),
      openCache: () => caches.open(DOWNLOADS_AUDIO_CACHE),
      estimate: async () => (await navigator.storage?.estimate?.()) ?? null,
      resolveUrl: resolveSurahAudio,
      reciterId: (name) => RECITER_IDS[name] ?? null,
      persist: async () => {
        const ok = (await navigator.storage?.persist?.()) ?? false;
        persisted.value = ok;
        return ok;
      },
      net: () => readNet(nav()),
      wifiOnly: () => prefs.prefs.wifiOnly,
      // one tab downloads at a time; where Web Locks do not exist this simply runs
      lock: (fn) => (typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request("quran-downloads", fn) : fn()),
      device: {
        chapterKeys: async () => (await cachedKeys(CHAPTERS)).map(Number),
        tafsirKeys: async () => (await cachedKeys(TAFSIRS)).map(String),
        deleteChapter: (n) => deleteCached(CHAPTERS, [n]),
        deleteTafsirs: (n, total) =>
          deleteCached(
            TAFSIRS,
            Array.from({ length: total }, (_, i) => `${n}_${i + 1}`),
          ),
      },
      text: {
        chapter: async (n) => bytesOf((await loadChapter(n, textDeps)).value),
        tafsir: async (s, a) => bytesOf((await loadTafsir(s, a, textDeps)).value),
      },
      manifest: { read: readManifest, write: (l) => void writeManifest(l) },
      surahInfo: (n) => ({ name: SURAH_ROWS[n - 1]!.name, arLong: SURAH_ROWS[n - 1]!.arLong }),
    },
    () => {
      jobs.value = [...manager.jobs];
      rows.value = manager.rows();
      audioFiles.value = manager.saved.filter((s) => !s.opaque).length;
    },
  );

  /** The reciter used for new downloads from this page: the one chosen in Settings (the same name the player uses). */
  const reciter = computed(() => reciterName(prefs.prefs.reciter));
  const reciterId = computed(() => RECITER_IDS[reciter.value]!);
  const visibleRows = computed(() => rows.value.filter((r) => !hidden.value.has(r.surah)));
  const active = computed(() => jobs.value.filter((j) => j.status !== "done"));
  const fills = computed(() => threadFills(visibleRows.value));
  const savedBytes = computed(() => {
    let audio = 0;
    let text = 0;
    for (const r of visibleRows.value) {
      for (const a of r.audio) if (a.state === "saved") audio += expectedBytes(a.reciterId, r.surah) ?? 0;
      text += r.bytes - r.audio.reduce((n, a) => n + (a.state === "saved" ? (expectedBytes(a.reciterId, r.surah) ?? 0) : 0), 0);
    }
    return { audio, text };
  });

  async function readUsage() {
    try {
      const e = await navigator.storage?.estimate?.();
      usage.value = e && typeof e.usage === "number" ? { used: e.usage, quota: e.quota ?? 0 } : null;
    } catch {
      usage.value = null;
    }
  }

  function watchConnection() {
    const read = () => {
      const n = readNet(nav());
      online.value = n.online;
      cellular.value = n.cellular;
      manager.networkChanged();
    };
    knowsConnection.value = connectionKnown(nav());
    online.value = readNet(nav()).online;
    cellular.value = readNet(nav()).cellular;
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    (navigator as unknown as { connection?: EventTarget }).connection?.addEventListener?.("change", read);
  }

  let started: Promise<void> | null = null;
  /** Reads what is on the device and, once, adopts legacy downloads. Local reads only. Does nothing when nothing was ever saved. */
  function start(): Promise<void> {
    started ??= (async () => {
      supported.value = typeof caches !== "undefined";
      watchConnection();
      const anything = readManifest().length > 0 || (supported.value && (await caches.has(DOWNLOADS_AUDIO_CACHE)));
      if (anything) {
        await manager.refresh();
        if (needsAdoption(manager.manifest)) {
          const have = new Set((await cachedKeys(TAFSIRS)).map(String));
          const list = await adoptLegacy(manager.manifest, {
            apiBase: String(config.public.quranApiBase),
            cached: async (url) => {
              const hit = await caches.match(url);
              return hit ? await hit.clone().json() : undefined;
            },
            hasChapter: (n) => manager.chapters.has(n),
            hasTafsir: (s, a) => have.has(`${s}_${a}`),
            putChapter: (n, c: Chapter) => putCached(CHAPTERS, n, c),
            putTafsir: (k, e) => putCached(TAFSIRS, k, e),
          });
          manager.setManifest(list);
          await manager.refresh();
        }
      }
      try {
        persisted.value = (await navigator.storage?.persisted?.()) ?? null;
      } catch {
        persisted.value = null;
      }
      await readUsage();
      ready.value = true;
    })();
    return started;
  }

  // ---- adding
  const reciterFor = (name?: string) => name ?? reciter.value;
  /** `audio`: true saves the audio of the Settings reciter (or `name`). */
  const addSurah = (surah: number, include: { text?: boolean; tafsir?: boolean; audio?: boolean }, name?: string) => manager.enqueue(surah, { text: include.text ?? true, tafsir: include.tafsir ?? false, audio: include.audio ? reciterFor(name) : null });
  async function addMany(surahs: number[], include: { tafsir: boolean; audio: boolean }) {
    for (const s of surahs) await addSurah(s, { text: true, tafsir: include.tafsir, audio: include.audio });
  }
  const addAllText = () => manager.enqueueAllText();
  /** One reciter's audio only (the player sheet and the Surah audios page). */
  const addAudio = (surah: number, name: string) => manager.enqueue(surah, { text: false, tafsir: false, audio: name });

  /** Rough size of a set of surahs with the chosen parts, in bytes (audio exact; text and tafsir averages). Parts already saved are not counted. */
  function estimate(surahs: number[], include: { tafsir: boolean; audio: boolean }, name?: string): number {
    const id = RECITER_IDS[reciterFor(name)]!;
    let total = 0;
    for (const s of surahs) {
      const row = rows.value.find((r) => r.surah === s);
      const ay = AYAH_COUNTS[s - 1] ?? 0;
      if (row?.text !== "saved") total += ay * TEXT_BYTES_PER_AYAH;
      if (include.tafsir && row?.tafsir !== "saved") total += ay * TAFSIR_BYTES_PER_AYAH;
      if (include.audio && !row?.audio.some((a) => a.reciterId === id && a.state === "saved")) total += expectedBytes(id, s) ?? 0;
    }
    return total;
  }

  const isAudioSaved = (surah: number, id: string) => rows.value.some((r) => r.surah === surah && r.audio.some((a) => a.reciterId === id && a.state === "saved") && !hidden.value.has(surah));
  const hasOlderAudio = (surah: number, id: string) => rows.value.some((r) => r.surah === surah && r.audio.some((a) => a.reciterId === id && a.state === "older"));
  const audioJob = (surah: number, id: string) => active.value.find((j) => j.kind === "surah" && j.surah === surah && j.reciterId === id);

  // ---- removing, with Undo
  async function commit(surah: number) {
    clearTimeout(timers.get(surah));
    timers.delete(surah);
    await manager.removeSurah(surah);
    hidden.value.delete(surah);
    hidden.value = new Set(hidden.value);
    void readUsage();
  }
  /** Remove with Undo: the surah is hidden now and everything saved for it is deleted when the toast ends (or the page is hidden). */
  function removeSurah(surah: number, label: string) {
    hidden.value = new Set(hidden.value).add(surah);
    timers.set(surah, setTimeout(() => void commit(surah), REMOVE_AFTER_MS + 500));
    undo.withUndo(
      `Removed ${label}`,
      () => {
        clearTimeout(timers.get(surah));
        timers.delete(surah);
        hidden.value.delete(surah);
        hidden.value = new Set(hidden.value);
      },
      REMOVE_AFTER_MS,
    );
  }
  /** One reciter's audio only, with Undo (the Surah audios page). */
  function removeAudio(surah: number, id: string, label: string) {
    const key = surah * 1000 + Number(id);
    hidden.value = new Set(hidden.value).add(key);
    timers.set(key, setTimeout(() => void commitAudio(surah, id, key), REMOVE_AFTER_MS + 500));
    undo.withUndo(
      `Removed ${label}`,
      () => {
        clearTimeout(timers.get(key));
        timers.delete(key);
        hidden.value.delete(key);
        hidden.value = new Set(hidden.value);
      },
      REMOVE_AFTER_MS,
    );
  }
  async function commitAudio(surah: number, id: string, key: number) {
    clearTimeout(timers.get(key));
    timers.delete(key);
    await manager.removeAudio(surah, id);
    hidden.value.delete(key);
    hidden.value = new Set(hidden.value);
    void readUsage();
  }
  const audioHidden = (surah: number, id: string) => hidden.value.has(surah * 1000 + Number(id)) || hidden.value.has(surah);

  /** Carries out removals that are still waiting (the page is being hidden or closed). */
  function flush() {
    for (const k of [...hidden.value]) {
      if (k > 114) void commitAudio(Math.floor(k / 1000), String(k % 1000), k);
      else void commit(k);
    }
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
    window.addEventListener("pagehide", flush);
  }

  /** The browsing cache (pages and audio that were only streamed) can be cleared without touching anything saved. */
  async function clearBrowsingCache() {
    try {
      await caches.delete("quran-api-cache");
      await caches.delete("quran-audio-cache");
    } catch {
      /* best effort */
    }
    await readUsage();
    undo.info("Cleared the browsing cache. What you saved is untouched.");
  }

  return {
    jobs, rows, visibleRows, active, fills, savedBytes, audioFiles, ready, supported, persisted, online, cellular, knowsConnection, usage, reciter, reciterId,
    start, readUsage, addSurah, addMany, addAllText, addAudio, estimate, isAudioSaved, hasOlderAudio, audioJob, audioHidden,
    retry: (id: string) => manager.retry(id),
    cancel: (id: string) => manager.cancel(id),
    cancelAll: () => manager.cancelAll(),
    proceed: (id: string) => manager.proceed(id),
    dismiss: (id: string) => manager.dismiss(id),
    removeSurah, removeAudio, flush, clearBrowsingCache,
    refresh: () => manager.refresh(),
  };
});
