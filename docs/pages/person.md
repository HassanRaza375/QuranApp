# Page: Person

- Route (legacy, kept): `/persons/[id]` with `?tab=passages` or `?tab=family` (the default is Story).
- Phase: 7A
- Prototype section: `d-page-person` / `m-page-person`
- Offline level: A. Bundled data; no request.
- Indexable: no.

## Purpose

Read about one person or group: who they are, the stories and passages they are in, and how they are related to others, with the source of each claim visible.

## Layout

- A back link ("Prophets & People") and **Save** (`aria-pressed`; writes `person:<id>`, Undo on removal).
- A **resume banner** (only when the person is saved and the study record holds a meaningful place): "Resume where you left off: Direct Mentions, Ta-Ha 20:9" with **Resume** (switches to that tab) and Dismiss.
- The header: the Arabic name (text, from the data), the name, the Arabic honorific when the data has one, "Also known as" (alternate names), and chips: the category; **"Group, not individually named"** for a group; the prophetic status (see below); the counts of direct mentions and related passages; the chronology (dashed when not established).
- Tabs (in-page buttons with `aria-current`; `?tab=`): **Story**, **Passages**, **Family & notes**. One `h1` (the name).
- **Story:** Overview (the short description, **More detail** for the long one, the themes); **Stories** (the stories whose `personIds` include this person: title, the legacy kind label, a two-line description; a notice says the story reader is still being moved; a person in no story gets "No story has been written for <name> yet. Their passages are listed under Passages."); **Key lessons** (text and references; each reference opens the ayah in the reader).
- **Passages:** **Direct mentions** (every mention, grouped by surah, each a link to the ayah); **Related passages** with **Grouped by surah** or **Story view** (the legacy story order), each passage with its title, range, count, description and **Read passage**. No Play or Play all until the player (Phase 4B).
- **Family & notes:** **Family & relationships** as sentences ("Ibrahim (AS) is the father of Isma'il (AS)") with the source chip (Qur'an, Authentic Hadith, Traditional account; a dashed border and the status when not verified) and a link to the other person's page; **Scholarly & traditional notes** (sources with a type chip, then the status notes). No "Referenced by" until Phase 12.

## Prophetic status

The chip is the legacy label for the person's type, verbatim: Prophet, Messenger, Prophet · Messenger. Any other type (a quranic person, a title-based person, a group) shows no chip. The status notes (for example that Adam's status rests on tradition, or that Dhul-Kifl's is debated) are shown under Family & notes, as the data states them.

## Relationship sentences

In the data a relationship on a person describes **that person's own role** toward the related one. The sentence is built from that ("X is the father of Y"). Types the data gives no direction for (spouse, contemporary, opponent, supporter, teacher and student, other) are shown without a verb ("A and B: opponents"). Three entries were written the other way round (`isa>maryam`, `maryam>isa`, `maryam>maryammother`); a small table in `app/lib/people.ts` reads them correctly, and a test checks every parent and ancestor pair states the same fact from both sides.

## The study record

`quran:persons-study:v1` keeps its legacy shape. Each tab is written as one of the six legacy section ids: Story as `overview`, Passages as `direct-mentions` (`related-passages` once the related view has been used), Family & notes as `family`. Opening an ayah records its surah and ayah; the view choice records `passageView`. Home's second resume row and the Library's Story slot read it unchanged.

## States

| State | What shows |
| --- | --- |
| Unknown id | "Person not found", the id, and a link back |
| No mentions | "No direct name mentions are catalogued for this person yet." |
| No related passages | "No related passages are catalogued for this person yet." |
| No relationships | "No family or other relationships are catalogued for this person yet." |
| No story | The sentence above |
| Story reader not rebuilt | One notice; each story row links to `/stories/<id>`, which shows the "not rebuilt yet" page (one flag, `STORIES_READY.reader`, flips it) |

## Images

None. No depictions, silhouettes or avatars; the Arabic name appears as text only.

## Tests

`tests/people.test.ts` and `e2e/people.spec.ts`.
