// The declination module against NOAA's own published test values (WMM2025). If any of these fail, the correction must not ship.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { declination, decimalYear, magneticField, MODEL_NAME, VALID_FROM, VALID_UNTIL } from "../app/lib/declination";
import { WMM_COEFFICIENTS } from "../app/data/wmm2025.generated";

const fx = (name: string) => fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8");
const dataLines = (s: string) => s.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));

describe("the generated coefficients", () => {
  it("are NOAA's WMM2025: 90 rows (degree 1 to 12), epoch 2025.0, equal to the coefficient file", () => {
    expect(MODEL_NAME).toBe("WMM-2025");
    expect(WMM_COEFFICIENTS).toHaveLength(90);
    const rows = fx("WMM2025.COF")
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.trim().split(/\s+/))
      .filter((p) => p.length >= 6 && !p[0]!.startsWith("9999"))
      .map((p) => p.slice(0, 6).map(Number));
    const plain = (a: number[][]) => a.map((r) => r.map((v) => v + 0)); // -0 and 0 are the same coefficient
    expect(plain(WMM_COEFFICIENTS.map((r) => [...r]))).toEqual(plain(rows));
    expect(fx("WMM2025.COF").trim().split(/\r?\n/)[0]).toMatch(/^\s*2025\.0\s+WMM-2025/);
  });
});

describe("NOAA test values (WMM2025_TEST_VALUES.txt, 12 lines)", () => {
  // Fields: date, height km, lat, lon, X, Y, Z, H, F, I, D, ...
  const rows = dataLines(fx("wmm2025-test-values.txt")).map((l) => l.trim().split(/\s+/).map(Number));
  it("has the 12 published lines", () => expect(rows).toHaveLength(12));
  it.each(rows.map((r, i) => [i + 1, r] as const))("line %i: X, Y, Z within 0.1 nT and declination within 0.01 degree", (_i, r) => {
    const [date, h, lat, lon, X, Y, Z, , , , D] = r as number[];
    const f = magneticField(date!, lat!, lon!, h!);
    expect(Math.abs(f.x - X!)).toBeLessThan(0.1);
    expect(Math.abs(f.y - Y!)).toBeLessThan(0.1);
    expect(Math.abs(f.z - Z!)).toBeLessThan(0.1);
    expect(Math.abs(f.declination - D!)).toBeLessThan(0.01);
  });
});

describe("NOAA test values (the 100-line file in the coefficient zip)", () => {
  // Fields: date, height km, lat, lon, D, I, H, X, Y, Z, F, ...
  const rows = dataLines(fx("wmm2025-test-values-100.txt")).map((l) => l.trim().split(/\s+/).map(Number));
  it("has the 100 published lines", () => expect(rows).toHaveLength(100));
  it("every line: declination within 0.01 degree, X, Y, Z within 0.5 nT", () => {
    let worstD = 0;
    for (const r of rows) {
      const [date, h, lat, lon, D, , , X, Y, Z] = r as number[];
      const f = magneticField(date!, lat!, lon!, h!);
      const dd = Math.abs(((f.declination - D! + 540) % 360) - 180);
      worstD = Math.max(worstD, dd);
      expect(dd, `D at ${lat},${lon}`).toBeLessThan(0.01);
      expect(Math.abs(f.x - X!), `X at ${lat},${lon}`).toBeLessThan(0.5);
      expect(Math.abs(f.y - Y!), `Y at ${lat},${lon}`).toBeLessThan(0.5);
      expect(Math.abs(f.z - Z!), `Z at ${lat},${lon}`).toBeLessThan(0.5);
    }
    expect(worstD).toBeLessThan(0.01);
  });
});

describe("declination()", () => {
  const when = new Date("2026-10-16T00:00:00Z");
  it("gives the expected sign and size in the cities the app is used from", () => {
    const at = (lat: number, lon: number) => {
      const r = declination(lat, lon, when);
      expect(r.ok).toBe(true);
      return (r as { degrees: number }).degrees;
    };
    expect(at(31.5204, 74.3587)).toBeGreaterThan(1.5); // Lahore: about +2
    expect(at(31.5204, 74.3587)).toBeLessThan(3);
    expect(at(52.6386, -1.13169)).toBeGreaterThan(0); // Leicester: under 1
    expect(at(52.6386, -1.13169)).toBeLessThan(1.5);
    expect(at(40.7, -74)).toBeLessThan(-12); // New York: about -12.5
    expect(at(37.77, -122.4)).toBeGreaterThan(12); // San Francisco: about +12.8
  });
  it("is not given outside the model's validity, near a pole, or for bad input", () => {
    expect(declination(31, 74, new Date("2024-06-01T00:00:00Z"))).toEqual({ ok: false, reason: "outside-validity" });
    expect(declination(31, 74, new Date("2030-01-01T00:00:00Z"))).toEqual({ ok: false, reason: "outside-validity" });
    expect(declination(89.95, 0, when)).toEqual({ ok: false, reason: "near-pole" });
    expect(declination(95, 0, when)).toEqual({ ok: false, reason: "bad-input" });
    expect(declination(Number.NaN, 0, when)).toEqual({ ok: false, reason: "bad-input" });
    expect(declination(10, 10, new Date("nope"))).toEqual({ ok: false, reason: "bad-input" });
    expect(VALID_FROM).toBe(2025);
    expect(VALID_UNTIL).toBe(2030);
  });
  it("decimalYear is the calendar fraction", () => {
    expect(decimalYear(new Date("2025-01-01T00:00:00Z"))).toBe(2025);
    expect(decimalYear(new Date("2025-07-02T12:00:00Z"))).toBeCloseTo(2025.5, 2);
  });
});
