# Quran App — Module Blueprint (Rebuild Specification)

This document describes the app as a set of **independent, tech-agnostic modules**. Each module
lists its purpose, screens, data model, business rules/algorithms, and external dependencies —
enough to re-implement the same product on a different stack (native mobile, a different web
framework, a backend-backed version, etc.) without copying the current Nuxt/Vue code.

It complements, not replaces, the existing docs:
- `README.md` — current tech stack and quick reference
- `Quran_WebApp_Feature_Roadmap_and_Module_Specification.md` — original feature roadmap
- `Hifz_Module_Specification.md` — full design spec for Module 10 (Hifz), referenced not repeated here
- `prophets-quran-feature.md` — full design spec for Module 17 (Prophets & Qur'anic Persons), referenced not repeated here
- `PROJECT_PLAN.md` — build history
- `quranic_knowledge_platform_phased_plan.md` — the phased roadmap (Phases 0-10) for expanding Module
  17 into a full Qur'anic knowledge platform (Peoples, Places, Stories, Themes, Duas, Events, Signs,
  Commands, and finally a cross-module Knowledge Graph). The "Qur'anic Knowledge Platform — Shared
  Foundation" section right before Module 17 below is that plan's Phase 0 deliverable.

**Global architectural decisions** (apply to every module unless noted):
1. **Local-first, no backend.** All user data lives on-device. Every module owns one storage
   record, loaded on client mount and re-persisted after every mutation.
2. **Local-calendar-day date keys** (`YYYY-MM-DD` from `getFullYear/getMonth/getDate`), never
   UTC/`toISOString()` — avoids off-by-one-day bugs for users east of UTC.
3. **Reactive in-memory state + persisted snapshot.** Each module keeps state in memory (reactive
   store/state object) and mirrors it to persistent storage synchronously after each change —
   no debouncing, no background sync.
4. **Content vs. user-data separation.** Quran text/translations/tafsir/audio are immutable,
   fetched from external content APIs, and cached indefinitely (IndexedDB-equivalent + HTTP
   cache). User-generated data (bookmarks, goals, Hifz progress, settings) is small, structured,
   and stored separately (localStorage-equivalent / key-value store).
5. **Additive migrations.** When a module's schema changes, keep the old storage key, write a
   migration that reads it once, transforms it into the new shape, writes it under a new
   versioned key, and never deletes the source of truth for user data without a fallback.

---

## Module Index

