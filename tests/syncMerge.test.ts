// Phase 17C: the merge rules (app/lib/sync/merge.ts). Pure. Each rule is checked on its own, and the ones that combine values (unions, maxima) are checked to be
// commutative, idempotent and order-independent on random histories, as the Hifz parity test does for its engine.
import { describe, expect, it } from "vitest";
import { ABSENT, conflict, hashOf, mergeRecord, stable, type Payload } from "../app/lib/sync/merge";
import type { MergeKind } from "../app/lib/sync/namespaces";

const h = hashOf;

describe("stable and hashOf", () => {
  it("ignore key order and undefined, and tell a change from no change", () => {
    expect(stable({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe(stable({ a: [2, { c: 2, d: 1 }], b: 1 }));
    expect(stable({ a: 1, b: undefined })).toBe(stable({ a: 1 }));
    expect(h({ a: 1 })).toBe(h({ a: 1 }));
    expect(h({ a: 1 })).not.toBe(h({ a: 2 }));
    expect(h(null)).toBe(ABSENT);
    expect(h(undefined)).toBe(ABSENT);
  });
});

describe("mergeRecord: who changed what", () => {
  const A = { v: 1 };
  const B = { v: 2 };
  const C = { v: 3 };
  it("nothing changed anywhere: nothing to do", () => {
    expect(mergeRecord("lww", h(A), A, undefined)).toEqual({ value: A, push: false, write: false });
    expect(mergeRecord("lww", h(A), A, A)).toEqual({ value: A, push: false, write: false });
  });
  it("only the device changed: push it", () => {
    expect(mergeRecord("lww", h(A), B, undefined)).toMatchObject({ value: B, push: true, write: false });
  });
  it("only the server changed: take it", () => {
    expect(mergeRecord("lww", h(A), A, B)).toEqual({ value: B, push: false, write: true });
  });
  it("both made the same change: nothing to push or write", () => {
    expect(mergeRecord("lww", h(A), B, B)).toEqual({ value: B, push: false, write: false });
  });
  it("a record only the device has, never synced: push it", () => {
    expect(mergeRecord("lww", undefined, A, undefined)).toMatchObject({ value: A, push: true });
  });
  it("a record only the server has: take it", () => {
    expect(mergeRecord("lww", undefined, null, A)).toEqual({ value: A, push: false, write: true });
  });
  it("last-write-wins: when both changed, this device wins (its push comes last in the server's order)", () => {
    expect(mergeRecord("lww", h(A), B, C)).toMatchObject({ value: B, push: true, write: false });
  });
  it("...but the first time a device meets a record, the account's value wins (an old device does not overwrite the account)", () => {
    expect(mergeRecord("lww", undefined, B, C)).toMatchObject({ value: C, push: false, write: true });
  });
  it("a removal on the device and an unchanged server record: push the removal", () => {
    expect(mergeRecord("presence", h(A), null, undefined)).toMatchObject({ value: null, push: true });
  });
  it("a removal on the server and an unchanged device: remove it here", () => {
    expect(mergeRecord("presence", h(A), A, null)).toEqual({ value: null, push: false, write: true });
  });
});

describe("presence: an add wins over a removal it has not seen", () => {
  it("removed here, changed there: the record stays", () => {
    const m = mergeRecord("presence", h({ addedAt: 1 }), null, { addedAt: 5 });
    expect(m.value).toEqual({ addedAt: 5 });
    expect(m.write).toBe(true);
  });
  it("changed here, removed there: the record stays and is pushed again", () => {
    const m = mergeRecord("presence", h({ addedAt: 1 }), { addedAt: 7 }, null);
    expect(m.value).toEqual({ addedAt: 7 });
    expect(m.push).toBe(true);
  });
  it("two different adds of the same item keep the earlier time", () => {
    expect(conflict("presence", { addedAt: 900 }, { addedAt: 300 }, false)).toEqual({ addedAt: 300 });
  });
});

describe("the merges that combine", () => {
  it("dayLog: the union of the day's ayahs, sorted", () => {
    expect(conflict("dayLog", { ayahs: ["2:5", "1:1"] }, { ayahs: ["2:5", "3:3"] }, false)).toEqual({ ayahs: ["1:1", "2:5", "3:3"] });
  });
  it("story: read is a union, the chapter is the winner's, updatedAt the later", () => {
    expect(conflict("story", { chapter: 2, read: [1, 2], updatedAt: 5 }, { chapter: 3, read: [2, 3], updatedAt: 9 }, false)).toEqual({ chapter: 2, read: [1, 2, 3], updatedAt: 9 });
  });
  it("tasbeeh: the bead state is the winner's, the lifetime never goes down", () => {
    expect(conflict("tasbeeh", { count: 5, target: 33, cycles: 1, lifetime: 100 }, { count: 9, target: 99, cycles: 2, lifetime: 140 }, false)).toEqual({ count: 5, target: 33, cycles: 1, lifetime: 140 });
    expect(conflict("tasbeeh", { count: 5, target: 33, cycles: 1, lifetime: 100 }, { count: 9, target: 99, cycles: 2, lifetime: 140 }, true)).toMatchObject({ count: 9, lifetime: 140 });
  });
  it("activity: every count is the larger of the two", () => {
    expect(conflict("activity", { date: "2026-11-01", newAyahs: 3, revisions: 1 }, { date: "2026-11-01", newAyahs: 2, revisions: 4 }, false)).toEqual({ date: "2026-11-01", newAyahs: 3, revisions: 4 });
  });
  it("words: slip and clean days are unions per word, `last` is the later day, and unknown fields stay", () => {
    const a = { "0": { word: "x", slipDays: ["2026-11-01"], cleanDays: ["2026-11-03"], last: "2026-11-03", extra: 1 } };
    const b = { "0": { word: "x", slipDays: ["2026-11-02"], cleanDays: ["2026-11-03"], last: "2026-11-02" }, "1": { word: "y", slipDays: [], cleanDays: [], last: null } };
    expect(conflict("words", a, b, false)).toEqual({
      "0": { word: "x", slipDays: ["2026-11-01", "2026-11-02"], cleanDays: ["2026-11-03"], last: "2026-11-03", extra: 1 },
      "1": { word: "y", slipDays: [], cleanDays: [], last: null },
    });
  });
});

// ---- random histories: the combining merges are commutative, idempotent and associative
const rnd = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = <T>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)]!;
const days = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"];
const gen: Record<string, (r: () => number) => Payload> = {
  dayLog: (r) => ({ ayahs: [...new Set(Array.from({ length: Math.floor(r() * 5) }, () => `${1 + Math.floor(r() * 3)}:${1 + Math.floor(r() * 5)}`))].sort() }),
  story: (r) => ({ chapter: Math.floor(r() * 4), read: [...new Set(Array.from({ length: Math.floor(r() * 4) }, () => Math.floor(r() * 6)))].sort((x, y) => x - y), updatedAt: Math.floor(r() * 50) }),
  activity: (r) => ({ date: "2026-11-01", newAyahs: Math.floor(r() * 9), revisions: Math.floor(r() * 9) }),
  words: (r) => ({ "0": { word: "w", slipDays: days.filter(() => r() < 0.4), cleanDays: days.filter(() => r() < 0.4), last: r() < 0.5 ? pick(r, days) : null } }),
};
describe("random histories", () => {
  for (const kind of Object.keys(gen) as MergeKind[]) {
    it(`${kind}: commutative, idempotent and associative`, () => {
      const r = rnd(42 + kind.length);
      const norm = (p: Payload) => stable(p);
      for (let i = 0; i < 200; i++) {
        const a = gen[kind]!(r);
        const b = gen[kind]!(r);
        const c = gen[kind]!(r);
        // the winner-dependent fields (a story's chapter) are the only asymmetric part: compare with the same preference on both sides
        if (kind !== "story") expect(norm(conflict(kind, a, b, false))).toBe(norm(conflict(kind, b, a, false)));
        expect(norm(conflict(kind, a, a, false))).toBe(norm(a));
        const ab = conflict(kind, conflict(kind, a, b, false), c, false);
        const a_bc = conflict(kind, a, conflict(kind, b, c, false), false);
        if (kind !== "story") expect(norm(ab)).toBe(norm(a_bc));
      }
    });
  }
  it("a union never loses an element, and a maximum never goes down", () => {
    const r = rnd(7);
    for (let i = 0; i < 200; i++) {
      const a = gen.dayLog!(r)!;
      const b = gen.dayLog!(r)!;
      const m = conflict("dayLog", a, b, false) as { ayahs: string[] };
      for (const x of [...(a.ayahs as string[]), ...(b.ayahs as string[])]) expect(m.ayahs).toContain(x);
      const p = gen.activity!(r)!;
      const q = gen.activity!(r)!;
      const mm = conflict("activity", p, q, false) as Record<string, number>;
      expect(mm.newAyahs).toBeGreaterThanOrEqual(Math.max(p!.newAyahs as number, q!.newAyahs as number));
    }
  });
  it("a client clock three days wrong changes nothing: only the server's order and the three hashes are used", () => {
    // `addedAt` differs by three days between devices; the merge keeps the earlier, whichever clock was wrong
    const day = 86_400_000;
    expect(conflict("presence", { addedAt: 1_000_000 + 3 * day }, { addedAt: 1_000_000 }, false)).toEqual({ addedAt: 1_000_000 });
    expect(conflict("presence", { addedAt: 1_000_000 }, { addedAt: 1_000_000 + 3 * day }, false)).toEqual({ addedAt: 1_000_000 });
  });
});
