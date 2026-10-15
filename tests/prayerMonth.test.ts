// The monthly time parser (including the "(PKT)" suffix), the cache key, and response validation.
// The fixtures are real AlAdhan responses for Lahore, October 2026 (Sunni method 2 and Ja'fari method 0).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clockToMinutes, monthUrl, normalizeMonthResponse, parseClock, prayerMonthKey, roundCoord, type PrayerRequest } from "../app/lib/prayerMonth";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8"));
const sunni = () => fixture("aladhan-lahore-2026-10-sunni.json");
const jafari = () => fixture("aladhan-lahore-2026-10-jafari.json");

const REQ: PrayerRequest = { lat: 31.5204, lon: 74.3587, method: 2, school: 0, midnightMode: 0, month: "2026-10" };
const REQ_J: PrayerRequest = { ...REQ, method: 0, midnightMode: 1 };

describe("parseClock: the monthly format has a suffix, the daily format does not", () => {
  it("reads the plain daily format", () => {
    expect(parseClock("04:59")).toBe("04:59");
    expect(parseClock("23:05")).toBe("23:05");
    expect(parseClock("00:00")).toBe("00:00");
  });

  it("reads the monthly format with a zone suffix (what the legacy parser turned into NaN)", () => {
    expect(parseClock("04:59 (PKT)")).toBe("04:59");
    expect(parseClock("17:31 (PKT)")).toBe("17:31");
    expect(parseClock("06:05 (+05)")).toBe("06:05");
    expect(parseClock("01:54 (BST)")).toBe("01:54");
    // the legacy way of reading it, to document the bug this guards against
    const legacy = "04:59 (PKT)".split(":").map(Number);
    expect(Number.isNaN(legacy[1])).toBe(true);
  });

  it("pads a one-digit hour and trims whitespace", () => {
    expect(parseClock("4:59")).toBe("04:59");
    expect(parseClock("  4:07 (PKT)")).toBe("04:07");
  });

  it("rejects things that are not a clock time", () => {
    for (const bad of ["", "abc", "24:00", "12:60", "12:5", "12-30", "1230", "12:305", null, undefined, 1230, {}]) {
      expect(parseClock(bad), String(bad)).toBeNull();
    }
  });

  it("converts to minutes", () => {
    expect(clockToMinutes("00:00")).toBe(0);
    expect(clockToMinutes("04:59")).toBe(299);
    expect(clockToMinutes("23:59")).toBe(1439);
  });
});

describe("cache key (docs/PLAN.md)", () => {
  it("rounds coordinates to 2 decimals", () => {
    expect(roundCoord(31.5204)).toBe("31.52");
    expect(roundCoord(74.3587)).toBe("74.36");
    expect(roundCoord(-0.1278)).toBe("-0.13");
    expect(roundCoord(-0.001)).toBe("0.00"); // never "-0.00"
  });

  it("is prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>", () => {
    expect(prayerMonthKey(REQ)).toBe("prayer:v1:31.52:74.36:2:0:2026-10");
    expect(prayerMonthKey(REQ_J)).toBe("prayer:v1:31.52:74.36:0:0:2026-10");
  });

  it("is the same for two fixes inside the rounding step and different across it", () => {
    expect(prayerMonthKey({ ...REQ, lat: 31.5201, lon: 74.3589 })).toBe(prayerMonthKey(REQ));
    expect(prayerMonthKey({ ...REQ, lat: 31.54 })).not.toBe(prayerMonthKey(REQ));
  });

  it("changes with method, school and month", () => {
    const base = prayerMonthKey(REQ);
    expect(prayerMonthKey({ ...REQ, method: 0 })).not.toBe(base);
    expect(prayerMonthKey({ ...REQ, school: 1 })).not.toBe(base);
    expect(prayerMonthKey({ ...REQ, month: "2026-11" })).not.toBe(base);
  });

  it("builds the monthly URL with the same rounding", () => {
    const url = monthUrl("https://api.aladhan.com/v1", REQ_J);
    expect(url).toBe("https://api.aladhan.com/v1/calendar/2026/10?latitude=31.52&longitude=74.36&method=0&school=0&midnightMode=1");
  });
});

