// Stories (Phase 7B): chapters built from the legacy data only, the derived Order line, the "Arranged for study" rule, the tellings, the
// chapter in the URL, long chapters, the entities, the story progress key, and which of story progress and person study Home shows.
import { afterEach, describe, expect, it } from "vitest";
import { AYAH_COUNTS } from "../app/lib/quranMeta";
import {
  ARRANGED_NOTICE, ARRANGED_OVERRIDES, chapterFromQuery, chapterHref, chapterQuery, chaptersOf, entitiesOf, FIRST_AYAHS, filterStories, hasSupporting, isArranged, NARRATIVE_LABELS, NO_STORY_FILTERS, orderLine, peopleInStories,
  STORIES, storyById, storyCountLine, storyFiltersFromQuery, storyFiltersToQuery, storyKey, SUMMARY_LABEL, surahName, tellings, unresolvedIds, visibleAyahs,
} from "../app/lib/stories";
import {
  clearProgress, latestProgress, markRead, newerOf, progressText, readAllProgress, readProgress, recordChapter, restoreProgress, resumeChapter, STORY_PROGRESS_KEY,
} from "../app/lib/storyProgress";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const S = (id: string) => storyById(id)!;

describe("the data", () => {
  it("21 stories; 11 have episodes (38 chapters), 10 do not (11 chapters from the primary passages)", () => {
    expect(STORIES).toHaveLength(21);
    const withEp = STORIES.filter((s) => s.episodes?.length);
    expect(withEp).toHaveLength(11);
    expect(withEp.reduce((n, s) => n + chaptersOf(s).length, 0)).toBe(38);
    const flat = STORIES.filter((s) => !s.episodes?.length);
    expect(flat).toHaveLength(10);
    expect(flat.reduce((n, s) => n + chaptersOf(s).length, 0)).toBe(11);
    expect(chaptersOf(S("ayyubstory"))).toHaveLength(2);
    expect(storyKey("yusufstory")).toBe("story:yusufstory");
  });
  it("every chapter has a title, text of its own to show, and passages inside the real ayah counts", () => {
    let max = 0;
    for (const s of STORIES) {
      const chs = chaptersOf(s);
      expect(chs.length, s.id).toBeGreaterThan(0);
      chs.forEach((c, i) => {
        expect(c.index).toBe(i);
        expect(c.title.trim().length, `${s.id} ${i}`).toBeGreaterThan(0);
        expect(c.summary.trim().length, `${s.id} ${i}`).toBeGreaterThan(0);
        expect(c.passages.length).toBeGreaterThan(0);
        for (const p of c.passages) {
          expect(p.surahNumber).toBeGreaterThanOrEqual(1);
          expect(p.surahNumber).toBeLessThanOrEqual(114);
          expect(p.ayahStart).toBeGreaterThanOrEqual(1);
          expect(p.ayahEnd).toBeGreaterThanOrEqual(p.ayahStart);
          expect(p.ayahEnd, `${s.id} ${i}`).toBeLessThanOrEqual(AYAH_COUNTS[p.surahNumber - 1]!);
        }
        max = Math.max(max, c.ayahs);
      });
    }
    expect(max).toBe(44); // the longest chapter (Yusuf episode 4)
  });
  it("an episode chapter is the episode as the data has it; a flat chapter is its primary passage", () => {
    const y = S("yusufstory");
    expect(chaptersOf(y)[0]).toMatchObject({ title: y.episodes![0]!.title, summary: y.episodes![0]!.summary });
    const q = S("qarunstory");
    expect(chaptersOf(q)[0]).toMatchObject({ title: q.primaryPassages[0]!.title, summary: q.primaryPassages[0]!.description });
  });
});

