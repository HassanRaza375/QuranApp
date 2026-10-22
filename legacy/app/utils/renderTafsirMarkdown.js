// Minimal, dependency-free markdown-lite renderer for tafsir text returned
// by the API. Escapes the raw text FIRST, then only ever inserts our own
// fixed set of tags via regex — so no markup from the (third-party) source
// content can ever reach the DOM unescaped.
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function renderTafsirMarkdown(markdown) {
  if (!markdown) return "";

  return escapeHtml(markdown)
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = Math.min(heading[1].length + 3, 6); // h4-h6 inside a card
        return `<h${level} class="tafsir-heading">${inline(heading[2])}</h${level}>`;
      }

      return `<p>${inline(trimmed).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}
