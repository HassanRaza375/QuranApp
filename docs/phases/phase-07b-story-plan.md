# Phase 7B: Story reader (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-story`, `m-page-story` (`storyHTML`, `exHTML`, `cmpHTML`, `entHTML`, `STORIES`).
- Routes (legacy, kept): `/stories/[id]` (the reader; chapter in `?chapter=<n>`), and `/stories` (the directory, see question 1).
- Offline level: **A** for everything except the Qur'an text, which is **B** (cached chapters, as in the reader).
- Not in 7B: place, community and event pages (Phase 12), audio (4B), the story image share card, Referenced By.

## 0. Carried from the 7A review

- Baseline: `npm run verify` was run first. The baseline **found a real lint error** (an unused import in the two screenshot scripts I added); fixed and committed, then re-run (result in the phase doc when 7B is built). Unit tests: 430 pass.
- The three relationship entries and `app/data/quranPersons.ts` stay untouched; the override table and the consistency test stay. The cutover checklist in `PLAN.md` now carries "normalise the relationship dataset to one convention at cutover, one reviewed commit, then delete the override table".
- Status chips: `HIDDEN_STATUS_CHIPS` in `app/lib/people.ts` hides a person's chip with one line (empty now, tested); the open review is in `CONTENT_TO_VERIFY.md` (Adam, Yusuf, Dhul-Kifl, the 13 "Prophet · Messenger" entries).
- A correction to my Phase 6 plan: **the legacy app already writes `story:<id>` bookmarks** (the Save button on `pages/stories/[id].vue`). The Library already lists them (title from the story data). Nothing new is needed for Save.

## 1. What the legacy app has (read from `pages/stories/index.vue`, `[id].vue`, `useStories`, `utils/stories*.ts`, `data/quranStories.ts`)

- **Directory** (`/stories`): hero, search (title, Arabic title, theme, reference like `12:4`), a person filter, **Saved**, story-type chips (prophetic, individual, group, communal, journey narratives), cards.
- **Story page** (`/stories/[id]`), top to bottom: Save; header (Arabic title, title, alternate titles, a type chip and the narrative-status chip); overview (short description, "More detail", themes, **Outcome**); **Qur'anic Passages** (Primary, then Supporting / Parallel Retellings; each with Play and Read Passage; **Play all passages**); **Episodes** (an accordion: title, summary, its passages); **People**, **Peoples & Nations**, **Places** (chips that link); **Lessons** (text, a basis chip, references); **Related Stories**; **Scholarly & Source Notes**; **Referenced By**.
- No chapters, no reader, no progress, no Qur'an text on the page (only passage cards linking to the surah reader), no Compare drawer, no entity sheets.

### What the legacy page shows that the prototype omits
Alternate titles, the story type chip, "More detail", **Outcome**, supporting passages as a separate group, Peoples & Nations, Related Stories, source and status notes, Referenced By, Play all.
### What the prototype adds that the legacy lacks
A one-chapter-per-screen reader with a progress rail and Previous/Next, the Qur'an excerpt in the page, a context note, Reflection per chapter, "Also told in" and **Compare tellings**, entity sheets, an end-of-story page with "Continue with", resume.

## 2. The data, story by story (21 stories; measured, not assumed)

| Group | Stories | Chapters from |
| --- | --- | --- |
| **With episodes** (11; 38 episodes; each episode has a title, a summary and **exactly one** passage range) | adamandiblis (4), nuhflood (3), ibrahimnarrative (4), lutandhispeople (2), yusufstory (4), musaandpharaoh (5), musaandbaniisrael (3), musaandkhidr (3), dawudandjalut (2), maryamandisa (5), dhulqarnaynstory (3) | the episodes, in the data's order |
| **Without episodes** (10) | thecow, sulaimanandsaba, ayyubstory (2 primary), yunusstory, zakariyyayahya, peopleofthecavestory, peopleofthetrenchstory, peopleoftheelephantstory, qarunstory, thenightjourney | the **primary passages**, one chapter each (9 stories have one, ayyubstory two) |

