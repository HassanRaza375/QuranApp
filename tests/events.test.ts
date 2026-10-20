// Phase 8B: Events. The calendar service's Gregorian months (recorded REAL responses in tests/fixtures), the 29 legacy events placed on the
// service's own days with the Hijri adjustment for display only, the tradition tag and filter rules, the reviewed-events file shape, and the
// reminders list in its legacy shape. Nothing is placed by a formula.
import fs from "node:fs";
import path from "node:path";
import { ISLAMIC_EVENTS } from "@legacy/utils/islamicEvents";
import { afterEach, describe, expect, it } from "vitest";
import { addDaysKey } from "../app/lib/dayKeys";
import { gregorianMonthKey, gregorianMonthUrl, monthRange, normalizeGregorianMonth, shiftMonth, windowEnd, type GregorianMonthRecord } from "../app/lib/gregorianMonths";
import * as E from "../app/lib/islamicEvents";
import * as R from "../app/lib/reminders";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { getGregorianMonth, type HijriDeps } from "../app/services/hijri.service";
import { memoryStore } from "./helpers";
import reviewedShipped from "../app/data/events/reviewed-events.json";

afterEach(() => setStorageBackend(null));
const FX = path.resolve(__dirname, "fixtures");
const raw = (m: string) => JSON.parse(fs.readFileSync(path.join(FX, `aladhan-gtoh-${m}.json`), "utf8")) as { code: number; data: Array<{ hijri: Record<string, unknown> & { date: string; day: string; month: { number: number; en: string } }; gregorian: { date: string } }> };
const MONTHS = ["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04"];
const rec = (m: string): GregorianMonthRecord => {
  const r = normalizeGregorianMonth(raw(m), m, 1000);
  if (!r.ok) throw new Error(`${m}: ${r.reason}`);
  return r.record;
};
const all = () => MONTHS.map(rec);
const TODAY = "2026-10-15";
const place = (over: Partial<E.PlaceInput> = {}) => E.placeEvents({ events: E.legacyEvents(), months: all(), adjust: 0, today: TODAY, end: windowEnd(TODAY, 6), ...over });

