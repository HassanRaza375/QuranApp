// Phase 10: the ayah text search engine, on REAL recorded answers from the upstream (tests/fixtures/alquran-search-*.json). No network.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createAyahSearcher, MAX_SHOWN, parseSearchResponse, selectAyahs, SearchShapeError, type AyahOutcome, type Fetcher } from "../app/lib/ayahSearch";
import { juzOfAyah } from "../app/lib/quranMeta";

const fx = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8")) as unknown;
const MERCY = fx("alquran-search-mercy-all-pickthall.json");
const EASE = fx("alquran-search-ease-94-pickthall.json");
const RABBI = fx("alquran-search-rabbi-all-simple.json");

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}
const q = (text: string, scope: number | "all" = "all", edition = "en.pickthall") => ({ text, scope, edition });

describe("parseSearchResponse", () => {
  it("reads the real answers: counts, positions, text, edition and the link into the reader", () => {
    const hits = parseSearchResponse(MERCY);
    expect(hits).toHaveLength(155);
    expect(hits[0]).toMatchObject({ surah: 2, ayah: 64, editionId: "en.pickthall", editionName: "Mohammed Marmaduke William Pickthall", href: "/surah/2#ayah-64" });
    expect(hits[0]!.text.length).toBeGreaterThan(20);
    expect(new Set(hits.map((h) => h.id)).size).toBe(155); // ids are unique
    expect(parseSearchResponse(RABBI)).toHaveLength(140);
    // the upstream matches inside words: "ease" also finds "eased" and "please"
    expect(parseSearchResponse(EASE).map((h) => `${h.surah}:${h.ayah}`)).toEqual(["94:2", "94:5", "94:6", "94:8"]);
  });

  it("drops a match that is impossible (an ayah 999, surah 115, no text) and keeps the rest", () => {
    const ok = { surah: { number: 2 }, numberInSurah: 255, text: "x", edition: { identifier: "e", englishName: "E" } };
    const hits = parseSearchResponse({ data: { matches: [ok, { ...ok, numberInSurah: 999 }, { ...ok, surah: { number: 115 } }, { ...ok, text: 5 }, { ...ok, numberInSurah: 1.5 }, null, "x", { ...ok, edition: {} }] } });
    expect(hits.map((h) => h.id)).toEqual(["2:255:e"]);
  });

  it("falls back to the edition's other name, then to its identifier", () => {
    const m = (edition: object) => ({ surah: { number: 1 }, numberInSurah: 1, text: "t", edition });
    const h = parseSearchResponse({ data: { matches: [m({ identifier: "a", name: "N" }), m({ identifier: "b" })] } });
    expect(h.map((x) => x.editionName)).toEqual(["N", "b"]);
  });

  it("an answer with no matches array is an error, not an empty list", () => {
    for (const bad of [null, {}, { data: {} }, { data: { matches: "x" } }, [], "<html>", 5]) expect(() => parseSearchResponse(bad)).toThrow(SearchShapeError);
  });
});

describe("selectAyahs: filter the whole answer, then cut to 60", () => {
  const hits = parseSearchResponse(MERCY);
  const none = () => false;

  it("shows at most 60 and reports the true total", () => {
    const { shown, total } = selectAyahs(hits, { juz: null, bookmarkedOnly: false }, none);
    expect(MAX_SHOWN).toBe(60);
    expect(shown).toHaveLength(60);
    expect(total).toBe(155);
    expect(shown).toEqual(hits.slice(0, 60)); // the order the upstream gave
  });

  it("applies the juz filter to ALL matches, not just the first 60 (the legacy page cut first)", () => {
    const j30 = hits.filter((h) => juzOfAyah(h.surah, h.ayah) === 30);
    expect(j30.length).toBeGreaterThan(0);
    const firstSixty = hits.slice(0, 60).filter((h) => juzOfAyah(h.surah, h.ayah) === 30);
    expect(j30.length).toBeGreaterThan(firstSixty.length); // so cutting first would have hidden matches that exist
    const { shown, total } = selectAyahs(hits, { juz: 30, bookmarkedOnly: false }, none);
    expect(total).toBe(j30.length);
    expect(shown.every((h) => juzOfAyah(h.surah, h.ayah) === 30)).toBe(true);
  });

  it("bookmarked only keeps the saved ayahs, from the whole answer, and can be combined with a juz", () => {
    const saved = new Set(["2:64", "5:98", "30:1000"]);
    const isSaved = (s: number, a: number) => saved.has(`${s}:${a}`);
    const r = selectAyahs(hits, { juz: null, bookmarkedOnly: true }, isSaved);
    expect(r.shown.map((h) => `${h.surah}:${h.ayah}`).sort()).toEqual(hits.map((h) => `${h.surah}:${h.ayah}`).filter((k) => saved.has(k)).sort());
    expect(selectAyahs(hits, { juz: 30, bookmarkedOnly: true }, isSaved).total).toBe(0);
  });
});

