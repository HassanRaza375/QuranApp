# Page: Asma-ul-Husna

- Route (legacy, kept): `/asma-ul-husna`; `#name-<n>` opens a name.
- Phase: 9B
- Prototype section: `d-page-asma` / `m-page-asma`
- Offline level: A. The names are bundled (the legacy `names.json`).
- Indexable: yes (a public page).

## Purpose

See and search the 99 names, save the ones you want, and count a name in the Tasbeeh.

## Layout

- One `h1` "Asma-ul-Husna", "The 99 names, from this app’s data. Saved names stay on this device."
- A search box (`aria-label` "Search the names"; by name, meaning, Arabic, Urdu or number), a **Saved** toggle (`aria-pressed`) and a count ("99 names" / "3 of 99 names").
- A grid of 99 cards (1, 2 or 3 columns): the Arabic, the Urdu, the transliteration, the English meaning, "#N", a star (44px) and the whole card opens the name.
- The **name sheet** (a bottom sheet on a phone, a side panel on desktop): the Arabic large, the transliteration, "Name N of 99", the English, the Urdu, **Save**, **Count this name** (to `/tasbeeh/name-N`) and **Play** (a real button with `aria-disabled` and "Coming with the player"). The address holds it (`#name-12`); Escape closes it and clears the hash; focus returns to the card.
- Footer: "Lists of the 99 names differ slightly between sources. This is the list this app’s data uses."

## Data

`@legacy/assets/data/names.json`, imported, never copied: 99 entries `{ id, arabic, transliteration, english, urdu, audio }`, ids 1 to 99. Only apostrophe typography changes for display (curly everywhere); no name or meaning is changed. The data's own oddities (mixed apostrophes, "The Sustainer" and "The Originator" each used twice) are pinned by a test and listed in `CONTENT_TO_VERIFY.md` for review.

## Behaviour

- **Search:** transliteration and English match ignoring case, hyphens and apostrophes of either kind; Arabic and Urdu match with or without vowel marks; one or two digits find that number.
- **Save:** the legacy bookmark `name:<id>` (and its added-at time), with Undo. The Library already lists these (type "Names"); its row now opens the name (`/asma-ul-husna#name-N`).
- **Saved** shows only saved names; with none, "No names saved yet. Tap the star on a name."
- **Not carried over from the legacy page:** the YouTube embed (a third-party page), the near-white English text in light theme, and the search label "Search Surah".

## States

| State | What shows |
| --- | --- |
| All | 99 cards |
| Search with matches | The matching cards and "N of 99 names" |
| No match | "No names match “…”." |
| Saved, none saved | "No names saved yet. Tap the star on a name." |

## Data and storage

Reads: the bundled names, `quran:bookmarks:v1`. Writes: `quran:bookmarks:v1` and `quran:bookmarks:added-at:v1` (the `name:<id>` key). No network, no `quran-app-db`.

## Tests

`tests/asma.test.ts` (12) and `e2e/asma.spec.ts` (10); see `docs/phases/phase-09b-asma-sajda-tasbeeh.md`.
