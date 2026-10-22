// The two queues (Phase 4C): a PAGE of the page reader and a CHAPTER of a story, each as an ordered list of ayahs. Built from the data every time
// (the page starts, the story's passages), so nothing stale is ever stored. Pure.
import type { AyahRef, BuiltQueue } from "./audioEngine";
import { pageSegments } from "./pageReader";

export const pageQueueId = (page: number): string => `page:${page}`;
export const storyQueueId = (storyId: string, chapter: number): string => `story:${storyId}:${chapter}`;

/** Passages `{ surahNumber, ayahStart, ayahEnd }` in order, as single ayahs. */
export function flattenPassages(passages: ReadonlyArray<{ surahNumber: number; ayahStart: number; ayahEnd: number }>): AyahRef[] {
  const out: AyahRef[] = [];
  for (const p of passages) for (let a = p.ayahStart; a <= p.ayahEnd; a++) out.push({ surah: p.surahNumber, ayah: a });
  return out;
}

/** The page's ayahs in reading order (a page that crosses into the next surah plays on into it); null for a page that does not exist. */
export function pageQueue(page: number): BuiltQueue | null {
  const segs = pageSegments(page);
  if (!segs) return null;
  const items: AyahRef[] = [];
  for (const g of segs) for (let a = g.from; a <= g.to; a++) items.push({ surah: g.surah, ayah: a });
  return { id: pageQueueId(page), label: `Page ${page}`, items };
}

/** A story chapter's passages in order, labelled with the chapter's own title. */
export function storyQueue(storyId: string, chapter: number, title: string, passages: ReadonlyArray<{ surahNumber: number; ayahStart: number; ayahEnd: number }>): BuiltQueue | null {
  const items = flattenPassages(passages);
  return items.length ? { id: storyQueueId(storyId, chapter), label: title, items } : null;
}
