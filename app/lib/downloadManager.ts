// The download queue. A job saves some parts of a surah (its text, its tafsir, one reciter's audio) or the text of the whole Qur'an. One job runs at
// a time, in the order asked. What is SAVED is always read from the device itself (Cache Storage for audio, the reader's store for text and
// tafsir) and compared with the list of what was saved on purpose, so the Saved list can never claim something that is not there. A stopped or
// failed job leaves nothing half-saved (audio is all-or-nothing; a tafsir part counts only when every ayah is stored) and shows "Failed · Retry";
// there is no resume. Text and tafsir wait for a connection; audio also waits for Wi-Fi when the user asked for that and the browser says the
// connection is mobile data. Browser pieces are passed in so all of this is unit-tested.
import type { Net } from "./connection";
import { downloadAudioFile } from "./audioDownload";
import { DownloadError, expectedBytes, formatBytes, savedFromKeys, spaceCheck, TAFSIR_BYTES_PER_AYAH, TEXT_BYTES_PER_AYAH, type SavedAudio } from "./downloadPlan";
import { buildRows, type SavedRow } from "./downloadRows";
import { entryBytes, upsertEntry, withoutEntry, type ManifestEntry } from "./downloadsManifest";
import { AYAH_COUNTS } from "./quranMeta";

export type JobStatus = "waiting" | "offline" | "wifi" | "space" | "downloading" | "failed" | "done";
export type Step = "text" | "tafsir" | "audio";
/** What to save. `audio` is a reciter's name. Tafsir needs the text, so asking for it asks for both. */
export interface Want {
  text: boolean;
  tafsir: boolean;
  audio: string | null;
}
export interface Job {
  id: string;
  kind: "surah" | "text-all";
  /** 0 for the whole-Qur'an text job */
  surah: number;
  want: Want;
  reciterId: string | null;
  url: string;
  /** exact bytes of the audio file */
  expected: number;
  status: JobStatus;
  step: Step | null;
  /** progress in bytes (estimates for text and tafsir, real for audio), out of `total` */
  done: number;
  total: number;
  audioDone: number;
  /** "Tafsir 48 of 286", "Surah 37 of 114" */
  detail: string | null;
  message: string | null;
  /** The user chose to go on after the space warning. */
  go?: boolean;
}

export interface CacheLike {
  put(key: string, r: Response): Promise<void>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<readonly { url: string }[]>;
  match(key: string): Promise<Response | undefined>;
}
export interface ManagerDeps {
  fetch(url: string, init: RequestInit): Promise<Response>;
  /** Whether the downloads cache exists (asking never creates it). */
  hasCache(): Promise<boolean>;
  openCache(): Promise<CacheLike>;
  estimate(): Promise<{ usage?: number; quota?: number } | null>;
  /** The app's audio URL for a surah and a reciter's name, or null when there is none. */
  resolveUrl(surah: number, reciter: string): Promise<string | null>;
  reciterId(reciter: string): string | null;
  /** Asks the browser to keep this site's storage; called once, after the first audio file is saved. */
  persist?(): Promise<boolean>;
  net(): Net;
  wifiOnly(): boolean;
  /** Runs `fn` so that only one tab downloads at a time. */
  lock?<T>(fn: () => Promise<T>): Promise<T>;
  sleep?(ms: number): Promise<void>;
  device: {
    chapterKeys(): Promise<number[]>;
    tafsirKeys(): Promise<string[]>;
    deleteChapter(n: number): Promise<void>;
    deleteTafsirs(n: number, total: number): Promise<void>;
  };
  text: {
    /** Loads a surah's text (the reader's cache first, then the network), keeps it in the reader's store, returns its size in bytes. */
    chapter(n: number): Promise<number>;
    tafsir(surah: number, ayah: number): Promise<number>;
  };
  manifest: { read(): ManifestEntry[]; write(list: ManifestEntry[]): void };
  surahInfo(n: number): { name: string; arLong: string };
  now?(): number;
}

const TAFSIR_WORKERS = 6;
const TEXT_ALL_WORKERS = 3;
const RETRIES = 3;

