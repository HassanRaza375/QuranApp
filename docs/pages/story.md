# Page: Story reader

- Route (legacy, kept): `/stories/[id]` with `?chapter=<n>` (1-based) or `?chapter=end`. An invalid chapter opens chapter 1; an unknown id says "Story not found".
- Phase: 7B
- Prototype section: `d-page-story` / `m-page-story`
- Offline level: A for the story data (bundled); B for the Qur'an text (the cached surah, as in the reader).
- Indexable: no.

## Purpose

Read one of the Qur'an's 21 narratives a chapter at a time, with the Qur'an text in the page, and pick up where you left off.

## Layout

- A back link ("Stories") and **Save** (`story:<id>`, the legacy key; Undo on removal).
- The header: the Arabic title (text), the title (the one `h1`), alternate titles, chips (the story type, the legacy narrative status, "N chapters"), the **Order** line where the data supports it, the **"Arranged for study"** notice where it applies, and one line: "Chapter summaries are written for this app; the Qur'an text is the source."
- A **Continue banner** ("Continue where you left off: Chapter 3") when you open the story without a chapter and have progress; Continue and Dismiss.
- A **progress rail** (only for stories with more than one chapter): numbered buttons, the read chapters ticked, the current one marked; each button is named ("Chapter 3: <title>, read").
- **A chapter:** the eyebrow "Chapter n of N", the title (focus moves here when the chapter changes), "Surah 12:21–35 · 15 ayahs", the **summary** labelled "Summary (written for this app)", a visible **Listen to this chapter** button that is `aria-disabled` with the visible reason "Playing single ayahs arrives soon", the **Qur'an text**, **Also told in / Compare tellings** (story level), and Previous and Next (the last Next reads "Finish the story").
- **The end page:** "The end of the story", the story's **Outcome**, **What the Qur'an stresses** (the story's lessons with the legacy basis label and linked references), **Continue with** (the related stories), Back to Stories, **Start again** (clears this story's progress, with Undo) and Back to the last chapter.
- **In this story:** chips for the people, peoples and places the story names (each opens a sheet) and the events that name it (inert).
- **Notes on this story:** a collapsed section with the data's sources (type chip) and status notes.

## Where everything comes from

| Element | Source |
| --- | --- |
| Chapters | The episodes of the story (title, summary, its passage) or, for a story with no episodes, its primary passages (title, description). Nothing is split, merged or renamed. 11 stories have episodes (38 chapters), 10 do not (11 chapters) |
| Text | The cached surah in `quran-revamp-db` through the reader's loader (one request per surah, shared with the reader). Arabic with the verse marker and the translation chosen in Settings, with the reader's rules for layout, Arabic size and "translation off" |
| Order | Computed from the passages: only for a story whose chapters are all in one surah and ascend ("Order: the surah's own sequence (Yusuf 12:4–101)"); none otherwise |
| Arranged notice | Shown for every story whose status is not "Fully told in the Qur'an" (8 stories) and for the `nuhflood` override (`ARRANGED_OVERRIDES`, pending your decision), with the wording "This story is assembled from passages in several surahs, in an order chosen for reading." (flagged for review) |
| Lessons | The story's lessons (story level; the data does not say which chapter they belong to) |
| Also told in, Compare tellings | The story's supporting passages (13 across 8 stories) and its primary passages: reference, ayah count and the data's description; "No description recorded yet." where none exists. No comparison is written |

## Long chapters

The first **8** ayahs show, then **Show all N ayahs** (a button that expands in place and keeps focus, with `aria-expanded`); **Show fewer** collapses. A chapter of 8 or fewer shows everything. The longest chapter is 44 ayahs.

## Progress

`quran:story-progress:v1` (new, additive): `{ v: 1, stories: { <id>: { chapter, read: [..], updatedAt } } }`. Opening a chapter records it as where you are; it counts as **read** only when its end is reached (after the text is on screen) or Next is pressed, never by time. No streaks, no counts of days, no badges: quiet chapter dots and a resume point. `quran:persons-study:v1` is untouched.

Home's second resume row and the Library's Story slot show whichever is newer, the latest story progress or the latest person study (a tie goes to the story). The Library slot has a clear button for a story's progress (with Undo); a person's study is not cleared there.

## Entity sheets

A person opens a sheet (Arabic name as text, name, category, short description) with **Open page** to `/persons/<id>`. A people-group or a place opens a sheet with the Arabic name, name, type, short description and the legacy identification label, and says "Its own page arrives in a later phase." with **no link**. Events are inert text labelled "Event" with a note that events arrive later. No images.

## States

| State | What shows |
| --- | --- |
| Loading text | A skeleton the height of the chapter |
| Failed, online | "Couldn’t load this surah. Check your connection and try again." and Retry (a failed load never marks a chapter read) |
| Not saved, offline | "This surah isn’t saved on this device yet. Connect once to read it." and Retry; the rest of the page works |
| One chapter | No rail; "1 chapter"; Next reads "Finish the story" |
| Unknown id | "Story not found" and a link back |
| Listen | Visible, disabled, with its reason |

## Images

None. No depictions, silhouettes or avatars.

## Tests

`tests/stories.test.ts` and `e2e/stories.spec.ts`; see `docs/phases/phase-07b-story.md`.
