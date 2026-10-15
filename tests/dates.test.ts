// The local-date logic. "Today" is the device's LOCAL calendar day; the UTC date is only ever written for the legacy app.
import { afterEach, describe, expect, it } from "vitest";
import { daysInMonth, daysLeftInMonth, legacyUtcDateKey, localDateKey, localMonthKey, nextMonthKey } from "../app/lib/dates";

const original = process.env.TZ;
afterEach(() => {
  if (original === undefined) delete process.env.TZ;
  else process.env.TZ = original;
});
const inZone = <T>(tz: string, fn: () => T): T => {
  process.env.TZ = tz;
  return fn();
};

// 2026-10-15 20:00 UTC
const INSTANT = new Date("2026-10-15T20:00:00Z");

describe("localDateKey vs the UTC date (the legacy ayah-of-day bug)", () => {
  it("east of UTC (Pakistan, UTC+5): after 19:00 UTC it is already the next local day", () => {
    inZone("Asia/Karachi", () => {
      expect(localDateKey(INSTANT)).toBe("2026-10-16"); // 01:00 local on the 16th
      expect(legacyUtcDateKey(INSTANT)).toBe("2026-10-15"); // what the legacy app used as "today"
    });
  });

  it("the legacy date is wrong for 5 hours a day in UTC+5 (local midnight to 05:00)", () => {
    inZone("Asia/Karachi", () => {
      for (const localHour of [0, 1, 2, 3, 4]) {
        const t = new Date(2026, 9, 16, localHour, 30); // the 16th, local
        expect(localDateKey(t), `${localHour}:30`).toBe("2026-10-16");
        expect(legacyUtcDateKey(t), `${localHour}:30`).toBe("2026-10-15");
      }
      const t5 = new Date(2026, 9, 16, 5, 30);
      expect(legacyUtcDateKey(t5)).toBe("2026-10-16"); // only from 05:00 do they agree
    });
  });

  it("west of UTC (US Pacific, UTC-7 in October): in the evening the UTC date is already tomorrow", () => {
    inZone("America/Los_Angeles", () => {
      const t = new Date("2026-10-16T03:00:00Z"); // 20:00 local on the 15th
      expect(localDateKey(t)).toBe("2026-10-15");
      expect(legacyUtcDateKey(t)).toBe("2026-10-16");
    });
  });

  it("far east (New Zealand, UTC+13 in October)", () => {
    inZone("Pacific/Auckland", () => {
      expect(localDateKey(INSTANT)).toBe("2026-10-16"); // 09:00 local
      const t = new Date("2026-10-15T10:59:00Z"); // 23:59 local on the 15th
      expect(localDateKey(t)).toBe("2026-10-15");
      expect(localDateKey(new Date("2026-10-15T11:00:00Z"))).toBe("2026-10-16"); // local midnight
    });
  });

  it("UTC: the two agree", () => {
    inZone("UTC", () => {
      expect(localDateKey(INSTANT)).toBe(legacyUtcDateKey(INSTANT));
    });
  });

  it("local midnight is the boundary, in every zone", () => {
    for (const tz of ["Asia/Karachi", "America/Los_Angeles", "Pacific/Auckland", "Asia/Kolkata", "UTC"]) {
      inZone(tz, () => {
        expect(localDateKey(new Date(2026, 9, 15, 23, 59, 59)), tz).toBe("2026-10-15");
        expect(localDateKey(new Date(2026, 9, 16, 0, 0, 0)), tz).toBe("2026-10-16");
      });
    }
  });

  it("pads month and day", () => {
    inZone("UTC", () => {
      expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
      expect(localMonthKey(new Date(2026, 0, 5))).toBe("2026-01");
    });
  });
});

describe("month helpers", () => {
  it("daysInMonth", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 10)).toBe(31);
    expect(daysInMonth(2026, 11)).toBe(30);
  });
  it("nextMonthKey rolls the year", () => {
    expect(nextMonthKey("2026-10")).toBe("2026-11");
    expect(nextMonthKey("2026-12")).toBe("2027-01");
  });
  it("daysLeftInMonth counts today", () => {
    expect(daysLeftInMonth(new Date(2026, 9, 31))).toBe(1);
    expect(daysLeftInMonth(new Date(2026, 9, 25))).toBe(7);
    expect(daysLeftInMonth(new Date(2026, 9, 1))).toBe(31);
  });
});
