// Phase 11: saving a surah's audio. The pure rules (hosts, validation, sizes, what is saved), the download function with a fake network and a
// fake cache (nothing partial or wrong is ever stored), and the queue. No network, no browser.
import { describe, expect, it } from "vitest";
import { downloadAudioFile, type DownloadDeps } from "../app/lib/audioDownload";
import { DownloadManager, type ManagerDeps } from "../app/lib/downloadManager";
import { PLAY_ERROR } from "../app/lib/audioState";
import { acceptableType, audioSources, DownloadError, expectedBytes, formatBytes, isLfsPointer, isOfflineUrl, looksLikeMp3, needsHomeScreenNote, offlineUrl, plainUrl, RECITER_IDS, savedFromKeys, spaceCheck } from "../app/lib/downloadPlan";
import { unmarked, withSavedCopy } from "../app/lib/savedAudio";
import { setup } from "./audioFakes";

const R = "https://github.com/The-Quran-Project/Quran-Audio-Chapters/raw/refs/heads/main/Data";
const app = (r: number, s: number) => `${R}/${r}/${s}.mp3`;

describe("where a file comes from", () => {
  it("rewrites the app's GitHub URL to the two hosts that a page can read, raw first", () => {
    expect(audioSources(app(1, 1))).toEqual([
      "https://raw.githubusercontent.com/The-Quran-Project/Quran-Audio-Chapters/refs/heads/main/Data/1/1.mp3",
      "https://media.githubusercontent.com/media/The-Quran-Project/Quran-Audio-Chapters/refs/heads/main/Data/1/1.mp3",
    ]);
  });
  it("ignores the offline marker, and leaves a URL of any other shape alone", () => {
    expect(audioSources(offlineUrl(app(3, 2)))[0]).toBe("https://raw.githubusercontent.com/The-Quran-Project/Quran-Audio-Chapters/refs/heads/main/Data/3/2.mp3");
    expect(audioSources("https://example.test/a/1.mp3")).toEqual(["https://example.test/a/1.mp3"]);
  });
  it("adds and removes the marker without touching the rest of the URL", () => {
    const o = offlineUrl(app(1, 2));
    expect(isOfflineUrl(o)).toBe(true);
    expect(isOfflineUrl(app(1, 2))).toBe(false);
    expect(plainUrl(o)).toBe(app(1, 2));
    expect(plainUrl(app(1, 2))).toBe(app(1, 2));
  });
});

describe("the measured sizes", () => {
  it("has a size for every surah and reciter, and the four Git LFS files are the real audio size, not the pointer", () => {
    for (const id of Object.values(RECITER_IDS)) for (let s = 1; s <= 114; s++) expect(expectedBytes(id, s), `${id}/${s}`).toBeGreaterThan(100_000);
    expect(expectedBytes("1", 2)).toBe(120_643_350);
    expect(expectedBytes("2", 2)).toBe(113_362_919);
    expect(expectedBytes("3", 2)).toBe(90_656_305);
    expect(expectedBytes("4", 2)).toBe(115_967_052);
    expect(expectedBytes("5", 2)).toBe(114_249_560);
  });
  it("knows the five legacy reciters by name, and nothing else", () => {
    expect(RECITER_IDS["Mishary Rashid Al Afasy"]).toBe("1");
    expect(Object.keys(RECITER_IDS)).toHaveLength(5);
    expect(expectedBytes("9", 1)).toBeNull();
    expect(expectedBytes("1", 115)).toBeNull();
  });
  it("shows decimal units", () => {
    expect(formatBytes(120_643_350)).toBe("121 MB");
    expect(formatBytes(839_530)).toBe("840 KB");
    expect(formatBytes(1_720_000_000)).toBe("1.7 GB");
    expect(formatBytes(5_400_000)).toBe("5.4 MB");
  });
});

