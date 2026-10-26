import { useQuranApi2 } from "./api";

// Verse-level transliteration, live from api.alquran.cloud's `en.transliteration` edition (the legacy Duas page's source). Nothing is stored: the answers
// are kept for the page's lifetime only. A failure is `null` (the page says so); a transliteration is never generated here.
interface AyahAnswer {
  data?: { text?: string };
}
const seen = new Map<string, string | null>();

export const TransliterationService = {
  async ayah(surah: number, ayah: number): Promise<string | null> {
    const key = `${surah}:${ayah}`;
    if (seen.has(key)) return seen.get(key) ?? null;
    try {
      const res = await useQuranApi2()<AyahAnswer>(`/ayah/${key}/en.transliteration`);
      const text = res?.data?.text?.trim() || null;
      seen.set(key, text);
      return text;
    } catch {
      return null; // not remembered: the next try (online again) asks again
    }
  },
};
