// Phase 11: the download queue with parts (text, tafsir, audio), the whole-Qur'an text, Wi-Fi and offline waits, the space warning, cancel,
// removal, legacy opaque audio, and the rows. A fake network, cache, reader store and list; no browser.
import { describe, expect, it } from "vitest";
import { DownloadManager, type Job, type ManagerDeps, type Want } from "../app/lib/downloadManager";
import { expectedBytes, RECITER_IDS } from "../app/lib/downloadPlan";
import type { ManifestEntry } from "../app/lib/downloadsManifest";

const NAME = "Mishary Rashid Al Afasy";
const R = "https://github.com/The-Quran-Project/Quran-Audio-Chapters/raw/refs/heads/main/Data";
const app = (r: number, s: number) => `${R}/${r}/${s}.mp3`;
const SIZE = expectedBytes("1", 112)!;

const mp3 = (n: number) => {
  const b = new Uint8Array(n);
  b.set([0x49, 0x44, 0x33, 0x03]);
  return b;
};
const body = (b: Uint8Array) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < b.length; i += 50_000) c.enqueue(b.subarray(i, i + 50_000));
        c.close();
      },
    }),
    { status: 200, headers: { "content-type": "audio/mpeg", "content-length": String(b.length) } },
  );

class FakeCache {
  store = new Map<string, Response>();
  async put(key: string, r: Response) {
    this.store.set(key, new Response(await r.blob(), { headers: r.headers }));
  }
  async delete(key: string) {
    return this.store.delete(key);
  }
  async keys() {
    return [...this.store.keys()].map((url) => ({ url }));
  }
  async match(key: string) {
    return this.store.get(key);
  }
}

function harness(opts: { online?: boolean; cellular?: boolean; wifiOnly?: boolean; estimate?: { usage?: number; quota?: number } | null; tafsirFails?: Set<string>; textFails?: Set<number>; preManifest?: ManifestEntry[] } = {}) {
  const cache = new FakeCache();
  const net = { online: opts.online ?? true, cellular: opts.cellular ?? false };
  const flags = { wifiOnly: opts.wifiOnly ?? false };
  const dev = { chapters: new Set<number>(), tafsirs: new Set<string>(), deletedTafsirs: [] as number[] };
  const calls = { chapter: [] as number[], tafsir: [] as string[], fetched: [] as string[], lock: 0 };
  let manifest: ManifestEntry[] = opts.preManifest ?? [];
  const deps: ManagerDeps = {
    fetch: async (u) => {
      calls.fetched.push(u);
      return body(mp3(SIZE));
    },
    hasCache: async () => cache.store.size > 0,
    openCache: async () => cache,
    estimate: async () => (opts.estimate === undefined ? { usage: 0, quota: 50e9 } : opts.estimate),
    resolveUrl: async (s, r) => (r === NAME ? app(1, s) : null),
    reciterId: (r) => RECITER_IDS[r] ?? null,
    persist: async () => true,
    net: () => net,
    wifiOnly: () => flags.wifiOnly,
    lock: async (fn) => {
      calls.lock++;
      return fn();
    },
    sleep: async () => undefined,
    device: {
      chapterKeys: async () => [...dev.chapters],
      tafsirKeys: async () => [...dev.tafsirs],
      deleteChapter: async (n) => void dev.chapters.delete(n),
      deleteTafsirs: async (n) => {
        dev.deletedTafsirs.push(n);
        for (const k of [...dev.tafsirs]) if (k.startsWith(`${n}_`)) dev.tafsirs.delete(k);
      },
    },
    text: {
      chapter: async (n) => {
        calls.chapter.push(n);
        if (opts.textFails?.has(n)) throw new Error("offline");
        dev.chapters.add(n);
        return 1000;
      },
      tafsir: async (s, a) => {
        const k = `${s}_${a}`;
        calls.tafsir.push(k);
        if (opts.tafsirFails?.has(k)) throw new Error("500");
        dev.tafsirs.add(k);
        return 100;
      },
    },
    manifest: { read: () => manifest, write: (l) => void (manifest = l) },
    surahInfo: (n) => ({ name: `Surah ${n}`, arLong: `ar${n}` }),
    now: () => 1_700_000_000_000,
  };
  let changes = 0;
  const m = new DownloadManager(deps, () => changes++);
  return { m, cache, net, flags, dev, calls, manifest: () => manifest, changes: () => changes };
}
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 600 && !ok(); i++) await new Promise((r) => setTimeout(r, 5));
  expect(ok()).toBe(true);
};
const settled = (j: Job | undefined) => !!j && (j.status === "done" || j.status === "failed");
const ALL: Want = { text: true, tafsir: true, audio: NAME };

