// The walk through a Daily Fiqh helper (Phase 13b): one question per screen, ending in the marja's own wording or a pointer to his risala. Pure, so a test can walk EVERY path of every
// helper. Nothing here is a ruling written by the app: the questions describe a situation, each option lists the rulings it relies on, and "I'm not sure" always leads to a pointer (legacy
// decisions P17 and R12).
import type { DecisionNode, DecisionTree } from "@legacy/data/wajibat/types";

export const NOT_SURE = "__notsure";

export interface WalkStep {
  nodeId: string;
  nextId: string;
  answer: string;
}

export const nodeById = (tree: DecisionTree, id: string): DecisionNode | undefined => tree.nodes.find((n) => n.id === id);

/** The screen the reader is on after `history`. */
export function currentNode(tree: DecisionTree, history: readonly WalkStep[]): DecisionNode | undefined {
  return nodeById(tree, history.at(-1)?.nextId ?? tree.rootId);
}

/** The history after answering the current question with `optionId` (or NOT_SURE); the same history if the answer is not one of the options. */
export function choose(tree: DecisionTree, history: readonly WalkStep[], optionId: string): WalkStep[] {
  const node = currentNode(tree, history);
  if (!node?.question) return [...history];
  if (optionId === NOT_SURE) return node.notSureId ? [...history, { nodeId: node.id, nextId: node.notSureId, answer: "I'm not sure" }] : [...history];
  const option = node.options?.find((o) => o.id === optionId);
  return option ? [...history, { nodeId: node.id, nextId: option.nextId, answer: option.label.en }] : [...history];
}

export const back = (history: readonly WalkStep[]): WalkStep[] => history.slice(0, -1);

/** Every complete walk from the first question to an outcome, including the "I'm not sure" branch of each question. */
export function allWalks(tree: DecisionTree): WalkStep[][] {
  const out: WalkStep[][] = [];
  const go = (history: WalkStep[], depth: number) => {
    if (depth > 60) throw new Error(`${tree.id}: a walk that does not end`);
    const node = currentNode(tree, history);
    if (!node) throw new Error(`${tree.id}: a screen that does not exist after ${history.map((h) => h.nodeId).join(" > ")}`);
    if (!node.question) return void out.push(history);
    for (const o of node.options ?? []) go(choose(tree, history, o.id), depth + 1);
    go(choose(tree, history, NOT_SURE), depth + 1);
  };
  go([], 0);
  return out;
}

/** The parts of a quote that state the answer, marked for highlighting: verbatim phrases of the quote, in order and not overlapping. */
export function highlight(text: string, phrases: readonly string[]): { text: string; hit: boolean }[] {
  const marks: [number, number][] = [];
  for (const p of phrases) {
    const i = text.indexOf(p);
    if (i >= 0) marks.push([i, i + p.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const out: { text: string; hit: boolean }[] = [];
  let pos = 0;
  for (const [a, b] of marks) {
    if (a < pos) continue;
    if (a > pos) out.push({ text: text.slice(pos, a), hit: false });
    out.push({ text: text.slice(a, b), hit: true });
    pos = b;
  }
  if (pos < text.length) out.push({ text: text.slice(pos), hit: false });
  return out;
}