describe("order and the arranged notice", () => {
  const jumpers = ["adamandiblis", "nuhflood", "ibrahimnarrative", "musaandpharaoh", "musaandbaniisrael", "maryamandisa", "lutandhispeople"];
  it("an Order line only for single-surah stories whose chapters ascend; none for stories that jump between surahs", () => {
    for (const id of jumpers) expect(orderLine(chaptersOf(S(id))), id).toBeNull();
    const y = orderLine(chaptersOf(S("yusufstory")));
    expect(y).toBe(`Order: the surah's own sequence (${surahName(12)} 12:4–101)`);
    for (const id of ["musaandkhidr", "dawudandjalut", "dhulqarnaynstory", "qarunstory"]) expect(orderLine(chaptersOf(S(id))), id).toMatch(/^Order: the surah's own sequence \(/);
    for (const s of STORIES) {
      const line = orderLine(chaptersOf(s));
      const surahs = new Set(chaptersOf(s).flatMap((c) => c.passages.map((p) => p.surahNumber)));
      if (line) expect(surahs.size, s.id).toBe(1);
    }
  });
  it("the arranged notice is for every story that is not fully told in the Qur'an (8) plus the override list (nuhflood): nine stories", () => {
    const byStatus = STORIES.filter((s) => s.narrativeStatus !== "quran_complete");
    expect(byStatus).toHaveLength(8);
    expect([...ARRANGED_OVERRIDES]).toEqual(["nuhflood"]);
    expect([...ARRANGED_OVERRIDES].every((id) => !!storyById(id))).toBe(true);
    const arranged = STORIES.filter(isArranged);
    expect(arranged.map((s) => s.id).sort()).toEqual([...byStatus.map((s) => s.id), "nuhflood"].sort());
    expect(ARRANGED_NOTICE).toBe("This story is assembled from passages in several surahs, in an order chosen for reading.");
    // the sentence says "several surahs": it must be true of each story that carries it (counting every passage the story lists)
    for (const s of arranged) {
      const surahs = new Set([...s.primaryPassages, ...(s.supportingPassages ?? []), ...(s.episodes ?? []).flatMap((e) => e.passages)].map((p) => p.surahNumber));
      expect(surahs.size, s.id).toBeGreaterThan(1);
    }
  });
  it("every override is a story whose data really contradicts its label: 'fully told' but its chapters span several surahs", () => {
    for (const id of ARRANGED_OVERRIDES) {
      const s = S(id);
      expect(s.narrativeStatus).toBe("quran_complete");
      expect(new Set(chaptersOf(s).flatMap((c) => c.passages.map((p) => p.surahNumber))).size).toBeGreaterThan(1);
    }
  });
  it("the status labels are the legacy ones; the summary label is the approved one", () => {
    expect(NARRATIVE_LABELS.quran_complete).toBe("Fully told in the Qur'an");
    expect(SUMMARY_LABEL).toBe("Summary (written for this app)");
  });
});

describe("Compare tellings lists the data's own words", () => {
  it("32 primary passages all described; 13 supporting, none described (they say so); nothing is written here", () => {
    const rows = STORIES.flatMap((s) => tellings(s));
    expect(rows.filter((r) => r.kind === "Primary")).toHaveLength(32);
    expect(rows.filter((r) => r.kind === "Supporting")).toHaveLength(13);
    expect(rows.filter((r) => r.kind === "Primary").every((r) => !!r.description)).toBe(true);
    expect(rows.filter((r) => r.kind === "Supporting").every((r) => r.description === null)).toBe(true);
    expect(rows.every((r) => r.ayahs === r.ref.ayahEnd - r.ref.ayahStart + 1)).toBe(true);
    expect(STORIES.filter(hasSupporting)).toHaveLength(8);
  });
});

describe("the chapter in the URL and long chapters", () => {
  it("1-based chapter, end, and anything else opens the first", () => {
    expect(chapterFromQuery("3", 4)).toBe(2);
    expect(chapterFromQuery("end", 4)).toBe("end");
    for (const bad of [undefined, "0", "5", "-1", "x", "2.5", ["9"], ""]) expect(chapterFromQuery(bad, 4), String(bad)).toBe(0);
    expect(chapterFromQuery(["2", "3"], 4)).toBe(1);
    expect(chapterQuery(0)).toEqual({});
    expect(chapterQuery(2)).toEqual({ chapter: "3" });
    expect(chapterQuery("end")).toEqual({ chapter: "end" });
    expect(chapterHref("yusufstory", 1)).toBe("/stories/yusufstory?chapter=2");
    expect(chapterHref("yusufstory", 0)).toBe("/stories/yusufstory");
  });
  it("the first 8 ayahs show, then Show all; short chapters show everything", () => {
    expect(FIRST_AYAHS).toBe(8);
    const long = chaptersOf(S("yusufstory"))[3]!; // 44 ayahs
    const first = visibleAyahs(long, false);
    expect(first.reduce((n, p) => n + (p.ayahEnd - p.ayahStart + 1), 0)).toBe(8);
    expect(first[0]!.ayahStart).toBe(long.passages[0]!.ayahStart);
    expect(visibleAyahs(long, true)).toEqual(long.passages);
    const short = chaptersOf(S("peopleofthetrenchstory"))[0]!;
    expect(short.ayahs).toBeLessThanOrEqual(8);
    expect(visibleAyahs(short, false)).toEqual(short.passages);
  });
});

describe("the entities come from the data", () => {
  it("every id a story names is reported if it does not resolve (and the page shows only what resolves)", () => {
    const missing = STORIES.flatMap((s) => unresolvedIds(s).map((m) => `${s.id}:${m}`));
    expect(missing).toEqual([]);
  });
  it("people link to their page (7A) and peoples to theirs (Phase 12); places and events to theirs", () => {
    const e = entitiesOf(S("yusufstory"));
    expect(e.people.length).toBeGreaterThan(0);
    expect(e.people.every((p) => p.href === `/persons/${p.id}`)).toBe(true);
    const all = STORIES.map(entitiesOf);
    expect(all.flatMap((x) => x.communities).every((x) => x.href === `/peoples/${x.id}`)).toBe(true);
    expect(all.flatMap((x) => x.communities).length).toBeGreaterThan(0);
    expect(all.flatMap((x) => x.places).every((x) => x.href === `/places/${x.id}`)).toBe(true);
    expect(all.flatMap((x) => x.events).every((x) => x.href === `/events/${x.id}`)).toBe(true);
    expect(all.flatMap((x) => x.places).length).toBeGreaterThan(0);
  });
});

describe("the directory", () => {
  it("search, type, person and Saved filters; URL state", () => {
    expect(filterStories(NO_STORY_FILTERS, new Set())).toHaveLength(21);
    expect(filterStories({ ...NO_STORY_FILTERS, q: "yusuf" }, new Set()).map((s) => s.id)).toContain("yusufstory");
    expect(filterStories({ ...NO_STORY_FILTERS, person: "musa" }, new Set()).length).toBeGreaterThan(2);
    expect(filterStories({ ...NO_STORY_FILTERS, saved: true }, new Set(["qarunstory"])).map((s) => s.id)).toEqual(["qarunstory"]);
    expect(filterStories({ ...NO_STORY_FILTERS, saved: true }, new Set())).toEqual([]);
    const f = { q: "x", type: "prophetic_narrative" as const, person: "musa", saved: true };
    expect(storyFiltersFromQuery(storyFiltersToQuery(f))).toEqual(f);
    expect(storyFiltersFromQuery({ type: "bogus", person: "nobody", saved: "yes" })).toEqual(NO_STORY_FILTERS);
    expect(storyCountLine(21, 21)).toBe("21 stories");
    expect(storyCountLine(2, 21)).toBe("2 of 21 stories");
    expect(peopleInStories().length).toBe(44);
  });
});

describe("story progress: quran:story-progress:v1", () => {
  it("the resume point is the chapter last on; read is only added by reaching the end or Next; reading never marks by time", () => {
    setStorageBackend(memoryStore({}));
    expect(readProgress("yusufstory")).toBeNull();
    recordChapter("yusufstory", 1, 100);
    expect(readProgress("yusufstory")).toEqual({ chapter: 1, read: [], updatedAt: 100 });
    markRead("yusufstory", 1, 200);
    markRead("yusufstory", 1, 210); // twice is once
    markRead("yusufstory", 0, 220);
    expect(readProgress("yusufstory")).toEqual({ chapter: 1, read: [0, 1], updatedAt: 220 });
    recordChapter("yusufstory", 2, 300);
    expect(readProgress("yusufstory")).toEqual({ chapter: 2, read: [0, 1], updatedAt: 300 });
    expect(getJSON<{ v: number }>(STORY_PROGRESS_KEY, { v: 0 }).v).toBe(1);
  });
  it("clear removes only that story and restores exactly; other stories are kept", () => {
    setStorageBackend(memoryStore({}));
    recordChapter("a", 1, 1);
    recordChapter("b", 2, 2);
    const before = clearProgress("a");
    expect(before).toEqual({ chapter: 1, read: [], updatedAt: 1 });
    expect(Object.keys(readAllProgress())).toEqual(["b"]);
    expect(clearProgress("a")).toBeNull();
    restoreProgress("a", before!);
    expect(readProgress("a")).toEqual(before);
  });
  it("damaged records are read as empty and never throw; bad entries are skipped", () => {
    for (const bad of ["{oops", "null", "[]", '"x"', '{"v":1}', '{"v":1,"stories":[]}']) {
      setStorageBackend(memoryStore({ [STORY_PROGRESS_KEY]: bad }));
      expect(readAllProgress()).toEqual({});
      expect(recordChapter("a", 0, 1)).toBe(true);
      expect(readProgress("a")?.chapter).toBe(0);
    }
    setStorageBackend(memoryStore({ [STORY_PROGRESS_KEY]: JSON.stringify({ v: 1, stories: { ok: { chapter: 2, read: [0, "x", 0, -1, 1.5], updatedAt: 5 }, nope: { chapter: 1 }, worse: 7, neg: { chapter: -3, read: "no", updatedAt: 9 } } }) }));
    expect(readAllProgress()).toEqual({ ok: { chapter: 2, read: [0], updatedAt: 5 }, neg: { chapter: 0, read: [], updatedAt: 9 } });
  });
  it("progress text, the resume chapter and the finished state", () => {
    expect(progressText(null, 4)).toBe("Not started");
    expect(progressText({ chapter: 0, read: [], updatedAt: 1 }, 4)).toBe("Not started");
    expect(progressText({ chapter: 2, read: [0, 1], updatedAt: 1 }, 4)).toBe("Chapter 3 of 4");
    expect(progressText({ chapter: 4, read: [0, 1, 2, 3], updatedAt: 1 }, 4)).toBe("Finished");
    expect(resumeChapter(null, 4)).toBe(0);
    expect(resumeChapter({ chapter: 2, read: [], updatedAt: 1 }, 4)).toBe(2);
    expect(resumeChapter({ chapter: 4, read: [], updatedAt: 1 }, 4)).toBe("end");
    setStorageBackend(memoryStore({}));
    recordChapter("yusufstory", 9, 1);
    expect(readProgress("yusufstory", 4)?.chapter).toBe(4); // a stale value is clamped to the real chapter count
  });
  it("legacy keys are untouched by story progress", () => {
    const store = memoryStore({ "quran:persons-study:v1": JSON.stringify({ nuh: { personId: "nuh", lastSection: "family", passageView: "surah", updatedAt: 5 } }), "quran:bookmarks:v1": '["story:yusufstory"]' });
    setStorageBackend(store);
    const before = [store.data.get("quran:persons-study:v1"), store.data.get("quran:bookmarks:v1")];
    recordChapter("yusufstory", 1, 10);
    markRead("yusufstory", 0, 11);
    clearProgress("yusufstory");
    expect([store.data.get("quran:persons-study:v1"), store.data.get("quran:bookmarks:v1")]).toEqual(before);
  });
});

describe("Home and the Library show whichever is newer: story progress or person study", () => {
  const person = { updatedAt: 100, name: "p" };
  const story = { updatedAt: 200, name: "s" };
  it("the newer one wins", () => {
    expect(newerOf(person, story)).toEqual({ kind: "story", value: story });
    expect(newerOf({ ...person, updatedAt: 300 }, story)?.kind).toBe("person");
  });
  it("a tie goes to the story", () => {
    expect(newerOf({ ...person, updatedAt: 200 }, story)?.kind).toBe("story");
  });
  it("each source being absent", () => {
    expect(newerOf(person, null)).toEqual({ kind: "person", value: person });
    expect(newerOf(null, story)).toEqual({ kind: "story", value: story });
    expect(newerOf(null, null)).toBeNull();
  });
  it("the latest progress skips a story that is not in the data and one with nothing to resume", () => {
    const map = { yusufstory: { chapter: 2, read: [0, 1], updatedAt: 50 }, gone: { chapter: 1, read: [], updatedAt: 90 }, fresh: { chapter: 0, read: [], updatedAt: 99 }, musaandkhidr: { chapter: 1, read: [0], updatedAt: 40 } };
    const totals = (id: string) => (storyById(id) ? chaptersOf(storyById(id)!).length : id === "fresh" ? 3 : undefined);
    expect(latestProgress(map, totals)).toMatchObject({ id: "yusufstory", total: 4 });
    expect(latestProgress({}, totals)).toBeNull();
  });
});
