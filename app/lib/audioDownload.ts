// Saving one audio file into Cache Storage. A file is stored only if it is complete and really is MP3 audio: the response must be audio (or
// GitHub's generic octet-stream), its length must be the expected size, the bytes that arrive must add up to exactly that size, and they must
// start like an MP3. The body is streamed straight into the cache (nothing is held in memory), counted as it goes; if anything is wrong the
// stream is errored, nothing is stored, and the key is deleted again, so a partial or wrong file is never left behind and never listed as
// saved. No resume: a stopped download starts again from nothing. Browser pieces are passed in so this is unit-tested.
import { acceptableType, audioSources, DownloadError, looksLikeMp3, plainUrl } from "./downloadPlan";

export interface DownloadDeps {
  fetch(url: string, init: RequestInit): Promise<Response>;
  cache: { put(key: string, response: Response): Promise<void>; delete(key: string): Promise<boolean> };
}

export interface DownloadRequest {
  /** The app's own audio URL (the one in the data); the file is saved under it. */
  url: string;
  /** The measured size in bytes; anything else is refused. */
  expected: number;
  signal?: AbortSignal;
  onProgress?(done: number, total: number): void;
}

const errName = (e: unknown): string => (e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : "");

export async function downloadAudioFile(req: DownloadRequest, deps: DownloadDeps): Promise<void> {
  const key = plainUrl(req.url);
  let last: DownloadError = new DownloadError("network", "The audio could not be reached.");
  for (const source of audioSources(req.url)) {
    let res: Response;
    try {
      // `no-store`: a download is not browsing. It must not fill the browser's HTTP cache, and the service worker's streaming-audio rule skips it,
      // so the file is stored once, here.
      res = await deps.fetch(source, { cache: "no-store", signal: req.signal });
    } catch (e) {
      if (req.signal?.aborted || errName(e) === "AbortError") throw new DownloadError("aborted", "Stopped.");
      last = new DownloadError("network", "The audio could not be reached.");
      continue;
    }
    const refuse = async (error: DownloadError) => {
      last = error;
      await res.body?.cancel().catch(() => undefined);
    };
    if (!res.ok || !res.body) {
      await refuse(new DownloadError("http", `The server answered ${res.status}.`));
      continue;
    }
    if (!acceptableType(res.headers.get("content-type"))) {
      await refuse(new DownloadError("type", "The server did not send audio."));
      continue;
    }
    if (Number(res.headers.get("content-length")) !== req.expected) {
      await refuse(new DownloadError("size", "The file on the server is not the size this app expects."));
      continue;
    }

    let seen = 0;
    const head: number[] = [];
    const state: { problem: DownloadError | null } = { problem: null };
    const counted = res.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          if (head.length < 4) {
            head.push(...chunk.subarray(0, 4 - head.length));
            if (head.length >= 3 && !looksLikeMp3(Uint8Array.from(head))) {
              state.problem = new DownloadError("format", "The file is not an MP3.");
              return controller.error(state.problem);
            }
          }
          seen += chunk.byteLength;
          if (seen > req.expected) {
            state.problem = new DownloadError("size", "The file is larger than expected.");
            return controller.error(state.problem);
          }
          controller.enqueue(chunk);
          req.onProgress?.(seen, req.expected);
        },
        flush(controller) {
          if (seen !== req.expected) {
            state.problem = new DownloadError("size", "The download ended early.");
            controller.error(state.problem);
          }
        },
      }),
    );
    try {
      // Stored as audio/mpeg whatever the host called it, with the exact length, so the service worker can answer range requests.
      await deps.cache.put(key, new Response(counted, { status: 200, headers: { "Content-Type": "audio/mpeg", "Content-Length": String(req.expected) } }));
      return;
    } catch (e) {
      await deps.cache.delete(key).catch(() => false);
      if (state.problem) throw state.problem;
      if (req.signal?.aborted || errName(e) === "AbortError") throw new DownloadError("aborted", "Stopped.");
      if (errName(e) === "QuotaExceededError") throw new DownloadError("quota", "There is not enough space on this device.");
      throw new DownloadError("network", "The download was interrupted.");
    }
  }
  throw last;
}
