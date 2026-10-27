# Page: Daily Fiqh (the hub, choose a marja', a category, a topic, the glossary)

- Routes (legacy, kept): `/fiqh`, `/fiqh/choose-marja`, `/fiqh/glossary`, `/fiqh/[category]`, `/fiqh/[category]/[topic]`. The category and topic ids are the legacy's (not the prototype's).
- Phase: 13a and 13b (plan `docs/phases/phase-13-daily-fiqh-plan.md`, result `phase-13-daily-fiqh.md`)
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/fiqh` and below
- Offline level: **B**. The data is not part of the install: a category is saved when it is opened or by "Save all for offline", and then works offline. A device that never opened it online gets a plain "isn't on this device yet" page. The Library and Search work without it.
- Indexable: not blocked (no `noindex`), client-rendered.

## Purpose

Show the obligatory acts of Fiqh Ja'fari as one marja' states them, quoted from his own published book with its number, and never as the app's own advice.

## Layout and behaviour

- **Hub:** title and the legacy's sentence; "Not scholar-reviewed" (and the Sunni note when the prayer setting is Sunni); until a marja' is chosen, only the choice (a gate); then "Showing rulings of <name>" with Change, a search box over topics, rulings and glossary terms, nine category cards (the three without topics say Coming later and are not links), links to Prayer times and Qibla, and **Save all for offline**.
- **Choose a marja':** the three maraji' with their books (Makarem Shirazi says his rulings are not added yet), the reading language (English, Urdu, Both), saved on the legacy record.
- **Category:** the topics, each with "N of M rulings shown for <marja'>" (M: rulings this reader can see; N: those with text for him).
- **Topic:** breadcrumb and Save; the title with its Arabic term; notices; the marja' bar and the language switch; **Overview** (app-written, labelled "Written by the app, not a ruling"); **Qur'anic basis** (only ayahs whose own text names the act; the reader's text; a one-line sourced note where the data has one); **Rulings** (the first ten, Show all; collapsed "Rulings specific to women" and "Purity of persons"); **Where and how to pay** (a link to his own official site, nothing else); Related topics; Terms used; Sources on this page with the date the texts were last checked; the study-aid line.
- **A ruling card** shows one of three things: his text (hukm and basis badges with words, Q&A, excerpt, English and/or Urdu each with its own book, number and link to the official text, the level it was checked at), a **pointer** ("Refer to his risala", why, his book and number, the official link, no text), or **"Not added yet for X. Refer to his risala."**.
- **Glossary:** 94 terms with the book each is defined in.
- **Step by step (13b):** the guided procedure for the topic and the chosen marja', one step at a time with Next, Previous and Show all steps; each step is an app-written title over the quoted ruling with its book and number, and "Written by the app: …" where the data has a reason. A step whose ruling may not be shown shows the pointer. No guide for that marja': "Not added yet for X. Refer to his risala. The rulings above still apply."
- **Recitations (13b):** the Arabic dhikr with its transliteration, from the marja's own Urdu edition, beside the ruling and step that carry it (Sistani only).
- **Live panel (13b):** on the prayer-times, fasting-times and qibla topics: today's times as the Prayer Times feature loaded them (no request is made here), or "Open Prayer Times to load today's times for your location."
- **Find your answer (13b, hidden):** a one-question-at-a-time helper with "I'm not sure" always offered; shown only on the development server with the flag on, until every path is signed off. Not in a production build.

## What a reader is never shown

Another marja's text in place of his own; any text of a ruling that is held for review, whose English differs from his Persian original, or that is on our hold list (in English, Urdu or Both, and with no Urdu in its place); a translation made by the app; a statement that English and Urdu translate each other; the legacy author's working references.

## Components

`FiqhProcedure`, `FiqhStep`, `FiqhRecitation`, `FiqhPointer`, `FiqhLivePanel`, `FiqhHelper`, `FiqhHelperQuote`, `FiqhHome`, `FiqhChooseMarja`, `FiqhCategory`, `FiqhTopic`, `FiqhGlossary`, `FiqhRulingCard`, `FiqhSourceLine`, `FiqhMarjaBar`, `FiqhMarjaChoices`, `FiqhLangSwitch`, `FiqhNotices`, `FiqhDisclaimer`, `FiqhUnavailable` (all in `app/components/fiqh/`); `KnowledgePassage` for the Qur'anic basis; `SettingsSegmentedControl` (a real radio group) for the language; `Collapsible` for the panels.

## Data

| Data | Source | Storage |
| --- | --- | --- |
| Topics, categories, glossary, the ruling index, the maraji' | `@legacy/data/wajibat` through `lib/fiqh/data.ts` (the legacy `runtime.ts`) | none |
| A category's rulings | one chunk per category, loaded on demand | Cache Storage `wajibat-data-cache` |
| What is shown of a ruling | `lib/fiqh/visibility.ts`, `lib/fiqh/holds.ts` | none |
| The marja' and the language | the preferences store, on `quran:fiqh-prefs:v1` (`marjaId`, `lang`) | the legacy key, other fields kept |
| Save | `quran:bookmarks:v1`, `fiqh:<topic id>` | the legacy key |

## States

Loading ("Loading the rulings…"); a step that quotes a held ruling (pointer); no guide for the marja'; live panel with and without times; not on this device (offline, not saved) with Try again; no marja' chosen (the gate); a marja' with nothing in a topic (one notice); an overview-only topic; no such topic or section; empty search ("No topics, rulings or terms match …"); Coming later; Dark mode designed; Sunni setting: the note.

## Accessibility

One `h1` per page; the language and marja' choices are radio groups; the panels are disclosure buttons; controls 44 px on a phone; hukm and basis badges carry words and an icon; Arabic and Urdu are never letter-spaced and have their own `lang`.

## Known differences from the prototype

In `docs/design/fiqh-compare/README.md`.

## Tests

`tests/fiqhData.test.ts` (the data, the validators, the verbatim check against the legacy snapshot, the hold list, and the display rules over every ruling, marja' and language); `tests/fiqhGuided.test.ts` (helpers, procedures, recitations, the build guard, on the real data); `e2e-helpers/helpers.spec.ts` (the helpers on the dev server with the flag; `npm run test:helpers`); `e2e/fiqh.spec.ts` (hub, picker, category, every kind of ruling card, Makarem Shirazi, Khamenei's zakat, the panels, Save, glossary, Library, Search, offline with the real service worker, 375 px).

## Open questions

Khamenei's spot check (30 entries) is yours, and the helpers' sign-off waits for it. The helpers stay hidden until then.
