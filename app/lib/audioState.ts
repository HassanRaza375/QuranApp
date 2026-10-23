// The full player's shared pieces (Phase 4B): the two storage keys in their LEGACY shapes, the resume record, time wording, the speeds, and
// the words of ours. Pure. `quran:audio-prefs:v1` = { playbackRate, repeatOne, autoAdvance } and `quran:audio-resume:v1` = { url, position,
// nowPlaying: { type, surahNo, title, subtitle } } exactly as the legacy composable writes them (tests/audioLegacy.test.ts runs the legacy
// code beside this one). Additions are only extra fields: `nowPlaying.reciter`.
import { getJSON, remove, setJSON } from "./storage";
import { DEFAULT_RECITER, RECITER_NAMES } from "./surahAudio";

export const AUDIO_PREFS_KEY = "quran:audio-prefs:v1";
export const AUDIO_RESUME_KEY = "quran:audio-resume:v1";
export const LAST_SURAH = 114;
export const SKIP_SECONDS = 10;
export const SAVE_EVERY_MS = 5000;
/** A file that has not produced metadata after this long is reported, never left spinning. */
export const LOAD_TIMEOUT_MS = 30000;
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export const isCustomSpeed = (rate: number): boolean => !SPEEDS.some((s) => Math.abs(s - rate) < 1e-9);

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// ---- the audio preferences (the legacy triple; the player writes all three so the legacy parser sees exactly what it wrote itself)

export interface AudioPrefsRecord {
  playbackRate: number;
  repeatOne: boolean;
  autoAdvance: boolean;
}
export function readAudioPrefs(): AudioPrefsRecord {
  const v = getJSON<unknown>(AUDIO_PREFS_KEY, null);
  const o = isObject(v) ? v : {};
  return { playbackRate: typeof o.playbackRate === "number" && Number.isFinite(o.playbackRate) ? o.playbackRate : 1, repeatOne: !!o.repeatOne, autoAdvance: !!o.autoAdvance };
}
/** Writes the triple back (current values plus the change), keeping any other field in the record. */
export function writeAudioPrefs(change: Partial<AudioPrefsRecord>): void {
  const v = getJSON<unknown>(AUDIO_PREFS_KEY, null);
  setJSON(AUDIO_PREFS_KEY, { ...(isObject(v) ? v : {}), ...readAudioPrefs(), ...change });
}

// ---- the resume record

export interface NowPlayingRecord {
  type: "surah";
  surahNo: number;
  title: string;
  /** the legacy writes the reciter's name here; kept the same */
  subtitle: string;
  /** additive: the reciter by name, so the file is found by name for the surah, never by a stored URL */
  reciter: string;
}
export interface ResumeRecord {
  url: string;
  position: number;
  nowPlaying: NowPlayingRecord;
}

export const isSurahNo = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= LAST_SURAH;

export interface RestoredTrack {
  surahNo: number;
  title: string;
  reciter: string;
  position: number;
}
/**
 * What a stored record can resume: a SURAH (the legacy also stored ayah and name tracks, which this player does not play). The reciter is
 * the additive `reciter`, else the legacy `subtitle` when it is a known reciter, else the default; the position is a whole number of seconds
 * of at least 0. Anything damaged gives null, never an error.
 */
export function restoredTrack(raw: unknown): RestoredTrack | null {
  if (!isObject(raw) || !isObject(raw.nowPlaying)) return null;
  const np = raw.nowPlaying;
  if (np.type !== "surah" || !isSurahNo(np.surahNo) || typeof np.title !== "string" || !np.title) return null;
  const position = typeof raw.position === "number" && Number.isFinite(raw.position) && raw.position > 0 ? Math.floor(raw.position) : 0;
  const reciter = typeof np.reciter === "string" && RECITER_NAMES.includes(np.reciter) ? np.reciter : typeof np.subtitle === "string" && RECITER_NAMES.includes(np.subtitle) ? np.subtitle : DEFAULT_RECITER;
  return { surahNo: np.surahNo, title: np.title, reciter, position };
}
export const readResume = (): RestoredTrack | null => restoredTrack(getJSON<unknown>(AUDIO_RESUME_KEY, null));
export const writeResume = (rec: ResumeRecord): void => void setJSON(AUDIO_RESUME_KEY, { ...rec, position: Math.max(0, rec.position) });

