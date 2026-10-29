# Phase 16: the 136 manual checks, sorted

From docs/DEVICE_CHECKS.md. Sorted 2026-10-29 for the owner to move rows between groups. See phase-16-cutover-plan.md, section 3.1, for the rule used.

Total rows: 136 (133 table rows plus F1 to F3; K1 is waived). Before cutover: 49. First week: 56. Whenever: 31.

### Before cutover

| # | Check | Why before |
| --- | --- | --- |
| S1 | Chrome Android: open the preview, menu, "Install app". iPhone Safari: Share, "Add to Home Screen"... | install is how most users will run it |
| S2 | After a new deploy, open the installed app (or reload the browser tab) | the update hand-over: the one thing the domain move depends on |
| S3 | Visit Home and the Surah listing online, then switch on airplane mode and reopen the installed app | the installed app offline |
| P1 | Home, "Set location", allow the browser's prompt | location is the gate for prayer times and Qibla |
| P2 | Same, but deny the prompt | the denied path must not dead-end |
| P6 | VoiceOver (iPhone) or TalkBack (Android) through Home | screen-reader pass (V7) |
| N1 | Settings, Notifications, switch alerts on, allow the permission prompt | notifications have never fired on a device |
| N2 | "Test notification" | same |
| N3 | Deny the permission instead | the denied path |
| N4 | Set a prayer reminder a few minutes ahead, keep the app open | the reminder itself |
| R6 | VoiceOver/TalkBack through a surah | screen-reader pass (V7) |
| A1 | iPhone Safari: play surah 1 with reciter 1, then reciter 2 | the 210 large audio files: the owner reports tested |
| A2 | iPhone Safari: play surah 3 with reciter 1, then reciter 2 | owner reports tested |
| A3 | iPhone Safari: play surah 18 with two reciters | owner reports tested |
| A4 | Chrome on Android: repeat A1 to A3 | Android Chrome has not been done |
| A6 | While a large file plays, open the sheet (tap the title) and drag the position slider to the middle | seeking in a large file |
| A7 | Pause and Play; change speed to 1.5Ã—; Back 10 s and Forward 10 s | basic controls |
| A8 | Switch reciter in the sheet | reciter switch |
| A11 | Play something to 12:34, force-close the browser, reopen the app | resume after the browser is closed |
| A14 | Airplane mode, then press Play on a surah you have not played | the offline error must be plain |
| A17 | Reader: press Play ayah N on an ayah, then another ayah; open the sheet and press Next and Previous | per-ayah play from the reader |
| A18 | Per page: Play page on a page of ten or more ayahs; listen to the joins between ayahs | per-page queue |
| A19 | Bismillah check: on two reciters, play the first ayah of a surah other than Al-Fatiha (for exampl... | the Bismillah rule of the queue |
| 5-G1 | Prayer page, "Set location", allow GPS | location |
| 5-G2 | Deny GPS, then enter a city by name | location denied |
| C1 | iPhone (Safari, then installed): Qibla, "Enable compass" | the compass is derived, not observed |
| C2 | Compare the Qibla needle and bearing with a real compass or a trusted app in your own city | the bearing against a real compass |
| C3 | Android Chrome: same as C2 | same on Android |
| C4 | Tilt the phone, then rotate to landscape (both directions) | tilt and landscape |
| 5-H1 | The Hijri date on the Prayer page (and Home where it shows one) against a calendar you trust | the Hijri date against a calendar you trust |
| 5-H4 | Switch Following to Ja'fari and compare Fajr, Maghrib and midnight with a source you trust (your ... | Ja'fari times against a trusted source (Leva, Tehran) |
| 5-H5 | Switch back to Sunni and compare with a source you trust | Sunni times against a trusted source |
| B1 | Library on a phone: open an item's edit panel, add a note and a tag | your notes and tags are your data |
| 11-D1 | Open Downloads. The line under Preferences | downloads storage |
| 11-D2 | Add Al-Ikhlaas (Add surahs, tick it, Download) | downloads storage |
| D4 | Airplane mode, then press Play on a saved surah | saved audio plays offline |
| D6 | Offline: press Play on a surah that is not saved | the offline message for an unsaved surah |
| F1 | installed phone, offline | Daily Fiqh offline on a phone |
| F2 | a phone that never opened Daily Fiqh | a new tab offline must not be blank |
| 14-H1 | A phone, in your hand. Add a surah, press Start, recite an ayah aloud, tap a word, Reveal all, ma... | Hifz on a phone |
| 14-H6 | An installed app, offline: open Hifz and a session with the connection off, for a surah you have ... | Hifz offline |
| 14-H7 | Your legacy Hifz data (if you used the legacy app): open Hifz on the revamp | your own legacy Hifz data |
| 15-G1 | A phone, in your hand. Open Reading goals, start a goal of each kind, log reading from a mushaf, ... | Goals and Calendar on a phone |
| 15-G2 | The Hijri date against a calendar you trust, for today and for the first and last day of this mon... | the Hijri date and the adjustment at a month edge |
| 15-G5 | An installed app, offline: open Goals, About, the Sitemap and Surah videos with the connection of... | Goals, About and the Calendar offline |
| 15-G6 | Your legacy goals and reminders (if you used the legacy app): open Goals and the Calendar on the ... | your own legacy goals and reminders |
| V1 | Wording of ours across all pages (labels, notices, error messages), including the resume line and... | the wording of ours is yours to read before users do |
| V2 | The three relationship entries (Isa, Maryam) and the status chips on People; `nuhflood` in the "a... | content decisions that edit the data at cutover |
| V7 | Screen-reader passes (VoiceOver and TalkBack) on Home, Settings, the listing, the reader, the pla... | no screen-reader pass has ever been done |

### First week (use the installed app for a week; note anything odd)

| # | Check |
| --- | --- |
| S4 | Rotate the phone on Home |
| P3 | Ayah of the day, Share |
| P4 | Ayah of the day, Save then Undo (the toast) |
| N5 | iPhone only: first as a Safari tab, then installed to the Home Screen (iOS 16.4 or later) |
| N6 | Settings, Audio, "Download on Wi-Fi only" on Chrome Android, then on iPhone |
| N7 | Settings, "Update now" on a real network, and once offline |
| N8 | Settings, Reading: move the Arabic size slider on the phone; toggle Reduce motion, High contrast, Large tou... |
| L1 | Scroll the Surah tab quickly on a mid-range phone; type in the filter |
| R1 | Open Al-Baqara, scroll its whole length |
| R3 | An ayah's Tafsir, then airplane mode and reopen the same tafsir |
| A9 | Turn on Repeat, let a short surah (112) end |
| A10 | Turn on "Play the next surah automatically", play surah 113 to its end |
| A12 | Same as A11 but with the screen locked while playing |
| A13 | Lock screen / notification shade controls |
| A15 | Slow connection (Chrome Android: DevTools or a weak signal) while playing |
| A16 | Mini player and sheet at 375, dark, with the error showing (A14) |
| A20 | Per page: a page that crosses into the next surah (any two-surah page, for example the page holding the end... |
| A21 | While a page queue plays, turn on Follow audio in the sheet and scroll away |
| A22 | Put the phone in airplane mode mid-queue |
| A23 | Play a page queue, force-close the browser, reopen |
| A24 | Offline per-ayah audio (proven only in desktop Chromium): play an ayah or a page once online, then airplane... |
| A25 | Asma-ul-Husna: open a name, press Play (try names 1, 12 and 99), then names 53, 93 and 97 |
| C5 | Turn until facing the Qibla |
| C6 | The accuracy note on iPhone |
| C7 | Deny the compass permission |
| 5-H2 | Settings, Hijri adjustment +1 then âˆ’1 |
| 5-H3 | At a Hijri month edge (adjust to cross it) |
| 5-H6 | Prayer page offline after one online visit |
| B2 | Select mode: select several rows, remove them, then Undo |
| B3 | A large library (use Settings, or save 100+ items) |
| E1 | A story on the phone (for example Yusuf): read a long chapter, move with Next |
| E2 | Offline after reading one chapter |
| M1 | Ramadan, Today (before Ramadan) |
| M4 | Open the Ramadan page offline after one online visit |
| W3 | The slider by touch, and Go to page |
| T1 | Tasbeeh: tap the circle by touch, 5 times |
| X1 | Phone: open Search from the header icon |
| X2 | Type `mercy`, then `yusuf`, then an Arabic word |
| X3 | Type `2:255` |
| X4 | Switch on airplane mode and search `mercy`, then `2:255` |
| 11-D3 | Add Al-Mulk or Yaseen |
| D7 | Online: Remove a saved surah, then Undo within a few seconds; remove again and wait |
| D11 | Android Chrome: Settings, Audio, turn on Download on Wi-Fi only; on mobile data add a surah with audio |
| D12 | Add a surah with Tafsir ticked; airplane mode; open that surah in the reader and open an ayah's tafsir |
| D13 | Save the text of the whole Qur'an (Wi-Fi), airplane mode, open a few surahs |
| D14 | `/surah-audios/36`: Play a reciter that is not yours; Download another |
| D15 | In the player sheet press Save audio to listen offline |
| F3 | Urdu on a phone |
| 14-H2 | Listen and Read along with real audio (online, then with the surah downloaded and the connection off) |
| 14-H3 | Recite to someone with a real listener |
| 14-H4 | A real week. Use it for several days |
| 14-H5 | iPhone Safari: the Add sheet and Practise sheet as bottom sheets; the select for the surah |
| 15-G3 | A real week of reading. Read in the reader for several days with a goal running |
| 15-G4 | Finish by a date. Make a goal for a date a few days away, then wait for the date |
| V3 | The calendar basis name on Ramadan and Events ("Hijri Calendar of Saudi Arabia"), the Laylat al-Qadr rows, ... |
| V6 | The screenshots I did not look at one by one (each compare README says which I did) |

### Whenever

| # | Check |
| --- | --- |
| P5 | Home at 375, dark |
| N9 | Settings at 375, dark |
| L2 | Juz and Page tabs; tap a page chip |
| L3 | Star a surah, then "Saved" |
| R2 | An ayah's Share button |
| R4 | Save and Pin an ayah; then open the Library |
| R5 | Reader at 375, dark, with a translation on |
| A5 | Firefox (only if you use it): repeat A1 to A3 |
| C8 | Desktop browser (no sensor) |
| B4 | The "Where I stopped" slots after pinning an ayah and a page |
| E3 | Compare tellings and an entity chip |
| E4 | A person's page, the Story tab, Save and Undo |
| E5 | The story reader and People at 375, dark |
| M2 | Ramadan, Timetable at 375 in dark |
| M3 | Events: tap a bell, then Undo; open "Your reminders" |
| M5 | Hijri adjustment +1 and âˆ’1 |
| W1 | Per page, `?page=1` and a page with two surahs, at 375 in dark |
| W2 | Aâˆ’ / A+ up to the largest size |
| W4 | Pin page and Save, then the Library |
| W5 | Per page: the sajda sign (for example page 416, 32:15) |
| T2 | Reach the goal (33) |
| T3 | Reset count, then Undo; change the goal, then Undo |
| T4 | Turn the vibration switch off, tap |
| 9-D1 | Asma-ul-Husna: search, save a name, open its sheet, "Count this name" |
| 9-D2 | Sajda: open the list, tap "Open in the reader" on one |
| 9-D3 | Tasbeeh, Asma and Sajda at 375 in dark |
| X5 | Filters: pick Urdu, then a surah, then a juz; Done |
| X6 | A hardware keyboard on a tablet or laptop: press `/` on Home |
| D16 | Firefox (only if you use it): D2 and D4 |
| V4 | The 99 names (apostrophes, repeated meanings), the list of 15 sajda verses, the five dhikr |
| V5 | The "not a line-for-line copy" sentence on Per page |

