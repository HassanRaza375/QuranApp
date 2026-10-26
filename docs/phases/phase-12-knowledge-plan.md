# Phase 12 plan: Knowledge modules (Peoples, Places, Themes, Duas, Events, Signs, Commands)

Status: **approved 2026-10-26 (section 0). Stage 1 (shared list, detail, graph and Peoples) built, waiting for your screenshot checkpoint; the other six modules are not built.** Branch `phase-12-knowledge` (from `phase-11-downloads`; nothing merged to `main`). Written after a data audit of every module (section 0), then reading the legacy pages `peoples`, `places`, `themes`, `duas`, `events`, `signs`, `commands` (list and detail), `components/knowledge/RelatedEntitiesSection.vue`, `utils/graphIndex.ts`, `composables/useKnowledgeGraph.ts`, `useTransliteration.ts`, the seven `*Search.ts` utils, the seven datasets' header comments, the prototype (`docs/design/prototype-remaining-pages.html`, `#/k/<module>` and `#/k/<module>/<id>`), and the revamp code this touches (`nav.ts`, `stories.ts`, `libraryItems.ts`, `searchLocal.ts`, `stores/player.ts`, `useAyahSnippets`, `QuranThread`).

**Baseline:** `npm run verify` is clean on Node 22.23.4 (780 unit and 565 browser tests, commit `c05b817`, `phase-11-downloads.md`). Phase 11's device checks (offline seek, reopen offline, Al-Baqarah, iPhone Safari, the 7-day Safari check) are still open and independent of this phase.

## Approval (2026-10-26) and stage 1

**Approved:** vendor the three missing datasets, the legacy search utils and the graph engine through the sync script; dua transliteration live from the API's transliteration edition, online only, an offline note, nothing stored, never generated; ship all seven modules; the UI never says "verified" or "reviewed" (basis labels only) and every entry whose basis is not "the Qur'an states it" goes on a review list in `CONTENT_TO_VERIFY.md`; a dua's Arabic comes from the reader's cached text, never from the data; the legacy features (type chips, Saved, reference search, per-module sections, Play all) in one filter row that also accepts references like `7:65`; the seven Library item types; Duas and Knowledge base groups in Search (with stable keys and the URL-sync guard intact); `QuranThread` for "where it appears"; one phase, in order: shared list, detail and graph with Peoples first, **then a screenshot checkpoint**, then the other six.

**Stage 1 built (2026-10-26):** `lib/knowledge/` (the shared shape, the registry, references, the graph wrapper, the queue, the Peoples adapter), `components/knowledge/` (tabs, card, list, passage, detail, link groups), `/peoples` and `/peoples/[id]`; the three datasets, `graphIndex.ts` and `peoplesSearch`/`peoplesValidate` vendored (the other search utils and validators are added with their modules, because the snapshot test forbids unused files); the Library's seven legacy key kinds; story chips and the person page link to the new pages ("Connected" and "Referenced by"); `Play all` as an additive queue kind; 20 unit and 15 browser tests; the review list in `CONTENT_TO_VERIFY.md`; 19 screenshots (`docs/design/knowledge-compare/`).

**Decisions made while building, for your review:**

- **The data's `statusNotes` are not shown.** They are the legacy author's working notes ("Phase 3 migration ... `relatedPlaceIds`", "a manually-verified anchor set, not an exhaustive whole-word count like Module 17's", "See this file's own header comment"), not text for readers, and they use the word "verified". Your rule (basis labels only) points the same way, so the plan's "notes stay visible" is dropped. 110 notes across the seven datasets stay in the data and are counted on the review list.
- **The Library's "Reciters" notice is gone and audio items open `/surah-audios/[id]`.** Phase 11 rebuilt that page but `OPENS_TODAY.audio` was still `false`; I flipped it and updated the two tests that pinned it.

## 0. Data audit: does real data exist for each module?

I loaded each legacy dataset (read-only, from the legacy checkout), counted what is in it, checked every ayah reference against the real ayah counts and every cross-link against the ids that exist, and looked for placeholder words. I also searched the legacy repo's history and all five branches.

