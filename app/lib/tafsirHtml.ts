// The tafsir text is markdown-lite from a third party. The legacy renderer escapes the text FIRST and then inserts only its own
// fixed tags, so nothing from the source can become markup; it is reused as it is, and tested (tests/reader.test.ts).
import { renderTafsirMarkdown } from "@legacy/utils/renderTafsirMarkdown";

export const tafsirHtml = (markdown: string): string => renderTafsirMarkdown(markdown) as string;
