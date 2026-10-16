# Page: Surah reader

- Route(s): `/surah/[id]` (1 to 114), optionally `#ayah-<n>`. Other numbers show "That surah doesn’t exist".
- Phase: 4A (the full player is 4B)
- Prototype section: `d-page-reader` / `m-page-reader`
- Offline level: B. A surah and an ayah's tafsir work offline once they have been opened; nothing is bundled.
- Indexable: no (the title and description are set per surah in the page, but the route is not prerendered).

## Purpose

Read a surah: the Arabic with a translation, the tafsir of any ayah, and the tools to save, pin and share an ayah, with your place remembered.

## Layout

- One `h1`: the surah's Arabic name. Below it "Surah n · N ayahs · Mecca (or Madina)".
- A bar: **Play surah**, **Translation** (Off, English, Urdu, Bengali, Arabic (Alt)), **Tafsir** (the default source: Ibn Kathir, Maarif Ul Quran, Tazkirul Quran; the menu says "No Ja’fari tafsir is available from this app’s data provider."), **Reciter**. Menus are popovers on desktop and bottom sheets on mobile. Then **Mark as read**.
- The bismillah (surahs 2 to 114 except 9), then the ayahs, then Previous and next surah.
- **An ayah:** the Arabic with a gold verse marker, the translation (unless Off), and a tools row: **Tafsir** on the left; **Save**, **Pin**, **Share** on the right. Verse layout in Settings decides whether the translation comes first.
- **Tafsir panel** (under the ayah): the three sources as buttons (the chosen one is pressed), the group note when the source gives one, the text, the source name, and the Ja'fari line.
- The mini player (global) appears once something has been played.

## States

| State | What shows |
| --- | --- |
| Loading | A skeleton of three ayahs (no layout shift when the text arrives) |
| Loaded | The surah |
| Failed, online | "Couldn’t load this surah. Check your connection and try again." and Retry |
| Not opened before, offline | "This surah isn’t saved on this device yet. Connect once to read it." and Retry |
| Surah not 1 to 114 | "That surah doesn’t exist" and a link to the listing |
| Bad `#ayah-n` | Ignored (the surah opens at the top) |
| Opened at an ayah | Scrolled into place, focused, highlighted for a moment |
| Bismillah, surah 1 not loaded and offline | The line is left out |
| Tafsir loading, error, offline | "Loading the tafsir…"; "Couldn’t load the tafsir. Check your connection and try again." with Retry; "Tafsir for this ayah isn’t saved on this device. Connect to load it." with Retry |
| Saved, pinned | The star or pin is filled (accent colour, never gold) and `aria-pressed` |
| Playing / cannot play | The Play button reads Pause surah; a failed file shows "Couldn’t play. Audio needs a connection unless it was downloaded." |
| Completed | Mark as read reads "Marked as read" |

## Data and storage

- Reads: `quranapi.pages.dev` (a surah and, on demand, an ayah's tafsir), cached in `quran-revamp-db` (`chapters`, `tafsirs`); `translationDefaultLang`, `preferredVerseDisplay` (read only), `tafsirDefaultAuthor`, `reciter`, `quran:audio-prefs:v1` (speed), `quran:verse-layout:v1`, the Arabic size, `quran:bookmarks:v1`, `quran:pins:v1`, `quran:read-surahs:v1`, `quran:reader-prefs:v1`.
- Writes: `quran:reading-progress:v1` (the legacy record, only after you scroll on), `quran:reading-goals:v1` (the daily log only), `quran:bookmarks:v1` and `added-at`, `quran:pins:v1` (new), `quran:read-surahs:v1` (new), `quran:reader-prefs:v1` (new), `translationDefaultLang` and `tafsirDefaultAuthor` (when you choose, as legacy), `reciter` (when you choose).
- Never opens `quran-app-db`.

## What counts as read

- **Your place:** the last ayah above 35% of the screen, after you stop scrolling for 0.4 s. Opening a surah does not change it until you scroll on.
- **Today's count (goals):** each ayah that stays on screen about 1.5 s.
- **Completed:** the end of the surah reached with 90% of its ayahs counted in this visit; or Mark as read.

## Accessibility

- Each ayah is an `article` labelled "Ayah n" (`tabindex="-1"` so a link can focus it). Tools are real buttons with names ("Save ayah 255", "Show tafsir for ayah 255" with `aria-expanded`, "Pin ayah 255 as where you stopped") and work with Enter and Space. Tab order inside an ayah: Tafsir, Save, Pin, Share.
- Arabic is `lang="ar" dir="rtl"`; translations carry their own language and direction; the tafsir status and errors are polite live regions.
- 44px targets on mobile; the Arabic size, High contrast and Larger touch targets settings apply.

## Not on this page (yet)

Per-ayah audio and its download (4B), seeking, resume, repeat and auto-next (4B), the image share card (its own phase), the Library view of pins (Phase 6), the juz and page readers.
