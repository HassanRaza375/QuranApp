# Device checks

Everything built so far that only a real device (or your own judgement) can confirm. Every browser test in this project uses a stand-in for the audio element, the GPS, the compass and notifications, so **none of the rows below has been tried on a phone**. This list gathers the open items from the phase docs (`docs/phases/*.md`), the content review list (`docs/CONTENT_TO_VERIFY.md`) and your latest review notes into one place.

**How to use it:** open the Vercel preview of branch `revamp-design-logic` on your phone, work down a section, and write what you saw in the last column (even "same as expected"). Then paste the filled rows back in the next prompt. If a row fails, write the exact message and the browser.

Devices to try where a row says so: **iPhone Safari**, **Chrome on Android**, **Firefox** (only if you use it), and the installed app (Home Screen / Install) for the rows marked "installed". "375" means the phone's normal portrait width; "dark" means the phone or the app set to dark mode.

## Do these first (the open risks)

| Why first | Rows |
| --- | --- |
| The 210 large audio files may not play on iPhone or Firefox, and the full player is built on them | A1 to A8 |
| The compass correction, the iPhone value and landscape are derived, not observed | C1 to C8 |
| Notifications and reminders have never fired on a device | N1 to N5 |
| Hijri dates and Ja'fari times need a source you trust | H1 to H6 |

Until at least A and C are done, keep new phases small (a bug found late costs more than one found now).

---

## Phase 0: shell, install, update

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| S1 | Chrome Android: open the preview, menu, "Install app". iPhone Safari: Share, "Add to Home Screen". Open it from the icon | Opens full screen (no browser bar) on Home; the icon and name are Quran App | |
| S2 | After a new deploy, open the installed app (or reload the browser tab) | A toast "A new version of Quran App is available." with **Reload** and **Later**. Reload loads the new version; Later keeps the current one | |
| S3 | Visit Home and the Surah listing online, then switch on airplane mode and reopen the installed app | Home and the listing open; anything that was never saved says it needs a connection once, never a blank page | |
| S4 | Rotate the phone on Home | Layout holds in landscape, nothing cut off, no sideways scroll | |

## Phase 1: Home

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| P1 | Home, "Set location", allow the browser's prompt | A real position is used; prayer times for it with the next prayer and its countdown | |
| P2 | Same, but deny the prompt | A clear message, no times invented, a way to set a city by name (Prayer page) | |
| P3 | Ayah of the day, Share | The phone's own share sheet opens with the ayah and a link. Cancel does nothing bad | |
| P4 | Ayah of the day, Save then Undo (the toast) | Saved with Undo; Undo removes it | |
| P5 | Home at 375, dark | One column, nothing cut off, 44px targets easy to hit with a thumb | |
| P6 | VoiceOver (iPhone) or TalkBack (Android) through Home | Sensible order, every button has a name, tiles read their values | |

## Phase 2: Settings

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| N1 | Settings, Notifications, switch alerts on, allow the permission prompt | Status reads as allowed; one fixed sentence says reminders only appear while the app is open | |
| N2 | "Test notification" | A notification arrives on the phone ("Test notification" / "Prayer reminders are working on this device.") and the page says "Test notification sent." | |
| N3 | Deny the permission instead | The page says notifications are blocked and how to allow them for this site; no crash | |
| N4 | Set a prayer reminder a few minutes ahead, keep the app open | The reminder appears at the time while the app is open (not when closed) | |
| N5 | iPhone only: first as a Safari tab, then installed to the Home Screen (iOS 16.4 or later) | The page's one line about iPhone matches what you see: alerts work only for the installed app | |
| N6 | Settings, Audio, "Download on Wi-Fi only" on Chrome Android, then on iPhone | Chrome Android: the switch works. iPhone and Firefox: the page says the browser does not tell the app whether you are on Wi-Fi | |
| N7 | Settings, "Update now" on a real network, and once offline | Online: it fetches and says so. Offline: disabled with a note | |
| N8 | Settings, Reading: move the Arabic size slider on the phone; toggle Reduce motion, High contrast, Large touch targets | The slider works by touch; each toggle visibly changes the app | |
| N9 | Settings at 375, dark | The section picker is a bottom sheet; every section opens; nothing overflows | |

## Phase 3: Surah listing

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| L1 | Scroll the Surah tab quickly on a mid-range phone; type in the filter | Smooth scrolling, no long freezes while typing | |
| L2 | Juz and Page tabs; tap a page chip | The chip opens the page reader at that page | |
| L3 | Star a surah, then "Saved" | The star is saved, and Saved shows only starred surahs | |