describe("what makes a file acceptable", () => {
  it("accepts audio and GitHub's generic type, refuses text, HTML and JSON", () => {
    for (const t of ["audio/mpeg", "audio/mp3", "application/octet-stream", "Audio/MPEG; charset=x"]) expect(acceptableType(t), t).toBe(true);
    for (const t of ["text/plain; charset=utf-8", "text/html", "application/json", "", null]) expect(acceptableType(t), String(t)).toBe(false);
  });
  it("recognises an MP3 by an ID3 tag or a frame sync, and nothing else", () => {
    expect(looksLikeMp3(Uint8Array.from([0x49, 0x44, 0x33, 0x03]))).toBe(true);
    expect(looksLikeMp3(Uint8Array.from([0xff, 0xfb, 0x90, 0x00]))).toBe(true);
    expect(looksLikeMp3(new TextEncoder().encode("<!DOCTYPE html>"))).toBe(false);
    expect(looksLikeMp3(new TextEncoder().encode("version https://git-lfs"))).toBe(false);
    expect(looksLikeMp3(Uint8Array.from([0x49]))).toBe(false);
  });
  it("recognises a Git LFS pointer", () => {
    expect(isLfsPointer("version https://git-lfs.github.com/spec/v1\noid sha256:eb1b\nsize 120643350\n")).toBe(true);
    expect(isLfsPointer("ID3")).toBe(false);
  });
});

describe("space", () => {
  it("warns when the free quota cannot hold the file with a margin, and never blocks on an unknown quota", () => {
    expect(spaceCheck(115e6, { usage: 100e6, quota: 10e9 }).enough).toBe(true);
    expect(spaceCheck(115e6, { usage: 9.9e9, quota: 10e9 })).toEqual({ enough: false, free: 100e6 });
    expect(spaceCheck(115e6, null)).toEqual({ enough: true, free: null });
    expect(spaceCheck(115e6, { usage: 5 })).toEqual({ enough: true, free: null });
  });
});

describe("what is saved is read from the cache's keys", () => {
  it("lists only audio files, once each, in order, by surah and reciter", () => {
    const keys = [app(2, 36), app(1, 36), `${app(1, 2)}?offline=1`, "https://quranapi.pages.dev/api/1.json", `${R}/1/115.mp3`, `${R}/x/3.mp3`];
    expect(savedFromKeys(keys).map((s) => `${s.surah}/${s.reciterId}`)).toEqual(["2/1", "36/1", "36/2"]);
    expect(savedFromKeys(keys)[0]!.url).toBe(app(1, 2));
  });
});

// ---- the download function, with a fake network and a fake cache

const mp3 = (n: number, head: number[] = [0x49, 0x44, 0x33, 0x03]) => {
  const b = new Uint8Array(n);
  b.set(head);
  return b;
};
const stream = (b: Uint8Array, chunk = 1000, failAt?: number) => {
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(c) {
      if (failAt !== undefined && i >= failAt) return c.error(new TypeError("network lost"));
      if (i >= b.length) return c.close();
      c.enqueue(b.subarray(i, i + chunk));
      i += chunk;
    },
  });
};
const reply = (body: Uint8Array, init: { status?: number; type?: string | null; length?: number | null; failAt?: number } = {}) =>
  new Response(stream(body, 1000, init.failAt), {
    status: init.status ?? 200,
    headers: { ...(init.type === null ? {} : { "content-type": init.type ?? "audio/mpeg" }), ...(init.length === null ? {} : { "content-length": String(init.length ?? body.length) }) },
  });

class FakeCache {
  store = new Map<string, Response>();
  deleted: string[] = [];
  async put(key: string, r: Response) {
    const blob = await r.blob(); // consuming the body is what the real cache does; a stream that errors makes put reject, storing nothing
    this.store.set(key, new Response(blob, { headers: r.headers }));
  }
  async delete(key: string) {
    this.deleted.push(key);
    return this.store.delete(key);
  }
  async keys() {
    return [...this.store.keys()].map((url) => ({ url }));
  }
}
const net = (...answers: (Response | Error)[]) => {
  const calls: { url: string; init: RequestInit }[] = [];
  const f: DownloadDeps["fetch"] = async (url, init) => {
    calls.push({ url, init });
    const a = answers.shift();
    if (!a) throw new TypeError("no more answers");
    if (a instanceof Error) throw a;
    return a;
  };
  return { f, calls };
};

