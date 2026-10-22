# Wajibat Module — Obligatory Acts & Daily Fiqh (Fiqh Ja'fari)

> **Audience:** Claude Code, working inside the Quran App repository.
> **Status:** Specification — not built yet.
> **Proposed module number:** 18 (confirm it is still the next free number in `MODULE_BLUEPRINT.md` before using it).
> **Initial fiqh scope:** Fiqh Ja'fari (Shia Ithna-Ashari) only. The data model must still allow other fiqhs to be added later without a rewrite.
> **Maraji' covered:** Ayatullah al-Sistani, Ayatullah Khamenei, Ayatullah Makarem Shirazi. The user picks one in Settings and sees only that marja's rulings.
> **Languages:** English + Urdu.
> **Decisions:** all planning questions are answered in `wajibat_decisions.md` (shipped alongside this spec). Read it before Phase 0.

---

## 0. How to use this document (read first)

1. Read `CLAUDE.md`, `README.md`, and `MODULE_BLUEPRINT.md` (especially the *Qur'anic Knowledge Platform — Shared Foundation* section and Module 17) before writing any code. This module must follow the same conventions.
2. Read **Section 2 (Decisions)** and `wajibat_decisions.md`. All 12 planning questions are answered. Only Q5 (UI kit) needs you to inspect the repo and report your finding. Any **new** question that comes up must be added to `wajibat_decisions.md` under "Pending questions" and asked — never guessed.
3. Build strictly **phase by phase** (Section 12). Do not start a phase until the previous phase is complete *and verified*.
4. At the end of **every phase** (and after every topic dataset inside a phase), follow the **Summary & Blueprint Update Protocol** in Section 13. This is mandatory, not optional.
5. If you hit a major architectural decision, a ruling you cannot source, or a conflict between this spec and the codebase: **stop, explain, and ask**. Do not silently decide.

---

## 1. Purpose

Create a practical, source-verified guide to the **obligatory acts (wajibat)** a Muslim deals with daily and periodically, according to **Fiqh Ja'fari**, covering:

- Purification (Taharat): najasat, mutahhirat, wudu, ghusl, tayammum
- Prayer (Salat): daily prayers, conditions, obligatory parts, invalidators, doubts, qasr, qada, other obligatory prayers
- Fasting (Sawm)
- Khums and Zakat
- Hajj (overview level first)
- The remaining Furu' al-Din (Jihad, Amr bil Ma'ruf, Nahi anil Munkar, Tawalla, Tabarra)
- Foundations: Taqlid and a brief Usul al-Din overview
- Selected daily-life obligations (e.g. hijab/covering in prayer and in public, halal food basics, istinja)
- An optional personal tracker (daily prayer log, qada counters, khums-year reminder)

This is the **practical-fiqh layer** of the app. It is different from the Knowledge Platform's planned Phase 9 (*Commands & Prohibitions*), which is the **Qur'anic-text layer**. The two must stay separate and later be cross-linked (Phase 10 Knowledge Graph). Never present a derived fiqh ruling as though it were a verbatim Qur'anic command (same rule as the phased plan's Phase 9).

---

## 2. Decisions (answered by the user)

The same table lives in `wajibat_decisions.md`, which is the source of truth. If the two ever disagree, `wajibat_decisions.md` wins; update this section to match.

| # | Question | Decision |
|---|---|---|
| Q1 | Which marja'? | **All three:** Ayatullah al-Sistani, Ayatullah Khamenei, Ayatullah Makarem Shirazi |
| Q2 | How are multiple maraji' shown? | **User picks their marja' in Settings and sees only that marja's rulings.** No side-by-side comparison in the UI. |
| Q3 | Languages | **English + Urdu** (Urdu in Noto Nastaliq Urdu) |
| Q4 | Users whose fiqh setting is Sunni | **Module visible, with a clear "Fiqh Ja'fari only for now" note** |
| Q5 | UI kit | **Claude Code inspects the repo in Phase 0 and matches the most recently built/migrated pages** (Vuetify vs shadcn-vue); report the finding in the Phase 0 report |
| Q6 | Route | **`/fiqh`** |
| Q7 | Personal tracker | **Later — not in the first release.** Keep §7.2 as a future design; do not build it. |
| Q8 | Women-specific rulings (hayd, istihada, nifas) | **Full detail, collapsed by default**, respectful clinical tone |
| Q9 | Audio for recitations | **Text only for now** |
| Q10 | Scholar review | **Undecided.** Until decided, every topic page shows "Not scholar-reviewed". Keep the `reviewedBy` field in the data model so a reviewer can be added later. |
| Q11 | Hajj depth | **Overview only** |
| Q12 | Qur'anic basis links | **Yes — shown as "Qur'anic basis" cards** via `AyahReferenceCard`, visually separate from rulings |

