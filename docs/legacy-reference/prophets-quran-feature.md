# Prophets & Qur'anic Persons Feature Specification

## Status

Product/design specification for implementation in the existing Quran web application.

## 1. Feature goal

Add a dedicated **Prophets & People of the Qur'an** experience that lets users:

- Browse all supported Qur'anic prophets and persons.
- See prophets and other persons as cards.
- Filter the directory by category.
- Search by name, Arabic name, description, themes, category, and Qur'an references.
- Open a dedicated detail experience for a person.
- View **Direct Mentions**: every Qur'anic ayah where the person's name/title is explicitly mentioned.
- View **Related Passages**: manually curated Qur'anic passages relevant to the person's story/context, even where the name is not repeated.
- Switch Related Passages between **Grouped by Surah** and **Story View**.
- Jump directly to an exact ayah/passage in the existing Quran reader.
- Listen to individual ayahs and play relevant passages sequentially.
- View family relationships and related people.
- Save a person and resume study from the saved state.
- Optionally switch from directory view to a **Prophetic Timeline**.

The feature should reuse existing Quran reading, translation, audio, Tafsir, bookmark, search, routing, and provider/service infrastructure wherever possible.

---

## 2. Scope: who is included

### Initial scope

Include:

1. **All prophets explicitly named in the Qur'an**.
2. **Other Qur'anic persons/figures** represented by personal name or distinctive identity/title.

The initial dataset is broader than the traditional list of 25 named prophets.

### Future expansion

A later phase may include **unnamed but individually identifiable persons** when the Qur'an provides enough information to distinguish them as individuals.

Examples of initial non-prophet figures may include named or distinctive figures such as:

- Luqman
- Maryam
- Pharaoh
- Haman
- Qarun
- Talut
- Jalut
- Abu Lahab
- Queen of Sheba / Bilqis where the chosen source model supports the identity
- Other distinct Qur'anic figures

Do not label every Qur'anic person as a prophet.

---

## 3. Religious/content accuracy principles

This feature is a Qur'an-focused reference tool. Accuracy and source separation are higher priority than filling every field.

### Source hierarchy

Information must be classified as:

- **Qur'an** — directly established by Qur'anic text.
- **Authentic Hadith** — supported by an accepted authentic hadith source.
- **Traditional account** — found in recognized Islamic historical/traditional material.
- **Chronology uncertain** — exact placement is not established.
- **Identity uncertain** — identification is disputed or not explicitly established.

### Rules

- Exact Qur'an references must be verified before publication.
- Do not turn traditional chronology into a Qur'anic fact.
- Do not infer a prophet/person's identity merely because later tradition associates them with a Qur'anic passage.
- Where chronology is uncertain, show the uncertainty.
- Where a relationship is based on tradition rather than the Qur'an, label its source/status.
- Key Lessons should be derived specifically from relevant Qur'anic passages for V1.
- Do not silently manufacture dates, genealogies, titles, or relationships.

---

# 4. Main landing page

## Header / hero

Title:

**Prophets & People of the Qur'an**

Suggested subtitle:

> Explore the prophets and people mentioned in the Qur'an, their references, stories, and relationships.

Tone: informative, respectful, and concise.

## Primary view switch

Immediately below the introduction:

- **Browse People**
- **Timeline**

Default: **Browse People**

Timeline is a secondary view.

## Search

Full-text search across:

- English/display name
- Arabic name
- Alternate names
- Description
- Themes
- Categories
- Surah references
- Ayah references

Search should support partial matches and Arabic text.

## Filters

Default filter: **All**

Categories:

- All
- Prophets
- Women
- Men
- Rulers & Leaders
- Companions
- Families & Relatives
- Other Persons

Each person has:

- One **primary category**
- Zero or more **secondary categories**

Filtering should use both primary and secondary categories.

Special cases must be explicitly modeled so category labels do not imply an incorrect religious status.

---

# 5. Person cards

Each card should remain visually clean while exposing useful metadata.

Required fields:

- Display name
- Arabic name
- Honorific/status where applicable
- Primary category
- Short description
- Direct Qur'an mention count
- Related passage count
- Key themes
- Chronological position where reliably known
- Chronology status when uncertain

Examples:

**Nuh (AS)**  
Arabic: نوح  
Category: Prophet  
Direct mentions: 43  
Related passages: 7  
Themes: Patience, Da'wah, Flood, Tawhid

### Honorific display

On cards/lists:

- `Adam (AS)`
- `Nuh (AS)`
- `Maryam (AS)`
- `Muhammad (ﷺ)`

On the detail page, use the full appropriate Arabic honorific where appropriate:

- `عليه السلام`
- `صلى الله عليه وسلم`

Do not attach prophetic honorifics to non-prophets.

---

# 6. Person detail experience

## Responsive behavior

### Desktop

Use a dedicated route/page, for example:

`/quran/persons/nuh`

### Mobile

Use an optimized detail presentation that can behave like a drawer/modal where appropriate, while retaining a stable deep-linkable route.

The person page must remain shareable/bookmarkable.

## Detail page structure

Recommended order:

1. Header / identity
2. Concise overview
3. Expandable detailed information
4. Key Lessons
5. Direct Mentions
6. Related Passages
7. Family & Relationships
8. Scholarly / Traditional Notes
9. Optional timeline context
10. Navigation/actions

---

# 7. Overview section

Show a concise summary immediately.

Example:

> **Nuh عليه السلام**
>
> A prophet of Allah who called his people to worship Allah alone and remained steadfast despite prolonged rejection.

Metadata may include:

- Category
- Prophet/Messenger status
- Direct mention count
- Related passage count
- Chronological position/status

## Expandable detailed information

Provide additional information without overwhelming the initial screen.

Detailed content must be source-aware.

---

# 8. Prophet/Messenger status

For prophetic figures, support these states:

- Prophet (Nabi)
- Messenger (Rasul)
- Prophet & Messenger
- Status not explicitly specified

Do not automatically classify every prophet as both unless the chosen reliable source supports the classification.

The UI may show:

> Musa (AS)  
> Prophet · Messenger

---

# 9. Direct Mentions

## Definition

A Direct Mention is an ayah in which the person's name/title is explicitly present.

The authoritative dataset should contain the exact references.

Example:

> Surah Hud — 11:25

The feature must not confuse direct name mentions with story passages.

## UI

Group direct mentions **by Surah**.

Example:

```text
Direct Mentions

Surah Hud (11)
  11:25
  11:32
  11:36
  11:42
  ...

Surah Al-Anbiya (21)
  21:76
  ...
```

Each Surah group is expandable/collapsible.

For people with many references, do not render an unnecessarily long unstructured list.

## Ayah actions

Each ayah/reference should provide:

- Arabic text
- User's selected translation
- Optional additional translations
- Surah/Ayah reference
- Audio
- Tafsir action where available
- Bookmark action
- **Read in Quran →**

`Read in Quran →` must open the exact ayah in the existing Quran reader.

---

# 10. Translation behavior

Use the existing translation settings.

Default:

- Arabic always available.
- User's selected translation shown.
- Additional translations available through an expand/selection mechanism.

Do not create a separate translation preference system for this feature.

---

# 11. Related Passages

## Definition

Related Passages are manually curated Qur'anic ranges relevant to a person's story or discussion, including verses where the person's name is not repeated.

Example:

```text
Nuh (AS)

Related Passages

Surah Hud (11)
11:25–49
Story of Nuh, the Ark, his son, the Flood, and the landing.

Surah Al-Mu'minun (23)
23:23–30
Nuh's mission and the Ark.
```

## Source of truth

Use a **hybrid discovery model**:

1. Manually curated ranges are authoritative.
2. Automatic search/discovery may identify candidate verses.
3. Automatically discovered candidates must be reviewed/verified before being promoted to authoritative Related Passages.

## Views

Provide two modes:

### Grouped by Surah

Group passages by Surah for reference/navigation.

### Story View

Present curated passages as a coherent narrative sequence.

Story View must not imply that verses from different Surahs form one continuous revealed passage; it is a study/navigation presentation.

Each passage should show:

- Surah
- Ayah range
- Short context label
- Read Passage action
- Audio/play action where supported
- Optional Tafsir action

---

# 12. Audio

Use the existing Quran audio architecture.

Support:

### Individual ayah

Existing per-ayah playback.

### Play all

A person page may offer:

**▶ Play all passages**

Playback should move through the selected relevant ayahs/ranges sequentially.

Do not build a second independent audio architecture.

---

# 13. Key Lessons

Each person may have a **Key Lessons** section.

For V1:

- Lessons must be derived from the relevant Qur'anic passages.
- Avoid presenting personal interpretation as revelation.
- Keep lessons concise and study-oriented.
- Where a lesson is interpretive, phrase it appropriately rather than claiming it is a direct quotation from the Qur'an.

Example for Nuh (AS):

- Patience in calling people to Allah
- Steadfastness despite rejection
- Reliance upon Allah
- Obedience to Allah's commands

---

# 14. Family & relationships

Include a **Family Tree visualization** where relationships are sufficiently established.

Also include a related-people section.

Possible relationship types:

