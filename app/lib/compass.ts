// The compass maths. Pure, so every rule is unit-tested with known device orientations.
//
// What the browser gives us:
//  - iPhone and iPad Safari: `webkitCompassHeading` (degrees clockwise from MAGNETIC north, already tilt-corrected) and
//    `webkitCompassAccuracy` (degrees, negative = not valid).
//  - Chrome for Android: `deviceorientationabsolute` events, whose `alpha` is measured from north (not from an arbitrary
//    start, which is what the plain `deviceorientation` event gives and what the legacy page wrongly used).
//  - Any other browser: `deviceorientation` counts only when the event says `absolute: true`.
// A relative `alpha` is never used as a heading.
//
// A phone compass reports MAGNETIC north; the Qibla bearing is from TRUE north. `trueHeading` adds the declination
// (lib/declination.ts) to correct that.

export const ALIGN_ENTER_DEG = 5; // within this the needle counts as aligned (the legacy page used 2, finer than phones can deliver)
export const ALIGN_LEAVE_DEG = 7; // and it stays aligned until it is this far off, so the state does not flicker at the edge

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const normalize = (a: number): number => ((a % 360) + 360) % 360;

/** The signed shortest turn from `from` to `to`, in (-180, 180]. Positive is clockwise (a right turn). */
export function shortestTurn(from: number, to: number): number {
  const d = normalize(to - from);
  return d > 180 ? d - 360 : d;
}

/** One low-pass step on a circular angle: moves `factor` of the way along the shortest turn (no jump across 359 and 0). */
export const smooth = (prev: number, target: number, factor = 0.2): number => normalize(prev + shortestTurn(prev, target) * factor);

/**
 * The compass heading from the three rotation angles of the W3C orientation event (degrees): the direction the TOP edge of
 * the phone points when it lies roughly flat (the way a compass is held), and the direction the BACK of the phone faces when
 * it is held upright. `screenAngle` is `screen.orientation.angle` (0, 90, 180, 270): in landscape the top edge is not the top
 * of the screen, so the heading of the screen's top is the top edge's heading plus that angle (to be confirmed on a device).
 */
export function headingFromAngles(alpha: number, beta: number, gamma: number, screenAngle = 0): number {
  const a = rad(alpha);
  const b = rad(beta);
  const g = rad(gamma);
  const cA = Math.cos(a);
  const sA = Math.sin(a);
  const cB = Math.cos(b);
  const sB = Math.sin(b);
  const cG = Math.cos(g);
  const sG = Math.sin(g);
  // the phone's axes in the Earth frame (x east, y north, z up): the top edge (y) and the screen normal (z)
  const topE = -sA * cB;
  const topN = cA * cB;
  const faceUp = cB * cG; // how much the screen faces up (1) or down (-1)
  if (Math.abs(faceUp) >= Math.SQRT1_2) return normalize(deg(Math.atan2(topE, topN)) + screenAngle); // flat: the top edge
  const backE = -(cA * sG + sA * sB * cG);
  const backN = -(sA * sG - cA * sB * cG);
  return normalize(deg(Math.atan2(backE, backN))); // upright: the back of the phone
}

export type SensorSource = "ios" | "android-absolute" | "absolute";

export interface SensorReading {
  /** degrees clockwise from MAGNETIC north */
  heading: number;
  source: SensorSource;
  /** the sensor's own accuracy in degrees, when it reports one (iPhone only); null = not reported or not valid */
  accuracy: number | null;
}

export interface OrientationLike {
  alpha?: number | null;
  beta?: number | null;
  gamma?: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number | null;
  webkitCompassAccuracy?: number | null;
}

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Turns a browser event into a heading from magnetic north, or null when it does not carry one we can trust. */
export function readingFromEvent(type: "deviceorientation" | "deviceorientationabsolute", e: OrientationLike, screenAngle = 0): SensorReading | null {
  if (num(e.webkitCompassHeading)) {
    return { heading: normalize(e.webkitCompassHeading + screenAngle), source: "ios", accuracy: num(e.webkitCompassAccuracy) && e.webkitCompassAccuracy >= 0 ? e.webkitCompassAccuracy : null };
  }
  if (!num(e.alpha) || !num(e.beta) || !num(e.gamma)) return null;
  if (type === "deviceorientationabsolute") return { heading: headingFromAngles(e.alpha, e.beta, e.gamma, screenAngle), source: "android-absolute", accuracy: null };
  if (e.absolute === true) return { heading: headingFromAngles(e.alpha, e.beta, e.gamma, screenAngle), source: "absolute", accuracy: null };
  return null; // a relative alpha says nothing about north
}

/** Corrects a magnetic heading to a true heading with the declination (positive when magnetic north is east of true north). */
export const trueHeading = (magnetic: number, declinationDeg: number): number => normalize(magnetic + declinationDeg);

export interface Facing {
  /** signed turn from the heading to the Qibla: positive is right */
  turn: number;
  aligned: boolean;
  text: string;
}

/**
 * Where the Qibla is relative to where the phone points. `wasAligned` gives the state a small hysteresis: aligned within
 * ALIGN_ENTER_DEG, and it stays aligned until ALIGN_LEAVE_DEG, so it does not flicker at the edge.
 */
export function facing(bearing: number, heading: number, wasAligned = false): Facing {
  const turn = shortestTurn(heading, bearing);
  const abs = Math.abs(turn);
  const aligned = wasAligned ? abs <= ALIGN_LEAVE_DEG : abs <= ALIGN_ENTER_DEG;
  const text = aligned ? "Facing the Qibla" : `Turn ${turn > 0 ? "right" : "left"} ${Math.round(abs)}°`;
  return { turn, aligned, text };
}

const CARDINALS = ["North", "North-northeast", "Northeast", "East-northeast", "East", "East-southeast", "Southeast", "South-southeast", "South", "South-southwest", "Southwest", "West-southwest", "West", "West-northwest", "Northwest", "North-northwest"];

/** The nearest of the 16 compass points ("West" for 260.4 degrees: 270 is 9.6 away, west-southwest at 247.5 is 12.9 away). */
export const cardinal16 = (bearing: number): string => CARDINALS[Math.round(normalize(bearing) / 22.5) % 16]!;

/** The accuracy line the sensor earns: what it reported, or a calibration prompt when the iPhone says it is unsure. */
export function accuracyNote(accuracy: number | null, source: SensorSource | null): string | null {
  if (source === "ios" && (accuracy === null || accuracy > 20)) return "The compass needs calibrating. Move your phone in a figure of eight.";
  if (accuracy !== null) return `Compass accuracy about ±${Math.round(accuracy)}°.`;
  return null;
}
