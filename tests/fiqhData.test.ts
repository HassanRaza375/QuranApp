// Phase 13 (Daily Fiqh): the vendored ruling data and the rules that decide what a reader sees. Everything here runs on the REAL data.
//  - the legacy validators pass, and every quote equals the official source unit it was cut from (the snapshot fixture): the only independent guard in this repo;
//  - the cross-language check's fixture is consistent, and our hold list is exactly its "needs-human" rows;
//  - for EVERY ruling, EVERY marja' and EVERY reading language: another marja's text is never shown, a held or withheld ruling shows a pointer and no text,
//    "Both" keeps each language with its own source, and a ruling with no entry says so.
import { describe, expect, it } from "vitest";
import surahList from "@legacy/assets/data/surah.json";
import { MARAJI, WAJIBAT_DATASET, WAJIBAT_RULINGS, getMarjaRuling, getTopicById } from "@legacy/data/wajibat/index";
import type { MarjaId } from "@legacy/data/wajibat/types";
import { compareVersions } from "@legacy/utils/wajibatMismatch";
import { computeCoverage } from "@legacy/utils/wajibatCoverage";
import { validateSourceSnapshot, validateWajibatDataset, type SourceSnapshot } from "@legacy/utils/wajibatValidate";
import decisions from "../legacy/tests/fixtures/wajibatMismatchDecisions.json";
import mismatches from "../legacy/tests/fixtures/wajibatMismatches.json";
import snapshot from "../legacy/tests/fixtures/wajibatSourceSnapshot.json";
import { NEEDS_HUMAN_HOLDS } from "../app/lib/fiqh/holds";
import { FIQH_LANGS, MARJA_SHORT, entryOf, pointerReason, readerNote, viewOf, visibleTo } from "../app/lib/fiqh/visibility";

const surahs = (surahList as { surahNo: number; totalAyah: number }[]).map((s) => ({ surahNo: s.surahNo, totalAyah: s.totalAyah }));
const MARAJI_IDS = MARAJI.map((m) => m.id) as MarjaId[];

describe("the vendored data is the data the legacy shipped", () => {
  it("has the counts the audit measured", () => {
    expect(WAJIBAT_DATASET.categories).toHaveLength(9);
    expect(WAJIBAT_DATASET.topics).toHaveLength(67);
    expect(WAJIBAT_RULINGS).toHaveLength(1433);
    expect(WAJIBAT_RULINGS.reduce((n, r) => n + r.rulings.length, 0)).toBe(1840);
    expect(WAJIBAT_DATASET.glossary).toHaveLength(94);
    const per = (id: string) => WAJIBAT_RULINGS.flatMap((r) => r.rulings).filter((e) => e.marjaId === id).length;
    expect({ sistani: per("sistani"), khamenei: per("khamenei"), makarem: per("makarem") }).toEqual({ sistani: 869, khamenei: 971, makarem: 0 });
  });

  it("passes the legacy dataset validator (references, ayah bounds, source rules)", () => {
    expect(validateWajibatDataset(WAJIBAT_DATASET, MARAJI, surahs)).toEqual([]);
  });

  it("every quote equals, or is a verbatim excerpt of, the official source unit it was cut from (the legacy's source snapshot)", () => {
    expect(validateSourceSnapshot(WAJIBAT_DATASET, snapshot as SourceSnapshot)).toEqual([]);
  });

  it("Makarem Shirazi has no entry anywhere (pending sources), so nothing can show another marja's text in his place", () => {
    expect(MARAJI.find((m) => m.id === "makarem")?.status).toBe("pending-sources");
    expect(WAJIBAT_RULINGS.flatMap((r) => r.rulings).filter((e) => e.marjaId === "makarem")).toEqual([]);
  });

  it("has no Khamenei entry in the Zakat category, as the audit said", () => {
    const rows = computeCoverage(WAJIBAT_DATASET, ["khamenei"]).filter((c) => getTopicById(c.topicId)?.categoryId === "zakat");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((c) => c.sourced === 0)).toBe(true);
  });
});