describe("downloadAudioFile", () => {
  const url = app(1, 112);
  it("streams a complete MP3 into the cache under the app's own URL, as audio/mpeg, with progress, fetched with cache: no-store", async () => {
    const body = mp3(5000);
    const n = net(reply(body, { type: "application/octet-stream" }));
    const cache = new FakeCache();
    const seen: number[] = [];
    await downloadAudioFile({ url, expected: 5000, onProgress: (d) => seen.push(d) }, { fetch: n.f, cache });
    expect(n.calls[0]!.url).toBe("https://raw.githubusercontent.com/The-Quran-Project/Quran-Audio-Chapters/refs/heads/main/Data/1/112.mp3");
    expect(n.calls[0]!.init.cache).toBe("no-store");
    const stored = cache.store.get(url)!;
    expect(stored.headers.get("content-type")).toBe("audio/mpeg");
    expect(new Uint8Array(await stored.arrayBuffer())).toEqual(body);
    expect(seen.at(-1)).toBe(5000);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });
  it("uses the media host when the raw host answers with a Git LFS pointer, and stores the real audio", async () => {
    const pointer = new TextEncoder().encode("version https://git-lfs.github.com/spec/v1\noid sha256:eb1b\nsize 4000\n");
    const n = net(reply(pointer, { type: "text/plain; charset=utf-8" }), reply(mp3(4000)));
    const cache = new FakeCache();
    await downloadAudioFile({ url, expected: 4000 }, { fetch: n.f, cache });
    expect(n.calls.map((c) => new URL(c.url).host)).toEqual(["raw.githubusercontent.com", "media.githubusercontent.com"]);
    expect((await cache.store.get(url)!.arrayBuffer()).byteLength).toBe(4000);
  });
  it("refuses an error page: wrong type, nothing stored", async () => {
    const html = new TextEncoder().encode("<html>429</html>");
    const cache = new FakeCache();
    await expect(downloadAudioFile({ url, expected: html.length }, { fetch: net(reply(html, { type: "text/html" }), reply(html, { type: "text/html" })).f, cache })).rejects.toMatchObject({ kind: "type" });
    expect(cache.store.size).toBe(0);
  });
  it("refuses a file of the wrong length, before reading it", async () => {
    const cache = new FakeCache();
    const bad = net(reply(mp3(4999)), reply(mp3(4999)));
    await expect(downloadAudioFile({ url, expected: 5000 }, { fetch: bad.f, cache })).rejects.toMatchObject({ kind: "size" });
    expect(cache.store.size).toBe(0);
  });
  it("refuses bytes that are not an MP3 even when type and length look right, and leaves nothing", async () => {
    const cache = new FakeCache();
    const text = new Uint8Array(3000).fill(0x61);
    await expect(downloadAudioFile({ url, expected: 3000 }, { fetch: net(reply(text)).f, cache })).rejects.toMatchObject({ kind: "format" });
    expect(cache.store.size).toBe(0);
    expect(cache.deleted).toContain(url);
  });
  it("an interrupted download stores nothing and says it was interrupted", async () => {
    const cache = new FakeCache();
    await expect(downloadAudioFile({ url, expected: 5000 }, { fetch: net(reply(mp3(5000), { failAt: 3000 })).f, cache })).rejects.toMatchObject({ kind: "network" });
    expect(cache.store.size).toBe(0);
  });
  it("a body that ends early, although the header promised more, stores nothing", async () => {
    const cache = new FakeCache();
    await expect(downloadAudioFile({ url, expected: 5000 }, { fetch: net(reply(mp3(3000), { length: 5000 })).f, cache })).rejects.toMatchObject({ kind: "size" });
    expect(cache.store.size).toBe(0);
  });
  it("reports a full device as a quota failure and removes the key", async () => {
    const cache = new FakeCache();
    cache.put = async () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    await expect(downloadAudioFile({ url, expected: 5000 }, { fetch: net(reply(mp3(5000))).f, cache })).rejects.toMatchObject({ kind: "quota" });
    expect(cache.deleted).toContain(url);
  });
  it("Cancel is an abort, not a failure", async () => {
    const ac = new AbortController();
    const cache = new FakeCache();
    const f: DownloadDeps["fetch"] = async () => {
      ac.abort();
      throw new DOMException("x", "AbortError");
    };
    await expect(downloadAudioFile({ url, expected: 5000, signal: ac.signal }, { fetch: f, cache })).rejects.toMatchObject({ kind: "aborted" });
  });
  it("tries the next host when the first is unreachable, and reports the last problem when none works", async () => {
    const cache = new FakeCache();
    const ok = net(new TypeError("offline"), reply(mp3(2000)));
    await downloadAudioFile({ url, expected: 2000 }, { fetch: ok.f, cache });
    expect(cache.store.has(url)).toBe(true);
    const none = net(new TypeError("offline"), new TypeError("offline"));
    await expect(downloadAudioFile({ url, expected: 2000 }, { fetch: none.f, cache: new FakeCache() })).rejects.toBeInstanceOf(DownloadError);
  });
});

