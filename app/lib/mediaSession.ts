// Media Session (lock screen and notification controls), Phase 4B. The browser object and the metadata constructor are passed in, so this is
// tested with a stub; whether a real lock screen shows the controls is a device check. Handlers: play, pause, seekto, seekbackward,
// seekforward, previoustrack and nexttrack (the last two only where a previous or next surah exists). Metadata is the surah and the reciter.
import { SKIP_SECONDS } from "./audioState";
import type { Snapshot } from "./audioEngine";

export interface MediaSessionLike {
  metadata: unknown;
  playbackState: string;
  setActionHandler(action: string, handler: ((details: { seekTime?: number; seekOffset?: number }) => void) | null): void;
  setPositionState?(state?: { duration: number; position: number; playbackRate: number }): void;
}
export interface SessionControls {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  skip(seconds: number): void;
  next(): void;
  previous(): void;
}

export function bindMediaSession(ms: MediaSessionLike | undefined, Metadata: (new (init: { title: string; artist: string; album: string }) => unknown) | undefined, ctl: SessionControls) {
  if (!ms) return { sync: (_s: Snapshot, _rate: number) => {} };
  const handle = (action: string, fn: ((d: { seekTime?: number; seekOffset?: number }) => void) | null) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* an action this browser does not know is ignored */
    }
  };
  handle("play", () => ctl.play());
  handle("pause", () => ctl.pause());
  handle("seekto", (d) => typeof d.seekTime === "number" && ctl.seekTo(d.seekTime));
  handle("seekbackward", (d) => ctl.skip(-(d.seekOffset ?? SKIP_SECONDS)));
  handle("seekforward", (d) => ctl.skip(d.seekOffset ?? SKIP_SECONDS));

  let shown = "";
  let prevOn: boolean | null = null;
  let nextOn: boolean | null = null;
  let lastPos = -1;
  return {
    sync(s: Snapshot, rate: number): void {
      const t = s.track;
      const key = t ? `${t.surahNo}|${t.reciter}` : "";
      if (key !== shown) {
        shown = key;
        ms.metadata = t && Metadata ? new Metadata({ title: t.title, artist: t.reciter, album: "Quran App" }) : null;
      }
      ms.playbackState = !t ? "none" : s.status === "playing" || s.status === "buffering" || s.status === "loading" ? "playing" : "paused";
      if (s.canPrevious !== prevOn) {
        prevOn = s.canPrevious;
        handle("previoustrack", prevOn ? () => ctl.previous() : null);
      }
      if (s.canNext !== nextOn) {
        nextOn = s.canNext;
        handle("nexttrack", nextOn ? () => ctl.next() : null);
      }
      // the lock screen's scrubber: at most once a second, and only when the length is known
      if (ms.setPositionState && s.duration > 0 && Math.abs(s.position - lastPos) >= 1) {
        lastPos = s.position;
        try {
          ms.setPositionState({ duration: s.duration, position: Math.min(s.position, s.duration), playbackRate: rate });
        } catch {
          /* an invalid state is ignored */
        }
      }
    },
  };
}