- **Passages:** 32 primary (all have a title **and** a description), 13 supporting (**none** has a description), 38 episode passages (**none** has a description; the episode's own summary is the text).
- **Sizes:** the longest chapter is 44 ayahs (Yusuf episode 4; the whole Yusuf primary passage is 98); the longest flat chapter is 25 (Sulaiman and Saba). Episodes of the longer Musa stories are 59 and 71 ayahs in their primary passages, but their chapters are episodes.
- **Order:** the data has **no field that names an order** for any story (the passages carry a `storyOrder`, but there is no "order" statement). Episodes of 6 stories jump between surahs (adamandiblis 2, 7; nuhflood 71, 11; ibrahim 21, 11, 37; musaandpharaoh 28, 20, 26; musaandbaniisrael 2, 20, 5; maryamandisa 19, 3, 5, 4); the other 5 are single-surah and ascending.
- **Narrative status:** quran_complete 13, quran_fragmentary 7, quran_primary_traditional_expansion 1. (nuhflood is "complete" yet its episodes jump between surahs 71 and 11; I treat the data's `narrativeStatus` as the rule for the notice, see 5.)
- **Lessons:** 26 in all, per story (not per episode); bases `quran_explicit` 25 and `derived_thematic` 1 (thecow).
- **Links:** `personIds` (44 of 59 people appear), `communityIds`, `placeIds`, `relatedStoryIds` (none dangling). Events link to stories (`storyIds`, 36 mentions) but not to chapters.
- **Sources:** types `quran` and `authentic_hadith`; status notes on 11 stories.

## 3. Chapters, built from real data only

- A chapter = an episode (title, summary, its one passage) or, for a story without episodes, a primary passage (its own title and description). Nothing is split, merged or renamed. A story with one chapter shows no progress rail ("Chapter 1 of 1" is noise); a story's end page follows its last chapter.
- **Per chapter, in the page:** eyebrow "Chapter n of N", the title, the reference ("Yusuf 12:21–35 · 15 ayahs", computed from the range), the **summary** (episode summary or the passage description), **Listen to this chapter** (disabled), the **Qur'an text**, "In this chapter" chips, Previous and Next.
- **Reflections** are the story's lessons, which are **story-level in the data**, so they appear on the **end page** ("What the Qur'an stresses"), each with its basis chip (legacy wording) and references. A lesson is never attached to a chapter, because the data does not say which.
- **Context note** (the prototype's per-chapter "ctx"): the data has none per chapter; the story's `statusNotes` (and `outcome`) go in a collapsed "Notes on this story" under the header, labelled by source type. No per-chapter note is invented.
- **The prototype's chapter titles, summaries, ayah counts, excerpts, "Reflection" lines and `EX` text are placeholders and are not used.**

## 4. The Qur'an text

- Never typed. Each chapter's ayahs come from the **cached surah** in `quran-revamp-db` through the reader's loader (`loadChapter`: IndexedDB first, one request per surah when online, cached afterwards, so the surah the reader already opened is free). The Arabic with the verse marker, with the translation chosen in Settings (same display rules as the reader: Arabic size, translation language, verse layout).
- **Long chapters:** show the first **10** ayahs and a **Show all N ayahs** button (`aria-expanded`), so a 44-ayah chapter does not open as a wall; the choice is remembered for the session only. Chapters of 10 or fewer show everything.
- **States:** loading (a skeleton the height of the chapter, no layout shift); failed online ("Couldn't load this surah. Check your connection and try again." and Retry); not cached and offline ("This surah isn't saved on this device yet. Connect once to read it." and Retry); partial (a chapter spanning data not yet loaded shows what it has and the line). A story that needs a large surah (Al-Baqarah is 527 KB) loads only when its chapter is opened.
- Chapters also link to the surah reader ("Read in the surah", the ayah range).
- Question 3: the alternative is one small request per ayah (as the Library snippets do); worse for a 44-ayah chapter.

## 5. Notices and labels (data only)

- **"Arranged for study"**: shown permanently, under the header, for every story whose `narrativeStatus` is not `quran_complete` (8 stories), with the legacy status label ("Pieced together across surahs" or "Qur'an core, traditionally expanded") and one sentence: "These passages are arranged in a sequence for study; the Qur'an does not tell them as one continuous account." (wording of ours, flagged for your review). Complete stories carry the status chip only.
- **"Order"**: only where it can be **derived from the data**, not claimed: a story whose chapters are all in one surah and in ascending order shows "Order: the surah's own sequence (Yusuf 12:4–101)" (computed from the ranges). Stories that jump between surahs show no Order line. (Question 4: or show no Order line at all, since the data names none?)
- Type chip and status chip as the legacy page has them; a dashed border when not complete.

## 6. Also told in, and Compare tellings

- The data has **no per-chapter mapping** of supporting passages to episodes, so "Also told in" is **story-level**: one row under the header listing the supporting passages (13 across 8 stories) as references, and a **Compare tellings** button that opens a drawer (a side sheet at 768px and up, a bottom sheet below) listing the primary and supporting passages: kind (Primary / Supporting), the title where it exists, the reference and ayah count, and the **description where it exists**; supporting passages (all 13) show **"No description recorded yet."** Each has **Read passage** (opens the reader). No comparison text is written.
- Stories with no supporting passage show no row and no button.
- The prototype's per-chapter "Also told in" with a "main telling" is not built (no data).

## 7. Entity sheets

- **People** (`personIds`): a chip opens a sheet with the Arabic name (text), the name with honorific, the category, the short description, themes and an **Open page** link to `/persons/<id>` (live since 7A). All from the persons data.
- **Peoples & Nations, Places** (`communityIds`, `placeIds`): a chip opens a sheet with the Arabic name, name, type, short description and the legacy identification basis label, and a line "Its page arrives in a later phase" with **no link** (Phase 12). Until then these are inert-in-navigation but the sheet itself works.
- **Events** (from the Events data that list the story): chips under "In this story", labelled "Event", **inert** with "Events arrive in a later phase" (a `<span>`, not a link or button).
- Sheets are shared sheets (focus trapped, Escape, focus return), 44px targets. No images of anyone.

## 8. Story progress: a new additive key

- **`quran:story-progress:v1`** = `{ "v": 1, "stories": { "<storyId>": { "chapter": <0-based current chapter>, "read": [<0-based chapters read>], "updatedAt": <ms> } } }`. The legacy app never reads it (additive, like `quran:pins:v1`); damaged values read as empty.
- **A chapter is "read"** when you reach its end (the Previous/Next bar scrolls into view) or press Next on it; opening a chapter alone does not mark it. **The resume point** is the chapter you were last on. Leaving and coming back (or the Person page, Home, the Library) offers "Continue · Chapter 3". "Start again" on the end page clears that story's progress. **No streaks, no counts of days, no badges**; progress is quiet chapter dots and the resume point.
- **`quran:persons-study:v1` keeps working unchanged** (the person page still writes it; Home and the Library still read it).
- **Home** (row 2, the "You were reading" row): today it shows the latest person study. After 7B it shows **whichever is newer: the latest story progress or the latest person study**, through one adapter in `useHomeState` (the row text becomes "You were reading: <story title>, Chapter 3" with the link to that chapter; the person case is unchanged).
- **Library** (the Story slot in Where I stopped): the same rule through the same adapter; clear removes only the story's progress with an Undo toast (the person study cannot be cleared there, as now). `OPENS_TODAY.story` flips to true (the not-rebuilt notice stops naming Stories).
- **Person page** (7A): remove the "story reader is still being moved" notice by flipping `STORIES_READY.reader`; each story row also shows its progress ("Chapter 3 of 4" or "Not started") and links to the resume chapter.
- **Settings:** Clear all and Export already cover every `localStorage` key, so the new key is included; Reset settings leaves it alone (a test).

## 9. Routes, directory and Save

- `/stories/[id]` with `?chapter=<n>` (1-based; `?chapter=end` is the end page; an invalid number opens chapter 1; unknown id: "Story not found" and a link back). The chapter is in the URL so Back and a link work; the chapter changes with `replace` for Previous/Next inside a visit so Back leaves the story rather than stepping through every chapter. Focus moves to the chapter title on change and a polite live region announces "Chapter 3 of 4".
- **`/stories`** (legacy route): see question 1. Recommended: a lean directory like People (search by title, Arabic title and theme; person filter via a menu; story-type menu; Saved; the cards show kind, chapter count and your progress), because the Library's story rows, Home and the person page all need somewhere to go back to.
- **Save** writes `story:<id>` through `lib/bookmarks.ts` (the legacy key), with Undo on removal; the Library already shows it.

## 10. Audio, offline, accessibility

- **Audio:** Phase 4B is not done and the phone audio test is still pending, so **Listen to this chapter** is rendered **disabled** with the visible text "Coming with the player" (a button with `aria-disabled` and an `aria-describedby`, not hidden). Play all, per-passage Play and the prototype's "Listen" states are not built. I assume 4B stays after 7B.
- **Offline:** the story data is bundled (works with no network). The text works for surahs already opened; the states are in section 4; the Compare drawer and sheets need nothing.
- **Images:** none. The Arabic title appears as text only; no depictions, silhouettes or avatars; no streaks; progress is dots and the resume point.
- 375px, 44px targets, one `h1` (the story title), a progress rail that is a list of buttons with names ("Chapter 3, read"), keyboard Previous/Next, Reduce motion respected.

## 11. Files, tests, screenshots

- **Files:** `app/pages/stories/index.vue`, `[id].vue`; `app/components/stories/` (`StoriesPage`, `StoryReader`, `StoryHeader`, `ChapterView`, `ChapterText`, `ProgressRail`, `EndOfStory`, `CompareSheet`, `EntitySheet`, `StoriesDirectory`); `app/lib/stories.ts` (chapters from data, labels, derived Order, search), `app/lib/storyProgress.ts` (the new key); additions to `useHomeState`/`resume.ts` (the adapter), the Library Story slot, `people.ts` (`STORIES_READY`), `libraryItems.ts` (the flag).
- **Unit tests:** chapters for all 21 stories (counts: 11 with episodes = 38 chapters; 10 without; every chapter has a valid range inside the real ayah counts and a non-empty summary or description), the derived Order rule (which stories), the "Arranged for study" rule (8), the progress key (read, resume, clear, damaged value, legacy key untouched), the Home and Library adapter (newer of story and person study), search, the entity data (every id in `personIds`, `communityIds`, `placeIds` resolves or is reported), the source scan (no typed Arabic, no typed ayah text).
- **Browser tests** (the chapter text is **synthetic**, from the existing mock): a complete story (Yusuf) and a pieced-together one (Adam and Iblis), each chapter, Previous/Next, the rail, Show all on a long chapter, "Read" marking and the resume point, the end page, Start again, the Compare drawer ("No description recorded yet."), entity sheets (person opens the page; place and event are inert), Save and Undo, the Home row and the Library slot after reading, the person page's progress, the loading, failed and offline-uncached states, the disabled Listen button, 375px and 44px, light and dark, keyboard (focus moves to the chapter title, Escape closes sheets), a link check that every story link from the person page, the directory and Home lands on a real page, and `quran-app-db` never opened.
- **Screenshots (prototype next to revamp):** a complete story chapter and the end page, a pieced-together story chapter (with the notice), at **1280 and 375, light and dark**; plus states: the Compare drawer, a person sheet, a place sheet, the loading, failed and offline-uncached chapter, Show all, the progress rail with read chapters, the directory. I will look at every pair I can and say which I only generated.
- **Docs:** phase doc, `docs/pages/story.md` (and `stories.md` if the directory is built), `docs/design/story-compare/README.md`, PROGRESS.md, CONTENT_TO_VERIFY.md (the prototype's chapter text not used; the "Arranged for study" sentence; episode summaries; the derived Order line).

## Open questions

1. **Directory.** Build a lean `/stories` directory in 7B (search, person filter, type menu, Saved, progress)? (Recommended: yes. Otherwise it stays on the "not rebuilt" page and the back links go to People.)
2. **Chapters.** Episodes are chapters; a story without episodes gets one chapter per primary passage; story-level lessons on the end page, not per chapter. OK?
3. **Text source.** The cached surah through the reader's loader (one request per surah, shared with the reader), not one request per ayah. OK?
4. **Order line.** Derived only for single-surah stories with ascending chapters (4 episodic stories plus the flat ones), none for stories that jump between surahs. Or no Order line at all, since the data names none? (Recommended: derived, as stated, labelled as computed from the passages.)
5. **"Arranged for study" sentence.** It is wording of ours; use it as drafted, or give me the sentence? Shown for the 8 stories whose status is not `quran_complete`.
6. **Episode summaries.** They are data (written for the app, not from a source, and none of the 38 has a passage description). Show them as "Summary" with the story's source note below, or label them "Written for this app" on each? (Recommended: a single line under the header: "Chapter summaries are written for this app; the Qur'an text is the source.")
7. **Home row.** Whichever is newer of story progress and person study, as in section 8? (Recommended: yes.)
8. **"Read" rule.** A chapter counts as read when you reach its end or press Next (never by time)? (Recommended: yes.)
9. **Long chapters.** First 10 ayahs then **Show all N ayahs**? (Recommended: yes; the only chapters over 10 are the longer episodes and flat passages.)
10. **Audio assumption.** The Listen button is disabled with "Coming with the player" until 4B; 4B is not scheduled before 7B. OK?

## Risks

- The text needs the whole surah for each chapter; the long ones (2, 7, 11, 12, 18, 20, 26, 28) are the heaviest. Mitigated by loading one chapter at a time, the shared cache, and the skeleton; measured in the performance test at 4x CPU throttle.
- Stories whose episodes jump between surahs mean a chapter may need a different surah than the previous one (a new request per chapter).
- The episode summaries and the "Arranged for study" sentence are app-written text; flagged for review rather than hidden.
- Home and the Library change their second row and Story slot; tests lock both sources (person study and story progress) so neither breaks the other.

## Not part of 7B

Audio and Play all (4B), place, community and event pages (Phase 12), Referenced By, the image share card, the knowledge graph.