describe("the recorded real calendar months", () => {
  it("every recorded month from Sep 2026 to Sep 2027 is accepted, and the key and URL are right", () => {
    for (const m of [...MONTHS, "2027-05", "2027-06", "2027-07", "2027-08", "2027-09"]) {
      const r = normalizeGregorianMonth(raw(m), m, 1);
      expect(r.ok, m).toBe(true);
    }
    expect(gregorianMonthKey("2027-02")).toBe("g:2027-02");
    expect(gregorianMonthUrl("https://api.aladhan.com/v1", "2027-02")).toBe("https://api.aladhan.com/v1/gToHCalendar/2/2027");
    expect(rec("2027-02").method).toBe("HJCoSA");
    expect(rec("2027-02").days).toHaveLength(28);
  });
  it("agrees with the prayer cache's Hijri dates for all 31 days of October 2026 (the same calendar)", () => {
    const cache = JSON.parse(fs.readFileSync(path.join(FX, "aladhan-lahore-2026-10-sunni.json"), "utf8")) as { data: Array<{ date: { gregorian: { date: string }; hijri: { date: string } } }> };
    const r = rec("2026-10");
    let n = 0;
    for (const d of cache.data) {
      const day = r.days.find((x) => x.date === d.date.gregorian.date.split("-").reverse().join("-"))!;
      expect(`${String(day.hDay).padStart(2, "0")}-${String(day.hMonth).padStart(2, "0")}-${day.hYear}`).toBe(d.date.hijri.date);
      n++;
    }
    expect(n).toBe(31);
  });
  it("agrees with the Ramadan month recorded in 8A: its 29 days are exactly the Hijri month 9 days of Feb and Mar 2027", () => {
    const ram = JSON.parse(fs.readFileSync(path.join(FX, "aladhan-htog-1448-09.json"), "utf8")) as { data: Array<{ gregorian: { date: string }; hijri: { day: string } }> };
    const days = [...rec("2027-02").days, ...rec("2027-03").days].filter((d) => d.hMonth === 9);
    expect(days.map((d) => d.date)).toEqual(ram.data.map((d) => d.gregorian.date.split("-").reverse().join("-")));
    expect(days.map((d) => d.hDay)).toEqual(ram.data.map((d) => Number(d.hijri.day)));
  });
  it("a response is rejected, never shown or stored, when anything is off", () => {
    const good = () => JSON.parse(JSON.stringify(raw("2026-10"))) as ReturnType<typeof raw>;
    expect(normalizeGregorianMonth({ code: 500 }, "2026-10", 1).ok).toBe(false);
    const short = good();
    short.data.pop();
    expect(normalizeGregorianMonth(short, "2026-10", 1).ok).toBe(false);
    expect(normalizeGregorianMonth(raw("2026-10"), "2026-11", 1).ok).toBe(false); // the wrong month
    const jump = good();
    jump.data[5]!.hijri.day = "20";
    expect(normalizeGregorianMonth(jump, "2026-10", 1).ok).toBe(false);
    const badMonth = good();
    badMonth.data[2]!.hijri.month.number = 13;
    expect(normalizeGregorianMonth(badMonth, "2026-10", 1).ok).toBe(false);
    const noMethod = good();
    for (const d of noMethod.data) delete d.hijri.method;
    expect(normalizeGregorianMonth(noMethod, "2026-10", 1).ok).toBe(false);
    const badDate = good();
    badDate.data[0]!.gregorian.date = "31-02-2026";
    expect(normalizeGregorianMonth(badDate, "2026-10", 1).ok).toBe(false);
  });
  it("month ranges and the window end", () => {
    expect(monthRange("2026-11", 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(windowEnd("2026-10-15", 6)).toBe("2027-03-31");
    expect(windowEnd("2026-10-15", 1)).toBe("2026-10-31");
  });
});

describe("the 29 legacy events", () => {
  it("every event of the legacy file, with a stable unique id; 14 shared, 13 Ja'fari, 2 Sunni; 9 notes", () => {
    const ev = E.legacyEvents();
    expect(ev).toHaveLength(29);
    expect(ev).toHaveLength(ISLAMIC_EVENTS.length);
    expect(new Set(ev.map((e) => e.id)).size).toBe(29);
    const by = (t: string) => ev.filter((e) => e.tradition === t).length;
    expect([by("shared"), by("jafari"), by("sunni")]).toEqual([14, 13, 2]);
    expect(ev.filter((e) => e.note)).toHaveLength(9);
    ev.forEach((e, i) => {
      const src = (ISLAMIC_EVENTS as Array<{ month: number; day: number; name: string; category: string; dateNote?: string }>)[i]!;
      expect([e.month, e.day, e.name, e.category, e.note]).toEqual([src.month, src.day, src.name, src.category, src.dateNote]); // nothing added or changed
      expect(e.origin).toBe("legacy");
    });
    expect(ev.find((e) => e.name === "Ashura")!.note).toContain("Observed differently across traditions");
  });
  it("the Hijri day that holds more than one entry: 27 Rajab, 15 Sha'ban and 21 Ramadan", () => {
    const ev = E.legacyEvents();
    const dup = (m: number, d: number) => ev.filter((e) => e.month === m && e.day === d).map((e) => e.tradition).sort();
    expect(dup(7, 27)).toEqual(["jafari", "sunni"]);
    expect(dup(8, 15)).toEqual(["jafari", "shared"]);
    expect(dup(9, 21)).toEqual(["jafari", "shared"]);
  });
});

describe("placing events on the service's own days", () => {
  it("the first six months from 15 Oct 2026: 18 events, each on the day the service gives for its Hijri date", () => {
    const p = place();
    expect(p).toHaveLength(18);
    // an independent check straight from the recorded responses: for each placed event, the service's day for that Hijri month and day
    for (const x of p) {
      const hit = MONTHS.flatMap((m) => raw(m).data).find((d) => Number(d.hijri.month.number) === x.event.month && Number(d.hijri.day) === x.event.day && d.gregorian.date.split("-").reverse().join("-") === x.date);
      expect(hit, `${x.event.name} on ${x.date}`).toBeTruthy();
    }
    expect(p[0]).toMatchObject({ date: "2027-01-05", daysUntil: 82 });
    expect(p[0]!.event.name).toBe("Isra and Mi'raj");
    expect(p.at(-1)).toMatchObject({ date: "2027-03-09" });
    expect(p.at(-1)!.event.name).toBe("Eid al-Fitr");
    expect(p.find((x) => x.event.name === "Start of Ramadan")).toMatchObject({ date: "2027-02-08", daysUntil: 116 }); // agrees with the Ramadan month
    expect(p.map((x) => x.date)).toEqual([...p.map((x) => x.date)].sort());
  });
  it("a Hijri day with two entries gives two rows on the same date, each with its own tradition; no empty months are invented (none before January)", () => {
    const p = place();
    const rajab = p.filter((x) => x.date === "2027-01-05").map((x) => x.event.tradition).sort();
    expect(rajab).toEqual(["jafari", "sunni"]);
    expect(p.filter((x) => x.date < "2027-01-01")).toEqual([]); // there is no event in the legacy list from mid October to the end of December
    expect(p.find((x) => x.date === "2027-01-05")!.hijriLabel).toBe("27 Rajab 1448");
  });
  it("the Hijri adjustment moves the displayed date only (+1 a day earlier, -1 a day later); the saved months are untouched", () => {
    const months = all();
    const before = JSON.stringify(months);
    const base = place({ months });
    const plus = place({ months, adjust: 1 });
    const minus = place({ months, adjust: -1 });
    expect(JSON.stringify(months)).toBe(before);
    expect(plus.find((x) => x.event.name === "Eid al-Fitr")!.date).toBe("2027-03-08");
    expect(minus.find((x) => x.event.name === "Eid al-Fitr")!.date).toBe("2027-03-10");
    for (const x of base) expect(plus.find((y) => y.event.id === x.event.id && y.hijriLabel === x.hijriLabel)?.date, x.event.name).toBe(addDaysKey(x.date, -1));
    expect(plus.find((x) => x.event.name === "Start of Ramadan")!.daysUntil).toBe(115);
  });
  it("an event that the adjustment moves across a month edge or the window edge is handled: it is not lost and not duplicated", () => {
    // 1 Shawwal is 2027-03-09: +2 shows it on 7 March, -2 on 11 March; with the window ending 9 March only the first is inside
    const edge = (adjust: number, end: string) => place({ adjust, end }).filter((x) => x.event.name === "Eid al-Fitr");
    expect(edge(2, "2027-03-09").map((x) => x.date)).toEqual(["2027-03-07"]);
    expect(edge(-2, "2027-03-09")).toEqual([]);
    expect(edge(0, "2027-03-31")).toHaveLength(1);
    // a month record listed twice does not double a row
    expect(place({ months: [...all(), ...all()] })).toHaveLength(18);
    // today in the middle: past events are not listed
    expect(place({ today: "2027-02-20" })[0]!.event.name).toBe("Birth of Imam Hasan al-Mujtaba");
  });
  it("an event on the 30th of a Hijri month that has 29 days is not listed that year; nothing is moved", () => {
    const flat = all().flatMap((r) => r.days).sort((a, b) => a.date.localeCompare(b.date));
    // a Hijri month in the recorded data that ends on day 29 (the next day is day 1 of the next month)
    const end29 = flat.find((d, i) => d.date >= TODAY && d.hDay === 29 && flat[i + 1]?.hDay === 1)!;
    const ev: E.EventDef = { id: "t:30", month: end29.hMonth, day: 30, name: "Test 30th", tradition: "shared", category: "major", origin: "reviewed" };
    expect(place({ events: [ev] })).toEqual([]);
    const ok: E.EventDef = { ...ev, id: "t:29", day: 29 };
    expect(place({ events: [ok] })).toHaveLength(1);
  });
  it("beyond the saved months nothing is guessed: with only the first months saved the list holds only what they give", () => {
    const some = place({ months: [rec("2026-10"), rec("2026-11")] });
    expect(some).toEqual([]); // no legacy event falls in Oct and Nov 2026
    expect(place({ months: [] })).toEqual([]);
  });
});

describe("the filter, the tags and the few-events line", () => {
  const ev = E.legacyEvents();
  it("the control exists only when events carry a tradition tag other than shared", () => {
    expect(E.hasTraditionTags(ev)).toBe(true);
    expect(E.hasTraditionTags(ev.filter((e) => e.tradition === "shared"))).toBe(false);
    expect(E.hasTraditionTags([])).toBe(false);
  });
  it("Both is the default when no fiqh has been set; otherwise Following; the query overrides; the view is a tradition or none", () => {
    expect(E.defaultShow(false)).toBe("both");
    expect(E.defaultShow(true)).toBe("following");
    expect(E.showFromQuery(undefined, false)).toBe("both");
    expect(E.showFromQuery(undefined, true)).toBe("following");
    expect(E.showFromQuery("sunni", false)).toBe("sunni");
    expect(E.showFromQuery(["jafari", "x"], true)).toBe("jafari");
    expect(E.showFromQuery("bogus", true)).toBe("following");
    expect(E.traditionOf("both", "sunni")).toBeNull();
    expect(E.traditionOf("following", "jafari")).toBe("jafari");
    expect(E.traditionOf("sunni", "jafari")).toBe("sunni");
  });
  it("an event shows if shared or matching; Both shows everything; Sunni shows the 14 shared and 2 Sunni, Ja'fari the 14 and 13", () => {
    const n = (t: "sunni" | "jafari" | null) => ev.filter((e) => E.visible(e, t)).length;
    expect(n(null)).toBe(29);
    expect(n("sunni")).toBe(16);
    expect(n("jafari")).toBe(27);
  });
  it("a tradition with few events of its own gets the plain line; Both and a full tradition do not; nothing is invented to fill it", () => {
    expect(E.FEW_LINE).toBe("Only a few events are recorded for this tradition so far.");
    expect(E.isFew(ev, "sunni")).toBe(true); // 2 events of its own
    expect(E.isFew(ev, "jafari")).toBe(false); // 13
    expect(E.isFew(ev, null)).toBe(false);
    expect(E.countOwn(ev, "sunni")).toBe(2);
    expect(place().filter((x) => E.visible(x.event, "sunni")).every((x) => x.event.tradition !== "jafari")).toBe(true);
  });
  it("tags and categories use the data's values with our minimal labels", () => {
    expect(E.TRADITION_TAG).toEqual({ shared: "Both", sunni: "Sunni", jafari: "Ja’fari" });
    expect(E.categoryLabel("shia-occasion")).toBe("Occasion");
    expect(E.categoryLabel("major")).toBe("Major");
    expect(E.categoryLabel("something-new")).toBe("something new");
  });
});

describe("a reviewed events file: no code change to add events, wording, or replace one", () => {
  const sample = JSON.parse(fs.readFileSync(path.join(FX, "reviewed-events-sample.json"), "utf8")) as unknown;
  it("the shipped file is valid and EMPTY (nothing is invented to fill it)", () => {
    const v = E.validateReviewed(reviewedShipped);
    expect(v.issues).toEqual([]);
    expect(v.events).toEqual([]);
    expect(E.mergeEvents(E.legacyEvents(), v.events)).toHaveLength(29);
  });
  it("a sample file is accepted: a new event is added, the same id replaces a legacy event, wording shows per tradition with its source", () => {
    const v = E.validateReviewed(sample);
    expect(v.issues).toEqual([]);
    expect(v.events).toHaveLength(2);
    const merged = E.mergeEvents(E.legacyEvents(), v.events);
    expect(merged).toHaveLength(30); // one added, one replaced
    const replaced = merged.find((e) => e.id === "legacy:7-27-isra-and-mi-raj")!;
    expect(replaced.origin).toBe("reviewed");
    expect(replaced.name).toBe("Isra and Mi'raj (sample)");
    expect(E.wordingFor(replaced, "sunni")).toEqual([{ label: null, text: "SAMPLE shared wording." }, { label: null, text: "SAMPLE Sunni wording." }]);
    expect(E.wordingFor(replaced, "jafari")).toEqual([{ label: null, text: "SAMPLE shared wording." }]);
    expect(E.wordingFor(replaced, null)).toEqual([{ label: null, text: "SAMPLE shared wording." }, { label: "Sunni", text: "SAMPLE Sunni wording." }]);
    const placed = place({ events: merged });
    expect(placed.filter((x) => x.event.id === "reviewed:sample-new")).toHaveLength(1);
    expect(placed.filter((x) => x.date === "2027-01-05").map((x) => x.event.name).sort()).toEqual(["Isra and Mi'raj (sample)", "Mab'ath — Prophet's Commissioning"]);
  });
  it("a legacy event with no wording shows no lines (no placeholder)", () => {
    expect(E.wordingFor(E.legacyEvents()[0]!, null)).toEqual([]);
    expect(E.wordingFor(E.legacyEvents()[0]!, "sunni")).toEqual([]);
  });
  it("bad entries are left out and reported: a bad month or day, an unknown tradition, a duplicate id, wording without a source, no name", () => {
    const entry = (over: Record<string, unknown>) => ({ id: "x", month: 3, day: 12, name: "N", tradition: "shared", category: "major", ...over });
    const reasons = (e: Record<string, unknown>) => E.validateReviewed({ version: 1, events: [e] }).issues.map((i) => i.reason).join("|");
    expect(reasons(entry({}))).toBe("");
    expect(reasons(entry({ month: 13 }))).toContain("month");
    expect(reasons(entry({ month: 0 }))).toContain("month");
    expect(reasons(entry({ day: 31 }))).toContain("day");
    expect(reasons(entry({ day: 2.5 }))).toContain("day");
    expect(reasons(entry({ tradition: "other" }))).toContain("tradition");
    expect(reasons(entry({ name: "  " }))).toContain("name");
    expect(reasons(entry({ id: "" }))).toContain("id");
    expect(reasons(entry({ text: { sunni: "words" } }))).toContain("source");
    expect(reasons(entry({ text: { sunni: "words" }, source: { type: "book", citation: "" } }))).toContain("source");
    expect(reasons(entry({ text: { hanafi: "words" }, source: { type: "book", citation: "p. 1" } }))).toContain("unknown tradition");
    expect(reasons(entry({ text: { sunni: "words" }, source: { type: "book", citation: "p. 1" } }))).toBe("");
    const dup = E.validateReviewed({ events: [entry({}), entry({})] });
    expect(dup.events).toHaveLength(1);
    expect(dup.issues[0]!.reason).toContain("twice");
    expect(E.validateReviewed(null)).toEqual({ events: [], issues: [] });
    expect(E.validateReviewed({}).issues).toHaveLength(1);
  });
});

describe("grouping and wording of dates", () => {
  it("groups by month of the displayed date; the heading and the relative days; every date reads Expected", () => {
    const p = place();
    const g = E.groupByMonth(p);
    expect(g.map((x) => x.month)).toEqual(["2027-01", "2027-02", "2027-03"]);
    expect(g.reduce((n, x) => n + x.items.length, 0)).toBe(18);
    expect(E.monthHeading("2027-01")).toBe("January 2027");
    expect(E.relativeDays(0)).toBe("today");
    expect(E.relativeDays(1)).toBe("tomorrow");
    expect(E.relativeDays(82)).toBe("in 82 days");
    expect(E.expectedText("2027-02-08")).toBe("Expected Monday 8 February 2027");
    expect(E.groupByMonth([])).toEqual([]);
  });
});

describe("reminders: the legacy list quran:reminders:v1", () => {
  it("adds one in the legacy shape, never twice for the same event and day, removes with Undo, marks done, and keeps other fields", () => {
    const store = memoryStore({ [R.REMINDERS_KEY]: JSON.stringify([{ id: "a", title: "Old", date: "2026-12-01", note: "n", recurringYearly: true, done: false, createdAt: 5, extra: { keep: 1 } }]) });
    setStorageBackend(store);
    const r = R.addReminder("Eid al-Fitr", "2027-03-09", 100)!;
    expect(r).toMatchObject({ title: "Eid al-Fitr", date: "2027-03-09", note: "", recurringYearly: false, done: false, createdAt: 100 });
    expect(typeof r.id).toBe("string");
    expect(R.addReminder("Eid al-Fitr", "2027-03-09", 200)!.id).toBe(r.id); // not twice
    const stored = getJSON<R.Reminder[]>(R.REMINDERS_KEY, []);
    expect(stored).toHaveLength(2);
    expect(stored[0]!.extra).toEqual({ keep: 1 });
    const gone = R.removeReminder(r.id)!;
    expect(R.readReminders().map((x) => x.id)).toEqual(["a"]);
    R.restoreReminder(gone);
    expect(R.readReminders().map((x) => x.id).sort()).toEqual([r.id, "a"].sort());
    R.setDone(r.id, true);
    expect(R.readReminders().find((x) => x.id === r.id)!.done).toBe(true);
    expect(R.findReminder(R.readReminders(), "Eid al-Fitr", "2027-03-09")?.id).toBe(r.id);
    expect(R.findReminder(R.readReminders(), "Eid al-Fitr", "2027-03-10")).toBeUndefined();
  });
  it("upcoming first, then past; done ones are not listed (as in the legacy list)", () => {
    const l: R.Reminder[] = [
      { id: "1", title: "b", date: "2027-02-01", note: "", recurringYearly: false, done: false, createdAt: 1 },
      { id: "2", title: "a", date: "2027-01-01", note: "", recurringYearly: false, done: false, createdAt: 2 },
      { id: "3", title: "c", date: "2026-12-01", note: "", recurringYearly: false, done: false, createdAt: 3 },
      { id: "4", title: "d", date: "2027-03-01", note: "", recurringYearly: false, done: true, createdAt: 4 },
    ];
    const s = R.split(l, "2027-01-01");
    expect(s.upcoming.map((x) => x.id)).toEqual(["2", "1"]);
    expect(s.overdue.map((x) => x.id)).toEqual(["3"]);
  });
  it("a damaged list reads as empty and bad entries are skipped; the legacy shape is what Hifz and the old calendar read", () => {
    for (const bad of ["{oops", "null", '"x"', "{}"]) {
      setStorageBackend(memoryStore({ [R.REMINDERS_KEY]: bad }));
      expect(R.readReminders()).toEqual([]);
    }
    setStorageBackend(memoryStore({ [R.REMINDERS_KEY]: JSON.stringify([{ id: "ok", title: "t", date: "2027-01-01" }, { id: 5 }, { id: "x", title: "t", date: "tomorrow" }]) }));
    expect(R.readReminders()).toHaveLength(1);
    R.addReminder("Z", "2027-02-02", 1);
    // exactly the fields the legacy composable writes and reads
    const w = getJSON<R.Reminder[]>(R.REMINDERS_KEY, [])!.at(-1)!;
    expect(Object.keys(w).sort()).toEqual(["createdAt", "date", "done", "id", "note", "recurringYearly", "title"]);
    expect(R.REMINDERS_KEY).toBe("quran:reminders:v1");
  });
});

describe("the calendar month service for Gregorian months: saved first, network only when asked, a failure keeps what is saved", () => {
  const fake = (over: Partial<HijriDeps> = {}) => {
    const store = new Map<string, unknown>();
    const calls: string[] = [];
    const deps: HijriDeps = { get: async (k) => store.get(k) as never, put: async (k, r) => void store.set(k, r), fetchJson: async (u) => (calls.push(u), raw("2026-10")), now: () => 5_000, ...over };
    return { deps, store, calls };
  };
  it("fetches once, saves under g:YYYY-MM, then uses the saved month with no request", async () => {
    const f = fake();
    expect(await getGregorianMonth(f.deps, "2026-10")).toMatchObject({ status: "ok", from: "network" });
    expect(f.calls).toEqual(["https://api.aladhan.com/v1/gToHCalendar/10/2026"]);
    expect([...f.store.keys()]).toEqual(["g:2026-10"]);
    expect(await getGregorianMonth(f.deps, "2026-10")).toMatchObject({ status: "ok", from: "saved" });
    expect(f.calls).toHaveLength(1);
  });
  it("with the network off it uses only what is saved; a stale month is refreshed, and a failure or an invalid answer keeps the saved one", async () => {
    const f = fake();
    expect(await getGregorianMonth(f.deps, "2026-10", { network: false })).toMatchObject({ status: "failed", kind: "offline" });
    await getGregorianMonth(f.deps, "2026-10");
    expect(await getGregorianMonth(f.deps, "2026-10", { network: false })).toMatchObject({ status: "ok", from: "saved" });
    const later = { ...f.deps, now: () => 5_000 + 31 * 24 * 3600 * 1000 };
    expect(await getGregorianMonth(later, "2026-10")).toMatchObject({ status: "ok", from: "network" });
    const failing = { ...f.deps, now: () => 5_000 + 90 * 24 * 3600 * 1000, fetchJson: async () => Promise.reject(new TypeError("offline")) };
    expect(await getGregorianMonth(failing, "2026-10")).toMatchObject({ status: "ok", from: "saved" });
    expect(await getGregorianMonth({ ...failing, fetchJson: async () => ({ code: 500 }) }, "2026-10")).toMatchObject({ status: "ok", from: "saved" });
  });
  it("with nothing saved a failed or invalid answer is reported and nothing is stored", async () => {
    const f = fake({ fetchJson: async () => Promise.reject(new TypeError("Failed to fetch")) });
    expect(await getGregorianMonth(f.deps, "2026-11")).toMatchObject({ status: "failed", kind: "offline" });
    const g = fake({ fetchJson: async () => ({ code: 200, data: [] }) });
    expect(await getGregorianMonth(g.deps, "2026-11")).toMatchObject({ status: "failed", kind: "error" });
    expect(f.store.size + g.store.size).toBe(0);
  });
});

describe("no invented text anywhere on the Events tab", () => {
  it("the components contain none of the prototype's events or descriptions, and no streak or alert claim", () => {
    const root = path.resolve(__dirname, "../app");
    const files = ["EventsPanel.vue", "EventRow.vue", "RemindersList.vue"].map((f) => fs.readFileSync(path.join(root, "components/ramadan", f), "utf8")).join("\n") + fs.readFileSync(path.join(root, "lib/islamicEvents.ts"), "utf8");
    for (const banned of [/Fatimiyya/i, /Rajab begins/i, /Sha.ban begins/i, /Imam Musa al-Kadhim/i, /Birth of Fatima/i, /crescent is sighted/i, /South Asia/i, /Saudi calculation/i, /reminder will (notify|alert)/i, /we will remind you/i]) expect(banned.test(files), String(banned)).toBe(false);
  });
  it("every name in the adapter's list is a name in the legacy data or a reviewed file's; the labels we add are only the tags and categories", () => {
    const legacyNames = new Set((ISLAMIC_EVENTS as Array<{ name: string }>).map((e) => e.name));
    for (const e of E.legacyEvents()) expect(legacyNames.has(e.name)).toBe(true);
    expect(Object.keys(E.CATEGORY_LABEL).sort()).toEqual(["birth", "major", "martyrdom", "remembrance", "shia-occasion"]);
  });
});
