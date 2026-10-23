# Downloads: prototype and revamp side by side (Phase 11)

Made by `scripts/screenshots/phase-11-downloads.mjs` against the production build. The revamp's text and audio answers are **synthetic** (right counts, exact byte sizes, obviously fake content): this page shows names, counts and sizes, never verses. The prototype shows its own sample content (`CONTENT_TO_VERIFY.md`), so pairs compare layout and behaviour, not figures.

| Image | What |
| --- | --- |
| `pair-saved-{desktop,mobile}-{light,dark}.jpg` | the page with saved surahs, prototype left, revamp right (1280 and 375 px) |
| `pair-add-{desktop,mobile}-{light,dark}.jpg` | the Add surahs sheet |
| `empty-desktop-light.jpg`, `empty-mobile-dark.jpg` | first run |
| `state-waiting-wifi-m390.jpg`, `state-offline-m390-dark.jpg`, `state-failed-m390.jpg`, `state-space-m390.jpg` | the queue's four waiting and failing states |
| `state-notsaved-older-m390.jpg` | "Not saved" parts and audio saved by the older app |
| `state-iphone-note-m390.jpg` | the Home Screen note |
| `surah-audios-{desktop-light,mobile-dark}.jpg` | `/surah-audios/36` with one reciter saved (no prototype exists) |
| `player-save-m390.jpg`, `player-saved-m390.jpg` | the player sheet's Save audio, before and after |

**Looked at one by one** (and what I changed after looking): the desktop and mobile saved-list pairs, the mobile Add sheet, the Not saved state, the Wi-Fi state, the `/surah-audios` mobile page and the player sheet. Found and fixed: the saved surahs were invisible on the thread when short (a minimum width now); the Arabic name on `/surah-audios` floated in the middle (now beside the title); the Not saved screenshot did not show the row. **Not looked at individually:** the other dark and light variants of the pairs, the offline, failed and space states, and the iPhone note beyond a glance.

## Intentional differences from the prototype

| Prototype | Revamp | Why |
| --- | --- | --- |
| "Juz 'Amma" quick pick | "Juz 30" | Juz names are a recorded content gap (`DECISIONS.md`); the five surah picks use the data's names (Al-Waaqia, Ar-Rahmaan) |
| Tafsir and Audio both on by default | **Tafsir off** every time the sheet opens, Audio on | Decision 2026-10-23: tafsir is opt-in |
| "Reciter for downloads" select | "Reciter: X · Change in Settings" | One reciter concept (decision 3) |
| Wi-Fi only on by default | Off by default, greyed with the reason where the browser does not report the connection type | The shipped Settings default and rule |
| Sample saved surahs, sizes, "free space" (2,048 MB), progress | Real: measured file sizes, `navigator.storage.estimate()`, real progress | `CONTENT_TO_VERIFY.md` |
| Meter segment "App and browsing cache" | "Everything else the app keeps" (usage minus saved) | It is not only a cache |
| Parts chips hidden on phones | Shown on phones, wrapping under the name, 44 px | Touch targets; no feature hidden on a phone |
| No "whole Qur'an text" | One button, one job | Decision 2026-10-23 |
| No Clear cache | "Browsing cache: Clear" in Preferences | The legacy page had it (decision 6) |
| Offline preview button | Real offline state; queued work waits | Prototype-only control |
| Remove per surah | Same, with Undo; Not saved parts with one-tap repair; audio saved by the older app shown as such | Plan sections 4 and 5 |
| "Downloads keep going while you use the rest of the app" | "Keep the app open until a download finishes." | A phone can pause a page; say only what is true |
