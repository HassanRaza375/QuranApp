import { afterEach, describe, expect, it } from "vitest";
import { getJSON, getRaw, mergeJSON, remove, setJSON, setRaw, setStorageBackend as setBackendForTests } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setBackendForTests(null));

describe("storage wrapper", () => {
  it("reads raw strings as they are and JSON as parsed values", () => {
    setBackendForTests(memoryStore({ themeMode: "dark", "quran:audio-prefs:v1": '{"playbackRate":1.5}' }));
    expect(getRaw("themeMode")).toBe("dark");
    expect(getJSON("quran:audio-prefs:v1", {})).toEqual({ playbackRate: 1.5 });
  });

  it("a raw legacy string is NOT valid JSON, so JSON access falls back (why raw and JSON are separate)", () => {
    setBackendForTests(memoryStore({ prayerFiqh: "jafari" }));
    expect(getJSON("prayerFiqh", "fallback")).toBe("fallback");
    expect(getRaw("prayerFiqh")).toBe("jafari");
  });

  it("falls back on corrupt JSON and on missing keys", () => {
    setBackendForTests(memoryStore({ bad: "{not json" }));
    expect(getJSON("bad", [])).toEqual([]);
    expect(getJSON("missing", 7)).toBe(7);
  });

  it("never throws when storage is blocked", () => {
    setBackendForTests(memoryStore({}, true));
    expect(getRaw("x")).toBeNull();
    expect(setRaw("x", "1")).toBe(false);
    expect(setJSON("x", 1)).toBe(false);
    expect(() => remove("x")).not.toThrow();
    expect(getJSON("x", "ok")).toBe("ok");
  });

  it("mergeJSON keeps fields this app does not know about", () => {
    const s = memoryStore({ k: '{"known":1,"unknown":"keep me"}' });
    setBackendForTests(s);
    mergeJSON("k", { known: 2 });
    expect(JSON.parse(s.data.get("k")!)).toEqual({ known: 2, unknown: "keep me" });
  });

  it("mergeJSON replaces a value that is not an object", () => {
    const s = memoryStore({ k: "[1,2]" });
    setBackendForTests(s);
    mergeJSON("k", { a: 1 });
    expect(JSON.parse(s.data.get("k")!)).toEqual({ a: 1 });
  });
});
