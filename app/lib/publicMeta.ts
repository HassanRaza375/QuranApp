// Per-page <head> tags for the few prerendered public pages (link previews). Only the head is prerendered; the page body is client-rendered. Pure, unit-tested.
// Keep the title/description here in step with each page's own useSeoMeta.
export interface PublicMeta { title: string; description: string }

export const PUBLIC_META: Record<string, PublicMeta> = {
  "/": { title: "Quran App", description: "A local-first Quran companion: reading, translations, tafsir, audio, prayer times and more." },
  "/about": { title: "About · Quran App", description: "About the Quran App: where its text, audio and prayer times come from, and what stays on your device." },
  "/surah-listing": { title: "Surahs · Quran App", description: "All 114 surahs of the Quran." },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function injectPublicMeta(route: string, html: string): string {
  const meta = PUBLIC_META[route.replace(/\/$/, "") || "/"];
  if (!meta) return html;
  const tags =
    `<meta name="description" content="${esc(meta.description)}">` +
    `<meta property="og:title" content="${esc(meta.title)}">` +
    `<meta property="og:description" content="${esc(meta.description)}">` +
    `<meta property="og:type" content="website">`;
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`).replace("</head>", `${tags}</head>`);
}
