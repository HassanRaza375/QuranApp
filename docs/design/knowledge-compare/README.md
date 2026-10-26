# Knowledge modules, checkpoint 1: Peoples & Nations (Phase 12)

Made by `scripts/screenshots/phase-12-knowledge.mjs` against the production build. The page's **ayah text is synthetic** (right counts, obviously fake words: "TEST ARABIC 69:4") because the page shows the reader's text, which is never taken from the data files; every name, Arabic name, summary, passage and link on these pages is the real legacy data. The prototype shows its own sample content (6 entries, its own summaries), so pairs compare layout and behaviour, not words.

| Image | What |
| --- | --- |
| `pair-list-{desktop,mobile}-{light,dark}.jpg` | the list, prototype left, revamp right (1280 and 375 px) |
| `pair-detail-{desktop,mobile}-{light,dark}.jpg` | the top of `'Ad`'s page |
| `detail-full-{desktop-light,mobile-dark}.jpg` | the whole page: where it appears, the ayahs (the short passage open), sections, themes, Connected, Referenced by, sources |
| `detail-referenced-{desktop-light,mobile-dark}.jpg` | Connected and Referenced by |
| `state-filter-reference-desktop.jpg` | typing `7:65` |
| `state-empty-desktop.jpg`, `state-saved-empty-mobile.jpg` | empty filter and empty Saved |
| `state-basis-tag-mobile.jpg` | an entry whose basis is not "the Qur'an states it" |
| `state-text-unavailable-desktop.jpg` | the reader's text could not be loaded: a plain line and Try again, the rest of the page works |
| `library-legacy-community-keys-desktop.jpg` | legacy bookmarks `community:ad` and `community:thamud` in the Library |
| `person-referenced-by-desktop.jpg` | the person page's new "Referenced by" (Hud) |

**Looked at one by one:** the desktop and mobile list pairs, the desktop and mobile detail (full page), Connected and Referenced by, the person page, the Library, the unavailable-text and filter-by-reference states. Found and fixed after looking: the data's working notes appeared on the page ("Phase 3 migration ... `relatedPlaceIds`", "a manually-verified anchor set"), so notes are no longer shown (they go on the review list); on a phone the Arabic name was squeezed beside the summary (it now comes first, above the English name); the filter placeholder was cut off at 375 px; the unavailable-text screenshot did not scroll to the message. **Not looked at individually:** the dark desktop pair, the saved-empty and basis-tag phone states.

## Intentional differences from the prototype

| Prototype | Revamp | Why |
| --- | --- | --- |
| 6 sample entries | the 14 real entries | real data wins |
| Three status tags ("Qur'an states", "Traditional identification", "Interpretations differ") | The legacy's own basis words, only when the entry is not explicit ("Identified through Qur'anic context") | The data has more basis values than three tags; nothing is mapped or invented |
| No type or Saved filter | One filter row: the box (names, Arabic, themes, or a reference such as `7:65` or `7:65-72`), the kind menu, Saved, Reset | Legacy features kept (decision 4) |
| "Referenced by" for any link back | The legacy graph: "Connected" is what the entry's own data names; "Referenced by" is what only another entry's data names, said in those words | The graph's rule that a derived link is never presented as stated |
| "Play all" with a toast | A real queue (a new additive kind in `quran:audio-queue:v1`), rebuilt from the data | The player is real |
| Links to places, themes, duas, events | Plain dashed names until those pages ship, then links | No link to a page that does not exist |
| Translation placeholder "loads from the reader's cache" | The reader's own translation (your Settings language, or Off) | Real text from the reader, never from the data |
| Passages all open | A passage of more than six ayahs waits behind "Show the N ayahs" | Peoples have passages up to 60 ayahs |