### Consequences of these decisions
- **Three maraji' = three sources per ruling.** Every `Ruling` must have a `MarjaRuling` entry for each of the three maraji'. If one marja's ruling cannot be sourced, that marja's entry is left out and listed as "Unsourced — needs research". The UI then shows that marja's users *"This ruling for {marja} has not been added yet — please refer to his official risala"*. It must **never** fall back to another marja's ruling.
- **Research order:** finish one topic for all three maraji' before moving to the next topic. Do not complete a whole category for one marja' first.
- **Source formats differ.** Sistani's and Makarem Shirazi's risalas use numbered issues. Khamenei's rulings are published largely as numbered Q&A (istifta'at) and a practical-laws text. Store a generic `reference` string (issue number or Q&A number) and record which book it belongs to. Find each marja's **official** website yourself; do not rely on URLs recalled from memory.
- **First visit:** if the user has not chosen a marja' yet, `/fiqh` shows a short marja' picker before any ruling is displayed. Do **not** silently default to one marja'. The choice is stored as a user setting and can be changed in Settings.
- **Sunni users** see a banner at the top of `/fiqh`; content is still readable.

## 3. Core principles (non-negotiable)

1. **Accuracy over coverage.** 100 correctly sourced rulings are better than 1,000 uncertain ones.
2. **Never write a ruling from memory.** Every ruling must be taken from the chosen marja's official text (or another source at an allowed verification level, §5) and cite it.
3. **Separate these clearly in data and UI:**
   - Qur'anic basis (an ayah, shown with `AyahReferenceCard`)
   - Hadith basis (only if taken from a cited source)
   - The marja's **fatwa** (a definite ruling)
   - The marja's **obligatory precaution** (*ihtiyat wajib*) — the user may refer to the next most learned marja' on this point
   - The marja's **recommended precaution** (*ihtiyat mustahab*)
   - General explanation written by the app (clearly marked as explanation, not ruling)
