// Phase 5 logic: the Qibla bearing against AlAdhan, the compass maths, the schedule rows, the Hijri adjustment, the city search and
// typed coordinates, and the saved-location record. The month fixtures are real AlAdhan responses for Lahore, October 2026.
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { accuracyNote, ALIGN_ENTER_DEG, ALIGN_LEAVE_DEG, cardinal16, facing, headingFromAngles, normalize, readingFromEvent, shortestTurn, smooth, trueHeading } from "../app/lib/compass";
import { filterByCountry, geocodeUrl, parseCoordinates, parseGeocode, coordinateText } from "../app/lib/geocode";
import { adjustNote, hijriShown } from "../app/lib/hijriAdjust";
import { LEGACY_LOCATION_KEY, LOCATION_KEY, readLocation, saveLocation } from "../app/lib/location";
import { countdownLabel, fractionBetween, nextPrayer, zonedInstant } from "../app/lib/prayerClock";
import { normalizeMonthResponse, type PrayerRequest } from "../app/lib/prayerMonth";
import { buildRows, isFriday } from "../app/lib/prayerRows";
import { qiblaBearing } from "../app/lib/qibla";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const fx = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8"));

const REQ: PrayerRequest = { lat: 31.5204, lon: 74.3587, method: 2, school: 0, midnightMode: 0, month: "2026-10" };
const month = (() => {
  const r = normalizeMonthResponse(fx("aladhan-lahore-2026-10-sunni.json"), REQ, 1);
  if (!r.ok) throw new Error(r.reason);
  return r.record;
})();
const TZ = month.timezone; // Asia/Karachi
const day = (d: string) => month.days.find((x) => x.date === d)!;
const at = (date: string, hhmm: string) => zonedInstant(date, hhmm, TZ);

describe("the Qibla bearing against AlAdhan's own /v1/qibla (recorded responses)", () => {
  const recorded = fx("aladhan-qibla.json") as Record<string, { data: { latitude: number; longitude: number; direction: number } }>;
  it.each(Object.entries(recorded))("%s agrees to better than 0.001 degrees", (_name, r) => {
    expect(Math.abs(qiblaBearing(r.data.latitude, r.data.longitude) - r.data.direction)).toBeLessThan(0.001);
  });
});

describe("compass angles", () => {
  it("normalises and takes the shortest signed turn across north", () => {
    expect(normalize(-10)).toBe(350);
    expect(normalize(370)).toBe(10);
    expect(shortestTurn(350, 10)).toBe(20);
    expect(shortestTurn(10, 350)).toBe(-20);
    expect(shortestTurn(0, 180)).toBe(180);
    expect(shortestTurn(90, 90)).toBe(0);
    expect(shortestTurn(359, 1)).toBe(2);
  });
  it("smooths along the short way round (no jump across 359 and 0)", () => {
    expect(smooth(350, 10, 0.5)).toBeCloseTo(0, 5);
    expect(smooth(10, 350, 0.5)).toBeCloseTo(0, 5);
    expect(smooth(0, 90, 1)).toBe(90);
    expect(smooth(90, 90, 0.2)).toBe(90);
  });
  it("heading from the three angles: a phone lying flat gives the direction its top edge points", () => {
    expect(headingFromAngles(0, 0, 0)).toBeCloseTo(0, 5); // top edge to north
    expect(headingFromAngles(90, 0, 0)).toBeCloseTo(270, 5); // turned anticlockwise 90: top edge to the west
    expect(headingFromAngles(270, 0, 0)).toBeCloseTo(90, 5);
    expect(headingFromAngles(180, 0, 0)).toBeCloseTo(180, 5);
  });
  it("is right when the phone is tilted a little, and uses the screen angle in landscape", () => {
    expect(headingFromAngles(0, 20, 0)).toBeCloseTo(0, 5);
    expect(headingFromAngles(0, 0, 20)).toBeCloseTo(0, 5);
    expect(headingFromAngles(90, 15, -10)).toBeCloseTo(270, 0);
    expect(headingFromAngles(0, 0, 0, 90)).toBeCloseTo(90, 5);
    expect(headingFromAngles(0, 0, 0, 270)).toBeCloseTo(270, 5);
  });
  it("held upright it gives the direction the back of the phone faces", () => {
    expect(headingFromAngles(0, 90, 0)).toBeCloseTo(0, 5);
    expect(headingFromAngles(90, 90, 0)).toBeCloseTo(270, 5);
    expect(headingFromAngles(180, 90, 0)).toBeCloseTo(180, 5);
  });
});

