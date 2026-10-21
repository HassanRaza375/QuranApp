// The player's engine (Phase 4B): one audio element, one surah at a time, with seeking, speed, repeat, auto-next, resume and honest states.
// It knows nothing about Vue or the browser: the element, the storage, the clock and the file lookup are passed in, so every rule is
// unit-tested with a fake element (tests/audioEngine.test.ts). The Pinia store (`stores/player.ts`) is a thin mirror of its snapshot.
//
// Rules held here:
//  - NOTHING PLAYS UNTIL A PLAY IS ASKED FOR. `restore()` only reads the resume record and shows the item paused; it never creates an element.
//  - A file is found by SURAH and RECITER NAME each time, never by a stored URL.
//  - A load that does not produce metadata in LOAD_TIMEOUT_MS becomes an error with Try again; there is no endless spinner.
//  - The position is saved while playing (every SAVE_EVERY_MS), on pause, when the page is hidden, and reset to 0 at the end of a surah.
import {
  BLOCKED_NOTE, LAST_SURAH, LOAD_TIMEOUT_MS, PLAY_ERROR, SAVE_EVERY_MS, SKIP_SECONDS, TIMEOUT_ERROR,
  type NowPlayingRecord, type ResumeRecord, type RestoredTrack,
} from "./audioState";

export interface AudioLike {
  src: string;
  preload: string;
  playbackRate: number;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended?: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(name: string, fn: () => void): void;
  removeAttribute?(name: string): void;
  load?(): void;
}

export type Status = "idle" | "restored" | "loading" | "playing" | "buffering" | "paused" | "error";
export type ErrorKind = "failed" | "timeout" | "blocked";

export interface Track {
  surahNo: number;
  title: string;
  reciter: string;
}
export interface Snapshot {
  track: Track | null;
  status: Status;
  error: { kind: ErrorKind; message: string } | null;
  /** seconds; while `restored` it is the saved place */
  position: number;
  /** seconds; 0 until the file has said how long it is */
  duration: number;
  repeat: boolean;
  /** metadata has arrived, so the position can be moved */
  seekable: boolean;
  canPrevious: boolean;
  canNext: boolean;
}

export interface EngineDeps {
  create(): AudioLike;
  resolve(surah: number, reciter: string): Promise<string | null>;
  surahTitle(surah: number): string;
  readResume(): RestoredTrack | null;
  writeResume(r: ResumeRecord): void;
  readRepeat(): boolean;
  writeRepeat(on: boolean): void;
  autoAdvance(): boolean;
  rate(): number;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(h: unknown): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(h: unknown): void;
}

const finite = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);
const same = (a: Track | null, b: Track): boolean => !!a && a.surahNo === b.surahNo && a.reciter === b.reciter;

export class AudioEngine {
  private el: AudioLike | null = null;
  private token = 0;
  private pendingSeek = 0;
  private loaded: Track | null = null; // what the element's src currently is
  private saveTimer: unknown = null;
  private loadTimer: unknown = null;
  private snap: Snapshot = { track: null, status: "idle", error: null, position: 0, duration: 0, repeat: false, seekable: false, canPrevious: false, canNext: false };

  constructor(private deps: EngineDeps, private onChange: (s: Snapshot) => void) {
    this.snap.repeat = deps.readRepeat();
  }

  get snapshot(): Snapshot {
    return this.snap;
  }

  private set(patch: Partial<Snapshot>): void {
    const next = { ...this.snap, ...patch };
    const t = next.track;
    next.canPrevious = !!t && t.surahNo > 1;
    next.canNext = !!t && t.surahNo < LAST_SURAH;
    this.snap = next;
    this.onChange(next);
  }

  // ---- the element

