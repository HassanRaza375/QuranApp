// Prophets & People (Phase 7A): the adapters over the legacy data: search, category and Saved, URL state, chronology wording, the timeline,
// relationship sentences (and a consistency check over every pair), the stories that involve a person, the legacy study record and the
// tab-to-section mapping. Nothing here types content about a person: it all comes from the legacy data.
import { afterEach, describe, expect, it } from "vitest";
import { buildTimeline } from "@legacy/utils/personsTimeline";
import { getMostRecentlyStudied } from "@legacy/utils/personStudy";
import {
  CATEGORY_OPTIONS, chronologyInfo, countLine, displayName, filterCategory, filterPeople, filtersFromQuery, filtersToQuery, kinshipFact, NARRATIVE_LABELS, NO_FILTERS, PEOPLE, personById, personKey,
  relationLines, relationSentence, HIDDEN_STATUS_CHIPS, REVERSED_ENTRIES, searchPeople, sectionForTab, statusLabel, STATUS_LABELS, STORIES_READY, storiesFor, storyHref, tabForSection, tabFromQuery,
} from "../app/lib/people";
import { forgetStudy, readStudy, recordPassageView, recordReference, recordSection, STUDY_KEY } from "../app/lib/peopleStudy";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const ids = (l: { id: string }[]) => l.map((p) => p.id);
const P = (id: string) => personById(id)!;

describe("the data", () => {
  it("has the 59 entries, each with a name and an Arabic name", () => {
    expect(PEOPLE).toHaveLength(59);
    for (const p of PEOPLE) {
      expect(p.name.length, p.id).toBeGreaterThan(0);
      expect(p.arabicName.length, p.id).toBeGreaterThan(0);
    }
    expect(personKey("nuh")).toBe("person:nuh");
    expect(personById("nope")).toBeUndefined();
  });
  it("names show with the honorific the data gives, and without one when it gives none", () => {
    expect(displayName(P("ibrahim"))).toBe(`Ibrahim (${P("ibrahim").honorific!.short})`);
    const none = PEOPLE.find((p) => !p.honorific?.short)!;
    expect(displayName(none)).toBe(none.name);
  });
});

describe("search covers names, Arabic, the short description and themes; not passage text", () => {
  it("finds by English name, Arabic name (with or without marks) and alternate names", () => {
    expect(ids(searchPeople(PEOPLE, "yusuf"))).toContain("yusuf");
    expect(ids(searchPeople(PEOPLE, P("yusuf").arabicName))).toContain("yusuf");
    const bare = P("nuh").arabicName.replace(/[ً-ٰٟ]/g, "");
    expect(ids(searchPeople(PEOPLE, bare))).toContain("nuh");
    const withAlt = PEOPLE.find((p) => p.alternateNames?.length)!;
    expect(ids(searchPeople(PEOPLE, withAlt.alternateNames![0]!))).toContain(withAlt.id);
  });
  it("finds by a theme and by a word of the short description; ignores case and accents", () => {
    const themed = PEOPLE.find((p) => p.themes?.length)!;
    expect(ids(searchPeople(PEOPLE, themed.themes![0]!.toUpperCase()))).toContain(themed.id);
    const word = PEOPLE[5]!.shortDescription.split(" ").find((w) => w.length > 6)!;
    expect(ids(searchPeople(PEOPLE, word))).toContain(PEOPLE[5]!.id);
  });
  it("does not use an ayah reference or passage text as a search (a bare 11:25 matches nothing)", () => {
    expect(searchPeople(PEOPLE, "11:25")).toEqual([]);
    const withDesc = PEOPLE.flatMap((p) => p.relatedPassages.map((r) => r.description).filter(Boolean) as string[]);
    const only = withDesc.find((d) => !PEOPLE.some((p) => normalizeLoose(`${p.name} ${p.arabicName} ${(p.alternateNames ?? []).join(" ")} ${p.shortDescription} ${(p.themes ?? []).join(" ")}`).includes(normalizeLoose(d.slice(0, 30)))));
    if (only) expect(searchPeople(PEOPLE, only.slice(0, 30))).toEqual([]);
  });
  it("an empty or blank query returns everyone; nonsense returns no one", () => {
    expect(searchPeople(PEOPLE, "")).toHaveLength(59);
    expect(searchPeople(PEOPLE, "   ")).toHaveLength(59);
    expect(searchPeople(PEOPLE, "xylophone")).toEqual([]);
  });
});
const normalizeLoose = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ");