| Module | Routes | Entries | Legacy file | In `legacy/` today | Ayah references | Not "Qur'an states" (weaker basis) |
| --- | --- | --- | --- | --- | --- | --- |
| Peoples & Nations | `/peoples`, `/peoples/[id]` | **14** | `data/quranPeoples.ts` | yes | 115 | 1 (context) |
| Places | `/places`, `/places/[id]` | **16** | `data/quranPlaces.ts` | yes | 65 | 3 (1 disputed, 2 context); 1 source is a "traditional account" |
| Themes | `/themes`, `/themes/[id]` | **42** | `data/quranThemes.ts` | **no** | 84 | 5 ("derived concept") |
| Duas | `/duas`, `/duas/[id]` | **38** | `data/quranDuas.ts` | **no** | 41 | 7 (3 narrative, 4 instruction) |
| Events | `/events`, `/events/[id]` | **40** | `data/quranEvents.ts` | yes | 42 | 1 (context) |
| Signs & Miracles | `/signs`, `/signs/[id]` | **14** | `data/quranSigns.ts` | **no** | 32 | 0 |
| Commands & Prohibitions | `/commands`, `/commands/[id]` | **18** | `data/quranCommands.ts` | yes | 34 | 0 |

**Verdict: real data exists for all seven, so none of them needs the "Coming later" state.** That is **182 real entries** against the prototype's 29 samples, and none of the prototype's samples ship. Three datasets (Themes, Duas, Signs: 94 entries) are in the legacy repo but not yet vendored here; they come in through `scripts/sync-legacy.mjs` like the others. If you decline to vendor one, that module gets the "Coming later" state (no sample content) and its links are hidden.

What I checked, and what I did not:

- **Integrity, passed:** 413 ayah references, **0 outside the real ayah counts**; 627 cross-links between datasets (stories, people, peoples, places, themes, duas, events, signs), **0 broken**; every entry has an Arabic name in the data; no placeholder words (TODO, TBD, lorem...).
- **History:** each file has one or two commits and no data file was ever deleted. `main` and `wajibat-module` hold the identical files; `dev` and `revamp-quran-only` hold none. There is only one version of this data.
- **"Verified" is the legacy author's own label.** Every reference says `verificationStatus: "verified"` and every file header says its terms were checked against `api.alquran.cloud` search when written. That is a self-check, **not a review by a scholar**. The weaker bases are labelled in the data (disputed, context, derived concept, narrative, instruction) and many entries carry "status notes" that say what is not claimed ("no nisab or percentage is stated here"). I would ship those labels and notes visibly, and list the content in `CONTENT_TO_VERIFY.md` for a human read, as was done for People and Stories. Decision 4.
- **The data holds no Qur'an text, translation or transliteration.** It holds references; the ayah text comes from the existing reader pipeline (offline after first use). The Duas header says transliteration is fetched live from `api.alquran.cloud` and "nothing is copied" (decision 2).
- **Poets** (`/poets`, `/poets/[slug]`, data in the legacy `assets/data/poets`) is an eighth legacy module behind the "Literary modules" setting. It stays deferred, as in `ROADMAP.md`.

## 1. Legacy report: what these pages do today

**Reach.** All fourteen routes exist in the legacy app, each with `useHead` and a meta description (indexable). They are linked from the legacy drawer's Knowledge group and from the Sitemap. In the revamp today every route lands on "not rebuilt yet", and the nav rows carry `phase: 12`.

**A list page** (all seven alike): a hero with the module's title and a sentence; a search box (peoples: "Search by name, Arabic name, theme, or reference (e.g. 11:50)"); a **Saved** chip and a **Reset**; one row of **type or category chips** (community types, place types, theme categories, dua categories (14), event categories (14), sign classifications, command or prohibition); a card grid; an empty state with a reset. Each module has its own composable and its own `*Search.ts`.