// ---- time

/** "12:34" or "1:02:03", the legacy mini player's format. */
export function clock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
const unit = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
/** "1 minute 20 seconds", for the slider's spoken value. */
export function spokenTime(sec: number): string {
  const s = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const parts = [h ? unit(h, "hour") : "", m ? unit(m, "minute") : "", r || (!h && !m) ? unit(r, "second") : ""].filter(Boolean);
  return parts.join(" ");
}
/** "1 minute 20 seconds of 6 minutes". */
export const spokenPosition = (pos: number, dur: number): string => `${spokenTime(pos)} of ${spokenTime(dur)}`;

export { BLOCKED_NOTE, FOLLOW_DESC, FOLLOW_LABEL, FOLLOW_REDUCED_NOTE, NO_RECORDING, PLAY_ERROR, RECITER_RESTART_NOTE, RESUME_LABEL, SKIP_AYAH, reciterNote, TIMEOUT_ERROR, ayahFailedMessage } from "./audioText";

// ---- the queue's saved place (Phase 4C): a NEW additive key, so the legacy `quran:audio-resume:v1` stays exactly as it is

export const AUDIO_QUEUE_KEY = "quran:audio-queue:v1";
/** Which queue: a page of the page reader, or a chapter of a story. The list of ayahs is never stored: it is rebuilt from the data. */
export type QueueRef = { page: number } | { storyId: string; chapter: number };
export interface QueueRecord {
  v: 1;
  kind: "page" | "story";
  ref: QueueRef;
  /** which ayah of the queue */
  index: number;
  reciter: string;
  position: number;
  savedAt: number;
}
export interface RestoredQueue {
  kind: "page" | "story";
  ref: QueueRef;
  index: number;
  reciter: string;
  position: number;
}
/** A saved queue, or null for anything damaged (never an error). The reciter must be a known name, else the default. */
export function restoredQueue(raw: unknown): RestoredQueue | null {
  if (!isObject(raw) || raw.v !== 1 || (raw.kind !== "page" && raw.kind !== "story") || !isObject(raw.ref)) return null;
  const ref = raw.ref;
  const index = typeof raw.index === "number" && Number.isInteger(raw.index) && raw.index >= 0 ? raw.index : -1;
  if (index < 0) return null;
  let r: QueueRef;
  if (raw.kind === "page") {
    if (typeof ref.page !== "number" || !Number.isInteger(ref.page) || ref.page < 1 || ref.page > 604) return null;
    r = { page: ref.page };
  } else {
    if (typeof ref.storyId !== "string" || !ref.storyId || typeof ref.chapter !== "number" || !Number.isInteger(ref.chapter) || ref.chapter < 0) return null;
    r = { storyId: ref.storyId, chapter: ref.chapter };
  }
  const reciter = typeof raw.reciter === "string" && RECITER_NAMES.includes(raw.reciter) ? raw.reciter : DEFAULT_RECITER;
  const position = typeof raw.position === "number" && Number.isFinite(raw.position) && raw.position > 0 ? Math.floor(raw.position) : 0;
  return { kind: raw.kind, ref: r, index, reciter, position };
}
export const readQueueRecord = (): RestoredQueue | null => restoredQueue(getJSON<unknown>(AUDIO_QUEUE_KEY, null));
export const writeQueueRecord = (rec: QueueRecord): void => void setJSON(AUDIO_QUEUE_KEY, { ...rec, position: Math.max(0, rec.position) });
export const clearQueueRecord = (): void => void remove(AUDIO_QUEUE_KEY);

// ---- the player's own switches (additive): "Follow audio"

export const PLAYER_PREFS_KEY = "quran:player-prefs:v1";
export interface PlayerPrefs {
  followAyah?: boolean;
}
export function readPlayerPrefs(): PlayerPrefs {
  const v = getJSON<unknown>(PLAYER_PREFS_KEY, {});
  return isObject(v) ? v : {};
}
export const setFollowAyah = (on: boolean): void => void setJSON(PLAYER_PREFS_KEY, { ...readPlayerPrefs(), followAyah: on });
/** "Follow audio" is on only when the user turned it on AND Reduce motion is off. */
export const followOn = (p: PlayerPrefs, reducedMotion: boolean): boolean => p.followAyah === true && !reducedMotion;