const spaceLine = (needed: number, free: number | null) => `Needs about ${formatBytes(needed)}${free === null ? "" : `; about ${formatBytes(free)} free`}. It may not fit.`;
const emptyWant: Want = { text: false, tafsir: false, audio: null };

export class DownloadManager {
  jobs: Job[] = [];
  saved: SavedAudio[] = [];
  manifest: ManifestEntry[] = [];
  chapters = new Set<number>();
  tafsirCount = new Map<number, number>();
  private running: { id: string; abort: AbortController } | null = null;
  private asked = false;
  private seq = 0;

  constructor(
    private deps: ManagerDeps,
    private onChange: () => void,
  ) {}

  private changed() {
    this.onChange();
  }
  private now() {
    return this.deps.now ? this.deps.now() : Date.now();
  }
  private sleep(ms: number) {
    return this.deps.sleep ? this.deps.sleep(ms) : new Promise<void>((r) => setTimeout(r, ms));
  }

  /** Reads what is really on the device. */
  async refresh(): Promise<void> {
    this.manifest = this.deps.manifest.read();
    try {
      if (await this.deps.hasCache()) {
        const cache = await this.deps.openCache();
        const found = savedFromKeys((await cache.keys()).map((r) => r.url));
        this.saved = await Promise.all(found.map(async (s) => ({ ...s, opaque: (await cache.match(s.url).catch(() => undefined))?.type === "opaque" })));
      } else this.saved = [];
    } catch {
      this.saved = []; // Cache Storage unavailable (private mode): nothing can be saved, nothing is claimed
    }
    try {
      // The reader's store is opened only when something was saved on purpose. With an empty list there is nothing to compare, and opening it would
      // re-create the database that Clear all data has just deleted.
      if (!this.manifest.length) {
        this.chapters = new Set();
        this.tafsirCount = new Map();
        this.changed();
        return;
      }
      this.chapters = new Set(await this.deps.device.chapterKeys());
      const counts = new Map<number, number>();
      for (const k of await this.deps.device.tafsirKeys()) {
        const n = Number(String(k).split("_")[0]);
        if (Number.isInteger(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
      }
      this.tafsirCount = counts;
    } catch {
      this.chapters = new Set();
      this.tafsirCount = new Map();
    }
    this.changed();
  }

  rows(): SavedRow[] {
    return buildRows(this.manifest, this.saved, { chapters: this.chapters, tafsirCount: this.tafsirCount }, (id, s) => expectedBytes(id, s));
  }
  /** A playable copy is saved (an opaque legacy copy does not count). */
  isSaved(surah: number, reciterId: string): boolean {
    return this.saved.some((s) => s.surah === surah && s.reciterId === reciterId && !s.opaque);
  }
  private textSaved(n: number) {
    return this.chapters.has(n) && this.manifest.some((e) => e.surahNo === n);
  }
  private tafsirSaved(n: number) {
    return (this.tafsirCount.get(n) ?? 0) >= (AYAH_COUNTS[n - 1] ?? Infinity) && !!this.manifest.find((e) => e.surahNo === n)?.hasTafsir;
  }
  private needs(job: Job): Want & { any: boolean } {
    if (job.kind === "text-all") {
      const text = Array.from({ length: 114 }, (_, i) => i + 1).some((n) => !this.textSaved(n));
      return { text, tafsir: false, audio: null, any: text };
    }
    const text = job.want.text && !this.textSaved(job.surah);
    const tafsir = job.want.tafsir && !this.tafsirSaved(job.surah);
    const audio = job.want.audio && job.reciterId && !this.isSaved(job.surah, job.reciterId) ? job.want.audio : null;
    return { text, tafsir, audio, any: text || tafsir || !!audio };
  }

  /** Active (not finished) job for the same surah with the same wishes, if any. */
  private duplicate(surah: number, want: Want, kind: Job["kind"]): Job | undefined {
    return this.jobs.find((j) => j.kind === kind && j.surah === surah && j.status !== "done" && j.want.text === want.text && j.want.tafsir === want.tafsir && j.want.audio === want.audio);
  }

  /** Adds a surah (some parts of it) to the queue. Returns the job, or null when everything asked for is already saved or already queued. */
  async enqueue(surah: number, want: Want): Promise<Job | null> {
    const w: Want = { text: want.text || want.tafsir, tafsir: want.tafsir, audio: want.audio };
    if (this.duplicate(surah, w, "surah")) return null;
    const reciterId = w.audio ? this.deps.reciterId(w.audio) : null;
    const url = w.audio && reciterId ? await this.deps.resolveUrl(surah, w.audio).catch(() => null) : null;
    const expected = reciterId ? (expectedBytes(reciterId, surah) ?? 0) : 0;
    const job: Job = { id: `d${++this.seq}`, kind: "surah", surah, want: w, reciterId, url: url ?? "", expected, status: "waiting", step: null, done: 0, total: 0, audioDone: 0, detail: null, message: null };
    const need = this.needs(job);
    if (!need.any) return null;
    const ayahs = AYAH_COUNTS[surah - 1] ?? 0;
    job.total = (need.text ? ayahs * TEXT_BYTES_PER_AYAH : 0) + (need.tafsir ? ayahs * TAFSIR_BYTES_PER_AYAH : 0) + (need.audio ? expected : 0);
    if (w.audio && (!url || !expected)) {
      job.status = "failed";
      job.message = "This recording is not available to save.";
    }
    this.jobs = [...this.jobs, job];
    this.changed();
    void this.pump();
    return job;
  }

  /** The text of the whole Qur'an as one job. */
  async enqueueAllText(): Promise<Job | null> {
    if (this.duplicate(0, { ...emptyWant, text: true }, "text-all")) return null;
    const job: Job = { id: `d${++this.seq}`, kind: "text-all", surah: 0, want: { ...emptyWant, text: true }, reciterId: null, url: "", expected: 0, status: "waiting", step: "text", done: 0, total: 114, audioDone: 0, detail: null, message: null };
    if (!this.needs(job).any) return null;
    this.jobs = [...this.jobs, job];
    this.changed();
    void this.pump();
    return job;
  }

  private patch(id: string, p: Partial<Job>) {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...p } : j));
    this.changed();
  }
  private job(id: string) {
    return this.jobs.find((j) => j.id === id)!;
  }

  private async pump(): Promise<void> {
    if (this.running) return;
    const job = this.jobs.find((j) => j.status === "waiting");
    if (!job) return;
    const abort = new AbortController();
    this.running = { id: job.id, abort };
    try {
      const run = () => this.execute(job.id, abort.signal);
      await (this.deps.lock ? this.deps.lock(run) : run());
    } catch (e) {
      const err = e instanceof DownloadError ? e : new DownloadError("network", "The download failed.");
      if (err.kind === "aborted") this.jobs = this.jobs.filter((j) => j.id !== job.id);
      else this.patch(job.id, { status: "failed", message: err.message });
      this.changed();
    } finally {
      await this.refresh().catch(() => undefined); // what a stopped, parked or failed job did save is real, and shows
      if (this.running?.id === job.id) this.running = null;
      void this.pump();
    }
  }

  private checkAbort(signal: AbortSignal) {
    if (signal.aborted) throw new DownloadError("aborted", "Stopped.");
  }

  private async execute(id: string, signal: AbortSignal): Promise<void> {
    await this.refresh();
    const job = this.job(id);
    const need = this.needs(job);
    if (!need.any) return void this.patch(id, { status: "done", done: job.total });
    const net = this.deps.net();
    if (!net.online) return void this.patch(id, { status: "offline", message: null });

    // room for everything this job still needs, before a byte is fetched
    const ayahs = AYAH_COUNTS[job.surah - 1] ?? 0;
    const bytesNeeded = job.kind === "text-all" ? 114 * 60_000 : (need.text ? ayahs * TEXT_BYTES_PER_AYAH : 0) + (need.tafsir ? ayahs * TAFSIR_BYTES_PER_AYAH : 0) + (need.audio ? job.expected : 0);
    const space = spaceCheck(bytesNeeded, await this.deps.estimate().catch(() => null));
    if (!space.enough && !job.go) return void this.patch(id, { status: "space", message: spaceLine(bytesNeeded, space.free) });

    this.patch(id, { status: "downloading", message: null, detail: null });
    if (job.kind === "text-all") return this.saveAllText(id, signal);
    const info = this.deps.surahInfo(job.surah);
    let base = 0;

    if (need.text) {
      this.patch(id, { step: "text", detail: "Text" });
      let bytes: number;
      try {
        bytes = await this.deps.text.chapter(job.surah);
      } catch {
        throw new DownloadError("network", `The text of ${info.name} could not be loaded.`);
      }
      this.checkAbort(signal);
      this.setEntry(job.surah, (e) => ({ ...e, bytes: { ...e.bytes, text: bytes } }));
      base += ayahs * TEXT_BYTES_PER_AYAH;
      this.patch(id, { done: base });
    }

    if (need.tafsir) {
      this.patch(id, { step: "tafsir" });
      let saved = 0;
      let bytes = 0;
      let next = 1;
      let failed = 0;
      const worker = async () => {
        while (next <= ayahs && !signal.aborted) {
          const a = next++;
          let ok = false;
          for (let attempt = 1; attempt <= RETRIES && !ok && !signal.aborted; attempt++) {
            try {
              const got = await this.deps.text.tafsir(job.surah, a); // (not `bytes += await ...`: the workers run side by side)
              bytes += got;
              ok = true;
            } catch {
              if (attempt < RETRIES) await this.sleep(500 * attempt * attempt);
            }
          }
          if (ok) saved++;
          else failed++;
          this.patch(id, { done: base + saved * TAFSIR_BYTES_PER_AYAH, detail: `Tafsir ${saved + failed} of ${ayahs}` });
        }
      };
      await Promise.all(Array.from({ length: Math.min(TAFSIR_WORKERS, ayahs) }, worker));
      this.checkAbort(signal);
      if (failed > 0) throw new DownloadError("network", `Tafsir: ${saved} of ${ayahs} saved. Try again.`);
      this.setEntry(job.surah, (e) => ({ ...e, hasTafsir: true, bytes: { ...e.bytes, tafsir: bytes } }));
      base += ayahs * TAFSIR_BYTES_PER_AYAH;
      this.patch(id, { done: base });
    }

    if (need.audio) {
      const net2 = this.deps.net();
      if (this.deps.wifiOnly() && net2.cellular) {
        await this.refresh(); // the text and tafsir saved so far show as soon as the audio is parked
        return void this.patch(id, { status: "wifi", message: null, step: "audio", detail: null });
      }
      this.patch(id, { step: "audio", detail: null });
      const cache = await this.deps.openCache();
      await downloadAudioFile(
        { url: job.url, expected: job.expected, signal, onProgress: (d) => this.patch(id, { audioDone: d, done: base + d }) },
        { fetch: this.deps.fetch, cache },
      );
      this.setEntry(job.surah, (e) => ({ ...e, reciterKey: job.reciterId, reciterName: job.want.audio, audioUrl: job.url, bytes: { ...e.bytes, audio: job.expected } }), false);
      if (!this.asked) {
        this.asked = true;
        void this.deps.persist?.().catch(() => false); // the user's own Download press; the browser decides
      }
    }
    this.patch(id, { status: "done", done: job.total, step: null, detail: null });
    await this.refresh();
  }

  /** Creates or updates the surah's entry in the list of what was saved on purpose. `create` false: only update an existing one (audio-only surahs have no entry). */
  private setEntry(surah: number, fn: (e: ManifestEntry) => ManifestEntry, create = true) {
    const existing = this.manifest.find((e) => e.surahNo === surah);
    if (!existing && !create) return;
    const info = this.deps.surahInfo(surah);
    const base: ManifestEntry = existing ?? { surahNo: surah, surahName: info.arLong || info.name, totalAyah: AYAH_COUNTS[surah - 1] ?? 0, hasTafsir: false, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 0, downloadedAt: this.now(), revamp: 1, bytes: {} };
    const next = fn({ ...base, revamp: 1 });
    next.sizeBytesEstimate = entryBytes(next);
    this.manifest = upsertEntry(this.manifest, next);
    this.deps.manifest.write(this.manifest);
    this.chapters = new Set(this.chapters).add(surah);
  }

  private async saveAllText(id: string, signal: AbortSignal): Promise<void> {
    let next = 1;
    let done = 0;
    let failed = 0;
    const worker = async () => {
      while (next <= 114 && !signal.aborted) {
        const n = next++;
        if (this.textSaved(n)) {
          done++;
          continue;
        }
        let ok = false;
        for (let attempt = 1; attempt <= RETRIES && !ok && !signal.aborted; attempt++) {
          try {
            const bytes = await this.deps.text.chapter(n);
            this.setEntry(n, (e) => ({ ...e, bytes: { ...e.bytes, text: bytes } }));
            ok = true;
          } catch {
            if (attempt < RETRIES) await this.sleep(500 * attempt * attempt);
          }
        }
        if (ok) done++;
        else failed++;
        this.patch(id, { done, detail: `Surah ${done + failed} of 114` });
      }
    };
    await Promise.all(Array.from({ length: TEXT_ALL_WORKERS }, worker));
    this.checkAbort(signal);
    if (failed > 0) throw new DownloadError("network", `Text: ${done} of 114 surahs saved. Try again.`);
    this.patch(id, { status: "done", done: 114, detail: null, step: null });
    await this.refresh();
  }

  /** The connection changed: jobs that were waiting for it, or for Wi-Fi, are looked at again. */
  networkChanged() {
    let any = false;
    this.jobs = this.jobs.map((j) => {
      if (j.status === "offline" || j.status === "wifi") {
        any = true;
        return { ...j, status: "waiting" as const };
      }
      return j;
    });
    if (any) {
      this.changed();
      void this.pump();
    }
  }

  /** The user chose to go on although the space check said it may not fit. */
  proceed(id: string) {
    if (this.job(id)?.status !== "space") return;
    this.patch(id, { status: "waiting", message: null, go: true });
    void this.pump();
  }
  retry(id: string) {
    const j = this.job(id);
    if (j?.status !== "failed" || (j.want.audio && (!j.url || !j.expected))) return;
    this.patch(id, { status: "waiting", done: 0, audioDone: 0, message: null });
    void this.pump();
  }
  /** Stops a job and forgets it. A download in progress is aborted and what was half-way is discarded (audio) or kept as the reader's cache (text). */
  cancel(id: string) {
    if (this.running?.id === id) {
      this.running.abort.abort();
      return;
    }
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.changed();
  }
  cancelAll() {
    for (const j of [...this.jobs]) if (j.status !== "done") this.cancel(j.id);
  }
  dismiss(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.changed();
  }

  /** Deletes everything saved for a surah: its audio (every reciter), its text and tafsir in the reader's store, and its entry. (The page waits behind Undo.) */
  async removeSurah(surah: number): Promise<void> {
    try {
      if (await this.deps.hasCache()) {
        const cache = await this.deps.openCache();
        for (const s of this.saved.filter((x) => x.surah === surah)) await cache.delete(s.url);
      }
    } catch {
      /* best effort; refresh shows the truth */
    }
    const e = this.manifest.find((m) => m.surahNo === surah);
    if (e) {
      await this.deps.device.deleteChapter(surah).catch(() => undefined);
      await this.deps.device.deleteTafsirs(surah, AYAH_COUNTS[surah - 1] ?? 0).catch(() => undefined);
      this.manifest = withoutEntry(this.manifest, surah);
      this.deps.manifest.write(this.manifest);
    }
    await this.refresh();
  }

  /** Deletes one reciter's audio for a surah (the /surah-audios page). */
  async removeAudio(surah: number, reciterId: string): Promise<void> {
    const hit = this.saved.find((s) => s.surah === surah && s.reciterId === reciterId);
    if (!hit) return;
    try {
      await (await this.deps.openCache()).delete(hit.url);
    } catch {
      /* best effort */
    }
    await this.refresh();
  }

  /** Records that the manifest changed elsewhere (adoption at start). */
  setManifest(list: ManifestEntry[]) {
    this.manifest = list;
    this.deps.manifest.write(list);
    this.changed();
  }
}
