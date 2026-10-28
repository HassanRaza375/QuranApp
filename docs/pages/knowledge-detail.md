# Page: Knowledge modules, one entry (seven routes, one component)

- Routes (legacy, kept): `/peoples/[id]`, `/places/[id]`, `/themes/[id]`, `/duas/[id]`, `/events/[id]`, `/signs/[id]`, `/commands/[id]`. Each is `KnowledgeDetailPage` with `module` and `id`.
- Phase: 12 (`docs/phases/phase-12-knowledge-plan.md`, `phase-12-knowledge.md`)
- Prototype section: `docs/design/prototype-remaining-pages.html`, `#/k/<module>/<id>` (`pgKDetail`)
- Offline level: **A for everything but the ayah text and the dua transliteration.** The entry, its links and its sections are bundled. The ayah text is the reader's (cache first, one request when online): **B**, with a plain "not on your device yet" line and Try again when it is missing. A dua's transliteration is **C** (live, online only, never stored), with an offline note.
- Indexable: not blocked (no `noindex`), client-rendered, not prerendered.

## Purpose

Show one subject and where it rests in the Qur'an: the ayahs themselves, what else it is connected to, and how sure the data is of it.

## Layout

One column, 768 px at most. Tab strip; a link back to the module; the head (on a phone the Arabic name comes first, above the English name; on a desktop it sits on the right): name, "Also: …" names, the summary, the kind, the basis tag when not "the Qur'an states it", Save (with Undo) and Play all. Then, in order:

1. **Where it appears:** `QuranThread`, "N ayahs in M surahs", and the direct-mention chips that open the reader.
2. **The ayahs:** each passage with its reference, the data's one-line description where it has one, and the ayahs: the reader's Arabic (gold verse-end marker) and your Settings translation, with Play and Open in reader per ayah. A passage of more than six ayahs waits behind "Show the N ayahs". **Also occurs at** holds a dua's, event's, sign's or command's parallel passages.
3. **Module sections** (the legacy's own titles): Peoples and Places "Outcome", "In more detail", "Places named in the text"; Themes "In more detail"; Duas **Transliteration**, "Context", "Who made it"; Events **Chronology**; Commands "Audience".
4. **Themes**, **Connected** (what this entry's own data names), **Referenced by** (entries whose data names this one; this one's data does not name them back), **Sources** (a source that is not the Qur'an is drawn dashed).

Nothing on the page says "verified" or "reviewed", and the data's working notes (`statusNotes`) are not shown.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `KnowledgeDetailPage`, `KnowledgePassage`, `KnowledgeLinkGroups`, `KnowledgeTransliteration` | custom (`app/components/knowledge/`) | the gold verse marker and the playing highlight are scoped copies of the reader's |
| `QuranThread`, `Skeleton`, `Button` | shared / shadcn-vue | |

## Data

| Data | Source | Storage |
| --- | --- | --- |
| The entry | `lib/knowledge/<module>.ts` over the legacy dataset | none |
| Arabic and translation of each ayah | `useQuranText().getChapter` (the reader's cache, memoised) with the reader's translation choice | the reader's `quran-revamp-db` store (existing) |
| Connected, Referenced by | `@legacy/utils/graphIndex` through `lib/knowledge/graph.ts` | none |
| Dua transliteration | `TransliterationService` (`useQuranApi2`, `/ayah/<s>:<a>/en.transliteration`) | **none**, kept for the page's lifetime in memory |
| Play all | `lib/knowledge/queue.ts`; a new additive queue kind `knowledge` with `{module,id}` in `quran:audio-queue:v1`, rebuilt from the data | existing key |
| Save | `quran:bookmarks:v1` under the legacy keys | existing key |

## States

- **Loading:** a skeleton. **No such entry:** "No such entry" with a link back. **Text not loaded:** "Loading the text…", then, offline and not saved, "This text isn’t on your device yet. Connect to load it." or "Couldn’t load this text." with Try again; the rest of the page works.
- **Duas:** transliteration loading, "Transliteration not available for this ayah." (with Try again; never made up), and "The transliteration needs a connection, and isn’t kept on your device." offline. A dua that is only part of an ayah says "The full ayah is shown." and the data's own note about which part is the dua.
- **Dark mode:** designed. **Fiqh variants:** none.

## Interactions

Save toggles the legacy key with Undo. Play all queues each passage's ayahs once, in order (your Settings reciter); Play on an ayah plays that ayah. Every Connected and Referenced-by link opens its page.

## Accessibility

One `h1`, `h2` per section; the passage buttons have `aria-expanded`; all controls 44 px on a phone; the ayah being played is highlighted by more than colour (an inset bar).

## Cross-links

Story chips and the entity sheet, person pages ("Referenced by"), Library rows, Search results, the tab strip and every Connected chip.

## Known differences from the prototype

See `docs/design/knowledge-compare/README.md`.

## Tests

`e2e/knowledge.spec.ts` (Peoples in depth), `e2e/knowledgeModules.spec.ts` (every module's detail, Duas partial ayah and transliteration online, failed and offline, Events chronology, Library kinds, Search groups, links between modules, 375 px); `tests/knowledgeModules.test.ts`.

## Open questions

The draft reader-facing caveats (`docs/CONTENT_TO_VERIFY.md`, "Draft reader-facing caveats") are not shown; they wait for your approval.