**A detail page** has a **Save** toggle and, per module, these sections: Peoples: Outcome, Direct Mentions, Related Passages with **Play all passages**, Associated Prophets & People, Related Places; Places: Direct Mentions, Related Passages, People, Peoples & Nations; Themes: Qur'anic Passages (Play all), Stories, People, Peoples & Nations, Places, Related Themes, Definition & Source Basis; **Duas**: Context, What It Asks For, Who Made It, Qur'anic Source (Arabic and translation per ayah, Play all ayahs), Also Occurs At (parallel passages), and **Transliteration** (live, from a third-party edition); Events: Overview, Qur'anic Account (Play all), Sources, Also Occurs At, Notes, Chronology, People, Peoples, Places; Signs: Overview, the Account (Play all), Sources, Notes, People, Peoples, Places, Related Story; Commands: Overview, the Account (Play all), Sources, Audience, People, Peoples, Places. Every page ends with **Referenced By**, built by `graphIndex.ts`.

**Cross-links are careful.** `graphIndex.ts` tags every edge `stored` (a dataset says it) or `derived_reverse` (computed by inverting a stored edge); a derived edge is never presented as if the other dataset declared it, and person-to-person family relations are never auto-reversed. The legacy docs win on feature behaviour (`CLAUDE.md`), so the revamp reuses this engine instead of the prototype's simpler "any link back is Referenced by".

**Saving.** A page saves with the bookmark keys `community:<id>`, `place:<id>`, `theme:<id>`, `dua:<id>`, `event:<id>`, `sign:<id>`, `command:<id>` (seven kinds, in `quran:bookmarks:v1`).

**Gaps and bugs found**

