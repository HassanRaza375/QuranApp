# Prophets & People next to the prototype (Phase 7A)

`<device>-<theme>-<view>.jpg` puts the prototype (left) next to the revamp (right): desktop 1280px, mobile 375px, views `browse`, `timeline` and `person` (Yusuf), light and dark = **12 pairs**. `state-<name>-<device>-<theme>.jpg` are revamp-only state shots at 1280 light and 375 dark: no-match, saved-empty, category-menu, timeline-branches-open, person-more-detail, person-no-story, person-group, person-passages, person-story-view, person-family-traditional, person-family-reversed-entries, person-resume-banner, person-stories-notice, person-not-found (14 states x 2 = **28**). 40 images in all. Regenerate with `node scripts/screenshots/phase-07a-people.mjs` (production build, Node 22).

The revamp is the production build with the clock fixed at 15 Oct 2026; nothing is mocked because the pages use bundled data only.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | "This prototype shows 16 of the 59 entries"; 16 typed people, descriptions, mention counts and chronology lines | All 59 entries from the legacy data; counts are the real list lengths; chronology is the data's label with its status in words | Real data |
| 2 | "Story · 4 chapters" tag on Adam and Yusuf | "In N stories" for the 44 people who are in a story (from `personIds`); no chapter counts (that is 7B's story design) | Approved |
| 3 | Category menu only | Category menu plus **Saved**, **Reset** and a live count; the state is in the URL | Intentional |
| 4 | Search by name, Arabic or theme | The same, plus alternate names and the short description; not passage text or an ayah reference | Approved |
| 5 | A flat 13-person Timeline ("13 of 23 shown") | The legacy Timeline: the whole mainline in order, "N related people" under each prophet (opens, `aria-expanded`), and a final group so none of the 59 is hidden | Approved |
| 6 | Dashed circle for traditional chronology | A legend with a solid dot (established) and a dashed dot (traditional, uncertain, unknown); the chip says it in words too | Intentional |
| 7 | Person page: Story tab built for Yusuf and Adam (chapters, "The story of Yusuf") | A list of the stories that involve the person with the legacy kind label, behind a "story reader is still being moved" notice; the chapter journey is Phase 7B | Approved |
| 8 | Honorific typed ("عليه السلام" for every prophet) | The data's own `honorific.arabic`, shown only when the data has one | Real data |
| 9 | Passages tab with Play on every passage; "Direct mentions" as a few chips | Every mention as a link (grouped by surah); Read passage; **no Play or Play all** until Phase 4B; Grouped by surah / Story view | Approved |
| 10 | Family rows with a single "Qur'an" chip and labels like "Adam's descendant: Isa" | Full sentences ("Ibrahim (AS) is the father of Isma'il (AS)") with the source on each; dashed border for traditional entries; the three entries the data wrote the other way round are read correctly | Approved |
| 11 | "Referenced by" list (typed) | Left out until Phase 12 | Approved |
| 12 | One "Prophets" chip | The category chip and the legacy status chip ("Prophet", "Prophet · Messenger") as separate chips, so a prophet shows two similar chips; chips for Group, counts and chronology | Intentional |
| 13 | Resume card in the Story tab | The legacy resume banner ("Resume where you left off: ...") for saved people, with Resume and Dismiss | Intentional |
| 14 | Mini player always shown | Hidden until something plays | Intentional for now |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the desktop light Browse pair, the desktop light Timeline pair, the mobile dark Person pair. **Generated but not examined one by one:** the other nine pairs and all 28 state shots (the states are exercised by the browser tests, which check their text and links).
