# Phase 8B: Events (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: the Events tab of `d-page-ramadan` / `m-page-ramadan` (`evHTML`, `evVisible`, `evTag`, `RAM_EVENTS`).
- Route: the same `/ramadan` route with `?tab=events` (so Today, Timetable and Events share one page and one navigation entry).
- Offline level: names, tags and notes are bundled (A); each date needs a saved calendar month (B).

## 0. Corrections and carried notes

- **A count I got wrong:** I wrote "32 legacy events" in the Phase 8 plan, the approval prompt repeated it, and two docs say it. Counting the file (`app/utils/islamicEvents.js`) gives **29 events**: **14 shared, 13 Ja'fari, 2 Sunni**, and **9** (not 10) carry a `dateNote`. Everything below uses the real numbers; the docs that say 32 are corrected in this phase's first commit.
- 8A review notes: the tracker's current state is announced on every change (a polite live region: "Day 12: Fasted", tested); Imsak keeps the service's own word; the "Night N begins at sunset" sentence stays out; a past manual start date behaves as before (tests: day 1 on the date, through day 30, then the calendar takes over). The calendar's name is one flag now (`SHOW_CALENDAR_BASIS` in `app/lib/ramadanText.ts`): off, the page says only "Dates are calculated. Local sighting can differ by a day."
- **Baseline** `npm run verify` (Node 22) before building 8B: build, lint and **480 unit tests** pass; **334 of 335 browser tests passed** and one failed, `settings.spec.ts` "the section picker is a bottom sheet" at 375px (a height measured while the sheet was still sliding in). It passed 3 of 3 when re-run alone, so it is a timing flake under load, not a regression. I made that measurement wait for the sheet to settle (`expect.poll`); everything else is unchanged.

## 1. The 29 legacy events (every one, as the data has it)

| Hijri date | Name | Tradition | Category | Note (`dateNote`) |
| --- | --- | --- | --- | --- |
| 1 Muharram | Islamic New Year | shared | major | |
| 9 Muharram | Tasua | Ja'fari | shia-occasion | "The eve of Ashura, commemorating the day before the Battle of Karbala." |
| 10 Muharram | Ashura | shared | major | "Observed differently across traditions: a recommended fasting day in Sunni practice, and a day of mourning for the martyrdom of Imam Husayn at Karbala in Shia practice." |
| 20 Safar | Arbaeen | Ja'fari | shia-occasion | "40 days after Ashura, marking the end of the mourning period for Imam Husayn." |
| 12 Rabi' I | Mawlid al-Nabi | Sunni | birth | |
| 17 Rabi' I | Mawlid al-Nabi & Imam Ja'far al-Sadiq | Ja'fari | birth | "Shia tradition observes the Prophet's birth on this date, shared with Imam Ja'far al-Sadiq's birthday." |
| 27 Rajab | Isra and Mi'raj | Sunni | major | |
| 27 Rajab | Mab'ath, Prophet's Commissioning | Ja'fari | major | "Commemorates the Prophet's first revelation and commissioning as Messenger." |
| 3 Sha'ban | Birth of Imam Husayn | Ja'fari | birth | |
| 4 Sha'ban | Birth of Abbas ibn Ali | Ja'fari | birth | |
| 5 Sha'ban | Birth of Imam Ali Zayn al-Abidin | Ja'fari | birth | |
| 15 Sha'ban | Birth of Imam Muhammad al-Mahdi | Ja'fari | major | "One of the most widely celebrated dates in the Shia calendar." |
| 15 Sha'ban | Laylat al-Bara'at | shared | major | "The night of the middle of Sha'ban, widely observed as a night of forgiveness." |
| 1 Ramadan | Start of Ramadan | shared | major | |
| 10 Ramadan | Death of Khadijah | shared | remembrance | |
| 15 Ramadan | Birth of Imam Hasan al-Mujtaba | Ja'fari | birth | |
| 19 Ramadan | Imam Ali Struck in Prayer | Ja'fari | martyrdom | "Imam Ali was struck while praying in the mosque of Kufa; he was martyred two days later." |
| 21 Ramadan | Martyrdom of Imam Ali | Ja'fari | martyrdom | |
| 21, 23, 25, 27, 29 Ramadan | Laylat al-Qadr (possible night), five entries | shared | major | |
| 1 Shawwal | Eid al-Fitr | shared | major | |
| 8 Dhu al-Hijjah | Start of Hajj (Yawm al-Tarwiyah) | shared | major | |
| 9 Dhu al-Hijjah | Day of Arafah | shared | major | |
| 10 Dhu al-Hijjah | Eid al-Adha | shared | major | |
| 18 Dhu al-Hijjah | Eid al-Ghadir | Ja'fari | major | "Commemorates the Prophet's declaration at Ghadir Khumm." |
| 24 Dhu al-Hijjah | Eid al-Mubahala | Ja'fari | shia-occasion | |