describe("what counts as a compass reading", () => {
  it("iPhone: webkitCompassHeading with its accuracy; a negative accuracy is not valid", () => {
    expect(readingFromEvent("deviceorientation", { webkitCompassHeading: 123, webkitCompassAccuracy: 15 })).toEqual({ heading: 123, source: "ios", accuracy: 15 });
    expect(readingFromEvent("deviceorientation", { webkitCompassHeading: 123, webkitCompassAccuracy: -1 })!.accuracy).toBeNull();
    expect(readingFromEvent("deviceorientation", { webkitCompassHeading: 350 }, 90)!.heading).toBe(80);
  });
  it("Android: deviceorientationabsolute counts; a plain relative deviceorientation does not (the legacy bug)", () => {
    const r = readingFromEvent("deviceorientationabsolute", { alpha: 90, beta: 0, gamma: 0, absolute: true });
    expect(r?.source).toBe("android-absolute");
    expect(r?.heading).toBeCloseTo(270, 5);
    expect(readingFromEvent("deviceorientation", { alpha: 90, beta: 0, gamma: 0, absolute: false })).toBeNull();
    expect(readingFromEvent("deviceorientation", { alpha: 90, beta: 0, gamma: 0 })).toBeNull();
  });
  it("a deviceorientation event that says it is absolute counts", () => {
    expect(readingFromEvent("deviceorientation", { alpha: 0, beta: 0, gamma: 0, absolute: true })?.source).toBe("absolute");
  });
  it("missing or non-numeric angles are not a reading", () => {
    expect(readingFromEvent("deviceorientationabsolute", { alpha: null, beta: 0, gamma: 0 })).toBeNull();
    expect(readingFromEvent("deviceorientationabsolute", {})).toBeNull();
    expect(readingFromEvent("deviceorientationabsolute", { alpha: Number.NaN, beta: 0, gamma: 0 })).toBeNull();
  });
});

describe("facing, alignment and wording", () => {
  it("corrects magnetic to true with the declination", () => {
    expect(trueHeading(100, 12.5)).toBeCloseTo(112.5, 5);
    expect(trueHeading(355, 10)).toBeCloseTo(5, 5);
    expect(trueHeading(5, -12)).toBeCloseTo(353, 5);
  });
  it("aligned within 5 degrees, not beyond; it stays aligned until 7 (no flicker at the edge)", () => {
    expect(ALIGN_ENTER_DEG).toBe(5);
    expect(ALIGN_LEAVE_DEG).toBe(7);
    expect(facing(260, 255).aligned).toBe(true);
    expect(facing(260, 254.9).aligned).toBe(false);
    expect(facing(260, 253.5, true).aligned).toBe(true); // already aligned: 6.5 off is still aligned
    expect(facing(260, 252.5, true).aligned).toBe(false); // 7.5 off: no longer
  });
  it("says which way to turn, across north too", () => {
    expect(facing(260, 220).text).toBe("Turn right 40°");
    expect(facing(260, 300).text).toBe("Turn left 40°");
    expect(facing(10, 350).text).toBe("Turn right 20°");
    expect(facing(350, 10).text).toBe("Turn left 20°");
    expect(facing(260, 258).text).toBe("Facing the Qibla");
  });
  it("names the nearest of 16 points: 260.4 is West (not west-southwest as the prototype said)", () => {
    expect(cardinal16(260.4)).toBe("West");
    expect(cardinal16(0)).toBe("North");
    expect(cardinal16(359)).toBe("North");
    expect(cardinal16(118.9)).toBe("East-southeast"); // 112.5 is 6.4 away, southeast at 135 is 16.1 away
    expect(cardinal16(247.5)).toBe("West-southwest");
    expect(cardinal16(22.5)).toBe("North-northeast");
  });
  it("accuracy notes: an iPhone that is unsure asks for a figure of eight; a good one reports its number; Android reports none", () => {
    expect(accuracyNote(null, "ios")).toMatch(/figure of eight/);
    expect(accuracyNote(30, "ios")).toMatch(/figure of eight/);
    expect(accuracyNote(10, "ios")).toBe("Compass accuracy about ±10°.");
    expect(accuracyNote(null, "android-absolute")).toBeNull();
    expect(accuracyNote(null, null)).toBeNull();
  });
});