describe("saving parts of a surah", () => {
  it("saves text, tafsir and audio in order, records the legacy-shaped entry, and the row shows all three saved", async () => {
    const h = harness();
    await h.m.enqueue(112, ALL);
    await until(() => settled(h.m.jobs[0]));
    expect(h.m.jobs[0]!.status).toBe("done");
    expect(h.calls.chapter).toEqual([112]);
    expect(h.calls.tafsir.sort()).toEqual(["112_1", "112_2", "112_3", "112_4"]);
    const e = h.manifest()[0]!;
    expect(e).toMatchObject({ surahNo: 112, surahName: "ar112", totalAyah: 4, hasTafsir: true, reciterKey: "1", reciterName: NAME, audioUrl: app(1, 112), revamp: 1, downloadedAt: 1_700_000_000_000 });
    expect(e.bytes).toEqual({ text: 1000, tafsir: 400, audio: SIZE });
    expect(e.sizeBytesEstimate).toBe(1000 + 400 + SIZE);
    expect(h.m.rows()).toEqual([{ surah: 112, text: "saved", tafsir: "saved", audio: [{ reciterId: "1", state: "saved" }], bytes: 1400 + SIZE }]);
    expect(await h.m.enqueue(112, ALL)).toBeNull(); // everything is already saved
  });

  it("tafsir is opt-in: without it nothing is fetched for it and the row says none", async () => {
    const h = harness();
    await h.m.enqueue(112, { text: true, tafsir: false, audio: null });
    await until(() => settled(h.m.jobs[0]));
    expect(h.calls.tafsir).toEqual([]);
    expect(h.m.rows()[0]).toMatchObject({ text: "saved", tafsir: "none", audio: [] });
  });

  it("a tafsir part counts only when every ayah is stored: one failing ayah fails the job, says how many, and is not recorded as saved; Retry finishes it", async () => {
    const fails = new Set(["112_3"]);
    const h = harness({ tafsirFails: fails });
    await h.m.enqueue(112, { text: true, tafsir: true, audio: null });
    await until(() => settled(h.m.jobs[0]));
    expect(h.m.jobs[0]).toMatchObject({ status: "failed", message: "Tafsir: 3 of 4 saved. Try again." });
    expect(h.manifest()[0]!.hasTafsir).toBe(false);
    fails.clear();
    h.m.retry(h.m.jobs[0]!.id);
    await until(() => h.m.jobs[0]!.status === "done");
    expect(h.manifest()[0]!.hasTafsir).toBe(true);
    expect(h.m.rows()[0]!.tafsir).toBe("saved");
    expect(h.calls.tafsir.filter((k) => k === "112_1").length).toBeGreaterThanOrEqual(1);
  });

  it("asking for tafsir alone also saves the text it belongs to", async () => {
    const h = harness();
    await h.m.enqueue(112, { text: false, tafsir: true, audio: null });
    await until(() => settled(h.m.jobs[0]));
    expect(h.calls.chapter).toEqual([112]);
    expect(h.m.rows()[0]).toMatchObject({ text: "saved", tafsir: "saved" });
  });

  it("audio alone makes a row but no entry in the list (the list means the text was saved)", async () => {
    const h = harness();
    await h.m.enqueue(112, { text: false, tafsir: false, audio: NAME });
    await until(() => settled(h.m.jobs[0]));
    expect(h.manifest()).toEqual([]);
    expect(h.m.rows()[0]).toMatchObject({ text: "none", tafsir: "none", audio: [{ reciterId: "1", state: "saved" }] });
  });

  it("runs one job at a time under the lock, in the order asked", async () => {
    const h = harness();
    await h.m.enqueue(112, { text: true, tafsir: false, audio: null });
    await h.m.enqueue(114, { text: true, tafsir: false, audio: null });
    await until(() => h.m.jobs.length === 2 && h.m.jobs.every(settled));
    expect(h.calls.chapter).toEqual([112, 114]);
    expect(h.calls.lock).toBe(2);
  });

  it("a text failure says which surah and can be retried", async () => {
    const fails = new Set([112]);
    const h = harness({ textFails: fails });
    await h.m.enqueue(112, { text: true, tafsir: false, audio: null });
    await until(() => settled(h.m.jobs[0]));
    expect(h.m.jobs[0]).toMatchObject({ status: "failed", message: "The text of Surah 112 could not be loaded." });
    expect(h.manifest()).toEqual([]);
    fails.clear();
    h.m.retry(h.m.jobs[0]!.id);
    await until(() => h.m.jobs[0]!.status === "done");
  });
});