describe("category, Saved and the URL state", () => {
  it("the eight legacy categories; primary or secondary matches", () => {
    expect(CATEGORY_OPTIONS.map((c) => c.value)).toEqual(["all", "prophet", "woman", "man", "ruler_leader", "companion", "family_relative", "other"]);
    expect(filterCategory(PEOPLE, "all")).toHaveLength(59);
    expect(filterCategory(PEOPLE, "prophet").length).toBe(25 + PEOPLE.filter((p) => p.primaryCategory !== "prophet" && p.secondaryCategories?.includes("prophet")).length);
    const total = CATEGORY_OPTIONS.filter((c) => c.value !== "all").reduce((n, c) => n + PEOPLE.filter((p) => p.primaryCategory === c.value).length, 0);
    expect(total).toBe(59);
  });
  it("Saved keeps only saved ids; filters combine", () => {
    const saved = new Set(["yusuf", "musa", "nuh"]);
    expect(ids(filterPeople({ ...NO_FILTERS, saved: true }, saved)).sort()).toEqual(["musa", "nuh", "yusuf"]);
    expect(ids(filterPeople({ q: "musa", category: "prophet", saved: true }, saved))).toEqual(["musa"]);
    expect(filterPeople({ ...NO_FILTERS, saved: true }, new Set())).toEqual([]);
  });
  it("URL state round-trips and ignores anything unknown", () => {
    const f = { q: "nuh", category: "prophet" as const, saved: true };
    expect(filtersFromQuery(filtersToQuery(f))).toEqual(f);
    expect(filtersToQuery(NO_FILTERS)).toEqual({});
    expect(filtersFromQuery({ category: "wizard", saved: "yes", q: ["a", "b"] })).toEqual({ q: "a", category: "all", saved: false });
  });
  it("the count line", () => {
    expect(countLine(59, 59)).toBe("59 people");
    expect(countLine(3, 59)).toBe("3 of 59 people");
  });
});

describe("chronology and status wording come from the legacy data", () => {
  it("an established chronology reads plain; every other status is qualified and dashed", () => {
    const strong = PEOPLE.find((p) => p.chronology?.status === "strong")!;
    expect(chronologyInfo(strong)).toEqual({ text: strong.chronology!.label ?? "", dashed: false });
    for (const status of ["traditional", "uncertain", "unknown"] as const) {
      const p = PEOPLE.find((x) => x.chronology?.status === status)!;
      const c = chronologyInfo(p);
      expect(c?.dashed, status).toBe(true);
      expect(c!.text.toLowerCase(), status).toContain(status === "traditional" ? "traditional" : status);
    }
    const none = PEOPLE.find((p) => !p.chronology);
    if (none) expect(chronologyInfo(none)).toBeNull();
  });
  it("the prophetic-status chip is the legacy three labels, and nothing for any other type", () => {
    expect(STATUS_LABELS).toEqual({ prophet: "Prophet", messenger: "Messenger", prophet_and_messenger: "Prophet · Messenger" });
    for (const p of PEOPLE) {
      if (p.personType === "prophet" || p.personType === "messenger" || p.personType === "prophet_and_messenger") expect(statusLabel(p), p.id).toBe(STATUS_LABELS[p.personType]);
      else expect(statusLabel(p), p.id).toBeNull();
    }
  });
  it("the per-entry hide flag exists, is empty by default, and every id in it is a real person", () => {
    expect([...HIDDEN_STATUS_CHIPS].every((id) => !!personById(id))).toBe(true);
    expect(HIDDEN_STATUS_CHIPS.size).toBe(0); // nothing is hidden until the review says so
  });
  it("the story kinds are the legacy labels", () => {
    expect(NARRATIVE_LABELS).toEqual({ quran_complete: "Fully told in the Qur'an", quran_primary_traditional_expansion: "Qur'an core, traditionally expanded", quran_fragmentary: "Pieced together across surahs" });
  });
});

