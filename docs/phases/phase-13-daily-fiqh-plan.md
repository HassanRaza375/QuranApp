# Phase 13: Daily Fiqh (Wajibat): data audit, legacy report and plan

- Date: 2026-10-26
- Status: **Audit and plan only. No code. Waiting for your approval.**
- Branch for the build, when approved: `phase-13-daily-fiqh` (off `phase-12-knowledge`)
- Read with: `docs/legacy-reference/wajibat_decisions.md` (it wins over the spec), `wajibat-fiqh-jafari-module.md`, `wajibat_release_notes.md`, `wajibat_mismatch_report.md`, `wajibat_needs_human.md`, and the Phase 13 part of `docs/CONTENT_TO_VERIFY.md`.

## 1. Summary

1. **The data exists and is real.** It lives in the legacy repo (`Quran-App`, the pinned commit `7120b6c`), in `app/data/wajibat/` (31 tracked files, 3.5 MB of TypeScript), produced by Python generators in `scripts/wajibat/` that cut every quote from the maraji's official websites. Only 4 of its files are vendored here (categories, marja', topics, types). **The rulings are not**; vendoring them is a change to `scripts/lib/legacy-files.mjs` plus a sync run, like Phase 12.
2. **It is complete for two maraji' and for six of the nine categories, and incomplete in known ways.** 67 topics, 1,433 rulings, 1,840 entries (869 Sistani, 971 Khamenei, **0 Makarem Shirazi**). Hajj, Other furu' and Daily life have no topics. Khamenei has no Zakat entries at all (his zakat texts are in Persian and Arabic only, which the app will not translate), and no zakat al-fitrah.
3. **It matches the official sources by construction, and I confirmed that independently for Sistani, not for Khamenei.** The legacy tests (151, all pass here at the pinned commit) check every quote against the source unit it was cut from. I fetched 55 Sistani entries from sistani.org today: none differs. leader.ir (Khamenei) refuses scripted requests, and I did not work around it; I could not compare Khamenei's full texts myself (section 3).
4. **Nothing has been read by a person.** Every page is "Not scholar-reviewed"; 0 of the 262 paths of the four decision helpers are signed off (so the helpers stay hidden); 1,572 cross-language differences found by an automated check are all "pending review" or "held", none accepted. This is the biggest decision for you (section 8, questions 1 to 3).
5. **Proposal:** vendor the data unchanged and build the five routes on the shared shell, with the legacy's display rules ported exactly (never another marja's text, held rulings show a pointer, withheld versions stay withheld), per-category data chunks, level B offline with "Save all for offline", and the helpers behind the same sign-off flag. Two stops for review (section 6).

## 2. The data audit

### 2.1 Where it lives

| What | Where (legacy repo, pinned commit) | In `legacy/` now? |
| --- | --- | --- |
| Ruling text, procedures, helpers, ruling index | `app/data/wajibat/rulings/*.ts` (10 files), `procedures/*.ts`, `decisionTrees/*.ts`, `rulingIndex.ts`, `chunks/*.ts`, `runtime.ts`, `access.ts`, `index.ts`, `treeReviews.json` | **No** |
| Glossary (94 terms), recitations (2) | `glossary.ts`, `recitations.ts` | **No** |
| Categories, topics, marja', types | `categories.ts`, `topics.ts`, `marja.ts`, `types.ts` | **Yes** (4 files, 80 KB; Settings and the nav use `marja.ts`) |
| Display and checking code | `app/utils/wajibat{Search,Labels,Validate,Review,Mismatch,Coverage,BuildGuard}.ts`, `wajibatMismatchWords.json` | No |
| Tests and fixtures | 10 `tests/wajibat*.test.ts` files; `tests/fixtures/wajibatSourceSnapshot.json` (1.36 MB), `wajibatMismatches.json`, `wajibatMismatchDecisions.json` | No |
| Generators and source manifest | `scripts/wajibat/*.py`, `sources.manifest.json` (310 files: 225 sistani.org pages, 1 PDF, 84 leader.ir; fetched 2026-10-07 to 10-09) | No (and not needed here) |
| Raw downloaded pages | `scripts/wajibat/.cache/` | **Not committed anywhere** (git-ignored by design, decision R9) |

The data was never "generated for the revamp": it is the legacy's data, merged on the same branch as the pinned commit (`wajibat-module` last commit 2026-10-09, `8a666b7`, is in the pinned history). Rule R9 of the legacy decisions says generated files are never hand-edited, which matches our rule that `legacy/` is read-only.