  private element(): AudioLike {
    if (this.el) return this.el;
    const el = this.deps.create();
    this.el = el;
    el.preload = "metadata";
    el.addEventListener("loadedmetadata", () => {
      this.stopLoadTimer();
      this.set({ duration: finite(el.duration), seekable: true });
      if (this.pendingSeek > 0) {
        el.currentTime = Math.min(this.pendingSeek, finite(el.duration) || this.pendingSeek);
        this.set({ position: el.currentTime });
      }
      this.pendingSeek = 0;
    });
    el.addEventListener("durationchange", () => this.set({ duration: finite(el.duration) }));
    el.addEventListener("timeupdate", () => {
      if (this.snap.status === "loading" && el.currentTime === 0 && this.pendingSeek > 0) return; // still before the saved place
      this.set({ position: el.currentTime });
    });
    el.addEventListener("playing", () => {
      this.stopLoadTimer();
      this.startSaving();
      this.set({ status: "playing", error: null });
    });
    el.addEventListener("waiting", () => {
      if (this.snap.status === "playing") this.set({ status: "buffering" });
    });
    el.addEventListener("pause", () => {
      this.stopSaving();
      if (this.loaded && !el.ended) this.save();
      if (["playing", "buffering"].includes(this.snap.status)) this.set({ status: "paused", position: el.currentTime });
    });
    el.addEventListener("ended", () => this.ended());
    el.addEventListener("error", () => this.fail("failed", PLAY_ERROR));
    return el;
  }

  // ---- saving the place

  private save(position?: number): void {
    const t = this.loaded ?? this.snap.track;
    if (!t) return;
    const np: NowPlayingRecord = { type: "surah", surahNo: t.surahNo, title: t.title, subtitle: t.reciter, reciter: t.reciter };
    // `url` is only what the legacy record has; the file is always found again by surah and reciter name
    this.deps.writeResume({ url: this.loaded && this.el ? this.el.src : "", position: position ?? this.el?.currentTime ?? this.snap.position, nowPlaying: np });
  }
  /** Saves the place now (the page is being hidden or closed). */
  flush(): void {
    if (this.loaded && ["playing", "buffering", "paused"].includes(this.snap.status)) this.save();
  }
  private startSaving(): void {
    if (this.saveTimer !== null) return;
    this.saveTimer = this.deps.setInterval(() => this.save(), SAVE_EVERY_MS);
  }
  private stopSaving(): void {
    if (this.saveTimer !== null) this.deps.clearInterval(this.saveTimer);
    this.saveTimer = null;
  }
  private stopLoadTimer(): void {
    if (this.loadTimer !== null) this.deps.clearTimeout(this.loadTimer);
    this.loadTimer = null;
  }

  // ---- failing, honestly

  private fail(kind: ErrorKind, message: string): void {
    this.stopLoadTimer();
    this.stopSaving();
    this.set({ status: "error", error: { kind, message }, seekable: kind === "blocked" ? this.snap.seekable : false });
  }

  // ---- what the user can ask for

  /** Shows the saved item paused. Never creates an element and never plays. */
  restore(): void {
    if (this.snap.track) return;
    const r = this.deps.readResume();
    if (!r) return;
    this.set({ track: { surahNo: r.surahNo, title: r.title, reciter: r.reciter }, status: "restored", position: r.position, duration: 0, seekable: false });
  }

  /** Play one surah by one reciter. The same one already loaded just plays on from where it is. */
  async playSurah(track: Track & { startAt?: number }): Promise<void> {
    const t: Track = { surahNo: track.surahNo, title: track.title, reciter: track.reciter };
    const el = this.element();
    el.playbackRate = this.deps.rate();
    if (same(this.loaded, t) && el.src && this.snap.status !== "error") {
      if (!el.paused && ["playing", "buffering", "loading"].includes(this.snap.status)) return;
      this.set({ track: t, status: "loading", error: null });
      await this.start(el, ++this.token);
      return;
    }
    const mine = ++this.token;
    this.stopSaving();
    this.stopLoadTimer();
    this.pendingSeek = Math.max(0, Math.floor(track.startAt ?? 0));
    this.loaded = null;
    this.set({ track: t, status: "loading", error: null, position: this.pendingSeek, duration: 0, seekable: false });
    el.pause();
    this.loadTimer = this.deps.setTimeout(() => {
      if (mine === this.token && this.snap.status === "loading") this.fail("timeout", TIMEOUT_ERROR);
    }, LOAD_TIMEOUT_MS);
    const url = await this.deps.resolve(t.surahNo, t.reciter).catch(() => null);
    if (mine !== this.token) return;
    if (!url) return this.fail("failed", PLAY_ERROR);
    el.src = url;
    this.loaded = t;
    el.playbackRate = this.deps.rate();
    await this.start(el, mine);
  }

