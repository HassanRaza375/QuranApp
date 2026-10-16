// Ayah text for the Library rows: visible rows only, one request at a time with a small gap, never a whole surah.
// The text comes from the device (cached chapter, then the ayah-text store) or one small per-ayah request; see lib/ayahSnippet.ts.
import { AYAH_TEXT, CHAPTERS, getCached, putCached } from "~/db/revampDb";
import type { Chapter } from "~/lib/chapter";
import { ayahTextKey, loadSnippet, type Snippet, type SnippetDeps } from "~/lib/ayahSnippet";
import { VerseService } from "~/services/verse.service";

const GAP_MS = 120;

export function useAyahSnippets() {
  const results = useState<Record<string, Snippet | "loading">>("ayah-snippets", () => ({}));
  const queue: { surah: number; ayah: number }[] = [];
  let running = false;

  const deps = (): SnippetDeps => ({
    cachedChapter: (s) => getCached<Chapter>(CHAPTERS, s),
    readAyah: (k) => getCached<string>(AYAH_TEXT, k),
    writeAyah: (k, t) => putCached(AYAH_TEXT, k, t),
    fetchAyah: (s, a) => VerseService.getVerseByNumber(s, a),
  });

  async function pump() {
    if (running) return;
    running = true;
    const d = deps();
    while (queue.length) {
      const { surah, ayah } = queue.shift()!;
      const key = ayahTextKey(surah, ayah);
      const r = await loadSnippet(surah, ayah, d, navigator.onLine);
      results.value = { ...results.value, [key]: r };
      if (queue.length && r.state !== "none") await new Promise((res) => setTimeout(res, GAP_MS));
    }
    running = false;
  }

  /** Asks for one ayah's text (a row scrolled into view, or Retry). Asking twice is harmless. */
  function request(surah: number, ayah: number, retry = false) {
    const key = ayahTextKey(surah, ayah);
    const have = results.value[key];
    if (have === "loading" || (have && have.state !== "failed" && have.state !== "none") || (have && !retry && have.state === "failed")) return;
    results.value = { ...results.value, [key]: "loading" };
    queue.push({ surah, ayah });
    void pump();
  }

  const get = (surah: number, ayah: number) => results.value[ayahTextKey(surah, ayah)];
  return { request, get };
}
