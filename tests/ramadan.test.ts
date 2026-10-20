// Phase 8A: Ramadan. The calendar service's Hijri month (recorded REAL responses in tests/fixtures), the plan for Ramadan with the Hijri
// adjustment and the legacy start-date override, the timetable and tracker rows, the legacy record, and the rules (no streak, no guilt wording).
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addDaysKey, daysBetweenKeys, weekdayOfKey } from "../app/lib/dayKeys";
import { adjustedStart, calendarBasis, estimateRamadanYear, findRamadan, hijriMonthKey, hijriMonthUrl, normalizeHijriMonth, recordEnd, recordStart, type HijriMonthRecord } from "../app/lib/hijriMonths";
import type { PrayerDay } from "../app/lib/prayerMonth";
import * as R from "../app/lib/ramadan";
import { basisLine } from "../app/lib/ramadanText";
import { getHijriMonth, type HijriDeps } from "../app/services/hijri.service";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const fx = (n: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", n), "utf8")) as { code: number; data: Array<{ hijri: Record<string, unknown> & { date: string; day: string; method?: string }; gregorian: Record<string, unknown> & { date: string } }> };
const RAMADAN = fx("aladhan-htog-1448-09.json");
const norm = (j: unknown, y = 1448, m = 9) => normalizeHijriMonth(j, y, m, 1000);
const month = (): HijriMonthRecord => {
  const r = norm(RAMADAN);
  if (!r.ok) throw new Error(r.reason);
  return r.record;
};
const dayOf = (date: string, hDay: number, hMonth = 9): PrayerDay => ({ date, timings: { Fajr: "05:10", Dhuhr: "12:20", Asr: "15:40", Maghrib: "17:55", Isha: "19:15", Imsak: "05:00" }, hijri: { day: hDay, month: hMonth, year: 1448, monthNameEn: "Ramaḍān" } });
/** Prayer days as the cache would hold them, taken from the recorded Hijri month (month 9) */
const prayerDays = (from = 1, to = 29): PrayerDay[] => month().days.filter((d) => d.hDay >= from && d.hDay <= to).map((d) => dayOf(d.date, d.hDay));

describe("the recorded real calendar responses", () => {
  it("Ramadan 1448 as the service gives it: 29 days, 8 Feb to 8 Mar 2027, the Hijri Calendar of Saudi Arabia", () => {
    const r = month();
    expect(r.key).toBe(hijriMonthKey(1448, 9));
    expect(r.length).toBe(29);
    expect(recordStart(r)).toBe("2027-02-08");
    expect(recordEnd(r)).toBe("2027-03-08");
    expect(r.method).toBe("HJCoSA");
    expect(calendarBasis(r.method)).toBe("Hijri Calendar of Saudi Arabia (HJCoSA)");
    expect(calendarBasis("SOMETHING")).toBe("SOMETHING");
    expect(hijriMonthUrl("https://api.aladhan.com/v1", 9, 1448)).toBe("https://api.aladhan.com/v1/hToGCalendar/9/1448");
    expect(r.days.map((d) => d.hDay)).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
  });
  it("agrees with the calendar for each Gregorian month: Feb and Mar 2027 give the same Hijri day for every Ramadan date", () => {
    const g = new Map<string, string>();
    for (const f of ["aladhan-gtoh-2027-02.json", "aladhan-gtoh-2027-03.json"]) for (const d of fx(f).data) g.set(d.gregorian.date, d.hijri.date);
    for (const d of RAMADAN.data) expect(g.get(d.gregorian.date), d.gregorian.date).toBe(d.hijri.date);
  });
  it("agrees with the prayer cache's Hijri dates for all 31 overlapping days of October 2026 (the same calendar)", () => {
    const cache = fx("aladhan-lahore-2026-10-sunni.json");
    const byDate = new Map(fx("aladhan-gtoh-2026-10.json").data.map((d) => [d.gregorian.date, d.hijri.date]));
    let n = 0;
    for (const d of cache.data as unknown as Array<{ date: { gregorian: { date: string }; hijri: { date: string } } }>) {
      expect(byDate.get(d.date.gregorian.date), d.date.gregorian.date).toBe(d.date.hijri.date);
      n++;
    }
    expect(n).toBe(31);
  });
  it("a response is rejected, never shown or stored, when anything is off", () => {
    const good = () => JSON.parse(JSON.stringify(RAMADAN)) as typeof RAMADAN;
    expect(norm({ code: 500, data: [] }).ok).toBe(false);
    expect(norm(null).ok).toBe(false);
    expect(norm(RAMADAN, 1449).ok).toBe(false); // the wrong year
    expect(norm(RAMADAN, 1448, 8).ok).toBe(false); // the wrong month
    const short = good();
    short.data.length = 20;
    expect(norm(short).ok).toBe(false);
    const gap = good();
    gap.data[10]!.gregorian.date = "01-01-2030";
    expect(norm(gap).ok).toBe(false);
    const badDay = good();
    badDay.data[3]!.hijri.day = "9";
    expect(norm(badDay).ok).toBe(false);
    const noMethod = good();
    for (const d of noMethod.data) delete d.hijri.method;
    expect(norm(noMethod).ok).toBe(false);
    const badDate = good();
    badDate.data[0]!.gregorian.date = "31-02-2027";
    expect(norm(badDate).ok).toBe(false);
  });
});

describe("which Ramadan to ask for, and finding it", () => {
  it("the estimate picks the Hijri year of the Ramadan under way or next", () => {
    expect(estimateRamadanYear("2026-10-20")).toBe(1448);
    expect(estimateRamadanYear("2027-02-20")).toBe(1448);
    expect(estimateRamadanYear("2027-03-20")).toBe(1449);
    expect(estimateRamadanYear("2025-03-10")).toBe(1446);
    expect(estimateRamadanYear("2025-04-10")).toBe(1447);
  });
  it("a wrong guess is corrected from what the service returns (too early moves on; too late goes back)", async () => {
    const real = month();
    const shift = (r: HijriMonthRecord, by: number): HijriMonthRecord => ({ ...r, days: r.days.map((d) => ({ ...d, date: addDaysKey(d.date, by) })) });
    const asked: number[] = [];
    // the service "knows" 1448 only; a request for 1447 returns the Ramadan a year before, 1449 a year after
    const getMonth = async (y: number) => {
      asked.push(y);
      return y === 1447 ? shift(real, -354) : y === 1448 ? real : y === 1449 ? shift(real, 354) : null;
    };
    const out = await findRamadan("2027-03-20", getMonth); // after 1448: the next
    expect(out.status).toBe("found");
    if (out.status === "found") expect(recordStart(out.record)).toBe(addDaysKey("2027-02-08", 354));
    asked.length = 0;
    const early = await findRamadan("2026-10-20", async (y) => (y === 1448 ? real : y === 1447 ? shift(real, -354) : null));
    expect(early.status).toBe("found");
    if (early.status === "found") expect(recordStart(early.record)).toBe("2027-02-08");
    expect(await findRamadan("2026-10-20", async () => null)).toEqual({ status: "unavailable" });
  });
});

describe("the plan: before, during, the adjustment and the manual start date", () => {
  const input = (over: Partial<R.PlanInput> = {}): R.PlanInput => ({ today: "2026-10-20", adjust: 0, override: null, month: month(), days: [], ...over });
  it("before: days until, the date, the basis", () => {
    const p = R.planRamadan(input());
    expect(p).toMatchObject({ state: "before", start: "2027-02-08", length: 29, day: null, source: "calendar", basis: "Hijri Calendar of Saudi Arabia (HJCoSA)" });
    expect(p.daysUntil).toBe(daysBetweenKeys("2026-10-20", "2027-02-08"));
    expect(p.daysUntil).toBe(111);
  });
  it("the Hijri adjustment moves the date the app shows, never the record: +1 is a day earlier, -1 a day later", () => {
    const m = month();
    const before = JSON.stringify(m);
    expect(R.planRamadan(input({ adjust: 1 })).start).toBe("2027-02-07");
    expect(R.planRamadan(input({ adjust: -1 })).start).toBe("2027-02-09");
    expect(R.planRamadan(input({ adjust: 2 })).start).toBe("2027-02-06");
    expect(adjustedStart(m, -2)).toBe("2027-02-10");
    expect(JSON.stringify(m)).toBe(before); // the record is untouched
  });
  it("during, from the calendar: the day number, the length, and the adjusted day (day 1 shifts with the adjustment)", () => {
    expect(R.planRamadan(input({ today: "2027-02-08" }))).toMatchObject({ state: "during", day: 1, length: 29, start: "2027-02-08" });
    expect(R.planRamadan(input({ today: "2027-02-19" }))).toMatchObject({ state: "during", day: 12 });
    expect(R.planRamadan(input({ today: "2027-03-08" }))).toMatchObject({ state: "during", day: 29 });
    expect(R.planRamadan(input({ today: "2027-02-08", adjust: 1 }))).toMatchObject({ state: "during", day: 2, start: "2027-02-07" });
    expect(R.planRamadan(input({ today: "2027-02-08", adjust: -1 }))).toMatchObject({ state: "before", daysUntil: 1 });
    expect(R.planRamadan(input({ today: "2027-03-09" })).state).toBe("over");
  });
  it("during, from the cached prayer days alone (no calendar month saved): the Hijri date of the day, adjusted", () => {
    const days = prayerDays();
    const p = R.planRamadan(input({ today: "2027-02-19", month: null, days }));
    expect(p).toMatchObject({ state: "during", day: 12, start: "2027-02-08", length: null, source: "calendar" });
    expect(R.planRamadan(input({ today: "2027-02-19", month: null, days, adjust: 1 })).day).toBe(13);
    // a day before Ramadan with no calendar month is not guessed
    expect(R.planRamadan(input({ today: "2026-10-20", month: null, days: [dayOf("2026-10-20", 8, 4)] })).state).toBe("unknown");
    expect(R.planRamadan(input({ month: null })).state).toBe("unknown");
  });
  it("the legacy start-date override stands: active for 30 days, wins over the calendar, and a future date is a manual start", () => {
    const p = R.planRamadan(input({ today: "2027-02-10", override: "2027-02-09" }));
    expect(p).toMatchObject({ state: "during", day: 2, start: "2027-02-09", source: "manual" });
    expect(R.planRamadan(input({ today: "2027-03-10", override: "2027-02-09" })).day).toBe(30); // still inside the legacy 30 days
    expect(R.planRamadan(input({ today: "2027-03-11", override: "2027-02-09" })).source).not.toBe("manual"); // the 31st day: the override has expired
    const fut = R.planRamadan(input({ today: "2027-02-01", override: "2027-02-09" }));
    expect(fut).toMatchObject({ state: "before", start: "2027-02-09", daysUntil: 8, source: "manual" });
    expect(R.planRamadan(input({ today: "2026-10-20", override: "2030-01-01" })).source).toBe("calendar"); // a typo years ahead is ignored
  });
});

describe("the basis line (the calendar's name can be hidden with one flag)", () => {
  it("names the calendar the service reports; with the flag off it only says the dates are calculated; a manual date says who set it", () => {
    expect(basisLine("calendar", "Hijri Calendar of Saudi Arabia (HJCoSA)", true)).toBe("Dates follow the Hijri Calendar of Saudi Arabia (HJCoSA). Local sighting can differ by a day.");
    expect(basisLine("calendar", "Hijri Calendar of Saudi Arabia (HJCoSA)", false)).toBe("Dates are calculated. Local sighting can differ by a day.");
    expect(basisLine("calendar", null, true)).toBe("Dates are calculated. Local sighting can differ by a day.");
    expect(basisLine("manual", "anything", true)).toBe("The start date was set by you.");
    expect(basisLine("manual", "anything", false)).toBe("The start date was set by you.");
  });
});

describe("a past manual start date behaves as the legacy page did", () => {
  const input = (today: string): R.PlanInput => ({ today, adjust: 0, override: "2027-02-09", month: month(), days: [] });
  it("from the day itself it counts the days (day 1 on the date), through the 30th day, then the calendar takes over again", () => {
    expect(R.planRamadan(input("2027-02-09"))).toMatchObject({ state: "during", day: 1, source: "manual" });
    expect(R.planRamadan(input("2027-02-20"))).toMatchObject({ state: "during", day: 12, source: "manual" });
    expect(R.planRamadan(input("2027-03-10"))).toMatchObject({ state: "during", day: 30, source: "manual" });
    expect(R.planRamadan(input("2027-03-11")).source).toBe("calendar");
    expect(R.planRamadan(input("2027-03-11")).state).toBe("over"); // the calendar's Ramadan ended on 8 March
  });
});

describe("the timetable and the tracker strip", () => {
  const plan = () => R.planRamadan({ today: "2027-02-19", adjust: 0, override: null, month: month(), days: [] });
  it("one row per Ramadan day, with Friday and today marked and times from the cached days", () => {
    const rows = R.timetableRows(plan(), "2027-02-19", prayerDays(1, 29));
    expect(rows).toHaveLength(29);
    expect(rows[0]).toMatchObject({ day: 1, date: "2027-02-08", suhoorEnds: "05:10", iftar: "17:55", imsak: "05:00" });
    expect(rows.filter((r) => r.friday).map((r) => r.date).every((d) => weekdayOfKey(d) === 5)).toBe(true);
    expect(rows.filter((r) => r.friday)).toHaveLength(4);
    expect(rows.find((r) => r.today)?.day).toBe(12);
    expect(R.missingRows(rows)).toBe(0);
  });
  it("days whose times are not saved are marked, never estimated", () => {
    const rows = R.timetableRows(plan(), "2027-02-19", prayerDays(1, 20));
    expect(R.missingRows(rows)).toBe(9);
    expect(rows[25]).toMatchObject({ suhoorEnds: null, iftar: null });
    expect(R.missingRows(R.timetableRows(plan(), "2027-02-19", []))).toBe(29);
  });
  it("the rows are as many as the calendar gives (29 here), the months are those the dates fall in, and nothing without a start", () => {
    expect(R.monthsOf(plan())).toEqual(["2027-02", "2027-03"]);
    expect(R.ramadanDates(R.planRamadan({ today: "2026-10-20", adjust: 0, override: null, month: null, days: [] }))).toEqual([]);
  });
  it("the strip: the last 7 days up to today, fewer at the start, none outside Ramadan", () => {
    const log: Record<string, R.FastingStatus> = { "2027-02-10": "fasted", "2027-02-11": "missed" };
    const s = R.trackerStrip(plan(), "2027-02-19", log);
    expect(s.map((d) => d.day)).toEqual([6, 7, 8, 9, 10, 11, 12]);
    expect(s.find((d) => d.day === 3)).toBeUndefined();
    expect(s.find((d) => d.day === 12)?.today).toBe(true);
    expect(R.trackerStrip(R.planRamadan({ today: "2027-02-10", adjust: 0, override: null, month: month(), days: [] }), "2027-02-10", log).map((d) => d.day)).toEqual([1, 2, 3]);
    expect(R.trackerStrip(R.planRamadan({ today: "2026-10-20", adjust: 0, override: null, month: month(), days: [] }), "2026-10-20", log)).toEqual([]);
    const marked = R.trackerStrip(R.planRamadan({ today: "2027-02-12", adjust: 0, override: null, month: month(), days: [] }), "2027-02-12", log);
    expect(marked.find((d) => d.date === "2027-02-10")?.status).toBe("fasted");
    expect(marked.find((d) => d.date === "2027-02-11")?.status).toBe("missed");
  });
  it("prefetch: from about a month before, only when Ramadan is still ahead", () => {
    const before = (n: number) => R.planRamadan({ today: addDaysKey("2027-02-08", -n), adjust: 0, override: null, month: month(), days: [] });
    expect(R.shouldPrefetch(before(60))).toBe(false);
    expect(R.shouldPrefetch(before(31))).toBe(true);
    expect(R.shouldPrefetch(before(1))).toBe(true);
    expect(R.shouldPrefetch(R.planRamadan({ today: "2027-02-12", adjust: 0, override: null, month: month(), days: [] }))).toBe(false);
  });
});

describe("the legacy record quran:ramadan:v1", () => {
  it("reads and writes the legacy shape, keeps unknown fields, and ignores damaged parts", () => {
    const store = memoryStore({ [R.RAMADAN_KEY]: JSON.stringify({ startOverride: "2027-02-08", fastingLog: { "2027-02-08": "fasted", "2027-02-09": "planned", bad: "fasted", "2027-02-10": "nonsense" }, other: { keep: 1 } }) });
    setStorageBackend(store);
    const r = R.readRamadan();
    expect(r.startOverride).toBe("2027-02-08");
    expect(r.fastingLog).toEqual({ "2027-02-08": "fasted", "2027-02-09": "planned" });
    R.setFastingStatus("2027-02-10", "missed");
    R.setStartOverride(null);
    expect(getJSON(R.RAMADAN_KEY, null)).toEqual({ startOverride: null, fastingLog: { "2027-02-08": "fasted", "2027-02-09": "planned", "2027-02-10": "missed" }, other: { keep: 1 } });
    R.setFastingStatus("2027-02-09", null);
    expect(R.readRamadan().fastingLog["2027-02-09"]).toBeUndefined();
    for (const bad of ["{oops", "null", "[]", '"x"']) {
      setStorageBackend(memoryStore({ [R.RAMADAN_KEY]: bad }));
      expect(R.readRamadan()).toEqual({ startOverride: null, fastingLog: {}, rest: {} });
    }
  });
  it("the cycle is the legacy one (nothing, fasted, didn't fast, nothing); the label is neutral and the stored value stays 'missed'", () => {
    expect(R.nextFastingStatus(null)).toBe("fasted");
    expect(R.nextFastingStatus("fasted")).toBe("missed");
    expect(R.nextFastingStatus("missed")).toBeNull();
    expect(R.nextFastingStatus("planned")).toBe("fasted");
    expect(R.FASTING_LABELS).toEqual({ fasted: "Fasted", missed: "Didn’t fast", planned: "Planned" });
    expect(R.fastingCounts({ a: "fasted", b: "fasted", c: "missed", d: "planned" } as never)).toEqual({ fasted: 2, missed: 1, planned: 1 });
  });
  it("only a valid date is stored as the override", () => {
    setStorageBackend(memoryStore({}));
    R.setStartOverride("2027-02-08");
    expect(R.readRamadan().startOverride).toBe("2027-02-08");
    R.setStartOverride("not a date");
    expect(R.readRamadan().startOverride).toBeNull();
  });
});

describe("no streaks and no guilt wording, anywhere on the page", () => {
  it("nothing exported counts days in a row, and no Ramadan component or text file says streak, flame, fire or 'you missed'", () => {
    expect(Object.keys(R).filter((k) => /streak/i.test(k))).toEqual([]);
    const root = path.resolve(__dirname, "../app");
    const files = [path.join(root, "lib/ramadan.ts"), path.join(root, "lib/ramadanText.ts"), path.join(root, "components/home/RamadanBanner.vue")];
    for (const f of fs.readdirSync(path.join(root, "components/ramadan"))) files.push(path.join(root, "components/ramadan", f));
    const hits: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*|<!--)/.test(line)) return; // comments may say "no streak"
        if (/streak|flame|\bfire\b|you missed|don't give up|keep it up/i.test(line.replace(/\/\/.*$/, ""))) hits.push(`${path.basename(f)}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });
  it("no ruling and no invented text: the page has no 'Saudi calculation', no 'South Asia', no comparison table, no per-fiqh iftar sentence", () => {
    const root = path.resolve(__dirname, "../app");
    const text = fs.readdirSync(path.join(root, "components/ramadan")).map((f) => fs.readFileSync(path.join(root, "components/ramadan", f), "utf8")).join("\n");
    for (const banned of [/Saudi calculation/i, /South Asia/i, /eastern redness/i, /how it differs/i, /taraweeh/i, /Ja.fari .{0,20}nights? 19/i]) expect(banned.test(text), String(banned)).toBe(false);
  });
});

describe("the Hijri month service: saved first, network only when asked, a failure keeps what is saved", () => {
  const fake = (over: Partial<HijriDeps> = {}) => {
    const store = new Map<string, HijriMonthRecord>();
    const calls: string[] = [];
    const deps: HijriDeps = {
      get: async (k) => store.get(k),
      put: async (k, r) => void store.set(k, r),
      fetchJson: async (u) => (calls.push(u), RAMADAN),
      now: () => 5_000,
      ...over,
    };
    return { deps, store, calls };
  };
  it("fetches once, saves it, and then uses the saved one with no request", async () => {
    const f = fake();
    const a = await getHijriMonth(f.deps, 1448);
    expect(a).toMatchObject({ status: "ok", from: "network" });
    expect(f.calls).toEqual(["https://api.aladhan.com/v1/hToGCalendar/9/1448"]);
    const b = await getHijriMonth(f.deps, 1448);
    expect(b).toMatchObject({ status: "ok", from: "saved" });
    expect(f.calls).toHaveLength(1);
  });
  it("with the network off it uses only what is saved, and says it is not saved otherwise (no request)", async () => {
    const f = fake();
    expect(await getHijriMonth(f.deps, 1448, 9, { network: false })).toMatchObject({ status: "failed", kind: "offline" });
    expect(f.calls).toEqual([]);
    await getHijriMonth(f.deps, 1448);
    expect(await getHijriMonth(f.deps, 1448, 9, { network: false })).toMatchObject({ status: "ok", from: "saved" });
  });
  it("a stale saved month is refreshed, and if the refresh fails or is invalid the saved one stays", async () => {
    const f = fake();
    await getHijriMonth(f.deps, 1448);
    const old = { ...f.deps, now: () => 5_000 + 31 * 24 * 3600 * 1000 };
    const refreshed = await getHijriMonth(old, 1448);
    expect(refreshed).toMatchObject({ status: "ok", from: "network" });
    const failing = { ...f.deps, now: () => 5_000 + 90 * 24 * 3600 * 1000, fetchJson: async () => Promise.reject(new TypeError("offline")) };
    expect(await getHijriMonth(failing, 1448)).toMatchObject({ status: "ok", from: "saved" });
    const invalid = { ...failing, fetchJson: async () => ({ code: 500 }) };
    expect(await getHijriMonth(invalid, 1448)).toMatchObject({ status: "ok", from: "saved" });
  });
  it("with nothing saved a failed request is reported (offline or error) and nothing is stored", async () => {
    const f = fake({ fetchJson: async () => Promise.reject(new TypeError("Failed to fetch")) });
    expect(await getHijriMonth(f.deps, 1448)).toMatchObject({ status: "failed", kind: "offline" });
    const g = fake({ fetchJson: async () => ({ code: 200, data: [] }) });
    expect(await getHijriMonth(g.deps, 1448)).toMatchObject({ status: "failed", kind: "error" });
    expect(f.store.size + g.store.size).toBe(0);
  });
});

describe("Laylat al-Qadr (the legacy nights, shared)", () => {
  it("the legacy data's nights are 21, 23, 25, 27, 29 and today is one of them only on those days", async () => {
    const { LAYLAT_AL_QADR_NIGHTS } = await import("@legacy/utils/ramadanContent");
    expect([...LAYLAT_AL_QADR_NIGHTS]).toEqual([21, 23, 25, 27, 29]);
    expect(R.isQadrNight(21, LAYLAT_AL_QADR_NIGHTS)).toBe(true);
    expect(R.isQadrNight(19, LAYLAT_AL_QADR_NIGHTS)).toBe(false); // the Ja'fari 19, 21, 23 set is not shown until a reviewed source is supplied
    expect(R.isQadrNight(null, LAYLAT_AL_QADR_NIGHTS)).toBe(false);
  });
});