- Father
- Mother
- Son
- Daughter
- Brother
- Sister
- Spouse
- Descendant
- Ancestor
- Contemporary
- Supporter
- Opponent
- Teacher/student where reliably established
- Other

## Source-aware relationships

Every relationship should carry a source/status.

Example:

```text
Ibrahim (AS)
  ├── Isma'il (AS) — Son — Qur'an
  ├── Ishaq (AS) — Son — Qur'an
  └── Lut (AS) — Related person — source/status required
```

Do not display disputed relationships as unquestioned Qur'anic facts.

---

# 15. Prophetic Timeline

Timeline is a **secondary view** accessible from the main landing page.

## Main timeline

Prophets form the primary chronological sequence.

Example:

```text
Adam (AS)
   ↓
Idris (AS)
   ↓
Nuh (AS)
   ↓
Hud (AS)
   ↓
Salih (AS)
   ↓
Ibrahim (AS)
   ↓
...
   ↓
Isa (AS)
   ↓
Muhammad (ﷺ)
```

## Related-person branches

Related Qur'anic persons appear as **expandable branches** from relevant prophets.

Example:

```text
Musa (AS)
  ├── Harun (AS)
  └── Pharaoh
```

This prevents the main timeline from becoming visually overloaded.

## Chronology layers

Support two clearly distinguished chronology states:

### Established / strong chronology

Use only where chronology is reasonably supported.

### Traditional / uncertain chronology

May use recognized Islamic traditional chronology, but label it clearly.

Possible labels:

- `Chronology uncertain`
- `Traditional chronology`
- `Approximate`
- `Historical identification disputed`

Never make an uncertain date look as authoritative as a verified Qur'anic reference.

---

# 16. Search

The feature should have a dedicated search index or searchable data layer.

Search fields:

```text
name
arabicName
alternateNames
description
themes
primaryCategory
secondaryCategories
propheticStatus
surahReferences
ayahReferences
```

Search results should return the person card and relevant matched metadata.

If a user searches an exact reference such as `11:25`, the corresponding person/reference may be surfaced.

---

# 17. Bookmarking / saved study

Users can bookmark:

1. Individual ayahs.
2. An entire person/profile.

## Saved person state

When a person is saved, retain:

- Person/profile ID
- Last viewed section:
  - Overview
  - Direct Mentions
  - Related Passages
  - Story View
  - Relationships
  - Notes where applicable
- Last viewed ayah/passage
- Enough state to resume the study experience

Reuse the existing bookmark/saved architecture rather than creating a disconnected storage system.

---

# 18. Data architecture

Do **not** hardcode complete Qur'an Arabic text and translations into the Prophet/Person dataset.

Recommended architecture:

```text
Person Dataset
   |
   ├── Person metadata
   ├── Direct ayah references
   ├── Related passage ranges
   ├── Relationships
   ├── Themes
   └── Source/status metadata
             |
             v
     QuranContentService
             |
       +-----+-----+
       |     |     |
     Arabic Translation Tafsir
       |
     Audio
```

The project already has a provider/service abstraction for Quran content. Reuse it.

## Person dataset should store references

For example:

```ts
type QuranReference = {
  surahNumber: number;
  ayahNumber?: number;
  ayahStart?: number;
  ayahEnd?: number;
  contentId?: string;
};
```

Prefer a stable Quran content/ayah ID when the existing Quran provider supplies one, while retaining human-readable Surah/Ayah fields.

---

# 19. Suggested person schema

```ts
type QuranPerson = {
  id: string;

  name: string;
  arabicName: string;

  alternateNames?: string[];

  primaryCategory:
    | "prophet"
    | "woman"
    | "man"
    | "ruler_leader"
    | "companion"
    | "family_relative"
    | "other";

  secondaryCategories?: string[];

  personType:
    | "prophet"
    | "messenger"
    | "prophet_and_messenger"
    | "quranic_person"
    | "title_based_person";

  honorific?: {
    short?: string;
    arabic?: string;
  };

  shortDescription: string;

  detailedDescription?: string;

  themes?: string[];

  chronology?: {
    label?: string;
    order?: number;
    dateFrom?: string;
    dateTo?: string;
    status:
      | "strong"
      | "traditional"
      | "uncertain"
      | "unknown";
  };

  directMentions: QuranReference[];

  relatedPassages: RelatedPassage[];

  relationships?: PersonRelationship[];

  keyLessons?: KeyLesson[];

  sources?: SourceReference[];

  statusNotes?: string[];
};
```

### Related passage

```ts
type RelatedPassage = {
  id: string;

  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;

  title?: string;
  description?: string; 

  storyOrder?: number;

  source: "quran";
  verificationStatus: "verified";
};
```

