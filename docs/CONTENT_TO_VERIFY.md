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
- [ ] **"Arranged for study" sentence (ours, for your review):** "This story is assembled from passages in several surahs, in an order chosen for reading." Shown for the 8 stories whose status is not "Fully told in the Qur'an" and for nuhflood (override).
- [ ] **"Summary (written for this app)"** label on the 38 episode summaries and the 11 flat-chapter descriptions, and the line "Chapter summaries are written for this app; the Qur'an text is the source." Confirm they are app-written (the data does not say who wrote them).
- [ ] The **Order line** ("Order: the surah's own sequence (Yusuf 12:4–101)") is computed from the passages for single-surah stories whose chapters ascend; none is shown elsewhere. **`nuhflood` decision open:** the data says "fully told" but its chapters jump between surahs 71 and 11. Until you decide, its id is in `ARRANGED_OVERRIDES` (`app/lib/stories.ts`), so it shows the "Arranged for study" notice (and a dashed status chip; the data's own label text is unchanged); it has no Order line. Either the status should be "pieced together" (then fix the legacy data once at cutover and delete the override) or the label means something narrower than assumed (then remove the override). The legacy file is not edited.
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

**Ramadan (Phase 8A)**
- [x] The prototype's Ramadan content is not used: its timetable formula and sample times, the Sunni versus Ja'fari compare table, "expected by the Saudi calculation", "South Asia one day later", the iftar and suhoor explanations, its dua texts and its event list. Times are the cached prayer times for the chosen method; dates are the calendar service's.
- [ ] **Deliberate gap: Laylat al-Qadr for Ja'fari.** The page shows the legacy app's nights (21, 23, 25, 27, 29) for both fiqhs, labelled "From this app's data". The Ja'fari nights 19, 21, 23 are not shown until you supply a reviewed source (a data file, not code).
- [ ] **Deliberate gap: no "how it differs" table and no explanatory sentences** about suhoor, iftar, night prayers or Imam Ali. The labels are neutral ("Suhoor ends" is the Fajr time, "Iftar" the Maghrib time, for the chosen method). If you want them back, supply the wording and sources.
- [ ] **Hadith duas** are shown as references only (the legacy references: Tirmidhi, Abu Dawud, a traditional supplication). The Arabic text and translation come back when you supply a verified set. The legacy Arabic of those duas is typed in the legacy data and was not shipped.
- [ ] The Qur'anic dua is 2:201, read from the cached surah (no typed Arabic).
- [ ] **The calendar basis** shown on the page ("Hijri Calendar of Saudi Arabia (HJCoSA)") is the name for the code the service returns (`HJCoSA`); confirm the name, or hide it with one flag (`SHOW_CALENDAR_BASIS` in `app/lib/ramadanText.ts`; with it off the page says only "Dates are calculated. Local sighting can differ by a day."). For users whose moon sighting often differs by a day, the plain note plus the Hijri adjustment may be clearer than naming a Saudi calendar. Ramadan 1448 is 29 days, 8 Feb to 8 Mar 2027, by this calendar; local sighting can differ by a day (the page says so; the start-date override and the Hijri adjustment are there).
- [ ] The legacy **Laylat al-Qadr note** is shown as it is in the legacy data (`ramadanContent.js`); confirm the wording.
- [ ] Wording to confirm: "Dates need a connection once.", "Expected ...", "Didn't fast", the Khatmah line ("Planning a reading goal arrives with Reading goals in a later phase.").

**Events (Phase 8B)**
- [x] The prototype's event list, dates and descriptions are not used. The Events tab shows only the 29 events of the legacy file and any entry in the reviewed file. Dates are the calendar service's days.
- [ ] **Data gaps (deliberate):** the events the prototype lists that the data does not have (the First and Second Fatimiyya, Rajab and Sha'ban beginnings, the Birth of Imam Ali, the Martyrdom of Imam Musa al-Kadhim, the Birth of Fatima, "Night of 19 Ramadan"); any description beyond the 9 notes; per-tradition wording. The legacy data is Ja'fari-weighted (13 Ja'fari events, 2 Sunni, 14 shared): a Sunni view is short and says so. To add events or wording, supply them with a source in `app/data/events/reviewed-events.json` (shape in `phases/phase-08b-events.md`); no code change is needed.
- [ ] **Wording of ours, for your review:** the tradition tags (Both, Sunni, Ja'fari); the category labels (Major, Birth, Martyrdom, Occasion, Remembrance, from the data's `major`, `birth`, `martyrdom`, `shia-occasion`, `remembrance`); "Expected" on every date (the data does not say which depend on sighting); the footer "Dates and this list follow this app's data. They are not a ruling."; "Only a few events are recorded for this tradition so far."; "Dates for the coming months."; "Saved to your list. No alert is sent."; the Show menu labels.
- [ ] The Hijri month names are the service's own ("Rajab", "Shaʿbān", "Ramaḍān": the diacritics are inconsistent as the service writes them) and are shown as given. Confirm, or supply a fixed name list.
- [ ] The legacy event names and notes are shown as the legacy file has them (for example "Mawlid al-Nabi & Imam Ja'far al-Sadiq", "Mab'ath — Prophet's Commissioning", the Ashura note about differing observance): confirm them.
- [ ] The five Laylat al-Qadr entries are five rows, as in the legacy data; confirm that is how you want them listed.

**Ramadan and events (prototype items)**
- [ ] The timetable is generated by a formula. Real times come from the monthly prayer cache.
- [ ] Event dates are based on Umm al-Qura month starts and UAE estimates for Dhu al-Hijjah and Muharram. They can differ by a day with local sighting.
- [ ] Event descriptions, including the Ja'fari events (Fatimiyya, Mab'ath, Ghadir, Mubahala, birth and martyrdom days) and Sunni events (Isra and Mi'raj, Mid-Sha'ban).
- [ ] Laylat al-Qadr nights per tradition (Sunni odd nights of the last ten; Ja'fari 19, 21, 23).
- [ ] The "how it differs" table (suhoor end or Imsak, iftar timing, night prayers, Imam Ali commemoration) was written from public sources and must be reviewed. Iftar timing is a difference between individual jurists, not a rule for a whole tradition.
- [ ] Both iftar duas (Arabic typed from memory). The Ja'fari dua has no confirmed source. The legacy app has its own dua set (`app/utils/ramadanContent.js`); use that.

**Tasbeeh (Phase 9B)**
- [x] The prototype's dhikr texts are not used: the five dhikr and the custom counter are the legacy presets (`scripts/gen-tasbeeh-presets.mjs` reads them from the legacy `useTasbeeh.ts`; the legacy file is not edited).
- [ ] **Left out (deliberate): "After prayer" / the Tasbih of Fatima, in both traditions.** The legacy app has no such data, and the prototype's Sunni order (33, 33, 34), the Ja'fari order (34, 33, 33 then La ilaha illallah), their titles and notes were typed by us. To add it, supply the wording and a source (a data file in the Events pattern; no code change planned).
- [ ] Review the five dhikr (Arabic, transliteration, meaning) as the legacy app has them: SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah.
- [ ] Wording of ours: "Tap the circle, or press Space or Enter, to count.", the announcements ("12 of 33", "Goal of 33 reached. 3 cycles completed.", "Count reset to 0."), the toasts ("Count reset to 0 for <name>", "Goal set to 99. The count went back to 0."), "Vibrate on count", "Off while Reduce motion is on in Settings.", "Cycles completed" / "Lifetime count".
- [ ] Behaviour kept from the legacy counter that you may want to change later: a new goal sets the count back to 0 (now with Undo); only the goals 33, 99 and 100; the custom counter has no name; the vibration pattern (15 ms, and 120/60/120/60/120 for a finished cycle). A malformed stored value is shown as the default instead of NaN.
- [ ] "Count this name" stores its count under `name-<n>` in `quran:tasbeeh:v1`. The legacy app tolerates it (tested against the legacy code) but does not list it.

**Sajda (Phase 9B)**
- [x] The prototype's list, references and Arabic are not used. The 15 references are the service's own list (`/v1/sajda/quran-uthmani`, recorded in `tests/fixtures/alquran-sajda.json`, bundled by `scripts/gen-sajda.mjs`); the Arabic is the surah reader's text.
- [ ] **Left out (deliberate): any statement of obligation.** The service flags 4 of the 15 (32:15, 41:38, 53:62, 96:19) as `obligatory` and 11 as `recommended`; the legacy page showed those to everyone as red and blue labels. The four are the set the Ja'fari school treats as obligatory, so showing them to all users is a ruling. They are not shown, and nothing says "obligatory", "recommended", "wajib", "Hanafi" or "Ja'fari". Also left out: the Hanafi count of 14 and its note, and the per-tradition explanatory sentences. To add them, supply wording and a source.
- [ ] **The list itself:** "15 verses, as listed by this app's data." The set of 15 follows one common list (it includes 38:24 and both 22:18 and 22:77); schools differ (the exact verse in Ha-Mim Sajda, the second sajda of Al-Hajj, 38:24). Confirm that you want this list.
- [ ] Wording of ours: "Verses of prostration", "Connect once to see the text.", "Couldn’t load the text.", "Open in the reader", the sign's label "Prostration verse" (Per-page reader).
- [x] The sign on the Per-page reader is the text's own: the reader's Arabic contains the prostration sign inside exactly these 15 ayahs (checked 2026-10-21, which also confirms the list), so no second mark is added (the SVG mark built first was removed on review). A test with real surah 32 text confirms it appears once.

**Asma-ul-Husna (Phase 9B)**
- [x] The prototype's 99 names are not used. The names are the legacy `names.json` (imported, never copied): Arabic, Urdu, transliteration, English, in the legacy order and numbering.
- [ ] **For your review (not changed):** (a) the apostrophes in the transliterations are mixed in the data: curly in Al-Mu’min (6), Al-Mu’izz (24), Al-Mu’akhkhir (72), Ar-Ra’oof (83), straight in Al-Ba'ith (49), Al-Mu'eed (59), Al-Muta'ali (78). The page shows them all curly (typography only, tested: nothing else about a name changes). (b) Two English meanings repeat: "The Sustainer" (39 Al-Muqeet, 63 Al-Qayyum) and "The Originator" (58 Al-Mubdi, 95 Al-Badee); "The Just" (29) and "The Just One" (86) are near-duplicates. A test pins these points so a change in the data shows up. (c) Lists of the 99 names differ between sources (here Malik-ul-Mulk and Dhul-Jalali wal-Ikram are 84 and 85 and Allah is not counted); this is the legacy app's list. (d) The Urdu text and the audio files (third-party hosted) are legacy data I cannot verify.
- [ ] **Left out (deliberate):** the YouTube video embed (a third-party page), and the per-name audio until Phase 4B ("Play" is a visible, disabled button, "Playing single ayahs arrives soon").
- [ ] Wording of ours: "The 99 names, from this app’s data. Saved names stay on this device.", "Search the names", "Lists of the 99 names differ slightly between sources. This is the list this app’s data uses.", "No names saved yet. Tap the star on a name.", "No names match “…”.", "Count this name".
- Fixed from the legacy page: the English line was near-white (nearly invisible in light theme); the search box was labelled "Search Surah". Both have tests.

**Per page (Phase 9A)**
- [x] The prototype's page 1 text, its page-to-surah and page-to-juz mapping, its "20 pages per juz" rule, its demo page 49 and its Hizb idea are not used. A page's ayahs come from the generated page starts (`/v1/meta`), every one of the 604 pages checked against the service's own `/v1/page/<n>/quran-uthmani` answer (`tests/pageReader.test.ts`, recorded in `tests/fixtures/alquran-page-ranges.json`; no page disagreed). The Arabic is the surah reader's cached text; the Bismillah is read from surah 1's data.
- [ ] **Flowing text, not mushaf lines.** There is no line data, so the page is a framed, justified block, and the page says so: "Text flows in the order and page breaks of the standard 604-page Madani mushaf. It is not a line-for-line copy of the printed page." Confirm the sentence, or supply line data (it then becomes an upgrade).
- [ ] **No Hizb label.** The legacy page showed `hizbQuarter` (1 to 240) under the word "Hizb", which was wrong. Nothing is shown until real hizb data is chosen (the service has it).
- [ ] **No sajda sign.** The legacy page printed one after sajda ayahs; the cached surah text has no sajda field and no list was typed. Sajda belongs to Phase 9B.
- [ ] Wording of ours: "Page N of 604", the head line "Juz 4 and 5", "Open <surah> N:M in the reader", "Pin page" / "Pinned", "Save" / "Saved", "Playing single ayahs arrives soon", "Page 700 doesn’t exist. Showing page 1.", "That page doesn’t exist. Showing page 1.", "Enter a page from 1 to 604.", "This page’s text isn’t saved on this device yet. Connect once to read it.", "Couldn’t load this page. Check your connection and try again.", and the Library's "Not set. Pin a page from the page reader."
- [ ] The surah names in the header are the bundled list's spelling ("Al-Baqara", "Aal-i-Imraan"), not a transliteration chosen here.

**Full player (Phase 4B)**
- [x] The prototype's scrubber, times (6:35), speed chips and the "Save audio" behaviour are not used as data: the position, times and speed are the real player's; the speed chips are the prototype's five values and the stored Settings value (0.5 to 3) shows as a custom chip when it is outside them.
- [ ] **Device check, still yours:** whether the 210 large files (served as `application/octet-stream`) play on iPhone Safari, Chrome on Android and Firefox. I checked only from this machine: the hosts answer Range requests with `206`, CORS `*`, and desktop Chromium plays them. **No workaround was built** (as you said: add none unless something fails); if a device fails, the fix is a small follow-up. Also yours: real sound, the lock-screen controls (Media Session), and seeking by finger in the sheet.
- [ ] **Left out (deliberate):** Save audio to device (the control is visible and disabled with its reason until Phase 11); per-ayah audio, the Asma-ul-Husna name clips, Play page and Stories Listen (4C: those four controls say "Playing single ayahs arrives soon"); any claim that audio plays offline. Streamed audio is not cached by the service worker (it caches only complete `200` responses and a media element's Range requests get `206`), and the cache names and the two storage keys are unchanged.
- [ ] Wording of ours: "Paused at 12:34", "Loading…", "Buffering…", "Playing", "Taking too long to start. Check your connection and try again.", "Tap Play to start.", "Switching reciter restarts this surah.", "Resume where you stopped", "Saving audio arrives with Downloads", "Playing single ayahs arrives soon", "Repeat this recitation", "Play the next surah automatically (Same setting as in Settings)", "(set in Settings)" on a custom speed, and the spoken slider value ("1 minute 20 seconds of 6 minutes").
- [ ] Behaviour that is new to users (the legacy never used its resume record): a saved place shows the mini player PAUSED after a reload, and the position is saved every 5 seconds while playing, on pause, when the page is hidden, and reset to 0 at the end of a surah. Confirm you want it.
- [ ] Switching reciter restarts the surah from the beginning (two reciters' files have different timing); the sheet says so before it happens.

**Full player (prototype leftovers)**
- [ ] Scrubber, times and the save-audio behaviour in the prototype were samples (see above for what replaced them).
