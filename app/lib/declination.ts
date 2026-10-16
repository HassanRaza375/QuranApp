// Magnetic declination (the angle between true north and magnetic north) from NOAA's World Magnetic Model 2025.
// A small self-contained module: the spherical-harmonic synthesis of the WMM technical report, degree 12, on the
// coefficients in app/data/wmm2025.generated.ts. Pure.
//
// Why: a phone compass reports a heading from MAGNETIC north, while the Qibla bearing is measured from TRUE north. The
// difference is a few degrees in Pakistan and the UK and about 12 degrees on the US west coast, so the needle would point that far off.
//
// Checked against NOAA's own published test values (tests/declination.test.ts): all 12 test lines of
// WMM2025_TEST_VALUES.txt (X, Y, Z within 0.1 nT, declination within 0.01 degrees) and the 100-line file in NOAA's
// coefficient zip. If any value stops matching, the correction must not ship (the page then says it is not applied).
//
// Validity: NOAA lists WMM2025 as valid from 2025.0 to 2030.0. Outside that range `declination` returns null.
import { WMM_COEFFICIENTS, WMM_EPOCH, WMM_MODEL } from "~/data/wmm2025.generated";

export const MODEL_NAME = WMM_MODEL;
export const VALID_FROM = WMM_EPOCH; // 2025.0
export const VALID_UNTIL = WMM_EPOCH + 5; // 2030.0 (NOAA: "valid until late 2029")
/** The model's validity as a date, for the page: the end of 2029 or the start of 2030, per NOAA. */
export const VALID_UNTIL_TEXT = "2030";

const N = 12;
const A = 6378.137; // WGS84 semi-major axis, km
const F = 1 / 298.257223563;
const E2 = F * (2 - F);
const R_REF = 6371.2; // geomagnetic reference radius, km

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const idx = (n: number, m: number) => (n * (n + 1)) / 2 + m;

const SIZE = idx(N, N) + 1;
const G = new Float64Array(SIZE);
const H = new Float64Array(SIZE);
const GD = new Float64Array(SIZE);
const HD = new Float64Array(SIZE);
for (const [n, m, g, h, gd, hd] of WMM_COEFFICIENTS) {
  G[idx(n, m)] = g;
  H[idx(n, m)] = h;
  GD[idx(n, m)] = gd;
  HD[idx(n, m)] = hd;
}

// Schmidt semi-normalisation factors (they do not depend on the place)
const SCHMIDT = new Float64Array(SIZE);
SCHMIDT[0] = 1;
for (let n = 1; n <= N; n++) {
  SCHMIDT[idx(n, 0)] = (SCHMIDT[idx(n - 1, 0)]! * (2 * n - 1)) / n;
  for (let m = 1; m <= n; m++) SCHMIDT[idx(n, m)] = SCHMIDT[idx(n, m - 1)]! * Math.sqrt(((n - m + 1) * (m === 1 ? 2 : 1)) / (n + m));
}

export interface MagneticField {
  /** north, east and down components (nT), in the geodetic frame */
  x: number;
  y: number;
  z: number;
  /** declination in degrees, positive when magnetic north is east of true north */
  declination: number;
}

/** The field at a place. `year` is a decimal year (2026.8), `heightKm` above the WGS84 ellipsoid. */
export function magneticField(year: number, latDeg: number, lonDeg: number, heightKm = 0): MagneticField {
  const lat = rad(latDeg);
  const lon = rad(lonDeg);
  // geodetic to geocentric spherical
  const rc = A / Math.sqrt(1 - E2 * Math.sin(lat) ** 2);
  const p = (rc + heightKm) * Math.cos(lat);
  const z = (rc * (1 - E2) + heightKm) * Math.sin(lat);
  const r = Math.hypot(p, z);
  const phi = Math.asin(z / r);
  const x = Math.sin(phi);
  const c = Math.cos(phi);

  // Gauss-normalised associated Legendre functions and their derivatives, then Schmidt semi-normalised
  const P = new Float64Array(SIZE);
  const dP = new Float64Array(SIZE);
  P[0] = 1;
  for (let n = 1; n <= N; n++) {
    for (let m = 0; m <= n; m++) {
      const i = idx(n, m);
      if (n === m) {
        const i1 = idx(n - 1, m - 1);
        P[i] = c * P[i1]!;
        dP[i] = c * dP[i1]! + x * P[i1]!;
      } else if (n === 1 && m === 0) {
        const i1 = idx(n - 1, m);
        P[i] = x * P[i1]!;
        dP[i] = x * dP[i1]! - c * P[i1]!;
      } else {
        const i1 = idx(n - 2, m);
        const i2 = idx(n - 1, m);
        if (m > n - 2) {
          P[i] = x * P[i2]!;
          dP[i] = x * dP[i2]! - c * P[i2]!;
        } else {
          const k = ((n - 1) ** 2 - m * m) / ((2 * n - 1) * (2 * n - 3));
          P[i] = x * P[i2]! - k * P[i1]!;
          dP[i] = x * dP[i2]! - c * P[i2]! - k * dP[i1]!;
        }
      }
    }
  }
  for (let i = 0; i < SIZE; i++) {
    P[i] = P[i]! * SCHMIDT[i]!;
    dP[i] = -dP[i]! * SCHMIDT[i]!;
  }

  const dt = year - WMM_EPOCH;
  let bx = 0;
  let by = 0;
  let bz = 0;
  for (let n = 1; n <= N; n++) {
    const rr = Math.pow(R_REF / r, n + 2);
    for (let m = 0; m <= n; m++) {
      const i = idx(n, m);
      const g = G[i]! + dt * GD[i]!;
      const h = H[i]! + dt * HD[i]!;
      const cm = Math.cos(m * lon);
      const sm = Math.sin(m * lon);
      bz -= rr * (g * cm + h * sm) * (n + 1) * P[i]!;
      by += rr * (g * sm - h * cm) * m * P[i]!;
      bx -= rr * (g * cm + h * sm) * dP[i]!;
    }
  }
  by /= c;
  // rotate from geocentric to geodetic
  const d = phi - lat;
  const X = bx * Math.cos(d) - bz * Math.sin(d);
  const Y = by;
  const Z = bx * Math.sin(d) + bz * Math.cos(d);
  return { x: X, y: Y, z: Z, declination: deg(Math.atan2(Y, X)) };
}

/** A decimal year ("2026.79") for a date, from the calendar (UTC). */
export function decimalYear(d: Date): number {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - start) / (end - start);
}

export type DeclinationResult = { ok: true; degrees: number } | { ok: false; reason: "outside-validity" | "near-pole" | "bad-input" };

/**
 * The declination to add to a MAGNETIC heading to get a TRUE heading. Null-free: a reason when it cannot be given
 * (the date is outside the model's validity, the place is within a hair of a pole, or the input is not a place).
 */
export function declination(lat: number, lon: number, date: Date): DeclinationResult {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || Number.isNaN(date.getTime())) return { ok: false, reason: "bad-input" };
  const year = decimalYear(date);
  if (year < VALID_FROM || year >= VALID_UNTIL) return { ok: false, reason: "outside-validity" };
  if (Math.abs(lat) > 89.9) return { ok: false, reason: "near-pole" };
  return { ok: true, degrees: magneticField(year, lat, lon, 0).declination };
}