// ---- the queue

function harness(opts: { estimate?: { usage?: number; quota?: number } | null; answers?: (signal?: AbortSignal | null) => Response | Error } = {}) {
  const cache = new FakeCache();
  const fetched: string[] = [];
  const deps: ManagerDeps = {
    fetch: async (u, init) => {
      fetched.push(u);
      const a = opts.answers ? opts.answers(init.signal) : reply(mp3(expectedBytes("1", 112)!));
      if (a instanceof Error) throw a;
      return a;
    },
    openCache: async () => cache,
    estimate: async () => (opts.estimate === undefined ? { usage: 0, quota: 50e9 } : opts.estimate),
    resolveUrl: async (s, r) => (r === "Mishary Rashid Al Afasy" ? app(1, s) : null),
    reciterId: (r) => RECITER_IDS[r] ?? null,
    persist: async () => true,
  };
  let changes = 0;
  const m = new DownloadManager(deps, () => changes++);
  return { m, cache, fetched, changes: () => changes };
}
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 400 && !ok(); i++) await new Promise((r) => setTimeout(r, 5));
  expect(ok()).toBe(true);
};
const NAME = "Mishary Rashid Al Afasy";

describe("DownloadManager", () => {
  it("downloads, lists the file as saved from the cache's keys, and does not queue a saved file again", async () => {
    const h = harness();
    await h.m.enqueue(112, NAME);
    await until(() => h.m.isSaved(112, "1"));
    expect(h.m.jobs[0]!.status).toBe("done");
    expect(h.m.saved).toEqual([{ surah: 112, reciterId: "1", url: app(1, 112) }]);
    expect(await h.m.enqueue(112, NAME)).toBeNull();
  });
  it("runs one file at a time, in the order asked", async () => {
    const order: string[] = [];
    const h = harness({
      answers: () => {
        order.push("fetch");
        return reply(mp3(expectedBytes("1", 112)!));
      },
    });
    await h.m.enqueue(112, NAME);
    await h.m.enqueue(114, NAME);
    // surah 114 has a different size, so the canned answer fails its length check: it must be a failure of that job only, after 112 finished
    await until(() => h.m.jobs.length === 2 && h.m.jobs.every((j) => j.status === "done" || j.status === "failed"));
    expect(h.m.jobs.map((j) => `${j.surah}:${j.status}`)).toEqual(["112:done", "114:failed"]);
    expect(h.m.saved.map((s) => s.surah)).toEqual([112]);
  });
  it("a failed file shows its reason and can be retried; nothing is saved meanwhile", async () => {
    let fail = true;
    const h = harness({ answers: () => (fail ? new TypeError("offline") : reply(mp3(expectedBytes("1", 112)!))) });
    await h.m.enqueue(112, NAME);
    await until(() => h.m.jobs[0]!.status === "failed");
    expect(h.m.jobs[0]!.message).toMatch(/could not be reached|failed/i);
    expect(h.m.saved).toEqual([]);
    fail = false;
    h.m.retry(h.m.jobs[0]!.id);
    await until(() => h.m.isSaved(112, "1"));
  });
  it("warns before fetching a byte when the space is short, and goes on only when told to", async () => {
    const h = harness({ estimate: { usage: 9.99e9, quota: 10e9 } });
    await h.m.enqueue(112, NAME);
    await until(() => h.m.jobs[0]!.status === "space");
    expect(h.m.jobs[0]!.message).toMatch(/^Needs about .* free/);
    expect(h.fetched).toEqual([]);
    h.m.proceed(h.m.jobs[0]!.id);
    await until(() => h.m.isSaved(112, "1"));
  });
  it("Cancel on a running download aborts it, discards it and drops the job", async () => {
    const h = harness({ answers: (signal) => new Response(new ReadableStream({ start(c) { signal?.addEventListener("abort", () => c.error(new DOMException("aborted", "AbortError"))); } }), { headers: { "content-type": "audio/mpeg", "content-length": String(expectedBytes("1", 112)) } }) });
    await h.m.enqueue(112, NAME);
    await until(() => h.m.jobs[0]?.status === "downloading");
    h.m.cancel(h.m.jobs[0]!.id);
    await until(() => h.m.jobs.length === 0);
    expect(h.m.saved).toEqual([]);
  });
  it("refuses a recording that has no file for that reciter, without a request", async () => {
    const h = harness();
    expect(await h.m.enqueue(112, "Abu Bakr Al Shatri")).toMatchObject({ status: "failed" });
    expect(h.fetched).toEqual([]);
  });
  it("Remove deletes the file and the list follows the cache", async () => {
    const h = harness();
    await h.m.enqueue(112, NAME);
    await until(() => h.m.isSaved(112, "1"));
    await h.m.remove(112, "1");
    expect(h.m.saved).toEqual([]);
    expect(h.cache.store.size).toBe(0);
  });
  it("starts from what is already in the cache (a file saved earlier, or left by Clear all data)", async () => {
    const h = harness();
    h.cache.store.set(app(1, 36), new Response("x"));
    await h.m.refresh();
    expect(h.m.isSaved(36, "1")).toBe(true);
  });
});

