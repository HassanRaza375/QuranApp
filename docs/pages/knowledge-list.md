# Page: Knowledge modules, the list (seven routes, one component)

- Routes (legacy, kept): `/peoples`, `/places`, `/themes`, `/duas`, `/events`, `/signs`, `/commands`. Each is `KnowledgeListPage` with a `module` prop. `?q=` the filter text, `t=` the kind chip, `saved=1` the Saved filter (all new; the legacy pages kept no state in the URL).
- Phase: 12 (plan and decisions: `docs/phases/phase-12-knowledge-plan.md`; what was built: `docs/phases/phase-12-knowledge.md`)
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/k/<module>` (`pgKList`)
- Offline level: **A**. The seven datasets are bundled; the list makes no request.
- Indexable: not blocked (no `noindex`), but the page is a client-rendered SPA route, not prerendered.

## Purpose

Browse one kind of Qur'anic subject (peoples, places, themes, duas, events, signs, commands), each entry tied to the ayahs it rests on, and find it by name, Arabic, theme or a typed reference such as `7:65`.

## Layout

A column of 64 rem at most. The tab strip of the seven modules (scrolls sideways when it does not fit; the current one has `aria-current`), the title and the module's question ("Which communities?", "Where?", "What does it teach?", "What was asked?", "What happened?", "What was shown?", "What is commanded?"), then **one filter row**: the box, the kind menu (the module's own chips, from the legacy `*Search.ts`), Saved, Reset. Below, "N entries" and a grid of cards (1 column on a phone, 2 from 768 px, 3 from 1024 px). A card: the Arabic name (right), the name, the summary, the kind, the basis tag when the entry is not "the Qur'an states it", the count "N ayahs in M surahs", the Save star, and `QuranThread` showing where the entry falls in the Qur'an.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `KnowledgeListPage`, `KnowledgeCard`, `KnowledgeTabs` | custom (`app/components/knowledge/`) | one card component per entry; the 42-entry Themes list is fine (the 114-row rule applies to the Surah list only) |
| `QuranThread` | shared | the same strip as Downloads and Search |
| `ResponsiveMenu`, `Input`, `Button` | shadcn-vue and the existing menu | popover on desktop, bottom sheet on a phone |
| `ListingStarButton` | shared | Save with Undo |

## Data

| Data | Source | Storage |
| --- | --- | --- |
| Entries | the legacy datasets through `@legacy` (`quranPeoples`, `quranPlaces`, `quranThemes`, `quranDuas`, `quranEvents`, `quranSigns`, `quranCommands`), turned into one shape by `lib/knowledge/<module>.ts` | none |
| Search and kind chips | the legacy `*Search.ts` of each module; a typed reference (`7:65`, `7.65`, `7 65`, `7:65-72`) is read first, validated against the real ayah counts | none |
| Saved | `quran:bookmarks:v1`, keys `community:`, `place:`, `theme:`, `dua:`, `event:`, `sign:`, `command:` (the legacy keys) | read and written through `lib/bookmarks` |

## States

- **Empty / first run:** every entry, no filter. **Filtered to nothing:** "Nothing matches “…”" with Reset; for a reference, "Nothing here points at 7:65". **Saved with none saved:** "Nothing saved yet. Open an entry and tap Save."
- **Loading:** the module's data is its own chunk; a skeleton shows for the moment it takes.
- **Offline:** unchanged (level A). **Dark mode:** designed. **Fiqh variants:** none; these modules are not fiqh-sensitive.

## Interactions

- Typing filters at once (names, Arabic, themes, or a reference). The kind menu narrows by the module's own chips. Reset clears all three. The state is in the URL and survives a reload.
- The card is one link; the star is a separate control. Save adds the legacy key and offers Undo.

## Accessibility

Tabs are links with `aria-current`. The filter is a labelled input. The kind menu is a radio group. Cards and the star are 44 px on a phone. Arabic is never letter-spaced or truncated and follows the Arabic size setting.

## Cross-links

Every card opens `/<module>/<id>`. The Library lists the same saved entries; Search has a Duas group and a Knowledge base group; story chips and person pages link in.

## Known differences from the prototype

See `docs/design/knowledge-compare/README.md` (real data instead of 6 sample entries; one filter row that keeps the legacy features; the legacy's own basis words instead of three tags).

## Module differences

| Module | Entries | Kind chip | Basis words (only when not explicit) |
| --- | --- | --- | --- |
| Peoples & Nations | 14 | community type | "Identified through Qur'anic context", "Traditional identification" … |
| Places | 16 | place type (10) | the same words |
| Themes | 42 | category (6) | "Qur'an-derived concept", "Scholarly interpretation" |
| Duas | 38 | category (14) | "Narrative prayer", "Qur'anic instruction to supplicate" |
| Events in the Qur'an | 40 | category (14) | "Established by Qur'anic narrative context" … |
| Signs & Miracles | 14 | classification (3 in use) | "Qur'an states this directly" is not tagged |
| Commands & Prohibitions | 18 | command or prohibition | (all explicit) |

## Tests

`tests/knowledge.test.ts`, `tests/knowledgeModules.test.ts` (data integrity, the seven validators, the adapters); `e2e/knowledge.spec.ts`, `e2e/knowledgeModules.spec.ts` (every module: list, filter, Saved, phone at 375 px).

## Open questions

None for the list. The "Referenced by" wording and the review list are in `phase-12-knowledge.md`.
