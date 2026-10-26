// Dataset integrity checks for the Wajibat module (Module 18, spec §7.3).
// Same role as commandsValidate.ts / personsValidate.ts, run by
// tests/wajibatDataset.test.ts. Procedure and decision-tree checks
// (ordered steps, reachable nodes, sourced leaves) arrive with those
// datasets in Phase 2+.
import type { WajibatDataset } from "~/data/wajibat";
import type { Marja, MarjaRuling } from "~/data/wajibat/types";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface WajibatIssue {
  id: string;
  message: string;
}

/** Decision P12: Arabic in an English `text`/`question` is only legitimate when the
 * cited English `source` book itself prints it as real text (flagged `arabicInSource`).
 * Arabic sourced from a *different* book (e.g. a marja's Urdu edition, when the English
 * book shows the same text only as an image) must be a separate `Recitation` instead —
 * never spliced into another book's quote. */
const ARABIC_RE = /[؀-ۿ]/;
const HUKMS = new Set(["wajib", "haram", "mustahab", "makruh", "mubah"]);
const BASES = new Set(["fatwa", "ihtiyat_wajib", "ihtiyat_mustahab", "ihtiyat_unspecified"]);
const LEVELS = new Set(["A", "B", "D"]);
const PANELS = new Set(["persons"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A level-A citation must point at the marja's own official site. */
const isOfficialUrl = (url: string, marja: Marja): boolean => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const official = new URL(marja.officialSite).hostname.replace(/^www\./, "");
    const alternates: Record<string, string[]> = { khamenei: ["khamenei.ir"], makarem: ["makaremshirazi.net"] };
    return host === official || (alternates[marja.id] ?? []).includes(host);
  } catch {
    return false;
  }
};

const nfc = (s: string) => s.normalize("NFC");
const findDuplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

const validateMarjaRuling = (
  entry: MarjaRuling,
  rulingId: string,
  maraji: Marja[],
  push: (id: string, message: string) => void
) => {
  const label = `${rulingId}/${entry.marjaId}`;
  const marja = maraji.find((m) => m.id === entry.marjaId);
  if (!marja) {
    push(label, `unknown marjaId "${entry.marjaId}"`);
    return;
  }
  if (marja.status === "pending-sources") push(label, `${marja.id} is pending sources and must not have rulings yet`);
  if (entry.urduOnly) {
    // Decision P19: the only official text is Urdu; the English is empty and never translated by the app.
    if (entry.text?.en?.trim()) push(label, "urduOnly entry must have an empty English text (no official English exists; the app never translates)");
    if (!entry.text?.ur?.trim() || !entry.urSource) push(label, "urduOnly entry needs the official Urdu text with its citation");
  } else if (!entry.text?.en?.trim()) push(label, "missing English text");
  if (entry.hukm !== undefined && !HUKMS.has(entry.hukm)) push(label, `invalid hukm "${entry.hukm}"`);
  if (!BASES.has(entry.basis)) push(label, `invalid basis "${entry.basis}"`);
  if (!LEVELS.has(entry.verification)) push(label, `invalid verification level "${entry.verification}"`);
  if (entry.format !== "issue" && entry.format !== "qa") push(label, `invalid format "${entry.format}"`);
  if (entry.format === "qa" && !entry.question?.en?.trim()) push(label, "Q&A ruling is missing its question");

  const src = entry.source;
  if (!src?.title?.trim() || !src?.reference?.trim() || !src?.url?.trim()) push(label, "source needs title, reference and url");
  else if (entry.verification === "A" && !isOfficialUrl(src.url, marja)) push(label, `level-A source is not on ${marja.officialSite}`);

  // Decision R1: Urdu ruling text only from the marja's official Urdu book, with its own citation.
  const hasUrdu = !!entry.text.ur?.trim() || !!entry.question?.ur?.trim();
  if (hasUrdu) {
    const ur = entry.urSource;
    if (!ur?.title?.trim() || !ur?.reference?.trim() || !ur?.url?.trim()) push(label, "Urdu text without an Urdu source citation");
    else if (!isOfficialUrl(ur.url, marja)) push(label, `Urdu source is not on ${marja.officialSite}`);
    if (entry.format === "qa" && (!entry.text.ur?.trim() || !entry.question?.ur?.trim())) push(label, "Urdu Q&A must have both question and answer");
  } else if (entry.urSource) {
    push(label, "urSource given but no Urdu text");
  }
  if (entry.urduEditionLag && hasUrdu) push(label, "urduEditionLag entries must not carry the outdated Urdu text");
  // Decision R11: withheld English means the Urdu (matching the Persian) is what the user sees.
  if (entry.englishWithheld !== undefined) {
    if (!entry.englishWithheld.trim()) push(label, "englishWithheld needs its audit reason");
    if (!entry.text.ur?.trim() || !entry.urSource) push(label, "englishWithheld entries must carry the official Urdu text with its citation (the English is not shown)");
    if (!entry.persianSource) push(label, "englishWithheld entries must cite the Persian original they were decided against (decision R11)");
    if (entry.marjaId !== "khamenei") push(label, "englishWithheld applies to Khamenei only: his English and Urdu are both translations of the Persian (decision R11)");
  }
  if (entry.persianSource) {
    const ps = entry.persianSource;
    if (!ps.title?.trim() || !ps.reference?.trim() || !ps.url?.trim()) push(label, "persianSource needs title, reference and url");
    else if (!isOfficialUrl(ps.url, marja)) push(label, `persianSource is not on ${marja.officialSite}`);
  }

  const englishHasArabic = ARABIC_RE.test(entry.text.en) || ARABIC_RE.test(entry.question?.en ?? "");
  if (englishHasArabic && !entry.arabicInSource) {
    push(label, "Arabic in English text/question without arabicInSource — Arabic from a different book must be a Recitation, not spliced into this quote (decision P12)");
  }
};