// ---- finding the saved copy when playing

describe("playing a saved surah", () => {
  it("asks for the saved copy only when a service worker is in charge and the file is in the cache", async () => {
    const u = app(1, 36);
    expect(await withSavedCopy(u, { controlled: () => true, has: async (k) => k === u })).toBe(`${u}?offline=1`);
    expect(await withSavedCopy(u, { controlled: () => true, has: async () => false })).toBe(u);
    expect(await withSavedCopy(u, { controlled: () => false, has: async () => true })).toBe(u);
    expect(await withSavedCopy(u, { controlled: () => true, has: async () => Promise.reject(new Error("no cache")) })).toBe(u);
  });
  it("knows which URLs are marked", () => {
    expect(unmarked(`${app(1, 36)}?offline=1`)).toBe(app(1, 36));
    expect(unmarked(app(1, 36))).toBeNull();
  });
  it("if the saved copy cannot be played, the player asks once for the file itself, and only then shows the error", async () => {
    const s = setup({ resolve: async (n) => `${app(1, n)}?offline=1`, unmarked });
    await s.e.playSurah({ surahNo: 36, title: "Yaseen", reciter: "Mishary Rashid Al Afasy" });
    const el = s.el();
    expect(el.src).toBe(`${app(1, 36)}?offline=1`);
    el.emit("error");
    expect(el.src).toBe(app(1, 36)); // the plain URL, tried once
    expect(s.e.snapshot.status).not.toBe("error");
    el.emit("error");
    expect(s.e.snapshot).toMatchObject({ status: "error" });
    expect(s.e.snapshot.error?.message).toBe(PLAY_ERROR);
  });
  it("a surah that was never saved behaves exactly as before: one failure is the error", async () => {
    const s = setup({ unmarked });
    await s.e.playSurah({ surahNo: 36, title: "Yaseen", reciter: "Mishary Rashid Al Afasy" });
    s.el().emit("error");
    expect(s.e.snapshot.status).toBe("error");
  });
});

describe("the iPhone note", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
  it("shows in an iOS browser tab, not in the installed app, not elsewhere", () => {
    expect(needsHomeScreenNote({ userAgent: iphone, maxTouchPoints: 5, standalone: false })).toBe(true);
    expect(needsHomeScreenNote({ userAgent: iphone, maxTouchPoints: 5, standalone: true })).toBe(false);
    expect(needsHomeScreenNote({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", maxTouchPoints: 5, standalone: false })).toBe(true); // iPad
    expect(needsHomeScreenNote({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", maxTouchPoints: 0, standalone: false })).toBe(false); // a Mac
    expect(needsHomeScreenNote({ userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile", maxTouchPoints: 5, standalone: false })).toBe(false);
  });
});
