// The player's engine (Phase 4B, generalised in 4C): one audio element and one thing playing at a time. The thing is a whole SURAH (a full file),
// one AYAH, a QUEUE of ayahs (a page, a story chapter) or a CLIP (one recording that is not an ayah, such as an Asma-ul-Husna name). It knows
// nothing about Vue or the browser: the element, storage, timers and the file lookups are passed in, so every rule is unit-tested with a fake
// element (tests/audioEngine.test.ts). The Pinia store (`stores/player.ts`) is a thin mirror of its snapshot.
//
// Rules held here:
//  - NOTHING PLAYS UNTIL A PLAY IS ASKED FOR. `restore()` only reads a saved place and shows it paused; it never creates an element.
//  - A file is found by SURAH or AYAH and RECITER NAME each time, never by a stored URL.
//  - A load that does not produce metadata in LOAD_TIMEOUT_MS becomes an error with Try again; there is no endless spinner.
//  - A queue moves on by itself only because the user started it, preloads exactly one ayah ahead, and has no pause between ayahs. A failed
//    ayah is retried once, then the queue STOPS on it with Try again and Skip: it never skips silently.
//  - The place is saved while playing (every SAVE_EVERY_MS), on pause and when the page is hidden, and reset at the end. A surah saves to the
//    legacy record, a queue to its own additive record; a single ayah and a clip save nothing.
import {
  BLOCKED_NOTE, LAST_SURAH, LOAD_TIMEOUT_MS, PLAY_ERROR, SAVE_EVERY_MS, SKIP_SECONDS, TIMEOUT_ERROR, ayahFailedMessage,
  type NowPlayingRecord, type QueueRecord, type ResumeRecord, type RestoredQueue, type RestoredTrack,
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
export type Kind = "surah" | "ayah" | "queue" | "clip";

export interface AyahRef {
  surah: number;
  ayah: number;
}
export interface QueueInfo {
  id: string;
  label: string;
  /** 0-based position of the current ayah, and how many there are */
  index: number;
  length: number;
}
export interface Track {
  kind: Kind;
  /** the surah of the current file or ayah; 0 for a clip */
  surahNo: number;
  /** the current ayah (ayah and queue kinds); 0 otherwise */
  ayah: number;
  /** the title of the whole thing: the surah's name, "Al-Baqara 2:255", the queue's label, a clip's title */
  title: string;
  /** "" for a clip */
  reciter: string;
  queue: QueueInfo | null;
  clip: { id: string; url: string; subtitle: string } | null;
}
/** What the mini player, the sheet and the lock screen show about the current track. */
export interface View {
  title: string;
  /** the line under the title while playing */
  line: string;
  /** "Recited by <reciter>", or the clip's own line */
  reciterLine: string;
  /** Media Session */
  mediaTitle: string;
  artist: string;
  album: string;
}
export interface Snapshot {
  track: Track | null;
  view: View | null;
  status: Status;
  error: { kind: ErrorKind; message: string; canSkip: boolean } | null;
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

export interface BuiltQueue {
  id: string;
  label: string;
  items: AyahRef[];
}
export interface EngineDeps {
  create(): AudioLike;
  resolve(surah: number, reciter: string): Promise<string | null>;
  /** the url of one ayah's file for one reciter, from the per-ayah endpoint; `fresh` asks again instead of using a remembered answer */
  resolveAyah(surah: number, ayah: number, reciter: string, fresh?: boolean): Promise<string | null>;
  /** fetch a file once so the next switch is instant */
  preload(url: string): void;
  saveData(): boolean;
  surahTitle(surah: number): string;
  ayahCount(surah: number): number;
  readResume(): RestoredTrack | null;
  writeResume(r: ResumeRecord): void;
  readQueue(): RestoredQueue | null;
  writeQueue(r: QueueRecord): void;
  clearQueue(): void;
  /** rebuilds a saved queue from the data (the list is never stored) */
  buildQueue(kind: "page" | "story", ref: RestoredQueue["ref"]): Promise<BuiltQueue | null>;
  readRepeat(): boolean;
  writeRepeat(on: boolean): void;
  autoAdvance(): boolean;
  rate(): number;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(h: unknown): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(h: unknown): void;
  now?(): number;
}

const finite = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);
const keyOf = (t: Track): string => (t.kind === "clip" ? `clip:${t.clip!.id}` : t.kind === "surah" ? `surah:${t.surahNo}|${t.reciter}` : `${t.kind}:${t.surahNo}:${t.ayah}|${t.reciter}|${t.queue?.id ?? ""}`);
const sameTrack = (a: Track | null, b: Track): boolean => !!a && keyOf(a) === keyOf(b);

export class AudioEngine {
  private el: AudioLike | null = null;
  private token = 0;
  private pendingSeek = 0;
  private loaded: Track | null = null; // what the element's src currently is
  private saveTimer: unknown = null;
  private loadTimer: unknown = null;
  private queue: { id: string; label: string; items: AyahRef[]; index: number; kind: "page" | "story"; ref: RestoredQueue["ref"] } | null = null;
  private retried = new Set<string>();
  private preloaded = new Set<string>();
  private snap: Snapshot = { track: null, view: null, status: "idle", error: null, position: 0, duration: 0, repeat: false, seekable: false, canPrevious: false, canNext: false };

  constructor(private deps: EngineDeps, private onChange: (s: Snapshot) => void) {
    this.snap.repeat = deps.readRepeat();
  }

  get snapshot(): Snapshot {
    return this.snap;
  }

  // ---- what the track looks like to the user

  private describe(t: Track): View {
    if (t.kind === "clip") return { title: t.title, line: t.clip!.subtitle, reciterLine: t.clip!.subtitle, mediaTitle: t.title, artist: t.clip!.subtitle, album: "Quran App" };
    const ref = `${this.deps.surahTitle(t.surahNo)} ${t.surahNo}:${t.ayah}`;
    const reciterLine = `Recited by ${t.reciter}`;
    if (t.kind === "ayah") return { title: ref, line: reciterLine, reciterLine, mediaTitle: ref, artist: t.reciter, album: "Quran App" };
    if (t.kind === "queue") {
      const q = t.queue!;
      return { title: q.label, line: `${ref} · ayah ${q.index + 1} of ${q.length}`, reciterLine, mediaTitle: ref, artist: t.reciter, album: q.label };
    }
    return { title: t.title, line: reciterLine, reciterLine, mediaTitle: t.title, artist: t.reciter, album: "Quran App" };
  }

  private set(patch: Partial<Snapshot>): void {
    const next = { ...this.snap, ...patch };
    const t = next.track;
    next.view = t ? this.describe(t) : null;
    if (!t) {
      next.canPrevious = false;
      next.canNext = false;
    } else if (t.kind === "surah") {
      next.canPrevious = t.surahNo > 1;
      next.canNext = t.surahNo < LAST_SURAH;
    } else if (t.kind === "ayah") {
      next.canPrevious = t.ayah > 1;
      next.canNext = t.ayah < this.deps.ayahCount(t.surahNo);
    } else if (t.kind === "queue") {
      next.canPrevious = t.queue!.index > 0;
      next.canNext = t.queue!.index < t.queue!.length - 1;
    } else {
      next.canPrevious = false;
      next.canNext = false;
    }
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
      this.preloadNext();
    });
    el.addEventListener("waiting", () => {
      if (this.snap.status === "playing") this.set({ status: "buffering" });
    });
    el.addEventListener("pause", () => {
      this.stopSaving();
      if (this.loaded && !el.ended) this.save();
      // when a file has ended, `ended()` decides what comes next (a queue must not flicker through "paused")
      if (!el.ended && ["playing", "buffering"].includes(this.snap.status)) this.set({ status: "paused", position: el.currentTime });
    });
    el.addEventListener("ended", () => this.ended());
    // an error event that arrives while the next try is still looking for its file belongs to the previous file, not to this one
    el.addEventListener("error", () => {
      if (this.loaded) this.problem("failed");
    });
    return el;
  }

  // ---- saving the place

  private save(position?: number): void {
    const t = this.loaded ?? this.snap.track;
    if (!t) return;
    const at = position ?? this.el?.currentTime ?? this.snap.position;
    if (t.kind === "surah") {
      const np: NowPlayingRecord = { type: "surah", surahNo: t.surahNo, title: t.title, subtitle: t.reciter, reciter: t.reciter };
      // `url` is only what the legacy record has; the file is always found again by surah and reciter name
      this.deps.writeResume({ url: this.loaded && this.el ? this.el.src : "", position: at, nowPlaying: np });
    } else if (t.kind === "queue" && this.queue) {
      const q = this.queue;
      this.deps.writeQueue({ v: 1, kind: q.kind, ref: q.ref, index: q.index, reciter: t.reciter, position: at, savedAt: (this.deps.now ?? Date.now)() });
    }
    // a single ayah and a clip are short: nothing is saved
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

  private fail(kind: ErrorKind, message: string, canSkip = false): void {
    this.stopLoadTimer();
    this.stopSaving();
    this.set({ status: "error", error: { kind, message, canSkip }, seekable: kind === "blocked" ? this.snap.seekable : false });
  }

  /** Something went wrong with the current file. An ayah of a queue (or a single ayah) is asked for once more before the error is shown. */
  private problem(kind: ErrorKind): void {
    const t = this.snap.track;
    if (!t) return;
    if (kind === "timeout") return this.fail("timeout", TIMEOUT_ERROR, t.kind === "queue");
    if (t.kind === "ayah" || t.kind === "queue") {
      const k = keyOf(t);
      if (!this.retried.has(k)) {
        this.retried.add(k);
        void this.load(t, this.snap.position, true);
        return;
      }
      return this.fail("failed", ayahFailedMessage(t.surahNo, t.ayah), t.kind === "queue");
    }
    this.fail("failed", PLAY_ERROR);
  }

  // ---- finding and loading the file

  private async locate(t: Track, fresh: boolean): Promise<string | null> {
    if (t.kind === "clip") return t.clip!.url;
    if (t.kind === "surah") return this.deps.resolve(t.surahNo, t.reciter);
    return this.deps.resolveAyah(t.surahNo, t.ayah, t.reciter, fresh);
  }

  /** Loads a track from `startAt` seconds and plays it. */
  private async load(t: Track, startAt: number, fresh = false): Promise<void> {
    const el = this.element();
    el.playbackRate = this.deps.rate();
    const mine = ++this.token;
    this.stopSaving();
    this.stopLoadTimer();
    this.pendingSeek = Math.max(0, Math.floor(startAt));
    this.loaded = null;
    this.set({ track: t, status: "loading", error: null, position: this.pendingSeek, duration: 0, seekable: false });
    el.pause();
    this.loadTimer = this.deps.setTimeout(() => {
      if (mine === this.token && this.snap.status === "loading") this.problem("timeout");
    }, LOAD_TIMEOUT_MS);
    const url = await this.locate(t, fresh).catch(() => null);
    if (mine !== this.token) return;
    if (!url) return this.problem("failed");
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
      if (name === "NotAllowedError") return this.fail("blocked", BLOCKED_NOTE, false);
      this.problem("failed");
    }
  }

  /** One ayah ahead only, and not on a connection that asked to save data. */
  private preloadNext(): void {
    const q = this.queue;
    const t = this.snap.track;
    if (!q || !t || t.kind !== "queue" || this.deps.saveData()) return;
    const i = q.index + 1;
    const next = q.items[i];
    if (!next) return;
    const key = `${q.id}:${i}:${t.reciter}`;
    if (this.preloaded.has(key)) return;
    this.preloaded.add(key);
    void this.deps.resolveAyah(next.surah, next.ayah, t.reciter).then((url) => url && this.deps.preload(url)).catch(() => undefined);
  }

  // ---- what the user can ask for

  /** Shows the saved item paused. Never creates an element and never plays. */
  async restore(): Promise<void> {
    if (this.snap.track) return;
    const rq = this.deps.readQueue();
    if (rq) {
      const built = await this.deps.buildQueue(rq.kind, rq.ref).catch(() => null);
      if (this.snap.track) return; // something was started while the data loaded
      if (built && rq.index >= 0 && rq.index < built.items.length) {
        this.queue = { ...built, index: rq.index, kind: rq.kind, ref: rq.ref };
        this.set({ track: this.queueTrack(rq.reciter), status: "restored", position: rq.position, duration: 0, seekable: false });
        return;
      }
    }
    const r = this.deps.readResume();
    if (!r) return;
    this.set({ track: this.surahTrack(r.surahNo, r.title, r.reciter), status: "restored", position: r.position, duration: 0, seekable: false });
  }

  private surahTrack(surahNo: number, title: string, reciter: string): Track {
    return { kind: "surah", surahNo, ayah: 0, title, reciter, queue: null, clip: null };
  }
  private ayahTrack(surah: number, ayah: number, reciter: string): Track {
    return { kind: "ayah", surahNo: surah, ayah, title: `${this.deps.surahTitle(surah)} ${surah}:${ayah}`, reciter, queue: null, clip: null };
  }
  private queueTrack(reciter: string): Track {
    const q = this.queue!;
    const it = q.items[q.index]!;
    return { kind: "queue", surahNo: it.surah, ayah: it.ayah, title: q.label, reciter, queue: { id: q.id, label: q.label, index: q.index, length: q.items.length }, clip: null };
  }

  /** Play one surah by one reciter. The same one already loaded just plays on from where it is. */
  async playSurah(track: { surahNo: number; title: string; reciter: string; startAt?: number }): Promise<void> {
    const t = this.surahTrack(track.surahNo, track.title, track.reciter);
    this.queue = null;
    this.deps.clearQueue(); // the last thing started is what a reload shows
    await this.begin(t, track.startAt);
  }

  /** Play one ayah. */
  async playAyah(a: { surah: number; ayah: number; reciter: string; startAt?: number }): Promise<void> {
    this.queue = null;
    await this.begin(this.ayahTrack(a.surah, a.ayah, a.reciter), a.startAt);
  }

  /** Play a clip: one recording that is not an ayah. */
  async playClip(c: { id: string; title: string; subtitle: string; url: string }): Promise<void> {
    this.queue = null;
    await this.begin({ kind: "clip", surahNo: 0, ayah: 0, title: c.title, reciter: "", queue: null, clip: { id: c.id, url: c.url, subtitle: c.subtitle } }, 0);
  }

  /** Play a queue of ayahs from `startIndex` (a page or a story chapter). It plays on through the list and stops after the last ayah. */
  async playQueue(q: { id: string; label: string; items: AyahRef[]; reciter: string; kind: "page" | "story"; ref: RestoredQueue["ref"]; startIndex?: number; startAt?: number }): Promise<void> {
    if (!q.items.length) return;
    const index = Math.min(Math.max(0, q.startIndex ?? 0), q.items.length - 1);
    this.queue = { id: q.id, label: q.label, items: q.items, index, kind: q.kind, ref: q.ref };
    this.retried.clear();
    this.preloaded.clear();
    await this.begin(this.queueTrack(q.reciter), q.startAt);
  }

  /** Starts a track, or plays on if that very track is already loaded. */
  private async begin(t: Track, startAt?: number): Promise<void> {
    const el = this.element();
    el.playbackRate = this.deps.rate();
    if (sameTrack(this.loaded, t) && el.src && this.snap.status !== "error") {
      if (!el.paused && ["playing", "buffering", "loading"].includes(this.snap.status)) return;
      this.set({ track: t, status: "loading", error: null });
      await this.start(el, ++this.token);
      return;
    }
    await this.load(t, startAt ?? 0);
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
    if (this.snap.status === "error") return this.retry();
    await this.begin(t, this.loaded && sameTrack(this.loaded, t) ? undefined : this.snap.position);
  }

  /** Try again after an error, from the place that was reached. */
  async retry(): Promise<void> {
    const t = this.snap.track;
    if (!t) return;
    this.loaded = null;
    this.retried.delete(keyOf(t)); // a manual retry gets its own automatic second chance
    await this.load(t, this.snap.position, true);
  }

  /** After a failed ayah in a queue: go on to the next one (or end the queue). The user asked for this; it is never done silently. */
  async skipAyah(): Promise<void> {
    const q = this.queue;
    if (!q || this.snap.track?.kind !== "queue") return;
    if (q.index + 1 < q.items.length) await this.goTo(q.index + 1);
    else this.finishQueue();
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

  private async goTo(index: number): Promise<void> {
    const q = this.queue!;
    q.index = index;
    const reciter = this.snap.track!.reciter;
    await this.begin(this.queueTrack(reciter), 0);
  }

  async next(): Promise<void> {
    const t = this.snap.track;
    if (!t) return;
    if (t.kind === "surah" && t.surahNo < LAST_SURAH) await this.playSurah({ surahNo: t.surahNo + 1, title: this.deps.surahTitle(t.surahNo + 1), reciter: t.reciter });
    else if (t.kind === "ayah" && t.ayah < this.deps.ayahCount(t.surahNo)) await this.playAyah({ surah: t.surahNo, ayah: t.ayah + 1, reciter: t.reciter });
    else if (t.kind === "queue" && this.queue && this.queue.index + 1 < this.queue.items.length) await this.goTo(this.queue.index + 1);
  }
  async previous(): Promise<void> {
    const t = this.snap.track;
    if (!t) return;
    if (t.kind === "surah" && t.surahNo > 1) await this.playSurah({ surahNo: t.surahNo - 1, title: this.deps.surahTitle(t.surahNo - 1), reciter: t.reciter });
    else if (t.kind === "ayah" && t.ayah > 1) await this.playAyah({ surah: t.surahNo, ayah: t.ayah - 1, reciter: t.reciter });
    else if (t.kind === "queue" && this.queue && this.queue.index > 0) await this.goTo(this.queue.index - 1);
  }

  setRate(rate: number): void {
    if (this.el) this.el.playbackRate = rate;
  }
  /** Repeat applies to a surah and to a single ayah; a queue and a clip have no repeat. */
  setRepeat(on: boolean): void {
    this.deps.writeRepeat(on);
    this.set({ repeat: on });
  }

  /**
   * Another reciter for the same thing. A surah restarts from the beginning (two reciters' files have different timing, so a place does not
   * carry over); an ayah plays again by the new reciter; a queue goes on from the current ayah with the new reciter. While something is
   * playing the new file plays at once; when paused it only changes what Play will play (never an autoplay). A clip has no reciter.
   */
  async switchReciter(reciter: string): Promise<void> {
    const t = this.snap.track;
    if (!t || t.kind === "clip" || t.reciter === reciter) return;
    const next: Track = { ...t, reciter };
    if (["playing", "buffering", "loading"].includes(this.snap.status)) {
      this.loaded = null;
      return this.load(next, 0);
    }
    this.token++;
    this.loaded = null;
    this.stopSaving();
    this.set({ track: next, status: this.snap.status === "error" ? "error" : "paused", error: null, position: 0, duration: 0, seekable: false });
    this.save(0);
  }

  private finishQueue(): void {
    const q = this.queue;
    if (!q) return;
    q.index = 0;
    const reciter = this.snap.track?.reciter ?? "";
    this.set({ track: this.queueTrack(reciter), status: "paused", position: 0, error: null });
    this.loaded = null;
    this.save(0); // a finished queue is not "where you stopped": it starts from its first ayah
  }

  private ended(): void {
    const el = this.el!;
    this.stopSaving();
    const t = this.snap.track;
    if (!t) return;
    if (t.kind === "queue" && this.queue) {
      if (this.queue.index + 1 < this.queue.items.length) void this.goTo(this.queue.index + 1);
      else this.finishQueue();
      return;
    }
    if (this.snap.repeat && (t.kind === "surah" || t.kind === "ayah")) {
      el.currentTime = 0;
      void this.start(el, this.token);
      return;
    }
    if (t.kind === "surah" && this.deps.autoAdvance() && t.surahNo < LAST_SURAH) {
      void this.next();
      return;
    }
    this.set({ status: "paused", position: 0 });
    if (t.kind === "surah") this.save(0); // a finished surah is not "where you stopped"
  }
}