## Phase 4A: Surah reader

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| R1 | Open Al-Baqara, scroll its whole length | Smooth; the Arabic is never clipped; the bismillah does not push the text when it arrives | |
| R2 | An ayah's Share button | The phone's share sheet opens with the ayah, its translation and the link | |
| R3 | An ayah's Tafsir, then airplane mode and reopen the same tafsir | Opens online; offline it opens from the device if it was seen before, else says to connect once | |
| R4 | Save and Pin an ayah; then open the Library | Both appear; Undo works on removal | |
| R5 | Reader at 375, dark, with a translation on | Text readable, 44px controls, no sideways scroll | |
| R6 | VoiceOver/TalkBack through a surah | Each ayah is announced as an ayah, the tools have names | |

## Phase 4B: the audio player (**do first**)

Use the **Surah listing** Play buttons (and the reader's "Play surah"). Surah 1 is the control (a normal audio file); surah 3 and surah 18 are the large files that the host serves with a generic type (`application/octet-stream`).

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| A1 | **iPhone Safari**: play surah 1 with reciter 1, then reciter 2 | Plays. If not, write the exact message under the mini player | |
| A2 | iPhone Safari: play surah 3 with reciter 1, then reciter 2 | Plays (the large file). If it fails: the exact message, and how long it waited first | |
| A3 | iPhone Safari: play surah 18 with two reciters | Same as A2 | |
| A4 | **Chrome on Android**: repeat A1 to A3 | Same | |
| A5 | **Firefox** (only if you use it): repeat A1 to A3 | Same | |
| A6 | While a large file plays, open the sheet (tap the title) and drag the position slider to the middle | The sound jumps there without a long wait (the host supports ranges). Write whether it works and how long it took | |
| A7 | Pause and Play; change speed to 1.5×; Back 10 s and Forward 10 s | Each does what it says; the speed is audible | |
| A8 | Switch reciter in the sheet | The note "Switching reciter restarts this surah." is shown first; the other reciter plays from the start | |
| A9 | Turn on Repeat, let a short surah (112) end | It plays again from the start | |
| A10 | Turn on "Play the next surah automatically", play surah 113 to its end | Surah 114 starts by the same reciter | |
| A11 | Play something to 12:34, force-close the browser, reopen the app | The mini player shows the surah paused ("Paused at 12:34"); **nothing plays** until you press Play; Play continues from about that place | |
| A12 | Same as A11 but with the screen locked while playing | Playback continues; the lock screen shows the surah title and the reciter | |
| A13 | Lock screen / notification shade controls | Play, pause, skip back and forward 10 s, previous and next surah work; the scrubber shows the position | |
| A14 | Airplane mode, then press Play on a surah you have not played | The mini player shows "Couldn’t play. Audio needs a connection unless it was downloaded." and a **Try again** button; no endless spinner | |
| A15 | Slow connection (Chrome Android: DevTools or a weak signal) while playing | "Buffering…" appears and goes away; Pause still works | |
| A16 | Mini player and sheet at 375, dark, with the error showing (A14) | The error text wraps onto two lines and Try again is reachable; the sheet scrolls and every control is easy to hit | |
| A17 | Reader: press **Play ayah N** on an ayah, then another ayah; open the sheet and press Next and Previous | Each ayah plays by the chosen reciter; the row being recited is highlighted; the mini player says "Al-Baqara 2:5"; Next/Previous move one ayah | |
| A18 | Per page: **Play page** on a page of ten or more ayahs; listen to the joins between ayahs | The ayahs follow one another; write whether there is an audible gap or clipping at the joins (the app adds no pause) and whether the next ayah starts at once | |
| A19 | **Bismillah check:** on two reciters, play the first ayah of a surah other than Al-Fatiha (for example 2:1 and 112:1) | Write whether the recording includes the Bismillah before the ayah. The app does not claim either way | |
| A20 | Per page: a page that crosses into the next surah (any two-surah page, for example the page holding the end of Al-Baqara and the start of Aal-i-Imraan) | The queue plays into the next surah's first ayah; write whether that recording has the Bismillah (A19) | |
| A21 | While a page queue plays, turn on **Follow audio** in the sheet and scroll away | The playing ayah comes back into view when the ayah changes, and not otherwise. With Reduce motion on in Settings the switch is off and cannot be turned on | |
| A22 | Put the phone in airplane mode mid-queue | The current ayah may finish; the next one stops with "Couldn’t play ayah N:M..." plus **Try again** and **Skip this ayah**; Skip moves on once the network is back; nothing is skipped by itself | |
| A23 | Play a page queue, force-close the browser, reopen | The mini player shows "Page N" paused ("Paused at ..."); nothing plays until you press Play; Play goes on from that ayah | |
| A24 | **Offline per-ayah audio (proven only in desktop Chromium):** play an ayah or a page once online, then airplane mode and play the same ayah again, then one never played | The one played before plays again; the one never played fails with the message. Write the browser; the app makes no offline claim | |
| A25 | Asma-ul-Husna: open a name, press **Play** (try names 1, 12 and 99), then names **53, 93 and 97** | Names 1, 12 and 99 play their recording through the mini player (title = the name, line "Asma-ul-Husna"); 53, 93 and 97 say "No recording for this name" and play nothing | |

## Phase 5: Prayer times and Qibla

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| G1 | Prayer page, "Set location", allow GPS | The place is saved; times load; moving a few hundred metres does not replace the saved place (10 km rule) | |
| G2 | Deny GPS, then enter a city by name | The search shows what was sent and the matches with region and country; choosing one saves it | |
| C1 | **iPhone** (Safari, then installed): Qibla, "Enable compass" | A short explanation first, then the system permission on your tap; after allowing, the needle moves | |
| C2 | Compare the Qibla needle and bearing with a real compass or a trusted app **in your own city** | Within a few degrees. This decides whether the declination correction (true vs magnetic) is right on iPhone. Write the difference | |
| C3 | **Android Chrome**: same as C2 | Same | |
| C4 | Tilt the phone, then rotate to landscape (both directions) | The needle stays correct in both landscape directions. Write which, if any, is wrong (the screen-rotation sign is a guess) | |
| C5 | Turn until facing the Qibla | At about 5° or less it says "Facing the Qibla" with a check, and the phone vibrates **once** (Android; iPhone cannot) | |
| C6 | The accuracy note on iPhone | Shows "about ±N°" when the phone reports it, or asks for a figure of eight when unsure | |
| C7 | Deny the compass permission | A clear refusal message, a static dial, no fake rotation | |
| C8 | Desktop browser (no sensor) | A static dial and a sentence saying the compass needs a phone | |
| H1 | The Hijri date on the Prayer page (and Home where it shows one) against a calendar you trust | The same date, or one day off with the page's "local sighting can differ" wording | |
| H2 | Settings, Hijri adjustment +1 then −1 | The Hijri date moves by one day each way, on the Prayer page, Ramadan and Events together | |
| H3 | At a Hijri month edge (adjust to cross it) | The month and day roll over correctly | |
| H4 | Switch Following to **Ja'fari** and compare Fajr, Maghrib and midnight with a source you trust (your marja's calendar or the one you use) | The times match. Write the source and the difference | |
| H5 | Switch back to Sunni and compare with a source you trust | Same | |
| H6 | Prayer page offline after one online visit | The saved month shows; a month never saved says it needs a connection once | |