| # | Module | Depends on |
|---|---|---|
| 1 | [Content Data Layer](#module-1--content-data-layer) | — |
| 2 | [Core Reading Experience](#module-2--core-reading-experience) | 1 |
| 3 | [Search](#module-3--search) | 1 |
| 4 | [Global Audio Player](#module-4--global-audio-player) | 1 |
| 5 | [Prayer Times & Qibla](#module-5--prayer-times--qibla) | — |
| 6 | [Islamic Calendar & Events](#module-6--islamic-calendar--events) | 5 |
| 7 | [Reminders](#module-7--reminders) | — |
| 8 | [Reading Goals / Khatmah](#module-8--reading-goals--khatmah) | 2 |
| 9 | [Bookmarks & Personal Library](#module-9--bookmarks--personal-library) | 1 |
| 10 | [Hifz (Memorization Engine)](#module-10--hifz-memorization-engine) | 1, 4 |
| 11 | [Ramadan Mode](#module-11--ramadan-mode) | 5, 8 |
| 12 | [Offline Downloads & PWA](#module-12--offline-downloads--pwa) | 1, 4 |
| 13 | [Ayah Sharing](#module-13--ayah-sharing) | 1 |
| 14 | [Utility Tools](#module-14--utility-tools-tasbeeh--asma-ul-husna--sajda-list) | 1, 9 |
| 15 | [Settings & Accessibility](#module-15--settings--accessibility) | all |
| 16 | [Account & Cloud Sync (future)](#module-16--account--cloud-sync-not-built) | all |
| 17 | [Prophets & Qur'anic Persons](#module-17--prophets--quranic-persons) | 1, 4, 9 |
| 18 | [Wajibat & Daily Fiqh (Ja'fari)](#module-18--wajibat--daily-fiqh-jafari) | 5, 9, 11, 15, 17 |

---

## Module 1 — Content Data Layer

**Purpose:** Single source of truth for Quran text, translations, tafsir, per-page (mushaf)
images/text, Juz boundaries, Sajda list, chapter metadata, and reciter audio. Every reading
feature is a view over this layer.

### External APIs (swap for any Quran-content provider)
| Provider | Used for | Notes |
|---|---|---|
| `quranapi.pages.dev` | Chapter text (all editions), per-ayah translations, tafsir (3 Sunni sources), reciter audio lists | Treated as immutable — cache forever |
| `alquran.cloud` (`api.alquran.cloud/v1`) | Full-text search, per-page (mushaf) reads | **Must be called over HTTPS** — an HTTP call 301-redirects and the redirect response doesn't carry CORS headers, so browsers silently reject it |
| `api.aladhan.com` | Prayer times, Hijri calendar (used by Module 5/6) | — |

### Entities
- **Chapter**: `{ surahNo, surahName, surahNameArabic, surahNameTranslation, totalAyah, revelationType, ayahs: [{ ayahNo, arabic1, arabic2, translations: {en, ur, bn, ...}, audio: {reciterKey: {url, originalUrl}} }] }`
- **Tafsir**: keyed by `${surahNo}:${ayahNo}:${sourceId}` → `{ text (markdown-lite), source }`
- **Juz**: `{ juzNo, surahRanges: [{surahNo, startAyah, endAyah}] }`
- **Page (mushaf)**: `{ pageNo, ayahs: [...] }` sourced from the search-provider's page endpoint
- **Sajda**: static list of `{ surahNo, ayahNo, type: "recommended"|"obligatory" }`
- **Surah list**: static metadata array (name, translation, ayah count, revelation place) — ship
  as a bundled JSON asset, not a network call, since it never changes

### Caching strategy (reference implementation: IndexedDB `chapters` + `tafsirs` object stores)
- One object store per content type, keyed by natural id (`surahNo`, or a composite tafsir key).
- On read: check local cache → return if hit; else fetch from network → write to cache → return.
- Cache writes must be **best-effort and silently swallow failures** (quota exceeded, storage
  disabled in private browsing) — the network is always the fallback, so a cache failure must
  never break the read.
- Pair with an HTTP-level cache (service worker `CacheFirst`, or platform-native persistent HTTP
  cache) as a second fallback layer, with a ~1 year TTL and no revalidation (content is immutable).
- **Dedupe concurrent in-flight requests for the same not-yet-cached id.** A cache-then-fetch
  layer alone doesn't prevent N components mounting simultaneously (a list/grid of items that all
  need the same parent chapter, e.g. Module 17's Direct Mentions) from each missing the cache and
  firing N redundant network requests — the first write hasn't landed by the time the others
  check. Share one in-flight promise per id (module-scope map, resolved/cleared once) so
  concurrent callers collapse into a single real request. Found and fixed as a real 7-requests-
  became-1 bug during Module 17's Phase 5 polish, not a hypothetical.

### Generators (R9)
- `scripts/wajibat/` regenerates every ruling file and the snapshot fixture (`build.py`) from a git-ignored cache of
  official pages. `sources.manifest.json` records each page's URL, fetch date and hash, and `fetch_sources.py` re-creates
  the cache and reports changed pages. Lesson: commit the generators and the extraction tools from day one. A later session
  that can't find them falls back to hand edits, and that is exactly how paraphrases got in.

- **Translations of one original (Khamenei, R11):** his English and Urdu books are both translations of the same Persian edition,
  so a translation can be wrong (the English said leisure travel is "not shortened"; the Persian says it is shortened). Compare the
  editions against the original, never one translation against the other, and keep the verdicts as data (`rules_verdicts.py`).
  Pair by position within sections and verify by content: the English edition's numbering drifts and merges rulings.

### Rebuild notes
- Any local structured store works: SQLite, Realm, Core Data, IndexedDB, or even flat files.
- If moving to a backend-backed model, this whole layer can become a thin proxy/cache in front of
  the same or a different Quran API — the rest of the app should be unaffected as long as the
  `Chapter`/`Tafsir`/`Juz`/`Page` shapes are preserved.
- **SSR-specific gotcha (only relevant if server-rendering):** don't `await` anything before the
  first call into a request-scoped context/composable — crossing a microtask boundary before that
  call loses per-request context on some frameworks (Nuxt specifically). Gate any
  IndexedDB-equivalent access behind a client-only check for the same reason (server has no
  IndexedDB).

---

## Module 2 — Core Reading Experience

**Purpose:** The actual reading UI: Surah reader, Juz index/detail, per-page (mushaf) reader,
Surah listing, multi-translation display, inline tafsir, per-ayah bookmark/audio/share actions.

### Screens
- **Surah listing** — all 114 surahs, name/translation/ayah-count/revelation-place, search/filter,
  bookmark toggle per surah, and a download-to-device button for the currently selected reciter's
  full-surah audio file (Module 4's save-to-device capability — see there).
- **Surah reader** (`/surah/:id`) — full surah text; tabs for available translations
  (Arabic/Urdu/English/Bengali/alternate Arabic script); per-ayah: bookmark toggle, play audio,
  download that ayah's audio to device, open tafsir panel (source picker across 3 tafsir sources),
  open translation panel, share (opens Module 13's ayah-card/wallpaper dialog).
  Continuous-scroll reading position is tracked (feeds Module 8).
- **Juz index** (`/juz`) — 30 Juz, each showing its surah/ayah range.
- **Juz detail** (`/juz/:id`) — reads through a Juz across surah boundaries.
- **Per-page / Mushaf reader** (`/per-page-read`) — traditional page-image-like reading, page
  navigation.
- **Surah audio listing** (`/surah-audios/:id`) — reciter picker for full-surah playback.

### Data flow
- Reader pages pull from Module 1 (cache-through fetch), never call the network directly for the
  same content twice.
- Bookmark/audio/share actions delegate to Modules 9, 4, 13 respectively — the reader itself owns
  no persistent state except reading position (Module 8 dependency: `recordAyahRead(surahNo,
  ayahNo)` fires as the user scrolls past each ayah).

### Business rules
- **Reciter audio URL is resolved by reciter *name*, not stored URL.** A reciter's audio URL is
  only valid for the surah it was fetched with; every playback call re-resolves the URL by
  matching the reciter's name against the *current* surah's own audio list. Never persist/reuse a
  raw audio URL across surahs.
- Translation/tafsir panels are lazy — fetched only when opened, then cached (Module 1).

### Rebuild notes
- This module is pure UI/orchestration; the interesting logic (progression tracking, bookmarking,
  audio resolution) lives in the modules it depends on. Keep it thin.

---

## Module 3 — Search

**Purpose:** Full-text search across Quran editions (Arabic text, tafsir sources, English/Urdu
translations), with scoping and history.

### Behavior
- Input: free-text query (min length 3 chars to avoid huge result sets), an edition id, an
  optional surah scope (`"all"` or a specific surah number).
- Query external search endpoint: `GET /search/{query}/{surahScope}/{editionId}`.
- **A 404 from the search API means "no matches," not an error** — must be handled as an empty
  result set, not surfaced as a failure.
- Cap displayed results (e.g. 60) even if the API returns more; show the true total count
  separately.
- In-memory query cache keyed by `query|scope|edition` avoids re-hitting the network for repeated
  searches within a session.
- Result rows normalize provider-specific fields into `{ surahNo, surahNameEnglish,
  surahNameArabic, ayahNo, text, editionName, deepLink }`.
- Editions offered: a curated list grouped by `english | urdu | arabic | tafsir` — not every
  edition the provider supports, just the ones with acceptable translation quality.

### Search History
- Separate small persisted list of recent queries (id, query text, timestamp), capped in length,
  most-recent-first, de-duplicated.

### Rebuild notes
- If the target platform doesn't have (or you don't want to depend on) a hosted search API,
  this module can be replaced with a local full-text index (e.g. SQLite FTS5) built from Module
  1's cached chapter text — same external contract (`search(query, edition, scope) → results[]`).

---

## Module 4 — Global Audio Player

**Purpose:** One playback engine shared across the entire app — surah/ayah recitation, Hifz
practice audio, resume-on-reload — so there is never more than one audio element and one "now
playing" state.

### State
```
nowPlaying: { type: "surah" | "ayah", surahNo, title, subtitle } | null
playing: boolean
progress: number (seconds)
duration: number (seconds)
playbackRate: number            // persisted preference
repeatOne: boolean              // persisted preference
autoAdvance: boolean            // persisted preference (auto-play next surah)
resumeInfo: { url, position, nowPlaying } | null   // persisted, restored on next app launch
```

### Behavior
- `play({ type, surahNo, title, subtitle }, url)` — the caller must always pass display metadata,
  not just a URL, because the mini-player is mounted once globally and has no other way to know
  what's playing.
- Persist `resumeInfo` whenever playback pauses; on next launch, offer to resume from the saved
  position/url.
- Integrate with the platform's media-session API (lock-screen / hardware media controls) where
  available.
- Repeat-one and auto-advance are player-level toggles, not per-surah settings.
- Playback speed, repeat, and auto-advance preferences persist independently of what's playing.

### Saving a track to device (distinct from Module 12's offline download manifest)
A small, unrelated capability surfaced next to the play button everywhere ayah/surah audio
appears — Surah listing (Module 2), Surah reader per-ayah (Module 2), and every
`AyahReferenceCard` (Module 17's shared reference card, reused by Duas/Persons/Events/Signs/
Commands/Stories): fetch the audio URL as a blob and trigger an `<a download>` save to the user's
downloads folder, falling back to opening the URL in a new tab if the CDN blocks the cross-origin
fetch (no `Access-Control-Allow-Origin` header on the response). This is a one-off file export —
**not** the same thing as Module 12's `DownloadedSurah` manifest, which persists content into the
app's own cache for in-app offline reading/playback and tracks its own progress/size/quota state.
Implemented once as a shared composable (fetch → blob → object-URL → synthetic anchor click →
revoke) so every "play" surface can add a "download" button beside it without re-implementing the
blob/fallback logic per screen.

### Rebuild notes
- On mobile, prefer a genuine background-audio-capable player (e.g. platform media player /
  foreground service) so playback survives app backgrounding — the web version is
  foreground/backgrounded-tab-only by nature.
- Module 10 (Hifz) explicitly reuses this player rather than building a second one — preserve that
  relationship in any reimplementation; per-ayah repeat, range looping, and loop-count controls
  needed by Hifz should be capabilities of this module, not duplicated.
- On native mobile, the blob/anchor download trick above doesn't apply — use the platform's native
  file-save/share API instead; the "one composable, every audio surface calls it" shape still
  applies.

---

## Module 5 — Prayer Times & Qibla

**Purpose:** Daily prayer times, Qibla direction, and in-app (foreground-only) notification
scheduling, with a Sunni/Ja'fari calculation-method toggle.

### External API
`api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude=&longitude=&method=&school=&midnightMode=`

### Calculation methods (fiqh setting — a user preference, not a build-time identity)
| Fiqh | Params |
|---|---|
| `sunni` (default) | `method=2` (ISNA) |
| `jafari` | `method=0` (Shia Ithna-Ashari / Leva Institute, Qum), `school=0`, `midnightMode=1` |

### Location
- Request device geolocation; on denial/unavailability, fall back to a fixed default coordinate
  (this build defaults to Lahore, Pakistan — 31.5204, 74.3587) and flag `locationSource: "fallback"`
  in the UI so the user knows the times may be off for their real location.

### Qibla calculation (great-circle bearing to the Kaaba, 21.4225°N 39.8262°E)
```
y = sin(kaabaLng - lng)
x = cos(lat) * tan(kaabaLat) - sin(lat) * cos(kaabaLng - lng)
qiblaBearing = (atan2(y, x) * 180/π + 360) mod 360     // degrees from true north
```
Pair with the device compass/magnetometer for a live-rotating needle where available.

### Caching
- Cache the day's response under a key that includes lat/lng/fiqh/date, so switching fiqh or
  location invalidates the cache correctly and a stale method's result is never silently reused.
- Auto-refetch scheduled for a few seconds after the next prayer's time passes (not a polling
  loop) so the day rolls over correctly even in a long-lived session.

### Notifications (foreground/background-tab only — no server push in this build)
- Per-prayer enable toggles + a single "minutes before" reminder offset, stored as user settings.
- One timer scheduled per enabled prayer for its next occurrence (today if still upcoming, else
  tomorrow); after firing, reschedule the same prayer forward by 24h.
- Real "works fully closed" push requires a push-capable backend (VAPID keys / platform push
  service + a subscription store) — explicitly out of scope for the local-first build; flag this
  as a backend dependency if the rebuild wants full background push.

### Rebuild notes
- On native mobile, prefer the platform's local-notification scheduler over JS timers for
  reliability across app suspension.

---

## Module 6 — Islamic Calendar & Events

**Purpose:** Hijri calendar with month navigation and a curated Islamic-events dataset.

### Data
- Hijri date conversion comes from the same `api.aladhan.com` response used for prayer times
  (it returns both Gregorian and Hijri dates).
- A **static, bundled dataset** of Islamic events keyed by Hijri `{month, day}`, each tagged:
  - `category` (e.g. `major`, `shia-occasion`, …)
  - `tradition`: `"shared" | "sunni" | "jafari"` — filter/display by the user's fiqh setting
    (Module 5) rather than hard-coding one tradition as default.
  - Optional `dateNote` explaining tradition-specific observance differences.
- **Known, intentional gap:** contested Twelve-Imams martyrdom dates are excluded pending proper
  sourcing — don't silently "fill in" dates without a credible source when rebuilding; keep this
  gap explicit if you carry the dataset forward as-is.

### Rebuild notes
- Ship the events dataset as static structured data (JSON/asset), not a network call — it doesn't
  change at runtime and has no need for a backend.

---

## Module 7 — Reminders

**Purpose:** Simple personal calendar reminders (independent of Islamic events), optionally
yearly-recurring.

### Entity
```
Reminder { id, title, date (YYYY-MM-DD local), note, recurringYearly, done, createdAt }
```

### Behavior
- CRUD + `toggleDone`.
- Derived views: `upcoming` (not done, date ≥ today, sorted ascending) and `overdue` (not done,
  date < today, sorted ascending).
- No native scheduling in this build (unlike Module 5's prayer notifications) — reminders are
  surfaced passively in-app. If porting to native, wiring these into the platform's local
  notification scheduler is a natural extension, not a redesign.

---

## Module 8 — Reading Goals / Khatmah

**Purpose:** Personal Quran-completion planning: multiple goal types, streaks, and catch-up pacing
that adapts as the user falls behind or gets ahead.

### Entity
```
ReadingGoal {
  id, type: "finish-by-date"|"ayahs-per-day"|"pages-per-day"|"juz-per-week"|"custom",
  label, startDate (local key), targetDate (local key | null, only for finish-by-date),
  dailyAyahTarget: number,        // every goal type normalizes to an ayahs/day figure internally
  startAbsoluteAyah: number,      // absolute position in the whole Quran at creation time
  preferredDays: number[],        // 0=Sun..6=Sat — days the user actually intends to read
  status: "active"|"paused"|"completed"|"abandoned",
  createdAt
}
```
Plus a `dailyLog: Record<dateKey, string[]>` mapping each day to the set of unique ayah-keys
(`"surah:ayah"` or a synthetic `"manual:timestamp:n"` for manually-logged progress) read that day
— this is what streaks are computed from, independent of the goal's own pacing math.

### Normalizing goal types to a daily ayah target
```
finish-by-date : ceil(remainingAyahsFromStart / daysUntilTarget)
pages-per-day  : ceil(dailyAmount * AYAHS_PER_PAGE)
juz-per-week   : ceil(dailyAmount * AYAHS_PER_JUZ / 7)
ayahs-per-day / custom : max(1, round(dailyAmount))
```

### Streak
Count consecutive local-calendar days (walking backward from today) with at least one logged
ayah. Today doesn't need to already have an entry for the streak to still be "alive" — only
yesterday onward must be unbroken.

### Catch-up pacing (adjusted daily target)
```
daysSinceStart = count of the goal's preferredDays between startDate and today
expectedByNow  = dailyAyahTarget * daysSinceStart
deficit        = max(0, expectedByNow - readSinceStart)
if deficit == 0: adjustedDailyTarget = dailyAyahTarget
else:
  remainingDays = targetDate ? daysBetween(today, targetDate) : 7   // open-ended goals spread catch-up over a week
  adjustedDailyTarget = dailyAyahTarget + ceil(deficit / remainingDays)
isBehindPace = adjustedDailyTarget > dailyAyahTarget
```
Only count the goal's own `preferredDays` in `daysSinceStart` — don't penalize a user for not
reading on a day they never intended to. Do **not** floor `daysSinceStart` to a minimum of 1; a
goal created today has had zero elapsed days and must not immediately show as "behind."

### Projected finish date
`pace = readSinceStart / max(1, daysSinceStart-including-non-preferred-days)`; if pace > 0,
`daysToGo = ceil(remaining / pace)` from today.

### Recording progress
- `recordAyahRead(surahNo, ayahNo)` — called as the reader scrolls past each ayah; de-duplicates
  per day (an ayah re-read the same day doesn't double-count).
- `recordManualAyahs(count)` — manual fallback for offline/physical-mushaf reading; adds
  synthetic dated keys so it still counts toward the streak and pacing.
- Only one goal is "active" (primary) at a time; creating a new goal makes it the active one,
  but past/paused/completed goals remain queryable.

### Rebuild notes
- `AYAHS_PER_PAGE`, `AYAHS_PER_JUZ`, and `TOTAL_QURAN_AYAHS` are fixed constants derivable from
  the standard Mushaf layout — bundle them as static data (see Module 1's surah metadata), not a
  network call.
- Absolute ayah position (`getAbsoluteAyahPosition(surahNo, ayahNo)`) requires a running sum of
  ayah counts per surah — precompute once from Module 1's static surah list.

---

## Module 9 — Bookmarks & Personal Library

**Purpose:** A flat bookmarking primitive across every content type, plus an additive layer of
notes/tags/collections on top.

### Bookmarks (flat key set)
A single `Set<string>` of bookmark keys, namespaced by content type:
```
surah:{surahNo}         ayah:{surahNo}:{ayahNo}      name:{id} (Asma-ul-Husna)
sajda:{surahNo}:{ayahNo} juz:{juzNo}                  audio:{surahNo} (reciter-page bookmark)
page:{pageNo}
```
Plus a side-map `addedAt: Record<key, timestamp>` for "recently bookmarked" sorting — kept
separate from the key set itself so it can't regress the many call sites that only add/remove/
toggle. `has/add/remove/toggle` are the generic primitives; per-type helpers
(`isAyahBookmarked`, `toggleAyah`, …) are thin wrappers for call-site convenience.

### Library layer (notes/tags/collections — keyed by the *same* bookmark key strings)
```
LibraryCollection { id, name, description, createdAt }
LibraryItemMeta   { note: string, tags: string[], collectionIds: string[], updatedAt }
```
- Purely additive metadata on top of bookmark keys — deleting a bookmark elsewhere does **not**
  auto-delete its library metadata; callers must explicitly clean up both when a bookmark is
  removed if you want them to stay in sync.
- `createCollection`/`deleteCollection` — deleting a collection strips its id from every item's
  `collectionIds` rather than deleting the items.

### Rebuild notes
- Keep bookmarks and library metadata as two separate stores even in a rebuild — it lets
  "bookmark" stay a cheap, ubiquitous action (used from a dozen places) while notes/tags/folders
  stay an opt-in power-user layer.
- **Additive (Module 18):** a new `fiqh:{topicId}` namespace, stored through the generic
  `toggle()`/`remove()` with no new wrapper functions, plus a "Fiqh" tab on `/bookmarks`.

---

## Module 10 — Hifz (Memorization Engine)

**Purpose:** A full local-first adaptive memorization practice system: ayah- and
transition-level spaced repetition, Practice vs. Test modes, six test types, progressive hints,
weak-item recovery, daily sessions with resume, Quick Test, full-range assessment, and
mastery/health reporting.

**This module has a complete standalone specification — see [`Hifz_Module_Specification.md`](./Hifz_Module_Specification.md)
for the full product design (principles, UX flows, acceptance criteria).** This section documents
the concrete data model and algorithms as actually implemented, for direct reuse in a rebuild.

### Core concept
A **Target** = Surah + ayah range (e.g. Al-Mulk 1–30) with a daily new-ayah pace and a daily time
goal. The system tracks memorization strength at two independent granularities:
- **per ayah** (can I recall this ayah on its own?)
- **per transition**, i.e. `ayah[n] → ayah[n+1]` (can I connect it to the one after it? — a real
  and distinct failure mode from knowing both ayahs individually)

### Data model
```
HifzTarget {
  id, surahNo, surahName, startAyah, endAyah,
  dailyNewTarget: number, dailyTimeGoalMinutes: number,
  status: "active"|"paused"|"completed",
  lastPosition: number,        // highest ayah introduced so far; startAyah-1 = nothing introduced yet
  lastAssessmentAt: dateKey|null, createdAt
}

HifzAyahState {                 // key = `${targetId}:${ayahNo}`
  targetId, ayahNo,
  strength: "not-started"|"learning"|"memorized"|"strong"|"weak",
  interval: number, ease: number,        // SM-2-lite scheduling state
  nextReviewAt: dateKey, reviewCount: number,
  historicalMistakes: number,            // NEVER decremented — permanent record
  recentResults: Grade[],                // rolling window, capped at last 5 — drives *current* weakness only
  hintsUsed: number, lastHintLevel: number, lastReviewedAt: dateKey|null
}

HifzTransitionState {           // key = `${targetId}:${fromAyah}`, toAyah = fromAyah + 1
  targetId, fromAyah, toAyah,
  strength: "not-started"|"learning"|"memorized"|"strong"|"weak",
  mistakes: number, recentResults: Grade[], lastReviewedAt: dateKey|null
}

HifzActivityDay { date, newAyahs, revisions, recoveredAyahs, recoveredTransitions, assessments }

HifzSessionState {
  id, kind: "daily"|"weak"|"quick-test"|"free-practice"|"assessment",
  targetIds: string[], items: SessionItem[], currentIndex: number,
  status: "in-progress"|"completed"|"abandoned",
  startedAt, completedAt, stats: { mistakes, hints }
}

SessionItem {
  id, type: "warmup"|"weak-ayah"|"weak-transition"|"revision"|"new"|"final-mixed"|"assessment",
  targetId, ayahNo?, fromAyah?, toAyah?,
  isNew?: boolean,              // true for progressive-practice-before-test items
  gradedTest: boolean,          // false for free-practice — grading it does NOT touch SRS
  testMode: "full"|"continue"|"previous"|"next"|"random"|"transition",
  result: Grade|"skipped"|null, hintLevel: number
}
```
`Grade = "again" | "good" | "easy"`.

### Strength classification (recomputed after every grade, never stored as a raw "flag")
```
computeAyahStrength(reviewCount, interval, recentResults):
  if reviewCount == 0: "learning"
  if count("again" in last 5 results) >= 2: "weak"
  if interval >= 21: "strong"
  if interval >= 3: "memorized"
  else: "learning"

computeTransitionStrength(recentResults):
  if recentResults empty: "not-started"
  if count("again" in last 5) >= 1: "weak"        // transitions are stricter — one recent miss is enough
  if recentResults.length >= 3: "strong"
  else: "memorized"
```

### SM-2-lite grading (ayah-level; applied on every graded test item)
```
on grade == "again":
  interval = 1
  ease = max(1.3, ease - 0.2)
  historicalMistakes += 1
on grade == "good":
  interval = max(1, round(interval * ease))
on grade == "easy":
  interval = max(1, round(interval * ease * 1.3))
  ease = min(2.8, ease + 0.1)
interval = min(interval, 180)                     // cap review spacing at ~6 months
nextReviewAt = today + interval days
recentResults = (recentResults + [grade]).slice(-5)
strength = computeAyahStrength(...)
```
Transitions record `recentResults`/`mistakes`/`strength` the same way but do **not** carry their
own interval/ease — they're binary connect-or-not signals, not independently scheduled.

### New-ayah introduction pressure ("Revision First" — retention over accumulation)
```
effectiveNewAyahBudget(dailyNewTarget, weakCount):
  if weakCount >= 3: 0                              // stop introducing new material entirely
  if weakCount >= 1: max(1, floor(dailyNewTarget / 2))  // halve the pace
  else: dailyNewTarget
newAyahBudgetToday(target) = min(effectiveNewAyahBudget(...), target.endAyah - target.lastPosition)
```
`introduceAyahs(targetId, count)` extends `lastPosition`, creates a fresh `HifzAyahState` per new
ayah, and links each to the previous one via a fresh `HifzTransitionState` — this is what
implements the spec's "progressive memorization" (practice 1, then 1→2, then 1→2→3, …).

### Session queue construction
All entry points build a `SessionItem[]` queue differently, then hand it to one shared runner
(grade/skip/advance/resume):
- **Daily session**: warm-up (one strong ayah per target, for confidence) → weak ayahs + weak
  transitions (highest priority) → due/overdue revision (round-robin across active targets so no
  single target starves another) → new ayahs (respecting the budget above) → a final mixed-mode
  re-test of a random sample (≤4) of everything already covered today, each in a random test mode.
- **Weak session**: just weak ayahs + weak transitions across selected targets.
- **Quick Test** (`minutes` budget): `budget = max(2, round(minutes*60 / 45sec-per-item))`. Pool =
  all weak items + all due/overdue + a shuffled fill of already-introduced ayahs in random-test
  mode; shuffle the whole pool and take `budget` items.
- **Free practice**: every ayah in a chosen range, `gradedTest: false` — never touches SRS.
- **Full-range assessment**: every ayah in `[startAyah, lastPosition]` in a random test mode, plus
  every transition between them — used to periodically re-validate a whole target, not just
  recently-touched items.

### Session lifecycle
`startSession` persists immediately (so a session survives a reload). `gradeCurrent(grade,
hintLevel)` grades the current item via `gradeAyah`/`gradeTransition` (skipped entirely if
`gradedTest: false`), records the result on the item, updates session-level `stats`, and advances.
`skipCurrent` marks the item `"skipped"` — **does not** touch SRS or weakness state, item remains
eligible for a future session. `advance()` past the last item auto-completes the session; on an
`assessment` session, completion also stamps `target.lastAssessmentAt`.

### Coverage / Mastery / Health (derived, not stored)
Compute per-target: coverage (`introduced / (endAyah-startAyah+1)`), counts by strength bucket,
weakest ayah, and a "Hifz Health" signal built from recent recall rate, mistake counts, hint
usage, and full-range assessment results — always shown with its contributing signals, never as
an opaque single number (explicit product principle — see spec §36–37).

### v1 → v2 migration (illustrative pattern for any future schema change)
The original shipped model tracked SRS at the *plan* level only (one interval/ease per whole
range). The v2 upgrade expands each legacy plan into a target plus one `HifzAyahState` per
already-introduced ayah (seeded from the plan's own interval/ease/reviewCount) and one
`HifzTransitionState` per adjacent pair — runs once, automatically, on first load if the new
storage key is empty but the legacy key has data.

### Rebuild notes
- Keep ayah-level and transition-level state **explicitly separate** even if you simplify
  everything else — it's the one modeling decision the whole spec is built around.
- The scheduler intentionally never exposes SRS internals (interval/ease/next-review) to the user
  — only strength buckets, weak lists, and one workload number ("23 items to practice"). Preserve
  that UX boundary in a rebuild even if the underlying algorithm differs.
- Reuses Module 4 (global audio player) rather than a dedicated Hifz player — don't duplicate
  playback/looping/speed logic here.

---

## Module 11 — Ramadan Mode

**Purpose:** A Ramadan-specific view layered on top of Modules 5 and 8: day counter with a
moon-sighting override, fasting tracker, and a Ramadan Khatmah goal.

### Entity
```
RamadanState {
  startOverride: dateKey | null,             // user's own "Ramadan actually started on..." date
  fastingLog: Record<dateKey, "fasted"|"missed"|"planned">
}
```

### Ramadan detection
- **Primary**: Hijri month == 9, from Module 5's prayer-times response (which already returns the
  Hijri date alongside timings).
- **Override**: if the user sets a local start date, treat it as authoritative for a **30-day
  window** from that date (the longer of the two possible lunar-month lengths, so it doesn't
  expire a day early on a 30-day Ramadan) — `isRamadanActive = overrideActive OR apiSaysRamadan`.
- `ramadanDay` = days since override start + 1 (if override active), else the API's own Hijri day.

### Estimated end date
Real month length (29 vs 30 days) isn't knowable in advance — assume 30 and label it
"estimated" everywhere it's surfaced. Used as the target date for the Ramadan Khatmah goal
(created via Module 8's `createGoal({ type: "finish-by-date", targetDate: estimatedEnd })`,
seeded from the user's current reading position).

### Fasting log
- `cycleFastingStatus(dateKey)`: unset → fasted → missed → unset (one-tap cycling through a day
  cell in a calendar grid).
- Derived: counts by status, and a "fasted" streak computed the same way as Module 8's reading
  streak (walk backward from today, today doesn't need to be logged yet to keep the streak alive).

### Other Ramadan content
- Suhoor/Imsak/Iftar times = Fajr/Imsak/Maghrib from Module 5's timings, just relabeled.
- Daily Dua/Ayah card and Laylat al-Qadr reminders: static/curated content, no new data model
  needed beyond "pick today's entry from a bundled list."

---

## Module 12 — Offline Downloads & PWA

**Purpose:** Explicit, user-controlled offline availability (distinct from opportunistic browsing
cache), plus installability.

### Entity
```
DownloadedSurah {
  surahNo, surahName, totalAyah, hasTafsir: boolean,
  reciterKey, reciterName, audioUrl,          // null if audio wasn't included in this download
  sizeBytesEstimate, downloadedAt
}
```
Manifest = `DownloadedSurah[]`, persisted separately from Module 1's opportunistic content cache.

### Behavior
- Downloading a surah: fetch + persist its chapter text into Module 1's cache, fetch tafsir for
  every ayah with bounded concurrency (this build uses 6 parallel requests) into the same cache,
  and — if audio was requested — fetch the audio file into a **dedicated** cache distinct from the
  service worker's own opportunistic audio cache, so "clear temporary cache" can wipe the
  opportunistic one without deleting something the user explicitly downloaded.
- Track `downloadingSurah` (current) and `{done, total}` progress for a progress UI; surface
  errors without losing already-completed items.
- Storage usage/quota: query the platform's storage-estimate API where available to show
  used/available space; treat it as best-effort display info, not a hard gate.
- `isDownloaded(surahNo)` gates UI (e.g. "Downloaded" badge, offline-availability checks elsewhere
  in the app).

### PWA / installability layer (parallel, not the same as the manifest above)
- Installable web app manifest (name, icons, theme color, standalone display, portrait
  orientation).
- Runtime HTTP cache: `CacheFirst` for the content API host and for audio file requests, 1-year
  TTL, capped entry counts (this build: 1000 API entries / 300 audio entries) — this is the
  *implicit* offline layer that benefits every visitor even without an explicit download, whereas
  the manifest above is the *explicit*, user-initiated one.
- Online/offline status: a simple reactive flag from the platform's connectivity events, surfaced
  as a persistent indicator so the user knows why something might be failing to load.

### Rebuild notes
- On native mobile, "download manager" maps naturally onto the platform's own background
  download/file-storage APIs; the manifest schema above still applies as the bookkeeping layer.

---

## Module 13 — Ayah Sharing / Wallpaper Card

**Purpose:** Generate a shareable/wallpaper-style image card for a chosen ayah (Arabic, with
translation optional), with theme customization, plus copy-text and native share. Originally built
for the Surah reader's per-ayah share button; now reachable from every `AyahReferenceCard` (Module
17's shared reference card) too, so Duas, Persons, Events, Signs, Commands, and Stories all get the
same wallpaper dialog for free rather than a second implementation.

### Theme model
```
AyahCardTheme {
  id, label,
  category: "Classic"|"Ramadan"|"Nature"|"Minimal"|"Luxury"|"Pastel",
  background: [colorStop1, colorStop2],   // gradient
  textColor, accentColor,
  pattern: "none"|"geometric"|"arch"|"stars"
}
```
16 curated presets shipped (up from an initial 8), grouped into the 6 categories above so the
picker stays browsable instead of one long undifferentiated grid; each chip shows a small
gradient-swatch dot so the palette is visible before selecting it. Palettes are grounded in
recurring Islamic/Quranic design conventions rather than arbitrary colors — deep green+gold
(Classic/Nature), black-on-black minimalist with a red accent (Classic — "Mono Ink"), luminous
night-gold and starfield patterns (Ramadan/Luxury), soft pastel pink/green/beige (Pastel), and
blue+sand or purple/orange mosque-silhouette gradients (Nature/Ramadan). A `"custom"` theme id lets
the user override colors/pattern and, separately, supply a custom photo background — the preset
list is a starting point, not an exhaustive enum.

### Card options (beyond the theme)
```
RenderCardOptions {
  ...theme fields, arabic, translation, translationLabel, reference,
  arabicFontScale, translationFontScale: number   // independent size sliders
  textAlign: "center"|"right"                      // translation alignment only
  includeTranslation: boolean                      // default true
  sidePadding: number                              // px, default 90, user-adjustable 40-160
}
```
- **`includeTranslation`** — a toggle in the customization panel. Off drops the translation block
  (and its font-size/alignment controls, hidden rather than left showing inert) entirely; the
  Arabic verse is then vertically re-centered on the frame instead of leaving the lower half empty,
  computed from the wrapped line count rather than a fixed offset so both short and long ayahs
  center correctly.
- **`sidePadding`** — a slider controlling the left/right margin (in canvas px, 1080px-wide frame)
  that both the Arabic and translation text wrap against. Lower values let more characters fit per
  line (denser card); higher values give a narrower, more poster-like column.
- Copy-text and the native-share text fallback respect `includeTranslation` too (omit the quoted
  translation line when it's off) — one source of truth for what's "in" the card, not two.

### Rendering
- Client-side canvas (or platform-native image compositing) rendering: draw background
  gradient → optional low-opacity decorative pattern (must never compete visually with the text)
  → word-wrapped Arabic + translation text, respecting RTL for the Arabic block → export as an
  image.
- Text wrapping measures against the canvas's current font metrics and greedily packs words per
  line up to a max width (`1080 - sidePadding * 2`) — direction (RTL/LTR) only affects alignment,
  not the wrapping algorithm itself.
- Output actions: copy the ayah text (plain text, no image), download the generated image, or
  invoke the platform's native share sheet with the image attached.

### Rebuild notes
- Keep image generation entirely client-side — no server round-trip needed, and it keeps the
  no-backend property intact.
- Keep the theme list and the render function decoupled from any one call site (they already live
  in a shared composable) — that's what let this module get reused by Module 17's reference card
  without forking the dialog.

---

## Module 14 — Utility Tools (Tasbeeh, Asma-ul-Husna, Sajda list)

### Tasbeeh (dhikr counter)
```
TasbeehPreset { id, arabic, transliteration, meaning, color }   // static list, incl. a "custom" slot
TasbeehEntry  { count, target, cycles, lifetime }                // per preset id, persisted
```
- `increment`: `count++`, `lifetime++`; on reaching `target`, roll over (`cycles++`, `count = 0`)
  with a distinct haptic pattern from a normal tap (short buzz per count, longer pattern on cycle
  completion) — haptics are a nice-to-have enhancement, not load-bearing.
- `reset` zeroes `count` only (not `lifetime`/`cycles`); `setTarget` changes the goal and resets
  the current count.

### Asma-ul-Husna (99 Names)
- Static bundled list (Arabic, transliteration, meaning). Bookmarkable per-name via Module 9's
  `name:{id}` key namespace. No independent persisted state of its own.

### Sajda list
- Static list of the Quran's prostration verses (from Module 1), each linkable into the reader and
  bookmarkable via Module 9's `sajda:{surahNo}:{ayahNo}` namespace.

---

## Module 15 — Settings & Accessibility

**Purpose:** Cross-cutting user preferences: reading/audio defaults, accessibility toggles, data
management.

### Accessibility preferences
```
AccessibilityPrefs {
  reducedMotion: boolean, highContrast: boolean, largeTouchTargets: boolean,
  arabicFontScale: number   // 1 = default; scales the reader's Arabic text specifically
}
```
- Also respect the **OS-level** reduced-motion preference even if the user never touched the
  in-app toggle (`prefers-reduced-motion`-equivalent) — OR it with the explicit setting, don't let
  the explicit setting override an OS accessibility need to "false."
- **Apply preferences after first render, not before.** A server/initial render can't know the
  user's saved preference; applying it pre-hydration (web) or pre-first-paint causes a visible
  flash-then-correct rather than a mismatch — an intentional, accepted tradeoff, not a bug.

### Other settings
- Reading defaults (preferred translation edition(s), default reciter), audio defaults (default
  playback speed).
- **Data management**: export all local data (bundle every module's storage record into one
  downloadable file) and a full local-data clear/reset — since there's no account, this is the
  user's only backup/portability mechanism. Any rebuild should treat "export everything" and
  "wipe everything" as first-class, always-available actions, not buried settings.

---

## Module 16 — Account & Cloud Sync (not built)

**Status:** Explicitly deferred, not a bug. Documented here so a rebuild can decide deliberately
rather than by omission.

- An auth client may be installed/scaffolded but intentionally not wired into any UI.
- To build this for real: a real backend project, real credentials (not placeholders), and
  row-level-security-backed sync of every local module's storage record (bookmarks, goals, Hifz
  progress, settings, library) keyed by user id — each module's existing local schema is the
  natural shape for the corresponding sync table/collection.
- True background push notifications (Module 5) are a related, equally-deferred backend
  dependency: needs push credentials, a server-side subscription store, and a scheduler — separate
  from account sync but likely built alongside it.

---

## Qur'anic Knowledge Platform — Shared Foundation (Phase 0)

**Status: documentation only — no code changes were required.** This section is the Phase 0
deliverable of `quranic_knowledge_platform_phased_plan.md`: it inspects Module 17 (Prophets &
Qur'anic Persons, the platform's only built module so far) and writes down, as an explicit
contract, which of its conventions are already generic enough for Phases 2-10 (Peoples, Places,
Stories, Themes, Duas, Events, Signs, Commands, Knowledge Graph) to reuse as-is, and which will
need a small, additive extension *when* a second module actually needs it — not speculatively now.
Every mechanism below was inspected in the actual shipped code (Module 17, listed in full above),
not assumed from the spec.

1. **Entity IDs** — lowercase, ASCII-transliterated, no hyphens/underscores/spaces (`adam`,
   `ashabalkahf`, `alazizwife`, `dhulqarnayn`). An id only needs to be unique **within its own
   module's array** (`QURAN_PERSONS`, and future `QURAN_PEOPLES`/`QURAN_PLACES`/etc.), not
   globally — each module gets its own top-level route and its own bookmark key namespace (#9
   below), so `persons.adam` and a hypothetical `peoples.adam` (a nation) could coexist without
   collision. **Flag for Phase 10**: `PersonRelationship.personId` is currently a bare string
   because Module 17 only ever links Persons to other Persons. A future cross-module relationship
   (e.g. a Person → a Place) will need a typed reference (`{ module: "places", id: "makkah" }` or
   equivalent), not an assumption that ids are globally unique — do not build this until Phase 10
   actually needs it.
2. **Names & Arabic names** — every entity has `name` (English/transliterated) and `arabicName`
   (the Qur'anic word/phrase where one exists, otherwise the standard traditional Arabic term —
   see `title_based_person` entries like Al-Khidr, where `arabicName` is the traditional form and
   `statusNotes` discloses that explicitly). `alternateNames?: string[]` holds traditional names
   the Qur'an itself doesn't state (e.g. "Zulaikha," "Asiyah," "Nimrod") — never promoted into
   `name`/`arabicName` as if Qur'anic. `honorific?` is reserved for prophets and Maryam by the
   feature's own documented exception; not attached to `title_based_person`/group entries.
3. **Qur'an references** — the two shapes in Module 17's data model (`QuranReference` for exact
   mentions, `RelatedPassage` for curated narrative ranges) are generic Qur'an-citation primitives
   with nothing Person-specific about them; every future module cites the Qur'an the same way.
   They currently live inline in `app/data/quranPersons.ts` rather than a shared types file —
   **extract them into a shared location the first time a second module needs them (Phase 2)**,
   not before; importing the type cross-module before then works fine as-is and doesn't justify a
   refactor with only one consumer.
4. **Source types** — `SourceType = "quran" | "authentic_hadith" | "traditional_account"` and
   `SourceReference { type, citation, note? }` are the platform's core source-discipline vocabulary
   (principle #2 of the phased plan). Reuse verbatim; do not invent a parallel vocabulary in a
   later module.
5. **Verification status** — `"verified" | "traditional" | "uncertain"` (relationships),
   `ChronologyStatus = "strong" | "traditional" | "uncertain" | "unknown"`, and `"quran_derived"`
   (key lessons) are the standing severity/confidence vocabulary. A later module needing a
   confidence label should reuse one of these rather than inventing a fourth near-duplicate scale.
6. **Relationships** — `{ personId, relationshipType, sourceType, verificationStatus }`, directional
   (the field describes the *owning* entity's role toward the target, e.g. `{ personId: "ismail",
   relationshipType: "father" }` on Ibrahim's own record means "Ibrahim is Isma'il's father" — see
   `app/utils/personsTimeline.ts`'s file header for why the inverse is never inferred
   automatically). A `personId` may point at an entity with no full profile yet — the UI is
   responsible for only linking what resolves (`usePersons().resolveRelated`) and rendering the
   rest as plain text; the dataset validator deliberately does not flag this as an error.
7. **Themes** — a curated free-text `string[]` per entity, not yet a controlled taxonomy. Phase 5
   (Themes module) is explicitly where this becomes a first-class, cross-referenced entity type
   with its own source discipline — do not pre-build that taxonomy now.
8. **Search indexing** — the established pattern is one dependency-free `{module}Search.ts` per
   module (see `personsSearch.ts`): tashkeel-stripped/case-insensitive text match across
   name/arabicName/alternateNames/description/themes/category, plus an exact `"surah:ayah"`
   reference shortcut. **Known gap, not addressed in Phase 0**: this is entirely separate from the
   site-wide `/search` page (`useSearch.ts`), which only full-text-searches raw ayah/tafsir text
   against the external `alquran.cloud` API and has no awareness of Persons (or any future module)
   at all. Unifying these is explicitly Phase 10's job, not Phase 0's — noted here so it isn't
   mistaken for an oversight later.
9. **Bookmarks** — `useBookmarks.js` already exposes generic, content-type-agnostic
   `has(key)/add(key)/remove(key)/toggle(key)` over a flat `Set<string>`, keyed by a
   `"{type}:{id}"` string convention (`person:{id}` is simply the latest of eight existing
   namespaces — surah/ayah/name/sajda/juz/audio/page/person). **No code change is needed for
   future modules**: a new module can call `toggle(\`peoples:${id}\`)` directly with the generic
   API. The dedicated wrapper functions Module 17 added (`isPersonBookmarked`/`togglePerson`/etc.)
   are optional ergonomic sugar, not a required part of the pattern — add them for a new module
   only if actually useful, not as boilerplate.
10. **Audio** — reuse the single global player (`useAudioPlayer`) via a small per-module "play all"
    queue composable built on its `endedAt` tick, exactly as `usePersonPassageQueue` does. Never
    build a second audio player.
11. **Tafsir** — reuse `useTafsirPreference` (the same composable the main Surah reader and
    `AyahReferenceCard` already share); never a per-module tafsir preference.
12. **Translation preferences** — reuse `useTranslationPreference`, same rationale as #11.
13. **Related entities** — currently same-module only (Person → Person via `relationships[]`).
    Cross-module relationships (Person → Place, Story → Event, etc.) are explicitly deferred to
    Phase 10 by the phased plan itself; see the Phase 10 flag under #1 above.
14. **Accessibility** — the verified, reusable patterns from Module 17: a whole clickable card is a
    single `<v-card :to="...">` (a real, keyboard-focusable link), not a `<div>` with a nested
    `<v-btn :to>` (which would create a nested-interactive-element anti-pattern); a toggleable
    filter chip uses `role="button"` + `:aria-pressed`; icon-only buttons get an explicit
    `aria-label`, while a button with visible text content needs no separate label. Reuse these
    exact patterns rather than re-deriving accessibility choices per module.
15. **Mobile** — Vuetify's grid (`v-row`/`v-col`) for directory/card layouts, `flex-wrap` for chip
    rows, and a standing QA checkpoint (verify no horizontal overflow at ~390px) before considering
    any new module's UI done — the same bar Module 17 was held to.

**Dataset integrity pattern (apply to every future module's dataset):** a dependency-free
`{module}Validate.ts` (see `personsValidate.ts`) that checks every Qur'an reference against the
*real* per-surah ayah counts (`app/assets/data/surah.json`), run automatically by a
`tests/{module}Dataset.test.ts` (see `tests/personsDataset.test.ts`). This is not optional
scaffolding — it has caught real errors during this platform's own content work and is the
concrete mechanism behind principle #10 ("keep source/reference data traceable to Qur'anic
passages").

**Phase 0 conclusion:** every mechanism the phased plan's Phase 0 asked to "document and, where
necessary, standardize" was found to already be generic enough to reuse as-is; nothing required a
code change to become reusable. The one genuinely new architectural question this raised — typed
cross-module references for Phase 10 — is flagged above, not solved, per the plan's own rule 12
("if a major architectural decision is required, stop and explain it before implementing it").

---

## Module 17 — Prophets & Qur'anic Persons

**Purpose:** A "Qur'an study index" of prophets and other Qur'anic persons — browse/search/filter
a directory, then drill into a person's verified Direct Mentions (exact ayahs naming them) and
manually-curated Related Passages (their story context, even where the name isn't repeated), with
deep links back into Module 2's reader and reuse of Modules 4 (audio) and 9 (bookmarks).

**Full product spec:** [`prophets-quran-feature.md`](./prophets-quran-feature.md) (34 sections,
5 implementation phases). **All 5 phases are built**: Phase 1 (directory/search/filter), Phase 2
(Qur'an integration: Direct Mentions, Related Passages, reader/audio/tafsir/bookmark reuse), Phase
3 (bookmark-a-person + resume study state, Family Tree, Related People, Scholarly/Traditional
Notes as a distinct section), Phase 4 (Prophetic Timeline), and Phase 5 (an accessibility/mobile/
performance polish pass — see below).

### Dataset — 38 people, Direct Mentions are EXHAUSTIVE, not curated
This ships with **prophets and selected named/title-based HUMAN figures mentioned in the
Qur'an** — **38 people**: all 25 traditionally named prophets, plus 13 other named/title-based
figures (Maryam, Luqman, Fir'aun, Haman, Qarun, Talut, Jalut, Abu Lahab, Bilqis, As-Samiri, Zayd,
Dhul-Qarnayn, Uzair). This is a curated selection, **not a claim of covering every individual
mentioned in the Qur'an** — see the "Known, deliberate exclusions" list below.

A coverage audit (separate from the content-accuracy audit two sections up) checked the original
34 against their own stated inclusion criterion — "a personal name or Qur'an-given title, not a
prophet" — using the app's own search API rather than memory, and found 4 material gaps meeting
that exact bar: **As-Samiri** (20:85, 87, 95 — the one named as leading the Israelites astray with
the golden calf), **Zayd** (33:37 — the only Companion of Muhammad ﷺ named by personal name
anywhere in the Qur'an), **Dhul-Qarnayn** (18:83, 86, 94 — a Qur'an-given title, "the Two-Horned
One," with a full dedicated narrative, 18:83-98), and **Uzair** (9:30 — named once, in the context
of a claim of divine sonship the Qur'an rejects). All 4 were added using the identical
verification pipeline described below (including catching a homograph risk for Zayd: زيد the name
vs. the common verb root "to increase" — 24 of 25 raw substring matches were verb forms, only
33:37 is the proper name).

**Known, deliberate exclusions** (documented in the dataset file's own header comment, so future
maintainers don't mistake them for oversights):
- **'Imran** — his name occurs only in genitive/possessive constructions ("family of 'Imran,"
  "wife of 'Imran," "Maryam, daughter of 'Imran") with no independent narrative or action
  attributed to him — no person-focused profile to build.
- **Harut, Marut** (2:102, named angels) **and Iblis** (named, but a jinn) — named, but not
  human; this feature is scoped to human Qur'anic persons.
- **Unnamed-but-identifiable individuals** (Pharaoh's wife, the believing man of Pharaoh's family,
  Al-Khidr, Habil/Qabil — note the last two are commonly *misremembered* as Qur'an-named but are
  not) remain future scope, unchanged from the original spec's §2 exclusion.

Unlike the original 9-person seed (which used a *representative, non-exhaustive* subset of each
person's mentions), `directMentions` here is **exhaustive per person** — every ayah where that
name is explicitly present, not a curated sample. That required a materially different
verification method than a single API search, because the search endpoint does root/substring
matching, not whole-word matching:

1. Every raw search result was passed through a whole-word normalizer (strip tashkeel; unify
   alef/ya/ta-marbuta forms; strip common single-letter prefixes وفلبك and multi-letter ones like
   لل/بال; account for the accusative-case tanwin fatha, which is orthographically a trailing alef
   letter, not just a diacritic — e.g. "نُوحًا" normalizes to "نوحا," one letter longer than the
   bare name "نوح," and naively comparing them would produce false *negatives* on genuine
   "We sent [Prophet]" mentions, which is exactly what happened on a first pass before the fix).
2. For any name that is *also* a common Arabic word — a true homograph the whole-word filter
   cannot resolve — every remaining match was read in full and hand-classified. Three names
   proved genuinely contaminated this way: **Hud** (هود, also the word for "Jewish" — 3 of 10
   whole-word matches were false positives), **Salih** (صالح, also the ordinary adjective
   "righteous," used constantly in "believed and did righteous deeds" — only 9 of ~43 matches were
   genuinely the prophet), and **Yahya** (يحيى, spelled identically to the common verb "gives
   life" — only 5 of 28 matches were the proper name; 23 were verb forms like "Allah gives life
   and causes death"). Every other name in the dataset is an unambiguous foreign proper noun with
   no such collision risk, confirmed by reading a sample of each, not assumed.
3. **Bilqis is the one deliberate exception, not a gap**: the live search API returns zero matches
   for "بلقيس" — her name literally does not appear in the Qur'an text (only pronouns and titles
   like "a woman ruling them" are used). `directMentions: []` for her is therefore correct, not
   incomplete; she still has a full Related Passage. Her card is the first concrete illustration
   in this dataset of the spec's own direct-mention-vs-related-passage distinction being load-
   bearing, not decorative.

A card's "N direct mentions" count is now the true, exhaustive count of verified name-occurrences
for that person — not a sample size. See the full audit report (before/after counts, every
correction made, every disputed/uncertain entry) delivered as this expansion's final report;
worth reproducing here for anyone extending the dataset further:

**Verification pipeline, for reuse when adding more people:**
`quranapi.pages.dev`/`api.alquran.cloud` search → whole-word normalize+filter (catches most
substring noise for free) → for any name that could double as ordinary vocabulary, read every
remaining match's full ayah text by hand before trusting it. Skipping step 3 for a homograph-prone
name is exactly how Hud/Salih/Yahya would have shipped with dozens of false positives.

### Final content-audit pass (post-expansion)
After the 34-person expansion above (which focused on `directMentions` accuracy), a separate pass
independently re-checked every entry's *qualitative* fields — `keyLessons`, `relationships`,
`chronology`, `statusNotes` — against the actual text of every cited ayah (fetched fresh from
`quranapi.pages.dev`, not recalled from memory), specifically hunting for two failure modes: a Key
Lesson claiming something its cited ayah doesn't actually say, and a `relationships` entry marked
`sourceType: "quran"` without a specific ayah that actually states it (as opposed to a broader
inference). Five corrections came out of it, all narrow — no schema changes, no UI changes, no
entries added/removed:
- **Adam** — keyLesson 2 dropped "in contrast to Adam's humility"; the cited ayahs (2:34, 7:12)
  describe only Iblis's refusal, not Adam's response, so the contrast wasn't something those two
  ayahs actually state.
- **Ishaq** — keyLesson's citation moved from 37:113 (which is about mixed outcomes among
  descendants, not continuity of prophethood) to 29:27, which explicitly says prophethood/
  revelation was "reserved for his descendants."
- **Isa** — removed the `{ personId: "adam", relationshipType: "ancestor", sourceType: "quran" }`
  relationship. Its likely textual basis, 3:59, compares Isa's *creation* to Adam's (both directly
  created, no father) as a rebuttal to divinity claims — not a lineage statement — and the claim
  would in any case be trivially true of every person in the dataset, so singling it out only for
  Isa was an inconsistent, unsupported addition. A `statusNotes` entry now records why.
- **Fir'aun** — keyLesson 2's citation moved from 44:31 (a bare "tyrant, transgressor" label) to
  44:25 + 44:29, the ayahs that actually state the "no protection" claim (gardens/wealth left
  behind; "neither heaven nor earth wept... nor was their fate delayed").
- **Haman** — keyLesson's citation moved from 28:8 (a generic "was sinful" mention inside the
  unrelated Musa-infancy narrative) to 28:38, an already-verified direct mention where Pharaoh
  orders Haman by name to bake bricks and build the tower — the actual textual basis for the
  "administrative role, shared culpability" claim.

Every other Key Lesson, relationship, chronology label, and the special-case entries (Bilqis's
empty `directMentions`, Shu'ayb's excluded father-in-law claim, Dhul-Kifl/Al-Yasa's `"unknown"`
chronology, Abu Lahab's split quran/traditional_account relationship pair, Talut/Jalut's hedged
Saul/Goliath identification) were checked against the same fetched ayah text and found accurate
as written — confirmed, not changed. This pass was content-audited against the Qur'an and the
dataset's own cited source classifications; it was **not** independently reviewed by a qualified
scholar, and should not be represented as such.

### Data model (`app/data/quranPersons.ts` in the reference implementation)
```
QuranPerson {
  id, name, arabicName, alternateNames?,
  primaryCategory: "prophet"|"woman"|"man"|"ruler_leader"|"companion"|"family_relative"|"other",
  secondaryCategories?: PrimaryCategory[],       // filtering matches primary OR secondary
  personType: "prophet"|"messenger"|"prophet_and_messenger"|"quranic_person"|"title_based_person",
  honorific?: { short?, arabic? },               // e.g. "AS"/"عليه السلام" — omitted for non-prophets
  shortDescription, detailedDescription?,
  themes?: string[],
  chronology?: { label?, order?, status: "strong"|"traditional"|"uncertain"|"unknown" },
  directMentions: QuranReference[],              // { surahNumber, ayahNumber } — exact name mentions only
  relatedPassages: RelatedPassage[],              // { id, surahNumber, ayahStart, ayahEnd, title?, description?, storyOrder?, source:"quran", verificationStatus:"verified" }
  relationships?: PersonRelationship[],           // { personId, relationshipType, sourceType, verificationStatus } — personId MAY point outside the seed dataset, see below
  keyLessons?: KeyLesson[],                       // { text, quranReferences, status:"quran_derived" }
  sources?: SourceReference[],                    // { type, citation, note? }
  statusNotes?: string[],
}
```
**Source-separation is the core discipline of this module**: `sourceType`/`verificationStatus`
fields exist on relationships, and `status`/`chronology.status` exist elsewhere, specifically so
the UI never presents a traditional/uncertain claim with the same visual weight as a direct
Qur'anic reference. Preserve this distinction in any rebuild — it's the spec's explicit product
principle (§34): **Person → Qur'anic references → Context → Lessons → Relationships →
Supplementary traditional information**, not biography-first.

**Relationships may reference a person id outside the current dataset** (e.g. this seed's Ibrahim
entry names "ismail"/"ishaq" as sons, and Musa names "harun" as a brother, none of which have
full profiles yet) — this is intentional (spec §14's own example does the same with "Lut"), not a
data bug. The dataset validator (below) deliberately does **not** flag this; the UI layer is
responsible for only linking a relationship chip when the target id actually resolves, and
rendering the rest as plain text.

### Pure logic (`app/utils/personsSearch.ts`, `app/utils/personsValidate.ts`)
Kept dependency-free (no Nuxt/Vue imports) specifically so they're unit-testable in isolation and
reusable if the UI layer is rebuilt on another stack:
- `searchPersons(persons, query)` — matches name/arabicName/alternateNames/description/themes/
  categories, case-insensitive and tashkeel-insensitive; an exact `"11:25"`-shaped query resolves
  to whichever person(s) have that reference in `directMentions` **or** inside a `relatedPassages`
  range, falling back to text search if nothing matches.
- `filterByCategory(persons, category)` — `"all"` passthrough, else primary-OR-secondary match.
- `groupDirectMentionsBySurah(person)` — Direct Mentions are always grouped/collapsed by Surah in
  the UI (spec §9), never rendered as one flat list.
- `groupRelatedPassagesBySurah(person)` / `sortRelatedPassagesForStoryView(person)` — the two
  Related Passages view modes (spec §11); Story View sorts by `storyOrder`, falling back to
  surah/ayah order for any passage missing one, so an incompletely-curated person still renders
  sensibly.
- `validatePerson`/`validateDataset` (personsValidate.ts) — checks every reference's
  surah/ayah against the **real** per-surah ayah counts (Module 1's surah list), catches
  duplicate direct mentions and inverted/out-of-bounds passage ranges, and duplicate person ids
  across the dataset. Run this against any dataset addition before shipping it — see
  `tests/personsDataset.test.ts` for the automated form of the same check.

### Audio integration (reuses Module 4, does not duplicate it)
"Play all passages" queues every ayah across a person's (or one passage's) ranges and drives them
through the *same* shared global audio player. This required one small, additive change to Module
4: an `endedAt` tick (`Date.now()` on every natural end-of-playback, distinct from a user pause)
that a caller can `watch()` to advance its own queue — a generalization of the pattern Module 4
already used internally for surah-to-surah auto-advance, not a parallel playback system.

### Reuse boundaries (per spec §10/§12/§17 "do not build a second X")
- Arabic/translation text and per-ayah audio come from Module 1/2's existing chapter-fetch and
  per-ayah audio resolution (by reciter *name*, same caveat as Module 2) — never hardcoded.
- Tafsir panel reuses Module 1's `useTafsir` cache-through fetch.
- Ayah-level bookmarking on every reference card reuses Module 9's `ayah:{surahNo}:{ayahNo}` key
  directly. **Person-level bookmarking** (below) extends Module 9's *same* flat key-set/`toggle`
  primitive with a `person:{id}` namespace — not a separate bookmark store.
- "Read in Quran" / "Read Passage" deep-link to Module 2's reader as `/surah/{surahNo}#ayah-{n}`,
  the same anchor convention Module 3 (Search) already uses.
- **Download audio** and **download-as-wallpaper** buttons added to `AyahReferenceCard` reuse
  Module 4's save-to-device composable and Module 13's ayah-card dialog respectively — same
  reasoning as every other row here: the card resolves the ayah's audio URL the same way its own
  play button already does (fetched once, cached on first play/download, not re-fetched), and opens
  the *same* `AyahShareCard` dialog component the Surah reader uses, just fed this card's own
  arabic/translation/reference props. Every module built on top of this card (Duas, Persons,
  Events, Signs, Commands, Stories) picked up both buttons automatically — no per-module wiring.

### Translation language + Tafsir source now match the main reader exactly (closed gaps)
An earlier version of this module hardcoded English-only translation text and only the first
available Tafsir source in `AyahReferenceCard` — a real gap against spec §10/§33's "user's selected
translation... additional translations available through an expand/selection mechanism" and
"existing Tafsir functionality is reused" acceptance criteria, caught by re-reading the shipped
code against the spec's own checklist rather than assuming it was covered. Fixed by extracting the
main Surah reader's (`app/pages/surah/[id].vue`) own pre-existing, previously page-local logic into
two shared composables, then pointing **both** the reader and `AyahReferenceCard` at them — not by
inventing a second preference system:
- **`useTranslationPreference.ts`** — `TRANSLATION_LANGS` (english/urdu/bengali/arabic2),
  `isRtlTranslationLang`, `translationLangTitle`, and a `preferredLang` `useState` backed by the
  *same* raw `localStorage["translationDefaultLang"]` key the reader already wrote to. Raw
  (non-`$storage`) on purpose — switching wrappers would silently break reading back a value
  already saved by a user under the pre-refactor code.
- **`useTafsirPreference.ts`** — `TAFSIR_AUTHORS` (Ibn Kathir / Maarif Ul Quran / Tazkirul Quran)
  and a `preferredAuthor` `useState` backed by the existing raw `localStorage["tafsirDefaultAuthor"]`
  key, same rationale.
- `AyahReferenceCard` seeds its local selection from these on mount (same "freshly-opened panel
  defaults to the last pick anywhere" behavior the reader's own per-ayah panels already had), lets
  the user switch via the same chip-picker interaction pattern as the reader, and writes back
  through the shared setter — so a change in either surface is instantly reflected in the other
  within the session and persists identically for the next one. Tafsir sources are fetched **once**
  per ayah (`getTafsir` already returns all sources in one call) and cached locally; switching
  author re-reads the cached array instead of re-fetching — verified with a request-count check
  (0 network calls while switching sources on an already-open card).
- Graceful fallback: if a selected language's array entry is empty/missing for a given ayah, the
  card shows "Translation not available in {Language} for this ayah." instead of blank text,
  without silently switching the user's stored preference just because one ayah lacks that field.
- **A second instance of the exact same TDZ bug from Phase 2** (a ref referenced inside an
  `immediate: true` watcher before its own `ref()` declaration later in the file) crept back in
  while rewriting this component — caught again by driving the actual page in a browser, not by
  code review alone. Fixed the same way: every ref a watcher assigns must be declared above it.
  Two-for-two on this exact class of bug in this file is worth remembering as a standing risk when
  editing it further — read the whole file's declaration order before adding a new `watch(...)`.
- Verified: main reader still shows/switches translation and Tafsir correctly after the refactor
  (`/surah/11`, `/surah/12`); a preference set in the main reader is picked up by
  `AyahReferenceCard` and vice versa (checked with a properly shared browser context — an initial
  false negative came from each Playwright `newPage()` call getting its own isolated
  context/localStorage, a test-harness mistake, not a product one); Arabic rendering, bookmarking,
  and "Read in Quran" all still work; no new lint errors; no mobile overflow.

### Person-level bookmarking + resume study state (spec §17)
- **Bookmarking**: Module 9's `useBookmarks` gained `makePersonKey(id) → "person:{id}"` and the
  matching `isPersonBookmarked`/`togglePerson`/`removePerson` helpers — same flat `Set<string>`,
  same `add/remove/toggle` primitives as every other content type, just a new namespace. Surfaced
  as a toggle button in the person-card corner (mirrors the existing surah-card favorite-button
  placement) and in the detail-page header.
- **Resume state** is a *new* small persisted record, deliberately modeled after every other
  module's `useState`+`$storage` shape rather than folded into Module 9 itself (Module 9 only
  knows "bookmarked or not," not "which section was I reading"):
  ```
  PersonStudyState {
    personId, lastSection: "overview"|"key-lessons"|"direct-mentions"|"related-passages"|"family"|"notes",
    passageView: "surah"|"story",       // remembers which Related Passages view mode was active
    lastSurahNo?, lastAyahNo?,          // last ayah/passage opened via "Read in Quran"/"Read Passage"
    updatedAt
  }
  ```
  Storage key: `quran:persons-study:v1`, shape `Record<personId, PersonStudyState>`. Pure update
  functions (`updateSection`/`updatePassageView`/`updateReference`/`clearStudyState`) live in
  `app/utils/personStudy.ts`, unit-tested in isolation (`tests/personStudy.test.ts`); the
  composable (`usePersonStudy.ts`) is a thin `useState`+`$storage` wrapper, same pattern as
  `useReminders`/`useTasbeeh`.
- **Section detection** uses one `IntersectionObserver` per detail-page visit (rootMargin biased
  toward the upper third of the viewport, so a section only counts as "current" once meaningfully
  scrolled into view — not on a bare one-pixel peek), watching each section's DOM element and
  calling `recordSection` on every section change. Reference tracking (`lastSurahNo`/`lastAyahNo`)
  is driven separately, from an `open` event each reference/passage card emits on "Read in
  Quran"/"Read Passage" click — not from the scroll observer, since a jump-to-reader click is a
  much stronger "this is what they were studying" signal than scroll position alone.
- **Resume banner**: shown only when the person is bookmarked *and* has saved state past the
  overview (spec's "when a person is saved, retain..." — resume is a saved-person feature, not
  tracked-for-everyone), with a one-tap scroll-to-section action and a dismiss control.
- **Surfacing bookmarked persons**: the directory page (`/persons`) gained a "Saved" filter chip;
  the existing `/bookmarks` page (Module 9's UI) gained a "People" tab reusing its generic
  category-tab template, enriched with a "Resume: {section label}" subtitle sourced from the same
  `usePersonStudy` state.

### Family & Relationships (spec §14)
`FamilyTree.vue` renders the current person as a root node with each `relationships[]` entry as a
branch: relationship-type chip + a source/status chip whose color/variant is the load-bearing
signal (`verified` → filled primary; `traditional`/`uncertain` → outlined, non-primary) so a
traditional-source relationship is never visually equal to a Qur'an-sourced one — the spec's
source-separation principle applied to this specific section. A relationship's `personId` is
resolved through `usePersons().resolveRelated`: if the target exists in the dataset it becomes a
link; if not (e.g. this seed's Ibrahim → "ismail"/"ishaq", Musa → "harun" — none of whom have full
entries yet) it falls back to a small `STUB_PERSON_LABELS` map so the UI still shows a proper name
("Isma'il (AS)") instead of a raw lowercase id — a real bug caught during browser verification,
not a hypothetical. No separate "Related People" list was built alongside the tree; the tree *is*
the related-people list, just laid out with connector styling.

### Prophetic Timeline (spec §15)
A dedicated route (`app/pages/persons/timeline.vue`, Nuxt's static-route-beats-dynamic-segment
resolution keeps it from colliding with `[id].vue`'s catch-all — verified directly, not assumed),
built on a pure `buildTimeline(persons)` function (`app/utils/personsTimeline.ts`):
- **Mainline** = persons with `primaryCategory: "prophet"` *and* a `chronology.order`, sorted
  ascending — everyone else is either a branch or "unlinked," never silently dropped.
- **Branches** are read **only from a mainline prophet's own outgoing `relationships[]`**, not
  inferred from the other person's relationships pointing back. A caught bug during
  implementation: an earlier version also scanned the reverse direction, which broke two ways at
  once — it mislabeled *which* person the branch was (reusing the raw relationship's `personId`,
  which names the prophet, not the branch person) and would have required inverting directional
  relationship types (father → son) to be correct, which is exactly the kind of unverified
  inference the feature spec prohibits (§3, §14). The fix: read forward-only, and when a
  relationship matters from both sides (Isa ↔ Maryam in the seed data), record it explicitly on
  *both* people — same authored-not-inferred discipline as the rest of the dataset.
- **Chronology display** was extracted into a shared `chronologyText()` helper
  (`app/utils/personsChronology.ts`) used by the timeline, `PersonCard`, and the detail page, so a
  `status: "strong"` chronology (only Muhammad's, in the seed data) renders with no qualifier while
  every other status gets an explicit "Traditional/uncertain/unknown chronology" suffix — one
  place to keep spec §30's "never let uncertain look as authoritative as verified" rule correct,
  instead of three copies that could drift.
- **Unlinked persons** (no `chronology.order` and not named in any mainline prophet's
  relationships — Luqman, in the seed data) get their own clearly-labeled tray below the main
  sequence rather than being omitted or force-fit into the chronology.
- Branches are collapsed by default per-node (spec §15 "prevents the main timeline from becoming
  visually overloaded") and reuse the same `resolveRelated`/`STUB_PERSON_LABELS` fallback as
  `FamilyTree.vue` for resolving relationship targets not in the dataset.

### Phase 5 — polish pass (accessibility, mobile, performance)
Verified in a real browser, not assumed — this pass found and fixed three genuine bugs, none of
them hypothetical:
- **Icon-only buttons had no accessible name.** `AyahReferenceCard`'s play/bookmark buttons
  rendered as bare icons with no `aria-label` — a screen reader would announce nothing meaningful.
  Fixed with instance-specific labels (e.g. "Play recitation of Hud (11) ayah 25").
- **Category-filter and "Saved" chips were keyboard-reachable but had no `role="button"` or
  pressed-state.** Confirmed by inspecting Vuetify's actual rendered output: a clickable `v-chip`
  gets `tabindex="0"` automatically but **not** `role`/`aria-pressed` — so a sighted user sees the
  active filter via color, but a screen reader user got no non-visual equivalent (the exact
  failure mode spec §24's "do not rely on color alone" warns about, just for a different kind of
  sensory channel than the chronology chips it was written for). Fixed by adding
  `role="button"` + `:aria-pressed` explicitly; **don't assume a Vuetify interactive component is
  fully accessible by default — check the rendered DOM.**
- **Horizontal overflow on mobile.** The detail page's `Back to directory` / `Save Person` header
  row didn't wrap at narrow widths, pushing "Save Person" 27px past a 375px viewport. Root-caused
  with a DOM script measuring every element's bounding rect against the viewport (not guessed from
  a screenshot) — fixed with `flex-wrap`. The Timeline and directory pages had no overflow;
  the bug was specific to that one un-wrapped flex row.
- **7 redundant identical network requests** for one Surah's chapter data, confirmed by capturing
  actual request URLs (not just a request count): every `AyahReferenceCard` in an expanded Direct
  Mentions group independently calls `useChapters().getChapter(surahNo)`, and since
  Module 1's cache-through only checks IndexedDB (no in-flight-request dedup), 7 concurrent cards
  all miss the not-yet-written cache and each fire their own fetch. Fixed at the source — Module 1
  itself (`useChapters.ts`) gained a module-level in-flight-promise map, the same "module-scope
  cache" convention `useTafsir.ts`/`useQuranDB.ts` already use — collapsing 7 requests into 1.
  This benefits **any** future concurrent-same-chapter caller app-wide, not just this feature;
  verified the existing Surah reader (`/surah/11`, `/surah/12`) still renders correctly afterward.
- Confirmed clean (no fix needed): Arabic renders correctly in its own RTL context throughout
  (mixed Arabic/English layouts, chip content, timeline node labels); lazy-loading already worked
  as designed (zero chapter requests before a Direct Mentions group is expanded — the redundancy
  above was *within* one expand, not a missing-laziness problem); the directory and Timeline pages
  had no mobile overflow; decorative icons (timeline connectors, branch-type icons) got
  `aria-hidden="true"` since adjacent text already fully labels them.

### Unnamed-but-identifiable Qur'anic persons (spec §2 future expansion)
Not built — out of scope by design at this dataset size, not a gap in the shipped phases.

### Final QA / release-readiness pass (38-person dataset)
A pre-release pass covering lint, dataset structure, navigation, Qur'an-reference rendering,
uncertainty-visibility, and responsive behavior (desktop/tablet/mobile) found and fixed two real,
pre-existing defects — neither introduced by the 34→38 expansion, both now fixed:

1. **Family Tree and Timeline relationship links were dead** (`FamilyTree.vue`, `PropheticTimeline.vue`).
   Both used `<component :is="hasHref ? 'NuxtLink' : 'span'">` — passing the *string* `'NuxtLink'`
   to a dynamic `:is` doesn't resolve to the actual component in this setup (Vue's dynamic-component
   resolution needs a component reference or a template-statically-detected tag, not an
   auto-imported component referenced only by name string), so it silently rendered as a literal,
   non-functional `<nuxtlink>` custom element — visible as normal text, but produced zero clicks. No
   automated test caught this because the existing tests check the *data* `buildTimeline` produces,
   not that the rendered link is clickable — a gap worth remembering for any rebuild: **click-test
   at least one dynamic-component link, don't just assert on its `innerText`.** Fixed by replacing
   the dynamic `:is` with a plain `v-if`/`v-else` `<NuxtLink>`/`<span>` pair in both files.
2. **The Direct Mentions section's hint text was stale.** It read "a curated, non-exhaustive subset
   — see About for dataset notes" — accurate for the original 9-person seed, but never updated when
   the 34-person expansion made Direct Mentions exhaustive (see the dataset section above), and the
   linked About page never actually contained the referenced "dataset notes" in the first place.
   Fixed to accurately describe the exhaustive-verification methodology, with the dangling link
   removed. **Any product-wording claim about the dataset's completeness needs to be re-checked
   whenever the underlying verification standard changes — it won't be caught by tests.**

Also fixed as a minor content-consistency issue: one of Dhul-Qarnayn's `themes` entries was a full
clause (61 characters) rather than a short tag like every other entry's themes — `v-chip` doesn't
wrap or cap its own width, so on a narrow (mobile) viewport it visually clipped past the screen
edge without tripping a page-level horizontal-overflow check (the chip clipped *within* its own
box, not the page). Shortened to match the dataset's established short-tag convention; **this is
a reminder that a page-level overflow check is not sufficient for catching clipped individual
elements — screenshot review at each breakpoint is still necessary.**

Everything else checked (dataset composition, all 25 prophets + 13 named/title-based figures
present, directory/search/deep-link/back navigation, all category filters including the
newly-populated Companions filter, Qur'an reference rendering — Arabic/translation/tafsir
picker/Read in Quran/audio/bookmark — on both new and previously-corrected entries, uncertainty
visibility in Scholarly & Traditional Notes for every flagged disputed/traditional entry, and
responsive layout at 1280/768/390px) passed without defects.

### Rebuild notes
- Treat the dataset (`quranPersons.ts`-equivalent) as content, not code — in a rebuild, prefer
  storing it as versioned structured data (JSON/CMS-backed) so it can grow past these 38 without
  a code change, and so the verification workflow (spec §28) can run against it independently of
  app releases.
- The exact-reference search behavior (`"11:25"` typed into the search box) is a small but
  high-value detail from spec §16 — don't drop it when reimplementing search.
- If a rebuild's router doesn't guarantee static-beats-dynamic route resolution the way this app's
  does, give the Timeline an unambiguous path (a static segment, not something that could collide
  with a person id) rather than relying on it.
- Resist the temptation to auto-infer the reverse of a directional relationship (son ↔ father,
  etc.) — require it to be entered explicitly on both sides instead, per the Timeline note above.
  Symmetric relationship types (opponent/supporter/contemporary) are the one exception worth
  recording on both people's sides deliberately — Musa's own entry lists Fir'aun/Haman/Qarun as
  opponents specifically so the Timeline can surface them as his branches; recording the fact only
  on the *other* person's side (Qarun→Musa) left Qarun stranded as "unlinked" until this was fixed.
- Keep resume-state's pure update logic separate from its persistence wrapper (as done here) —
  it's what made the section-tracking behavior actually testable without standing up a DOM.
- When exhaustiveness matters (as it now does for Direct Mentions), budget for the homograph check
  as a real, separate step — see the dataset section above. A whole-word filter alone is not
  enough for any name that doubles as ordinary vocabulary.
- **Never trust a component library's default accessibility.** Every accessibility fix in Phase 5
  came from inspecting real rendered DOM/ARIA output, not from assuming Vuetify (or whatever UI
  kit a rebuild uses) handles it. Budget time to actually check.
- If any content-fetching composable can be called by several component instances that might mount
  concurrently for the *same* underlying resource (this feature's Direct Mentions groups; likely
  true of list/grid UIs generally), give the fetch layer in-flight-request dedup, not just a
  post-hoc cache — the cache alone doesn't help until the first write has actually landed.

---

## Module 18 — Wajibat & Daily Fiqh (Ja'fari)

**Status: Phases 0–3 built (Phase 3 on branch `wajibat-module`, with the P12–P14 fixes and Khamenei's
Q&A supplementary entries, P13). Phase 4a (doubts, ṣalāt al-iḥtiyāṭ, sajdat al-sahw content) is built; Phase 4b (the decision helpers: prayer doubts and wuḍūʾ, for Sistani
and Khamenei) is built and merged, its four helpers hidden until a reviewer signs off every path. Phase 5 (Sawm: fasting and zakāt al-fiṭrah, 13 topics, 341 rulings)
was merged. Phase 6 (Khums and Zakat: 21 topics, 605 rulings; Sistani chapters in full, Khamenei's *Rulings of Khums* Q&A and its 78 rule paragraphs; no calculator, paying topics link only to the marja's official site) is built on `wajibat-module` and awaiting review. Phases 7–8 and 10 are pending; Phase 9 (tracker) is deferred.** Spec:
`wajibat-fiqh-jafari-module.md`. Decisions and official sources: `wajibat_decisions.md`. Phase
reports: `wajibat_progress_log.md`.

### Purpose
A source-verified, practical guide to the obligatory acts (wajibat) of Fiqh Ja'fari: taharat,
salat, sawm, khums, zakat, a Hajj overview, the remaining furu' al-din, and selected daily-life
obligations. It lives at `/fiqh`. This is the **practical-fiqh layer**. It is deliberately separate
from Commands & Prohibitions (the Qur'anic-text layer, `/commands`), and the two will be
cross-linked only in the Knowledge Graph phase.

### Business rules (fixed by the decisions log)
- There are three maraji' (Sistani, Khamenei, Makarem Shirazi). The user picks one, and a first-visit
  picker appears before any ruling is shown. There is no silent default, and there is no
  side-by-side comparison in the UI.
- A missing ruling for the chosen marja' shows a "not added yet, refer to his risala" notice. It
  **never** falls back to another marja's ruling.
- Content is filtered by `usePrayerStore().fiqh`. Sunni users can still see the module, with a
  "Fiqh Ja'fari only for now" banner.
- Every ruling carries the marja', book, issue or Q&A number, `basis`
  (fatwa / ihtiyat wajib / ihtiyat mustahab / **ihtiyat unspecified**) and a verification level
  (A / B / D; C is never stored). "Unspecified" is used when a source says "caution" without a type
  and the book defines none. It is never guessed as wajib or mustahab (R3).
- Qur'anic-basis cards link only ayahs whose own text names the act (R2). They are shown apart from
  the rulings.
- Where the official Urdu edition lags a revised ruling, the Urdu is withheld, and an app-written
  Urdu notice (explanation) says so (P6).
- Every topic page shows a "Not scholar-reviewed" label and a study-aid disclaimer.
- English + Urdu content (Urdu in Noto Nastaliq Urdu). Recitations are text only, with no audio.
  The personal tracker is deferred.

### Source discipline
Only the marja's official website or risala, or official Q&A, counts as a level-A source.
Secondary sites (e.g. al-islam.org) are level B at most. Nothing is written from memory. The
official books and URLs verified in Phase 0 are listed in `wajibat_decisions.md`: Sistani's
*Islamic Laws* 4th ed. and Urdu *توضیح المسائل*; Khamenei's *Practical Laws of Islam* (Q&A) and
*The Rules on Prayer & Fasting 2023*. Makarem Shirazi's primary text couldn't be reached as of
Phase 0 and is still an open question.

### Reuse boundaries
Prayer times, Qibla and the Ja'fari method come from Module 5. The fasting log comes from Module 11.
Bookmarks come from Module 9 (`fiqh:{topicId}` namespace plus a "Fiqh" tab). Qur'anic-basis cards
reuse Module 17's `AyahReferenceCard`, and Qur'an citation types come from
`app/utils/quranReference.ts`. Do not build a second prayer-time, fasting-log, bookmark, audio or
reminder system.

**Data loading (Phase 5 follow-up).** `app/data/wajibat/index.ts` is the full synchronous dataset, for the unit tests and the
generator scripts only. The app imports `app/data/wajibat/runtime.ts`: a small core (categories, topics, glossary, the
one-line `rulingIndex.ts` used by search) plus one lazily loaded chunk per category (`chunks/<category>.ts` ->
`wajibat-data-<category>-<hash>.js`, cut by `manualChunks` in `nuxt.config.ts`; each holds that category's rulings,
procedures, recitations and helpers). A topic page runs `await loadCategory(id)` last in its setup, so the chunk is
loaded before it renders on the server and the client. Every cross-reference (`seeAlso`, procedure steps, helper quotes)
stays inside one category (`tests/wajibatChunks.test.ts` enforces it). All `wajibat-data-*` chunks are kept out of the
install-time precache and written to the `wajibat-data-cache` by `useFiqhOfflineCache.ts`: a visit caches the core and
that category; "Save all for offline" loads every category, caches all five chunks and records the build id. The browser
suites are in `tests/e2e/wajibat/` (`npm run test:e2e:wajibat`).

Phase 5 reuses these: the fasting topic "Dawn, maghrib and breaking the fast" has `liveTool: "sawm"`, which shows
today's Fajr and Maghrib from `usePrayerStore()` (nothing recomputed) with links to `/prayerTime` and to the Module 11
Ramadan fasting log at `/ramadan` (no second log). A topic page shows one "No rulings from … have been added yet" notice
instead of a card per ruling when the chosen marja' has no entry for any ruling of the topic (today: zakāt al-fiṭrah for
Khamenei, and the one-ruling `ahkam` topic).

### Data model (as implemented — `app/data/wajibat/types.ts`)
- `Marja { id: "sistani"|"khamenei"|"makarem", name, officialSite, status: "active"|"pending-sources", books[] }`.
  A `pending-sources` marja' is selectable, but may hold no rulings (the validator enforces this).
- `WajibatCategory { id, fiqh, title, arabicTerm, icon, order, phase, summary: Explanation, topicIds }`.
  There are 9 categories; the ones whose phase hasn't shipped have `topicIds: []`.
- `WajibatTopic { id, fiqh, categoryId, title, arabicTerm?, summary, explanations?, quranicBasis?, quranicBasisNotes?, rulingIds, procedureIds?, relatedTopicIds?, glossaryIds?, liveTool?, sensitive?, reviewedBy?, lastSourceCheck }`.
  - `quranicBasisNotes` (P9): a one-line explanation on a basis ayah, with a verbatim tafsir quote and its source.
  - `liveTool` (`"prayertimes" | "qibla" | "sawm"`) shows live data from Module 5 (today's prayer times, a Qibla link, or today's dawn and maghrib for fasting). It never recomputes it.
- `Ruling { id, topicId, subject, rulings: MarjaRuling[], differsBetweenMaraji?, status?: "disputed", sensitive?, panel?, recitationIds?, supplementary? }`.
  `sensitive` places the ruling in the collapsed women-specific panel.
  - `recitationIds` (P12): Arabic shown next to the ruling as a separate `Recitation { id, marjaId, arabic, transliteration?, source }`,
    used when the Arabic comes from a different official book than the quote (e.g. Sistani's Urdu Tawzih, when his English book
    prints the dhikr as an image). Never spliced into the quote.
  - `englishWithheld?`, `persianSource?` (R11, Khamenei only): the English differs from the Persian original, so only the official Urdu is
    shown, in every language mode. `persianSource` records which Persian ruling the pair was compared with (never displayed).
  - `urduOnly?` (P19): the marja's only official text is Urdu (Khamenei's *Aḥkām-e Āmūzishī*, the official Urdu translation of his Persian
    treatise; no official English exists). `text.en` is `""`, the Urdu shows in every language mode with a "no official English translation"
    label, and the app never translates it. Steps and helper quotes in English may not use it.
  - `seeAlso: { marjaId, rulingId }[]` (Phase 4a): for a marja' with no entry in this ruling whose book states the point
    inside another ruling on the same topic page. The UI links to that card instead of showing "not added yet", and
    coverage doesn't count it as a gap.
  - `supplementary: { marjaId, agreesWith: SourceCitation[] }` (P13/R7): one marja's own Q&A answer, added only where it agrees
    with the cited rulings of his main book. Shown only to his followers (topic page, search and coverage all filter it), so
    no other marja' ever sees a "not added yet" gap for it.
  - `audience?: MarjaId` (Phase 6): a point stated by one marja' only (a Q&A with no ruling in another marja's book to agree with), exactly one
    entry for that marja'. Shown only to his followers like `supplementary`, but it needs no agreeing ruling; it cannot be `differsBetweenMaraji`.
  - `WajibatTopic.payLink?: boolean` (Phase 6): the topic page adds a "Where and how to pay" card linking only to the chosen marja's own site.
- `MarjaRuling { marjaId, format: "issue"|"qa", question?, text: {en, ur?}, hukm?, basis, excerpt?, source, urSource?, verification: "A"|"B"|"D", arabicInSource?, urduNote?, urduEditionLag?, note? }`:
  - `hukm` is set only when the source states it.
  - `urSource` carries the Urdu book's **own** number, because the Urdu and English books number rulings differently.
- `Procedure { id, topicId, marjaId, title, steps: ProcedureStep[] }`, where
  `ProcedureStep { id, order, title, instruction, rulingId, hukm?, isRukn?, note? }`.
  - A procedure belongs to **one** marja'.
  - The step `title` is an app label. `instruction` must be a **verbatim substring** of that marja's
    entry in `rulingId`, and the validator enforces it.
- `DecisionTree { id, topicId, marjaId, title, intro, rootId, risala: {book, location, url}, nodes }` (Phase 4b), listed on a topic
  through `decisionTreeIds`. A tree belongs to **one** marja' and the page shows only the chosen marja's.
  - A node is a **question** (`question`, `options`, `notSureId`) or an **outcome**: `ruling` (verbatim `quotes` plus `verdictPhrases`
    and `seeRulingIds`) or `refer` (a pointer to his risala, never a guessed answer).
  - `DecisionOption { id, label, nextId, basedOn: {rulingId, phrase}[] }` names the ruling and the exact phrase it rests on (P17b).
    Questions only describe the user's situation and never state a ruling (P17a). Every question gets "I'm not sure", which
    leads to a `refer` outcome (R12).
  - `DecisionQuote { rulingId, text, lang }`: a verbatim part of that marja's own entry. It is Urdu where the entry is
    `englishWithheld` or `urduOnly`.
  - **Review gate:** each path has an id and a content hash (`app/utils/wajibatReview.ts`); a reviewer's sign-off is stored per path in
    `app/data/wajibat/treeReviews.json`, and a helper is shown only when every path has a current approval (an edited path goes stale),
    or the runtime flag `wajibatShowUnreviewedHelpers` is on. Topic pages never depend on it.
  - Generated by `scripts/wajibat/gen_helpers.py`; the UI is `components/wajibat/DecisionHelper.vue` (one question per screen,
    Back, Start over, answer trail, `aria-live` result with marja' name and the "Not scholar-reviewed" label).
- `Explanation { kind: "explanation", text }` marks app-written text. It is never shown as a ruling.
- `GlossaryTerm { id, term, arabic?, urdu?, definition, source? }`.
- User data is `quran:fiqh-prefs:v1` = `{ marjaId | null, lang: "en"|"ur"|"both", updatedAt }`.
  Settings' export/clear cover it automatically.

### Pure logic
- `wajibatValidate.ts` checks:
  - ids are unique and hyphen-free, and references between categories, topics, rulings and glossary resolve both ways;
  - Qur'an references fall within the ayah bounds in `surah.json`;
  - there is at most one entry per marja' per ruling;
  - a level-A URL is on the marja's official site;
  - Urdu text has an Urdu citation on the official site;
  - a level-D entry is marked `disputed`;
  - a pending marja' has no entries or procedures;
  - procedure steps are ordered 1..n, quote their ruling verbatim for the procedure's marja', and
    link to their topic both ways;
  - an `urduEditionLag` entry carries no outdated Urdu.
  - decision trees (P17, R11, R12, P19): ids unique and hyphen-free; the root exists; every `nextId` and `notSureId` resolves;
    no cycles and no unreachable nodes; every question has at least two options and a `notSureId` that points at a `refer`
    outcome; every option lists the ruling it rests on, and each `basedOn` phrase occurs in that marja's text; every quote is a
    verbatim part of the **same marja's** entry (never another's), in Urdu where the entry's English is withheld or does not
    exist; every verdict phrase occurs in the quotes; every tree is listed on its topic.
- `wajibatSearch.ts` matches without regard to diacritics or tashkeel, and treats Arabic and Urdu letter forms as the same (so "ihtiyat" finds "iḥtiyāṭ" and "تقليد" finds "تقلید").
- `wajibatCoverage.ts` counts sourced vs missing rulings per marja' per topic, broken down by level and by Urdu availability.

### Phase 1 — shipped
- **Pages:** `/fiqh`, `/fiqh/[category]`, `/fiqh/[category]/[topic]`, `/fiqh/glossary`, `/fiqh/choose-marja`.
  - The static segments win over `[category]`, as with `/persons/timeline`.
  - A topic requested under the wrong category shows the not-found state.
- **Content:** the Foundations topics (taqlid, ahkam, usul, furu', bulugh) have 17 rulings and 26 per-marja' entries (Sistani 16, Khamenei 10, Makarem 0), all level A. There are 19 glossary terms.
- **How ruling text is produced:** it is cut from the official pages by script and never retyped. The script fails if an excerpt isn't found in its source.
- **Urdu:** `useUrduFont()` registers only the woff2 file of the Noto Nastaliq Urdu Arabic-script subset (~156 KiB), and only on pages that call it (`/fiqh/**`, `/poets/**`).
- **Real bug found in browser QA:** a long chip (a marja's full name) overflowed at 390 px. Chips holding names must be allowed to wrap.
- **Sources lesson:** the Urdu book on a marja's own site can lag the latest English/Persian edition. For Sistani, the rulings marked * in *Islamic Laws* 4th ed. have to be compared one by one before their Urdu is shown.

### Phase 2 — Taharat (built; awaiting review)
- **Content:** 8 topics (water, najāsāt, muṭahhirāt, istinjāʾ, wuḍūʾ, ghusl, ḥayḍ/istiḥāḍah/nifās,
  tayammum), 131 rulings with 195 entries (Sistani 124, Khamenei 71), all level A, and 18 new
  glossary terms (37 in total).
- **Procedures:** 5 step-by-step guides (Sistani wuḍūʾ, sequential ghusl, immersive ghusl,
  tayammum; Khamenei tayammum), shown in `ProcedureStepper`, one step per screen with Previous/Next.
- **Qur'anic basis:** 5:6 and 4:43, each checked against the app's own ayah text for the words that
  name the act.
- **Real bugs found and fixed:**
  - The Urdu extractor treated in-text cross-references ("…مسئلہ (۶۳۳) میں…") as new مسئلہ headers,
    and let section intros leak into the previous مسئلہ. Mas'ala headers are now matched only at a
    line start, and every text was diffed after the fix.
  - `/bookmarks` imported the Wajibat index and pulled the whole rulings chunk (~335 KB) into that
    page. It now imports only the 13 KB topic/category lists.
- **Lessons:**
  - A marja's two books can number rulings on different schemes: Khamenei's Urdu purity chapter
    runs exactly one ahead of the English. Verify each pair by content, not just by offset.
  - Some rulings are unnumbered, like Sistani's "conditions for the validity of wuḍūʾ". Cite them
    with a descriptive reference, and extract them separately.

### Phase 3 — Salat core (built; on branch `wajibat-module`)
- **Content:** 17 topics, 149 rulings with 287 entries, all level A, and 67 glossary terms.
- **Guided prayers:** ṣubḥ, maghrib and ẓuhr for each marja' (6 procedures, 160 steps). They are generated from a rakʿah template, each step quoting that marja's ruling, with Rukn and wājib marks citing each marja's own lists.
- **Khamenei's source:** *The Rules on Prayer & Fasting 2023* (first priority, R6), read through leader.ir's own contents endpoint (`POST /ajax/book`, 165 sections, 1,003 rulings). It has no Urdu edition, so his Salat entries are English only.
- **Lessons:**
  - (a) A site that renders a book as a collapsible tree may not ship the collapsed sections in its HTML. Use its own contents endpoint, or the text will be silently incomplete.
  - (b) Normalise Unicode (NFC) before verbatim comparisons. The same letter can be stored precomposed or decomposed.
  - (c) An official site may publish key Arabic (here, the rukūʿ/sajdah dhikr) as images. Don't transcribe them; show the source's own transliteration or find a text source.
  - (d) Shared glossary definitions come from one marja's book. Leave out terms whose meaning differs by marja' (e.g. the farsakh in km).
- **Source-snapshot check (added after review):** `tests/fixtures/wajibatSourceSnapshot.json` holds, for every quoted text, the
  official source unit it was extracted from (built by script from the downloaded pages, never from the dataset).
  `validateSourceSnapshot()` requires each quote to equal its numbered unit, or to be a verbatim part of it when marked
  `excerpt` or when the source is an unnumbered passage. It is test-only (~590 KB), never shipped.
  - (e) It caught three hand-added Q&A entries that were paraphrases labelled level A. A validator that only checks
    shape (citation present, URL official) can't see this; only comparing the text with the source can.
  - (f) Keep every review-time data change in the generator, not as hand edits to generated files. Otherwise the next
    regeneration silently drops it, and the snapshot can't tell a correction from a corruption.
- **Offline (R8):** the ruling chunk (`wajibat-data-<content-hash>.js`) is excluded from the install-time precache and
  cached by app code on any `/fiqh` visit or by "Save all for offline". After caching this build's chunk, copies left by
  earlier builds are deleted, and "Saved for offline" checks this build's URL, so a corrected ruling never lingers.

### Rebuild notes
- Store rulings **per marja'** from day one (`Ruling.rulings: MarjaRuling[]`). A single-ruling
  shape can't later express "this marja' is unsourced", and the no-fallback rule depends on that.
- Give each language its own citation (`urSource`). Do not assume the translated books keep the
  original's numbering.
- Keep content generation mechanical: quote from downloaded official texts with a script that
  fails when a quote isn't found. Never have a person or a model retype fatwas.
- Make step-by-step guides quote their rulings, and have the validator check the quotes. A
  paraphrased "how to" is where a fiqh app most easily drifts from the source.
- Keep large content datasets out of shared pages. Import small lookup lists (titles) separately
  from the ruling texts, so that pages like Bookmarks don't download them.

---

## Cross-Module Conventions Checklist (apply when rebuilding any module)

- [ ] One storage record per module, versioned key (`namespace:module:v{n}`).
- [ ] `load()` on client/app start, `persist()` synchronously after every mutation — no debounced
      or batched writes for user data (it's small; correctness beats micro-optimization here).
- [ ] Date keys are **local calendar days**, computed from local `year/month/day`, never a UTC
      timestamp slice.
- [ ] Additive migrations: read the old key once, write the new shape, keep old data readable as a
      fallback until the migration has clearly succeeded.
- [ ] Historical/audit counters (e.g. Hifz's `historicalMistakes`) are never decremented; "current"
      state is always a *separate*, independently computed field.
- [ ] Any module that reads external content should hit Module 1's cache first, network second,
      and never assume network availability.
