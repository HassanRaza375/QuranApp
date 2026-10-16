// Runs the reader's own validators against the REAL responses of quranapi.pages.dev: all 114 chapters, and a spread of tafsir
// ayahs. The unit and browser tests use synthetic text; this is the check that the real shape still parses.
import { describe, expect, it } from "vitest";
import { bismillahFrom, parseChapter, parseTafsir, showsBismillah } from "~/lib/chapter";

const BASE = "https://quranapi.pages.dev/api";

describe("real data", () => {
  it("all 114 chapters validate, and the bismillah facts hold", async () => {
    const chapters = [];
    for (let n = 1; n <= 114; n++) {
      const r = await fetch(`${BASE}/${n}.json`);
      expect(r.status, `surah ${n}`).toBe(200);
      chapters.push(parseChapter(await r.json(), n));
    }
    const bism = bismillahFrom(chapters[0])!;
    // the first ayah of every other surah must NOT already begin with the bismillah (or it would show twice)
    const startsWith = chapters.filter((c) => c.n !== 1 && c.arabic1[0]!.startsWith(bism.slice(0, 12))).length;
    const shown = Array.from({ length: 114 }, (_, i) => i + 1).filter(showsBismillah).length;
    console.log(`REAL chapters validated: ${chapters.length}; ayah 1 starting with the bismillah (surahs other than 1): ${startsWith}; surahs that show it: ${shown}`);
    expect(startsWith).toBe(0);
  });

  it("tafsir responses for a spread of ayahs validate", async () => {
    const samples = [[1, 1], [2, 255], [2, 286], [9, 1], [18, 10], [36, 1], [55, 13], [112, 1], [114, 6], [3, 133]];
    for (const [s, a] of samples) {
      const r = await fetch(`${BASE}/tafsir/${s}_${a}.json`);
      expect(r.status, `${s}:${a}`).toBe(200);
      const t = parseTafsir(await r.json());
      console.log("REAL tafsir", `${s}:${a}`, t.map((x) => `${x.author}${x.groupVerse ? "*" : ""}:${x.content.length}`).join(" | "));
      expect(t.length).toBeGreaterThanOrEqual(1);
    }
  });
});