The same Hijri day holds more than one entry in three places (27 Rajab: Sunni and Ja'fari; 15 Sha'ban: Ja'fari and shared; 21 Ramadan: Ja'fari and shared). **There are no per-tradition description pairs, and no event has a description beyond the 9 notes.** The file's own header says it is a calculated reference, not a ruling, and that the dates are those "well-established and largely uncontested"; a Twelve Imams calendar was deliberately left out. The Fatimiyya days, Rajab and Sha'ban beginnings, and the Imams' other births and martyrdoms in the prototype are not here (they need a reviewed source, section 6).

## 2. How each event gets a Gregorian date

- **The unit:** an event is a Hijri month and day. Its Gregorian date is the day whose Hijri date matches, from the calendar service. **No date comes from a formula of ours.**
- **The source, and a change from 8A:** for Ramadan I used the Hijri-month endpoint (one request gives the whole month). For events the natural unit is the **Gregorian month** (`/v1/gToHCalendar/{month}/{year}`): one request per month gives the Hijri month, day and year of every Gregorian day, with no year estimate and no year-boundary logic (Dhu al-Hijjah into Muharram needs nothing special). I recorded real responses for Oct 2026, Feb and Mar 2027 in 8A and will record Nov, Dec 2026, Jan and Apr to Sep 2027 first, and compare each overlapping day with the prayer cache and with the Ramadan month, as in 8A. They are saved in the same `hijri-months` store under a separate key space (`g:YYYY-MM`); no new store, no version bump.
- **Months needed:** the horizon is **today's month and the next 5** (6 months), plus **one month on each side** for the adjustment (section 3), so up to 8 requests the first time (in parallel, 3 at a time), then none for 30 days. "Show later events" adds 6 more months at a time (to 24). That is about 21 of the 29 events in the first 6 months from October 2026 (the 5 Laylat al-Qadr rows and the Ramadan, Eid al-Fitr and Sha'ban rows fall in it).
- **A month with 29 days:** an event on the 30th (none in the data today; a reviewed file might) is not listed that year; nothing is moved.
- **Beyond the store, offline:** a month that is not saved and cannot be fetched is not guessed. The list shows what the saved months give and one line: "Dates for later months need a connection once." If no month is saved at all: "Dates need a connection once." with Try again (the 8A wording).
- **Refresh:** a saved month is refreshed when older than 30 days and online; a failed refresh keeps it (the 8A service logic, reused).

## 3. The Hijri adjustment

Applied in the app to the **displayed** date only, exactly as on the Prayer and Ramadan pages: an event on Hijri (m, d) is displayed on the Gregorian day `D - adjust` where `D` is the service's day for (m, d) (so +1 shows it a day earlier). The saved months and every key stay unchanged (a test reads the stored record). The one month on each side in section 2 is what lets an event near a month edge move into or out of the window correctly. A line says "Adjusted by +1 day" when it is on.

## 4. Wording of the date: "Expected", with the basis

- Every event date reads **"Expected <weekday> <day> <month> <year>"** (one rule for all, because the data does not say which events depend on sighting, and I will not decide that), the Hijri date ("27 Rajab"), "in N days" (or "today", "tomorrow"), and above the list one line from the same helper as the Ramadan page: "Dates follow the <basis>. Local sighting can differ by a day." (or "Dates are calculated. ..." with the flag off).
- The legacy `dateNote` shows under the event, verbatim, as the data's own note.
- No "observed on" claims; no "usually"; the page does not say which tradition observes an event beyond the tag.

## 5. The list: grouping, Next, the tradition tag and filter

