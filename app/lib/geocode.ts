// Finding a place by name (Open-Meteo's geocoding API, data from GeoNames) and parsing typed coordinates. Pure.
//
// What is sent: only the typed text, only when Search is pressed, as the `name` of one GET request. Nothing else.
// AlAdhan's own city endpoints cannot be used for this: they return times but placeholder coordinates for every city.
//
// Terms (read on 2026-10-16, docs/phases/phase-05-prayer-qibla.md): the free API is for non-commercial use; the data is CC BY 4.0
// and a link to Open-Meteo must be shown next to the location data; GeoNames asks for credit with a link.
import { normalize } from "./listingSearch";

export const GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
export const GEOCODE_ATTRIBUTION = { text: "Place search by Open-Meteo.com, with location data from GeoNames", href: "https://open-meteo.com/" } as const;

export interface Place {
  name: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  /** "Leicester, England, United Kingdom": what the user sees to confirm the right place */
  label: string;
}

/** The request URL for a typed name (trimmed; nothing else is added but the result count and language). */
export const geocodeUrl = (name: string): string => `${GEOCODE_BASE}?name=${encodeURIComponent(name.trim())}&count=10&language=en&format=json`;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The places in a response. A response with no `results` (an unknown name) is an empty list, not an error. */
export function parseGeocode(json: unknown): Place[] {
  const list = (json as { results?: unknown } | null)?.results;
  if (list === undefined) return [];
  if (!Array.isArray(list)) throw new Error("The place search returned an unexpected answer");
  const out: Place[] = [];
  for (const r of list as Record<string, unknown>[]) {
    const lat = r.latitude;
    const lon = r.longitude;
    if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !str(r.name)) continue;
    const region = str(r.admin1);
    const country = str(r.country);
    const label = [str(r.name), region, country].filter((p, i, a) => p && a.indexOf(p) === i).join(", ");
    out.push({ name: str(r.name), region, country, countryCode: str(r.country_code), lat, lon, timezone: str(r.timezone), label });
  }
  return out;
}

/** Keeps the places whose country, region or two-letter country code matches the typed text. An empty text keeps all. */
export function filterByCountry(places: Place[], country: string): Place[] {
  const q = normalize(country);
  if (!q) return places;
  return places.filter((p) => normalize(p.country).includes(q) || normalize(p.countryCode) === q || normalize(p.region).includes(q));
}

export interface Coordinates {
  lat: number;
  lon: number;
}

const part = (s: string, plus: string, minus: string): number | null => {
  const m = /^\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSEWnsew])?\s*$/.exec(s);
  if (!m) return null;
  let v = Number(m[1]);
  const h = m[2]?.toUpperCase();
  if (h) {
    if (v < 0) return null; // a hemisphere letter and a minus sign together are ambiguous
    if (h === minus) v = -v;
    else if (h !== plus) return null;
  }
  return v;
};

/** "31.5204, 74.3587", "31.5204 74.3587", "31.52 N, 74.36 E", "-33.87, 151.21" gives coordinates; anything else, or out of range, gives null. */
export function parseCoordinates(text: string): Coordinates | null {
  const t = text.trim();
  const bits = t.includes(",") ? t.split(",") : t.split(/\s+(?=[+-]?\d)/);
  if (bits.length !== 2) return null;
  const lat = part(bits[0]!, "N", "S");
  const lon = part(bits[1]!, "E", "W");
  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** "31.52, 74.36": how a saved place without a name is shown. */
export const coordinateText = (c: Coordinates): string => `${c.lat.toFixed(2)}, ${c.lon.toFixed(2)}`;
