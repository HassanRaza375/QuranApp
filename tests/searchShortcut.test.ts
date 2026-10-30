// Phase 10: when "/" opens Search and when it must leave the key alone.
import { describe, expect, it } from "vitest";
import { opensSearch } from "../app/lib/searchShortcut";

describe("the / shortcut", () => {
  it("opens Search from a page body", () => {
    expect(opensSearch({ key: "/", target: { tagName: "BODY" } })).toBe(true);
    expect(opensSearch({ key: "/", target: null })).toBe(true);
    expect(opensSearch({ key: "/", target: { tagName: "A" } })).toBe(true);
  });

  it("leaves the key alone while typing, with a modifier, in a dialog, or when something else already handled it", () => {
    for (const tagName of ["INPUT", "textarea", "SELECT"]) expect(opensSearch({ key: "/", target: { tagName } }), tagName).toBe(false);
    expect(opensSearch({ key: "/", target: { tagName: "DIV", isContentEditable: true } })).toBe(false);
    for (const m of ["ctrlKey", "metaKey", "altKey"] as const) expect(opensSearch({ key: "/", [m]: true })).toBe(false);
    expect(opensSearch({ key: "/" }, true)).toBe(false);
    expect(opensSearch({ key: "/", defaultPrevented: true })).toBe(false);
    expect(opensSearch({ key: "?" })).toBe(false);
    expect(opensSearch({ key: "s" })).toBe(false);
  });
});