### Relationship

```ts
type PersonRelationship = {
  personId: string;
  relationshipType: string;

  sourceType:
    | "quran"
    | "authentic_hadith"
    | "traditional_account";

  verificationStatus:
    | "verified"
    | "traditional"
    | "uncertain";
};
```

### Key lesson

```ts
type KeyLesson = {
  text: string;

  quranReferences: QuranReference[];

  status: "quran_derived";
};
```

### Source

```ts
type SourceReference = {
  type:
    | "quran"
    | "authentic_hadith"
    | "traditional_account";

  citation: string;

  note?: string;
};
```

---

# 20. Routing

Recommended routes:

```text
/quran/persons
/quran/persons/:personId
/quran/persons/timeline
```

Potential query state:

```text
/quran/persons?category=prophet
/quran/persons?search=nuh
/quran/persons?view=timeline
```

Exact route naming may be adjusted to match the existing application's routing conventions.

---

# 21. Components

Suggested component structure:

```text
ProphetsPersonsPage
├── PersonHero
├── PersonViewToggle
│   ├── BrowsePeopleButton
│   └── TimelineButton
├── PersonSearch
├── PersonCategoryFilters
├── PersonGrid
│   └── PersonCard
│
└── PropheticTimeline

PersonDetailPage
├── PersonHeader
├── PersonOverview
├── PersonDetailsAccordion
├── KeyLessons
├── DirectMentions
│   └── SurahReferenceGroup
│       └── AyahReferenceCard
├── RelatedPassages
│   ├── SurahGroupedView
│   └── StoryView
├── FamilyTree
├── RelatedPeople
└── ScholarlyTraditionalNotes
```

Reuse existing Quran components wherever possible.

---

# 22. UI/visual design

Match the existing Quran application while giving the feature a subtle visual identity.

Preserve the existing design language:

- Existing colors
- Existing typography
- Existing spacing scale
- Existing card system
- Existing rounded surfaces
- Existing Arabic typography
- Existing responsive patterns

The feature may introduce subtle visual differentiation through:

- Prophet/person category badges
- Timeline markers
- Relationship connectors
- Qur'an-reference styling
- Theme chips

Do not create a completely separate design system.

---

# 23. RTL and Arabic

The feature must fully support Arabic.

Requirements:

- Arabic names render correctly.
- Arabic text uses the application's Arabic/Qur'an font system.
- Mixed Arabic + English layouts must not break.
- Surah/Ayah references remain readable in RTL.
- Family-tree relationships must remain understandable in RTL.
- Search must support Arabic names and Arabic input.
- Direction should be derived from content where appropriate.

---

# 24. Accessibility

Required:

- Keyboard-accessible cards and filters.
- Visible focus states.
- Proper button labels.
- Semantic headings.
- Accessible expandable Surah groups.
- Accessible timeline nodes.
- Screen-reader-friendly relationship labels.
- Do not rely on color alone to communicate chronology/source status.
- Audio controls must have accessible labels.

---

# 25. Loading/error/empty states

### Loading

Use skeleton cards and content placeholders.

### Empty search

Example:

> No Qur'anic persons found for “xyz”.

Provide a clear way to reset the search/filter.

### Data/content failure

Do not fabricate references.

Show:

> Qur'anic references could not be loaded. Please try again.

### Missing supplementary information

Show the verified Qur'anic content without inventing the missing biography/chronology.

---

# 26. Performance

- Load person metadata efficiently.
- Do not fetch every person's complete Qur'an text on initial page load.
- Fetch verse content when a person/detail section is opened.
- Cache Quran content using the existing caching strategy.
- Lazy-load large related passage sets.
- Keep the initial directory responsive even with hundreds of people.
- Timeline rendering should be optimized for mobile.

---

# 27. Data population requirements

The implementation must ultimately provide a verified dataset containing:

### Prophets

All prophets explicitly named in the Qur'an, including the standard 25 named prophets.

### Other persons

The initial directory should also contain relevant named/title-based Qur'anic persons as defined by the product dataset.

For every person, where applicable:

- Display name
- Arabic name
- Category
- Primary/secondary categories
- Prophet/Messenger status
- Description
- Themes
- Direct Qur'an references
- Related Qur'an passage ranges
- Relationships
- Key Lessons
- Chronology status
- Source/status notes

## Dataset quality rule

A person/reference must not be added merely because an external list claims it exists.

Each Qur'an reference must be verified against the actual Qur'an content/provider.

---

# 28. Verification workflow

Recommended content workflow:

```text
Candidate person/reference
        ↓
Verify identity
        ↓
Verify exact Qur'an references
        ↓
Separate direct mentions from related passages
        ↓
Curate related passage ranges
        ↓
Verify relationships
        ↓
Assign source/status
        ↓
Review Arabic/display name
        ↓
Publish dataset
```

Automatic discovery can assist the workflow but must not replace human verification for the authoritative dataset.

---

# 29. Important distinction: direct mention vs story

Example concept:

**Nuh (AS)**

Direct Mentions:
- only ayahs where `Nuh` is explicitly mentioned.

Related Passages:
- complete relevant passages such as the Nuh narrative in Surah Hud, even where `Nuh` is not repeated in every ayah.

This distinction must be maintained throughout the UI and data model.

---

# 30. Timeline content rules

The timeline must not imply an exact chronology where none exists.

Use visual/status indicators:

- Strong chronology
- Traditional chronology
- Uncertain
- Unknown

For prophets whose exact date is unknown, show relative sequence instead of fabricated dates.

Example:

> Nuh (AS)  
> Early prophetic period  
> **Exact date unknown**

---

# 31. Future expansion

Design the data model so future releases can add:

- Unnamed identifiable Qur'anic individuals
- More detailed source citations
- Scholarly commentary
- Additional languages
- Advanced Qur'an topic/person search
- Cross-person comparison
- Lessons/study plans
- Prophetic family-tree exploration
- Timeline filtering
- Historical/geographical maps where appropriate

These should not require redesigning the core person/reference schema.

---

# 32. Implementation phases

## Phase 1 — Foundation

- Person data model
- Verified prophet/person dataset structure
- Directory page
- Cards
- All filter
- Category filters
- Search
- Basic detail route

## Phase 2 — Qur'an integration

- Direct Mentions
- Related Passages
- Surah grouping
- Story View
- Quran reader deep links
- Existing translation integration
- Existing Tafsir integration
- Existing audio integration

## Phase 3 — Study experience

- Key Lessons
- Bookmark person
- Resume study state
- Family Tree
- Related People
- Scholarly / Traditional Notes

## Phase 4 — Timeline

- Prophetic timeline
- Strong/traditional chronology states
- Expandable related-person branches
- Timeline → person navigation

## Phase 5 — Quality and polish

- Arabic/RTL review
- Accessibility
- Mobile optimization
- Performance
- Content verification
- Search quality
- Error/empty states
- Analytics if already supported by the app

---

# 33. Acceptance criteria

The feature is complete when:

- [ ] All supported Qur'an-named prophets are represented.
- [ ] The initial non-prophet Qur'anic-person dataset is represented according to the defined scope.
- [ ] All cards show the required metadata.
- [ ] All is the default filter.
- [ ] Category filtering works.
- [ ] Search works across names, Arabic names, descriptions, themes, categories, and references.
- [ ] Every person has a dedicated deep-linkable detail page.
- [ ] Direct Mentions contain only verified explicit name/title mentions.
- [ ] Direct Mentions are grouped by Surah.
- [ ] Related Passages are manually curated and verified.
- [ ] Related Passages support both Surah Grouped and Story View.
- [ ] Exact ayahs can be opened in the existing Quran reader.
- [ ] Arabic and the user's selected translation are displayed.
- [ ] Additional translations can be expanded.
- [ ] Existing audio is reused.
- [ ] Play All is supported for relevant passages.
- [ ] Existing Tafsir functionality is reused.
- [ ] Existing ayah bookmarks are reused.
- [ ] Person profiles can be bookmarked.
- [ ] Saved person state supports resume.
- [ ] Family Tree is available where relationships are sufficiently established.
- [ ] Related people are displayed with relationship/source status.
- [ ] Timeline is an optional secondary view.
- [ ] Prophets form the main timeline.
- [ ] Related persons appear as expandable branches.
- [ ] Strong and traditional/uncertain chronology are visually distinguished.
- [ ] Qur'anic facts are separated from traditional/historical information.
- [ ] No uncertain information is presented as established Qur'anic fact.
- [ ] Mobile and desktop experiences are responsive.
- [ ] RTL/Arabic behavior is correct.
- [ ] Accessibility requirements are met.
- [ ] No duplicate Quran/audio/translation infrastructure is introduced.

---

# 34. Product principle

The feature should feel like a **Qur'an study index**, not a generic historical encyclopedia.

The Qur'an and its verified references are the center of the experience.

The preferred hierarchy is:

**Person → Qur'anic references → Context → Lessons → Relationships → Supplementary traditional information**

not:

**Biography → historical speculation → Qur'an references**

The implementation should always preserve this distinction.