describe("normalizeMonthResponse with real responses", () => {
  it("accepts the real Sunni month and keeps parsed HH:mm times", () => {
    const r = normalizeMonthResponse(sunni(), REQ, 1_700_000_000_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.days).toHaveLength(31);
    expect(r.record.key).toBe("prayer:v1:31.52:74.36:2:0:2026-10");
    expect(r.record.timezone).toBe("Asia/Karachi");
    expect(r.record.methodName).toMatch(/ISNA/);
    expect(r.record.fetchedAt).toBe(1_700_000_000_000);
    const d15 = r.record.days[14]!;
    expect(d15.date).toBe("2026-10-15");
    expect(d15.timings).toMatchObject({ Fajr: "04:59", Dhuhr: "11:48", Asr: "15:05", Maghrib: "17:31", Isha: "18:38" });
    expect(d15.hijri).toMatchObject({ day: 4, month: 5, year: 1448 });
    for (const day of r.record.days) for (const t of Object.values(day.timings)) expect(t).toMatch(/^\d\d:\d\d$/); // no suffix survives
  });

  it("accepts the real Ja'fari month, and its times differ from Sunni (Maghrib and Fajr)", () => {
    const s = normalizeMonthResponse(sunni(), REQ, 0);
    const j = normalizeMonthResponse(jafari(), REQ_J, 0);
    expect(s.ok && j.ok).toBe(true);
    if (!s.ok || !j.ok) return;
    expect(j.record.methodName).toMatch(/Leva/);
    expect(j.record.key).toBe("prayer:v1:31.52:74.36:0:0:2026-10");
    expect(j.record.days[14]!.timings.Maghrib).toBe("17:46");
    expect(s.record.days[14]!.timings.Maghrib).toBe("17:31");
    expect(j.record.days[14]!.timings.Fajr).not.toBe(s.record.days[14]!.timings.Fajr);
  });
});

describe("normalizeMonthResponse rejects bad data (so a bad response can never replace good cached times)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the fixture is mutated in ad-hoc ways
  const bad = (mutate: (j: any) => void, req: PrayerRequest = REQ) => {
    const j = sunni();
    mutate(j);
    return normalizeMonthResponse(j, req, 0);
  };

  it("not an object, wrong code, no data", () => {
    expect(normalizeMonthResponse(null, REQ, 0).ok).toBe(false);
    expect(normalizeMonthResponse("oops", REQ, 0).ok).toBe(false);
    expect(bad((j) => (j.code = 429)).ok).toBe(false);
    expect(bad((j) => (j.data = null)).ok).toBe(false);
  });

  it("a short or long month", () => {
    expect(bad((j) => j.data.pop())).toMatchObject({ ok: false, reason: expect.stringMatching(/expected 31 days/) });
    expect(bad((j) => j.data.push(j.data[0])).ok).toBe(false);
  });

  it("the asked month is not the returned month", () => {
    expect(bad(() => {}, { ...REQ, month: "2026-11" }).ok).toBe(false); // November has 30 days
    expect(bad(() => {}, { ...REQ, month: "2026-12" }).ok).toBe(false); // 31 days, but the dates say October
  });

  it("a prayer that is missing or not a time", () => {
    expect(bad((j) => delete j.data[3].timings.Asr).ok).toBe(false);
    expect(bad((j) => (j.data[3].timings.Asr = "soon")).ok).toBe(false);
    expect(bad((j) => (j.data[3].timings.Isha = "25:00 (PKT)")).ok).toBe(false);
  });

  it("prayers out of order", () => {
    expect(bad((j) => {
      const t = j.data[10].timings;
      [t.Dhuhr, t.Asr] = [t.Asr, t.Dhuhr];
    })).toMatchObject({ ok: false, reason: expect.stringMatching(/order/) });
  });

  it("a missing time zone, a changing time zone, a missing Hijri date", () => {
    expect(bad((j) => delete j.data[0].meta.timezone).ok).toBe(false);
    expect(bad((j) => (j.data[20].meta.timezone = "Asia/Dubai")).ok).toBe(false);
    expect(bad((j) => (j.data[5].date.hijri.day = "x")).ok).toBe(false);
  });

  it("a different calculation method from the one requested", () => {
    expect(bad(() => {}, { ...REQ, method: 3 })).toMatchObject({ ok: false, reason: expect.stringMatching(/method/) });
  });
});
