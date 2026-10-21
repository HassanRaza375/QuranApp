# Phase 9B plan: Tasbeeh, Sajda verses, Asma-ul-Husna

Status: **plan only, waiting for approval.** Written 2026-10-21 after reading the legacy `app/pages/tasbeeh/index.vue`, `tasbeeh/[id].vue`, `composables/useTasbeeh.ts`, `pages/sajda.vue`, `composables/useSajda.ts`, `services/sajda.service.ts`, `server/api/sajda.js`, `pages/asma-ul-husna.vue`, `composables/useAsma.ts`, `assets/data/names.json`, the revamp's Library (`libraryItems.ts`, `stores/library.ts`), `nav.ts`, and the prototype (`d-page-tasbeeh`, `d-page-sajda`, `d-page-asma` and their scripts). The real Sajda response was fetched and its facts are below.

**Baseline:** `npm run verify` on Node 22 passed on the last commit (528 unit tests, 391 e2e tests, exit 0, run for 9A; only docs have changed since).

## 1. One phase or split

One phase is fine: three small pages, no shared code beyond the Library's existing key formats. The only coupling is the "Count this name" link (Asma into Tasbeeh) and the sajda sign (Sajda into the Per-page reader). I would build in this order inside the phase (Asma, Sajda, Tasbeeh) and commit each separately so a problem in one does not hold the others. If you would rather review them one at a time, split as 9B (Asma + Sajda, no new storage) and 9C (Tasbeeh, the only one that writes counts).

## 2. What each legacy page shows and omits

### Tasbeeh (`/tasbeeh`, `/tasbeeh/[id]`; key `quran:tasbeeh:v1`)

