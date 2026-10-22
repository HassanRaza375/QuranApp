# Page: Per page (the per-page reader)

- Route (legacy, kept): `/per-page-read?page=N`
- Phase: 9A
- Prototype section: `d-page-mushaf` / `m-page-mushaf`
- Offline level: B. A page's text is available offline when every surah it touches was opened once (surah reader or this page).
- Indexable: no (`robots: noindex`, as the legacy page).

## Purpose

Read the Qur'an one page at a time, in the order and page breaks of the standard 604-page Madani mushaf, and keep a place or a saved page.

## Layout

- One `h1` "Page 49" (focus target after Previous, Next and Go), a line "Page 49 of 604 · Juz 3 · Al-Baqara" (the data's names; a page with two surahs names both, "Al-Baqara, Aal-i-Imraan"), and a "‹ Pages" link back to the listing's Page tab.
- Tools: **A−** / **A+** (the global Arabic size, in 0.1 steps between 0.8 and 1.6, disabled at the ends), **Pin page**, **Save**, **Play page / Pause page** (Phase 4C): plays this page's ayahs in order as one queue (a page that crosses into the next surah plays on into it), stops after the last ayah and does not carry on to the next page; the ayah being recited is highlighted in the frame (`aria-current`); the queue keeps playing if you move to another page, and that page's button says Play page (pressing it replaces the queue). The queue's place is saved in its own key `quran:audio-queue:v1` (see `docs/pages/player.md`). It plays the ayahs' files only: the surah-start Bismillah is **not** played as a separate file (the data has per-ayah files only; whether a reciter's first-ayah file includes it is a device check).
- The frame: a head (the juz line, the surah names, the page number), then one section per surah run. Where a surah **starts** on the page there is a banner (its long Arabic name from the data) and, for surahs 2 to 114 except 9, the Bismillah read from surah 1's data. Ayahs flow as justified RTL Arabic with the reader's gold ayah markers (the number, with a screen-reader "ayah"). No letter spacing; the Arabic follows the Arabic size setting.
- Below the frame: "Text flows in the order and page breaks of the standard 604-page Madani mushaf. It is not a line-for-line copy of the printed page.", and "Open Al-Baqara 2:6 in the reader" (the first ayah on the page).
- Navigation: Previous, a slider (1 to 604, `aria-valuetext` "Page 49 of 604", commits on release or key press), Next, and **Go to page** (numeric box and Go; Arabic-Indic digits accepted).

## Data

| Shown | Source |
| --- | --- |
| Which ayahs are on a page | The generated page starts (`app/data/quranMeta.generated.ts`, from `/v1/meta`): a page runs from its start to just before the next page's start. Checked for all 604 pages against the service's own page answers. |
| The Arabic | The surah reader's text (`quranapi.pages.dev`, `arabic1`), cache first in `quran-revamp-db` `chapters` |
| The Bismillah | Surah 1, ayah 1 of that same data. Left out if surah 1 was never loaded and there is no connection (as in the surah reader). |
| Juz and surah names | The bundled juz starts and surah list |
| Not shown | Hizb, a sajda sign, mushaf lines, translation |

## Behaviour

- **Address:** `?page=N` opens page N. Missing opens page 1 quietly. A number outside 1 to 604 opens page 1 with "Page 700 doesn’t exist. Showing page 1."; anything else with "That page doesn’t exist. Showing page 1.". Moving between pages uses `replace` (Back leaves the reader), and the notice belongs to the address that caused it.
- **Focus and announcement:** after Previous, Next or Go the title takes focus and a polite live region says "Page 13 of 604". The slider keeps focus (so it can be adjusted again). No arrow-key or other single-key shortcuts.
- **Reading progress:** opening a page writes nothing. `quran:reading-progress:v1` is untouched (a test compares it byte for byte after opening, pinning, saving and moving), so the listing's Last read marker and Home's Continue reading are unaffected.
- **Pin page:** sets the Page slot of `quran:pins:v1` (`{ pageNo, pinnedAt }`; the reading pin and unknown fields kept); one page pin, a new pin replaces it; Undo restores the earlier one; pressing Pinned unpins with Undo. The Library's Page slot shows it and opens this page.
- **Save:** the legacy bookmark `page:N` (and its added-at time), with Undo; the Library and Bookmarks list it and open this page.
- **Text size:** writes the same value as Settings (`quran:accessibility:v1` `arabicFontScale`, other fields kept); the Settings slider and this control stay in step.
- **Next page ready:** when online, the surahs of the next page are loaded quietly so Next does not stall where a page crosses into another surah. No bulk download.

## States

| State | What shows |
| --- | --- |
| Loading | A skeleton in the frame's place (the controls stay) |
| Not saved and offline | "This page’s text isn’t saved on this device yet. Connect once to read it." with Try again; the navigation still works |
| Failed with a connection | "Couldn’t load this page. Check your connection and try again." with Try again |
| Invalid address | Page 1 with the notice above |
| Invalid Go to | "Enter a page from 1 to 604." under the box; no navigation |

## Data and storage

Reads: the `chapters` store of `quran-revamp-db`, `quran:pins:v1`, `quran:bookmarks:v1` (+ added-at), `quran:accessibility:v1`. Writes: `quran:pins:v1` (the `page` field only), `quran:bookmarks:v1` and `quran:bookmarks:added-at:v1` (the `page:N` key), `quran:accessibility:v1` (`arabicFontScale`), and the `chapters` cache. `quran-app-db` is never opened.

## Tests

`tests/pageReader.test.ts` (15) and `e2e/perpage.spec.ts` (30, synthetic text: "TEST ARABIC 2:6"); see `docs/phases/phase-09a-per-page.md`.
