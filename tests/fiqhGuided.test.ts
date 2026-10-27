// Phase 13b: the guided procedures, the recitations and the decision helpers, on the REAL data. The helpers are hidden until every path is signed off (none is); these tests walk EVERY path of
// every helper, check that every quote is a verbatim part of the ruling it cites, and check that a step or an answer that quotes a ruling which may not be shown shows the pointer instead.
import { describe, expect, it } from "vitest";
import { MARAJI, WAJIBAT_DATASET, getRulingById } from "@legacy/data/wajibat/index";
import type { MarjaId } from "@legacy/data/wajibat/types";
import { assertNoUnreviewedHelpersInProduction, showUnreviewedHelpersRequested, SHOW_UNREVIEWED_ENV } from "@legacy/utils/wajibatBuildGuard";
import { enumeratePaths, isHelperVisible, summariseReview, type TreeReviews } from "@legacy/utils/wajibatReview";
import { allWalks, choose, currentNode, highlight, NOT_SURE, nodeById } from "../app/lib/fiqh/helperWalk";
import { quoteView } from "../app/lib/fiqh/quoteView";
import { readerNote } from "../app/lib/fiqh/visibility";
import reviews from "../legacy/app/data/wajibat/treeReviews.json";

const TREES = WAJIBAT_DATASET.decisionTrees;
const REVIEWS = reviews as unknown as TreeReviews;
const BAD = /decision|\brule R|\bP\d{1,2}\b|\bR\d{1,2}\b|Data note|not shown in the UI|\.png|\(\//i;

describe("the four helpers (hidden until every path is signed off)", () => {
  it("are the four the legacy built, 262 paths in all, none of them signed off", () => {
    expect(TREES.map((t) => t.id).sort()).toEqual(["khameneidoubts", "khameneiwudu", "sistanidoubts", "sistaniwudu"]);
    expect(TREES.reduce((n, t) => n + enumeratePaths(t).length, 0)).toBe(262);
    for (const t of TREES) {
      expect(summariseReview(t, REVIEWS).approved, t.id).toBe(0);
      expect(isHelperVisible(t, REVIEWS, false), t.id).toBe(false); // hidden
      expect(isHelperVisible(t, REVIEWS, true), t.id).toBe(true); // shown only by the development flag
    }
  });

  it("every walk, including every \"I'm not sure\", ends at an outcome; \"I'm not sure\" always ends at a pointer to his risala (never a guessed answer)", () => {
    for (const t of TREES) {
      const walks = allWalks(t);
      expect(walks.length, t.id).toBeGreaterThan(10);
      for (const n of t.nodes) {
        if (!n.question) continue;
        expect(n.notSureId, `${t.id}:${n.id} offers "I'm not sure"`).toBeTruthy();
        const sure = nodeById(t, n.notSureId!)!;
        expect(sure.outcome?.kind, `${t.id}:${n.id}`).toBe("refer");
      }
      for (const w of walks) expect(currentNode(t, w)!.outcome, t.id).toBeTruthy();
    }
  });

  it("choose ignores an answer that is not one of the options, and every option leads to a screen that exists", () => {
    for (const t of TREES) {
      const root = currentNode(t, [])!;
      expect(choose(t, [], "no-such-option")).toEqual([]);
      for (const n of t.nodes) for (const o of n.options ?? []) expect(nodeById(t, o.nextId), `${t.id}:${n.id}:${o.id}`).toBeTruthy();
      expect(choose(t, [], NOT_SURE)).toHaveLength(root.question ? 1 : 0);
    }
  });

  it("every quote in every answer is a verbatim part of the ruling it cites, in the marja's own entry (the legacy's rule, checked here)", () => {
    let quotes = 0;
    for (const t of TREES)
      for (const n of t.nodes) {
        if (n.outcome?.kind !== "ruling") continue;
        for (const q of n.outcome.quotes) {
          quotes++;
          const entry = getRulingById(q.rulingId)?.rulings.find((e) => e.marjaId === t.marjaId);
          expect(entry, `${t.id}:${n.id}:${q.rulingId}`).toBeTruthy();
          const whole = [entry!.text.en, entry!.text.ur].filter(Boolean).join("\n").normalize("NFC"); // the legacy compares in NFC: a mark can be stored composed or decomposed
          expect(whole.includes(q.text.normalize("NFC")), `${t.id}:${n.id}:${q.rulingId}`).toBe(true);
        }
        for (const phrase of n.outcome.verdictPhrases) expect(n.outcome.quotes.some((q) => q.text.normalize("NFC").includes(phrase.normalize("NFC"))), `${t.id}:${n.id}: "${phrase}"`).toBe(true);
      }
    expect(quotes).toBe(150);
  });

  it("an answer that quotes a ruling held for review, withheld or on our hold list shows the pointer and none of that ruling's text; no other answer is changed", () => {
    const pointers: Record<string, number> = {};
    for (const t of TREES)
      for (const n of t.nodes) {
        if (n.outcome?.kind !== "ruling") continue;
        for (const q of n.outcome.quotes) {
          const v = quoteView(getRulingById(q.rulingId), t.marjaId as MarjaId, q.text, q.lang);
          expect(v.kind, `${t.id}:${n.id}`).not.toBe("missing");
          if (v.kind === "pointer") {
            pointers[t.id] = (pointers[t.id] ?? 0) + 1;
            expect(JSON.stringify(v)).not.toContain(q.text.slice(0, 40));
          } else if (v.kind === "text") expect(v.text).toBe(q.text);
        }
      }
    // The Sistani helpers quote nothing that is held. Khamenei's doubts helper quotes 19 rulings that are, and his wuḍūʾ helper 1: those answers show the pointer. This is what the sign-off
    // reviewer must be told: the answers they read are not the answers of the legacy's review pack for those 20 quotes.
    expect(pointers).toEqual({ khameneidoubts: 19, khameneiwudu: 1 });
  });

  it("highlights the phrases that state the answer, in order, and shows all of the text", () => {
    const parts = highlight("It is obligatory to wash the face, and to wipe the head.", ["wash the face", "wipe the head", "not in the text"]);
    expect(parts.map((p) => p.text).join("")).toBe("It is obligatory to wash the face, and to wipe the head.");
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(["wash the face", "wipe the head"]);
  });
});

describe("the guided procedures and their recitations", () => {
  const PROCS = WAJIBAT_DATASET.procedures;
  it("are the 11 of the data: wuḍūʾ, ghusl (2), tayammum (2 maraji'), and the guided prayers (6)", () => {
    expect(PROCS).toHaveLength(11);
    expect(PROCS.filter((p) => p.marjaId === "sistani")).toHaveLength(7);
    expect(PROCS.filter((p) => p.marjaId === "khamenei")).toHaveLength(4);
  });

  it("every step quotes a part of a ruling of its own marja', and the step shows that text, or the pointer where the ruling may not be shown: exactly the 3 Khamenei steps whose English is withheld", () => {
    const pointerSteps: string[] = [];
    for (const p of PROCS)
      for (const s of p.steps) {
        const ruling = getRulingById(s.rulingId);
        const v = quoteView(ruling, p.marjaId as MarjaId, s.instruction.en || s.instruction.ur || "", s.instruction.en ? "en" : "ur");
        expect(v.kind, `${p.id}:${s.id}`).not.toBe("missing");
        if (v.kind === "pointer") pointerSteps.push(`${p.id}:${s.id}:${v.reason}`);
        else if (v.kind === "text") {
          const entry = ruling!.rulings.find((e) => e.marjaId === p.marjaId)!;
          expect([entry.text.en, entry.text.ur].filter(Boolean).join("\n").normalize("NFC").includes(v.text.normalize("NFC")), `${p.id}:${s.id}`).toBe(true);
        }
      }
    expect(pointerSteps.sort()).toEqual(["maghribkhamenei:s19:english-differs", "zuhrkhamenei:s19:english-differs", "zuhrkhamenei:s26:english-differs"]);
  });

  it("the 2 recitations are Sistani's, taken from his own Urdu book, and only his steps and rulings carry them", () => {
    const rec = WAJIBAT_DATASET.recitations;
    expect(rec.map((r) => `${r.id}/${r.marjaId}`).sort()).toEqual(["rukudhikrarabic/sistani", "sajdahdhikrarabic/sistani"]);
    for (const r of rec) {
      expect(r.arabic.length, r.id).toBeGreaterThan(5);
      expect(r.source.url, r.id).toMatch(/^https:\/\/www\.sistani\.org\/urdu\//);
    }
    for (const p of PROCS) for (const s of p.steps) for (const id of s.recitationIds ?? []) expect(p.marjaId, `${p.id}:${s.id}`).toBe(rec.find((r) => r.id === id)!.marjaId);
  });

  it("the notes under a step and under a recitation reach the reader without the legacy author's working references", () => {
    let shown = 0;
    for (const p of PROCS)
      for (const s of p.steps) {
        const n = readerNote(s.note);
        if (n) {
          shown++;
          expect(n, `${p.id}:${s.id}`).not.toMatch(BAD);
        }
      }
    for (const r of WAJIBAT_DATASET.recitations) expect(readerNote(r.note) ?? "", r.id).not.toMatch(BAD);
    expect(shown).toBeGreaterThan(100);
  });
});

describe("the development flag never reaches a production build (legacy decision B3)", () => {
  it("throws in a production build when the flag is on, in any common spelling, on Vercel too", () => {
    for (const v of ["true", "TRUE", "1", "yes", "on", " true "]) expect(() => assertNoUnreviewedHelpersInProduction({ NODE_ENV: "production", [SHOW_UNREVIEWED_ENV]: v }), v).toThrow(/production build/);
    expect(() => assertNoUnreviewedHelpersInProduction({ VERCEL_ENV: "production", [SHOW_UNREVIEWED_ENV]: "true" })).toThrow();
  });
  it("allows production without the flag or with it off, and development with it on", () => {
    for (const v of [undefined, "", "false", "0", "no"]) expect(() => assertNoUnreviewedHelpersInProduction({ NODE_ENV: "production", [SHOW_UNREVIEWED_ENV]: v })).not.toThrow();
    expect(() => assertNoUnreviewedHelpersInProduction({ NODE_ENV: "development", [SHOW_UNREVIEWED_ENV]: "true" })).not.toThrow();
    expect(showUnreviewedHelpersRequested({ [SHOW_UNREVIEWED_ENV]: "true" })).toBe(true);
  });
  it("is called by nuxt.config.ts, so `nuxt build` runs it, and the runtime flag defaults to off", async () => {
    const { readFileSync } = await import("node:fs");
    const cfg = readFileSync("nuxt.config.ts", "utf8");
    expect(cfg).toMatch(/assertNoUnreviewedHelpersInProduction\(process\.env\)/);
    expect(cfg).toMatch(/wajibatShowUnreviewedHelpers:\s*false/);
    expect(MARAJI.length).toBe(3);
  });
});
