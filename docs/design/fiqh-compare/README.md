# Daily Fiqh (Phase 13a): the prototype next to the revamp, and the states that matter

Made by `scripts/screenshots/phase-13-fiqh.mjs` against the production build. **Everything on the revamp side is real**: the rulings are the legacy data (no mock), and the one ayah of the Qur'anic basis is the reader's real text from `quranapi.pages.dev` (the script needs the internet). The prototype shows its own sample categories, topics and counts, and a labelled slot where a ruling's text goes, so pairs compare layout and behaviour, not words. The prototype never shows the pointer, "Not added yet" or the Both mode as built here.

| Image | What |
| --- | --- |
| `pair-home-{desktop-light,mobile-dark}.jpg`, `pair-choose-desktop-light.jpg`, `pair-category-{desktop-light,mobile-dark}.jpg`, `pair-topic-{desktop-light,mobile-dark,desktop-dark}.jpg`, `pair-glossary-desktop-light.jpg` | the five pages, prototype left, revamp right (Sistani chosen; the topic is Wuḍūʾ) |
| `state-gate-desktop.jpg`, `state-sunni-notice-mobile.jpg` | nothing is shown until a marja' is chosen; the Ja'fari-only note |
| `ruling-held-khamenei.jpg`, `ruling-english-withheld-khamenei.jpg`, `ruling-on-hold-khamenei.jpg` | the three kinds of pointer (held by the legacy data, English differs from his Persian original, held by our needs-human list): no text, his book and number, the official link |
| `ruling-not-added-khamenei.jpg`, `state-nothing-for-khamenei-zakat-mobile-dark.jpg`, `state-category-counts-khamenei-zakat-mobile-dark.jpg`, `state-makarem-topic-desktop.jpg` | "Not added yet for X. Refer to his risala."; the Zakat topics for Khamenei ("0 of 9 rulings shown"); Makarem Shirazi |
| `ruling-both-sistani.jpg`, `ruling-urdu-sistani.jpg`, `state-urdu-mode-no-urdu-desktop.jpg`, `ruling-urdu-only-khamenei.jpg`, `ruling-qa-khamenei.jpg` | Both (each language with its own book and number), Urdu, an Urdu reader where there is no official Urdu, an Urdu-only ruling, a Q&A entry |
| `state-women-panel-{collapsed,open}-mobile.jpg` | the collapsed and the opened women's rulings |
| `search-fiqh-group-desktop.jpg`, `library-fiqh-rows-desktop.jpg`, `glossary-term-link-desktop.jpg` | the Search group, Library rows, a glossary term opened by its link |

**Looked at one by one:** the home, choose, category, glossary and desktop topic pairs; the mobile topic pair (after a fix); the held, English-withheld, on-hold, not-added, Both and Urdu-only ruling cards; the gate; Makarem Shirazi; the Khamenei Zakat topic and its category counts; the women's panel; the Search group; the Library rows. Found and fixed after looking: on a phone the marja' bar was squeezed beside the language switch (they now stack); the Khamenei book's edition was printed twice ("The Rules on Prayer & Fasting 2023 · 2023"); the Library screenshot used a topic id that does not exist (the script's, not the app's). **Not looked at individually:** the mobile-dark home and category pairs, the dark desktop topic pair, the Sunni-note phone image, `ruling-urdu-sistani`, `ruling-qa-khamenei`, `state-urdu-mode-no-urdu-desktop`, `state-women-panel-collapsed-mobile`, `glossary-term-link-desktop`.

## Intentional differences from the prototype

| Prototype | Revamp | Why |
| --- | --- | --- |
| 9 categories, 34 sample topics, its own ids, "N of N rulings added" meter and "≈ 2.4 MB" invented | The 9 categories, 67 topics and the legacy ids; "N of M rulings shown for <marja'>" from the data; no size figure | Real data wins; the roadmap says the legacy ids win |
| "Continue" row with a step count | Not built | It needs a study state that the legacy never had; nothing is tracked |
| "Showing rulings of" with Sistani only, a pending Makarem Shirazi | The same, with the legacy's names and books; Makarem Shirazi "not added yet" everywhere | Decision P1 |
| A slot "Verbatim text appears here" | The marja's exact text, his book, number, a link to the official text and the level it was checked at | The data is real |
| No pointer, no hold | A "Refer to his risala" pointer for 249 Khamenei entries; "Not added yet for X. Refer to his risala." | Your decisions 1, 4 and 5 |
| "Not scholar-reviewed. A study aid. Follow your own marja'…" as one banner | The legacy's two pieces: the label at the top, the study-aid line at the foot | The legacy's own words |
| The prototype's glossary of 14 terms, with its own definitions | 94 terms, each with the book it is defined in | The legacy glossary is sourced; the prototype's was ours |
| Guided steps, helper, live times on the topic | Not in 13a | Stage 13b |