describe("the timeline: nobody is lost", () => {
  const t = buildTimeline(PEOPLE);
  it("the mainline is in chronological order and only prophets with an order", () => {
    const orders = t.mainline.map((n) => n.person.chronology!.order as number);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(t.mainline.every((n) => n.person.primaryCategory === "prophet")).toBe(true);
    expect(t.mainline.length).toBeGreaterThan(15);
  });
  it("every one of the 59 is on the line, a branch of someone on it, or in the unlinked group", () => {
    const seen = new Set<string>([...t.mainline.map((n) => n.person.id), ...t.mainline.flatMap((n) => n.branches.map((b) => b.personId)), ...t.unlinked.map((p) => p.id)]);
    for (const p of PEOPLE) expect(seen.has(p.id), p.id).toBe(true);
    expect(t.unlinked.every((p) => !t.mainline.some((n) => n.person.id === p.id))).toBe(true);
  });
});

describe("relationships as sentences", () => {
  const rel = (a: string, b: string) => P(a).relationships!.find((r) => r.personId === b)!;
  const s = (a: string, b: string) => relationSentence(a, rel(a, b));
  it("directed kinship reads as a full sentence from the page person's side", () => {
    expect(s("ibrahim", "ismail")).toBe(`${displayName(P("ibrahim"))} is the father of ${displayName(P("ismail"))}`);
    expect(s("ismail", "ibrahim")).toBe(`${displayName(P("ismail"))} is the son of ${displayName(P("ibrahim"))}`);
    expect(s("ibrahim", "azar")).toBe(`${displayName(P("ibrahim"))} is the son of ${displayName(P("azar"))}`);
    expect(s("azar", "ibrahim")).toBe(`${displayName(P("azar"))} is the father of ${displayName(P("ibrahim"))}`);
    expect(s("adam", "isa")).toBe(`${displayName(P("adam"))} is an ancestor of ${displayName(P("isa"))}`);
    expect(s("yusuf", "ibrahim")).toBe(`${displayName(P("yusuf"))} is a descendant of ${displayName(P("ibrahim"))}`);
    expect(s("dawud", "sulaiman")).toBe(`${displayName(P("dawud"))} is the father of ${displayName(P("sulaiman"))}`);
  });
  it("the three entries written the other way round still read correctly", () => {
    expect([...REVERSED_ENTRIES].sort()).toEqual(["isa>maryam", "maryam>isa", "maryam>maryammother"]);
    expect(s("isa", "maryam")).toBe(`${displayName(P("maryam"))} is the mother of ${displayName(P("isa"))}`);
    expect(s("maryam", "isa")).toBe(`${displayName(P("isa"))} is the son of ${displayName(P("maryam"))}`);
    expect(s("maryam", "maryammother")).toBe(`${displayName(P("maryammother"))} is the mother of ${displayName(P("maryam"))}`);
    expect(s("maryammother", "maryam")).toBe(`${displayName(P("maryammother"))} is the mother of ${displayName(P("maryam"))}`);
  });
  it("types that have no direction in the data are shown without a verb", () => {
    expect(s("nuh", "nuhwife")).toBe(`${displayName(P("nuh"))} and ${displayName(P("nuhwife"))}: spouses`);
    expect(s("musa", "firaun")).toContain(": opponents");
    expect(s("musa", "khidr")).toContain(": teacher and student");
    expect(s("musa", "musawarner")).toContain(": other relationship");
  });
  it("a group as the subject uses the plural form where there is one", () => {
    expect(P("yusufbrothers").entityType).toBe("group");
    expect(s("yusufbrothers", "yaqub")).toMatch(/ are sons of /);
    expect(s("yusuf", "yusufbrothers")).toMatch(/ is a brother of /);
  });
  it("every relationship of every person produces a sentence naming both people, a source and a link", () => {
    let n = 0;
    for (const p of PEOPLE) for (const l of relationLines(p)) {
      n++;
      expect(l.sentence, p.id).toContain(displayName(p).split(" (")[0]!);
      expect(l.source.length).toBeGreaterThan(0);
      expect(l.related.href === null || l.related.href.startsWith("/persons/")).toBe(true);
    }
    expect(n).toBe(81);
  });
  it("consistency: where both sides state a parent or ancestor fact, they state the SAME fact", () => {
    const conflicts: string[] = [];
    for (const a of PEOPLE) for (const r of a.relationships ?? []) {
      const f = kinshipFact(a.id, r);
      if (!f) continue;
      for (const back of personById(r.personId)?.relationships?.filter((x) => x.personId === a.id) ?? []) {
        const g = kinshipFact(r.personId, back);
        if (g && (g.kind !== f.kind || g.elder !== f.elder || g.younger !== f.younger)) conflicts.push(`${a.id}>${r.personId}`);
      }
    }
    expect(conflicts).toEqual([]);
  });
  it("other pair mismatches in the data are known and listed, so a new one fails here (reported, not fixed)", () => {
    const noReverse: string[] = [];
    for (const a of PEOPLE) for (const r of a.relationships ?? []) {
      if (!(personById(r.personId)?.relationships ?? []).some((x) => x.personId === a.id)) noReverse.push(`${a.id}>${r.personId}`);
    }
    expect([...new Set(noReverse)].sort()).toEqual(["adam>isa", "jalut>dawud", "jalut>talut", "musa>haman", "yusuf>ibrahim", "yusufbrothers>yaqub", "zayd>muhammad"]);
  });
});

