# Phase 8: Ramadan & events (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-ramadan`, `m-page-ramadan` (`beforeHTML`, `duringHTML`, `ttHTML`, `evHTML`, `nightsCard`, `readyHTML`, `cmpHTML2`, `followHTML`; three states set by the prototype's control bar: before Ramadan, Day 12, last ten nights).
- Routes (legacy, kept): `/ramadan`. `/calender` stays as it is (see section 8).
- Offline levels: see section 11.

## 0. Carried from the 7B review

- `nuhflood`: its id is in `ARRANGED_OVERRIDES` (`app/lib/stories.ts`), so the "Arranged for study" notice and a dashed status chip show until you decide; the legacy data is untouched; the open decision is in `CONTENT_TO_VERIFY.md` and the cutover checklist in `PLAN.md` (fix the legacy status once at cutover, then delete the override). Tested (nine stories carry the notice; the override must name a story whose data really contradicts its label).
- Your review items (the "Arranged for study" sentence, the "Summary (written for this app)" label, the 7A status chips, `nuhflood`) are recorded; real-device checks are yours.
- **Baseline** `npm run verify` on Node 22 after the override change: build, lint, **452 unit tests** and **302 browser tests all pass**.

## 1. What the legacy app has (read from `pages/ramadan/index.vue`, `pages/calender.vue`, `composables/useRamadan.ts`, `useReminders.ts`, `stores/prayer.js`, `utils/islamicEvents.js`, `ramadanContent.js`, `prayerFiqh.js`, PROJECT_PLAN §18)

### `/ramadan` (one page, no tabs)
- **Not Ramadan:** "It isn't Ramadan right now" (detection from the calculated Hijri calendar, "Sunni" or "Ja'fari" method) and the start-date control.
- **Ramadan:** a day counter ("Day 12"; a chip "Manually set" or "Blessed Month"); three time cards **Imsak** (`timings.Imsak`), **Suhoor Ends** (`timings.Fajr`) and **Iftar** (`timings.Maghrib`), all from the same AlAdhan response as the prayer page, so for the selected method; an Iftar countdown with seconds ("Iftar time passed 🌙" afterwards).
- **Fasting tracker:** a 7-day strip (today and the six days before); tap cycles unset, fasted, missed, unset; counts; "Plan tomorrow's fast". **It also shows a streak with a flame icon** (a computed value, not stored).
- **Ramadan Khatmah:** creates a reading goal (`finish-by-date`, label "Ramadan Khatmah", target the estimated end of Ramadan, 30 days assumed and labelled "estimated"), then shows its progress ring, "N / target ayahs today", pace.
- **Today's Dua:** one of 5 duas by Ramadan day (Arabic, translation, reference); the Ayah of the day card; **Laylat al-Qadr** (nights 21, 23, 25, 27, 29 as chips, "Tonight is one of the nights", a disclaimer note); a link to the calendar.
- **Ramadan start date** (always visible): a date input; "Ramadan started on" overrides detection for 30 days; "Use calculated date" clears it.

### How the Hijri date, the override and the tracker work
- **Hijri:** AlAdhan's `date.hijri` on the day record (`month.number === 9` is Ramadan; `day` is the Ramadan day), for the user's method and location. No in-app adjustment exists in the legacy app.
- **Override:** `quran:ramadan:v1.startOverride` (a local date `YYYY-MM-DD`); active for 30 days from that date (`daysBetween(override, today)` from 0 to 29); then `ramadanDay = daysBetween + 1`.
- **Tracker:** `quran:ramadan:v1.fastingLog` = `{ "YYYY-MM-DD": "fasted" | "missed" | "planned" }` keyed by the local calendar day. Stored together: `{ startOverride, fastingLog }`.
- **Reminders:** `quran:reminders:v1` (`{id, title, date, note, recurringYearly, done, createdAt}`), used only by the **calendar page** ("Personal Reminders", "Add reminder for this day") and by Hifz. They are in-app list items, not notifications.