describe("the cross-language check and our hold list", () => {
  type Row = { key: string; severity: string };
  const rows = (mismatches as unknown as { mismatches: Row[] }).mismatches;
  const recs = decisions as unknown as Record<string, { status: string }>;

  it("has a recorded decision for every flagged row, and the counts the audit measured", () => {
    for (const r of rows) expect(recs[r.key], r.key).toBeTruthy();
    expect(rows).toHaveLength(1572);
    const by: Record<string, number> = {};
    for (const v of Object.values(recs)) by[v.status] = (by[v.status] ?? 0) + 1;
    expect(by).toMatchObject({ "needs-human": 66, "held-pending-review": 260, "hidden-pending-review": 244, "low-pending-review": 671, "persian-decided-pending-review": 306, decided: 25 });
  });

  it("agrees with the English-Urdu comparison done here on the vendored data (the check cannot have drifted)", () => {
    const seen = new Set(rows.map((r) => r.key));
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings)
        for (const field of ["text", "question"] as const) {
          const t = e[field];
          if (t?.en && t?.ur && !e.urduOnly && compareVersions(t.en, "en", t.ur, "ur").length) expect(seen.has(`${r.id}|${e.marjaId}|${field}|en-ur`), `${r.id}|${e.marjaId}|${field}`).toBe(true);
        }
  });

  it("our needs-human hold list is exactly the (ruling, marja') pairs of the 66 rows", () => {
    const pairs = [...new Set(Object.entries(recs).filter(([, v]) => v.status === "needs-human").map(([k]) => k.split("|").slice(0, 2).join("|")))].sort();
    expect([...NEEDS_HUMAN_HOLDS].sort()).toEqual(pairs);
    expect(pairs).toHaveLength(57);
    expect(pairs.every((p) => p.endsWith("|khamenei"))).toBe(true);
    for (const p of pairs) {
      const [id, marja] = p.split("|");
      expect(entryOf(WAJIBAT_RULINGS.find((r) => r.id === id)!, marja as MarjaId), p).toBeTruthy();
    }
  });
});

