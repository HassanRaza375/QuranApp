// Review status of the decision helpers (decisions A6, A7). Every root-to-answer path of a tree has a
// stable id and a content hash. A reviewer's sign-off is stored per path in
// app/data/wajibat/treeReviews.json together with the hash it was given for; if the path's content
// changes afterwards the sign-off no longer matches and the path counts as "changed since review".
// A helper is shown only when every one of its paths has a matching approval (or the dev flag is on).
import type { DecisionNode, DecisionTree } from "../data/wajibat/types";

export interface ReviewRecord {
  hash: string;
  status: "approved" | "changes-needed";
  reviewer: string;
  date: string;
  note?: string;
}
export type TreeReviews = Record<string, Record<string, ReviewRecord>>;

export interface PathStep {
  node: DecisionNode;
  /** The option chosen to leave this node, or null for "I'm not sure". Undefined on the answer node. */
  optionId?: string | null;
  answer?: string;
}
export interface TreePath {
  id: string;
  steps: PathStep[];
  leaf: DecisionNode;
}

/** Every root-to-answer path, following every option and every "I'm not sure". */
export const enumeratePaths = (tree: DecisionTree): TreePath[] => {
  const nodes = new Map(tree.nodes.map((n) => [n.id, n]));
  const out: TreePath[] = [];
  const go = (id: string, acc: PathStep[]) => {
    const node = nodes.get(id)!;
    if (node.outcome) {
      const steps = [...acc, { node }];
      out.push({ id: acc.map((s) => (s.optionId ? s.optionId : `${s.node.id}ns`)).join("-"), steps, leaf: node });
      return;
    }
    for (const o of node.options ?? []) go(o.nextId, [...acc, { node, optionId: o.id, answer: o.label.en }]);
    go(node.notSureId!, [...acc, { node, optionId: null, answer: "I'm not sure" }]);
  };
  go(tree.rootId, []);
  return out;
};

/** FNV-1a (32 bit) of the UTF-8 bytes, plus the byte length: enough to notice any edit. */
const fnv = (s: string): string => {
  let h = 0x811c9dc5;
  const bytes = new TextEncoder().encode(s);
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(16).padStart(8, "0")}-${bytes.length}`;
};

/** Hash of everything a reviewer sees on this path: questions, answers, outcome, citation basis. */
export const pathHash = (tree: DecisionTree, path: TreePath): string => {
  const steps = path.steps.filter((s) => s.node.question).map((s) => [s.node.question!.text.en, s.answer, s.optionId ? s.node.options!.find((o) => o.id === s.optionId)!.basedOn : []]);
  const oc = path.leaf.outcome!;
  const outcome =
    oc.kind === "ruling"
      ? ["ruling", oc.quotes.map((q) => [q.rulingId, q.lang, q.text]), oc.verdictPhrases, oc.seeRulingIds ?? []]
      : ["refer", oc.reason.text.en, tree.risala];
  return fnv(JSON.stringify([tree.id, tree.marjaId, steps, outcome]));
};

export type PathState = "approved" | "changes-needed" | "stale" | "unreviewed";

export const pathState = (tree: DecisionTree, path: TreePath, reviews: TreeReviews): PathState => {
  const rec = reviews[tree.id]?.[path.id];
  if (!rec) return "unreviewed";
  if (rec.hash !== pathHash(tree, path)) return "stale";
  return rec.status;
};

export interface TreeReviewSummary {
  total: number;
  approved: number;
  changesNeeded: number;
  stale: number;
  unreviewed: number;
  /** True only when every path has a current approval. */
  fullyReviewed: boolean;
}

export const summariseReview = (tree: DecisionTree, reviews: TreeReviews): TreeReviewSummary => {
  const s = { total: 0, approved: 0, changesNeeded: 0, stale: 0, unreviewed: 0 };
  for (const p of enumeratePaths(tree)) {
    s.total += 1;
    const st = pathState(tree, p, reviews);
    if (st === "approved") s.approved += 1;
    else if (st === "changes-needed") s.changesNeeded += 1;
    else if (st === "stale") s.stale += 1;
    else s.unreviewed += 1;
  }
  return { ...s, fullyReviewed: s.total > 0 && s.approved === s.total };
};

/** A helper is visible only when it is fully reviewed, or the dev flag is on. Topic pages never depend on this. */
export const isHelperVisible = (tree: DecisionTree, reviews: TreeReviews, devFlag: boolean): boolean =>
  devFlag || summariseReview(tree, reviews).fullyReviewed;
