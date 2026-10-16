# Phase 7A: Prophets & People (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-people`, `m-page-people` (`peopleListHTML`, `timelineHTML`, `renderPeople`) and `d-page-person`, `m-page-person` (`personHTML`).
- Routes (all legacy, kept): `/persons`, `/persons/timeline`, `/persons/[id]`.
- Offline level: **A** (all of it is bundled data).
- Not in 7A: the Story reader, Compare tellings, entity sheets, the story progress key (all 7B). `/stories` and `/stories/[id]` stay on the "not rebuilt yet" page until 7B.

## 0. Notes from the Phase 6 review

- Only three of 34 Library shots were examined by me before; I have now looked at the mobile dark Saved, mobile dark Collections and desktop light Notes pairs. One fix came out of it: Export was centred on mobile; it is left-aligned now. Spot-checking the rest is yours.
- The normaliser quirk ("zzzz" finds "Juz") is recorded in `docs/pages/library.md` (Known quirk).
- Real-device and same-origin rollback checks are yours. (On the rollback test: dev ports differ, so `localStorage` is not shared; the unit and browser tests already prove the legacy parsing of what the Library writes.)

## 1. The split

**Confirmed, with one change.** 7A: directory, Timeline, person page (reading the existing data). 7B: Story reader, Compare tellings, entity sheets, the story progress key, and switching Home's and Library's Story rows to it. The change: the person page's **Story tab** is in 7A, but it is a list of the stories that involve the person, each linking to its (still not rebuilt) reader; the story *journey* (chapters, progress, Continue) arrives in 7B. See section 5.

## 2. What the legacy app has (read from `pages/persons/*.vue`, `components/persons/*`, `usePersons.ts`, `usePersonStudy.ts`, `utils/persons*.ts`, `utils/personStudy.ts`)

### Data (59 entries, all in `app/data/quranPersons.ts`, reached through `@legacy/data/quranPersons`)
- Fields: `id`, `name`, `arabicName`, `alternateNames`, `entityType` (10 are groups), `primaryCategory` (prophet 25, woman 8, man 4, ruler_leader 8, companion 2, family_relative 2, other 10), `secondaryCategories`, `personType` (prophet 12, prophet_and_messenger 13, quranic_person 12, title_based_person 16, quranic_group 8), `honorific.short` and `.arabic`, `shortDescription`, `detailedDescription` (59), `themes`, `chronology {label, order, status}` (status: strong 5, traditional 36, uncertain 3, unknown 15; 24 carry an `order`), `directMentions`, `relatedPassages`, `relationships`, `keyLessons` (all with `quran_derived` status), `sources`, `statusNotes`.
- 7 entries have no direct mentions and 4 have no related passages; the page must say so (the legacy page already does).
- **Stories** (`quranStories.ts`): 21 stories (13 `quran_complete`, 7 `quran_fragmentary`, 1 `quran_primary_traditional_expansion`). 44 of the 59 people appear in at least one story's `personIds`; 15 appear in none.