describe("createAyahSearcher", () => {
  const answer = (json: unknown): Fetcher => async () => json;

  it("returns the hits, and asks the upstream with the trimmed text", async () => {
    const asked: string[] = [];
    const s = createAyahSearcher(async (query) => (asked.push(`${query.text}|${query.scope}|${query.edition}`), MERCY));
    const out = (await s.run(q("  mercy  ", 2, "en.sahih"))) as AyahOutcome;
    expect(out.kind).toBe("ok");
    expect(asked).toEqual(["mercy|2|en.sahih"]);
  });

  it("caches by query, scope and edition for the session (case-insensitive on the text), and a different scope is a different search", async () => {
    let calls = 0;
    const s = createAyahSearcher(async () => (calls++, MERCY));
    await s.run(q("Mercy"));
    await s.run(q("mercy"));
    await s.run(q(" MERCY "));
    expect(calls).toBe(1);
    await s.run(q("mercy", 2));
    await s.run(q("mercy", "all", "en.asad"));
    expect(calls).toBe(3);
    s.clear();
    await s.run(q("mercy"));
    expect(calls).toBe(4);
  });

  it("an empty answer and the upstream's 404 both mean 'none', and 'none' is cached too", async () => {
    let calls = 0;
    const s = createAyahSearcher(async () => {
      calls++;
      throw new HttpError(404);
    });
    expect(await s.run(q("zzzz"))).toEqual({ kind: "none" });
    expect(await s.run(q("zzzz"))).toEqual({ kind: "none" });
    expect(calls).toBe(1);
    const empty = createAyahSearcher(answer({ data: { count: 0, matches: [] } }));
    expect(await empty.run(q("x"))).toEqual({ kind: "none" });
  });

  it("tells a server error, an unreadable answer and no connection apart; none of them is cached", async () => {
    let n = 0;
    const flaky = createAyahSearcher(async () => {
      if (n++ === 0) throw new HttpError(500);
      return MERCY;
    });
    expect(await flaky.run(q("mercy"))).toEqual({ kind: "failed" });
    expect((await flaky.run(q("mercy")))!.kind).toBe("ok"); // asked again, not served from the cache
    expect(await createAyahSearcher(answer({ unexpected: true })).run(q("a"))).toEqual({ kind: "failed" });
    expect(await createAyahSearcher(async () => Promise.reject(new TypeError("Failed to fetch"))).run(q("a"))).toEqual({ kind: "offline" });
    let asked = 0;
    const offline = createAyahSearcher(async () => (asked++, MERCY), () => false);
    expect(await offline.run(q("a"))).toEqual({ kind: "offline" });
    expect(asked).toBe(0); // no request is made when the browser says it is offline
  });

  it("a newer search cancels the older request, and the older answer is ignored even if it arrives last", async () => {
    const resolvers: Array<(v: unknown) => void> = [];
    const signals: AbortSignal[] = [];
    const s = createAyahSearcher((_query, signal) => {
      signals.push(signal);
      return new Promise((res) => resolvers.push(res));
    });
    const first = s.run(q("slow"));
    const second = s.run(q("fast"));
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
    resolvers[1]!(EASE);
    resolvers[0]!(MERCY); // the older one answers last
    expect(await first).toBeNull();
    expect((await second)!.kind).toBe("ok");
    expect(s.size).toBe(1); // only the newer answer was kept
  });

  it("an aborted request that rejects is ignored (null), not reported as a failure", async () => {
    const s = createAyahSearcher((_query, signal) => new Promise((_res, rej) => signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))));
    const first = s.run(q("a1"));
    s.cancel();
    expect(await first).toBeNull();
  });

  it("keeps the 24 most recent answers", async () => {
    const s = createAyahSearcher(answer(EASE));
    for (let i = 0; i < 30; i++) await s.run(q(`word${i}`));
    expect(s.size).toBe(24);
  });
});