| Shows | Omits / bugs |
| --- | --- |
| A grid of six counters: SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah, and "Custom Dhikr" ("Count anything, your own way"), each with its Arabic, transliteration, meaning, and `count / target` | The preset text lives inside a composable (`useTasbeeh.ts`), not a data file |
| A counter: a big ring and a Count button, goal chips 33 / 99 / 100, "Cycles Completed", "Lifetime Count", "Reset current count" | A confirm dialog for Reset (the revamp's rule is Undo over confirm) |
| Storage `quran:tasbeeh:v1` = `{ [id]: { count, target, cycles, lifetime } }`; default target 33; reaching the target adds a cycle and returns the count to 0 | Choosing a goal sets the count back to 0 without saying so (a surprise mid-count) |
| Vibration on every tap (15 ms) and a pattern on completing a cycle, whenever the device supports it | No way to turn the vibration off |
| An unknown id (`/tasbeeh/anything`) opens a counter named by the id | The page creates empty entries while rendering (`getEntry` writes during render); entries are written to storage only after a tap or reset |
| | No named custom dhikr, no custom goal number, no keyboard hint, the ring has no accessible count |

**Legacy data for After prayer: none.** The legacy app has no "after prayer" sequence, no Tasbih of Fatima, and no Sunni or Ja'fari order. The prototype's "After prayer" mode (Sunni order 33/33/34, Ja'fari 34/33/33 then La ilaha illallah, and their notes) was typed by us. **It does not ship.**

### Sajda (`/sajda`; server route `/api/sajda` and `SajdaService`)

The page fetches `https://api.alquran.cloud/v1/sajda/quran-uthmani` (through its server route or straight from the browser) and shows, for each ayah: a chip, a bookmark toggle (`sajda:<surah>:<ayah>`), the Arabic text, the surah name and English name, and "Juz N · Page N". The heading is "Ayāt as-Sajdah (N)" from the response length.

**What the real response contains** (fetched today; 15 ayahs, each with `number, text, surah, numberInSurah, juz, manzil, page, ruku, hizbQuarter, sajda {id, recommended, obligatory}`):

| Ayahs (surah:ayah) | Service flag |
| --- | --- |
| 7:206, 13:15, 16:50, 17:109, 19:58, 22:18, 22:77, 25:60, 27:26, 38:24, 84:21 | `recommended: true, obligatory: false` (11) |
| 32:15, 41:38, 53:62, 96:19 | `recommended: false, obligatory: true` (4) |

Findings you should know about:

- **The legacy chips ("Obligatory Sajda" in red, "Recommended Sajda" in blue) are a ruling shown to everyone.** They come straight from the service's flags, and the four flagged "obligatory" are exactly the set the Ja'fari school treats as obligatory. The same four are not obligatory in the Sunni schools (strongly recommended; Hanafi: wajib for its own 14). The legacy page presents one tradition's classification as universal. This is exactly the kind of statement that needs a source you review, so I plan to **not carry the chips over** (decision 3).
- The service's list is one common list of 15 (it includes both 22:18 and 22:77, and 38:24). Schools differ on the exact set (for example the second sajda of Al-Hajj, and 38:24). The heading "(15)" is therefore "as listed by the data source", not a statement of which verses are obligatory in any school. The prototype's "Hanafi count is 14" note was typed by us and stays out.
- The Arabic comes from the `quran-uthmani` edition of this service, a different edition from the surah reader's `quranapi` text. Showing it would put two editions of the same ayah side by side in one app.
- The legacy page has no link into the reader, no saved/pin state shown on first paint, and no offline behaviour of its own.

### Asma-ul-Husna (`/asma-ul-husna`; `assets/data/names.json`)

`names.json` has 99 entries `{ id, arabic, transliteration, english, urdu, audio }`, ids 1 to 99 in order, no duplicate Arabic or transliteration. The page shows a search box (labelled "Search Surah", a legacy mistake), a **YouTube embed** (`youtube.com/embed/ta_tTZrarE0`), and a card per name: star toggle (`name:<id>`), the Arabic, the Urdu, the transliteration, the English, "#id", and a play button that plays the name's recording (`quranaudio.myislam.org/.../<n>. <name>.mp3`) through the shared player. The English line is styled `#e9e9e9`, which is nearly invisible in a light theme (a legacy bug).

What I checked in the data:

- 4 transliterations carry a typographic apostrophe (U+2019: Al-Mu’min, Al-Mu’izz, Al-Mu’akhkhir, Ar-Ra’oof) while others use a straight one (Al-Ba'ith, Al-Mu'eed, Al-Muta'ali); the spelling is inconsistent in the data itself.
- Two English meanings repeat: "The Sustainer" (39 Al-Muqeet, 63 Al-Qayyum) and "The Originator" (58 Al-Mubdi, 95 Al-Badee). "The Just" (29) and "The Just One" (86) are near-duplicates.
- The list is one of several variants of the 99 (Allah is not counted; "Malik-ul-Mulk" and "Dhul-Jalali wal-Ikram" are entries 84 and 85). Lists differ between sources; this one is the legacy app's.
- The Urdu text and the audio are legacy data I cannot verify. The audio is hosted on a third-party site.

## 3. Content integrity: what ships and what does not

| Prototype item (typed by us) | Decision |
| --- | --- |
| Tasbeeh dhikr texts (Arabic, transliteration, meaning) | Not used. The five legacy presets are used. |
| After prayer: Sunni and Ja'fari orders, titles ("Tasbih of Fatima al-Zahra (a)"), notes, the "other narrations" sentence | Not shipped (no legacy data, no reviewed source). A reviewed-file shape like Events' could be added later; not now. |
| The Sajda list, the references, the Arabic | Not used. The service's list is used. |
| "4 obligatory verses" / "15 verses in the common list, Hanafi 14", the "how" paragraphs per fiqh, the Hanafi chip, "Follow your own marja' or local scholar" | Not shipped (rulings; no reviewed source). |
| The 99 names, their transliteration and meanings | Not used. The legacy `names.json` is used. |
| "Lists of the 99 names differ slightly between sources..." footer | Kept in plain wording of ours, flagged. |

## 4. How the data gets into the app (no typed Arabic)

- **Names:** import the legacy file directly (`@legacy/assets/data/names.json`, the same bridge earlier phases use). Loaded only on the Asma page (and by the Library's name resolver, which already reads names). Nothing is copied or typed.
- **Tasbeeh presets:** they sit inside a Nuxt composable, which cannot be imported cleanly, so a small generator script (`scripts/generate-tasbeeh-presets.mjs`) transpiles the legacy file, reads `tasbeehPresets` and writes `app/data/tasbeehPresets.generated.ts` (the generated-data folder is the one place Arabic is allowed, like `quranMeta.generated.ts`). A unit test regenerates it in memory and compares. The legacy file is not edited.
- **Sajda list:** `app/data/sajda.generated.ts` generated from the recorded service response: 15 `[surah, ayah]` pairs and nothing else (no flags, no text), with `tests/fixtures/alquran-sajda.json` (the recorded real response) and a test that the generated pairs equal the response. It is bundled, so the Sajda list, the Library, and the sajda sign on the Per-page reader work offline with no request. (Alternative: fetch live and cache; I recommend bundling because the list is fixed and this makes the sign trivial and offline.)
- **Sajda text and context:** the Arabic comes from the surah reader's cached text (or the per-ayah snippet cache the Library already uses), so there is one edition across the app. Juz and page are derived from the page and juz starts (`pageOfAyah`, `juzOfAyah`), not read from the service's flags.

## 5. Tasbeeh

- **Routes:** `/tasbeeh` (the six counters) and `/tasbeeh/[id]` (the counter), both kept. Unknown ids keep the legacy behaviour (a counter named by the id).
- **Storage:** `quran:tasbeeh:v1` in exactly the legacy shape, other entries and unknown fields kept. A counter's entry is created on its first tap or target change (not during render). Lifetime and cycles keep their legacy meaning.
- **Counter:** one large button (the ring is decoration) at least 44px; Space and Enter count (key repeat ignored so holding a key does not run the count up); a polite live announcement only at milestones (target reached, count reset), not every tap; `aria` text "Count: 12 of 33". Cycles and Lifetime stay. Goal chips 33 / 99 / 100 as legacy.
- **Reset:** "Reset count" with a toast and **Undo** (restores the count). Cycles and lifetime are untouched, as in the legacy dialog. A goal change zeroes the count as in the legacy page and **also gets an Undo toast**, so the surprise is reversible.
- **Vibration:** feature-detected (`navigator.vibrate`), kept as in the legacy page, plus an **on/off switch on the counter** (new key `quran:tasbeeh-prefs:v1` = `{ vibrate: boolean }`; absent means on, as legacy). Not shown at all where the browser cannot vibrate (iPhone).
- **Dropped from the prototype:** the "After prayer" mode and the infinite goal (not in the legacy data); a custom dhikr name (decision 6).
- **Home/Settings:** nothing changes.

## 6. Sajda

- **Page:** `/sajda` lists the 15 ayahs in Qur'an order: number, surah name (data), "ayah N", juz and page (derived), the Arabic (reader cache), a Save star (`sajda:<surah>:<ayah>`, Undo) and a link **Open in the reader** (`/surah/N#ayah-M`). The heading is "Verses of prostration" with "15 verses, as listed by this app's data" (wording of ours).
- **No Obligatory/Recommended chips and no per-tradition text** (decision 3). A reviewed file in the Events pattern could add them later.
- **The sajda sign on the Per-page reader:** with the bundled list, the page shows a small sign after the 15 ayahs (a visible marker the legacy page also showed). The legacy page printed the prostration character (U+06E9) after these ayahs; the revamp's no-typed-Arabic guard forbids that character in code, so the sign is a small SVG mark instead (the same idea, no typed text). It says "Prostration verse" to assistive technology and carries no ruling. Recorded as a follow-up in `PROGRESS.md` and built in 9B.
- **Offline:** list and references A (bundled); the Arabic B (the reader cache, then the per-ayah cache; an unsaved ayah offline shows the reference with "Connect once to see the text.").

## 7. Asma-ul-Husna

- **Page:** a search (English, transliteration, Arabic, Urdu, and the number, as the legacy composable searched; the label fixed to "Search the names"), a **Saved** filter (`name:<id>`, the keys the Library lists), a grid of 99 names (Arabic, transliteration, English; the Urdu line as legacy), the star with Undo, and a **name sheet** (bottom sheet on a phone, centred on desktop) with the Arabic large, "Name N of 99", the English, the Urdu, Save, and **Count this name**.
- **Count this name:** legacy `/tasbeeh/[id]` already counts any id, so the link is `/tasbeeh/name-<n>`: the counter shows the name's own Arabic, transliteration and meaning (from `names.json`) with the same 33/99/100 goals, and its count is stored under `name-<n>` in the same `quran:tasbeeh:v1` record. The legacy app tolerates that entry (it would show a counter named "name-12"), so a rollback does not break. (Decision 5.)
- **Audio and video:** the per-name **Play** button is a visible, real button with `aria-disabled` and "Coming with the player" until Phase 4B (the audio is third-party hosted and goes through the player). The **YouTube embed is not carried over** (a third-party embed loads another site's scripts and tracking; the revamp has no external embeds). A plain link "Listen on YouTube" is possible if you want it (decision 7).
- **Library:** `OPENS_TODAY.name` becomes true and "Asma-ul-Husna" leaves the Library's pending notice; the Library row opens `/asma-ul-husna` (and can open the sheet with `#name-<n>`, which the new page honours).
- **Offline:** A (bundled).
- **Legacy bug not carried:** the invisible light-mode English text and the "Search Surah" label.

## 8. States, tests and screenshots

- **States:** Tasbeeh (zero, mid-count, cycle complete, no vibration support, reset Undo), Sajda (all 15, text loading, text offline and unsaved, Saved), Asma (all, search with results and with none, Saved empty "No names saved yet. Tap the star on a name.", the sheet).
- **Unit:** the generated tables equal the sources (names count and order, sajda pairs against the recorded response, presets against the legacy file); the 15 ayahs are real ayahs; every one resolves to a page and juz and a Per-page range that contains it; the `quran:tasbeeh:v1` increment, cycle, target and reset rules (legacy-compatible, unknown fields kept); the `name-<n>` id round-trip; search rules.
- **Browser (production build):** each page's list, save/unsave with Undo, keys written in the legacy format, Count this name opens a counter showing the name and counting, tap and keyboard counting, the milestone live region, vibration switch (stubbed `navigator.vibrate`), reset Undo, the Per-page sign on the sajda pages (and not elsewhere), no external request (no YouTube), `quran-app-db` never opened, dark mode, 375px and 44px targets, offline for each.
- **Screenshots at 1280 and 375, light and dark:** prototype pair for each page (with the prototype's typed content visible, and the "not used" items listed in the compare README), and revamp states: counter at zero, mid-count and cycle-complete, After-prayer absence, Sajda list and text-offline, Asma grid, search none, Saved empty, the name sheet, and the per-page sajda sign.

## 9. Content to verify (added to CONTENT_TO_VERIFY.md at the end of 9B)

Wording of ours: the Sajda heading and "as listed by this app's data", the Asma footer, "Count this name", the vibration switch, the milestone announcements, "Coming with the player", the Reset and goal toasts. Legacy data that needs your review: the 99 names (spelling, apostrophes, the repeated "Sustainer"/"Originator", which variant of the list), their Urdu, the audio; the five dhikr presets; the service's list of 15 sajda ayahs. Deliberate gaps: After prayer (both traditions), any obligatory/recommended statement, the Hanafi count and note, the YouTube video.

## 10. Decisions I need

1. One phase (my order: Asma, Sajda, Tasbeeh, separate commits), or split into 9B and 9C.
2. Sajda list bundled from the recorded service response (recommended) or fetched live.
3. Sajda shows **no Obligatory/Recommended chips and no per-tradition text** (recommended), or you supply a reviewed source for them.
4. After prayer (the Tasbih of Fatima and the Sunni order) left out entirely until you supply a reviewed source.
5. "Count this name" counts under `name-<n>` in `quran:tasbeeh:v1` (recommended), or keeps name counts in a new key.
6. Tasbeeh: keep the legacy goals 33 / 99 / 100 and the legacy custom counter without a name (recommended), or add a custom goal number and a custom name (new fields in the same entry).
7. Asma: the YouTube embed is dropped (recommended), or replaced by a plain external link.
8. The vibration switch on the counter, default on where supported (recommended), or no switch.
9. The sajda sign on the Per-page reader is built in 9B (recommended).
