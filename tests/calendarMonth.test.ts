// Phase 15: the Calendar's month grid, on the REAL recorded Gregorian months (AlAdhan gToHCalendar, Sep 2026 to Sep 2027). The Hijri dates are the
// service's; nothing here computes one.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeGregorianMonth, type GregorianMonthRecord } from "../app/lib/gregorianMonths";
import { legacyEvents } from "../app/lib/islamicEvents";
import * as C from "../app/lib/calendar/month";
import type { Reminder } from "../app/lib/reminders";

const FIX = path.resolve(__dirname, "fixtures");
function record(month: string): GregorianMonthRecord {
  const [y, m] = month.split("-");
  const r = normalizeGregorianMonth(JSON.parse(fs.readFileSync(path.join(FIX, `aladhan-gtoh-${y}-${m}.json`), "utf8")), month, 1);
  if (!r.ok) throw new Error(r.reason);
  return r.record;
}
const MONTHS = ["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04"];
const pool = C.poolOf(MONTHS.map(record));
const TODAY = "2026-10-15";
const EVENTS = legacyEvents();
const reminder = (over: Partial<Reminder>): Reminder => ({ id: "r", title: "Visit family", date: "2026-10-25", note: "", recurringYearly: false, done: false, createdAt: 1, ...over });

describe("which month today is in", () => {
  it("15 October 2026 is 4 Jumada al-ula 1448 (the service's own date)", () => {
    expect(C.idOfDate(pool, TODAY, 0)).toEqual({ y: 1448, m: 5 });
    expect(C.hijriLabel(pool, TODAY, 0)).toMatchObject({ day: 4, month: 5, year: 1448 });
    expect(C.hijriLabel(pool, TODAY, 0)!.text).toMatch(/^4 .+ 1448$/);
  });
  it("the adjustment moves the Hijri date a day shows: +1 is the day after the service's, -1 the day before", () => {
    expect(C.hijriLabel(pool, TODAY, 1)).toMatchObject({ day: 5, month: 5 });
    expect(C.hijriLabel(pool, TODAY, -1)).toMatchObject({ day: 3, month: 5 });
  });
  it("a day the saved months do not cover is unknown, not guessed", () => {
    expect(C.idOfDate(pool, "2030-01-01", 0)).toBeNull();
    expect(C.hijriLabel(pool, "2030-01-01", 0)).toBeNull();
  });
});

describe("a Hijri month", () => {
  const cur = C.monthOf(pool, { y: 1448, m: 5 }, 0)!;
  it("has 29 or 30 days from day 1, each on the next Gregorian day", () => {
    expect([29, 30]).toContain(cur.days.length);
    expect(cur.days.map((d) => d.hDay)).toEqual(Array.from({ length: cur.days.length }, (_, i) => i + 1));
    for (let i = 1; i < cur.days.length; i++) expect(new Date(`${cur.days[i]!.date}T12:00:00Z`).getTime() - new Date(`${cur.days[i - 1]!.date}T12:00:00Z`).getTime()).toBe(86_400_000);
    expect(cur.start).toBe(cur.days[0]!.date);
    expect(cur.end).toBe(cur.days.at(-1)!.date);
    expect(cur.days.find((d) => d.date === TODAY)!.hDay).toBe(4);
  });
  it("has the service's name and calendar", () => {
    expect(cur.name).toMatch(/Jum/);
    expect(cur.method).toBe("HJCoSA");
    expect(cur.nameAr ?? "").toMatch(/^[؀-ۿ\s]*$/); // service data (Arabic letters) or absent in an older saved month
  });
  it("the adjustment shifts every Gregorian date and nothing else", () => {
    const plus = C.monthOf(pool, { y: 1448, m: 5 }, 1)!;
    expect(plus.days.map((d) => d.hDay)).toEqual(cur.days.map((d) => d.hDay));
    expect(plus.days.map((d) => d.serviceDate)).toEqual(cur.days.map((d) => d.serviceDate));
    expect(plus.start < cur.start).toBe(true);
    expect(plus.days.find((d) => d.date === TODAY)!.hDay).toBe(5);
  });
  it("starts on the right weekday: blanks before day 1 so the grid begins on Sunday", () => {
    expect(C.leadBlanks(cur)).toBe(new Date(`${cur.start}T12:00:00Z`).getUTCDay());
  });
  it("is not shown unless the saved months hold all of it", () => {
    const partial = C.poolOf([record("2026-10")]);
    expect(C.monthOf(partial, { y: 1448, m: 5 }, 0)).toBeNull(); // day 1 is in September
    expect(C.monthOf(C.poolOf([record("2026-09")]), { y: 1448, m: 5 }, 0)).toBeNull(); // the end is in October
    expect(C.monthOf(pool, { y: 1500, m: 1 }, 0)).toBeNull();
  });
  it("steps to the neighbours, across a year", () => {
    expect(C.nextId({ y: 1448, m: 12 })).toEqual({ y: 1449, m: 1 });
    expect(C.prevId({ y: 1449, m: 1 })).toEqual({ y: 1448, m: 12 });
    const next = C.monthOf(pool, C.nextId(cur.id), 0)!;
    expect(next.id).toEqual({ y: 1448, m: 6 });
    expect(cur.days[0]!.serviceDate).toBe("2026-10-12");
    expect(C.monthsToStep(cur, 1)).toEqual(["2026-11", "2026-12"]); // the day after the month, and a month beyond it
    expect(C.monthsToStep(cur, -1)).toEqual(["2026-10", "2026-09"]);
  });
});

