// Saving a surah's audio on the device: the pure rules. Where the file comes from (the app's GitHub URL redirects to one of two hosts), what
// makes a file acceptable (audio, the expected size, MP3 bytes), and how a saved file is found again. The browser parts (fetch, Cache Storage,
// the service worker) are passed in or live elsewhere, so every rule here is unit-tested. See docs/phases/phase-11-downloads-plan.md.
import recitersJson from "@legacy/assets/data/reciters.json";
import { AUDIO_SIZES } from "~/data/audioSizes.generated";

/** The legacy name. The service worker's saved-audio route reads this cache; the legacy app's own Remove deletes from it by the original URL. */
export const DOWNLOADS_AUDIO_CACHE = "quran-downloads-audio-cache";
/** A saved file is asked for with this query on its original URL; the service worker answers only those requests from the cache above. */
export const OFFLINE_MARKER = "offline";

export type ReciterId = string;
export const RECITER_IDS: Record<string, ReciterId> = Object.fromEntries((recitersJson as { reciter: string; id: string }[]).map((r) => [r.reciter, String(r.id)]));

/** The URL that asks the service worker for the saved copy. */
export function offlineUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set(OFFLINE_MARKER, "1");
  return u.toString();
}
/** The original URL again (also the key a file is saved under). */
export function plainUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.delete(OFFLINE_MARKER);
  return u.toString();
}
export const isOfflineUrl = (url: string): boolean => {
  try {
    return new URL(url).searchParams.has(OFFLINE_MARKER);
  } catch {
    return false;
  }
};

const GITHUB_RAW = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/(.+)$/;

/**
 * Where to fetch a file from, in order. The app's own URL answers 302 with an empty Access-Control-Allow-Origin, so a page cannot read it; the
 * hosts it redirects to can be read. Most files are on raw.githubusercontent.com; the four over 100 MB (Al-Baqarah for four reciters) are Git
 * LFS files that raw.githubusercontent.com answers with a 134-byte pointer, and the real audio is on media.githubusercontent.com. A URL of any
 * other shape is fetched as it is.
 */
export function audioSources(url: string): string[] {
  const m = GITHUB_RAW.exec(plainUrl(url));
  if (!m) return [plainUrl(url)];
  const [, owner, repo, rest] = m;
  return [`https://raw.githubusercontent.com/${owner}/${repo}/${rest}`, `https://media.githubusercontent.com/media/${owner}/${repo}/${rest}`];
}

/** The measured size in bytes of one surah's file for one reciter, or null when the table has none. */
export function expectedBytes(reciterId: ReciterId, surah: number): number | null {
  const n = AUDIO_SIZES[reciterId]?.[surah - 1];
  return Number.isInteger(n) && n! > 0 ? n! : null;
}

/** Averages measured on the real service (2026-10-22): the text of a surah is about 1.1 KB per ayah; one ayah's tafsir (all three authors) about 10.7 KB. Used only for "about" figures before a download starts. */
export const TEXT_BYTES_PER_AYAH = 1060;
export const TAFSIR_BYTES_PER_AYAH = 10700;

/** "115 MB", "840 KB", "1.7 GB": decimal units, as Settings shows storage. */
export function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(n / 1e3))} KB`;
}

export type FailKind = "network" | "http" | "type" | "size" | "format" | "quota" | "aborted";
export class DownloadError extends Error {
  constructor(
    readonly kind: FailKind,
    message: string,
  ) {
    super(message);
    this.name = "DownloadError";
  }
}

/** What a file must be to be saved: audio (GitHub labels 210 of the MP3s `application/octet-stream`), never text, HTML or JSON. */
export function acceptableType(contentType: string | null): boolean {
  const t = (contentType ?? "").split(";")[0]!.trim().toLowerCase();
  return t.startsWith("audio/") || t === "application/octet-stream";
}

/** The first bytes of an MP3: an ID3 tag, or an MPEG audio frame sync (eleven set bits). */
export function looksLikeMp3(head: Uint8Array): boolean {
  if (head.length < 3) return false;
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return true; // "ID3"
  return head[0] === 0xff && (head[1]! & 0xe0) === 0xe0;
}

export function isLfsPointer(text: string): boolean {
  return text.startsWith("version https://git-lfs.github.com/spec/");
}

/** Whether there is room for a job (with a margin), from `navigator.storage.estimate()`. Unknown quota never blocks. */
export function spaceCheck(needed: number, estimate: { usage?: number; quota?: number } | null): { enough: boolean; free: number | null } {
  if (!estimate || typeof estimate.quota !== "number" || estimate.quota <= 0) return { enough: true, free: null };
  const free = Math.max(0, estimate.quota - (estimate.usage ?? 0));
  return { enough: free >= needed * 1.1 + 20e6, free };
}

export interface SavedAudio {
  surah: number;
  reciterId: ReciterId;
  url: string;
  /** An opaque copy (the legacy app saved audio with a no-cors request): its bytes cannot be read, so it cannot be played from the device. */
  opaque?: boolean;
}
const KEY = /\/Data\/(\d+)\/(\d+)\.mp3$/;
/** What is saved, read from the cache's own keys (the truth), not from a list that could disagree with it. */
export function savedFromKeys(keys: readonly string[]): SavedAudio[] {
  const out: SavedAudio[] = [];
  for (const k of keys) {
    const m = KEY.exec(plainUrl(k));
    if (!m) continue;
    const surah = Number(m[2]);
    if (surah >= 1 && surah <= 114) out.push({ surah, reciterId: m[1]!, url: plainUrl(k) });
  }
  return out.sort((a, b) => a.surah - b.surah || a.reciterId.localeCompare(b.reciterId));
}

/**
 * Safari on iPhone and iPad can clear a website's stored data after a week without a visit unless the site is added to the Home Screen
 * (WebKit's documented limit), which would remove saved audio. True only for iOS in a browser tab; not for the installed app. (iPadOS can
 * report itself as a Mac, hence the touch check.)
 */
export function needsHomeScreenNote(env: { userAgent: string; maxTouchPoints: number; standalone: boolean }): boolean {
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1);
  return ios && !env.standalone;
}