### `/calender`
A Gregorian month grid with the Hijri day in each cell, a dot where a Hijri event falls, "Events This Month", a selected-day card (Ramadan day chip, event chips with their `dateNote`, Suhoor Ends and Iftar for that day), month navigation, and Personal Reminders. It calls AlAdhan's `/v1/calendar` itself and keeps its own cache in `calendar_v2_<lat>_<lon>_<fiqh>_<month>_<year>` (not the prayer cache).

### The events data: `ISLAMIC_EVENTS` (32 entries, Hijri month and day only)
Fields: `month`, `day`, `name`, `category` (major, birth, martyrdom, shia-occasion, remembrance), `tradition` (`shared`, `sunni`, `jafari`), `icon`, and, on 10 of them, a `dateNote`. **No Gregorian date, no description text, no per-tradition wording pairs.** The same Hijri day can hold a shared and a tradition-specific entry (for example Mawlid is `sunni` on 12 Rabi' I and `jafari` on 17 Rabi' I; Isra and Mi'raj is `sunni` and Mab'ath is `jafari`, both 27 Rajab; Laylat al-Bara'at is `shared` and the Birth of Imam al-Mahdi `jafari`, both 15 Sha'ban). `getIslamicEvents(month, day, fiqh)` filters by the fiqh ("shared" always passes). Laylat al-Qadr is **five `shared` entries** (21, 23, 25, 27, 29 Ramadan).
**This is a different dataset from the Qur'anic Events module** (`quranEvents.ts`, Phase 12); this phase uses `islamicEvents.js` only.

### What the legacy has that the prototype omits
Imsak and Suhoor Ends as **separate** values for both fiqhs; the **start-date override** (a manual date for 30 days) as well as the Hijri adjustment; the Ayah of the day; the Khatmah goal's live progress; the **Personal Reminders** and the **month grid** (the prototype has neither); the `dateNote` on events; Hijri-day cells; events for **every** month (not only the next ones).
### What the prototype adds
Three states (before, during, last ten), a **Following** switch, a **Timetable** tab (30 days), an **Events** tab with a Both/Sunni/Ja'fari filter, "Ramadan begins in N days", a "Get ready" checklist, per-event reminder bells, a "Night strip" for Laylat al-Qadr, a "How it differs" table.

## 2. Content integrity: the prototype's text is placeholder and is not shipped