describe("events and reminders on a day", () => {
  it("the first of Ramadan 1448 carries its events for the view", () => {
    const ram = C.monthOf(pool, { y: 1448, m: 9 }, 0)!;
    expect(ram.days[0]!.date).toBe("2027-02-08");
    const names = (t: "sunni" | "jafari" | null) => C.eventsOn(EVENTS, 9, 1, t).map((e) => e.name);
    expect(names(null).length).toBeGreaterThan(0);
    expect(C.eventsOn(EVENTS, 9, 1, "sunni").every((e) => e.tradition !== "jafari")).toBe(true);
    expect(C.eventsOn(EVENTS, 9, 1, "jafari").every((e) => e.tradition !== "sunni")).toBe(true);
  });
  it("a one-off reminder is on its day only; a done one is on none", () => {
    expect(C.remindsOn(reminder({}), "2026-10-25", null)).toBe(true);
    expect(C.remindsOn(reminder({}), "2026-10-26", null)).toBe(false);
    expect(C.remindsOn(reminder({ done: true }), "2026-10-25", null)).toBe(false);
  });
  it("repeating by Gregorian date: the same month and day, from its own day on", () => {
    const r = reminder({ date: "2026-10-25", repeat: { by: "gregorian" } });
    expect(C.remindsOn(r, "2027-10-25", null)).toBe(true);
    expect(C.remindsOn(r, "2027-10-26", null)).toBe(false);
    expect(C.remindsOn(r, "2025-10-25", null)).toBe(false);
  });
  it("repeating by Hijri date: the same Hijri month and day, wherever that falls", () => {
    const r = reminder({ date: "2027-02-08", repeat: { by: "hijri", month: 9, day: 1 } });
    expect(C.remindsOn(r, "2027-02-08", { month: 9, day: 1 })).toBe(true);
    expect(C.remindsOn(r, "2028-01-28", { month: 9, day: 1 })).toBe(true);
    expect(C.remindsOn(r, "2028-01-29", { month: 9, day: 2 })).toBe(false);
    expect(C.remindsOn(r, "2028-01-28", null)).toBe(false); // the Hijri date of that day is unknown
    expect(C.remindsOn(r, "2026-01-28", { month: 9, day: 1 })).toBe(false); // before it began
  });
  it("29 February waits for a leap year", () => {
    expect(C.nextAnniversary("2024-02-29", "2026-03-01")).toBe("2028-02-29");
    expect(C.nextAnniversary("2026-10-25", "2026-10-26")).toBe("2027-10-25");
    expect(C.nextAnniversary("2026-10-25", "2026-10-25")).toBe("2026-10-25");
  });
  it("the Hijri month and day of a reminder's date come from the saved days", () => {
    expect(C.hijriOfDate(pool, "2027-02-08", 0)).toEqual({ month: 9, day: 1 });
    expect(C.hijriOfDate(pool, "2027-02-08", 1)).toEqual({ month: 9, day: 2 });
    expect(C.hijriOfDate(pool, "2035-02-08", 0)).toBeNull();
  });
});

describe("coming up", () => {
  const placed = [
    { event: EVENTS[0]!, date: "2026-11-01", hijriLabel: "20 Jumada al-ula 1448", daysUntil: 17 },
    { event: EVENTS[1]!, date: "2027-01-02", hijriLabel: "x", daysUntil: 79 },
  ];
  const input = { events: placed, pool, adjust: 0, today: TODAY, end: "2027-04-01", limit: 10 };
  it("events and reminders, nearest first, events before reminders on the same day", () => {
    const list = C.comingUp({ ...input, reminders: [reminder({ date: "2026-10-25" }), reminder({ id: "s", title: "Same day", date: "2026-11-01" })] });
    expect(list.map((u) => [u.date, u.kind])).toEqual([["2026-10-25", "reminder"], ["2026-11-01", "event"], ["2026-11-01", "reminder"], ["2027-01-02", "event"]]);
    expect(list[0]).toMatchObject({ sub: "Your reminder", daysUntil: 10 });
  });
  it("a repeating reminder appears on each coming occurrence; a Hijri one on the days the service gives", () => {
    const g = C.comingUp({ ...input, reminders: [reminder({ date: "2026-10-20", repeat: { by: "gregorian" } })], events: [] });
    expect(g.map((u) => u.date)).toEqual(["2026-10-20"]); // the next one, 2027-10-20, is past what is known
    const h = C.comingUp({ ...input, reminders: [reminder({ date: "2026-10-01", repeat: { by: "hijri", month: 9, day: 1 } })], events: [] });
    expect(h.map((u) => u.date)).toEqual(["2027-02-08"]);
  });
  it("past reminders, done reminders and anything beyond the known window are left out; the list is cut at the limit", () => {
    const list = C.comingUp({ ...input, limit: 1, reminders: [reminder({ date: "2026-10-01" }), reminder({ id: "d", date: "2026-10-26", done: true }), reminder({ id: "z", date: "2030-01-01" })] });
    expect(list).toHaveLength(1);
    expect(list[0]!.kind).toBe("event");
  });
});