describe("the whole Qur'an text", () => {
  it("is one job: 114 surahs, each once, the already saved ones skipped, and 114 entries in the list", async () => {
    const h = harness();
    await h.m.enqueue(112, { text: true, tafsir: false, audio: null });
    await until(() => settled(h.m.jobs[0]));
    h.calls.chapter.length = 0;
    const job = await h.m.enqueueAllText();
    expect(job).toMatchObject({ kind: "text-all", total: 114 });
    await until(() => h.m.jobs.at(-1)!.status === "done");
    expect(h.calls.chapter.sort((a, b) => a - b)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1).filter((n) => n !== 112));
    expect(h.manifest()).toHaveLength(114);
    expect(await h.m.enqueueAllText()).toBeNull(); // nothing left to save
  });
  it("a surah that cannot be loaded fails the job with the count, and the ones that worked stay saved", async () => {
    const h = harness({ textFails: new Set([5]) });
    await h.m.enqueueAllText();
    await until(() => settled(h.m.jobs[0]));
    expect(h.m.jobs[0]).toMatchObject({ status: "failed", message: "Text: 113 of 114 surahs saved. Try again." });
    expect(h.manifest()).toHaveLength(113);
  });
});

describe("waiting for the connection", () => {
  it("offline: waits, starts by itself when the connection returns, and fetches nothing meanwhile", async () => {
    const h = harness({ online: false });
    await h.m.enqueue(112, ALL);
    await until(() => h.m.jobs[0]!.status === "offline");
    expect(h.calls.chapter).toEqual([]);
    h.net.online = true;
    h.m.networkChanged();
    await until(() => h.m.jobs[0]!.status === "done");
  });
  it("Wi-Fi only on mobile data: text and tafsir are saved, the audio waits for Wi-Fi and then downloads", async () => {
    const h = harness({ cellular: true, wifiOnly: true });
    await h.m.enqueue(112, ALL);
    await until(() => h.m.jobs[0]!.status === "wifi");
    expect(h.m.rows()[0]).toMatchObject({ text: "saved", tafsir: "saved", audio: [] });
    expect(h.calls.fetched).toEqual([]);
    h.net.cellular = false;
    h.m.networkChanged();
    await until(() => h.m.jobs[0]!.status === "done");
    expect(h.m.isSaved(112, "1")).toBe(true);
  });
  it("Wi-Fi only changes nothing when the browser does not report mobile data", async () => {
    const h = harness({ cellular: false, wifiOnly: true });
    await h.m.enqueue(112, ALL);
    await until(() => h.m.jobs[0]!.status === "done");
  });
  it("a job that is waiting does not block the next one", async () => {
    const h = harness({ cellular: true, wifiOnly: true });
    await h.m.enqueue(112, { text: true, tafsir: false, audio: NAME });
    await until(() => h.m.jobs[0]!.status === "wifi");
    await h.m.enqueue(114, { text: true, tafsir: false, audio: null });
    await until(() => h.m.jobs[1]!.status === "done");
  });
});

