// The legacy-app files this project uses, relative to the legacy repo root. One list for scripts/sync-legacy.mjs (which copies them
// into ./legacy) and tests/legacySnapshot.test.ts (which checks that ./legacy holds exactly these). Add a file here only when the
// code imports or reads it; there is no "just in case" copy.

/** Files read from the legacy commit (git blobs, so line endings are the repo's, not a Windows checkout's). */
export const TRACKED_FILES = [
  // JSON data
  "app/assets/data/names.json", // Asma-ul-Husna (the 99 names); the library, tasbeeh and Asma pages import it
  "app/assets/data/reciters.json", // reciter list: Settings, surah audio
  "app/assets/data/surah.json", // 114 surahs: names, counts, audio; the generators (gen-*.mjs) read it too
  // data modules (people, stories, places, events, commands, Daily Fiqh)
  "app/data/quranCommands.ts",
  "app/data/quranEvents.ts",
  "app/data/quranPeoples.ts",
  "app/data/quranPersons.ts",
  "app/data/quranPlaces.ts",
  "app/data/quranSigns.ts", // Phase 12
  "app/data/quranThemes.ts", // Phase 12
  "app/data/quranDuas.ts", // Phase 12
  "app/data/quranStories.ts",
  "app/data/wajibat/categories.ts",
  "app/data/wajibat/marja.ts",
  "app/data/wajibat/topics.ts",
  "app/data/wajibat/types.ts", // type-only imports of the three above
  // pure utils
  "app/utils/commandsSearch.ts",
  // Phase 12: each knowledge module's search util and validator (the validators run in tests/knowledge.test.ts)
  "app/utils/commandsValidate.ts",
  "app/utils/duasSearch.ts",
  "app/utils/duasValidate.ts",
  "app/utils/eventsSearch.ts",
  "app/utils/eventsValidate.ts",
  "app/utils/placesSearch.ts",
  "app/utils/placesValidate.ts",
  "app/utils/signsSearch.ts",
  "app/utils/signsValidate.ts",
  "app/utils/themesSearch.ts",
  "app/utils/themesValidate.ts",
  "app/utils/graphIndex.ts", // Phase 12: the cross-module graph ("Connected", "Referenced by")
  "app/utils/peoplesSearch.ts",
  "app/utils/peoplesValidate.ts",
  "app/utils/islamicEvents.js",
  "app/utils/personStudy.ts",
  "app/utils/personsChronology.ts",
  "app/utils/personsSearch.ts",
  "app/utils/personsTimeline.ts",
  "app/utils/prayerFiqh.js",
  "app/utils/quranAyahCounts.js", // dynamic import of surah.json (tests/ayahOfDay.test.ts)
  "app/utils/quranReference.ts",
  "app/utils/ramadanContent.js",
  "app/utils/renderTafsirMarkdown.js",
  "app/utils/storiesSearch.ts",
  // composables that the parity tests and the Tasbeeh generator run or read as they are (see scripts/lib/legacy-*.mjs)
  "app/composables/useAudioPlayer.ts",
  "app/composables/useSearch.ts", // its edition list is compared with ours (tests/searchEditions.test.ts); read as text, never imported
  "app/composables/useSearchHistory.ts", // run by the history parity test (scripts/lib/legacy-search-history.mjs)
  "app/composables/useDownloads.ts", // run by the downloads-manifest parity test (scripts/lib/legacy-downloads.mjs)
  "app/composables/useTasbeeh.ts",
];

/**
 * The legacy service worker, for e2e/cutover.spec.ts. It is build output (the legacy `dist/` is git-ignored there), so it has no
 * commit: the script copies `sw.js` and the `workbox-*.js` runtime it imports from `<legacy>/dist`, and records their mtime.
 */
export const DIST_DIR = "dist";
export const DIST_SW = "sw.js";

/** Derived from the legacy `app/pages` folder: the list of routes it serves, for tests/bridge.test.ts (the nav must only link to them). */
export const ROUTES_FILE = "routes.json";
export const PAGES_DIR = "app/pages";

/** Names the script writes itself; everything else under ./legacy must be in the manifest. */
export const MANIFEST_FILE = "manifest.json";
export const README_FILE = "README.md";

/** Route paths of a legacy `pages` listing: `index.vue` is the folder's own route, `[id].vue` stays `[id]`. `files` are paths relative to the folder. */
export function routesOf(files) {
  const out = [];
  for (const f of files) {
    if (!f.endsWith(".vue")) continue;
    const parts = f.replace(/\.vue$/, "").split("/");
    if (parts.at(-1) === "index") parts.pop();
    out.push("/" + parts.join("/"));
  }
  return [...new Set(out)].sort();
}
