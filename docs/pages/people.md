# Page: Prophets & People (directory and Timeline)

- Routes (legacy, kept): `/persons` (Browse people) and `/persons/timeline`. Two links as tabs, one URL each.
- Phase: 7A
- Prototype section: `d-page-people` / `m-page-people`
- Offline level: A. Everything is bundled data; the page makes no network request.
- Indexable: no.

## Purpose

Find a person, prophet or group mentioned in the Qur'an among the 59 entries, or see the prophets in order.

## Layout

- One `h1`: **Prophets & People of the Qur’an**, a sentence, and the tabs **Browse people** and **Timeline** (`aria-current`).
- **Browse people:** a count line ("59 people", "3 of 59 people", a live region); search (names in English and Arabic, alternate names, the short description, theme names; case, accents and Arabic marks ignored; **not** passage text and not an ayah reference); **Category** (All, Prophets, Women, Men, Rulers & Leaders, Companions, Families & Relatives, Other Persons; an entry matches by its primary or secondary category); **Saved**; **Reset** when anything is set; the rows.
- **A row:** the Arabic name (text only, from the data), the name with its honorific ("Ibrahim (AS)"), the category, a "Group" chip for groups, "In N stories" when the person is in a story, the short description (two lines), "N direct mentions · N related passages", the chronology chip, and a star (Save). The star writes `person:<id>`, the same key the legacy app and the Library use, with an Undo toast on removal.
- **Timeline:** the legacy `buildTimeline`: prophets that have a chronology order, in order, each with a dot, the name, the Arabic name and the chronology chip; a **N related people** button (`aria-expanded`) opens the people they are related to who are not on the line, each as a sentence with its source; and a final group "Other people and groups of the Qur’an" so nobody is hidden. A legend explains the marks: solid for an established chronology, **dashed** for traditional, uncertain or unknown (never colour alone).

## Chronology wording

The chip text is the legacy `chronologyText`: an established (`strong`) label stands alone; every other status is qualified in words ("... — Traditional chronology", "Chronology uncertain", "Chronology unknown"). Nothing is dated here beyond what the data says.

## States

| State | What shows |
| --- | --- |
| Normal | The rows |
| Nothing matches | "No people match “xylophone”." (adds "in this category" when a category is set) and **Reset search and filters** |
| Saved with nothing saved | "Nothing saved yet. Open a person and tap Save." (with a category set: "None of your saved people are in this category.") |
| Removed from saved | Toast "Removed Nuh (AS) from saved" with Undo |

## URL state

`/persons?q=nuh&category=prophet&saved=1`. The back button restores it; unknown values are ignored.

## Data and storage

Reads the legacy persons data (`@legacy/data/quranPersons`, `quranStories`) and `quran:bookmarks:v1` (`person:` keys). Writes only the bookmark keys (and `added-at`). Never opens `quran-app-db`. No new keys.

## Left out on purpose

Passage text search and the exact-reference search (decision 4); the Timeline's related-events link (Events are a later phase); no pictures of anyone (there are none in the page).

## Tests

`tests/people.test.ts` and `e2e/people.spec.ts`; see `docs/phases/phase-07a-people.md`.
