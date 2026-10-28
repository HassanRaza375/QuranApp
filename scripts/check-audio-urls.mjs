// One-off check (not in CI): sends a HEAD request to every surah and reciter audio URL in the legacy data
// (114 surahs x 5 reciters = 570) and reports anything that is not a 200 audio file.
//
//   node scripts/check-audio-urls.mjs            (writes docs/audio-url-check.md)
//
// A HEAD request follows redirects (the files are served by a redirect to raw.githubusercontent.com). A 429 or a 5xx is retried
// a few times with a pause before it is counted as a failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const surahs = JSON.parse(fs.readFileSync(path.resolve(here, "../legacy/app/assets/data/surah.json"), "utf8"));
const reciters = JSON.parse(fs.readFileSync(path.resolve(here, "../legacy/app/assets/data/reciters.json"), "utf8"));
const names = new Map(reciters.map((r) => [r.id, r.reciter]));

const jobs = [];
for (const s of surahs) for (const [id, e] of Object.entries(s.audio)) jobs.push({ surah: s.surahNo, reciter: e.reciter ?? names.get(id), url: e.url });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function check(job) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(job.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30000) });
      if ((res.status === 429 || res.status >= 500) && attempt < 4) {
        await sleep(1500 * attempt);
        continue;
      }
      const type = res.headers.get("content-type") ?? "";
      const bytes = Number(res.headers.get("content-length") ?? 0);
      const ok = res.status === 200 && bytes > 10_000;
      return { ...job, status: res.status, type, bytes, ok, audioType: /^audio\//.test(type) };
    } catch (e) {
      if (attempt === 4) return { ...job, status: 0, type: "", bytes: 0, ok: false, error: String(e.message ?? e) };
      await sleep(1500 * attempt);
    }
  }
}

const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      results.push(await check(job));
    }
  }),
);
results.sort((a, b) => a.surah - b.surah || String(a.reciter).localeCompare(String(b.reciter)));
const failed = results.filter((r) => !r.ok);
const octet = results.filter((r) => r.ok && !r.audioType);
const small = results.filter((r) => r.ok).sort((a, b) => a.bytes - b.bytes)[0];

const date = new Date().toISOString().slice(0, 10);
const lines = [
  "# Audio URL check",
  "",
  `Run on ${date} by \`node scripts/check-audio-urls.mjs\` (a one-off, not part of CI). A HEAD request, redirects followed, to every audio URL in the legacy \`surah.json\`: ${jobs.length} (${surahs.length} surahs x ${new Set(jobs.map((j) => j.reciter)).size} reciters). A URL is **reachable** when the final answer is 200 and the size is over 10 KB; it is also **served as audio** when the content type is \`audio/*\`. GitHub serves its larger files as \`application/octet-stream\` with \`X-Content-Type-Options: nosniff\`.`,
  "",
  `**Result: ${results.length - failed.length} of ${results.length} reachable, ${failed.length} unreachable. ${octet.length} of the reachable ones are served as a generic type, not \`audio/*\`** (the largest: ${Math.max(0, ...octet.map((r) => r.bytes))} bytes). Smallest file: surah ${small?.surah}, ${small?.reciter}, ${small?.bytes} bytes. This shows the files exist on that day; it does not play them.`,
  "",
];
if (octet.length) {
  const bySurah = [...new Set(octet.map((r) => r.surah))];
  lines.push("## Served as a generic type", "", `${octet.length} files (${bySurah.length} surahs: ${bySurah.join(", ")}) answer 200 with \`${[...new Set(octet.map((r) => r.type))].join(", ")}\`.`, "");
}
if (failed.length) {
  lines.push("## Failures", "", "| Surah | Reciter | Status | Type | Note | URL |", "| --- | --- | --- | --- | --- | --- |");
  for (const f of failed) lines.push(`| ${f.surah} | ${f.reciter} | ${f.status} | ${f.type || "-"} | ${f.error ?? (f.bytes <= 10_000 ? `${f.bytes} bytes` : "")} | ${f.url} |`);
  lines.push("");
}
lines.push(
  "## Does a browser accept the generic type? (checked by hand, 2026-10-16)",
  "",
  "An `Audio` element in desktop Chromium (Playwright) loaded the metadata of three files: surah 1 by reciter 1 (`audio/mpeg`, 52 s), surah 3 by reciter 1 (`application/octet-stream`, 74 MB, 77 min) and surah 3 by reciter 2 (`application/octet-stream`, 91 MB, 70 min). So desktop Chromium plays the generic-type files. **Safari and iOS, Firefox and Chrome on Android were not tried:** that is a real-device check before the full player is built on these files. Files of this size also make \"download for offline\" (Phase 11) large (up to about 91 MB per surah).",
  "",
);
// kept by hand (a HEAD that follows redirects cannot show where a redirect went): see docs/phases/phase-11-downloads-plan.md
lines.push("## Addendum, 2026-10-22: where the redirect goes, and what a naive rewrite gets\n\nEvery full-surah URL in the data is `github.com/The-Quran-Project/Quran-Audio-Chapters/raw/…`. GitHub answers with a **302 to one of two hosts**: `raw.githubusercontent.com` for most files, and `media.githubusercontent.com` for the files stored in Git LFS (they are over 100 MB: **surah 2 for reciters 1, 2, 4 and 5**; reciter 3's Al-Baqarah is a plain 90,656,305-byte file). Both final hosts send `Access-Control-Allow-Origin: *`, `Accept-Ranges: bytes` and answer a Range request with `206`. A media element follows the redirect and plays them: checked in Chromium on 2026-10-22, surah 2 by reciter 1 loads and lasts 125.7 minutes.\n\nTwo things follow for any code that downloads these files. (1) The **302 itself has an empty `Access-Control-Allow-Origin`**, so a `fetch` of the data URL in CORS mode fails (the legacy app used opaque `no-cors` requests, which cannot be read or checked). (2) Rewriting the host to `raw.githubusercontent.com` is **wrong for the four LFS files**: it returns a 134-byte `text/plain` Git LFS pointer (`version https://git-lfs.github.com/spec/v1`, `oid sha256:…`, `size 120643350`), not audio. A download has to follow GitHub's own redirect, or detect the pointer and use the `media.githubusercontent.com/media/<owner>/<repo>/<ref>/<path>` address it stands for.\n\nSizes of all 570 files (HEAD requests to the final host; the four LFS files measured on the media host): **Al-Baqarah 120,643,350 / 113,362,919 / 115,967,052 / 114,249,560 bytes** for reciters 1, 2, 4, 5; smallest real file 183,812 bytes; per reciter, whole Qur'an: 1.72, 1.50, 1.18, 1.49 and 1.48 GB (7.38 GB for all five; decimal units, as the app shows them). These feed `docs/phases/phase-11-downloads-plan.md`.\n");
fs.writeFileSync(path.resolve(here, "../docs/audio-url-check.md"), lines.join("\n"));
console.log(lines.slice(0, 6).join("\n"));
process.exit(failed.length ? 1 : 0);