describe("the stories that involve a person", () => {
  it("44 of the 59 are in at least one story; the other 15 get the no-story sentence", () => {
    const withStory = PEOPLE.filter((p) => storiesFor(p.id).length > 0);
    expect(withStory).toHaveLength(44);
    expect(PEOPLE.length - withStory.length).toBe(15);
    expect(storiesFor("adam").map((x) => x.id)).toContain("adamandiblis");
  });
  it("the reader flag is on (7B) and every story has a route to follow", () => {
    expect(STORIES_READY.reader).toBe(true);
    expect(storyHref("adamandiblis")).toBe("/stories/adamandiblis");
  });
});

describe("the legacy study record and the tabs", () => {
  it("each tab is written as one of the six legacy section ids and read back to the same tab", () => {
    expect(sectionForTab("story")).toBe("overview");
    expect(sectionForTab("passages")).toBe("direct-mentions");
    expect(sectionForTab("passages", "surah")).toBe("related-passages");
    expect(sectionForTab("family")).toBe("family");
    for (const s of ["overview", "key-lessons"]) expect(tabForSection(s)).toBe("story");
    for (const s of ["direct-mentions", "related-passages"]) expect(tabForSection(s)).toBe("passages");
    for (const s of ["family", "notes"]) expect(tabForSection(s)).toBe("family");
    expect(tabFromQuery("passages")).toBe("passages");
    expect(tabFromQuery("bogus")).toBe("story");
  });
  it("writes the legacy record shape, keeps other people's records, and Home's most-recent lookup still works", () => {
    const store = memoryStore({ [STUDY_KEY]: JSON.stringify({ musa: { personId: "musa", lastSection: "family", passageView: "surah", updatedAt: 5 }, future: { odd: true } }) });
    setStorageBackend(store);
    recordSection("nuh", "direct-mentions", 100);
    recordPassageView("nuh", "story", 200);
    recordReference("nuh", 11, 25, 300);
    const rec = getJSON<Record<string, unknown>>(STUDY_KEY, {});
    expect(rec.nuh).toEqual({ personId: "nuh", lastSection: "direct-mentions", passageView: "story", lastSurahNo: 11, lastAyahNo: 25, updatedAt: 300 });
    expect(rec.musa).toMatchObject({ lastSection: "family", updatedAt: 5 });
    expect(rec.future).toEqual({ odd: true });
    expect(getMostRecentlyStudied(rec as never)?.personId).toBe("nuh");
    expect(readStudy("nuh")?.lastSurahNo).toBe(11);
    expect(readStudy("unknown")).toBeNull();
    expect(forgetStudy("nuh")).toBe(true);
    expect(readStudy("nuh")).toBeNull();
  });
  it("a damaged record is read as empty and never throws", () => {
    for (const bad of ["{oops", "null", "[]", '"x"']) {
      setStorageBackend(memoryStore({ [STUDY_KEY]: bad }));
      expect(readStudy("nuh")).toBeNull();
      expect(recordSection("nuh", "overview", 1)).toBe(true);
      expect(readStudy("nuh")?.lastSection).toBe("overview");
    }
  });
});
