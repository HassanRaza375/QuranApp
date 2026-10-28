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
- [ ] The marja' names come from the legacy Daily Fiqh data (`app/data/wajibat/marja.ts`); that data has its own verification record in `docs/legacy-reference/wajibat_decisions.md`.

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

**Per-ayah audio and queues (Phase 4C)**
- [x] No prototype screen has per-ayah audio, so nothing typed was replaced; every Arabic word on these pages is the reader's text.
- [ ] **Left out (deliberate):** a separate Bismillah file at the start of a surah on a page queue (the data has per-ayah files only; whether a reciter's first-ayah file includes it is a device check, rows A19 and A20 in DEVICE_CHECKS.md, and the app claims nothing); any offline-play claim (in a desktop Chromium test a small per-ayah file played or preloaded once played again offline, with seeking unreliable for a preloaded one; not proven on iPhone, Android or Firefox); a pause between ayahs; downloads (Phase 11).
- [ ] **Asma-ul-Husna recordings:** 96 of 99 names play; **#53 Al-Qawiyy, #93 An-Noor and #97 Al-Warith return 404 at the source today** (their Play says "No recording for this name", no fallback). The recordings are third-party hosted and the legacy page played them; who recites them is not stated by the host, so the app only says "Asma-ul-Husna". If the host adds or moves a file, `NAMES_WITHOUT_RECORDING` in `lib/asma.ts` and `names.json` are the places to change (once, at cutover, in the legacy file).
- [ ] Wording of ours: "Play ayah N" / "Pause ayah N", "Play page" / "Pause page", "Listen to this chapter" / "Pause", "Couldn’t play ayah 2:7. Audio needs a connection unless it was downloaded.", "Skip this ayah", "Follow audio" with "Keep the playing ayah in view", "Off while Reduce motion is on in Settings.", "No recording for this name", "ayah 3 of 13", "Switching reciter plays this ayah again." and "...plays this ayah again and carries on.", the repeat label "Repeat this ayah".
- [ ] Behaviour you may want to change: no pause between ayahs; a failed ayah is retried once and then the queue stops (never skips by itself); Repeat is only for a surah and a single ayah; a queue stops after its last ayah (no carrying on into the next page or chapter); after a reload the mini player shows the last thing started (a queue or a surah), paused.
- [ ] The queue's saved place is a new key, `quran:audio-queue:v1`; the legacy app ignores it and `quran:audio-resume:v1` is untouched.

**Full player (prototype leftovers)**
- [ ] Scrubber, times and the save-audio behaviour in the prototype were samples (see above for what replaced them).

---

# Prototypes agreed 2026-10-22 (Phases 10 to 15)

`docs/design/prototype-remaining-pages.html` and `docs/design/prototype-hifz.html` hold **sample content only**. Everything in the lists below was written for the prototypes, typed from memory, or invented to make a screen look real. **None of it ships.** The build reads the services and data files; where a data file does not exist yet, the phase plan names the source and waits for approval. Items marked "checked" were compared with real data on 2026-10-22; the rest are unchecked.

## General (both prototypes)

- [ ] Every constant in the two scripts is sample content: `AYAT`, `KN`, `PERSONS`, `STORIES`, `NOTES`, `MARAJI`, `FCATS`, `FTOPICS`, `GLOSS`, `HELP`, `HMONTHS`, `HEVENTS`, `G`, `DL`, `RECITERS`, `TXT`, `SUR`, `MULK`, `HIFZ`. Not copied into `app/`.
- [ ] **Surah names.** The prototype's spellings ("Al-Fatihah", "Al-Baqarah", "Ali 'Imran") differ from the legacy data's `surahName` ("Al-Faatiha", "Al-Baqara", "Aal-i-Imraan") for 66 of the 114 surahs (checked). The build shows the legacy spelling everywhere, as the rest of the app does.
- [ ] **Ayah counts per surah.** The prototype's `AYAHS` list matches the legacy `totalAyah` for all 114 surahs and sums to 6,236 (checked). The build still reads the real data, not this list.
- [ ] The "Prototype of the pages still to build…" note, the "Offline preview" button, the fixed date (Thu 22 Oct 2026) and the simulated download progress are prototype-only.
- [ ] Wording of ours that the prototypes introduce is listed per page below. Each needs a read-through before it ships; none of it is Qur'an text, a translation or a ruling.

## Search (Phase 10, built; docs/phases/phase-10-search.md)

- [x] The 13 sample ayahs and their English wording (`AYAT`): not used. Results are the upstream's real answers; the text and the edition's name come from the response.
- [x] The "Saheeh International" label: not used. Each result is labelled with the edition actually searched (Pickthall by default). **The reader's English is not any of the upstream's 17 English editions** (checked on 32:10), so the wording of a result can differ from the reader's for the same ayah, and no translator name is shown for the reader's text. Your call: an attribution, or the reader's own text beside each result.
- [x] The sample index (10 people, 3 stories, 2 notes), the seeded history and the "Browse" chips: not used. The groups read the app's own data and the user's own notes and history; the start view shows the legacy page's eight suggested searches (patience, mercy, forgiveness, gratitude, prayer, fasting, charity, guidance).
- [ ] **Matching rule.** The app's one normaliser (it existed before this phase) ignores Arabic marks and tatweel, folds alef variants and alef maqsura to alef and yeh, drops Latin accents, treats hyphens and apostrophes as spaces and collapses repeated letters. **Teh marbuta and heh are read as one letter in Search's device groups and in highlighting only** (decided 2026-10-22; the Surah listing, the Library and the other filters still tell them apart, and the upstream's ayah search is its own matching, unchanged). A reader of Arabic should confirm the rule: it makes a word ending in heh match the same word ending in teh marbuta, and the reverse, so it can also join two different words.
- [x] Result groups and their order: Ayahs, Surahs, People, Stories, Notes (Duas, the knowledge modules and Daily Fiqh join in Phases 12 and 13). Four per group under All, "Show all N"; up to 60 ayahs with the true total.
- [x] Which service answers ayah search: the legacy upstream (api.alquran.cloud `/search`), through `SearchService`. It is level C (online only).
- [x] History: `quran:search-history:v1` is the legacy key and shape (a list of strings, 15 at most), saved only after a search that found something.
- [ ] **Wording of ours, to read through:** "Ayahs, surahs, people, stories and your notes. Marks and spelling variants are ignored.", "Try 2:255, Al-Kahf or patience", "Filters", "Filters on: …", "Search in", "Edition", "Sunni tafsir sources, Arabic only." (the legacy note), "Saved ayahs only", "Reset filters", "Narrow the ayah search. Changes apply as you make them.", "Recent", "Clear", "Suggested", "Your searches appear here, on this device only.", "Where your results fall in the Qur’an", "Open <surah> n:m / Goes to the reader at this ayah", "There are 114 surahs.", "<Surah> has N ayahs.", "Searching…", "Showing the first 60 of N ayahs", "N ayahs", the group heads "English: Pickthall", "Urdu: Jalandhry", "Arabic: Quran text", "Tafsir: <name>", "No ayahs match “…” in <edition>.", "None of the N matches pass your filters. Clear filters.", "Nothing matches “…”. Check the spelling, try fewer words, or search an ayah number like 18:10.", "Searching ayah text needs a connection. What is on your device still works, and an ayah opens directly by its number, like 2:255. Try again", "The search service didn’t give an answer this time. Try again", "Ayah search starts at 2 characters.", "Show all N", "Removed “…”", "Search history cleared", the group names and "Found N ayahs, N people, …" (screen readers).
- [ ] The edition names shown on results are the legacy page's titles for the ten editions (Pickthall, Yusuf Ali, Muhammad Asad, Jalandhry, Maududi, Arabic Quran Text, Tafsir Muyassar, Tafsir Al-Jalalayn, Tafsir Al-Qurtubi, Tafsir Al-Baghawi); the full name from the upstream is the hover title. The upstream's own name for the Arabic text edition is just "Simple".

## Downloads (Phase 11)

- [x] **Size estimates** replaced: audio sizes are the measured bytes of all 570 files (`app/data/audioSizes.generated.ts`, `docs/audio-url-check.md`); text about 1.1 KB per ayah and tafsir about 10.7 KB per ayah are averages measured on the real service (a seeded sample of 150 ayahs), shown only as "about" before a download; free space is `navigator.storage.estimate()`. The prototype's 2,048 MB quota, its sample saved surahs and its simulated progress do not ship.
- [x] **Reciter names** are the legacy `reciters.json` names, from Settings; the prototype's list does not ship.
- [x] **Quick picks:** "Juz 30" (by number; "Juz 'Amma" is a Juz name and Juz names are a recorded gap) is surahs 78 to 114 (37 surahs, checked); Al-Kahf, Yaseen, Al-Mulk, Al-Waaqia and Ar-Rahmaan use the data's spellings and are **our choice of presets**.
- [x] "Downloads keep going while you use the rest of the app" and "Audio downloads wait until you're on Wi-Fi" are rewritten to what the browser can do: "Keep the app open until a download finishes." and a Wi-Fi switch that is greyed, with the reason, where the connection type is not reported.
- [ ] **Wording of ours, to read through:** "Save surahs to read and listen with no connection.", "Waiting…", "Waiting for a connection", "Waiting for Wi-Fi", "Failed · <reason>", "Needs about X; about Y free. It may not fit.", "Download anyway", "Not saved", "saved by the older app, download again", "Saved by the older app. It can't play from the device.", "You're offline. What you saved still works; adding needs a connection, and anything queued waits for one.", "Safari can clear a website's saved data after a week without a visit. Add this app to your Home Screen to keep what you save.", "This browser can't keep files for this site…", "Keep the app open until a download finishes. Sizes marked "about" are estimates until the download starts. A saved surah plays the whole recitation. Playing a single ayah, a page or a story still needs a connection unless you played it before.", "The browser will keep what you save." / "The browser may remove saved files if the device runs low on space.", "Offline playback is ready." / "Offline playback needs one more page load before it can start.", "Cleared the browsing cache. What you saved is untouched.", the `/surah-audios` lines ("A saved recitation plays with no connection. Playing one that isn't saved needs a connection.", "Your reciter", "There is no such surah"), the player's "Save audio to listen offline · <size>", "Saving N%", "Saved on this device", and the Settings Clear all sentences.
- [ ] **The claim about Safari's one-week limit** is WebKit's documented behaviour, **not tested** on a device here (`DEVICE_CHECKS.md`).
- [x] `quran:download-prefs:v1` holds `wifiOnly` only (the reciter is the Settings reciter, stored by name).

## Knowledge modules (Phase 12: 7 list and 7 detail pages)

- [ ] **All 29 entries in `KN`** (6 peoples, 8 places, 3 themes, 5 duas, 3 events, 2 signs, 2 commands): the names, Arabic names, one-line summaries, **ayah reference lists** (for example 'Ad: 7:65, 11:50 …), status labels and "Connected" links were written for the prototype. The build reads the legacy data files (`quranPeoples`, `quranPlaces`, `quranEvents` and `quranCommands` are already in `legacy/`; the themes, duas and signs data are not vendored yet).
- [ ] **The five dua Arabic texts** (`رَّبِّ زِدْنِي عِلْمًا`, the dua of Yunus, 2:201, 28:24 and 14:41) were typed from memory with their marks. They are Qur'an text: they come only from the verse service, by reference.
- [ ] **Status labels.** The prototype uses "Qur'an states", "Traditional identification" and "Interpretations differ". `CLAUDE.md` (rule 5) names the visible labels as Qur'an, Traditional, Scholarly and Source note. Decide which set is right, and take each entry's label from the legacy data's own verification field, never from the sample (for example the sample marks the place "Saba" as Traditional).
- [ ] Module titles and the seven helper questions are ours: "Peoples & Nations", "Signs & Miracles", "Which communities?", "Where?", "What does it teach?", "How did people call upon Allah?", "What happened?", "What signs occurred?", "What does Allah command and forbid?". The legacy titles may differ.
- [ ] "N entries, each anchored to the ayahs that mention it." is a claim about the data; it is true only if every real entry has references.
- [ ] "Referenced by" and "Connected" are computed from the sample `rel` pairs. The real relations come from the legacy data. Links into Prophets & People and Stories can go to pages that exist; links into Daily Fiqh stay inert until Phase 13.
- [ ] "Play all" and "Listen" would use the existing queue and the user's reciter; the prototype does not say what a dua's "Listen" plays.
- [ ] Wording of ours: "Where it appears", "N ayahs in N surahs", "The ayahs", "Connected", "Referenced by", "Translation loads from the reader's cache.", "No <module> match “…”".

### Review list: every entry whose basis is not "the Qur'an states it" (Phase 12, from the real data)

The pages show the legacy's own basis label on each of these and nothing else about how sure the entry is (no "verified", no "reviewed"). Please read each one. The data's own `verificationStatus` is the legacy author's label, not an outside review, so **all 182 entries** are on this list in the sense that none has been read by a scholar; the table is the subset whose basis the data itself marks as weaker.

| Module | Id | Name | Basis in the data | Note |
| --- | --- | --- | --- | --- |
| Peoples | `sabbathbreakers` | The Sabbath-Breakers | quran_context | shown with the label "Identified through Qur'anic context" |
| Places | `iram` | Iram | disputed | label shown; also has a source that is not the Qur'an (drawn dashed) |
| Places | `alkahf` | The Cave (Al-Kahf) | quran_context | label shown |
| Places | `thesea` | The Sea (of the Crossing) | quran_context | label shown |
| Themes | `creation` | Creation (Al-Khalq) | quran_derived_concept | a theme derived from the Qur'an, not named by it |
| Themes | `generosity` | Generosity | quran_derived_concept | a theme derived from the Qur'an, not named by it |
| Themes | `wealth` | Wealth | quran_derived_concept | a theme derived from the Qur'an, not named by it |
| Themes | `leadership` | Leadership and Authority | quran_derived_concept | a theme derived from the Qur'an, not named by it |
| Themes | `community` | Community, Brotherhood, and Peace | quran_derived_concept | a theme derived from the Qur'an, not named by it |
| Duas | `adamrepentance` | Adam's Prayer of Repentance | quran_narrative | a prayer reported in a narrative |
| Duas | `yunusindarkness` | The Dua of Yunus | quran_narrative | a prayer reported in a narrative |
| Duas | `muhammadentryexitprayer` | Prayer for a Sound Entrance and Exit | quran_instruction | a prayer the Qur'an instructs, not one it reports |
| Duas | `muhammadknowledgeprayer` | Prayer for Increase in Knowledge | quran_instruction | a prayer the Qur'an instructs, not one it reports |
| Duas | `muhammadrefugeprayer` | Prayer for Refuge from the Devils' Incitements | quran_instruction | a prayer the Qur'an instructs, not one it reports |
| Duas | `muhammadmercyprayer` | Prayer for Forgiveness and Mercy | quran_instruction | a prayer the Qur'an instructs, not one it reports |
| Duas | `rabbanasteadfastprayer` | The Warriors' Prayer for Steadfastness | quran_narrative | a prayer reported in a narrative |
| Events | `siegeconfederates` | The Siege of the Confederates | quran_context | label shown |

17 rows. Signs and Commands have none (all 14 and all 18 are "explicit").

- [ ] **The data's `statusNotes` are not shown.** They are the legacy author's working notes (they mention code, phases and search strings, for example "Phase 3 migration ... `relatedPlaceIds`" and "a manually-verified anchor set"), not text for readers. 27 on Peoples, 19 on Places, 22 on Themes, 8 on Duas, 12 on Events, 11 on Signs, 11 on Commands. Some carry real caveats (for example that Zakah's recipients are named but no nisab is given); if any should reach readers, they need rewriting in plain words first.
- [ ] **Wording of ours (Phase 12, so far):** the module titles and questions on `lib/knowledge/modules.ts` ("Which communities?", "Where?", "What does it teach?", and our own "What was asked?", "What happened?", "What was shown?", "What is commanded?"), "Events in the Qur’an" (so it is not confused with the Ramadan page's Events), "N entries, each anchored to the ayahs that mention it.", the filter placeholder, "Nothing matches “…”", "Nothing here points at 7:65", "Nothing saved yet. Open an entry and tap Save.", "Where it appears", "The ayahs", "Show the N ayahs", "Loading the text…", "This text isn’t on your device yet. Connect to load it.", "Couldn’t load this text.", "Connected" / "Named in this entry’s own data.", "Referenced by" / "Entries whose own data names X. X’s data does not name them back.", "No such entry", the Library's type names ("People or nation", "Place", "Theme", "Dua", "Event", "Sign", "Command"). **Stage 2 adds:** "In more detail" (the Themes, Places and Peoples paragraph), "Transliteration", "Loaded live from a transliteration source when you are online. It is not stored in the app.", "Loading the transliteration…", "The transliteration needs a connection, and isn’t kept on your device.", "Show the transliteration of …", "The full ayah is shown." with "It holds more than the dua’s own words." when the data gives no note, the Search groups "Duas" and "Knowledge base", and the Events line "Chronology" (its sentences and "During the lifetime of …", "After: …", "Before: …" are the legacy page's own). The section titles "Context", "Who made it" and "Audience" and every basis label ("Narrative prayer", "Direct Qur'anic supplication", "Qur'an-derived concept", "Established by Qur'anic narrative context", "Inferred principle" …) are the legacy pages' own words.

### Draft reader-facing caveats (Phase 12: app-written, NOT shown anywhere yet)

The data's `statusNotes` are the legacy author's working notes and are not shown (see above). Of the 110 notes, most are bookkeeping (why two candidates were merged, which file a link lives in, how the search was done). **36** carry something a reader may need to know. Each is rewritten below in plain words, **app-written**: the wording is ours, the claim is the note's. None is in the UI. If you approve some, they would appear as a short "Worth knowing" line under the entry's summary, labelled **Source note**, with the entry's own basis tag kept as it is.

**The rule these drafts follow (2026-10-26):** a caveat describes only what the Qur'an text states or does not state. It never states a ruling or a penalty, and for anything that is a ruling it points to **Daily Fiqh** (Phase 13) or the reader's own scholar. It makes no claim about what scholars hold, what tradition says, or what is "near-universal": where a note did, that sentence is dropped. "Reworded" means the first draft broke the rule in some sentence and that sentence was changed or removed; "cut" means nothing was left to say once it was removed.

| Entry | Draft (app-written) | Status |
| --- | --- | --- |
| Peoples · `ad` | The Qur'an does not say where 'Ad lived today. It names Al-Ahqaf as where they were warned (46:21), and this page goes no further. | kept |
| Peoples · `thamud` | Thamud is named in the Qur'an. 15:80 ("the companions of Al-Hijr") does not itself say "Thamud"; linking the two is read from the surrounding text. | reworded (dropped "tradition") |
| Peoples · `madyan` | Madyan is both a people and a place in the Qur'an, and this entry covers both. The Qur'an does not say whether Madyan and the Companions of the Thicket (Al-Aykah) are the same community; Shu'ayb is sent to both. This page does not decide. | reworded (dropped "scholars differ") |
| Peoples · `ashabalaykah` | The Qur'an does not say that the Companions of the Thicket are the people of Madyan. Both are addressed by Shu'ayb with similar warnings, under two different names. This page does not decide whether they are one community or two. | reworded (dropped "exegetes are divided") |
| Peoples · `saba` | The Qur'an does not date the flood of the dam or tie it to a named ruler. Naming a particular dam is not something these ayahs say. | reworded (dropped "a later historical link") |
| Peoples · `peopleofthetown` | The Qur'an names neither the town nor the three messengers. Names given to them elsewhere are not part of the text and are not treated as established here. | reworded (dropped the example place) |
| Peoples · `sabbathbreakers` | 7:163-166 does not name this community or say they were Israelites. That link comes from the ayahs just before (7:160-162), which speak of Bani Isra'il. | kept |
| Peoples · `peopleofyunus` | The Qur'an does not name this town. A name for it is not part of the ayahs. | reworded (dropped "Nineveh", "traditional") |
| Peoples · `ahlalkitab` | | **cut**: once the claim about who the term "mainly meant" is removed, nothing is left that the Qur'an text states or does not state |
| Places · `madinah` | The Qur'an also says "the city" (al-madinah) for several unnamed towns in other stories (for example in Yusuf, the People of the Cave, Musa and Ya-Sin). This entry lists only the ayahs that are about Madinah, the Prophet's own city. | kept |
| Places · `mountjudi` | The Qur'an names the mountain but does not say where it is. | reworded (dropped the suggested region) |
| Places · `alhijr` | Al-Hijr is named in the Qur'an (15:80). The ayah does not link it to Thamud; that link is read from the surrounding text. | reworded (dropped "tradition") |
| Places · `alahqaf` | The Qur'an names the region but gives no present-day location. | reworded (dropped the suggested region) |
| Places · `iram` | The Qur'an does not say whether "Iram" is the proper name of 'Ad's city, a descriptive title for 'Ad, or something else. This page shows the ayah's wording and does not decide. | kept |
| Places · `almasjidalaqsa` | The Qur'an does not use the word "Jerusalem". Reading "the farthest mosque" as Jerusalem is an identification made outside the ayah; the ayah itself does not state it. | reworded (dropped "near-universal" and the hadith claim) |
| Places · `theholyland` | The Qur'an does not give this land's borders or name a city within it, and does not equate it with Al-Masjid al-Aqsa or Jerusalem, so they are separate entries here. | reworded (dropped "often taken to mean") |
| Places · `alkahf` | "The cave" is a common noun in the Qur'an, not a place name, and the ayahs give no location for it. | reworded (dropped the example site) |
| Places · `thesea` | "The sea" is a general word the Qur'an uses in many stories. The ayahs do not say which sea this is. | reworded (dropped "Red Sea" and the gulfs) |
| Duas · `adamrepentance` | The ayah is in the dual ("they both said"): Adam's wife joins the prayer. The Qur'an does not name her, so the entry is listed under Adam. | kept |
| Duas · `ibrahimwisdomprayer` | In this prayer Ibrahim asks forgiveness for his father. 9:113-114 later says he withdrew it once it was clear his father was an enemy of Allah. This entry gives the prayer as it was made, not its later withdrawal. | kept |
| Duas · `musaprayeragainstfiraun` | 10:89 says the prayer was answered and speaks to both Musa and Harun ("your supplication"), though only Musa's words are quoted. The entry is listed under Musa, whose words are quoted. | reworded (dropped the "Ameen" tradition) |
| Duas · `yunusindarkness` | These words contain no direct request. The ayah says he "called out" (21:87), and the entry is counted as a dua on that wording. | reworded (dropped "long-standing convention" and the hadith) |
| Events · `ibrahimmigration` | The Qur'an states the migration (29:26) but gives no route, starting point or destination. | kept |
| Events · `sacrificetrial` | 37:99-113 does not say which son was to be sacrificed. This page does not name him. | kept |
| Events · `isaascension` | 4:157-158 says Isa was not killed or crucified but raised up. It does not give the timing of what follows, and this page does not add one. | reworded (dropped "scholars have long discussed it") |
| Events · `siegeconfederates` | The Qur'an never uses the word "trench". The name "Battle of the Trench" and the digging of a trench come from outside the text. The siege itself is from the surah's own account and its name, "the Confederates". | reworded (dropped "seerah") |
| Events · `pledgeunderthetree` | The Qur'an describes the pledge "under the tree" (48:18). The name Hudaybiyyah and the treaty around it are not in the ayah. | reworded (dropped "tradition") |
| Commands · `zakahcommand` | 2:110 speaks of giving zakah, and 9:60 names who zakah may go to. These ayahs give no threshold or percentage. For how zakah is worked out, see Daily Fiqh or ask your scholar. | reworded (dropped "commands"; added the pointer; no figures) |
| Commands · `hajjcommand` | 3:97 speaks of the pilgrimage to the House in relation to whoever is able to make the journey. The ayah does not describe the rites or the detailed conditions. For these, see Daily Fiqh or ask your scholar. | reworded (no statement of the obligation; added the pointer) |
| Commands · `ribaprohibition` | 2:275 speaks of riba and of trade. The ayah does not list kinds of riba or speak of modern financial products. For what applies today, see Daily Fiqh or ask your scholar. | reworded (dropped "later jurisprudence" and the restated prohibition; added the pointer) |
| Commands · `theftprohibition` | 5:38 is worded as a prescribed measure on theft, not as a plain "do not steal". The ayah gives no conditions or thresholds. For how it applies, see Daily Fiqh or ask your scholar. | reworded (the penalty is not stated; added the pointer) |
| Commands · `murderprohibition` | The prohibition here is 17:33. Its parallel at 5:32 is addressed to the Children of Israel, and the Qur'an presents it as a principle that reaches everyone ("whoever kills a soul…"); it is not, in its own grammar, addressed to all people. | reworded (names 17:33, the entry's own ayah) |
| Commands · `justicecommand` | 16:90 joins commands (justice, excellence, giving to relatives) with prohibitions (indecency, wrongdoing, oppression) in one ayah. The prohibitions are not listed as a separate entry. | kept |
| Commands · `repentancecommand` | The command to turn in repentance is the last clause of 24:31, an ayah mainly about modesty for believing women. It is cited only for that clause. | kept |
| Commands · `shirkprohibition` | 6:151 is a list ayah ("Come, let me recite what your Lord has forbidden you"). It is cited here for its opening clause on shirk; the rest of the list includes other prohibitions that have their own entries. | kept |
| Commands · `backbitingprohibition` | The backbiting clause is the end of 49:12, which begins with a separate instruction against suspicion and spying. | kept |

**Two summaries replaced (decided 2026-10-26, done):** the data's own sentences for Commands `theftprohibition` and `ribaprohibition` state a penalty and a prohibition as plain facts. The pages now show app-written lines that attribute to the Qur'an text, with the reference: Riba, "The Qur'an forbids riba (2:275)."; Theft, "The Qur'an addresses theft (5:38). Its conditions and application are matters of fiqh; see Daily Fiqh or a scholar." (`SUMMARY_OVERRIDES` in `lib/knowledge/commands.ts`; a test pins them and that no other summary changes). The data is untouched. Please read the two lines once.

**Questions for you:**

- [ ] Show any of these? If yes: as a "Worth knowing" line under the summary, or only inside a collapsed "Notes" row? (Recommended: a line, labelled **Source note**.)
- [ ] Wording changes, line by line. The four that now point to Daily Fiqh (zakah, hajj, riba, theft) assume Phase 13 ships that page; until then the pointer would read "ask your scholar" only.
- [ ] The remaining 74 notes stay hidden (bookkeeping: merges, file links, search method). Tell me if you want to see the list first.

## Daily Fiqh (Phase 13)

- [ ] **Structure against the real data (checked).** The legacy data has 9 categories and 67 topics, in six categories (5 Foundations, 8 Taharat, 20 Salat, 13 Sawm, 14 Khums, 7 Zakat); Hajj, Other furu' and Daily life have none yet. The prototype's category ids differ for four (`taharah`, `salah`, `furu`, `daily` against `taharat`, `salat`, `otherfuru`, `dailylife`), some Arabic terms differ (Foundations: "الأصول" against "المقدمات"), and its topic counts differ for four categories (Taharah 9 against 8, Salah 14 against 20, Khums 11 against 14, Zakat 10 against 7). Of its 34 sample topics, 13 have an id that exists in the legacy data and 21 do not. The routes `/fiqh/[category]/[topic]` use the legacy ids.
- [ ] **Maraji'.** Three in both. The prototype's names, initials, "books" strings and status ("pending") are samples; the legacy data has the full names, books and status (`pending-sources` for Makarem Shirazi). The build reads `legacy/app/data/wajibat/marja.ts`.
- [ ] **No ruling text is in the prototype.** Every ruling, quote and Urdu line is a labelled slot ("Verbatim text of … appears here, cut from the official source by script", "یہاں سرکاری اردو متن آئے گا"). The build shows only text from the generated ruling data (not vendored yet), each with its marja', book and ruling number; where none is added, "Refer to his risala", never another marja's text.
- [ ] Ruling counts per topic, the "N of N rulings added for <marja'>" meter (the prototype invents 18% missing for Khamenei and 4% for the others, and 100% for the pending marja'), the "3" on the women's panel, "Step 3 of 6 in the procedure" and "≈ 2.4 MB" for saving everything. All invented.
- [ ] Topic flags (step by step, decision helper, live times, women's rulings, sensitive) and which topic gets which. Product decisions; the real data decides what exists.
- [ ] **Authored religious wording, each needing review before it ships:** the Wudu "In short" sentence and its six step titles ("Intention", "Wash the face", …); the label "Written by the app, not a ruling"; the basis tags "Fatwa", "Obligatory precaution", "Precaution, type not stated"; the "Level A" source tag; the women's panel and the handling of the sensitive topic (menstruation); the notice "Not scholar-reviewed. A study aid. Follow your own marja' or a local scholar for your situation."; the Sunni notice "Daily Fiqh covers Fiqh Ja'fari only for now. Your prayer setting is Sunni; nothing else in the app changes."
- [ ] **The decision helper** (`HELP`: "Doubts in prayer", four questions such as "Which prayer were you praying?" and "Between which numbers are you unsure?", with outcomes). The questions describe a religious situation and steer to a ruling. The prototype itself says it is "shown only once a reviewer has signed off every path"; the build ships none until that sign-off exists.
- [ ] **Glossary** (`GLOSS`, 14 terms: Bulugh, Fatwa, Furu' al-din, Ghusl, Ihtiyat mustahab, Ihtiyat wajib, Marja', Najasah, Qada, Rukn, Taqlid, Tayammum, Usul al-din, Wudu): the definitions and the Arabic and Urdu spellings are ours. The legacy topics carry glossary ids; use that glossary or supply a sourced one. "Definitions are written by the app. Each links to its source in the build." is only true then.
- [ ] Live times on a prayer topic ("Fajr 05:01 · Maghrib 17:32"), the "Continue" row and its progress: samples. The build reads the Prayer page's data with the Ja'fari method, as the prototype says, and the saved study state.
- [ ] Wording of ours: "The obligatory acts, quoted from your marja's own books.", "Choose whose rulings to follow / Nothing is shown until you choose.", "Rulings are shown for one marja' at a time…", "Showing rulings of", "Marking steps is only for following along now. Nothing is tracked.", "Visited topics are saved for offline. Save everything …", "Coming later", "Search rulings, e.g. ihtiyat, wudu, qada".
- [ ] The Fiqh search box sends the query to the global Search (from two characters). Confirm that is wanted, since Search then needs a Daily Fiqh index.

### Daily Fiqh, 13a: what is built and the wording of ours (Phase 13, 2026-10-26)

The structure, the maraji', the rulings, the glossary and the counts above are now the real data (the prototype's samples are not used). What is ours, and needs your reading:

- [ ] **The pointer** ("Refer to his risala") and its three reasons: "This ruling is held for review: an automated comparison found a difference between its versions that the Persian original did not settle, so it is not shown until a person has checked it." (the legacy's words); "The official English edition of this ruling differs from the Persian original, so it is not shown. The app does not translate rulings itself."; "This ruling is held for review: its English and Urdu versions differ in a number or a negation, and there is no Persian original to settle it, so it is not shown until a person has checked it."; and the line "Please read it in <marja'>'s own book: <book>, <number>" (the legacy's).
- [ ] **"Not added yet for <Sistani, Khamenei, Makarem Shirazi>. Refer to his risala."** (your wording), the gate "Choose your marja'" and its sentence (the legacy's), "Choose whose rulings to follow. Rulings are shown for one marja' at a time; nothing from another marja' is ever shown in his place.", "His rulings are not added yet. Pages will say “Not added yet” and point to his risala.", and the reading-language sentence "Urdu shows only where the marja's own official Urdu book has the ruling. The app does not translate rulings. With “Both”, each language shows its own book and number."
- [ ] **"Both"** labels each block "English" and "Urdu" (the Urdu one in Urdu script, built from code points) and nothing else relates them.
- [ ] Hub and category: "Topics you open are saved for offline. Save all 6 categories to read every ruling with no connection.", "Daily Fiqh isn’t on this device yet" and its paragraph, "This category’s rulings aren’t on your device yet. Connect to load them.", "N of M rulings shown for <marja'>", "Coming later. Rulings are added one topic at a time, and only once each is sourced from the marja's own book." (the legacy's, shortened).
- [ ] The notes on a ruling are the legacy author's, with the working references ("(decision P6)", "rule R7") and the sentence "Data note (…, not shown in the UI): …" removed (`readerNote`, tested over all 1,840 entries). The notes that remain are reader-facing ("Part of this ruling is stated as an obligatory precaution; see the wording.", "Marked * (revised) in the 4th edition…"). **Please read the 15 distinct notes once**: they were written by the legacy author, not by a reviewer.
- [ ] The **needs-human hold** (57 Khamenei rulings, 66 rows) is your decision; it is in `app/lib/fiqh/holds.ts`, derived from the vendored fixture.
- [ ] The Overview and the topic summaries are the legacy's **app-written** text (labelled "Written by the app, not a ruling"); they were not reviewed by a scholar either.

### Daily Fiqh, 13b: the wording of ours in guided steps, the live panel and the helpers (Phase 13, 2026-10-27)

What is ours, and needs your reading (the quoted rulings, the recitations and the helpers' questions and answers are the legacy data, not ours):

- [ ] **Guided steps:** "Step titles are written by the app. The text under each title is quoted from the ruling it cites." and "Written by the app: …" before a step's note (the legacy author's reason for marking a step wajib; the note itself is the data's). A step whose ruling may not be shown uses the pointer sentences above. No guide: "Not added yet for <X>. Refer to his risala. The rulings above still apply."
- [ ] **Recitation:** the source note under a recitation is the data's (through `readerNote`); the transliteration is the data's.
- [ ] **Live panel:** "Today's prayer times", "Today's dawn and maghrib", "Open Prayer Times to load today's times for your location.", "From the app's Prayer Times feature (AlAdhan). The rulings below set out when each prayer may be performed.", "From the app's Prayer Times feature (AlAdhan), shown as they are. The rulings below say when the fast begins and ends; this panel does not decide it. Your fasts are logged in the Ramadan page, not here.", and the Sunni note "These times use your current calculation method (Sunni). For Ja'fari times, switch the method in Settings."
- [ ] **Helpers (on in production since 2026-10-28; no scholar has read them, the label says so):** "Find your answer", "Your answers so far", "According to <X>, in his own words (shown exactly as published; the app does not paraphrase or translate it):", "Where to look: <book>, <location>. Open it on the official website or ask <X>'s office through his official website.", "<X> · Not scholar-reviewed. This helper only points to his published text; if your situation is unusual, ask him or his office." The questions, options and the "You said you are not sure …" sentence are the legacy's. **20 answers of Khamenei's helpers (doubts 19, wudu 1) show the pointer here because their rulings may not be shown; this is by design.**

## Reading goals (Phase 15)

- [ ] The sample goal (812 of 6,236 ayahs read, started 1 Oct 2026, finish 7 Feb 2027), the seven days of counts, "Ramadan khatmah 1447, Completed · Mar 2026" and "5 pages a day, Paused" are all samples. The build reads the reader's `dailyLog` and the legacy goal keys.
- [ ] **"Pages a day: counted by mushaf page (≈ 10.4 ayahs)."** 6,236 ÷ 604 pages is 10.32, not 10.4 (checked). Use the computed figure, or the page data, not the typed number.
- [ ] **"About N minutes" in the New goal preview** is the daily ayahs times 0.45: an invented reading speed. Remove it, or base it on the user's own measured reading time.
- [ ] **"At your pace, you'll finish around …"** divides by the ayahs read so far over an assumed 21 days. A made-up projection; the build computes it from the real log, or leaves it out.
- [ ] "Finish by" chips: "Before Ramadan" is 7 Feb 2027 (the day before 1 Ramadan 1448 in the prototype's own month table, below), "End of year", "In 30 days". The Ramadan date must come from the Hijri service with the user's adjustment.
- [ ] Goal types and the juz-a-week rule ("Spread over the week"); "Your current goal is paused, not deleted."; "Ayahs count once they've been on screen for about a second and a half." (the real rule is the reader's 1.5 s, approved in Phase 4A; counts read higher than in the legacy app).
- [ ] Wording of ours: "Khatmah before Ramadan · finish by …", "Through the Qur'an", "Days you read less are simply days; the daily amount adjusts to keep your date.", "For reading from a printed mushaf. It counts toward today.", "Goal started. Your previous goal is paused."

## Calendar (Phase 15)

- [ ] **Hijri month starts (`HMONTHS`).** Four come from `RESEARCH.md` (Jumada I 12 Oct 2026, Rajab 10 Dec, Sha'ban 9 Jan 2027, Ramadan 8 Feb 2027). Rabi' al-Thani 13 Sep 2026 and Jumada al-Akhirah 11 Nov 2026 are not in that file. Checked against the browser's built-in Umm al-Qura table: five of six agree; **13 Sep 2026 is day 2 of Rabi' al-Thani there, so its start is 12 Sep**, which also makes the prototype's 29-day length for that month wrong. Treat the table as a sample; the build uses the Hijri calendar service with the in-app adjustment (never typed dates).
- [ ] "Umm al-Qura, adjusted −0 days": the method label and the adjustment are fixed text. The build shows the real method and the user's real adjustment.
- [ ] The three events in `HEVENTS` (Rajab begins "A sacred month", Mid-Sha'ban, First day of Ramadan) and their descriptions are samples. The build uses the 29 legacy events already shipped with the Ramadan page; per-tradition wording stays a deliberate gap.
- [ ] Reminders: the prototype stores them under `quran:cal-rem-proto` (prototype-only). The real key and shape come from the legacy calendar, to be read in the Phase 15 legacy report; the Ramadan page already has reminders as list items only.
- [ ] Wording of ours: "Reminders show here and on Home while the app is open.", "Nothing on this day.", "Islamic event", "Your reminder", "Repeat every year".

## Hifz (Phase 14, `prototype-hifz.html`)

- [ ] The Arabic of Al-Mulk 67:1 to 3 and Al-Ikhlas 112:1 to 4 in `TXT`, and the words shown as "tricky" (يُولَدْ, كُفُوًا), are typed. The build takes every ayah and word from the reader's cached text. The prototype strips the pause marks (ۚ ۖ ۗ ۛ) to make "words"; the real word split must keep the Qur'an text exact.
- [ ] The sample plan ("About 9 minutes", "Fix 1 tricky ayah", "Review 4 ayahs", "Learn 1 new ayah"), the sample strengths of the two surahs, "2 words slipped last time" and "Slipped on … twice". The real plan comes from the legacy engine's queue rules (`DECISIONS.md`); the time estimate needs a stated basis (the legacy blueprint uses 45 seconds per item).
- [ ] Wording of ours: "Tricky ayahs come first. New ayahs wait while 3 or more need work.", the stage names (Listen, Read along, Fade, Recite), "Listen 3 times", "Read aloud with the reciter. Each word lights up as it's recited.", "Join it to what you know", "Hand the phone to your listener. They tap any word you slip on.", "Tap a word once to mark a slip, again to clear it.", the verdicts ("This ayah comes back tomorrow, starting with …", "Clean. This ayah waits longer before coming back.", "Free practice doesn't change your schedule."), "Done for today", "Words you've slipped on more than once.", "Your place is saved".
- [ ] **The verdict sentences promise scheduling** ("comes back tomorrow", "waits longer"). The legacy engine decides the interval; the sentences must be true of it, or become neutral.
- [ ] **Read along needs word timings.** The prototype lights words on a 420 ms timer; the app has per-ayah audio only, and no word-level timing data exists in the services. Phase 14 must name a source, or show the stage without a per-word highlight.
- [ ] Pace labels (Gentle 1 a day, Steady 2, Faster 3) and "At 2 a day, all 83 ayahs of Ya-Sin are started in about 6 weeks" (Ya-Sin has 83 ayahs in the legacy data, checked; 83 ÷ 2 is about 42 days, so "about 6 weeks" holds only if every day is a study day).
- [ ] `quran:hifz-words:v1` is new and additive; its shape is a Phase 14 plan item.
