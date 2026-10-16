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

**Surah reader**
- [ ] Al-Fatihah Arabic (7 ayahs) and its translations in the prototype.
- [ ] Revelation order numbers used for sorting the 8 sample surahs.

**Surah listing, Juz, Page**
- [ ] Juz start points (for example 3:93 vs 3:92 for Juz 4, 5:82 for Juz 7) and the transliterated Juz names. Use the legacy Juz table.
- [ ] Page ranges per Juz (Juz 1 = pages 1 to 21, Juz 2 to 29 = 20 pages each, Juz 30 = 582 to 604) and the page-to-surah starts used for the first 186 pages.

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
- [ ] Arabic snippets for 2:255, 2:286 and 18:10, and all sample notes, tags and collection names.

**Prayer and Qibla**
- [ ] All prayer times, the Hijri date, the Qibla bearing (260.4°) and the Hanafi Asr sample time.
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