- **Grouping** by month of the displayed date ("November 2026"), headings as `h2`; each row: the date block (day, month, weekday), the name, the Hijri date and "in N days", the tradition tag (**Both** for shared, **Sunni**, **Ja'fari**), the category chip from the data (`major` Major, `birth` Birth, `martyrdom` Martyrdom, `shia-occasion` Occasion, `remembrance` Remembrance; the labels are ours and flagged), the note, and the bell.
- **Next:** the first event on or after today carries a "Next" tag (and "Today" on the day).
- **The Both / Sunni / Ja'fari filter appears only when the loaded events carry a tradition tag** other than "shared" (true today: 2 Sunni, 13 Ja'fari; if a future file had only shared events the control would not render). The default is **Following** (the global fiqh setting): an event shows if its tradition is shared or matches; "Both" shows all; the filter on this tab is a **view** choice and does not change the global setting (the Following control at the top does). The choice is kept in the URL (`?tab=events&show=sunni`).
- **The five Laylat al-Qadr entries** stay five rows, as the data has them (each is "Laylat al-Qadr (possible night)"); question 3.
- **When a Hijri day holds a Sunni and a Ja'fari entry**, "Both" lists both rows, each with its own tag, and nothing is merged or compared.
- **Empty states:** the filter leaves nothing ("No events for this filter in these months." with Show all); no months saved ("Dates need a connection once."); partial ("Dates for later months need a connection once.").
- **Footer line:** "This list is a reference, not a ruling." is the legacy file's own framing (its header comment); I propose a footer "Dates and the list follow this app's data; they are not a ruling." flagged for your wording (question 6).

## 6. A reviewed events file later, with no code change

- Events are read through one adapter (`lib/islamicEvents.ts`) over **a list of sources**: today the legacy file (`@legacy/utils/islamicEvents`) and an **empty reviewed file** `app/data/events/reviewed-events.json`. Adding a reviewed file later is adding JSON; the adapter, the list, the filter and the reminders do not change.
- **The shape a reviewed entry may have:** `id`, `month` (1 to 12), `day` (1 to 30), `name`, `tradition` (`shared` | `sunni` | `jafari`), `category`, an optional `note`, optional **per-tradition wording** `text: { shared?, sunni?, jafari? }`, and **a `source` (type and citation) that is required for any `text`** (the validator rejects wording without a source, in the way the Wajibat data requires a source per ruling). A reviewed entry with the same `id` as a legacy entry replaces it; a new `id` adds a row; legacy entries get stable ids (`legacy:9-21-martyrdom-of-imam-ali`).
- **How the wording shows:** under a Sunni view the `sunni` (and `shared`) text; under Ja'fari the `jafari` (and `shared`); under Both the lines are labelled "Sunni:" and "Ja'fari:" and neither is merged. An event with no `text` shows no lines (the empty per-tradition state is simply the row without lines; it is not filled with a placeholder).
- **The filter's rule above** (appears only when tradition tags other than shared exist) already follows from this.
- A validator and tests accept the shape, reject a bad month or day, wording without a source, an unknown tradition and a duplicate id, and a test loads a sample reviewed file from the test folder to prove that nothing else changes. **The file ships empty; nothing is invented to fill it.**

## 7. Reminders (the bell) and what a reminder does

