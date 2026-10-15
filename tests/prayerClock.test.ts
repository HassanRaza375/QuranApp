// Time zones, the next prayer, the countdown and the "last updated" text. All of it is worked out in the LOCATION's zone.
import { afterEach, describe, expect, it } from "vitest";
import { countdownText, dateKeyInZone, formatClock12, lastUpdatedText, nextPrayer, zonedInstant } from "../app/lib/prayerClock";
import type { PrayerDay } from "../app/lib/prayerMonth";

const day = (date: string, t: [string, string, string, string, string]): PrayerDay => ({
  date,
  timings: { Fajr: t[0], Dhuhr: t[1], Asr: t[2], Maghrib: t[3], Isha: t[4] },
  hijri: { day: 1, month: 1, year: 1448, monthNameEn: "" },
});
const KHI = "Asia/Karachi"; // UTC+5, no DST
const today = day("2026-10-15", ["04:59", "11:48", "15:05", "17:31", "18:38"]);
const tomorrow = day("2026-10-16", ["05:00", "11:48", "15:04", "17:30", "18:37"]);
const at = (iso: string) => new Date(iso);

describe("zonedInstant", () => {
  it("Karachi: 17:31 local is 12:31 UTC", () => {
    expect(zonedInstant("2026-10-15", "17:31", KHI).toISOString()).toBe("2026-10-15T12:31:00.000Z");
  });

  it("is independent of the device's time zone (the location's zone decides)", () => {
    const wanted = "2026-10-15T12:31:00.000Z";
    const original = process.env.TZ;
    try {
      for (const tz of ["UTC", "Pacific/Auckland", "America/Los_Angeles", "Asia/Kolkata"]) {
        process.env.TZ = tz;
        expect(zonedInstant("2026-10-15", "17:31", KHI).toISOString(), tz).toBe(wanted);
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it("handles daylight saving: New York before and after the spring change (2026-03-08)", () => {
    expect(zonedInstant("2026-03-07", "12:00", "America/New_York").toISOString()).toBe("2026-03-07T17:00:00.000Z"); // EST, UTC-5
    expect(zonedInstant("2026-03-09", "12:00", "America/New_York").toISOString()).toBe("2026-03-09T16:00:00.000Z"); // EDT, UTC-4
  });

  it("handles London summer time (BST) and winter time (GMT)", () => {
    expect(zonedInstant("2026-07-01", "13:30", "Europe/London").toISOString()).toBe("2026-07-01T12:30:00.000Z");
    expect(zonedInstant("2026-12-01", "13:30", "Europe/London").toISOString()).toBe("2026-12-01T13:30:00.000Z");
  });

  it("a time on the day the clocks change settles on a real instant after the change", () => {
    // 2026-03-08 in New York: 02:00 does not exist; 03:30 EDT is 07:30 UTC
    expect(zonedInstant("2026-03-08", "03:30", "America/New_York").toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });
});

describe("dateKeyInZone", () => {
  it("is the calendar date in that zone", () => {
    expect(dateKeyInZone(at("2026-10-15T20:30:00Z"), KHI)).toBe("2026-10-16"); // already tomorrow in Karachi
    expect(dateKeyInZone(at("2026-10-15T20:30:00Z"), "America/Los_Angeles")).toBe("2026-10-15");
    expect(dateKeyInZone(at("2026-10-15T20:30:00Z"), "UTC")).toBe("2026-10-15");
  });
});

describe("nextPrayer", () => {
  it("before Fajr: Fajr today", () => {
    const n = nextPrayer(today, tomorrow, at("2026-10-14T23:00:00Z"), KHI)!; // 04:00 in Karachi
    expect(n).toMatchObject({ name: "Fajr", isTomorrow: false });
    expect(n.at!.toISOString()).toBe("2026-10-14T23:59:00.000Z");
  });

  it("between prayers: the following one", () => {
    expect(nextPrayer(today, tomorrow, at("2026-10-15T08:00:00Z"), KHI)).toMatchObject({ name: "Asr" }); // 13:00 in Karachi: Dhuhr (11:48) has passed
  });

  it("exactly at a prayer time the next one is the following prayer, not the same one", () => {
    const n = nextPrayer(today, tomorrow, zonedInstant("2026-10-15", "15:05", KHI), KHI)!;
    expect(n.name).toBe("Maghrib");
  });

  it("midday example: 14:00 local gives Asr", () => {
    expect(nextPrayer(today, tomorrow, zonedInstant("2026-10-15", "14:00", KHI), KHI)).toMatchObject({ name: "Asr", isTomorrow: false });
  });

  it("after Isha: tomorrow's real Fajr (not today's Fajr time)", () => {
    const n = nextPrayer(today, tomorrow, zonedInstant("2026-10-15", "21:00", KHI), KHI)!;
    expect(n).toMatchObject({ name: "Fajr", isTomorrow: true });
    expect(n.at!.toISOString()).toBe(zonedInstant("2026-10-16", "05:00", KHI).toISOString()); // 05:00, not 04:59
  });

  it("after Isha with tomorrow unknown (month end, offline): Fajr tomorrow with no time, never a guess", () => {
    const n = nextPrayer(today, null, zonedInstant("2026-10-15", "21:00", KHI), KHI)!;
    expect(n).toEqual({ name: "Fajr", at: null, isTomorrow: true });
  });

  it("no record for today: null", () => {
    expect(nextPrayer(null, tomorrow, new Date(), KHI)).toBeNull();
  });

  it("uses the location's zone even if the device is elsewhere", () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = "America/Los_Angeles";
      const n = nextPrayer(today, tomorrow, zonedInstant("2026-10-15", "14:00", KHI), KHI)!;
      expect(n.name).toBe("Asr");
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

describe("countdown and formatting", () => {
  it("countdownText: minute precision", () => {
    expect(countdownText(94 * 60000)).toBe("1h 34m");
    expect(countdownText(60 * 60000)).toBe("1h 0m");
    expect(countdownText(34 * 60000)).toBe("34m");
    expect(countdownText(59_999)).toBe("less than a minute");
    expect(countdownText(-5)).toBe("less than a minute");
  });

  it("formatClock12", () => {
    expect(formatClock12("04:32")).toBe("4:32 AM");
    expect(formatClock12("11:59")).toBe("11:59 AM");
    expect(formatClock12("12:00")).toBe("12:00 PM");
    expect(formatClock12("00:05")).toBe("12:05 AM");
    expect(formatClock12("18:29")).toBe("6:29 PM");
  });

  describe("lastUpdatedText (judged on the device's local calendar)", () => {
    const local = (y: number, m: number, d: number, h: number, mi: number) => new Date(y, m - 1, d, h, mi).getTime();
    afterEach(() => undefined);
    it("today, yesterday, older", () => {
      const now = new Date(2026, 9, 15, 20, 0);
      expect(lastUpdatedText(local(2026, 10, 15, 9, 14), now)).toBe("today at 9:14 AM");
      expect(lastUpdatedText(local(2026, 10, 14, 23, 59), now)).toBe("yesterday at 11:59 PM");
      expect(lastUpdatedText(local(2026, 10, 12, 9, 0), now)).toMatch(/12 Oct/);
    });
    it("a fetch at 00:30 local is 'today' even where the UTC date is still yesterday", () => {
      const now = new Date(2026, 9, 15, 8, 0);
      expect(lastUpdatedText(local(2026, 10, 15, 0, 30), now)).toBe("today at 12:30 AM");
    });
  });
});