### Pages
- **Directory** (`/persons`): hero, a Browse/Timeline toggle, search (name, Arabic name with marks ignored, theme, and an exact reference like `11:25`), a **Saved** chip, eight category chips (All plus the seven categories), a Reset, cards (Arabic name, name with honorific, category chip, Group chip, description, direct mentions and related passages counts, chronology text, up to four themes, a save star), and an empty state.
- **Timeline** (`/persons/timeline`): `buildTimeline`: a **mainline** of prophets with a chronology order, each with **branches** (relationships to people who are not on the mainline), and an **unlinked** list of everyone else. The legacy component draws all of that.
- **Person page** (`/persons/[id]`), top to bottom: back link and Save; a **resume banner** ("Resume where you left off, <section>") from `quran:persons-study:v1`; identity (Arabic name, name, Arabic honorific, "Also known as", category chip, a "Group, not individually named" chip, a prophetic-status chip from `personType`, counts, chronology text); **Overview** (`shortDescription`, a "More detail" panel with `detailedDescription`, themes); **Key lessons** (text and references); **Direct mentions** (every ayah, grouped by surah, each card opens the ayah); **Related passages** (grouped by surah or **Story View**, each with Play and Open, and **Play all passages**); **Family & Relationships** (a tree with a relationship chip and a source chip per entry); **Scholarly & Traditional Notes** (sources with a type chip, and status notes); **Referenced By** (the knowledge graph: other modules' entries connected to this one).
- **Study state** `quran:persons-study:v1` (a record per person: last section, passage view, last surah and ayah, update time). It feeds Home's second resume row and the Library's Story slot.
- Save is `person:<id>` in the bookmarks (the Library already lists it).

### What the legacy page shows that the prototype omits
1. The **resume banner** and the study record.
2. **Alternate names**, the **Group** chip, and the **prophetic status** (prophet, prophet and messenger, title-based, group) chip.
3. **More detail** (`detailedDescription`) and the **Overview** as its own section.
4. **All direct mentions**, grouped by surah, each opening the ayah (the prototype shows two or three chips).
5. **Story View** versus **Grouped by Surah** for related passages.
6. **Play all passages** and per-passage Play (audio; see question 4).
7. The family **source and verification chips** on every relationship (prototype shows a single "Qur'an" chip).
8. **Referenced By** from the knowledge graph (the prototype's "Referenced by" is typed).
9. **Sources** with a type per entry and the **status notes** in one list.
10. The Timeline's **branches** and **unlinked** people (the prototype shows a flat list of 13).

### What the prototype adds that the legacy page lacks
A Story tab with chapters (that is 7B's data design), three tabs instead of one long page, tinted "Story" tags in the directory and Timeline, a one-line chronology under each Timeline item, and a legend about traditional chronology.

## 3. The directory and the Timeline

- **Browse people:** the prototype layout (a row per person: the Arabic name, the name with honorific, a "Story · N stories" tag, the description, "N direct mentions · N related passages · chronology"). Search is the legacy `searchPersons` (name, Arabic, themes, an exact reference), through `@legacy/utils/personsSearch`; the category filter is the legacy `CATEGORY_FILTERS` (eight values) in the shared menu; **Saved** is a toggle reading the `person:` keys. Counts say "59 people" or "N of 59".
- **Chronology and its status.** The label comes from `chronology.label`; the wording comes from the legacy `chronologyText` (an established date reads plain; every other status is qualified: "Traditional chronology", "Chronology uncertain", "Chronology unknown"). In the directory and the Timeline, a **dashed** chip (not colour alone) marks anything that is not `strong`, and a legend line says what the dashed mark means.
- **Source status chips** (verified, traditional, uncertain) on relationships, sources and chronology, as text plus a solid or dashed border.
- **Timeline:** the legacy `buildTimeline`: the mainline, in order, each item opening the person, with its branches (people linked by relationship but not on the mainline) listed under it, and the unlinked people in a final "Not placed in the timeline" group so nobody is hidden. No dates are invented: only the legacy label and status.
- State in the URL: `/persons?category=prophet&q=...&saved=1`, so the back button restores it.

## 4. The person page: tabs

Three tabs as in the prototype (tabs are in-page buttons with `aria-current`; the URL keeps `?tab=story|passages|family`):

| Tab | Contents (all from the person record unless stated) |
| --- | --- |
| **Story** | Overview (`shortDescription`, "More detail" for `detailedDescription`, themes) and **Key lessons** (text and references, each marked "Derived from the Qur'an" from the `quran_derived` status, the legacy wording kept). Then **Stories** (section 5). |
| **Passages** | **Direct mentions** (all of them, grouped by surah, each opens the ayah in the reader) and **Related passages** (Grouped by Surah or Story View; each with **Read**; Play after 4B, see question 4). |
| **Family & notes** | **Family & relationships** (section 6), **Scholarly & traditional notes** (sources with a type chip, status notes), and **Referenced by** (question 5). |

- The header: Arabic name (text), name and honorific, alternate names, category, Group and prophetic-status chips, the two counts, chronology. **Save** writes `person:<id>` through `lib/bookmarks.ts`-style helpers (the same key the legacy app and the Library use) with Undo on removal.
- **Study state** keeps the legacy record exactly. The three tabs are written into it as the legacy section ids: Story as `overview`, Passages as `direct-mentions` (or `related-passages` when Related passages was last opened), Family & notes as `family`. The resume banner (dismissible) is kept: "Resume where you left off, <section>". Home and the Library read the same record with no change.
- A person with no story, no mentions or no passages shows a plain sentence ("No direct name mentions are catalogued for this person yet.").
- Unknown id: "Person not found" and a link to the directory.

## 5. Stories on the person page

- The Story tab lists **the stories whose `personIds` include this person** (the 44-of-59 coverage above), each as a row: the title (`title`), its kind (from `narrativeStatus`: "The Qur'an gives a full account", "Pieced together from several passages", "The Qur'an gives the core; popular retellings add detail"; the legacy enum, no new claims) and the passages count. In 7A each row links to `/stories/<id>`, which is still the "not rebuilt yet" page; a one-line note says so. No chapters, no progress, no "Continue" (7B).
- People in no story (15 of 59): "No story has been written for <name> yet. Their passages are under Passages." (the prototype's own sentence, with the name from the data).
- The prototype's Yusuf and Adam chapter lists, chapter titles and ayah counts are **7B's** (they are the prototype's own design of a story); none is used in 7A.

## 6. Family: the relationship labels are ambiguous (a finding)

`relationships` entries are `{personId, relationshipType, sourceType, verificationStatus}`. The legacy tree shows `<related person> [<type chip>]`, which reads as "Isma'il: Father" on Ibrahim's page. Reading the data, the type describes **the page person's role toward the related person** ("Ibrahim is the father of Isma'il"; "Ibrahim is the son of Azar"; Adam: "Isa, ancestor" means Adam is Isa's ancestor), so the chip as drawn says the opposite of the data for every parent and child pair. Further:
- **Three entries break that convention** and follow the other one (the type describes the related person): `isa → maryam: mother`, `maryam → isa: son`, `maryam → maryammother: mother`. Read the first way they say Isa is Maryam's mother.
- `ancestor` and `descendant` appear four times and `other` thirteen times; `opponent`, `supporter`, `contemporary` and `teacher_student` are symmetric or role-less.
- This matches the prototype's own worry ("Adam's descendant: Isa"), so the prototype is also not a safe source for direction.

**Proposal:** show a sentence, not a chip, built from the data and the convention: "Ibrahim is the father of Isma'il", "Ibrahim is the son of Azar" (page person's name, a verb phrase from a small table over the legacy `relationshipType` values, the related person's name), with the source chip (Qur'an, Authentic Hadith, Traditional account) and a dashed border for traditional or uncertain entries. A unit test checks every entry for **pair consistency** (if A says "father of B" then B says "son of A" and so on) and lists the exceptions. The three inconsistent entries are shown with the neutral wording "Related to Maryam: mother" until the data is corrected. **Asking before I do anything outside `revamp-quran/`:** may I correct those three entries in the legacy data file (a three-line change, a rollback-safe data fix)? See question 2.

## 7. Data integrity: what supplies what (nothing typed by us)

| Element | Source |
| --- | --- |
| Name, Arabic name, honorific (Latin and Arabic), alternate names | `name`, `arabicName`, `honorific.short`, `honorific.arabic`, `alternateNames` (the prototype types `عليه السلام` by hand; not used) |
| Category chip | `primaryCategory` through `CATEGORY_FILTERS` labels |
| Prophetic status chip | `personType` through a label table over the six legacy values; Group chip from `entityType` |
| Description, detail, themes | `shortDescription`, `detailedDescription`, `themes` |
| Counts | `directMentions.length`, `relatedPassages.length` (the prototype's counts are typed samples) |
| Chronology | `chronology.label`, `.status`, `.order` through `chronologyText` |
| Key lessons | `keyLessons[].text`, `.quranReferences`, `.status` |
| Direct mentions, related passages | `directMentions`, `relatedPassages` (surah names from the bundled surah table) |
| Family | `relationships` plus the name of the related person (`getPersonById`; three stub labels in `usePersons` for ids not in the data: Isma'il, Ishaq, Harun; I will check these still apply) |
| Notes | `sources` (type and citation), `statusNotes` |
| Stories | `QURAN_STORIES[].personIds`, `.title`, `.narrativeStatus` |
| Arabic of any ayah | never typed: the reader opens it; this page only links |

The prototype's 16 people, their descriptions, "Story · 5 chapters" tags, Yusuf and Adam texts, family rows, notes and "Referenced by" are **placeholders and are not used**; they go into `CONTENT_TO_VERIFY.md` as not used. Wherever the legacy data itself is flagged "traditional" or "uncertain", the app says so; the legacy wording ("a name in tradition, not the Qur'an, is never presented with the same weight") is kept.

## 8. Images and calligraphy

No depictions of any person, no silhouettes, no avatars, no generated portraits. The only visual is the **Arabic name as text** (from `arabicName`, in the Qur'anic font; never letter-spaced, never clipped, scaled by the Arabic size setting), plain geometry, and places or objects where a later phase has data. The directory row and the person header use the Arabic name as the visual anchor, as the prototype does.

## 9. Library, Home and Settings integration

- **Save** writes `person:<id>` exactly as the legacy app does; Library rows already render it (title, Arabic name, type).
- `OPENS_TODAY.person` flips to true (and the Library's "not rebuilt" notice stops naming People), with a unit test on the flag; `person:` rows then link to the live page.
- The Library's **Story slot** stays as it is ("Not set" or the latest person study, from `quran:persons-study:v1`); it switches to story chapters in 7B.
- Home's second resume row is untouched (same record).
- No new storage keys in 7A.

## 10. Files, tests, screenshots

- **Files:** `app/pages/persons/index.vue`, `timeline.vue`, `[id].vue`; `app/components/people/` (`PeopleDirectory`, `PersonRow`, `PeopleTimeline`, `PersonPage`, `PersonHeader`, `StoryTab`, `PassagesTab`, `FamilyTab`, `RelationLine`, `ChronologyChip`); `app/lib/people.ts` (thin adapters over the legacy utils: labels, relation sentences, tab-to-section mapping, URL state); `app/stores/people.ts` or a composable for the study record and saved people; `libraryItems.ts` flag flip.
- **Unit tests:** search (name, Arabic with marks, theme, `11:25`), category and Saved filters, chronology wording for each of the four statuses, the timeline (mainline order, branches, unlinked, nobody lost), the relation sentence table and the **pair-consistency check over all relationships** (with the three known exceptions listed), the study-record round trip (legacy shape unchanged; tab to section mapping), the story list per person (44 with, 15 without), the `person:` bookmark key, no typed Arabic (the existing scan), `quran-app-db` never opened.
- **Browser tests:** the directory (59 rows; search; each category; Saved; reset; empty states; URL state; keyboard), the Timeline (mainline, branches, unlinked, dashed chips and legend), the person page for a prophet with a story, a person with no story, a group, a person with no mentions, tabs and their URLs, Save with Undo and the Library showing it, the resume banner, the study record in storage after each tab, unknown id, 375px (44px targets, one `h1`, no horizontal scroll), light and dark, offline (everything works with no network, no request at all).
- **Screenshots (prototype next to revamp):** Browse and Timeline and one person page at **1280 and 375, light and dark** = 12 pairs, plus states (search with no match, Saved empty, a group, a person with no story, Family with a traditional entry, the resume banner, the not-rebuilt story link). I will look at every pair and say which I only generated.
- **Docs:** phase doc, `docs/pages/people.md` and `docs/pages/person.md`, `docs/design/people-compare/README.md`, PROGRESS.md, CONTENT_TO_VERIFY.md (the prototype's samples not used; the three relationship entries; the story-kind wording).

## Open questions

1. **Split.** Confirmed as above, with the Story tab as a plain list of stories in 7A and the journey in 7B? (Recommended: yes.)
2. **Relationship direction.** Show a sentence ("Ibrahim is the father of Isma'il") built from the data, with a pair-consistency test, and **may I correct the three inconsistent entries in `app/data/quranPersons.ts`** (outside `revamp-quran/`; the legacy app would then read them correctly too)? If not, the three show neutral wording and the test lists them as known exceptions. (Recommended: yes, correct them, in their own small commit.)
3. **Tabs versus the study record.** Three tabs written into the legacy section ids as in section 4, so Home and the Library keep working unchanged? (Recommended: yes.)
4. **Audio on this page.** "Play" per passage and "Play all passages" depend on the player (4B, and your phone audio test). Recommended: leave them out of 7A (Read links only) and add them after 4B, rather than a disabled button.
5. **Referenced By.** It reads the knowledge graph (`useKnowledgeGraph`, `graphIndex`) and links to Places, Peoples, Themes, Events and Signs, none rebuilt until Phase 12. Recommended: omit it in 7A (the stories that involve a person are already on the Story tab), and add it in Phase 12 when those pages exist. Or include it with links to the not-rebuilt page?
6. **Search scope.** The legacy search (name, Arabic, themes, `11:25`). Also search the descriptions as the prototype does? (Recommended: no; it adds noise and the legacy behaviour is tested.)
7. **Timeline detail.** Show branches under each mainline prophet and the unlinked group (the legacy behaviour), rather than the prototype's flat 13-person list? (Recommended: yes; the legacy shows all 59 and that is the data.)
8. **Prophetic status chip.** Keep the legacy chip from `personType` ("Prophet", "Prophet and messenger", "Title-based person", "Quranic group")? Labels need your sign-off because they are religious classifications; I will copy the legacy labels exactly. (Recommended: yes.)

## Risks

- The relationship direction issue above (the main one); a wrong reading would put a false statement under a prophet's name, hence the consistency test and the neutral fallback.
- The directory is one of the larger lists (59 rows with long descriptions); plain rows, `content-visibility`, and the same throttled performance test as the listing.
- Legacy utils reach for `~/data/...` imports; the bridge handles them (as for Home), and the persons utils are pure.
- The study record is shared with Home and the Library; the tab mapping is the only place that changes how it is written, and a test locks the shape.

## Not part of 7A

The Story reader, Compare tellings, entity sheets, story progress key, per-passage audio, Referenced By (Phase 12), the Peoples, Places, Themes, Duas, Events and Signs modules.
