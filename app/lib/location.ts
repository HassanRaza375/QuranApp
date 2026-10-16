// Where the user is. There is NO default city: with no location the tiles say "Set location".
// Sources, in order: the revamp's own saved location, then the legacy `last_location` key (read-only, written by the
// legacy Qibla page as `{lat, lng}`). Device geolocation is only ever asked for after a tap.
import { getJSON, setJSON } from "./storage";

export const LOCATION_KEY = "quran:location:v1"; // new, additive: { lat, lon, source, updatedAt }
export const LEGACY_LOCATION_KEY = "last_location"; // legacy, read-only: { lat, lng }

export interface SavedLocation {
  lat: number;
  lon: number;
  /** "manual" (Phase 5) is a place the user searched for or typed as coordinates; the legacy app never reads this key */
  source: "device" | "legacy" | "manual";
  updatedAt: number;
  /** a name to confirm the place by ("Leicester, England, United Kingdom"), for manual places found by name */
  label?: string;
}

const valid = (lat: unknown, lon: unknown): lat is number =>
  typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

export function readLocation(): SavedLocation | null {
  const own = getJSON<Partial<SavedLocation> | null>(LOCATION_KEY, null);
  if (own && valid(own.lat, own.lon)) {
    const source = own.source === "legacy" || own.source === "manual" ? own.source : "device";
    const label = typeof own.label === "string" && own.label.trim() ? own.label.trim() : undefined;
    return { lat: own.lat, lon: own.lon as number, source, updatedAt: Number(own.updatedAt) || 0, ...(label ? { label } : {}) };
  }
  const old = getJSON<{ lat?: unknown; lng?: unknown } | null>(LEGACY_LOCATION_KEY, null);
  if (old && valid(old.lat, old.lng)) return { lat: old.lat, lon: old.lng as number, source: "legacy", updatedAt: 0 };
  return null;
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const MOVE_THRESHOLD_KM = 10;

/** A new GPS fix replaces the saved place only if it is more than about 10 km away, so jitter never changes the cache key. */
export function applyFix(current: SavedLocation | null, fix: { lat: number; lon: number }, now: number): SavedLocation {
  if (current && distanceKm(current, fix) <= MOVE_THRESHOLD_KM) return current;
  return { lat: fix.lat, lon: fix.lon, source: "device", updatedAt: now };
}

export function saveLocation(loc: SavedLocation): void {
  setJSON(LOCATION_KEY, loc);
}