export const validateWajibatDataset = (
  data: WajibatDataset,
  maraji: Marja[],
  surahs: SurahMeta[]
): WajibatIssue[] => {
  const issues: WajibatIssue[] = [];
  const push = (id: string, message: string) => issues.push({ id, message });

  const { categories, topics, rulings, glossary, recitations } = data;
  for (const [name, list] of [
    ["category", categories.map((c) => c.id)],
    ["topic", topics.map((t) => t.id)],
    ["ruling", rulings.map((r) => r.id)],
    ["glossary", glossary.map((g) => g.id)],
    ["marja", maraji.map((m) => m.id)],
    ["recitation", recitations.map((r) => r.id)],
  ] as const) {
    for (const dup of findDuplicates([...list])) push(dup, `duplicate ${name} id`);
    for (const id of list) if (!/^[a-z0-9]+$/.test(id)) push(id, `${name} id must be lowercase ASCII letters/digits only (Shared Foundation #1)`);
  }

  const topicIds = new Set(topics.map((t) => t.id));
  const glossaryIds = new Set(glossary.map((g) => g.id));
  const recitationIds = new Set(recitations.map((r) => r.id));

  for (const rec of recitations) {
    if (!rec.arabic?.trim()) push(rec.id, "recitation needs its Arabic text");
    const marja = maraji.find((m) => m.id === rec.marjaId);
    if (!marja) push(rec.id, `unknown marjaId "${rec.marjaId}"`);
    if (!rec.source?.title?.trim() || !rec.source?.reference?.trim() || !rec.source?.url?.trim())
      push(rec.id, "recitation needs a source with title, reference and url");
    else if (marja && !isOfficialUrl(rec.source.url, marja)) push(rec.id, `recitation source is not on ${marja.officialSite}`);
  }

  for (const c of categories) {
    if (c.summary?.kind !== "explanation") push(c.id, "category summary must be kind: explanation");
    for (const tid of c.topicIds) {
      const topic = topics.find((t) => t.id === tid);
      if (!topic) push(c.id, `topicIds references unknown topic "${tid}"`);
      else if (topic.categoryId !== c.id) push(c.id, `topic "${tid}" belongs to category "${topic.categoryId}"`);
    }
  }

  for (const t of topics) {
    const cat = categories.find((c) => c.id === t.categoryId);
    if (!cat) push(t.id, `unknown categoryId "${t.categoryId}"`);
    else if (!cat.topicIds.includes(t.id)) push(t.id, `not listed in category "${cat.id}".topicIds`);
    if (t.fiqh !== "jafari") push(t.id, `unsupported fiqh "${t.fiqh}"`);
    if (t.summary?.kind !== "explanation") push(t.id, "summary must be kind: explanation");
    for (const e of t.explanations ?? []) if (e.body?.kind !== "explanation") push(t.id, "explanations must be kind: explanation");
    if (!DATE_RE.test(t.lastSourceCheck)) push(t.id, "lastSourceCheck must be YYYY-MM-DD");
    for (const rid of t.rulingIds) {
      const r = rulings.find((x) => x.id === rid);
      if (!r) push(t.id, `rulingIds references unknown ruling "${rid}"`);
      else if (r.topicId !== t.id) push(t.id, `ruling "${rid}" belongs to topic "${r.topicId}"`);
    }
    for (const rel of t.relatedTopicIds ?? []) if (!topicIds.has(rel)) push(t.id, `relatedTopicIds references unknown topic "${rel}"`);
    for (const g of t.glossaryIds ?? []) if (!glossaryIds.has(g)) push(t.id, `glossaryIds references unknown term "${g}"`);
    for (const ref of t.quranicBasis ?? []) {
      const surah = surahs.find((s) => s.surahNo === ref.surahNumber);
      const ayahs = [ref.ayahNumber, ref.ayahStart, ref.ayahEnd].filter((a): a is number => a !== undefined);
      if (!surah) push(t.id, `quranicBasis: surah ${ref.surahNumber} does not exist`);
      else if (ayahs.length === 0) push(t.id, `quranicBasis: ${ref.surahNumber} has no ayah`);
      else for (const a of ayahs) if (a < 1 || a > surah.totalAyah) push(t.id, `quranicBasis: ${ref.surahNumber}:${a} is out of bounds`);
    }
    for (const n of t.quranicBasisNotes ?? []) {
      const linked = (t.quranicBasis ?? []).some((q) => q.surahNumber === n.surahNumber && q.ayahNumber === n.ayahNumber);
      if (!linked) push(t.id, `quranicBasisNotes: ${n.surahNumber}:${n.ayahNumber} is not one of the topic's basis ayahs`);
      if (n.note?.kind !== "explanation") push(t.id, "quranicBasisNotes: note must be kind: explanation");
      if (!n.quote?.text?.trim() || !n.source?.title?.trim() || !n.source?.urls?.length) push(t.id, "quranicBasisNotes: needs a verbatim quote and a cited source");
    }
    if (t.reviewedBy && (!t.reviewedBy.name || !DATE_RE.test(t.reviewedBy.date))) push(t.id, "reviewedBy needs a name and YYYY-MM-DD date");
  }

  for (const r of rulings) {
    const topic = topics.find((t) => t.id === r.topicId);
    if (!topic) push(r.id, `unknown topicId "${r.topicId}"`);
    else if (!topic.rulingIds.includes(r.id)) push(r.id, `not listed in topic "${topic.id}".rulingIds`);
    if (!r.subject?.en?.trim()) push(r.id, "missing subject");
    if (r.panel !== undefined && !PANELS.has(r.panel)) push(r.id, `unknown panel "${r.panel}"`);
    if (r.panel && r.sensitive) push(r.id, "a ruling can be in the women-specific panel or another panel, not both");
    if (r.rulings.length === 0) push(r.id, "has no marja' entries");
    for (const dup of findDuplicates(r.rulings.map((m) => m.marjaId))) push(r.id, `two entries for marja "${dup}"`);
    const hasD = r.rulings.some((m) => m.verification === "D");
    if (hasD && r.status !== "disputed") push(r.id, "level-D entry requires status: disputed");
    if (!hasD && r.status === "disputed") push(r.id, "status: disputed without a level-D entry");
    for (const rec of r.recitationIds ?? []) if (!recitationIds.has(rec)) push(r.id, `recitationIds references unknown recitation "${rec}"`);
    for (const m of r.rulings) validateMarjaRuling(m, r.id, maraji, push);

    // seeAlso: only for a marja' with no entry here, pointing at a ruling of the same topic that has his entry.
    for (const s of r.seeAlso ?? []) {
      const target = rulings.find((x) => x.id === s.rulingId);
      if (r.rulings.some((m) => m.marjaId === s.marjaId)) push(r.id, `seeAlso for ${s.marjaId}, who already has an entry here`);
      if (!target) push(r.id, `seeAlso references unknown ruling "${s.rulingId}"`);
      else if (target.topicId !== r.topicId) push(r.id, `seeAlso target "${s.rulingId}" is in another topic`);
      else if (!target.rulings.some((m) => m.marjaId === s.marjaId)) push(r.id, `seeAlso target "${s.rulingId}" has no entry for ${s.marjaId}`);
    }

    // Phase 6: a point only one marja's book states (`audience`): exactly his entry, nothing else.
    if (r.audience) {
      if (r.rulings.length !== 1 || r.rulings[0]?.marjaId !== r.audience) push(r.id, "an audience ruling holds exactly one entry, for its own marja'");
      if (r.differsBetweenMaraji) push(r.id, "an audience ruling has one marja' only, so it cannot be differsBetweenMaraji");
      if (r.supplementary) push(r.id, "a ruling is either supplementary or audience, not both");
    }

    // Decision P13 / rule R7: a supplementary Q&A entry is one marja's own, compared with (and
    // agreeing with) cited rulings of his — never another marja's, never a gap for anyone else.
    if (r.supplementary) {
      const s = r.supplementary;
      const marja = maraji.find((m) => m.id === s.marjaId);
      if (r.rulings.length !== 1 || r.rulings[0]?.marjaId !== s.marjaId) push(r.id, "a supplementary ruling holds exactly one entry, for its own marja'");
      if (r.rulings[0] && r.rulings[0].format !== "qa") push(r.id, "a supplementary ruling must be a Q&A entry");
      if (r.differsBetweenMaraji) push(r.id, "a supplementary ruling has one marja' only, so it cannot be differsBetweenMaraji");
      if (!s.agreesWith?.length) push(r.id, "a supplementary ruling must cite the ruling(s) it was compared with and agrees with");
      for (const c of s.agreesWith ?? []) {
        if (!c.title?.trim() || !c.reference?.trim() || !c.url?.trim()) push(r.id, "agreesWith citation needs title, reference and url");
        else if (marja && !isOfficialUrl(c.url, marja)) push(r.id, `agreesWith citation is not on ${marja.officialSite}`);
      }
    }
  }

  // Procedures: ordered steps, each quoting its cited ruling verbatim for the same marja'.
  const procedures = data.procedures ?? [];
  for (const dup of findDuplicates(procedures.map((p) => p.id))) push(dup, "duplicate procedure id");
  for (const t of topics) {
    for (const pid of t.procedureIds ?? []) {
      const p = procedures.find((x) => x.id === pid);
      if (!p) push(t.id, `procedureIds references unknown procedure "${pid}"`);
      else if (p.topicId !== t.id) push(t.id, `procedure "${pid}" belongs to topic "${p.topicId}"`);
    }
  }
  for (const p of procedures) {
    if (!/^[a-z0-9]+$/.test(p.id)) push(p.id, "procedure id must be lowercase ASCII letters/digits only (Shared Foundation #1)");
    const topic = topics.find((t) => t.id === p.topicId);
    if (!topic) push(p.id, `unknown topicId "${p.topicId}"`);
    else if (!(topic.procedureIds ?? []).includes(p.id)) push(p.id, `not listed in topic "${topic.id}".procedureIds`);
    const marja = maraji.find((m) => m.id === p.marjaId);
    if (!marja) push(p.id, `unknown marjaId "${p.marjaId}"`);
    else if (marja.status === "pending-sources") push(p.id, `${marja.id} is pending sources and must not have procedures yet`);
    if (p.steps.length === 0) push(p.id, "procedure has no steps");
    p.steps.forEach((s, i) => {
      const label = `${p.id}/${s.id}`;
      if (s.order !== i + 1) push(label, `steps must be ordered 1..n without gaps (expected ${i + 1}, got ${s.order})`);
      if (s.hukm !== undefined && !HUKMS.has(s.hukm)) push(label, `invalid hukm "${s.hukm}"`);
      const ruling = rulings.find((r) => r.id === s.rulingId);
      const entry = ruling?.rulings.find((m) => m.marjaId === p.marjaId);
      if (!ruling) push(label, `rulingId references unknown ruling "${s.rulingId}"`);
      else if (!entry) push(label, `ruling "${s.rulingId}" has no entry for ${p.marjaId}`);
      else {
        if (entry.referToRisala !== undefined) push(label, `step quotes "${s.rulingId}", which is held for review and not shown (decision B1)`);
        // Withheld English (R11, B1) or no English (P19): the step must carry a verbatim Urdu excerpt to show instead.
        if ((entry.englishWithheld !== undefined || entry.urduOnly) && !s.instruction.ur?.trim()) push(label, `step quotes the English of "${s.rulingId}", which is withheld or does not exist, and has no Urdu excerpt to show instead (decisions R11, P19, B1)`);
        if (!s.instruction.en?.trim() || !entry.text.en.includes(s.instruction.en)) push(label, "instruction is not a verbatim excerpt of the cited ruling");
        if (s.instruction.ur && !(entry.text.ur ?? "").includes(s.instruction.ur)) push(label, "Urdu instruction is not a verbatim excerpt of the cited ruling");
      }
      for (const rec of s.recitationIds ?? []) if (!recitationIds.has(rec)) push(label, `recitationIds references unknown recitation "${rec}"`);
    });
    for (const dup of findDuplicates(p.steps.map((s) => s.id))) push(p.id, `duplicate step id "${dup}"`);
  }

  for (const g of glossary) {
    if (!g.term?.trim() || !g.definition?.en?.trim()) push(g.id, "glossary term needs term and English definition");
  }

  // Decision helpers (Phase 4b; decisions P17, R11, R12, P19).
  const trees = data.decisionTrees ?? [];
  const marjaIds = new Set(maraji.map((m) => m.id));
  const treeIds = trees.map((t) => t.id);
  for (const dup of findDuplicates(treeIds)) push(dup, "duplicate decision tree id");
  for (const id of treeIds) if (!/^[a-z0-9]+$/.test(id)) push(id, "decision tree id must be lowercase ASCII letters/digits only");
  for (const topic of topics) {
    for (const tid of topic.decisionTreeIds ?? []) {
      const tr = trees.find((t) => t.id === tid);
      if (!tr) push(topic.id, `decisionTreeIds references unknown tree "${tid}"`);
      else if (tr.topicId !== topic.id) push(tid, `tree belongs to topic "${tr.topicId}", but is listed on "${topic.id}"`);
    }
  }
  for (const tr of trees) {
    const tp = tr.id;
    if (!topicIds.has(tr.topicId)) push(tp, `unknown topicId "${tr.topicId}"`);
    else if (!(topics.find((t) => t.id === tr.topicId)?.decisionTreeIds ?? []).includes(tr.id)) push(tp, "tree is not listed in its topic's decisionTreeIds");
    if (!marjaIds.has(tr.marjaId)) push(tp, `unknown marjaId "${tr.marjaId}"`);
    if (!tr.title?.en?.trim() || !tr.intro?.text?.en?.trim()) push(tp, "tree needs a title and an introduction");
    if (!tr.risala?.book?.trim() || !tr.risala?.location?.trim() || !/^https:\/\//.test(tr.risala?.url ?? "")) push(tp, "tree needs a risala pointer (book, location, https url)");
    const nodeIds = tr.nodes.map((n) => n.id);
    for (const dup of findDuplicates(nodeIds)) push(tp, `duplicate node id "${dup}"`);
    for (const id of nodeIds) if (!/^[a-z0-9]+$/.test(id)) push(`${tp}/${id}`, "node id must be lowercase ASCII letters/digits only");
    const byId = new Map(tr.nodes.map((n) => [n.id, n]));
    if (!byId.has(tr.rootId)) push(tp, `rootId "${tr.rootId}" is not a node`);
    const optionIds: string[] = [];
    const entryOf = (rid: string) => rulings.find((r) => r.id === rid)?.rulings.find((m) => m.marjaId === tr.marjaId);
    for (const n of tr.nodes) {
      const label = `${tp}/${n.id}`;
      const isQuestion = n.question !== undefined;
      if (isQuestion === (n.outcome !== undefined)) push(label, "a node is either a question or an outcome");
      if (isQuestion) {
        if (!n.question?.text?.en?.trim()) push(label, "question needs English text");
        if ((n.options?.length ?? 0) < 2) push(label, "a question needs at least two options");
        // R12: every question offers "I'm not sure", which leads to a refer outcome, never to a guess.
        const ns = n.notSureId ? byId.get(n.notSureId) : undefined;
        if (!ns || ns.outcome?.kind !== "refer") push(label, "question needs notSureId pointing at a refer outcome (decision R12)");
        for (const o of n.options ?? []) {
          optionIds.push(o.id);
          if (!o.label?.en?.trim()) push(`${label}/${o.id}`, "option needs a label");
          if (!byId.has(o.nextId)) push(`${label}/${o.id}`, `nextId "${o.nextId}" is not a node`);
          if (!o.basedOn?.length) push(`${label}/${o.id}`, "option must list the ruling it is based on (decision P17b)");
          for (const b of o.basedOn ?? []) {
            const e = entryOf(b.rulingId);
            if (!e) push(`${label}/${o.id}`, `basedOn ruling "${b.rulingId}" has no entry for ${tr.marjaId}`);
            else if (!nfc(e.text.en ?? "").includes(nfc(b.phrase)) && !nfc(e.text.ur ?? "").includes(nfc(b.phrase)))
              push(`${label}/${o.id}`, `basedOn phrase is not in ${tr.marjaId}'s text of "${b.rulingId}": ${b.phrase.slice(0, 50)}`);
          }
        }
      } else if (n.outcome?.kind === "ruling") {
        const oc = n.outcome;
        if (!oc.quotes.length) push(label, "a ruling outcome needs at least one quote");
        for (const q of oc.quotes) {
          const e = entryOf(q.rulingId);
          if (!e) { push(label, `quote cites ruling "${q.rulingId}", which has no entry for ${tr.marjaId} (never another marja')`); continue; }
          if (e.referToRisala !== undefined) push(label, `quote cites "${q.rulingId}", which is held for review and not shown (decision B1)`);
          const hidden = e.englishWithheld !== undefined || e.urduOnly;
          if (hidden && q.lang !== "ur") push(label, `"${q.rulingId}" has no shown English (decisions R11, P19): quote the Urdu`);
          if (!q.text.trim() || !nfc(e.text[q.lang] ?? "").includes(nfc(q.text))) push(label, `quote is not a verbatim part of ${tr.marjaId}'s ${q.lang} text of "${q.rulingId}"`);
        }
        const joined = nfc(oc.quotes.map((q) => q.text).join("\n"));
        if (!oc.verdictPhrases.length) push(label, "a ruling outcome needs verdictPhrases");
        for (const v of oc.verdictPhrases) if (!joined.includes(nfc(v))) push(label, `verdict phrase is not in the quotes: ${v.slice(0, 50)}`);
        for (const sid of oc.seeRulingIds ?? []) if (!entryOf(sid)) push(label, `seeRulingIds "${sid}" has no entry for ${tr.marjaId}`);
      } else if (n.outcome?.kind === "refer") {
        if (!n.outcome.reason?.text?.en?.trim()) push(label, "a refer outcome needs a reason");
      }
    }
    for (const dup of findDuplicates(optionIds)) push(tp, `duplicate option id "${dup}"`);
    // Reachability, and no cycles (every walk must end at an outcome).
    const seen = new Set<string>();
    const stack = new Set<string>();
    const walk = (id: string) => {
      if (stack.has(id)) { push(tp, `cycle through node "${id}"`); return; }
      if (seen.has(id)) return;
      seen.add(id);
      stack.add(id);
      const n = byId.get(id);
      for (const nx of [...(n?.options ?? []).map((o) => o.nextId), ...(n?.notSureId ? [n.notSureId] : [])]) if (byId.has(nx)) walk(nx);
      stack.delete(id);
    };
    if (byId.has(tr.rootId)) walk(tr.rootId);
    for (const id of nodeIds) if (!seen.has(id)) push(`${tp}/${id}`, "node is not reachable from the root");
  }

  return issues;
};

/** One source unit from the snapshot: the whole numbered ruling / Q&A answer (`numbered`), or
 * the enclosing passage of an unnumbered section introduction/condition. */
export interface SourceUnit {
  unit: string;
  numbered: boolean;
}
/** Keyed `${rulingId}|${marjaId}|${lang}|${"text" | "question"}` and `recitation|${id}`. */
export type SourceSnapshot = Record<string, SourceUnit>;


/** Every quoted ruling text must match the official source it was extracted from, as recorded
 * in the source snapshot (tests/fixtures/wajibatSourceSnapshot.json, built by script from the
 * downloaded official pages): equal to the whole numbered unit, or — only when the entry is
 * marked `excerpt`, or the unit is an unnumbered passage — a verbatim part of it. This catches
 * any hand edit, paraphrase or splice into a quote (decision P12 follow-up). */
export const validateSourceSnapshot = (data: WajibatDataset, snapshot: SourceSnapshot): WajibatIssue[] => {
  const issues: WajibatIssue[] = [];
  const check = (key: string, quoted: string, excerpt: boolean) => {
    const src = snapshot[key];
    if (!src) return issues.push({ id: key, message: "no source unit in the snapshot — quote not traceable to an extracted source" });
    const q = nfc(quoted);
    const u = nfc(src.unit);
    const ok = src.numbered && !excerpt ? q === u : u.includes(q);
    if (!ok) {
      issues.push({
        id: key,
        message: src.numbered && !excerpt
          ? "text differs from its numbered source unit (not verbatim)"
          : "text is not a verbatim part of its source passage",
      });
    }
  };
  for (const r of data.rulings) {
    for (const e of r.rulings) {
      for (const lang of ["en", "ur"] as const) {
        if (e.text[lang]) check(`${r.id}|${e.marjaId}|${lang}|text`, e.text[lang]!, !!e.excerpt);
        if (e.question?.[lang]) check(`${r.id}|${e.marjaId}|${lang}|question`, e.question[lang]!, false);
      }
    }
  }
  for (const rec of data.recitations) check(`recitation|${rec.id}`, rec.arabic, true);
  return issues;
};
