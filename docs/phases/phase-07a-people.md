# Phase 7A: Prophets & People (directory, Timeline, person page)

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: **Done, awaiting review.** Screenshots (40) and `docs/design/people-compare/README.md` are in; I looked at three pairs and say so in the README.
- Plan and decisions: `phase-07a-people-plan.md`

## Approved decisions (as built)

1. **Relationship direction.** Full sentences ("Ibrahim (AS) is the father of Isma'il (AS)") and a consistency test over every pair. **The data edit was NOT made** (see "Finding: the three entries" below); the three entries are read correctly by a small table in `app/lib/people.ts` instead. Other mismatches are reported, not fixed.
2. Per-passage Play and Play all are left out until Phase 4B.
3. Referenced By is left out until Phase 12.
4. Search covers names (English and Arabic, with alternate names), the short description and theme names; not passage text and not an ayah reference.
5. Timeline: the legacy mainline, branches and unlinked people; chronology wording from the legacy `chronologyText`, dashed unless the data says established.
6. Prophetic-status chip: the legacy labels verbatim; nothing for other types. Status text that reads like a ruling is listed below.
7. The person page's Story tab links to the 7B reader behind one flag (`STORIES_READY.reader` in `app/lib/people.ts`, off) with a notice, and a test follows every story link to a real page.
No depictions of any person (the page has no images; a test checks); Save writes `person:<id>`; the Library's Story slot is unchanged.

## What was built

- **Pages** (legacy routes): `/persons`, `/persons/timeline`, `/persons/[id]` (each a thin page over a component).
- **Components** `app/components/people/`: `PeoplePage`, `PeopleDirectory`, `PersonRow`, `PeopleTimeline`, `PersonPage`, `StoryTab`, `PassagesTab`, `FamilyTab`.
- **Logic** `app/lib/people.ts` (adapters over `@legacy/data/quranPersons`, `quranStories`, `personsSearch`, `personsChronology`, `personsTimeline`: search, category, Saved, URL state, chronology, status labels, story lists, relationship sentences, tab-to-section mapping) and `app/lib/peopleStudy.ts` (the legacy `quran:persons-study:v1` record, written with the legacy pure helpers).
- **Library:** `OPENS_TODAY.person` is now true, so `person:` rows open the real page and the "not rebuilt" notice no longer names People; the person title shows the honorific.
- No new storage keys.

## Finding: the three entries (the data edit was held)

You approved correcting `isa>maryam`, `maryam>isa`, `maryam>maryammother` in `app/data/quranPersons.ts`, after a check. The check found the premise does not hold, so **I did not edit**:

- `docs/legacy-reference/prophets-quran-feature.md` section 14 gives the example "Ibrahim (AS) ├── Isma'il (AS) — Son — Qur'an", which means the type names **the related person's** role (Isma'il is the son). The legacy page draws it that way ("<related> [type]").
- The **data** is written the other way for 17 parent/child entries ("ibrahim > ismail: father" means Ibrahim is the father). Only the three entries above follow the spec's reading.
- So the three are not wrong against the spec; they are inconsistent with the other 17. Editing them to match the majority would make the **legacy** page show "Isa: Mother" on Maryam's page (wrong), where it is now right. Making the data match the spec would mean changing about 17 other entries.
- Pair consistency itself (A says father of B, B says son of A) holds for every parent and ancestor pair once the three are read as reversed. Other differences (reported, not fixed): no reverse entry for `adam>isa`, `yusuf>ibrahim`, `musa>haman`, `jalut>talut`, `jalut>dawud`, `zayd>muhammad`, `yusufbrothers>yaqub`; type differs between the two sides for `musa/musawarner`, `firaun/sahara`, `abulahab/muhammad` (other vs supporter/opponent).
- **What the revamp does:** `REVERSED_ENTRIES` (three keys) in `app/lib/people.ts` flips those three when building sentences, so every sentence is correct; a test pins the set and checks both sides state the same fact.
- **Decision for you:** (a) leave as is; (b) edit the three after all, deleting `REVERSED_ENTRIES` (legacy page then shows them wrong); (c) fix the data convention properly (about 17 entries, plus a legacy display fix). I recommend (a) now and (c) at cutover.

## Status text that reads like a ruling (for your review)

The chip is the legacy label for `personType` (12 "Prophet", 13 "Prophet · Messenger", the rest nothing). The status notes under Family & notes qualify some of them. Please review:

- **Adam, Yusuf** are "Prophet"; their notes say the status rests on tradition/scholarly position, not the word *nabi* beside the name.
- **Dhul-Kifl** is "Prophet"; his note says it is **debated among scholars** (the data counts him as one on the majority view). The chip alone does not show that.
- **Maryam** has no chip (a quranic person); her note says she is not considered a prophet. **Luqman, Dhul-Qarnayn, Khidr** (title-based) and **Uzair** (quranic person) have no chip; their notes say prophethood is not established or disputed.
- "Prophet · Messenger" is shown for 13 entries (for example Harun, Lut, Yunus, Ilyas, Shu'ayb, Isma'il): a classification claim copied from the data.
- Counts by type in the data: prophet 12, prophet_and_messenger 13, quranic_person 12, title_based_person 15, quranic_group 7.

## Differences from the plan

- Key lessons show text and references only (the legacy presentation); no "Derived from the Qur'an" chip, because the data's only status value is `quran_derived` and the legacy page shows no label.
- Story rows use the **legacy** kind labels ("Fully told in the Qur'an", "Qur'an core, traditionally expanded", "Pieced together across surahs"), not new wording.
- Relationship types with no direction in the data ("opponent", "supporter", "other", "teacher and student", "spouse", "contemporary") read "A and B: opponents" rather than a verb.
- The legacy Timeline's "related events" link is left out (Events come later).

## Verification

- `npm run verify` on Node 22: build, lint, unit tests, dev smoke and **277 browser tests pass** (20 in `e2e/people.spec.ts`; the Library spec was adjusted for People now opening).
- `tests/people.test.ts` (27 tests): the data, search scope, categories, Saved and URL state, chronology and status wording, the timeline (nobody lost), sentences and the pair-consistency check, the story coverage (44 of 59 in a story, 15 not), the study record and tab mapping.
- The existing source scan still proves no hard-coded Arabic in `app/`.

## What is left for you

- Decide the three relationship entries (a, b or c in "Finding").
- Review the status chips and the CONTENT_TO_VERIFY items.
- Spot-check the 37 screenshots I did not examine; real-device checks.
- Then Phase 7B (Story reader, Compare tellings, entity sheets, story progress) needs its own plan.
