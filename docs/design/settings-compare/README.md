# Settings next to the prototype Settings (Phase 2)

Files are JPEGs named `<device>-<theme>-<section>.jpg` (the 32 section pairs: desktop is 1280px, mobile is 375px) and `state-<name>-<device>-<theme>.jpg` (state shots; "No prototype counterpart" on the left where the prototype has no such state). The prototype is driven through its own buttons; the revamp is the production build with the AlAdhan month for Lahore (a recorded real response), the clock fixed at 15 Oct 2026, 09:14 in Karachi, a saved place, and a stand-in for the Notification API where a state needs it.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Segmented choice: a light raised pill on a sunken track | The chosen option is filled with the accent; a radio group (one tab stop, arrows select) | Intentional (contrast; the prototype's selected state is a faint shade) |
| 2 | Unchecked switch: a grey track | An `ink-2` outline on a sunken track with a dark thumb (the first draft used the default and was nearly invisible in the screenshots) | Fixed in this phase |
| 3 | Reading preview: a sample ayah with a verse number | Today's real ayah when it is stored, otherwise the Arabic name of the first surah from the legacy data, labelled "a surah name, not an ayah". No typed Qur'an text | Intentional |
| 4 | Default translation "Off"; English preselected | "Not set (choose per ayah)" removes the key; a line says what applies (English on Home, or the translation from the old reader tab) | Approved |
| 5 | Default tafsir always has a source | "Not set (choose each time)" is an option (the legacy page allowed clearing) | Matches legacy |
| 6 | Reciter short names | The reciters' full names from the legacy data; "Not set (the player's default)" | Real data |
| 7 | Wi-Fi only is on and works | Greyed with the reason where the browser does not report the connection type; works on Chrome for Android | Approved |
| 8 | Method labels shortened ("ISNA", "Leva (Qom)") | The service's exact names | Real data (CONTENT_TO_VERIFY) |
| 9 | Hijri adjustment only | Plus a live preview line from the cached days | Added |
| 10 | No marja' control | "Marja' for Daily Fiqh rulings" appears for Ja'fari, as in the legacy page | Approved |
| 11 | Location: "Use my location" (sample) | No default city: "Set location" until a place is saved; an inline message if declined | Approved |
| 12 | Saved prayer times: a sample line | Real months and last-updated time; Update now with offline, updating and failed states | Real data |
| 13 | Notifications: "Your browser asks for permission the first time you turn this on." | The fixed sentence "Reminders only appear while Quran App is open.", the permission state, an inline explanation if refused or blocked, a revoked-permission warning, options dimmed when blocked | Approved |
| 14 | Storage "148 MB" (sample) | The browser's real figure and a Manage downloads link | Real data |
| 15 | Export: a plain description | Adds "It includes your saved places." | Added (honesty) |
| 16 | Reset: a message only | A toast with Undo; the description lists what is kept | Approved |
| 17 | Clear all: "Delete everything on this device?" with a solid red button | The confirmation lists what is removed and what stays (downloaded audio, with a link); a solid red button; Cancel is focused; Escape cancels | Approved |
| 18 | A large page title "Settings" and a subtitle on the page | The title is in the header; each section has its own heading; the subtitle "Changes save automatically on this device." is kept | Shell decision (Phase 1) |
| 19 | Mobile picker: a field that opens a list | The shared bottom sheet with icons and 46px rows | Intentional |
| 20 | Mini player bar at the bottom | Hidden until something plays (Phase 4) | Intentional for now |
| 21 | A switch is the tap target | The whole row is the tap target (56px) | Intentional (44px minimum) |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** all eight sections at 1280 light; at 1280 light the states Notifications on, blocked, refused, Ja'fari, no location, offline, update failed, Clear all confirmation, Reset with Undo, Reading fallback and Export done; on mobile Prayer (dark), Notifications (light), Clear all confirmation (dark) and the section picker. **Generated but not examined one by one:** the 1280 dark pairs, the other 375 pairs, the Hijri and Wi-Fi state shots.