- **Storage:** `quran:reminders:v1`, the legacy shape (`{ id, title, date, note, recurringYearly, done, createdAt }`): the bell adds `{ title: <event name>, date: <displayed Gregorian date>, note: "", recurringYearly: false, done: false }` with a new id; pressing it again removes that reminder (matched by title and date) with Undo. Unknown fields kept; a damaged value reads as empty. Hifz and the legacy calendar read the same list, so a reminder made here shows there.
- **What a reminder does (the honest limit):** it is an **item in your list**; **no alert is scheduled.** The Phase 5 prayer reminders only work while the app is open (a page timer and the browser's Notification API; there is no push), and the Settings notifications page says so. The row says "Shown in your list. No alert is sent." A date stored at the moment of the tap does not move if the Hijri adjustment changes later (stated in the list).
- **Your reminders** (under the events): upcoming first, then past (overdue) ones, each with a done checkbox and a delete button (with Undo), 44px targets; "No reminders yet." when none.
- Question 4: whether reminders should also surface while the app is open (a quiet toast on the day), or stay list-only.

## 8. Home, the page, the navigation

- **Home:** nothing changes beyond the 8A banner (no event card, as decided in Phase 1). A "next event" line is not added unless you ask.
- **The page:** three tabs, **Today, Timetable, Events**, as buttons with `aria-current` (the 8A pattern), one route; the page title stays "Ramadan" (the Events tab lists events across the year; the tab says so: "Events", with the sentence "Dates for the coming months."). The nav entry stays "Ramadan". `/calender` stays for Phase 15 (which will reuse the same adapter and months).
- The Today tab's "next event" mention is not added (the prototype has one on the Before state; the data supports it, so question 5 asks).

## 9. Files, tests, screenshots

- **Files:** `app/lib/islamicEvents.ts` (adapter, ids, merge, validator, date matching, grouping, filter rule), `app/lib/gregorianMonths.ts` (the `gToHCalendar` parser, key space, adjustment), `app/lib/reminders.ts` (the legacy list), `app/composables/useEvents.ts`, `app/components/ramadan/EventsPanel.vue`, `EventRow.vue`, `RemindersList.vue`, `app/data/events/reviewed-events.json` (empty), `services/hijri.service.ts` (an added function for Gregorian months); `RamadanPage.vue` gets the third tab.
- **Unit tests:** the parser on recorded real months (Oct 2026 to Sep 2027) and its agreement with the prayer cache and the Ramadan month; each of the 29 events placed on the right Gregorian day for a recorded year (from the service's own Hijri days, never a formula) including the same-day groups and a 29-day month; the adjustment both ways and at month edges; the horizon and "Show later events"; the tradition tag and filter rule (including a file with only shared events); the reviewed-file validator and merge (a sample file in the test folder); the reminders shape, toggle and Undo, and that Hifz's use is untouched; no invented text (every name in the rendered list comes from a data file); the source scan.
- **Browser tests** (recorded real responses, the clock fixed): the list for the default and adjusted dates; grouping by month; Next and Today; the filter (Following, Both, Sunni, Ja'fari) and the URL; a Hijri day with two rows; a note shown verbatim; the bell and the reminders list (with Undo, done, delete); partial and not-saved offline states; the empty filter state; 375px and 44px; one `h1`; light and dark; keyboard; Settings Reset keeps the list and Clear all removes it; `quran-app-db` never opened.
- **Screenshots (prototype next to revamp):** the Events tab at **1280 and 375, light and dark** (4 pairs), plus states: Both, Sunni and Ja'fari filters, an event with a note, the adjustment applied, a reminder set and the list, partial months offline, no months saved, the empty filter. I will look at every pair I can and say which I only generated.
- **Docs:** phase doc, `docs/pages/events.md` (or the Events section of `ramadan.md`), `docs/design/events-compare/README.md`, PROGRESS.md and CONTENT_TO_VERIFY.md (the prototype's list, descriptions and dates not used; the category labels, the footer line, the "Expected" rule; the gaps).

## 10. What I will not do

No event outside the data; no description we wrote; no date by a formula; no "observed on" claim; no comparison table; no per-tradition wording (the shape exists, the file ships empty); no streak or guilt wording; no alert that is not sent.

## Open questions

1. **A count correction accepted?** 29 events (14 shared, 13 Ja'fari, 2 Sunni; 9 notes), and the docs that said 32 corrected.
2. **Dates by the Gregorian-month endpoint** (`gToHCalendar`, one request per month, 6 months ahead plus one each side, "Show later events" for 6 more)? (Recommended: yes.)
3. **The five Laylat al-Qadr rows:** keep as five rows (data-faithful) or show one grouped row "Laylat al-Qadr (possible nights)" with the five dates? (Recommended: five rows; no regrouping of the data.)
4. **Reminders:** list-only ("No alert is sent"), or also a quiet toast on the day while the app is open? (Recommended: list-only for now.)
5. **A "next event" line on the Today tab before Ramadan** (the prototype has one; the data supports it)? (Recommended: yes, one line linking to the Events tab; no Home change.)
6. **Wording ours, for your review:** the category labels (Major, Birth, Martyrdom, Occasion, Remembrance), the tradition tags (Both, Sunni, Ja'fari), the "Expected" rule for every date, and a footer ("not a ruling"). OK as drafted?
7. **The reviewed-file design** (section 6) as drafted: an empty JSON file, source required for any wording, the same id replaces a legacy entry?
8. **The filter default** is Following (the global fiqh), view-only on this tab. OK?

## Risks

- **Dates:** the only risk that matters; mitigated by using only the service's Hijri days (recorded real months as fixtures, compared with the prayer cache), the adjustment read from one extra month each side, the "Expected" wording and the sighting note.
- **Up to 8 requests the first time:** done in the background with a skeleton, saved for 30 days; offline shows the saved months only.
- **Sparse rows:** most events have no description. That is the data; the plan does not fill it.
- **Reminders** look like alerts: the row says plainly that no alert is sent.

## Not part of 8B

The Calendar page (Phase 15), real alerts, reviewed per-tradition wording and the events the prototype lists beyond the data (they need a source you review), the Qur'anic Events module (Phase 12).