| Prototype element | What the legacy data gives | Missing or needs a source you review |
| --- | --- | --- |
| **The event list** (26 events: Fatimiyya days, Rajab begins, Birth of Imam Ali, Martyrdom of Imam Musa al-Kadhim, Birth of Fatima, Mid-Sha'ban, ...) | 32 events with Hijri month and day (listed above) | **Not in the data:** First and Second Fatimiyya, Rajab begins, Sha'ban begins, Birth of Imam Ali, Martyrdom of Imam Musa al-Kadhim, Birth of Fatima, the "Night of 19 Ramadan" entry. **In the data but not the prototype:** Tasua, Arbaeen, Khadijah's death, the births of Imam Husayn, Abbas, Zayn al-Abidin, Hasan, the 19th and 21st martyrdom days, Hajj start. Anything not in the legacy list needs your reviewed source |
| **Dates** ("27 Feb 2027") | none (Hijri only) | computed from the Hijri calendar data (section 3). The prototype's dates were mine and are not used |
| **Event descriptions** (Sunni line, Ja'fari line) | only 10 `dateNote` sentences | the rest have **no description**; the row shows the name, the Hijri date, the tradition tag and the note if there is one. Nothing is written for the others |
| **"How it differs" table** (suhoor, iftar, night prayers, Imam Ali) | nothing | **Not shipped.** A table of how the two traditions differ is a set of rulings; it needs a source you review (candidate: the Wajibat data for Ja'fari rulings, which is sourced per marja') |
| **Laylat al-Qadr by fiqh** (Sunni 21 to 29, Ja'fari 19, 21, 23) | nights **21, 23, 25, 27, 29, shared**, and a disclaimer sentence | the **Ja'fari 19, 21, 23** claim is not in the legacy data. Shown as the legacy has it for both; a Ja'fari set needs a source you review |
| **Iftar and suhoor wording** ("Ja'fari iftar waits until the eastern redness has passed", "Imsak, a little before Fajr, as a precaution") | none; the legacy shows Imsak, Fajr (as "Suhoor Ends") and Maghrib (as "Iftar") for the selected method | **Not shipped.** The page labels the times with the **method's name** from the cache and states no ruling |
| **Iftar duas** | `RAMADAN_DUAS`: 5 duas with Arabic, translation and reference | the Arabic is **typed in the legacy data** (flagged in CONTENT_TO_VERIFY.md since Phase 0; the Ja'fari dua there has no confirmed source). See question 5 |
| **Timetable formula** (sample times) | none | real times only, from the monthly cache (section 5) |
| **"Ramadan 1448 begins in N days" and "Expected by the Saudi calculation; South Asia one day later"** | the Hijri date per day from the service (the calculation method is the service's) | the "South Asia one day later" sentence is a claim of mine; not shipped. The page says: "Dates follow the calendar service. Local sighting can differ by a day. Adjust it in Settings." |
| **Moon-sighting adjustment** | the Phase 5 Hijri adjustment (-2 to +2, applied in the app) and the legacy start-date override | both are kept and shown (section 3) |
| **"Get ready" checklist** (method, adjustment, alerts, Khatmah) | the settings behind each exist | built from the real settings; no new text claims |
| **Ramadan duas "sample for layout"** | see above | |

**Rule for this phase:** no event, date, description, ruling or comparison appears unless it comes from the legacy data, the Hijri calendar data, or a source you have reviewed. Where a field is missing the row says nothing rather than something.

## 3. Event and Ramadan dates: from the Hijri calendar data, adjusted in the app

- **Source:** the Hijri date of each Gregorian day, as the service gives it. The prayer cache already stores `hijri` per day for the months it holds (the current and the next month, and the previous two are kept). An event's Gregorian date is the day whose Hijri month and day match (`getIslamicEvents` logic, with the fiqh filter), **after the in-app Hijri adjustment**: the adjustment moves the Hijri date the app uses for a day, so an event falls on the Gregorian day whose adjusted Hijri date matches (the same neighbouring-day read as the Prayer page: the cache and its key never change).
- **Beyond the cache:** the cache does not hold future months (Ramadan 1448 is about 8 February 2027, well past next month). I propose the service's **Hijri calendar by Gregorian month** (`/v1/gToHCalendar/{month}/{year}`, no location needed; I will confirm it exists and record a **real response** as a test fixture, as in Phase 5, before building) fetched lazily for the months an upcoming event or Ramadan needs, and stored in a **new additive store** `hijri-months` in `quran-revamp-db` (version 3 to 4). `quran-app-db` is never opened. Offline with a month not stored: that part of the list says "Dates for later months are saved once you are online."
- **Horizon:** the Events tab lists events from today to the end of the **next 6 Gregorian months** (those months are fetched once and kept), with "Show later events" to extend by 6 more. Question 3.
- **Ramadan's start:** the first day whose (adjusted) Hijri month is 9. If you set a **start-date override** (legacy key), it wins for 30 days, and the page says "Manually set". The page never states "expected by the Saudi calculation".
- **Local sighting:** a one-line note, "Dates follow the calendar service and can differ by a day with local sighting.", where dates show.
- **Not invented:** no event is dated by a formula of ours; if a month is not available the event is not listed.

## 4. Both fiqhs without stating a ruling

- **Following** uses the **global fiqh setting** (`prayerFiqh`, the legacy raw key); changing it on this page changes the setting (the same control and key as Settings, so there is one source of truth). The times shown are for that fiqh's method (Phase 1 cache keys already hold both).
- **Events filter** (Events tab): Following (default), Sunni, Ja'fari, Both. An event shows if `tradition` is `shared` or matches; "Both" shows all with a tag (Both, Sunni, Ja'fari). When the same Hijri day has a Sunni and a Ja'fari entry (Mawlid's two dates, Isra and Mi'raj and Mab'ath), "Both" lists both rows separately, each with its own tag; nothing is merged or compared.
- **Laylat al-Qadr card:** the legacy nights (21, 23, 25, 27, 29) and the legacy disclaimer, **for both fiqhs**; the card highlights the night when it is one. No per-fiqh set until you supply a reviewed source.
- **Imsak, Fajr, Iftar:** three cards as in the legacy, labelled with the names the data uses ("Imsak", "Suhoor ends (Fajr)", "Iftar (Maghrib)") and the method name ("Times: Ja'fari, Leva Institute, Qum"). The page does not say when a fast begins or ends in a tradition's terms.
- **No comparison table.** No sentence of ours about practice, congregation or order of worship.

## 5. Timetable

- **Real times** for each Ramadan day from the cached prayer month(s): Imsak, Fajr, Iftar (Maghrib), the Gregorian date, the Ramadan day number, the Friday highlighted, today highlighted, the Hijri day from the data (29 or 30 rows, as many as the data has; never "30 assumed").
- **Cache coverage:** Ramadan's months are fetched through the existing `syncMonth` (the same atomic swap, cache key and offline rules as Phase 1) **from 1 Sha'ban** (the prefetch rule recorded since Phase 1), or **on demand** when you open the Timetable online before that. They are exempt from the "keep the last two months" pruning while they are in the future.
- **Not covered:** "Ramadan times are not saved on this device yet. Connect once to get them." with Try again; for a method change the cache is per method as today.
- **Offline once saved:** works (offline level A for the rows after they are saved).
- No per-second countdown; "Iftar in 2h 34m" in minutes, seconds only in the final minute (the Phase 5 rule).

## 6. Tracker, Khatmah, reminders, the override: the legacy keys, unchanged

- **`quran:ramadan:v1`** is read and written in its shape `{ startOverride, fastingLog }`. Other fields kept. A damaged value reads as empty.
- **Fasting tracker:** the last 7 days of Ramadan (the strip shows the Ramadan day number and a status), tap cycles as in the legacy (unset, fasted, missed, unset), "Plan tomorrow" toggles `planned`. **No streak and no flame** (the legacy's computed streak is dropped; nothing stored is lost). Counts shown quietly ("Fasted 12 · Missed 1 · Planned 1"). **Wording** is a question (7): the stored value `missed` stays; the label can read "Didn't fast". Undo on a change.
- **Khatmah:** reads the legacy goal labelled "Ramadan Khatmah" (`quran:reading-goals:v1`): its target date and its stored `dailyAyahTarget`, and today's ayah count from the daily log the reader already writes. **Creating** the goal needs the goal maths (`computeDailyAyahTarget`, absolute ayah positions) that belongs to Reading goals (Phase 15). Question 6 proposes the choice.
- **Reminders** (`quran:reminders:v1`): the bell on an Events row writes one reminder in the legacy shape (`title` the event name, `date` its Gregorian day, `recurringYearly: false`, `done: false`), shown under "Your reminders" on the Events tab with delete and Undo; the legacy calendar and Hifz read the same list. They remain **in-app list items** (no notification is scheduled; the row says so: "Shown in this list. No alert is sent."). Question 8.
- **Start-date override:** the legacy control (a date and "Use calculated date"), in a collapsed "Ramadan start date" section, with a link to the Hijri adjustment in Settings.

## 7. The three states, the tabs, and the Home banner

- **Tabs** (links with `aria-current`, one URL each so Back works): **Today** (`/ramadan`), **Timetable** (`/ramadan?tab=timetable`), **Events** (`/ramadan?tab=events`). One `h1` "Ramadan".
- **Today, before Ramadan:** "Ramadan begins in N days" with its date (from the Hijri data; "about" is not used; the sighting note shows), a "Get ready" list from the real settings (fiqh and method, Hijri adjustment, notifications, Khatmah), the next event, the start-date control. If the Ramadan date is not yet known (no month data offline): "Connect once to see when Ramadan begins."
- **Today, during:** day counter and date, the Iftar countdown, Imsak, Suhoor ends, Iftar, the fasting tracker, the Khatmah card, **Laylat al-Qadr** (legacy), **Today's dua** (question 5), the Ayah of the day (the existing Home component and data).
- **Today, last ten nights:** the same, with the Laylat al-Qadr card highlighted on a legacy night and the sentence "Night N begins at sunset the evening before." (an Islamic day starts at sunset: wording of ours, flagged).
- **Events:** the list (section 3 and 4), a month heading per group, "Next" on the first, the Hijri date, "in N days", the tradition tag, the legacy `dateNote` when there is one, the bell (reminder). The Both/Sunni/Ja'fari control.
- **Home** (Phase 1 left a gap: "A Ramadan banner returns in Phase 8"): during Ramadan Home shows a quiet banner (day counter and Iftar time, linking to `/ramadan`), and the existing "next event" slot is **not added** unless you ask (Phase 1 decided no event card). Question 9.
- **Split:** see section 8.

## 8. Splitting, and the Calendar

**Recommendation: split.**
- **8A: Today and Timetable** (the Ramadan page, the Hijri-start logic, the Phase 1 prefetch, the Home banner, tracker, Khatmah (per question 6), duas, Laylat al-Qadr, the start-date control). It rests on data we already hold (the monthly cache) plus the new `hijri-months` store only for "begins in N days".
- **8B: Events** (the Events tab, the Hijri-calendar service use and fixture, the horizon, the fiqh filter, the reminders list). It is where the new data source and the content questions are.
Each phase ends with a plan-then-wait review as before.

**`/calender`:** the prototype has no Calendar design and PLAN.md puts it in **Phase 15 (Reading goals, Calendar, About; not designed)**. Recommendation: **leave `/calender` for Phase 15** (it keeps working as the "not rebuilt yet" page meanwhile), and do **not** fold the month grid into the Events tab (a grid needs its own design). The reminders list on the Events tab covers the "remind me" need until then.

## 9. Files, tests

- **Files (8A):** `app/pages/ramadan.vue` (or `ramadan/index.vue`), `app/components/ramadan/` (`RamadanPage`, `TodayPanel`, `BeforePanel`, `DuringPanel`, `TimesCards`, `FastingStrip`, `KhatmahCard`, `QadrCard`, `StartDateControl`, `TimetablePanel`), `app/lib/ramadan.ts` (the legacy record, override, Ramadan day, adjusted start), `app/lib/ramadanContent.ts` (adapter over the legacy duas and nights), `lib/prayerSync` addition for the Sha'ban prefetch. **(8B):** `app/components/ramadan/EventsPanel.vue`, `app/lib/islamicEvents.ts` (adapter over `@legacy/utils/islamicEvents`), `app/lib/hijriMonths.ts` (the new store and fixture-checked parser), `app/lib/reminders.ts` (the legacy record).
- **Unit tests:** the legacy `quran:ramadan:v1` shape round trip (override window, tracker cycle, Undo, damaged values, unknown fields kept); Ramadan day from the Hijri data with the adjustment and the override; the event-date matching on a **recorded real** month with a +1/-1 adjustment and month edges (29 and 30 day months); fiqh filtering of the 32 events (shared, sunni, jafari, both) and the same-day pairs; Laylat al-Qadr night detection; the timetable rows for a recorded real Ramadan month; the prefetch rule; the Hijri-month store; reminders shape and the legacy list kept; no streak anywhere; the source scan (no typed Arabic, and no typed event text: every event name in the rendered list comes from the legacy data); `quran-app-db` never opened.
- **Browser tests** (recorded real AlAdhan responses, the clock fixed in three states): before Ramadan, Day 12, the 19th night; Sunni and Ja'fari times; the start-date override; the tracker with Undo; the timetable (real rows, Friday, today); the Events filter; the offline and "not saved yet" states; 375px and 44px; one `h1`; light and dark; keyboard.
- **Screenshots (prototype next to revamp):** the three states (before, Day 12, last ten) at **1280 and 375, light and dark** for Today, plus Timetable and Events at 1280 light and 375 dark, plus states (Ja'fari, not covered offline, start-date override, empty tracker, a reminder). I will look at every pair and say which I only generated.

## 10. What I will not do

No streak or flame; no guilt wording; no "expected by the Saudi calculation"; no "South Asia one day later"; no comparison table; no per-fiqh Laylat al-Qadr nights; no ruling about iftar or suhoor; no event outside the legacy list; no description we wrote; no Gregorian date computed by a formula of ours.

## 11. Offline levels

| Part | Level |
| --- | --- |
| Events names, tags, notes, the duas, the Laylat al-Qadr nights (bundled) | A |
| The tracker, the override, reminders (on-device) | A |
| Today with the times, the timetable, event dates | B: from the monthly cache and the Hijri-month store once they are saved; "not saved yet" states otherwise |
| Ayah of the day | B (as Home) |

## Open questions

1. **Split into 8A (Today, Timetable) and 8B (Events)?** (Recommended: yes.)
2. **Event list.** Ship only the 32 legacy events (no Fatimiyya days, Rajab, the Imams' births and martyrdoms the prototype lists beyond the legacy ones) and add others later from a source you review? (Recommended: yes.)
3. **Event dates and horizon.** Use the service's Hijri calendar by month (confirmed and recorded before building) in a new `hijri-months` store, listing the next 6 months with "Show later events"? Or only the months already in the prayer cache (about 2 months)? (Recommended: the 6-month version.)
4. **No comparison table and no per-fiqh iftar or suhoor wording**, as in section 2 and 4. OK? If you want a "How it differs" section, it needs a source you review (the sourced Ja'fari rulings in the Wajibat data are the natural place).
5. **Duas.** (a) Show the legacy `RAMADAN_DUAS` (Arabic typed in the legacy data) flagged for your review; or (b) show only the Qur'anic dua (2:201) with its text read from the cached surah, and the hadith duas as references without Arabic until a verified set is supplied. (Recommended: (b).)
6. **Khatmah.** Read-only (show an existing "Ramadan Khatmah" goal: its target and today's count) with "Plan it in Reading goals" until Phase 15, or build goal creation now (porting the goal maths)? (Recommended: read-only now.)
7. **Tracker wording.** The stored value stays `missed`; the label: "Missed" (legacy and prototype) or "Didn't fast"? (Recommended: "Didn't fast"; no streak either way.)
8. **Reminders.** The bell writes one entry in `quran:reminders:v1` (in-app list, no alert), shown on the Events tab, as in section 6. OK? (A real alert would need the notification scheduling of Phase 5's prayer bells; it can follow.)
9. **Home.** Add only the quiet Ramadan banner during Ramadan, no event card. OK?
10. **`/calender`.** Leave it for Phase 15 and do not fold the month grid into Events. OK?
11. **"Night N begins at sunset the evening before"** (a one-line fact about the Islamic day, our wording) on the Laylat al-Qadr card: keep, flagged for review, or leave out?

## Risks

- **Dates are the hard part:** a wrong Hijri day puts an event on the wrong Gregorian day. Mitigated by using only the service's own Hijri days, the in-app adjustment read from the neighbouring day, recorded real months as fixtures including month edges, and the sighting note.
- **A new network dependency** (`gToHCalendar`) whose terms and shape I will check before building (as I did for Open-Meteo); if it is unsuitable the horizon falls back to the cached months only.
- **Content:** the legacy events have few descriptions; the Events tab will look sparse next to the prototype. That is the honest state of the data.
- **Duas:** shipping typed Arabic (even legacy) is a content risk; question 5.
- **Home** gains a banner and reads Ramadan state: a test keeps Home's other rows unchanged.
- **The Hijri adjustment** is applied in three places now (Prayer, Ramadan, Events): one shared function (`hijriShown`) is reused so they cannot drift.

## Not part of Phase 8

The Calendar page (Phase 15), Reading goals creation (Phase 15), real alerts for events, the Qur'anic Events module (Phase 12), audio.