describe("space, cancel, remove", () => {
  it("warns before fetching anything when the space is short, and goes on only when told", async () => {
    const h = harness({ estimate: { usage: 9.99e9, quota: 10e9 } });
    await h.m.enqueue(112, ALL);
    await until(() => h.m.jobs[0]!.status === "space");
    expect(h.m.jobs[0]!.message).toMatch(/^Needs about .* free/);
    expect(h.calls.chapter).toEqual([]);
    h.m.proceed(h.m.jobs[0]!.id);
    await until(() => h.m.jobs[0]!.status === "done");
  });
  it("Cancel all stops the running download, discards the audio and drops every job", async () => {
    const h = harness();
    h.m["deps"].fetch = async (_u, init) =>
      new Response(new ReadableStream({ start(c) { init.signal?.addEventListener("abort", () => c.error(new DOMException("a", "AbortError"))); } }), { headers: { "content-type": "audio/mpeg", "content-length": String(SIZE) } });
    await h.m.enqueue(112, { text: false, tafsir: false, audio: NAME });
    await h.m.enqueue(114, { text: true, tafsir: false, audio: null });
    await until(() => h.m.jobs[0]?.step === "audio");
    h.m.cancelAll();
    await until(() => h.m.jobs.length === 0);
    expect(h.cache.store.size).toBe(0);
    expect(h.calls.chapter).toEqual([]);
  });
  it("Remove deletes the audio of every reciter, the text and tafsir, and the entry; the rows follow", async () => {
    const h = harness();
    await h.m.enqueue(112, ALL);
    await until(() => settled(h.m.jobs[0]));
    h.cache.store.set(app(2, 112), new Response("x"));
    await h.m.refresh();
    await h.m.removeSurah(112);
    expect(h.m.rows()).toEqual([]);
    expect(h.manifest()).toEqual([]);
    expect(h.cache.store.size).toBe(0);
    expect(h.dev.chapters.size).toBe(0);
    expect(h.dev.deletedTafsirs).toEqual([112]);
  });
  it("removing one reciter's audio leaves the rest", async () => {
    const h = harness();
    await h.m.enqueue(112, ALL);
    await until(() => settled(h.m.jobs[0]));
    await h.m.removeAudio(112, "1");
    expect(h.m.rows()[0]).toMatchObject({ text: "saved", audio: [] });
  });
});

describe("what the device really holds", () => {
  const entry = (n: number, extra: Partial<ManifestEntry> = {}): ManifestEntry => ({ surahNo: n, surahName: "x", totalAyah: 4, hasTafsir: false, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 0, downloadedAt: 1, ...extra });
  it("a part the list says was saved but the device lost is 'missing', not silently dropped", async () => {
    const h = harness({ preManifest: [entry(112, { hasTafsir: true, bytes: { text: 5, tafsir: 6 } })] });
    await h.m.refresh();
    expect(h.m.rows()[0]).toMatchObject({ surah: 112, text: "missing", tafsir: "missing" });
    h.dev.chapters.add(112);
    for (let a = 1; a <= 4; a++) h.dev.tafsirs.add(`112_${a}`);
    await h.m.refresh();
    expect(h.m.rows()[0]).toMatchObject({ text: "saved", tafsir: "saved", bytes: 11 });
  });
  it("a surah the reader merely cached is not a row: only what was saved on purpose is listed", async () => {
    const h = harness();
    h.dev.chapters.add(2);
    h.dev.tafsirs.add("2_1");
    await h.m.refresh();
    expect(h.m.rows()).toEqual([]);
  });
  it("audio saved by the legacy app (an opaque copy) is shown as older, is not playable, and Download replaces it", async () => {
    const h = harness();
    h.cache.store.set(app(1, 112), { type: "opaque" } as unknown as Response);
    await h.m.refresh();
    expect(h.m.isSaved(112, "1")).toBe(false);
    expect(h.m.rows()[0]!.audio).toEqual([{ reciterId: "1", state: "older" }]);
    await h.m.enqueue(112, { text: false, tafsir: false, audio: NAME });
    await until(() => settled(h.m.jobs[0]));
    expect(h.m.isSaved(112, "1")).toBe(true);
    expect(h.m.rows()[0]!.audio).toEqual([{ reciterId: "1", state: "saved" }]);
  });
  it("audio left behind by Clear all data (no list) is listed again", async () => {
    const h = harness();
    h.cache.store.set(app(1, 36), new Response("x"));
    await h.m.refresh();
    expect(h.m.rows()).toEqual([{ surah: 36, text: "none", tafsir: "none", audio: [{ reciterId: "1", state: "saved" }], bytes: expectedBytes("1", 36)! }]);
  });
});

describe("when the list of recordings cannot be loaded", () => {
  it("a job asking for audio fails with a message instead of throwing", async () => {
    const h = harness();
    h.m["deps"].resolveUrl = async () => {
      throw new Error("chunk failed to load");
    };
    const job = await h.m.enqueue(112, { text: true, tafsir: false, audio: NAME });
    expect(job).toMatchObject({ status: "failed", message: "This recording is not available to save." });
    expect(h.calls.chapter).toEqual([]);
  });
});