## Phase 6: Library

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| B1 | Library on a phone: open an item's edit panel, add a note and a tag | The panel is easy to use by thumb and saves | |
| B2 | Select mode: select several rows, remove them, then Undo | They go and come back | |
| B3 | A large library (use Settings, or save 100+ items) | Scrolling stays smooth | |
| B4 | The "Where I stopped" slots after pinning an ayah and a page | Both slots show and open the right place | |

## Phase 7: People and Stories

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| E1 | A story on the phone (for example Yusuf): read a long chapter, move with Next | Smooth; the Arabic is not clipped; focus and the progress rail work | |
| E2 | Offline after reading one chapter | The chapter opens; a chapter whose surah was never opened says to connect once | |
| E3 | Compare tellings and an entity chip | Each opens as a bottom sheet and closes cleanly | |
| E4 | A person's page, the Story tab, Save and Undo | Works; Save appears in the Library | |
| E5 | The story reader and People at 375, dark | Nothing cut off | |

## Phase 8: Ramadan and Events

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| M1 | Ramadan, Today (before Ramadan) | "Ramadan begins in N days", the date marked Expected, the basis line; "Next event" card | |
| M2 | Ramadan, Timetable at 375 in dark | The table fits without sideways scroll; Friday labelled | |
| M3 | Events: tap a bell, then Undo; open "Your reminders" | "Saved to your list" with Undo; the reminder is listed; no alert is sent (the page says so) | |
| M4 | Open the Ramadan page offline after one online visit | Today, Timetable and Events open from what was saved | |
| M5 | Hijri adjustment +1 and −1 | The Events dates and the "begins in N days" countdown move by one day together | |

