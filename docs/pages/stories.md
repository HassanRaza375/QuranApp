# Page: Stories (directory)

- Route (legacy, kept): `/stories`.
- Phase: 7B
- Prototype section: none (the prototype has no directory; this is the lean version the review asked for)
- Offline level: A. Bundled data; no network request, no Qur'an text.
- Indexable: no.

## Purpose

The way in to the 21 stories, with your progress.

## Layout

- One `h1` "Stories of the Qur’an", a sentence, and a live count ("21 stories", "2 of 21 stories").
- Search (title, Arabic title, alternate titles, descriptions, themes, an exact reference like `12:4`, through the legacy `searchStories`), **Type** (the five legacy story types), **Person** (people who appear in a story), **Saved**, and **Reset** when anything is set. State is in the URL (`?q=&type=&person=&saved=1`).
- A row: the Arabic title (text), the title, the legacy status chip (dashed unless fully told), the story type, the short description, "N chapters · Not started / Chapter 3 of 4 / Finished", and a star (`story:<id>`, the legacy key, Undo on removal). A row opens the story at your resume chapter.

## States

| State | What shows |
| --- | --- |
| Nothing matches | "No stories match “xylophone”." and Reset search and filters |
| Saved with nothing saved | "Nothing saved yet. Open a story and tap Save." |

## Data and storage

Reads the legacy stories data and `quran:bookmarks:v1` (`story:` keys) and `quran:story-progress:v1`; writes only the bookmark keys. Never opens `quran-app-db`.

## Tests

`tests/stories.test.ts`, `e2e/stories.spec.ts`.