  private async start(el: AudioLike, mine: number): Promise<void> {
    try {
      await el.play();
    } catch (e) {
      if (mine !== this.token) return;
      const name = (e as { name?: string } | null)?.name;
      if (name === "AbortError") return; // another load interrupted this one
      if (name === "NotAllowedError") return this.fail("blocked", BLOCKED_NOTE);
      this.fail("failed", PLAY_ERROR);
    }
  }

  pause(): void {
    this.token++; // a load still resolving is cancelled
    this.stopLoadTimer();
    this.el?.pause();
    if (["loading", "playing", "buffering"].includes(this.snap.status)) this.set({ status: this.loaded ? "paused" : "restored", position: this.el?.currentTime ?? this.snap.position });
  }

  /** Play or pause what is shown. Pressing Play on a restored item starts it from the saved place. */
  async toggle(): Promise<void> {
    const t = this.snap.track;
    if (!t) return;
    if (["playing", "buffering", "loading"].includes(this.snap.status)) return this.pause();
    await this.playSurah({ ...t, startAt: this.loaded && same(this.loaded, t) ? undefined : this.snap.position });
  }

  /** Try again after an error, from the place that was reached. */
  async retry(): Promise<void> {
    const t = this.snap.track;
    if (!t) return;
    this.loaded = null;
    await this.playSurah({ ...t, startAt: this.snap.position });
  }

  seek(to: number): void {
    if (!this.el || !this.snap.seekable) return;
    const d = this.snap.duration;
    const x = Math.max(0, d ? Math.min(to, d) : to);
    this.el.currentTime = x;
    this.set({ position: x });
  }
  skip(by: number): void {
    this.seek(this.snap.position + by);
  }
  skipBack = (): void => this.skip(-SKIP_SECONDS);
  skipForward = (): void => this.skip(SKIP_SECONDS);

  async next(): Promise<void> {
    const t = this.snap.track;
    if (t && t.surahNo < LAST_SURAH) await this.playSurah({ surahNo: t.surahNo + 1, title: this.deps.surahTitle(t.surahNo + 1), reciter: t.reciter });
  }
  async previous(): Promise<void> {
    const t = this.snap.track;
    if (t && t.surahNo > 1) await this.playSurah({ surahNo: t.surahNo - 1, title: this.deps.surahTitle(t.surahNo - 1), reciter: t.reciter });
  }

  setRate(rate: number): void {
    if (this.el) this.el.playbackRate = rate;
  }
  setRepeat(on: boolean): void {
    this.deps.writeRepeat(on);
    this.set({ repeat: on });
  }

  /**
   * Another reciter for the same surah. It always starts from the beginning (two reciters' files have different timing, so a place does not
   * carry over). While something is playing the new file plays at once; when paused it only changes what Play will play (never an autoplay).
   */
  async switchReciter(reciter: string): Promise<void> {
    const t = this.snap.track;
    if (!t || t.reciter === reciter) return;
    const next: Track = { ...t, reciter };
    if (["playing", "buffering", "loading"].includes(this.snap.status)) return this.playSurah({ ...next, startAt: 0 });
    this.token++;
    this.loaded = null;
    this.stopSaving();
    this.set({ track: next, status: this.snap.status === "error" ? "error" : "paused", error: null, position: 0, duration: 0, seekable: false });
    this.save(0);
  }

  private ended(): void {
    const el = this.el!;
    this.stopSaving();
    if (this.snap.repeat) {
      el.currentTime = 0;
      void this.start(el, this.token);
      return;
    }
    const t = this.snap.track;
    if (this.deps.autoAdvance() && t && t.surahNo < LAST_SURAH) {
      void this.next();
      return;
    }
    this.set({ status: "paused", position: 0 });
    this.save(0); // a finished surah is not "where you stopped"
  }
}