## Phase 9: Per page, Tasbeeh, Asma, Sajda

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| W1 | Per page, `?page=1` and a page with two surahs, at 375 in dark | Readable; the header names both surahs; nothing cut off | |
| W2 | A− / A+ up to the largest size | The Arabic is not clipped and the layout holds | |
| W3 | The slider by touch, and Go to page | Both move to the page; a bad number shows "Enter a page from 1 to 604." | |
| W4 | Pin page and Save, then the Library | The Library shows both; Undo on each works | |
| W5 | Per page: the sajda sign (for example page 416, 32:15) | One sign inside the text, not an empty box. If it is an empty box on your phone, say which phone (it is a font issue) | |
| T1 | Tasbeeh: tap the circle by touch, 5 times | The count goes up; a short vibration on Android; none on iPhone (the switch is not shown there) | |
| T2 | Reach the goal (33) | Count returns to 0, cycles +1, a longer vibration, the screen reader (if on) says "Goal of 33 reached" | |
| T3 | Reset count, then Undo; change the goal, then Undo | Both undo | |
| T4 | Turn the vibration switch off, tap | No vibration; the choice is remembered | |
| D1 | Asma-ul-Husna: search, save a name, open its sheet, "Count this name" | Each works; the counter shows that name | |
| D2 | Sajda: open the list, tap "Open in the reader" on one | The reader opens at that ayah | |
| D3 | Tasbeeh, Asma and Sajda at 375 in dark | Nothing cut off; targets easy to hit | |

## Phase 10: Search

| # | Steps | Expected | What I saw |
| --- | --- | --- | --- |
| X1 | Phone: open Search from the header icon | The page opens and the keyboard does **not** open by itself; tapping the box opens it | |
| X2 | Type `mercy`, then `yusuf`, then an Arabic word | Surahs, People and Stories show at once; ayahs follow after a moment; the Arabic result is right to left and readable at your Arabic size | |
| X3 | Type `2:255` | "Open Al-Baqara 2:255" opens the reader at that ayah | |
| X4 | Switch on airplane mode and search `mercy`, then `2:255` | The offline message for ayahs; the ayah number still opens; People and Stories still answer; Try again works once you are back online | |
| X5 | Filters: pick Urdu, then a surah, then a juz; Done | The sheet comes up from the bottom, every control is easy to hit, the number on Filters is right, the results follow | |
| X6 | A hardware keyboard on a tablet or laptop: press `/` on Home | Search opens with the cursor in the box | |

---

## Phase 11: Downloads

Open the Vercel preview of branch `phase-11-downloads` on the phone. Use **Wi-Fi** for downloads. The smallest file is Al-Ikhlaas (about 0.4 MB); good real tests are Al-Mulk (about 7 MB) and Yaseen (about 17 MB).

**Result so far (2026-10-23, Pixel 7 Pro, Android 17, Chrome, first slice):** D2 pass (Al-Ikhlas downloaded and listed), D4 pass (played offline in airplane mode). Not yet tried: seeking offline, reopening offline, Al-Baqarah.