describe("the schedule rows (Lahore, 15 and 16 October 2026; 16 October is a Friday)", () => {
  const d15 = day("2026-10-15");
  const d16 = day("2026-10-16");
  const nextAt = (when: Date, today = d15, tomorrow = d16) => nextPrayer(today, tomorrow, when, TZ);
  const statuses = (when: Date, today = d15, tomorrow = d16) => Object.fromEntries(buildRows(today, when, TZ, nextAt(when, today, tomorrow)).map((r) => [r.key, r.status]));

  it("has Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha in order, with Sunrise as information", () => {
    const rows = buildRows(d15, at("2026-10-15", "03:00"), TZ, nextAt(at("2026-10-15", "03:00")));
    expect(rows.map((r) => r.key)).toEqual(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]);
    expect(rows.find((r) => r.key === "Sunrise")!.isPrayer).toBe(false);
  });
  it("before Fajr nothing is latest and Fajr is next", () => {
    expect(statuses(at("2026-10-15", "03:00"))).toEqual({ Fajr: "next", Sunrise: "upcoming", Dhuhr: "upcoming", Asr: "upcoming", Maghrib: "upcoming", Isha: "upcoming" });
  });
  it("after Fajr: Fajr is latest and Dhuhr is next (Sunrise is never tagged)", () => {
    const s = statuses(at("2026-10-15", d15.timings.Fajr));
    expect(s.Fajr).toBe("latest");
    expect(s.Sunrise).toBe("upcoming");
    expect(s.Dhuhr).toBe("next");
  });
  it("after Sunrise the latest prayer is still Fajr: the app says nothing about when Fajr ends", () => {
    const s = statuses(at("2026-10-15", "07:30"));
    expect(s.Sunrise).toBe("past");
    expect(s.Fajr).toBe("latest");
    expect(s.Dhuhr).toBe("next");
  });
  it("mid-afternoon: Dhuhr is past, Asr is latest, Maghrib is next", () => {
    const s = statuses(at("2026-10-15", d15.timings.Asr));
    expect(s).toMatchObject({ Fajr: "past", Dhuhr: "past", Asr: "latest", Maghrib: "next", Isha: "upcoming" });
  });
  it("after Isha: Isha is latest and no row is next (tomorrow's Fajr is on the card)", () => {
    const s = statuses(at("2026-10-15", "23:30"));
    expect(s.Isha).toBe("latest");
    expect(Object.values(s)).not.toContain("next");
  });
  it("Jumu'ah is under Dhuhr only on a Friday, judged on the location's day", () => {
    expect(isFriday("2026-10-16")).toBe(true);
    expect(isFriday("2026-10-15")).toBe(false);
    expect(buildRows(d16, at("2026-10-16", "03:00"), TZ, null).find((r) => r.key === "Dhuhr")!.note).toBe("Jumu’ah");
    expect(buildRows(d15, at("2026-10-15", "03:00"), TZ, null).find((r) => r.key === "Dhuhr")!.note).toBeUndefined();
    // 23:30 on Thursday in Karachi is already Friday 18:30 UTC... and 19:30 on Thursday UTC is Friday in Karachi: the day key decides, not the device
    expect(isFriday("2026-10-15")).toBe(false);
  });
  it("a response without Sunrise has no Sunrise row", () => {
    const noSunrise = { ...d15, timings: { ...d15.timings, Sunrise: undefined } };
    expect(buildRows(noSunrise, at("2026-10-15", "03:00"), TZ, null).map((r) => r.key)).not.toContain("Sunrise");
  });
});

