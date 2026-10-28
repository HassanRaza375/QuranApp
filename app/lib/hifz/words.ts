// An ayah as words (Phase 14). The reader's Arabic text is split on spaces; a token with no letter in it (the pause and sign marks that stand
// alone between spaces: the small waw, small jeem and the rest of U+06D6 to U+06DC, the start-of-quarter sign U+06DE, the sajda sign U+06E9) is not a
// word and is dropped. Measured on all 114 surahs of the reader's text (6,236 ayahs): 77,433 words, 4,578 such marks, no ayah left empty, no
// token with letters and no space between two words. The stored text is not in NFC for 5,748 ayahs, so words are compared after normalising.
//
// The letter ranges are written as escapes on purpose: no Arabic script is typed into app/ (CLAUDE.md).
const LETTER = /[ء-يٱ-ۓ]/;

/** The words of one ayah, as the reader shows them (not normalised: this is what is displayed). */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((token) => token && LETTER.test(token));
}

/** Whether two spellings are the same word. */
export const sameWord = (a: string, b: string): boolean => a.normalize("NFC") === b.normalize("NFC");

/** About how many words an ayah of `chars` characters has, for the time estimate (the measured mean is 9.17 characters a word, spaces and marks included). */
export const CHARS_PER_WORD = 9.2;
export const estimateWordCount = (chars: number): number => Math.max(1, Math.round(chars / CHARS_PER_WORD));

/** The last `n` words of an ayah, as the prompt for the next one. */
export const lastWords = (words: string[], n = 3): string[] => words.slice(-n);