| # | What | Expect | You saw |
| --- | --- | --- | --- |
| D1 | Open **Downloads**. The line under Preferences | "Reciter: <your reciter> · Change in Settings". On iPhone in Safari (not the Home Screen app) one note about adding the app to the Home Screen | |
| D2 | Add **Al-Ikhlaas** (Add surahs, tick it, Download) | A progress bar, then the surah is listed under Saved with Text and Audio ticked and its size. "Offline playback is ready." at the bottom (reload once if it says it needs one more load) | **Pass** on Pixel 7 Pro, Android 17, Chrome |
| D3 | Add **Al-Mulk** or **Yaseen** | Same; the percentage and "MB of MB" move. Note the time and the network | |
| D4 | **Airplane mode**, then press Play on a saved surah | It plays from the first second | **Pass** on the same phone |
| **D4b (open)** | Still offline: **seek** in the player sheet (to the middle, and near the end) | It jumps and keeps playing | **Not tested yet** |
| **D5 (open)** | Still offline: **close the app completely**, open it again, go to Downloads, press Play | The surah is still listed and still plays | **Not tested yet** |
| D6 | Offline: press Play on a surah that is **not** saved | "Couldn't play. Audio needs a connection unless it was downloaded." with Try again; no endless spinner | |
| D7 | Online: **Remove** a saved surah, then **Undo** within a few seconds; remove again and wait | It comes back; the second time it is gone and Settings, Data and privacy shows less used | |
| **D8 (open)** | **Al-Baqarah** (90 to 121 MB, on Wi-Fi): download it, play it offline, seek near the end | It plays and seeks, or say exactly what happened (the page reloaded, the audio stopped, low memory) | **Not tried** |
| **D9 (open)** | iPhone only: a day or more later, open the app and look at Downloads | The saved surahs are still there (Safari may clear a site's data after a week without a visit unless the app is on the Home Screen: the **7-day Safari check**) | |
| **D10 (open)** | **iPhone Safari**: repeat D2 to D7 (in the browser tab, then from the Home Screen) | Each works, or say which step fails and the message | |
| D11 | Android Chrome: Settings, Audio, turn on **Download on Wi-Fi only**; on **mobile data** add a surah with audio | The text is saved; the audio says "Waiting for Wi-Fi"; join Wi-Fi and it starts by itself | |
| D12 | Add a surah with **Tafsir** ticked; airplane mode; open that surah in the reader and open an ayah's tafsir | It opens with no connection | |
| D13 | **Save the text of the whole Qur'an** (Wi-Fi), airplane mode, open a few surahs | Each opens; the page says 114 surahs | |
| D14 | `/surah-audios/36`: Play a reciter that is not yours; Download another | The Settings reciter does not change; Saved shows with the size | |
| D15 | In the player sheet press **Save audio to listen offline** | Progress, then "Saved on this device" | |
| D16 | Firefox (only if you use it): D2 and D4 | Works, or "This browser can't keep files…" | |

## Phase 13: Daily Fiqh

- **K1 (Khamenei against leader.ir, on a computer with a browser):** the 30 entries of `docs/phases/phase-13-khamenei-spot-check.md`. **Phase 13 is not accepted until this passes; any difference holds his module.**
- **F1 (installed phone, offline):** open Daily Fiqh online, choose a marja', open Taqlid and one Salat topic; switch to airplane mode and reload both: the rulings show. Open a category you did not open: it says it is not on the device with Try again. Back online, Save all for offline, then offline again: every topic opens.
- **F2 (a phone that never opened Daily Fiqh):** offline, open `/fiqh` in a new tab: a plain "Daily Fiqh isn't on this device yet" page, not a blank one.
- **F3 (Urdu on a phone):** choose Urdu and Both on a Sistani topic: the Nastaliq text reads well at 375 px and nothing is cut off.

## Manual review (not on a device)

These need your judgement, not a phone. Details are in `docs/CONTENT_TO_VERIFY.md`.

| # | What | Where |
| --- | --- | --- |
| V1 | Wording of ours across all pages (labels, notices, error messages), including the resume line and the new audio words | CONTENT_TO_VERIFY, each section |
| V2 | The three relationship entries (Isa, Maryam) and the status chips on People; `nuhflood` in the "arranged for study" list | CONTENT_TO_VERIFY (People, Stories) |
| V3 | The calendar basis name on Ramadan and Events ("Hijri Calendar of Saudi Arabia"), the Laylat al-Qadr rows, the legacy event list and its gaps | CONTENT_TO_VERIFY (Ramadan, Events) |
| V4 | The 99 names (apostrophes, repeated meanings), the list of 15 sajda verses, the five dhikr | CONTENT_TO_VERIFY (Asma, Sajda, Tasbeeh) |
| V5 | The "not a line-for-line copy" sentence on Per page | CONTENT_TO_VERIFY (Per page) |
| V6 | The screenshots I did not look at one by one (each compare README says which I did) | `docs/design/*-compare/` |
| V7 | Screen-reader passes (VoiceOver and TalkBack) on Home, Settings, the listing, the reader, the player, Per page | Rows P6, R6 and your own |

## Results to paste back

```
A (audio): iPhone Safari — surah 1: ...  surah 3: ...  surah 18: ...  seeking: ...
           Chrome Android — surah 1: ...  surah 3: ...  surah 18: ...  seeking: ...
           Firefox — ...
C (compass): iPhone: ...  Android: ...  landscape: ...  difference from a real compass: ...
N (notifications): ...
H (Hijri / Ja'fari): ...
Anything else that looked wrong: ...
```