describe("countdown and progress", () => {
  it("minutes, with seconds only in the final minute", () => {
    expect(countdownLabel(5_700_000)).toBe("1h 35m");
    expect(countdownLabel(61_000)).toBe("1m");
    expect(countdownLabel(59_000)).toBe("59s");
    expect(countdownLabel(1)).toBe("1s");
    expect(countdownLabel(0)).toBe("now");
    expect(countdownLabel(-5)).toBe("now");
  });
  it("the bar is a fraction between two known times and is null when one is not known", () => {
    const a = new Date("2026-10-15T10:00:00Z");
    const b = new Date("2026-10-15T12:00:00Z");
    expect(fractionBetween(a, b, new Date("2026-10-15T11:00:00Z"))).toBeCloseTo(0.5, 5);
    expect(fractionBetween(a, b, new Date("2026-10-15T09:00:00Z"))).toBe(0);
    expect(fractionBetween(a, b, new Date("2026-10-15T13:00:00Z"))).toBe(1);
    expect(fractionBetween(null, b, a)).toBeNull();
    expect(fractionBetween(a, null, a)).toBeNull();
    expect(fractionBetween(b, a, a)).toBeNull();
  });
});

describe("the Hijri date and the adjustment (applied in the app, never in the cache)", () => {
  const days = month.days;
  const h15 = days.find((d) => d.date === "2026-10-15")!.hijri;
  it("shows the cached day's own Hijri date, untouched when the adjustment is 0", () => {
    const r = hijriShown(days, "2026-10-15", 0)!;
    expect(r.date).toEqual(h15);
    expect(r).toMatchObject({ applied: 0, unavailable: false });
  });
  it("reads the neighbouring cached day for a +1 or -1 adjustment", () => {
    expect(hijriShown(days, "2026-10-15", 1)!.date).toEqual(days.find((d) => d.date === "2026-10-16")!.hijri);
    expect(hijriShown(days, "2026-10-15", -2)!.date).toEqual(days.find((d) => d.date === "2026-10-13")!.hijri);
    expect(hijriShown(days, "2026-10-15", 2)!.applied).toBe(2);
  });
  it("at the edge of the cached months the adjustment is not guessed: the date is shown unadjusted and the page says so", () => {
    const last = hijriShown(days, "2026-10-31", 1)!;
    expect(last.unavailable).toBe(true);
    expect(last.applied).toBe(0);
    expect(last.date).toEqual(days.find((d) => d.date === "2026-10-31")!.hijri);
    expect(hijriShown(days, "2026-10-01", -1)!.unavailable).toBe(true);
  });
  it("with the next month cached the edge adjusts correctly", () => {
    const nextMonth = [{ date: "2026-11-01", timings: month.days[0]!.timings, hijri: { day: 20, month: 5, year: 1448, monthNameEn: "Jumādá al-ūlá" } }];
    expect(hijriShown([...days, ...nextMonth], "2026-10-31", 1)!.date.day).toBe(20);
  });
  it("is null when today is not in the cache, and words the note", () => {
    expect(hijriShown(days, "2027-01-01", 0)).toBeNull();
    expect(adjustNote(1)).toBe("Adjusted by +1 day");
    expect(adjustNote(-2)).toBe("Adjusted by −2 days");
  });
});