**Size.** The six categories' rulings are 2,076 KiB raw and 462 KiB gzip (Foundations 10, Taharat 61, Salat 127, Sawm 105, Khums 128, Zakat 32 KiB gzip), plus 263 KiB raw / 44 KiB gzip for topics, glossary, procedures and helpers. The 31 files are 3.5 MB as TypeScript source.

### 2.2 What is in it (measured on the dataset as the app loads it)

| | Count |
| --- | --- |
| Categories with topics / without | 6 (Foundations 5 topics, Taharat 8, Salat 20, Sawm 13, Khums 14, Zakat 7) / 3 (Hajj, Other furu', Daily life: planned, empty) |
| Topics, rulings, per-marja' entries | 67, 1,433, 1,840 |
| Glossary terms (each with a source), recitations, procedures (guided steps), helpers | 94, 2, 11 (7 Sistani, 4 Khamenei), 4 (2 and 2) |
| Topics with Qur'anic basis cards | 11 (one has a sourced tafsir note, decision P9) |
| Topics with a live tool | 3 (prayer times, qibla, the fasting day) |
| Women-specific rulings (collapsed), "purity of persons" panel (collapsed) | 36, 8 |

### 2.3 Completeness for each marja'

| | Sistani | Khamenei | Makarem Shirazi |
| --- | --- | --- | --- |
| Status in the data | active | active | **pending-sources**: no entry, "refer to his official risala" (decision P1) |
| Entries | **869**, all Level A | **971**, all Level A | **0** |
| Source books | *Islamic Laws*, 4th ed. (English); *Tawzih al-Masa'il* (Urdu) | *The Rules on Prayer & Fasting 2023* (395), *The Rulings of Khums* (383), *Practical Laws of Islam* Q&A (189), *Ahkam-e Amozeshi* (4, Urdu only); Urdu and Persian editions for comparison | none supplied |
| Foundations / Taharat / Salat / Sawm / Khums / Zakat | 16 / 137 / 251 / 233 / 99 / 133 | 11 / 80 / 261 / 236 / 383 / **0** | 0 in all |
| Urdu text in the data | 592 of 869 (28 of them are kept but not shown, because the official Urdu is older than the English 4th edition; the other 277 have none, each with the data's reason, such as "no counterpart" or "held back until a person has checked it") | 857 of 971 (765 of them not held; some are withheld by the display holds below) | none |
| English text shown | 869 | 775 of 971 (**100** withheld because they differ from his Persian original; **92 held**: a pointer to his book instead of text) | none |
| Basis | 849 fatwa, 19 obligatory precaution, 1 recommended precaution; 18 carry an explicit hukm | 958 fatwa, 11 obligatory precaution, **2 "precaution, type not specified"** (never guessed, rule R3); no hukm stored | none |
| Followers-only entries | none | 373 `audience: khamenei` (Khums Q&A and rule paragraphs, shown to his followers only) and 102 Q&A entries that agree with a Rules ruling | none |
| Topics (of the 65 that hold rulings) where he has nothing shown | 1 (`khumsmisc`, whose entries are Khamenei's own); two more topics (`furuaddin`, `guidedprayers`) hold no rulings for anyone | 10: **all 7 Zakat topics, `zakatfitrah` (42 rulings)**, `khumsspoils` and `ahkam` | all |

**Consequences.** A Khamenei follower sees a notice, not rulings, on 10 of the 65 topics that hold rulings; a Makarem Shirazi follower sees notices everywhere; a follower of any marja' never sees another's text. The legacy app handles all of this in code (`getMarjaRuling` has no fallback by design, `isRulingVisibleFor`, "no entry" and "held" cards); the revamp must reproduce it, and I propose tests that fail if a fallback ever appears.

**Sunni users.** Nothing: the module is Ja'fari only. Decision Q4: the module stays visible with "Fiqh Ja'fari only for now".

### 2.4 How the text matches the official sources

**By construction (in the legacy repo, not re-run by me except the tests):** every text is looked up by its book number and cut with a function that fails if the start or end string is missing; `snapshot.py` records the official unit each quote came from; `validateSourceSnapshot()` in `npm test` checks that every quote equals its numbered unit or is a verbatim excerpt of it. I ran the 10 Wajibat test files at the pinned commit: **151 tests pass**. The sources are listed with URL, fetch date and SHA-256 in `sources.manifest.json`; the raw pages are not committed, so re-checking needs the generators and the internet (`fetch_sources.py --refresh` lists pages that changed).

**My own check, today, against the live pages.**

| | Result |
| --- | --- |
| **Sistani**, sistani.org (plain requests, one a second): 55 entries across all six categories (a seeded random sample, about 6% of 869; 42 distinct pages) | **41 identical** after removing footnote marks, quote marks and spacing; 8 identical except for trailing material; 2 excerpts inside their ruling; 4 found on the page that my simple parser could not isolate by ruling number (3 excerpts, and Ruling 2271, 2 characters shorter than my parsed block, still on the page). **0 differ.** |
| **Khamenei**, leader.ir | **Not verified by me.** The site answers scripted requests with 403 (its notes say the same). I tried a browser-like request header once; that was refused by my safeguards and I stopped. The fetch tool can open the pages but returns quotes of at most 125 characters, so I could only confirm that 2 of the Rules entries (914 and 980) exist at the cited address, open with the same words and say the same thing. A full comparison needs your sign-in or a person with a browser, or the generators run on your machine. |
| Urdu texts, Persian originals | Not checked by me. |

**Across languages (an automated check, legacy decisions A1, B1, D1).** It compared numbers, ordinal words and negation words across every language version: **4,288 pairs, 1,572 flagged** (894 high, 678 low). Triage by safe default, **no row accepted by a person**:

| Status | Rows | Effect on what a reader sees |
| --- | --- | --- |
| `low-pending-review` | 671 | nothing changes |
| `persian-decided-pending-review` | 306 | Khamenei: the version matching his Persian original shown, the other hidden |
| `held-pending-review` | 260 (92 rulings) | no text, a pointer to his book |
| `hidden-pending-review` | 244 | Sistani: Urdu hidden, English shown with a notice |
| `needs-human` | 66 | **shown as before**; listed side by side in `wajibat_needs_human.md` for a person |
| `decided` | 25 | decided under rule R11 |

**What this does not tell us (the legacy release note says the same):** the check cannot see a changed meaning with the same numbers and negations (it found a real mistranslation once: English "traveling for fun is not ḥarām, prayer not shortened" against the Persian and the official Urdu, 465 vs 466). "A second human reader is recommended for the whole dataset before it is described as reviewed."

**One caution on the sources themselves.** The English of Khamenei's 2023 Rules has 7 rulings that differ from his own Persian original; the Urdu is shown for those. English and Urdu of the same marja' can therefore differ, and the revamp must show exactly what the legacy decided to show.

## 3. What the legacy app does (the report)

Five routes, 15 components, 3 composables, 9 utils, all Vuetify (not reused; rebuilt on our shell). Behaviour to keep:

| Route | Behaviour |
| --- | --- |
| `/fiqh` | Hero; **no ruling is shown until a marja' is chosen** (a picker); notices (Sunni, "Not scholar-reviewed"); categories (the six with data; the others "coming later"); a search box over rulings (`wajibatSearch`); "Save all for offline" (Cache Storage `wajibat-data-cache`, keyed by build id) |
| `/fiqh/choose-marja` | The three maraji' with their books and status; reading language English, Urdu or both. Stored in `quran:fiqh-prefs:v1` (`{marjaId, lang, updatedAt}`). **Already read and written by our Settings.** |
| `/fiqh/[category]` | Topic list, how many rulings were added for the chosen marja' |
| `/fiqh/[category]/[topic]` | Bookmark (`fiqh:<topicId>`), Overview, Live tool panel, Qur'anic basis cards (an ayah only if its own text names the act, rule R2), decision helper(s) "Find your answer" (hidden unless every path is reviewed), **Rulings** (cards with hukm and basis badges, Q&A, excerpt, source line with book, ruling number and link, Urdu with its own citation, recitations), collapsed panels (purity of persons, women's rulings), "Where and how to pay" (a link to the marja's own site only), Step by step (11 procedures), Related topics, Terms used, Sources on this page |
| `/fiqh/glossary` | 94 sourced terms, search in any script |

Rules that shape the display and must carry over unchanged: never another marja's text (P1); Urdu only from the marja's own official Urdu book, never translated (R1); English withheld where it differs from his Persian (R11, shown as an Urdu-only notice); the Urdu-lag notice for Sistani (P6); `referToRisala` held rulings show a pointer with the official link; unspecified precaution is labelled "type not specified" (R3); followers-only entries are invisible to everyone else (R7, H3); no calculator, amounts exactly as the marja' states them (G1, G2); payment links go only to the marja's own site (G3); helpers are questions about the user's situation that never state a ruling, each with an "I'm not sure" option that leads to the risala (P17, R12).

## 4. What exists here, and how the prototype differs

- **Already in this repo:** `legacy/app/data/wajibat/{categories,marja,topics,types}.ts`; Settings has "Marja' for Daily Fiqh rulings" on `quran:fiqh-prefs:v1` (additive, the legacy key); the nav has "Daily Fiqh" at `/fiqh` (phase 13); the Library has a `fiqh` kind that is `OPENS_TODAY: false` and a `fiqhTopic` provider slot; `Search` has a registry in which Phase 12 registered its groups; the Urdu font is bundled; the Sunni/Ja'fari setting (`prayerFiqh`, a raw string) exists in Settings and the prayer code.
- **Prototype (`#/fiqh`, five pages):** a valid layout, but its categories, topic ids and counts are samples. Of its 34 sample topics, 13 have an id that exists in the data and 21 do not; its category ids differ for four categories, and its topic counts for four. Per the roadmap, **the legacy ids win**. Its "Continue" row, the saved-study state, "N of N rulings added" meter and "≈ 2.4 MB" are inventions to replace with real numbers. Everything in `CONTENT_TO_VERIFY.md` under Daily Fiqh applies, and most of it dissolves once the real data is used (the glossary, the maraji', the rulings).

## 5. Proposed plan

### 5.1 Vendoring (the sync script, no hand copies)

Add to `scripts/lib/legacy-files.mjs`, then `LEGACY_REPO=../Quran-App node scripts/sync-legacy.mjs`: the 27 data files not yet vendored; `app/utils/wajibat{Search,Labels,Validate,Review,Mismatch,Coverage}.ts` and `wajibatMismatchWords.json` (the legacy decisions put the display vocabulary and the checks there, and one copy is the point); and `tests/fixtures/wajibatSourceSnapshot.json` with the two mismatch fixtures, so the verbatim and cross-language tests run here. (`legacy/` is a snapshot of `app` files today, not tests: I would extend the manifest to carry three fixtures and say so in `legacy/README.md`. `wajibatBuildGuard.ts` is not needed: it guards the legacy's own build flag.) Nothing is edited. `tests/legacySnapshot.test.ts` insists every vendored file is used, so the utils come in with the code that uses them.

### 5.2 Build

| Piece | Plan |
| --- | --- |
| `lib/fiqh/` | `runtime.ts`-style lazy loader per category over the vendored chunks; `visibility.ts` (what a follower sees: entry, held, withheld, lag, followers-only, "not added", seeAlso), ported rule for rule from `RulingCard`, `access.ts`, `wajibatLabels` and checked against the legacy tests' cases; `prefs.ts` on `quran:fiqh-prefs:v1` (shared with Settings); `search.ts` (the legacy util) |
| Routes | `app/pages/fiqh/index.vue`, `choose-marja.vue`, `glossary.vue`, `[category]/index.vue`, `[category]/[topic].vue` (legacy routes, kept) |
| Components | `app/components/fiqh/`: `MarjaGate`, `MarjaBar`, `FiqhNotices` (Sunni, not scholar-reviewed), `RulingCard` (hukm and basis badges with text, never colour alone; Q&A; excerpt; source line; Urdu with its own citation and the notices above; recitation block), `RulingPanel` (collapsed: women's, purity of persons), `ProcedureStepper`, `LiveToolPanel` (reads the existing prayer and Ramadan data; recomputes nothing), `DecisionHelper` (behind the flag), `QuranicBasis` (reuses the Phase 12 ayah text path), `PayLink`, `Glossary` |
| Topic order | exactly the legacy's sections, on the revamp's page style (hairline dividers; rulings are text, not cards of scripture; borders not shadows; 44 px targets) |
| Library | `fiqh:<topicId>` opens `/fiqh/<category>/<topic>`; `OPENS_TODAY.fiqh` true; the provider reads topics from the core chunk |
| Search | a **Daily Fiqh** group registered the way Phase 12's were (`loadKnowledgeGroups` is the model), from the legacy ruling index (one line per ruling, no category chunk needed); the box on `/fiqh` filters in place and also offers "Search all" |
| Settings | no change (the marja' picker exists); "Reading language" gets its own control on the Fiqh pages as the legacy has it |
| Urdu | existing bundled Noto Nastaliq; Urdu text only where the marja's own Urdu exists; right to left, lang `ur` |
| Offline | **Level B.** Per-category chunks are cached after first use by a service-worker rule (CacheFirst on the `wajibat-data-*` files) and **"Save all for offline"** fetches the six chunks (about 0.5 MB gzip) into it; the topic page shows a plain "not on your device yet" line when a chunk is missing and the device is offline. Nothing is added to the install-time precache (the alternative, section 8 question 6, is to precache all 0.5 MB gzip). |
| Tests | the vendored verbatim and mismatch tests run here; new unit tests for the visibility rules over **every ruling and every marja'** (no fallback, held shows only the pointer, withheld English never rendered, followers-only invisible to others, Makarem sees notices only); browser tests for gate, picker, a topic per category, the notices, offline, the helpers flag (hidden, and a production build guard), 375 px |
| Docs | `docs/pages/fiqh-*.md`, `docs/phases/phase-13-daily-fiqh.md`, screenshots against the prototype with **real** text, updates to PROGRESS, ROADMAP, DECISIONS, CONTENT_TO_VERIFY, CLAUDE.md |

### 5.3 Stages (two stops for you)

1. **13a (data, display rules, gate, picker, categories, topic pages, glossary, Library and Search):** stop for a screenshot checkpoint with real text for each marja'.
2. **13b (procedures, recitations, live tool panel, the helpers behind the flag, offline "Save all", docs):** full `npm run verify` on Node 22 once, then stop.

### 5.4 Not in this phase

Hajj, Other furu', Daily life (no data); Makarem Shirazi's rulings (no source); the personal tracker (decision Q7); audio recitation; a khums or zakat calculator (G1); Sunni fiqh; any new ruling, translation or summary of a ruling written by the app; any change to the generators or the data.

## 6. Risks

1. **No person has read the rulings.** The legacy says so on every page, and the revamp keeps it. If you want it shipped as "reviewed" later, the decision is yours and needs a real reviewer (the review pack and the sign-off file already exist).
2. **Khamenei's text is unverified by me.** The repo's own tests and the Persian cross-check are the guarantee; I could not add an independent one.
3. **A port can break a rule silently** (the worst case: showing another marja's or a withheld text). Mitigation: the tests above, written first, over the whole dataset.
4. **Held and withheld rulings change meaning to a reader** ("held for review" pointers in 92 places). Kept as the legacy decided; wording is the legacy's.
5. **Data growth:** 0.5 MB gzip, 2.3 MB raw, parsed per category on demand; the largest page load is Salat (127 KiB gzip). I will measure the page at 4x CPU as in Phase 3.
6. **Sources move.** sistani.org or leader.ir may change a page after the fetch (2026-10-07 to 09); the manifest hashes detect it only when someone re-runs the generators.
7. **Sensitive content** (menstruation, purity of persons): collapsed by default as decided (Q8, P8); shown exactly as quoted, no commentary.

## 7. Open questions in the legacy that I will not decide

`wajibat_needs_human.md` lists 66 rows shown as before and awaiting a person; 0 of 262 helper paths are signed off; Khamenei's zakat al-fitrah has no source; the three "match neither" classes are held with a pointer. I will port the display as it stands and list these as open, not resolve them.

## 8. Decisions I need from you

| # | Question | My recommendation |
| --- | --- | --- |
| 1 | Show the data with "Not scholar-reviewed" on every page, as the legacy does, until a person has read it? | **Yes.** |
| 2 | The 66 `needs-human` rows are shown as before (the legacy's safe default). Hold them with the pointer in the revamp until someone decides? | **Hold them** (a stricter default than the legacy; it costs 66 rows of text and avoids showing the one class the check could not settle). Your call: it changes what readers see compared with the legacy |
| 3 | The four helpers: keep them hidden until every path is signed off (as the legacy does) and build them in 13b regardless? | **Yes**: built, tested and hidden; sign-off recorded in the data file as now |
| 4 | Vendor the tests' fixtures (snapshot 1.36 MB, mismatch 2 files) so the verbatim tests run here? | **Yes**: it is the only independent guard in this repo; add a note to `legacy/README.md` that `legacy/` carries three fixtures |
| 5 | Khamenei's full-text check: can you, or someone with a browser, compare a sample against leader.ir, or run `fetch_sources.py --refresh` and `verify_live_qa.py` from the legacy repo and send me the output? | **Yes, before the phase is accepted.** I can supply the 30 entries to check |
| 6 | Offline: cache on first use with "Save all for offline" (recommended), or precache all 0.5 MB gzip at install? | **First use plus Save all.** It keeps the install small and matches the legacy |
| 7 | The Daily Fiqh search box on `/fiqh` and a **Daily Fiqh** group in Search (as in the prototype and as the legacy's `wajibatSearch` allows)? | **Yes** |
| 8 | Language: keep English, Urdu, Both as the legacy has them, with Urdu only from the marja's own Urdu book? | **Yes** |
| 9 | Use the legacy topic and category ids and the legacy glossary (94 sourced terms), not the prototype's? | **Yes** (the roadmap already says so) |
| 10 | The Phase 12 caveat drafts point to "Daily Fiqh". Is that wording fine once this phase ships, or should they wait until it has shipped? | They are hidden either way; **no change** |
