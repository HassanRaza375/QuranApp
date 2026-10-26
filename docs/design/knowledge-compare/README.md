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

# Stage 2: the other six modules, Search, the Library and real reader text

Made by the same script (`node scripts/screenshots/phase-12-knowledge.mjs modules`, `states2`, and `real`, which needs the internet). The `modules` and `states2` images use the **synthetic** reader text (see above) and a fake transliteration ("TEST TRANSLITERATION 7:23"), except the one real recorded answer for 2:127. Every name, Arabic name, summary and link is the real legacy data. The prototype's sample entries differ from the real ones (for example its "Dua of Yunus" against the data's "The Dua of Yunus"), so pairs compare layout and behaviour.

| Image | What |
| --- | --- |
| `pair-<module>-list-{desktop-light,mobile-dark}.jpg` | the list of Places, Themes, Duas, Events, Signs, Commands; prototype left, revamp right |
| `pair-<module>-detail-{desktop-light,mobile-dark,desktop-dark}.jpg` | the top of one entry of each (Makkah, Mercy, The Dua of Yunus, The Battle of Badr, Musa's Staff, Prayer) |
| `detail-full-<module>-{desktop-light,mobile-dark}.jpg` | the whole page |
| `state-dua-transliteration-desktop.jpg`, `state-dua-transliteration-failed-mobile.jpg`, `state-dua-transliteration-offline-mobile-dark.jpg` | the live transliteration, "not available for this ayah" with Try again, and the offline note |
| `state-dua-partial-ayah-desktop.jpg` | a dua that is only part of an ayah: the data's own note |
| `state-event-chronology-desktop.jpg`, `state-basis-tag-event-mobile.jpg` | the Chronology section; a weaker basis ("Established by Qur'anic narrative context") |
| `state-signs-kind-menu-desktop.jpg`, `state-empty-commands-mobile.jpg` | the kinds the data uses; an empty filter |
| `search-groups-desktop.jpg`, `search-knowledge-chip-desktop.jpg`, `search-groups-mobile-dark.jpg` | the Duas and Knowledge base groups and chips |
| `library-seven-kinds-desktop.jpg`, `story-entity-chips-desktop.jpg` | legacy bookmarks of all seven kinds; the story's chips now open pages |
| `real-<module>-<id>-*.jpg` (6 images) | **the real reader text and the real transliteration**: the production build run locally against `quranapi.pages.dev` and `api.alquran.cloud`, nothing mocked (the Vercel preview sits behind a Vercel login that a script cannot pass, so these come from the same build on this machine) |

**Looked at one by one:** Places list pair (desktop), Duas detail pair (desktop), Events detail pair (mobile dark), Themes list pair (mobile dark), Signs detail pair (desktop dark), the Signs kind menu, the dua transliteration (live and offline), the Chronology state, Search (desktop and mobile), the seven-kind Library, and two of the real-text pages (Adam's Prayer of Repentance on desktop, The Dua of Yunus on a phone: the reader's own Arabic and English, and the real transliteration, read correctly). Found: Search's one-line description still named only ayahs, surahs, people and stories (fixed). Seen and left: the kind popover opens aligned to the button's right edge and overlaps the sidebar edge on desktop (shared `ResponsiveMenu`, as in stage 1); the tab strip is cut at 1280 px and scrolls sideways; Madinah's data text contains the ﷺ sign, which this font draws as a small ornament. **Not looked at individually:** the remaining pair images (the other lists and details in each theme), `state-dua-partial-ayah-desktop`, `state-dua-transliteration-failed-mobile`, `state-basis-tag-event-mobile`, `state-empty-commands-mobile`, `search-knowledge-chip-desktop`, `story-entity-chips-desktop`, and four of the six real-text pages (Peoples 'Ad, Makkah, Battle of Badr, the sea-splitting sign): they come from the same code as the ones I did look at, but I have not seen them.

## Intentional differences from the prototype (stage 2)

| Prototype | Revamp | Why |
| --- | --- | --- |
| Duas show the Arabic from the data and a translation placeholder | The Arabic and translation are the reader's, per ayah; the transliteration is live and online only | A dua's Arabic never comes from a data file (decision 3); the source is a third party, so nothing is stored |
| A basis tag of three kinds | The legacy's own words per module ("Narrative prayer", "Qur'an-derived concept", …), only when not "explicit" | Same as stage 1 |
| No chronology or audience | An Events "Chronology" and a Commands "Audience" section | Legacy sections kept (decision 4) |
| Events are called "Events" | "Events in the Qur’an" | The Ramadan page already has Events |
| Search has one "Knowledge base" group | A **Duas** group and a **Knowledge base** group (the other six modules, each hit saying which) | The prototype's own search listed duas as a separate type |