4. **Show whose ruling it is**, every time: "According to Ayatullah {name} — *Islamic Laws*, Issue {n}".
5. **Differences between maraji'** are flagged, never silently merged.
6. **The app is a study aid, not a marja'.** Every topic page carries a short disclaimer and links to the marja's official website/risala.
7. **Respectful tone** on sensitive topics (janabat, menstruation, istihada, nifas, death/mayyit). Clinical, modest, clear.
8. **Fiqh-aware, not fiqh-primary** (existing app rule in `CLAUDE.md`): content is filtered by the user's fiqh setting, never hard-coded as the only tradition in shared components.
9. **Reuse before building.** Reuse Module 5 (prayer times/Qibla, already has a Ja'fari method), Module 6 (calendar), Module 7 (reminders), Module 9 (bookmarks), Module 11 (Ramadan fasting log), Module 17's `AyahReferenceCard`, `SourceType`/verification vocabulary.
10. **Do not claim anything is done or verified unless it was actually checked.**

---

## 4. Anti-hallucination rules (mandatory)

1. Never invent a ruling, condition, exception, or issue number.
2. Never "complete" a ruling you only partly remember.
3. Never merge rulings of two different maraji' into one statement.
4. Never paraphrase a ruling so that its meaning changes (e.g. turning *ihtiyat wajib* into *wajib*, or *makruh* into *haram*).
5. Never invent Arabic text for recitations. Arabic must be copied from a cited source and checked letter by letter, including diacritics where shown.
6. Never invent Qur'an references. Every ayah reference must pass the existing validator against `app/assets/data/surah.json`.
7. If a source cannot be found for a ruling, **leave it out** and list it under "Unsourced — needs research" in the phase summary.
8. If two sources disagree, record both and mark `status: "disputed"`; ask the user how to display it.
9. Mark every piece of app-written explanatory text as `kind: "explanation"` so it is never displayed as a ruling.
10. Do not upgrade a verification level without evidence.

---

## 5. Source policy & verification levels

### Allowed sources, in priority order
1. The marja's **official website** and official risala (e.g. *Islamic Laws* / *Tawdih al-Masa'il*, *Minhaj al-Salihin*), in English/Urdu/Arabic/Persian
2. Official Q&A (istifta') pages from the marja's office
3. Published translations of the risala by recognised publishers
4. Established Shia scholarly reference sites (e.g. al-islam.org) — **secondary only**, for explanation, not as the sole source of a ruling

Not allowed as evidence: forums, social media, random blogs, YouTube comments, SEO sites, AI output (including your own memory).

### Verification levels (use exactly these)

| Level | Meaning | Shown to users as a ruling? |
|---|---|---|
| **A — Primary verified** | Checked against the marja's official text; issue number recorded | Yes |
| **B — Secondary verified** | From a reputable secondary source that cites the marja', but the official text was not checked | Yes, with a "secondary source" label |
| **C — Unverified** | Found, but source not reliable enough | **No** — excluded from the dataset |
| **D — Disputed** | Sources disagree on wording or ruling | Only with a clear "disputed" notice and user approval |

If Claude Code cannot access a source during a phase (network restrictions etc.), it must **say so** in the summary rather than filling gaps from memory.

---

## 6. Content taxonomy (coverage checklist)

This is the list of topics to cover. It is a **checklist of subjects**, not a list of rulings — every ruling under each item must be sourced per §5. Items marked ⚠️ are known to differ between maraji' or need special care.

### 6.1 Foundations
- Taqlid: what it is, who must do it, choosing a marja', ihtiyat wajib vs ihtiyat mustahab ⚠️
- Usul al-Din (brief overview): Tawhid, 'Adl, Nubuwwah, Imamah, Qiyamah — note these are held by conviction, not taqlid
- Furu' al-Din overview (the ten): Salat, Sawm, Hajj, Zakat, Khums, Jihad, Amr bil Ma'ruf, Nahi anil Munkar, Tawalla, Tabarra
- Age of taklif (bulugh) — boys and girls ⚠️
- The five rulings (ahkam): wajib, haram, mustahab, makruh, mubah

### 6.2 Taharat (Purification)
- Water types: mutlaq, mudaf; kurr, qalil, running water ⚠️
- Najasat (list of the intrinsically impure things) ⚠️
- How najasah transfers; doubt about purity
- Mutahhirat (purifiers) ⚠️
- Istinja (cleaning after the toilet); toilet etiquette that is wajib vs mustahab
- **Wudu**
  - Wajib acts, correct order, and continuity (muwalat)
  - Conditions of wudu (water, place, container, no obstruction on the skin, enough time, etc.) ⚠️
  - Mustahab acts (clearly labelled as mustahab)
  - Things that invalidate wudu
  - Jabira (wudu over bandages/casts) ⚠️
  - Doubts during/after wudu
  - When wudu is wajib
- **Ghusl**
  - Wajib ghusls: Janabat, Hayd, Istihada, Nifas, Mass al-Mayyit, Ghusl al-Mayyit ⚠️
  - Methods: tartibi (sequential) and irtimasi (immersion)
  - Conditions and invalidators
  - Whether a given ghusl suffices for wudu ⚠️
  - Things haram/makruh while in a state of janabat
  - Hayd, istihada, nifas: definitions, categories, related rulings (full detail, collapsed by default — Q8) ⚠️
  - Mustahab ghusls (list only, clearly labelled)
- **Tayammum**
  - When tayammum replaces wudu/ghusl
  - What it can be performed on ⚠️
  - Method (wajib acts, order)
  - Invalidators

### 6.3 Salat (Prayer)
- The five daily prayers and their rak'at
- Times of prayer (Ja'fari: shared times for Zuhr/Asr and Maghrib/Isha, specific times, combining prayers) ⚠️ — **display live times from Module 5; do not recompute**
- Qibla — link to Module 5's Qibla tool
- Conditions of salat: taharat, time, qibla, covering (satr) for men/women, clothing conditions (pure, permissible, not from non-slaughtered/prohibited animals, etc.), place of prayer (permissible, stable, etc.) ⚠️
- Place of sajdah: what sajdah is allowed on (earth and what grows from it, not eaten or worn) ⚠️
- Adhan and Iqamah (status: mustahab/strongly recommended; content only from the marja's text) ⚠️
- **Wajibat of salat**, with **rukn vs non-rukn** distinction clearly shown:
  - Niyyah, Takbirat al-Ihram, Qiyam, Qira'at, Ruku', Sujud, Dhikr, Tashahhud, Salam, Tartib, Muwalat
- **Guided step-by-step prayer** (e.g. 2-rak'at Fajr, then 4-rak'at Zuhr), each step labelled wajib/mustahab, with verified Arabic + transliteration + translation
- Recitation rules: what must be recited aloud/silently, and for whom ⚠️
- Tasbihat al-Arba'a in 3rd/4th rak'at ⚠️ (number of repetitions differs)
- Qunut (status per marja') ⚠️
- **Mubtilat** (things that invalidate salat) ⚠️
- **Shakiyyat** (doubts in salat): which doubts invalidate, which are resolved, and how ⚠️ **(high risk — Phase 4)**
- Salat al-Ihtiyat and Sajdat al-Sahw
- Salat of a traveller (qasr): conditions, distance, intention to stay 10 days, workplace travellers ⚠️
- Qada prayers: obligation, order, eldest son's duty regarding the father's missed prayers ⚠️
- Congregational prayer (jama'ah) basics
- Other wajib prayers: Salat al-Ayat, Salat al-Tawaf, Salat al-Mayyit, prayers made wajib by vow/oath, Jumu'ah (status per marja') ⚠️

### 6.4 Sawm (Fasting)
- Who must fast; exemptions (illness, travel, pregnancy/breast-feeding, elderly, hayd/nifas) ⚠️
- Niyyah of fasting
- Mufattirat (things that break the fast) ⚠️
- Kaffarah and qada; fidya ⚠️
- Fasting and travel ⚠️
- Remaining in janabat until Fajr ⚠️
- Iftar time (Ja'fari Maghrib) — **display from Module 5**
- Other wajib fasts (qada, kaffarah, vow)
- Haram fasts (e.g. Eid days)
- Zakat al-Fitrah ⚠️
- **Link to Module 11** (Ramadan fasting log) — do not build a second fasting log

### 6.5 Khums
- On what khums is due (e.g. annual surplus income and other categories) ⚠️
- Khums year (starting date, calculation principle)
- Division (Sahm al-Imam / Sahm al-Sadat) and paying through the marja's office ⚠️
- Optional **simple calculator** (Phase 6): only if the marja's text gives a clear, simple rule; always show assumptions and the disclaimer; never present the result as a fatwa

### 6.6 Zakat
- The items zakat is due on ⚠️
- Nisab and rates (only as stated by the marja' text)
- Recipients

### 6.7 Hajj (overview only — Q11)
- When Hajj becomes wajib (istita'ah)
- Types of Hajj and 'Umrah (overview)
- Wajib acts in order (overview)

### 6.8 Remaining Furu' al-Din
- Jihad (definition and scope — careful, factual, no incitement; summary only)
- Amr bil Ma'ruf and Nahi anil Munkar: conditions and levels ⚠️
- Tawalla and Tabarra: meaning and practical expression (factual, respectful, no content attacking any group)

### 6.9 Daily-life obligations (selected)
- Covering/hijab in public and in prayer ⚠️
- Halal food basics: dhabiha conditions, seafood, prohibited items ⚠️
- Obligations related to the deceased: ghusl, kafan, salat al-mayyit, burial (overview) ⚠️
- (Further topics only after asking the user)

---

## 7. Data model

Follow Module 17 conventions: dependency-free TypeScript data files in `app/data/`, pure logic in `app/utils/`, thin composables in `app/composables/`. Reuse `QuranReference`, `SourceType`, and the verification vocabulary from Module 17 where they fit; **only extend** them additively (Shared Foundation rule #3–#5). If a shared type needs extracting into a shared file because this module is its second consumer, do it now and note it in the summary.

### 7.1 Content types (proposed — adjust after Phase 0 inspection, and report changes)

```ts
type FiqhId = "jafari";                     // extend later: "hanafi" | "shafii" | ...
type MarjaId = string;                       // e.g. "sistani" — from wajibat_decisions.md
type Hukm = "wajib" | "haram" | "mustahab" | "makruh" | "mubah";
type RulingBasis = "fatwa" | "ihtiyat_wajib" | "ihtiyat_mustahab";
type VerificationLevel = "A" | "B" | "D";    // "C" is never stored (excluded)
type LocalizedText = { en: string; ur?: string };

interface Marja {
  id: MarjaId;
  name: LocalizedText;
  officialSite: string;
  primarySource: { title: string; edition?: string; url?: string };
}

interface WajibatCategory {                  // "taharat", "salat", "sawm", ...
  id: string;
  fiqh: FiqhId;
  title: LocalizedText;
  arabicTerm: string;
  order: number;
  topicIds: string[];
}

interface WajibatTopic {                     // "wudu", "ghusl-janabat", "mubtilat-salat", ...
  id: string;                                 // lowercase, hyphenated slug is fine here — confirm vs Module 17's id style in Phase 0
  fiqh: FiqhId;
  categoryId: string;
  title: LocalizedText;
  arabicTerm?: string;
  summary: LocalizedText;                     // kind: explanation
  quranicBasis?: QuranReference[];            // shown via AyahReferenceCard, labelled "Qur'anic basis"
  rulingIds: string[];
  procedureId?: string;                       // step-by-step guide, if any
  decisionTreeId?: string;                    // e.g. doubts in salat
  relatedTopicIds?: string[];
  sensitive?: boolean;                        // collapse by default, careful tone
  reviewedBy?: { name: string; date: string };// only if a real reviewer exists (Q10)
  lastSourceCheck: string;                    // YYYY-MM-DD local
}

interface MarjaRuling {
  marjaId: MarjaId;
  text: LocalizedText;                        // faithful rendering of the marja's ruling
  hukm: Hukm;
  basis: RulingBasis;
  source: { title: string; reference?: string; url?: string; page?: string };  // reference = issue no. or Q&A no.
  verification: VerificationLevel;
  note?: string;
}

interface Ruling {
  id: string;
  topicId: string;
  subject: LocalizedText;                     // short label, e.g. "Order of washing in wudu"
  rulings: MarjaRuling[];                     // target: one per marja' (sistani, khamenei, makarem); missing = not sourced yet
  differsBetweenMaraji?: boolean;             // true if known to differ
  status?: "disputed";                        // only for level-D content
}

interface Recitation {
  id: string;
  arabic: string;                             // copied from source, checked letter by letter
  transliteration: string;
  translation: LocalizedText;
  source: { title: string; url?: string };
}

interface ProcedureStep {
  id: string;
  order: number;
  title: LocalizedText;
  instruction: LocalizedText;
  hukm: Hukm;                                 // wajib steps visually distinct from mustahab
  isRukn?: boolean;                           // salat only
  rulingIds?: string[];                       // the rulings this step is based on
  recitationIds?: string[];
  commonMistakes?: LocalizedText[];           // only if sourced
}

interface Procedure {                          // "how to perform wudu", "2-rak'at fajr", ...
  id: string;
  topicId: string;
  title: LocalizedText;
  marjaId: MarjaId;
  steps: ProcedureStep[];
}

interface DecisionNode {                       // doubts in salat, "is my wudu broken?"
  id: string;
  question?: LocalizedText;
  options?: { label: LocalizedText; nextId: string }[];
  outcome?: { text: LocalizedText; rulingIds: string[] };   // every outcome must cite rulings
}
interface DecisionTree { id: string; topicId: string; marjaId: MarjaId; rootId: string; nodes: DecisionNode[] }

interface GlossaryTerm { id: string; term: string; arabic?: string; urdu?: string; definition: LocalizedText }
```

### 7.2 User data

**First release:** only the marja' preference is stored, as a setting:

```ts
// storage key: "quran:fiqh-prefs:v1"
interface FiqhPrefs { marjaId: MarjaId | null; updatedAt: number }   // null = not chosen yet → show picker
```

Include it in Settings → "export all data" and "wipe all data".

**Future (Q7 = later, do NOT build now):** personal tracker design, kept here for reference.

One storage record, versioned key, persisted through `useNuxtApp().$storage` (never raw `localStorage`), synchronous persist after every mutation, **local-calendar-day** date keys (see `CLAUDE.md`):

```ts
// storage key: "quran:wajibat:v1"
interface WajibatUserState {
  marjaId: MarjaId;                           // user's chosen marja' (if multiple supported, Q2)
  prayerLog: Record<string /* YYYY-MM-DD */, Partial<Record<"fajr"|"zuhr"|"asr"|"maghrib"|"isha", "prayed"|"qada-later">>>;
  qadaCounts: { fajr: number; zuhr: number; asr: number; maghrib: number; isha: number; fasts: number };
  khumsYearStart?: string;                    // YYYY-MM-DD; reminder created via Module 7, not a new scheduler
  updatedAt: number;
}
```

Rules: qada counters can never go below 0; decrementing a counter is an explicit user action ("I prayed one qada Fajr"). No streak shaming; neutral, private wording. Include this record in Settings → "export all data" and "wipe all data".

### 7.3 Pure logic & tests (same pattern as `persons*.ts`)
- `app/utils/wajibatSearch.ts` — tashkeel-insensitive search over topic titles, Arabic terms, glossary, ruling subjects (en/ur)
- `app/utils/wajibatValidate.ts` — checks: unique ids; every `rulingIds`/`topicIds`/`recitationIds` reference resolves; every `QuranReference` valid against `surah.json`; every `MarjaRuling` has a source and a verification level of A/B/D; no level-D ruling without `status: "disputed"`; every decision-tree node is reachable and every leaf has an `outcome` with ≥1 ruling; every procedure's steps are ordered 1..n without gaps
- `app/utils/wajibatCoverage.ts` — per marja', per topic: how many rulings are sourced vs missing (used in phase summaries and a dev-only coverage view)
- `tests/wajibatDataset.test.ts`, `tests/wajibatSearch.test.ts`, `tests/wajibatCoverage.test.ts`
- Validator extra checks: every `MarjaRuling.marjaId` exists in `marja.ts`; no `Ruling` has two entries for the same marja'

---

## 8. Screens & UX

Place the module under the **Worship** group of the redesigned sidebar (see project design notes). Follow the current design system (Night Study direction, teal accent, sparing gold) and whatever UI kit is decided in Q5.

| Route (if `/fiqh` chosen) | Screen |
|---|---|
| `/fiqh` | Hub: categories (Taharat, Salat, Sawm, Khums, Zakat, Hajj, Other Furu', Foundations), marja' indicator, disclaimer, search |
| `/fiqh/[category]` | Category page: topics list |
| `/fiqh/[category]/[topic]` | Topic page: summary → Qur'anic basis → rulings → step-by-step procedure (if any) → decision helper (if any) → related topics → sources |
| `/fiqh/glossary` | Glossary (English/Arabic/Urdu terms) |
| `/fiqh/choose-marja` (or a dialog) | First-visit marja' picker; also reachable from Settings |

Check in Phase 0 that static routes win over dynamic segments here too (Module 17 relied on this for `/persons/timeline`).

**Visual rules**
- Hukm badges: wajib, haram, mustahab, makruh, mubah — distinct, and **never colour alone** (text label + icon too; spec rule from Module 17 §24).
- Rukn steps get an extra "Rukn" label.
- *Ihtiyat wajib* shown with an explanation tooltip ("You may follow the next most learned marja' on this point").
- Every ruling shows its source line (marja', book, issue/Q&A number, verification level).
- A small, always-visible marja' chip at the top of `/fiqh` pages ("Following: Ayatullah {name} · change").
- "Not scholar-reviewed" label on every topic page until Q10 is decided otherwise.
- Women-specific sections (Q8): full content inside a collapsed panel with a neutral heading.
- Explanation text styled differently from ruling text.
- Sensitive topics collapsed by default with a neutral heading.
- Arabic in RTL context with the app's Arabic font; Urdu in Noto Nastaliq Urdu with enough line height.
- Step-by-step procedures: a stepper that works well one-handed on mobile; each step shows Arabic / transliteration / translation where relevant.
- Decision helper: one question per screen, a visible "Start over", and a final screen that shows the ruling with its source — never an unsourced answer.
- Persistent footer disclaimer on every topic page: *"This is a study aid based on the published rulings of {marja}. For your own situation, consult your marja's official risala or office."*

**Reuse**
- Prayer times / Qibla → Module 5 (`usePrayerStore`, already has the Ja'fari method)
- Fasting log → Module 11
- Reminders (future tracker only) → Module 7
- Bookmarks → Module 9 generic `toggle()` with a new `fiqh:{topicId}` namespace; add a "Fiqh" tab to `/bookmarks` (Phase 1)
- Qur'anic basis → Module 17's `AyahReferenceCard` (gets audio, tafsir, wallpaper, bookmark for free)
- Search → the module's own `wajibatSearch.ts` (site-wide search unification is Knowledge Graph work, not this module's)

**Accessibility & mobile** (from Module 17 Phase 5 lessons): check the rendered DOM for `role`/`aria-pressed` on toggle chips, `aria-label` on icon-only buttons, no nested interactive elements, no horizontal overflow at 390px, screenshot review at 1280/768/390px (a page-level overflow check misses clipped chips).

---

## 9. Integration with fiqh setting

- The existing `prayer.fiqh` setting stays the single source of truth for Sunni/Ja'fari.
- All content items carry `fiqh: "jafari"`. Queries filter by the user's setting.
- Sunni users: module visible, with a "Fiqh Ja'fari only for now" banner (Q4).
- Add a **Marja'** selector to Settings (three options), shown only when fiqh = Ja'fari, plus the first-visit picker on `/fiqh` (Q2).

---

## 10. Files likely to be created (confirm in Phase 0)

```
app/data/wajibat/marja.ts
app/data/wajibat/categories.ts
app/data/wajibat/topics.ts
app/data/wajibat/rulings/*.ts           (split per category to keep files readable)
app/data/wajibat/procedures/*.ts
app/data/wajibat/decisionTrees/*.ts
app/data/wajibat/recitations.ts
app/data/wajibat/glossary.ts
app/utils/wajibatSearch.ts
app/utils/wajibatValidate.ts
app/utils/wajibatCoverage.ts
app/composables/useWajibat.ts
app/composables/useFiqhPrefs.ts           (marja' choice)
app/components/wajibat/*                 (HukmBadge, RulingCard, SourceLine, ProcedureStepper, DecisionHelper, MarjaChip, MarjaPicker, SunniNoticeBanner, ...)
app/pages/fiqh/index.vue, [category]/index.vue, [category]/[topic].vue, glossary.vue
tests/wajibat*.test.ts
wajibat_decisions.md
wajibat_progress_log.md
```

---

## 11. Out of scope (for now)

- Sunni fiqh content (data model supports it; content later)
- Audio for recitations (Q9: text only for now)
- Personal tracker (Q7: later release — design kept in §7.2)
- Side-by-side comparison of maraji' (Q2: user sees only their chosen marja')
- Server push notifications (app is local-first; Module 5/16 note this as a backend dependency)
- Any automated "fatwa" generation or free-text Q&A
- Full Hajj manasik (Q11: overview only)
- Inheritance, marriage/divorce, business transactions (future modules; ask user before adding)

---

## 12. Implementation phases

Every phase ends with: `npm test`, `npx eslint .`, `npm run build`, browser checks of the new/changed pages, a regression check of at least the Surah reader, Prayer Times and `/persons`, then the **Summary & Blueprint Update Protocol** (§13).

### Phase 0 — Inspection & architecture (no feature code)
- Inspect the codebase: UI kit status (Vuetify vs shadcn-vue — Q5), sidebar/navigation structure and the "Worship" group, how `prayer.fiqh` is read, `useBookmarks`, `AyahReferenceCard`, Module 17 type locations, route resolution behaviour, Settings page structure, data export/wipe code.
- Confirm or adjust the data model in §7 against real code. Decide whether `QuranReference`/`SourceType` must be extracted to a shared types file now.
- Confirm `wajibat_decisions.md` exists at the repo root (the user provides it with this spec); if not, create it from §2.
- Decide the UI kit (Q5) from the evidence and record the finding + reasoning in `wajibat_decisions.md`.
- Locate the three maraji's **official** websites/risalas and record the exact book titles/editions you will cite, and whether each is reachable from your environment.
- Create `wajibat_progress_log.md`.
- Add a one-line pointer to this spec in `CLAUDE.md`'s documentation list.
- Add the Module 18 row to the `MODULE_BLUEPRINT.md` index table and a stub Module 18 section (§13.3).
- **Stop after Phase 0**, show the report, and wait for the user's go-ahead before Phase 1.

### Phase 1 — Foundation: data layer, validator, shell UI, Foundations content
- Types, `marja.ts` (three maraji'), `categories.ts`, glossary skeleton, validator + tests, search + tests, coverage helper + tests.
- Marja' preference (`useFiqhPrefs`), first-visit picker, Settings selector, marja' chip.
- Shared components: HukmBadge, SourceLine, RulingCard, MarjaChip, SunniNoticeBanner, disclaimer, "Not scholar-reviewed" label.
- English + Urdu content structure; Urdu rendered in Noto Nastaliq Urdu.
- `/bookmarks` "Fiqh" tab.
- Hub, category, topic, glossary pages (empty-state friendly).
- Content: §6.1 Foundations (taqlid, ahkam, furu' overview, usul overview, bulugh).
- Sunni banner (Q4); sidebar entry under Worship.

### Phase 2 — Taharat
- Content: §6.2 in this order, one topic dataset at a time with a topic summary after each: water → najasat → mutahhirat → istinja → **wudu** (with step-by-step procedure) → **ghusl** (tartibi + irtimasi procedures; each wajib ghusl) → hayd/istihada/nifas (full detail, collapsed by default) → **tayammum** (procedure).
- Decision helper: "Is my wudu still valid?" (only if every outcome can be sourced).
- Qur'anic basis cards (e.g. wudu/ghusl/tayammum) via `AyahReferenceCard`.

### Phase 3 — Salat (core)
- Content: §6.3 except doubts. Times and Qibla linked live from Module 5.
- Guided step-by-step prayers: Fajr (2 rak'at) first, then a 4-rak'at prayer, then Maghrib (3), with verified recitations (text only). Where the three maraji' differ on a step, each marja's procedure is stored separately.
- Rukn vs non-rukn UI; mubtilat; qasr; qada; other wajib prayers.

### Phase 4 — Salat doubts & corrections (high-risk phase)
- Shakiyyat decision helper, Salat al-Ihtiyat, Sajdat al-Sahw.
- Every leaf outcome must cite level-A rulings. If any branch cannot be sourced, the helper must **not** ship that branch — show "Please refer to your marja's risala, Issue {n}" instead.
- Add tests that walk every path of the tree.

### Phase 5 — Sawm
- Content: §6.4; link to Module 11 fasting log and Module 5 Maghrib/Imsak times. Zakat al-Fitrah.

### Phase 6 — Khums & Zakat
- Content: §6.5, §6.6. Optional khums calculator (clear assumptions + disclaimer) — ask the user before building it. No khums-year reminder in this release (tracker is deferred).

### Phase 7 — Hajj (overview only)

### Phase 8 — Remaining Furu' al-Din & daily-life obligations
- Content: §6.8, §6.9.

### Phase 9 — Personal tracker — DEFERRED
- Not part of the first release (Q7). Skip this phase. Do not build any tracker code. The design in §7.2 is kept for a later release.

### Phase 10 — Final QA & release readiness
- Full content audit: re-open every level-A source and spot-check at least 20% of rulings **per marja'** against it (all rulings in Phase 4's decision tree, for all three maraji').
- Coverage report: sourced vs missing rulings per marja' per topic.
- Accessibility, mobile (1280/768/390), dark/light mode, Urdu rendering, RTL.
- Performance: data files split and lazy-loaded per category.
- Final `MODULE_BLUEPRINT.md` section rewrite into its "shipped" form.

---

## 13. Summary & Blueprint Update Protocol (after every phase)

### 13.1 Topic summary (after each topic dataset inside a phase)
Append to `wajibat_progress_log.md`:

```md
### {Phase N} · {Topic name} — {YYYY-MM-DD}
- Rulings added, per marja': Sistani {n} · Khamenei {n} · Makarem Shirazi {n} (A: x, B: y, D: z)
- Procedures / decision trees added: ...
- Sources used: {marja' book + issue range, URLs}
- Differences between maraji' flagged: ...
- Unsourced — needs research: ...
- Questions for the user: ...
```

### 13.2 Phase completion report (print in chat AND append to `wajibat_progress_log.md`)

```md
## Phase {N} — {name} — Completion Report ({YYYY-MM-DD})
- What was inspected
- What was built / changed
- Files created / changed
- Content added (by topic, with ruling counts per marja' and per verification level)
- Sources used
- Architecture decisions (and why)
- Shared patterns reused / created
- Tests: {command + result}
- Lint: {command + result}
- Build: {command + result}
- Browser verification: {pages, viewports, what was checked}
- Regression results
- Known issues
- Unsourced items left out
- Open questions for the user
- Recommended next phase
```

Only write "passed" for checks that were actually run.

### 13.3 Update `MODULE_BLUEPRINT.md`
After every phase:
1. **Module Index table** — ensure the row exists:
   `| 18 | [Wajibat & Daily Fiqh (Ja'fari)](#module-18--wajibat--daily-fiqh-jafari) | 5, 9, 11, 15, 17 |` (adjust dependencies to what was actually used).
2. **Module 18 section** — place it after Module 17 and before *Cross-Module Conventions Checklist*. Keep the same style as other modules: **Purpose**, **Status** (phases shipped), **Data model** (as actually implemented, not as proposed here), **Business rules**, **Source discipline**, **Reuse boundaries**, **Rebuild notes**.
3. Add a **"Phase N — shipped"** subsection describing what was built, real bugs found and fixed, and lessons worth keeping (Module 17's section is the model to follow).
4. **Do not rewrite other modules' sections.** If this module required a change to a shared module (e.g. a new bookmark namespace in Module 9, a shared type extracted from Module 17), add a short note to *that* module's section describing the additive change.
5. If a new cross-module convention emerged, add it to the *Cross-Module Conventions Checklist*.
6. In the phase report, list exactly which blueprint sections were edited.

---

## 14. Definition of done (whole module)

- All decisions recorded in `wajibat_decisions.md`, including the Q5 UI-kit finding
- Every shipped ruling is level A or B (or D with explicit disputed notice approved by the user), with marja' and source shown in the UI
- Validator and tests pass; lint and build pass
- All procedures and decision trees trace every step/outcome to rulings
- Sunni banner (Q4), marja' picker and Settings selector (Q2) work; a marja' with a missing ruling never shows another marja's ruling instead
- Reuse boundaries respected (no second prayer-time, fasting-log, bookmark, audio, or reminder system)
- No tracker code shipped (deferred)
- Accessibility and mobile checks done on real rendered pages
- `MODULE_BLUEPRINT.md` Module 18 section reflects the real implementation
- `wajibat_progress_log.md` has a completion report for every phase
- Disclaimer visible on every topic page; no page claims scholarly review unless a real review happened