describe("city search (Open-Meteo, recorded responses) and typed coordinates", () => {
  it("builds one GET with only the typed name, encoded", () => {
    expect(geocodeUrl("  Leicester ")).toBe("https://geocoding-api.open-meteo.com/v1/search?name=Leicester&count=10&language=en&format=json");
    expect(geocodeUrl("São Paulo")).toContain("name=S%C3%A3o%20Paulo");
    const u = new URL(geocodeUrl("a b"));
    expect([...u.searchParams.keys()].sort()).toEqual(["count", "format", "language", "name"]);
  });
  it("parses places with a label the user can confirm", () => {
    const places = parseGeocode(fx("openmeteo-leicester.json"));
    expect(places.length).toBeGreaterThan(1);
    expect(places[0]).toMatchObject({ name: "Leicester", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London" });
    expect(places[0]!.label).toBe("Leicester, England, United Kingdom");
    expect(places[0]!.lat).toBeCloseTo(52.64, 1);
    expect(places.some((p) => p.countryCode === "US")).toBe(true); // same name, another country
  });
  it("filters by the typed country (name, part of it, or code)", () => {
    const places = parseGeocode(fx("openmeteo-leicester.json"));
    for (const q of ["United Kingdom", "united kingdom", "kingdom", "GB", "gb", "England"]) {
      const f = filterByCountry(places, q);
      expect(f.length, q).toBeGreaterThan(0);
      expect(f.every((p) => p.countryCode === "GB" || /kingdom|england/i.test(p.country + p.region)), q).toBe(true);
    }
    expect(filterByCountry(places, "").length).toBe(places.length);
    expect(filterByCountry(places, "Atlantis")).toEqual([]);
  });
  it("an unknown name (no results field) is an empty list, not an error; a malformed answer is an error", () => {
    expect(parseGeocode(fx("openmeteo-none.json"))).toEqual([]);
    expect(parseGeocode({})).toEqual([]);
    expect(() => parseGeocode({ results: "nope" })).toThrow();
  });
  it("skips entries that are not a usable place", () => {
    const out = parseGeocode({ results: [{ name: "A", latitude: 91, longitude: 0 }, { name: "B", latitude: 10, longitude: 20 }, { latitude: 1, longitude: 2 }, { name: "C", latitude: "1", longitude: 2 }] });
    expect(out.map((p) => p.name)).toEqual(["B"]);
  });
  it("parses typed coordinates in the common formats, and refuses anything else", () => {
    expect(parseCoordinates("31.5204, 74.3587")).toEqual({ lat: 31.5204, lon: 74.3587 });
    expect(parseCoordinates("31.5204 74.3587")).toEqual({ lat: 31.5204, lon: 74.3587 });
    expect(parseCoordinates("-33.87,151.21")).toEqual({ lat: -33.87, lon: 151.21 });
    expect(parseCoordinates("31.52 N, 74.36 E")).toEqual({ lat: 31.52, lon: 74.36 });
    expect(parseCoordinates("33.87° S, 18.42° W")).toEqual({ lat: -33.87, lon: -18.42 });
    for (const bad of ["", "abc", "91, 0", "0, 181", "1,2,3", "31.5", "31.5 74.3 5", "-31 S, 20 E", "31 X, 20 E", "31,"]) expect(parseCoordinates(bad), bad).toBeNull();
    expect(coordinateText({ lat: 31.5204, lon: 74.3587 })).toBe("31.52, 74.36");
  });
});

describe("the saved location (quran:location:v1) and the legacy last_location", () => {
  it("a manual place keeps its name; the record stays additive (unknown source reads as device, extra fields ignored)", () => {
    setStorageBackend(memoryStore());
    saveLocation({ lat: 52.6386, lon: -1.13169, source: "manual", updatedAt: 5, label: "Leicester, England, United Kingdom" });
    expect(readLocation()).toEqual({ lat: 52.6386, lon: -1.13169, source: "manual", updatedAt: 5, label: "Leicester, England, United Kingdom" });
    setStorageBackend(memoryStore({ [LOCATION_KEY]: JSON.stringify({ lat: 1, lon: 2, source: "satellite", updatedAt: 1, extra: { a: 1 } }) }));
    expect(readLocation()).toMatchObject({ lat: 1, lon: 2, source: "device" });
    setStorageBackend(memoryStore({ [LOCATION_KEY]: JSON.stringify({ lat: 1, lon: 2, source: "manual", updatedAt: 1, label: "   " }) }));
    expect(readLocation()!.label).toBeUndefined();
  });
  it("a manual save leaves the legacy last_location exactly as the legacy Qibla page reads it", () => {
    const legacy = '{"lat":31.5204,"lng":74.3587}';
    const s = memoryStore({ [LEGACY_LOCATION_KEY]: legacy });
    setStorageBackend(s);
    saveLocation({ lat: 52.6, lon: -1.1, source: "manual", updatedAt: 1, label: "Leicester, England, United Kingdom" });
    expect(s.data.get(LEGACY_LOCATION_KEY)).toBe(legacy);
    // the legacy page's own parser (pages/qibla-direction.vue loadCachedLocation) still gets what it expects
    const loc = JSON.parse(s.data.get(LEGACY_LOCATION_KEY)!);
    expect(loc.lat).toBe(31.5204);
    expect(loc.lng).toBe(74.3587);
    // and the new record is in the NEW key only, which the legacy app never reads
    expect(JSON.parse(s.data.get(LOCATION_KEY)!)).toMatchObject({ source: "manual", label: "Leicester, England, United Kingdom" });
    expect([...s.data.keys()].sort()).toEqual([LEGACY_LOCATION_KEY, LOCATION_KEY].sort());
  });
});