1. **The revamp's Library does not know these seven key kinds.** A user who saved a dua or a place in the legacy app sees "Saved item" with no link after cutover. This is a data-loss-adjacent gap that Phase 12 must close (Library item types, section 4).
2. **Search covers none of them in the site-wide box.** Each module's search is local to its page, as the legacy code says. Phase 10 left a provider registry for exactly this.
3. **Ayah text is fetched per card over the network, live.** No offline reading of a passage unless the reader had cached that surah. (The revamp's cache fixes this for surahs the user has read or saved.)
4. **Transliteration is live and unlicensed for copying** (the Duas header explains the choice), so it cannot be offline.
5. The seven composables each keep their own filter state; no shared list behaviour.

## 2. What the revamp already has

Phase 7's person and story pages (layouts, entity sheet, passages tab, `QuranThread`), `listingSearch.normalize`, the Search provider registry (`lib/searchLocal.ts`), `useAyahSnippets` (cached chapter, then the per-ayah store, then one small request), the player (`playAyah`, `playQueue`), the legacy identification labels (`lib/stories.ts`), four of the seven datasets already vendored, and the places where a Phase 12 link is waiting: story chips for places, peoples and events (`Entity.href: null`), the person page's "Referenced By waits for Phase 12", the entity sheet's "no page until Phase 12".

## 3. What the prototype adds and what it drops

**Adds:** one tab strip across the seven modules; a card grid with a thread of where each entry appears in the Qur'an; a status tag shown **only** when the basis is not "Qur'an states"; a detail page with "Where it appears" (thread and ayah chips), the ayahs with translation, "Connected" chips and "Referenced by", **Listen / Play all**, and Arabic shown large for duas.

**Drops (the legacy has them, the prototype does not).** Each needs your yes or no (decision 5): the module type and category chips; the **Saved** filter; search by **reference** (`11:50`); the per-module detail sections (Outcome, Context, What it asks for, Audience, Chronology, Definition & Source Basis, Notes); parallel passages ("Also occurs at"); direct-mention lists; the live transliteration.

**Conflicts with the real data**

- **The prototype's three status tags** ("Qur'an states", "Traditional identification", "Interpretations differ") do not match the data's values (`quran_explicit`, `quran_context`, `traditional`, `modern_identification`, `disputed`, `quran_narrative`, `quran_instruction`, `quran_derived_concept`). The build shows **the legacy's own words** for each value (the revamp already has the five identification labels) and does not map them into three invented tags. Where the revamp has no label yet (narrative, instruction, derived concept), the label is taken from the legacy detail pages, not written by me.
- **The prototype's names, ids, ayah lists, summaries and "Connected" links** are samples (`CONTENT_TO_VERIFY.md`); the real ids and links are used (for example `ad`, `makkah`, `tawhid`).
- **"Events"** here are Qur'anic events (40). The Ramadan page already has an "Events" tab of Islamic calendar dates. Both exist in the legacy app; the nav row and page title say "Events in the Qur'an" so they cannot be confused.

## 4. Proposed design

**Routes and levels.** The fourteen legacy routes, unchanged. Each page is **level A** (the data is bundled and loads per module as its own chunk, precached with the app). The **ayah text** on a detail page is **level B** (offline after the surah was read or saved; otherwise the passage shows its reference and "Connect to load this text", never a blank). **Transliteration** is **level C** if kept.

**One list and one detail, driven by a module description.** A small adapter per module (`app/lib/knowledge/`) turns a legacy entry into one shape (id, name, Arabic name, summary, basis label, passages, links, the module's own sections), so seven modules are two pages and seven adapters, not fourteen pages. The module-specific sections above are kept; nothing is dropped silently.

- **List:** tab strip, title and the module's question, count, search box (name, Arabic, theme, reference), the module's type chips, a Saved chip, the card grid with a thread, empty state. Filters follow the legacy rules through the vendored `*Search.ts` utils.
- **Detail:** head (name, Arabic, summary, basis tag only when not explicit, Save, Play all), **Where it appears** (thread and chips), **the ayahs** (Arabic and translation from the reader's cache, a Play button on each, Open in reader), the module's sections, **Connected** (stored links), **Referenced by** (the legacy graph index, with derived links worded as derived), and the data's **Notes** (status notes), visible, never hidden.
- **Save** uses the legacy keys above, with Undo.
- **Play all:** a new additive queue kind (`knowledge`, `{ module, id }`), rebuilt from the data like Page and Story queues; the legacy has no such record, so rollback is safe.
- **Library:** the seven key kinds become Library item types with a title, the module as detail, and a link (the bookmarks stay in the same legacy key; removal keeps notes, as elsewhere).
- **Search:** providers registered for **Duas** and **Knowledge base** (peoples, places, themes, events, signs, commands, each result labelled with its module), through the existing registry.
- **Links that were waiting:** story chips, the entity sheet and the person page's "Referenced by" now open the new pages.

**Reuse, not copy.** Through `scripts/sync-legacy.mjs` (the list in `scripts/lib/legacy-files.mjs`): the three missing datasets, the six missing `*Search.ts` utils, `graphIndex.ts`, and the seven `*Validate.ts` (which a unit test runs over the data; `commandsSearch.ts` is already vendored). Roughly 17 files; nothing edited by hand.

**Storage.** No new `localStorage` key and no IndexedDB change (`quran-revamp-db` stays at version 4). Bookmarks use the existing legacy keys; the audio queue record gains one additive kind.

## 5. Content integrity

Nothing from the prototype ships: not its 29 entries, summaries, Arabic strings, ayah lists, status assignments or "Connected" chips. Every name, Arabic name, summary, outcome, passage and link comes from the legacy datasets; ayah text comes from the existing reader pipeline. **I write no new religious content.** New wording of ours (tab labels, empty states, "Connect to load this text", the "Events in the Qur'an" title, the derived-link sentence) is listed in `CONTENT_TO_VERIFY.md` for a read-through. The datasets' own claims (descriptions, outcomes, themes, notes) are the legacy author's; the weaker bases are shown as labelled, and the whole of it goes on the review list.

## 6. Files, tests, screenshots

**Added:** 14 pages (`app/pages/peoples|places|themes|duas|events|signs|commands/`), `app/components/knowledge/` (list, card, detail, sections, passages block), `app/lib/knowledge/` (adapters, labels), `app/composables/useKnowledge.ts`; `legacy/` additions by the sync script; tests; `docs/pages/knowledge-list.md`, `knowledge-detail.md` (one pair for all seven, with a table of module differences), `docs/phases/phase-12-knowledge.md`, `docs/design/knowledge-compare/`.
**Changed:** `lib/libraryItems.ts` and the Library tests, `lib/searchLocal.ts`, `lib/stories.ts` (entity links), `components/people/FamilyTab.vue`, `components/stories/EntitySheet.vue` and `StoryReader.vue`, the player store and `audioState` (one queue kind), `scripts/lib/legacy-files.mjs`, docs.

**Unit tests:** data integrity (every ayah reference within the real counts and every cross-link resolving, the checks above, kept as permanent tests); each adapter on real entries; the legacy `*Validate.ts` run over the data; the graph index on real ids, including that derived edges are marked derived and family relations are never reversed; search providers; Library parity for the seven legacy key kinds (a bookmark written by the legacy code opens the right page); the new queue kind's record. **Browser tests** (production build, text mocked, real APIs blocked): each module's list and a detail page; filters, Saved, reference search (`11:50`); Save and Undo; Play all and a single ayah; the offline states of ayah text; links from a story chip and the person page; Library opens a legacy-keyed bookmark; 375 and 1280 px, light and dark; keyboard-only. **Screenshots** against the prototype with every difference listed.

## 7. Risks

1. **Review of 182 entries of religious content** that carry the legacy author's own "verified" label. Mitigation: visible basis labels and notes, the review list, and decision 4 (hold any module you want read first).
2. **Weight of ayah text on a page** (the largest entries list 60 or more ayahs, for example the People of Nuh): text loads per surah from the cache, passages open collapsed past a short list, and Play all does not need the text.
3. **Transliteration** (decision 2): online only, third party, not copied.
4. **Name clash "Events"** (section 3).
5. **Search ranking** across seven more groups: Duas and Knowledge base stay capped under All, as the other groups are.
6. **Scope:** 14 routes. The shared list and detail keep it to about two pages and seven adapters; if you want it staged, the natural split is Peoples, Places, Themes first (the person and story chips wait on them), then Duas, Events, Signs, Commands.

## 8. Decisions I need from you

| # | Question | My recommendation |
| --- | --- | --- |
| 1 | Vendor the three missing datasets (Themes, Duas, Signs), the six search utils, `graphIndex.ts` and the validators from the legacy commit via the sync script? | **Yes.** Otherwise those modules get "Coming later" |
| 2 | Duas transliteration: keep (live from `api.alquran.cloud`, online only, a designed offline note), cache it on the device, or leave it out? | **Keep it live and online-only**, collapsed under the dua, with an offline note; nothing stored (the data's own stated rule) |
| 3 | Status wording: the legacy's own words per basis value (no mapping into the prototype's three tags)? | **Yes** |
| 4 | Content review: ship all seven with visible labels and notes and a review list, or hold some (for example Themes, whose five "derived concept" entries are the broadest claims) until someone has read them? | **Ship all seven**, with the review list; hold only what you name |
| 5 | Keep the legacy features the prototype dropped: type and category chips, the Saved filter, reference search, the per-module sections, parallel passages, Play all? | **Yes, all** (behind compact controls), because a rebuild that loses them is a regression |
| 6 | Library: add the seven item types so legacy bookmarks open? | **Yes** (a cutover requirement) |
| 7 | Search groups: Duas and Knowledge base (peoples, places, themes, events, signs, commands)? | **Yes** |
| 8 | Stage it (Peoples, Places, Themes first, then the other four) or build all fourteen routes in one phase? | **All in one phase**, one shared list and detail; stage only if you prefer smaller reviews |

## 9. Defaults I will use unless you object

Lists open on the first tab (Peoples) at `/peoples`, tabs link between modules; the basis tag shows only for non-explicit entries; "Referenced by" shows derived links with the word "derived"; passages longer than six ayahs open collapsed; the nav `phase` flags stay until Phase 16; Poets stays deferred; no images and no depiction of any person (rule 7).

## 10. Not part of Phase 12

Poets and the "Literary modules" setting; Daily Fiqh (13); Hifz (14); Goals and Calendar (15); a knowledge-graph visualisation; editing or adding entries; any new religious content; offline saving of the knowledge data as a separate download (the data is bundled, and the ayah text follows the reader's cache and Downloads).
