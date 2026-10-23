// The download queue for whole-surah audio: one file at a time, in the order asked. It owns what is in progress; what is SAVED is always read
// from the cache's own keys (`refresh`), never remembered separately, so the list can't disagree with the files. A stopped or failed download
// leaves nothing behind (see audioDownload.ts) and shows "Failed · Retry"; there is no resume. Browser pieces are passed in for tests.
import { downloadAudioFile } from "./audioDownload";
import { DownloadError, expectedBytes, formatBytes, savedFromKeys, spaceCheck, type SavedAudio } from "./downloadPlan";

export type JobStatus = "waiting" | "space" | "downloading" | "failed" | "done";
export interface Job {
  id: string;
  surah: number;
  reciterId: string;
  reciter: string;
  url: string;
  expected: number;
  status: JobStatus;
  done: number;
  /** Why it failed, or the "not enough space" line while status is "space". */
  message: string | null;
  /** The user chose to go on after the space warning. */
  go?: boolean;
}

export interface ManagerDeps {
  fetch(url: string, init: RequestInit): Promise<Response>;
  openCache(): Promise<{ put(key: string, r: Response): Promise<void>; delete(key: string): Promise<boolean>; keys(): Promise<readonly { url: string }[]> }>;
  estimate(): Promise<{ usage?: number; quota?: number } | null>;
  /** The app's audio URL for a surah and a reciter's name, or null when there is none. */
  resolveUrl(surah: number, reciter: string): Promise<string | null>;
  reciterId(reciter: string): string | null;
  /** Asks the browser to keep this site's storage; called once, after the first file is saved. */
  persist?(): Promise<boolean>;
}

const spaceLine = (needed: number, free: number | null) => `Needs about ${formatBytes(needed)}${free === null ? "" : `; about ${formatBytes(free)} free`}. It may not fit.`;

export class DownloadManager {
  jobs: Job[] = [];
  saved: SavedAudio[] = [];
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

  /** Reads what is really saved. A job for a file that is now saved is finished; a missing file is simply not in the list. */
  async refresh(): Promise<void> {
    try {
      const cache = await this.deps.openCache();
      this.saved = savedFromKeys((await cache.keys()).map((r) => r.url));
    } catch {
      this.saved = []; // Cache Storage unavailable (private mode): nothing can be saved, nothing is claimed
    }
    this.changed();
  }

  isSaved(surah: number, reciterId: string): boolean {
    return this.saved.some((s) => s.surah === surah && s.reciterId === reciterId);
  }
  jobFor(surah: number, reciterId: string): Job | undefined {
    return this.jobs.find((j) => j.surah === surah && j.reciterId === reciterId && j.status !== "done");
  }

  /** Adds a surah by a reciter to the queue. Returns the job, or null when it is already saved or already queued. */
  async enqueue(surah: number, reciter: string): Promise<Job | null> {
    const reciterId = this.deps.reciterId(reciter);
    if (!reciterId || this.isSaved(surah, reciterId) || this.jobFor(surah, reciterId)) return null;
    const expected = expectedBytes(reciterId, surah);
    const url = await this.deps.resolveUrl(surah, reciter);
    const job: Job = { id: `d${++this.seq}`, surah, reciterId, reciter, url: url ?? "", expected: expected ?? 0, status: "waiting", done: 0, message: null };
    if (!url || !expected) {
      job.status = "failed";
      job.message = "This recording is not available to save.";
    }
    this.jobs = [...this.jobs, job];
    this.changed();
    void this.pump();
    return job;
  }

  private patch(id: string, p: Partial<Job>) {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...p } : j));
    this.changed();
  }

  /** Starts the next waiting job if none is running. */
  private async pump(): Promise<void> {
    if (this.running) return;
    const job = this.jobs.find((j) => j.status === "waiting");
    if (!job) return;
    const abort = new AbortController();
    this.running = { id: job.id, abort };
    try {
      const space = spaceCheck(job.expected, await this.deps.estimate().catch(() => null));
      if (!space.enough && !job.go) {
        this.patch(job.id, { status: "space", message: spaceLine(job.expected, space.free) });
        return;
      }
      this.patch(job.id, { status: "downloading", done: 0, message: null });
      const cache = await this.deps.openCache();
      await downloadAudioFile(
        { url: job.url, expected: job.expected, signal: abort.signal, onProgress: (done) => this.patch(job.id, { done }) },
        { fetch: this.deps.fetch, cache },
      );
      this.patch(job.id, { status: "done", done: job.expected });
      await this.refresh();
      if (!this.asked) {
        this.asked = true;
        void this.deps.persist?.().catch(() => false); // the user's own Download press; the browser decides
      }
    } catch (e) {
      const err = e instanceof DownloadError ? e : new DownloadError("network", "The download failed.");
      if (err.kind === "aborted") this.jobs = this.jobs.filter((j) => j.id !== job.id);
      else this.patch(job.id, { status: "failed", message: err.kind === "quota" ? spaceLine(job.expected, null) : err.message });
      this.changed();
    } finally {
      if (this.running?.id === job.id) this.running = null;
      void this.pump();
    }
  }

  /** The user chose to go on although the space check said it may not fit. */
  proceed(id: string) {
    const j = this.jobs.find((x) => x.id === id);
    if (j?.status !== "space") return;
    this.patch(id, { status: "waiting", message: null, go: true });
    void this.pump();
  }
  retry(id: string) {
    const j = this.jobs.find((x) => x.id === id);
    if (j?.status !== "failed" || !j.url || !j.expected) return;
    this.patch(id, { status: "waiting", done: 0, message: null });
    void this.pump();
  }
  /** Stops a job and forgets it. A download in progress is aborted and its partial file is discarded by the download itself. */
  cancel(id: string) {
    if (this.running?.id === id) {
      this.running.abort.abort();
      return;
    }
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.changed();
  }
  /** Finished jobs are shown briefly then dropped; the saved list is the record. */
  dismiss(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.changed();
  }

  /** Deletes a saved file. (The page defers this behind an Undo toast.) */
  async remove(surah: number, reciterId: string): Promise<void> {
    const hit = this.saved.find((s) => s.surah === surah && s.reciterId === reciterId);
    if (!hit) return;
    try {
      await (await this.deps.openCache()).delete(hit.url);
    } catch {
      /* best effort; refresh shows the truth */
    }
    await this.refresh();
  }
}
