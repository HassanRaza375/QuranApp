// The verses of prostration (Phase 9B). The 15 [surah, ayah] pairs are the service's list, bundled by scripts/gen-sajda.mjs (no text, no flags).
// The Arabic is the surah reader's text. Nothing here states whether a prostration is obligatory or recommended: that differs between
// traditions and needs a reviewed source (CONTENT_TO_VERIFY.md). Pure.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { SAJDA_AYAHS } from "~/data/sajda.generated";
import { juzOfAyah, pageOfAyah } from "./quranMeta";

export interface SajdaRow {
  n: number;
  surah: number;
  ayah: number;
  surahName: string;
  juz: number;
  page: number;
  href: string;
}

/** The list in Qur'an order, with the surah name from the data and the juz and page from the juz and page starts. */
export const sajdaRows = (): SajdaRow[] =>
  SAJDA_AYAHS.map(([surah, ayah], i) => ({
    n: i + 1,
    surah,
    ayah,
    surahName: SURAH_ROWS[surah - 1]!.name,
    juz: juzOfAyah(surah, ayah)!,
    page: pageOfAyah(surah, ayah)!,
    href: `/surah/${surah}#ayah-${ayah}`,
  }));

export const SAJDA_TITLE = "Verses of prostration";
export const sajdaCountLine = (n: number): string => `${n} verses, as listed by this app’s data.`;
export const SAJDA_NO_TEXT = "Connect once to see the text.";
export const SAJDA_TEXT_FAILED = "Couldn’t load the text.";