describe("what a reader sees of every ruling (all rulings, all maraji', all languages)", () => {
  it("shows the marja's own text or nothing: another marja's text is never shown, and a ruling with no entry says so", () => {
    for (const r of WAJIBAT_RULINGS)
      for (const marja of MARAJI_IDS)
        for (const lang of FIQH_LANGS) {
          const own = r.rulings.find((e) => e.marjaId === marja);
          const v = viewOf(r, marja, lang, marja === "makarem");
          if (!own) {
            expect(v.kind, `${r.id}|${marja}`).toBe("missing");
            continue;
          }
          expect(v.kind, `${r.id}|${marja}`).not.toBe("missing");
          const allowed = new Set([own.text.en, own.text.ur, own.question?.en, own.question?.ur].filter(Boolean));
          if (v.kind === "text") {
            for (const block of [v.english, v.urdu]) if (block) {
              expect(allowed.has(block.text), `${r.id}|${marja}|${lang}`).toBe(true);
              if (block.question) expect(allowed.has(block.question), `${r.id}|${marja}|${lang}`).toBe(true);
            }
            expect(v.english || v.urdu, `${r.id}|${marja}|${lang}: some text`).toBeTruthy();
          }
        }
  });

  it("a held, withheld or on-hold entry is a pointer with no text in any language, and the pointer names his own book", () => {
    let pointers = 0;
    const reasons: Record<string, number> = {};
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings) {
        const reason = pointerReason(r, e);
        for (const lang of FIQH_LANGS) {
          const v = viewOf(r, e.marjaId, lang, false);
          if (reason) {
            expect(v, `${r.id}|${e.marjaId}|${lang}`).toEqual({ kind: "pointer", reason, source: e.source });
            expect(e.source.url).toMatch(/^https:\/\//);
          } else expect(v.kind).toBe("text");
        }
        if (reason) {
          pointers++;
          reasons[reason] = (reasons[reason] ?? 0) + 1;
        }
      }
    // 92 held by the legacy, 100 withheld English (some of them also held), 57 on our list: the union is what is not shown
    expect(reasons.held).toBe(92);
    expect(pointers).toBe(reasons.held! + (reasons["english-differs"] ?? 0) + (reasons["check-pending"] ?? 0));
    expect(reasons["check-pending"]).toBeGreaterThan(0);
    expect(reasons["english-differs"]).toBeGreaterThan(0);
  });

  it("\"Both\" gives each language its own source line, and an English-only or Urdu-only entry never shows the other", () => {
    let both = 0;
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings) {
        const v = viewOf(r, e.marjaId, "both", false);
        if (v.kind !== "text" || !v.english || !v.urdu) continue;
        both++;
        expect(v.english.source, r.id).toEqual(e.source);
        expect(v.urdu.source, r.id).toEqual(e.urSource);
        expect(v.urdu.source.title, r.id).not.toBe(v.english.source.title);
      }
    expect(both).toBeGreaterThan(500);
  });

  it("an Urdu reader gets the English where there is no official Urdu, with a notice that says so; an English reader never gets Urdu (except Urdu-only rulings)", () => {
    let noUrdu = 0;
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings) {
        if (pointerReason(r, e)) continue;
        const ur = viewOf(r, e.marjaId, "ur", false);
        const en = viewOf(r, e.marjaId, "en", false);
        if (en.kind === "text" && !e.urduOnly) expect(en.urdu, r.id).toBeNull();
        if (ur.kind === "text" && !e.text.ur && !e.urduOnly) {
          noUrdu++;
          expect(ur.english?.text, r.id).toBe(e.text.en);
          expect(ur.notices.some((n) => n.kind === "no-urdu"), r.id).toBe(true);
          expect(ur.notices.some((n) => n.kind === "urdu-lag") === !!e.urduEditionLag, r.id).toBe(true);
        }
        if (e.urduOnly) {
          expect(en.kind === "text" && en.english === null && !!en.urdu, r.id).toBe(true);
          expect(en.kind === "text" && en.notices.some((n) => n.kind === "urdu-only"), r.id).toBe(true);
        }
      }
    expect(noUrdu).toBeGreaterThan(100);
  });

  it("entries that belong to one marja' (his own points, his supplementary Q&A) are invisible to the others", () => {
    for (const r of WAJIBAT_RULINGS) {
      for (const marja of MARAJI_IDS) {
        const owner = r.audience ?? r.supplementary?.marjaId;
        expect(visibleTo(r, marja), `${r.id}|${marja}`).toBe(!owner || owner === marja);
      }
      if (r.audience) expect(r.rulings.every((e) => e.marjaId === r.audience), r.id).toBe(true);
    }
  });

  it("a ruling's note reaches the reader without the legacy author's working references, and the one sentence that says it is not shown is gone", () => {
    let shown = 0;
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings) {
        const n = readerNote(e.note);
        if (!n) continue;
        shown++;
        expect(n, r.id).not.toMatch(/decision|\brule R|\bP\d{1,2}\b|\bR\d{1,2}\b|Data note|not shown in the UI|\.png|\(\//i);
      }
    expect(shown).toBeGreaterThan(300);
    // the reason an Urdu reader gets the English instead goes through the same rule
    for (const r of WAJIBAT_RULINGS)
      for (const e of r.rulings) {
        const v = viewOf(r, e.marjaId, "ur", false);
        if (v.kind !== "text") continue;
        for (const n of v.notices) if (n.kind === "no-urdu" && n.reason) expect(n.reason, r.id).not.toMatch(/decision|\brule R|\bP\d{1,2}\b|\bR\d{1,2}\b|Data note|not shown in the UI/i);
      }
    expect(readerNote("A. Data note (P14, not shown in the UI): x.")).toBe("A.");
    expect(readerNote("Supplementary Q&A entry (decision P13/rule R7), quoted from his Q&A book.")).toBe("Supplementary Q&A entry, quoted from his Q&A book.");
    expect(readerNote(undefined)).toBeNull();
  });

  it("names a marja' the way the prototype and the page do", () => {
    for (const m of MARAJI) expect(m.name.en, m.id).toContain(MARJA_SHORT[m.id]);
  });

  it("a Khamenei follower sees a pointer, not text, for the English-withheld and held ones, and the follower of another marja' is not affected", () => {
    const held = WAJIBAT_RULINGS.filter((r) => entryOf(r, "khamenei")?.referToRisala !== undefined);
    expect(held.length).toBe(92);
    for (const r of held) {
      expect(viewOf(r, "khamenei", "ur", false).kind).toBe("pointer");
      const s = entryOf(r, "sistani");
      if (s && !pointerReason(r, s)) expect(viewOf(r, "sistani", "en", false).kind).toBe("text");
    }
    expect(getMarjaRuling(held[0]!, "khamenei")).toBeTruthy();
  });
});
