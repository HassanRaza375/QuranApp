# Content to verify

Everything below appears in `prototype.html` as a placeholder or was typed from memory. **None of it may ship.** Replace each item with data from the legacy services or data files, or with a named, verified source. Tick items off as pages are built.

## General

- [ ] All English translations in the prototype are the author's own wording, not a published translation.
- [ ] All Urdu, Bengali and "Arabic (Alt)" translations in the prototype are samples.
- [ ] All tafsir text and tafsir tabs are generic sample copy. Real tafsir comes from the legacy tafsir service. There is no Ja'fari tafsir in the current data provider.
- [ ] All dates, times, counts, streaks and "last updated" values are samples.

## By page

**Home (Phase 1)**
- [x] The sample ayah (Ar-Rum 30:7) and its translation: replaced; the text comes only from the verse service. Nothing from the prototype is shipped.
- [x] The sample prayer times, "Maghrib 1h 34m", the Qibla "260 degrees": replaced by the monthly AlAdhan data and the computed bearing.
- [x] "Al-Baqarah 285 of 286, 5%", the Yusuf story row, "0 / 494 ayahs", "14 to practice": replaced by the legacy keys (the story row by the Prophets & People study state until Phase 7; the Hifz count by "Open Hifz" until Phase 14).
- [x] The Arabic words used as row icons (the Qur'an word and Yusuf): not copied; Lucide icons.
- [x] **Which ayahs may be "ayah of the day".** Reviewed and decided (Phase 1 review, 2026-10-15): every ayah whose Arabic text is 15 to 250 characters is eligible (the 15-character floor is kept; it only leaves out the isolated-letter openings), chosen mechanically by date. **No topic-based exclusions**: nothing is left out because of what an ayah is about.
- [ ] **Calculation methods.** Home shows the method name the service returns (ISNA for Sunni, "Shia Ithna-Ashari, Leva Institute, Qum" for Ja'fari). The monthly and daily endpoints agree (120 of 120 comparisons: 4 cities, both methods, 3 days, 5 prayers). They have **not** been compared with an independent source (for example the Leva Institute's own tables), as the Prayer and Qibla item below still requires.
- [ ] The Asr school (Hanafi) is not selectable until Phase 2; Home always uses the standard school.

**Settings (Phase 2)**
- [x] Calculation method names and ids: replaced by the service's own list; `tests/settingsLogic.test.ts` compares each of the seven with a recorded `GET /v1/methods`. The prototype's shortened labels are not used.
- [ ] **Calculation defaults** (ISNA for Sunni, Leva Institute for Ja'fari) are the legacy app's, decided in the Phase 2 review. Many users in South Asia use the Karachi method; the choice is theirs, the default is not changed.
- [x] **Asr (Hanafi) description** softened (Phase 3 review) to "Hanafi uses the later Asr time." The fuller sentence from the prototype ("when a shadow is twice the object's length") was removed because it has no verified source. Restore it only with a named source.
- [ ] **Hijri adjustment wording** ("match your local moon sighting") comes from the prototype; the preview shows the service's own Hijri dates, not a calculation of ours.
- [ ] **Ja'fari methods** (Leva and Tehran) have only been compared between AlAdhan's monthly and daily endpoints, not with an independent source. **Must be done before cutover** (compare several cities and months with the Leva Institute's own tables or another trusted source); same item as under Prayer and Qibla below. Tracked in PROGRESS.md under Phase 16.
- [x] The Reading preview: no prototype ayah is used; it shows today's real ayah or a real surah name from the legacy data.
- [x] The iPhone note: the Home Screen requirement is from the WebKit post "Web Push for Web Apps on iOS and iPadOS" (webkit.org/blog/13878); the app shows it only on an iPhone or iPad whose browser has no Notification API.
- [x] "Reminders only appear while Quran App is open." matches what the code does (timers in the open page; no push, no scheduled notifications).
- [ ] The marja' names come from the legacy Daily Fiqh data (`app/data/wajibat/marja.ts`); that data has its own verification record in `wajibat_decisions.md`.

**Surah reader (Phase 4A)**
- [x] Al-Fatihah Arabic and the translations in the prototype: not used; the reader shows the service's real text (all 114 chapters validated against the real service on 2026-10-16).
- [x] Revelation order numbers: not used (no revelation-order sort).
- [x] The bismillah: never typed; read from the data of surah 1 (checked that no surah's first ayah repeats it).
- [ ] **Translators (open, does not block Phase 5):** the English, Urdu, Bengali and Arabic (Alt) texts have **no translator named anywhere in the data**. Supply the exact names (from the data provider's documentation or your original sources) and they become labels in the Translation menu. Until then the app shows only the labels it already shows.
- [ ] **Tafsir authors and schools (open, does not block Phase 5):** the data names Ibn Kathir, Maarif Ul Quran and Tazkirul Quran only. The reader makes no claim about their schools (the legacy page said "Sunni sources"; that is not carried over). Supply any attribution you want shown.
- [ ] "No Ja’fari tafsir is available from this app’s data provider." is the legacy page's own statement (without "Sunni sources"); it has not been checked against the provider's full list.
- [ ] The "Mark as read" rule (end reached and 90% counted, one visit) and the 1.5 s reading rule are decisions, not facts; the daily-log counts differ from the legacy app (see the phase doc).
- [ ] The prototype's per-ayah tafsir "sample excerpt" text was not used.

**Surah listing, Juz, Page**
- [x] Juz start points and page starts: replaced by the `/v1/meta` response of api.alquran.cloud (30 juz, 604 pages, every reference checked against the legacy ayah counts; `tests/quranMeta.test.ts` compares the generated tables with a recorded response). Not compared with a printed mushaf.
- [ ] **Juz names** (transliterated and Arabic) are not shipped: there is no verified source. Supply a verified list and it becomes a data file.
- [ ] **Revelation order:** not built (several traditional orders disagree). Name the source and the order and it becomes a small data file.
- [x] Page ranges per juz: derived from the tables above (Juz 1 = pages 1 to 21 as the prototype said, but the rest are not 20 pages each; juz 4, 7, 11 and 26 start partway down a page and share it with the juz before). The prototype's page-to-surah table is not used.
- [x] The audio files are third-party URLs from the legacy data: all 570 answered a HEAD request on 2026-10-16 (`docs/audio-url-check.md`, `scripts/check-audio-urls.mjs`). 210 are served as `application/octet-stream` (up to 91 MB); desktop Chromium accepts them, **Safari, iOS and Firefox were not tried** (yours, before Phase 4B).
- [ ] "Name (A to Z)" ignores the article (Al-, An- ...); the legacy sort did not. Confirm it is what you want.

**Story reader**
- [ ] The ten Arabic excerpts (12:4, 12:18, 12:23, 12:55, 12:90, 12:92, 2:34, 7:12, 2:35, 7:23) and their English wording.
- [ ] Adam's chapter-to-telling mapping and chapter summaries (author's reading of the legacy story data).
- [ ] Which Yusuf events belong to which chapter.
- [ ] Compare drawer: only the descriptions that exist in the story data may be shown. Al-Hijr 15:26 to 44 has no description yet.

**Prophets & People**
- [ ] The 16 sample people: descriptions, counts and chronology labels come from the legacy persons data; copy nothing from the prototype.
- [ ] Family relation labels and direction (for example "Adam's descendant: Isa") must match the legacy relationship data. The legacy label "Ancestor" on Adam's page was ambiguous.
- [ ] Extra entities (Yusuf's Brothers, Al-'Aziz, Zulaikha, The King of Egypt, Egypt) are approximations of legacy entries.

**Library**
- [x] The prototype's sample ayahs, notes, tags, collections, people and story state are not used; the Library shows only your data. Arabic under a row comes from the device cache or one per-ayah request, never from the code (a test scans the source).
- [ ] The wording of the empty and offline lines ("Text appears once you are online or have opened this surah.", the first-run message, the not-rebuilt notice) and "Your note is kept."
- [ ] Library on a real phone: edit panel, select mode, Undo toast, and a large library's scrolling.

**Prophets & People (Phase 7A)**
- [x] The prototype's 16 sample people, descriptions, "Story · N chapters" tags, Yusuf and Adam texts, family rows, notes and "Referenced by" are not used; the pages show the legacy data (59 entries).
- [ ] **Relationship direction (decision pending):** the data writes 17 parent/child entries as "this person is the X of the related one" while the spec and the legacy page read the type as the related person's role. The revamp shows full sentences and flips three entries (`isa>maryam`, `maryam>isa`, `maryam>maryammother`) with `REVERSED_ENTRIES`. See `phases/phase-07a-people.md` ("Finding").
- [ ] Other relationship gaps in the data (no reverse entry for adam>isa, yusuf>ibrahim, musa>haman, jalut>talut, jalut>dawud, zayd>muhammad, yusufbrothers>yaqub; the two sides of musa/musawarner, firaun/sahara, abulahab/muhammad use different types).
- [ ] **Prophetic-status chips: owner review open.** To hide the chip of any entry while it is unconfirmed, add its id to `HIDDEN_STATUS_CHIPS` in `app/lib/people.ts` (one line; empty now). Record the outcome here. Entries to review first: adam, yusuf, dhulkifl and the 13 "Prophet · Messenger" entries.
- [ ] **Prophetic-status chips** (Prophet 12, Prophet · Messenger 13, the legacy labels verbatim): review Adam, Yusuf, Dhul-Kifl (debated among scholars; the chip does not show it), and the "Prophet · Messenger" claim for Harun, Lut, Yunus, Ilyas, Shu'ayb, Isma'il; and that Maryam, Luqman, Dhul-Qarnayn, Khidr and Uzair show no chip.
- [ ] The chronology wording ("Traditional chronology", "Chronology uncertain", "Chronology unknown") and the story kind labels, copied from the legacy app.
- [ ] 7 people have no direct mentions and 4 have no related passages in the data (shown as empty, not hidden).

**Stories (Phase 7B)**
- [x] The prototype's chapter titles, summaries, ayah counts, excerpts, "Reflection" lines, "Also told in" mappings and "Traditional chronology" chips are not used; the reader shows the legacy story data and the cached surah text.
- [ ] **"Arranged for study" sentence (ours, for your review):** "This story is assembled from passages in several surahs, in an order chosen for reading." Shown for the 8 stories whose status is not "Fully told in the Qur'an".
- [ ] **"Summary (written for this app)"** label on the 38 episode summaries and the 11 flat-chapter descriptions, and the line "Chapter summaries are written for this app; the Qur'an text is the source." Confirm they are app-written (the data does not say who wrote them).
- [ ] The **Order line** ("Order: the surah's own sequence (Yusuf 12:4–101)") is computed from the passages for single-surah stories whose chapters ascend; none is shown elsewhere. `nuhflood` is "fully told" in the data but its chapters jump between surahs 71 and 11: no notice and no Order line. Decide whether its status should change.
- [ ] None of the 13 supporting passages and 38 episode passages has a description in the data, so Compare tellings says "No description recorded yet." for the supporting ones.
- [ ] The story lessons are story-level in the data (26 lessons); they are shown on the end page, not per chapter.
- [ ] Place, people-group and event chips have no page until Phase 12 (sheets for the first two, inert text for events).

**Prayer and Qibla**
- [x] The prototype's sample times, Hijri date ("29 Rabīʿ al-awwal 1448") and Hanafi Asr sample: not used; the page shows the service's real times and Hijri date. The Qibla bearing is checked against AlAdhan's own `/v1/qibla` for eight cities (agrees to better than 0.001°). The prototype's cardinal label for 260.4° ("West-southwest") was wrong: it is "West".
- [ ] **The Hijri date** (15 Oct 2026 = 4 Jumādá al-ūlá 1448 from the service) against a calendar you trust, and the adjustment at a month edge.
- [ ] **"Latest"** is the most recent start time that has passed; the app makes no ruling about when a prayer time ends (same tag for both fiqhs). Confirm the wording is what you want.
- [ ] **Arabic prayer names** are left out; supply a verified list to add them.
- [ ] **Open-Meteo place search:** its free API is for non-commercial use (CC BY 4.0, attribution link shown). The terms do not define "non-commercial"; confirm the app qualifies (no subscriptions or advertising), or the search must move to a commercial key.
- [ ] **Compass on real devices:** the declination correction (checked against NOAA's published test values, not on a phone), the sign of the landscape correction, whether the iPhone heading is already true, and the iPhone refusal wording.
- [ ] The sentence "Corrected for your location ... using the World Magnetic Model, valid to 2030" matches NOAA's statement (WMM2025 valid 2025.0 to 2030.0; NOAA's page also says "valid until late 2029").
- [ ] Calculation method names (ISNA, MWL, Umm al-Qura, Karachi, Egyptian; Leva Qom and Tehran for Ja'fari) must match what AlAdhan actually supports.
- [ ] The monthly cache must be compared with live AlAdhan responses for the Ja'fari method.

**Ramadan and events**
- [ ] The timetable is generated by a formula. Real times come from the monthly prayer cache.
- [ ] Event dates are based on Umm al-Qura month starts and UAE estimates for Dhu al-Hijjah and Muharram. They can differ by a day with local sighting.
- [ ] Event descriptions, including the Ja'fari events (Fatimiyya, Mab'ath, Ghadir, Mubahala, birth and martyrdom days) and Sunni events (Isra and Mi'raj, Mid-Sha'ban).
- [ ] Laylat al-Qadr nights per tradition (Sunni odd nights of the last ten; Ja'fari 19, 21, 23).
- [ ] The "how it differs" table (suhoor end or Imsak, iftar timing, night prayers, Imam Ali commemoration) was written from public sources and must be reviewed. Iftar timing is a difference between individual jurists, not a rule for a whole tradition.
- [ ] Both iftar duas (Arabic typed from memory). The Ja'fari dua has no confirmed source. The legacy app has its own dua set (`app/utils/ramadanContent.js`); use that.

**Tasbeeh**
- [ ] The Arabic of the five dhikr and the Tasbih of Fatima order (Ja'fari 34, 33, 33; Sunni common order 33, 33, 34, with other narrations) and the concluding line.

**Sajda**
- [ ] The list of 15 verses and their numbers (41:37 to 38 and 27:26 vary between schools).
- [ ] The Ja'fari set of four obligatory verses (32:15, 41:37, 53:62, 96:19) and the Hanafi count of 14 without the second verse in Al-Hajj.
- [ ] The explanatory sentences for each tradition.

**Asma-ul-Husna**
- [ ] All 99 names: Arabic, transliteration and meanings were typed from memory. Lists differ between sources. Use the legacy data.

**Per page**
- [ ] Only page 1 has text in the prototype. Real pages come from the per-page endpoint or bundled data.

**Full player**
- [ ] Scrubber, times and the save-audio behaviour are samples.
