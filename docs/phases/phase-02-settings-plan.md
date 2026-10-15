# Phase 2: Settings (plan, awaiting approval)

- Branch: `revamp-design-logic`
- Prototype: `d-page-settings` and `m-page-settings` (`settingsPanel`, `renderSettings`, `SET_TABS`). Eight sections: Appearance, Reading, Audio, Prayer & location, Notifications, Accessibility, Modules, Data & privacy. Desktop has a left section list; mobile has a section picker.
- Route: `/settings` (legacy route kept), `robots: noindex`, not prerendered. A section is chosen with `?section=<id>` (so links and the back button work); the default is Appearance.
- Offline level: **A**. Every control is local. Four actions need something outside the app, listed under "Offline".

No code is written until this plan is approved.

## 1. Every setting, its legacy key and format

"Legacy" means what the legacy app reads and writes today. Raw = a plain string, not JSON. The revamp reads and writes **the same key in the same format** wherever one exists. The store (`app/lib/preferences.ts`) already holds the first eleven.

| Prototype setting | Legacy key | Format and values | In the revamp store today |
| --- | --- | --- | --- |
| Theme (Light, Dark, System) | `themeMode` | raw `light` / `dark` / `system`; absent = legacy "system", revamp "light" | `theme` |
| Verse layout (Arabic first / Translation first) | **none** | | new, below |
| Default translation | `translationDefaultLang` | raw `english` / `urdu` / `bengali` / `arabic2`; absent = nothing chosen | `translationLang` |
| Default tafsir source | `tafsirDefaultAuthor` | raw `Ibn Kathir` / `Maarif Ul Quran` / `Tazkirul Quran`; the key is removed when cleared | `tafsirAuthor` |
| Arabic text size (0.8 to 1.6) | `quran:accessibility:v1` field `arabicFontScale` | JSON object, merged (unknown fields kept) | `arabicScale` |
| Preferred reciter | `reciter` | JSON object `{ reciter: <name> }` (the legacy Settings writes only the name; the player resolves the audio URL by name per surah). Five reciters in `assets/data/reciters.json` | `reciter` |
| Playback speed (0.75, 1, 1.25, 1.5, 2) | `quran:audio-prefs:v1` field `playbackRate` | JSON object, merged (`repeatOne` is kept) | `playbackRate` |
| Auto-play the next surah | `quran:audio-prefs:v1` field `autoAdvance` | boolean in the same object | `autoplay` |
| Fiqh school (Sunni, Ja'fari) | `prayerFiqh` | raw `sunni` / `jafari` (anything else reads as sunni). The prototype's internal `shia` is never stored | `fiqh` |
| Prayer notifications on/off | `prayerSettings` field `notificationsEnabled` | JSON `{ notificationsEnabled, enabledPrayers: {Fajr..Isha: bool}, reminderOffset: minutes }`, shared by all three notification settings below | **to add** |
| Notify me for (five prayers) | `prayerSettings` field `enabledPrayers` | as above | to add |
| Reminder time | `prayerSettings` field `reminderOffset` | integer minutes. Legacy offers 0, 5, 10; the prototype adds 15 and 30. The legacy scheduler accepts any number, so 15 and 30 work in the legacy app too | to add |
| Reduce motion | `quran:accessibility:v1` field `reducedMotion` | boolean | `reducedMotion` |
| High contrast | `quran:accessibility:v1` field `highContrast` | boolean | `highContrast` |
| Larger touch targets | `quran:accessibility:v1` field `largeTouchTargets` | boolean | `largeTouchTargets` |
| Show literary modules | `quran:additional-modules-enabled:v1` | JSON boolean | `literaryModules` |
| Location | `last_location` (legacy, `{lat, lng}`, written only by the legacy Qibla page) | read only | via `useLocation` (own key `quran:location:v1`, Phase 1) |
| Hijri date adjustment (-2 to +2) | **none** | | `hijriAdjust` in `quran:hijri-adjust:v1` (decided in Phase 0) |

### Prototype settings with no legacy key, and the new keys proposed

All new keys are additive, versioned JSON; the legacy app ignores them (so a rollback loses only these choices).

| Setting | New key | Value | Note |
| --- | --- | --- | --- |
| Calculation method and Asr school | `quran:prayer-calc:v1` | `{ sunniMethod: 2, jafariMethod: 0, asr: "standard" \| "hanafi" }` | Remembers the choice for each fiqh, so switching back restores it. The legacy app always uses method 2 (Sunni) or 0 (Ja'fari) and school 0, so after a rollback it shows those |
| Wi-Fi-only downloads | `quran:download-prefs:v1` | `{ wifiOnly: boolean }` | Phase 11 (Downloads) adds more fields |
| Hijri adjustment | `quran:hijri-adjust:v1` | `{ days: -2..2 }` | already decided; clamped |
| Verse layout | `quran:verse-layout:v1` | `{ order: "ar" \| "tr" }` | The Surah reader (Phase 4) consumes it; the Reading section's preview shows it now |

**Not given a control** (and why): `preferredVerseDisplay` (legacy: which single text the reader shows) has no counterpart in the prototype, where Arabic is always shown and a translation is added; it stays untouched and unused (see Open question 3). `quran:audio-prefs:v1.repeatOne` and `quran:accessibility:v1` unknown fields are preserved.

### Details that need care
- **Calculation methods** are real AlAdhan methods, checked against `GET /v1/methods`: Sunni side ISNA (id 2), Muslim World League (3), Umm Al-Qura University, Makkah (4), University of Islamic Sciences, Karachi (1), Egyptian General Authority of Survey (5); Ja'fari side Shia Ithna-Ashari, Leva Institute, Qum (0) and Institute of Geophysics, University of Tehran (7). The prototype's shortened labels are replaced by the service's exact names (CONTENT_TO_VERIFY.md item). Defaults stay the legacy ones: ISNA and Leva.
- **Asr school** applies to Sunni methods only; the row is hidden for Ja'fari (as in the prototype). The Hanafi choice is kept while Ja'fari is selected. Ja'fari always sends `school=0` and `midnightMode=1`, so the cache key never depends on a hidden setting.
- **Hijri adjustment** shifts the displayed Hijri date by whole days and never changes the prayer cache key. Because no page in the revamp shows a Hijri date until Phase 5 and 8, the row shows a live line from the cached month, "Today: 4 Jumada al-Awwal 1448 (with your adjustment: 5 Jumada al-Awwal)". The adjusted date is read from the neighbouring day of the cached month (so month lengths of 29 or 30 days need no guessing); at a month edge it uses the next or previous cached month, and shows no preview if that month is not cached.
- **Default translation "Off"** in the prototype has no legacy value (unset means "choose per ayah"). See Open question 3.
- **Wi-Fi only** can only be enforced where the browser reports the connection type (`navigator.connection.type`, Chrome on Android). Other browsers cannot tell Wi-Fi from mobile data, so the app cannot honour the setting there. The row says so; the setting is stored now and enforced by the Downloads manager in Phase 11 (Open question 5).

## 2. How the legacy Settings page behaves today

Read from `app/pages/settings.vue` and `stores/prayer.js`.

- **Layout:** one scrolling page of cards (theme, fiqh and location, notifications, reading, audio, accessibility, modules, data), not eight sections.
- **Export** (`exportData`): dumps **every localStorage key of the origin** into one JSON file, each value parsed as JSON when it parses and kept as a raw string otherwise, named `quran-app-data-<date>.json`. The date comes from `toISOString()`, so it is the UTC date (wrong by a day for part of the day in some zones). It does **not** include IndexedDB (`quran-app-db`), Cache Storage (downloaded audio, text, the app shell) or cookies. There is no import.
- **Clear all** (`clearAllData`): `localStorage.clear()` and then `location.reload()`, after a confirmation dialog. It removes every localStorage key. It does **not** touch IndexedDB (`quran-app-db`: cached chapters and tafsir), Cache Storage (including downloaded audio), the `theme-resolved` cookie, or the service worker. A side effect: the downloads list (`quran:downloads:v1`) is wiped while the audio files stay in Cache Storage, so they take space and are no longer listed.
- **Reset settings:** the legacy page has none; it is new in the prototype.
- **Fiqh** switches `prayerFiqh` and refetches today's times at once. **Location** falls back **silently to Lahore** when the device location is unavailable, and says so in small text.
- **Marja' for Daily Fiqh:** the legacy Settings page also holds the marja' picker (key `quran:fiqh-prefs:v1`), shown only for Ja'fari. The prototype's eight sections have no place for it (Open question 2).
- **Notifications:** see section 4.

### Proposed Export and Clear all in the revamp

- **Export:** the same content and format as the legacy export (a flat JSON object of every localStorage key, parsed when valid JSON, else raw) so a file from either app looks alike, named with the **local** date. It adds the revamp's new keys automatically (they are localStorage keys) including the saved place; the row says "includes your saved places". IndexedDB and Cache Storage are not exported (prayer times can be fetched again; audio is large).
- **Clear all local data:** **exactly the legacy behaviour**: `localStorage.clear()` then reload, after a confirmation that names what it does. A unit test spies and proves nothing else is called (no `indexedDB.deleteDatabase`, no `caches.delete`, no service worker call). The prototype's wording ("...and downloads") promises more than the legacy action does, so the confirmation text is written to match what actually happens: it lists the settings, bookmarks, notes, goals, progress and Hifz data it removes, and says "Downloaded audio and saved prayer times stay on this device; remove audio under Manage downloads".
- **Not extended without your approval** (Open question 1): the revamp now has one thing the legacy action would leave behind that you may not expect, the prayer-times cache in `quran-revamp-db`, whose keys contain rounded coordinates. Recommendation: also delete that one new database (not `quran-app-db`, not Cache Storage). Until you answer, Clear all stays at strict parity and the confirmation text tells the truth about it.
- **Reset settings** (new): sets every setting this page owns back to its default and **keeps** bookmarks, notes, progress, the saved location, the marja' and everything else. It does not use a blocking confirm: it shows a toast with **Undo** that restores the previous values. Which keys count as settings: `prayerFiqh`, `themeMode`, `translationDefaultLang`, `tafsirDefaultAuthor`, `reciter`, the setting fields of `quran:accessibility:v1` and `quran:audio-prefs:v1`, `prayerSettings`, `quran:additional-modules-enabled:v1`, and the new `quran:prayer-calc:v1`, `quran:download-prefs:v1`, `quran:hijri-adjust:v1`, `quran:verse-layout:v1`. `preferredVerseDisplay` is left alone. Unknown fields in shared objects are kept.
- Storage use ("Offline data and audio"): the real figure from `navigator.storage.estimate()` (usage over quota, covering IndexedDB and Cache Storage together; the prototype's "148 MB" is a sample), with "Manage downloads" linking to `/downloads`.

## 3. The fiqh switch and the monthly cache

Both traditions work with the Phase 1 monthly cache because the key already contains the method and school: `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>`. Sunni and Ja'fari months are separate records; nothing is overwritten by switching.

- **What invalidates (meaning: selects a different record):** fiqh, calculation method, Asr school (Sunni only), a saved place more than about 10 km away, and the month. **Does not:** the Hijri adjustment, notification settings, theme.
- **Today's gap, fixed in this phase:** `usePrayerTimes` loads once when Home mounts and does not watch settings. It will watch the location, fiqh, method and school, so Home and Settings stay correct without a reload.
- **What is shown while it refetches:**
  - The record for the **new** key is already cached (you switched back to a tradition used this month): its times show **immediately**, no refetch needed until stale. This is also what makes switching work offline in both directions after each has been used once.
  - Not cached: the old tradition's times are **not** shown (they would be wrong for the new setting). The Next prayer tile and the schedule show the loading state with the text "Loading Ja'fari times…" (or "Loading Sunni times…"), then the new times. The old month stays in the database untouched.
  - The fetch fails (offline, service down) and the new key is not cached: Home shows "Needs a connection once to load Ja'fari times" with Try again; the setting stays as chosen (we do not undo the user's choice); Settings shows "Saved times for Ja'fari: none yet". Switching back restores the saved Sunni times at once.
- Settings row "Saved prayer times": the months saved for the **current** settings, "Last updated ...", the "refreshes itself when fewer than 7 days are left" line, and **Update now** (here and on the Prayer page only; fetch first, swap only on success, the old times stay in use on failure, "Updating..." while it runs; disabled offline with a note).
- The fiqh row's helper text from the legacy page is kept: "Applied instantly and used everywhere prayer times appear."

## 4. Notifications: what a web app can and cannot do

**What the legacy app does today (verified in the code).** Prayer reminders are `setTimeout` timers created in the open page (`scheduleNotifications` in `stores/prayer.js`) from the cached day's times. When a timer fires the page calls `registration.showNotification` (or `new Notification`). There is **no** push handler, no background sync and no notification code in the service worker (`dist/sw.js` has none). So **the legacy app does not deliver notifications while the app is closed**; the legacy Settings page says so ("they won't arrive if the app or browser is fully closed"). The legacy layout starts the prayer store on every page (`layouts/default.vue` calls `prayer.init()`, which also asks the browser for the device location as soon as the app opens). They also depend on the browser not pausing the tab: background tabs are throttled and, on phones, often frozen, so "background tab" delivery is unreliable.

**What is possible in a PWA, honestly.**

| Capability | Possible here? |
| --- | --- |
| Ask permission (`Notification.requestPermission`) from a tap | Yes. Must be from a user gesture; the browser remembers the answer; a "denied" answer can only be undone in the browser's site settings. On iPhones, web notifications work only for a web app added to the Home Screen (iOS 16.4 and later; from general knowledge, not verified here) |
| Show a notification now, including a **test** button | Yes, through the service worker registration (as the legacy app does), when permission is granted |
| Reminders **while the app is open** (timers, recalculated from the cached times) | Yes; delayed or missed when the browser pauses a background tab |
| Reminders **while the app is closed** with no server | **No.** The Notification Triggers API (scheduled local notifications) was a Chrome origin trial that finished and has not launched ([Chrome documentation](https://developer.chrome.com/docs/web-platform/notification-triggers): "Origin trial: Complete; Launch: Not started"); no stable browser offers it. Periodic Background Sync exists only in Chromium for installed apps ([Chrome documentation](https://developer.chrome.com/docs/capabilities/periodic-background-sync)), runs at times the browser chooses and is not suitable for exact prayer times |
| Reminders while closed via **Web Push** | Only with a server: a push subscription per device, VAPID keys, and a scheduler that knows each user's place, method and time zone to send at the right minute. The app has no backend (README, "Known gaps"). Out of scope here; it would be its own project and would send each user's location to a server, which conflicts with "nothing is uploaded" |

**What Phase 2 builds.**
- Switch: turning it on asks permission in that tap. Granted: on. Not granted: the switch returns to off with a plain message under it ("Notifications are blocked for this site. Allow them in your browser's site settings, then try again"), not an `alert()` as in the legacy app. The current permission state is shown ("Allowed", "Blocked", "Not asked yet") and refreshed when the page regains focus (browsers differ in whether they announce permission changes).
- Per-prayer chips, reminder time (at prayer time, 5, 10, 15, 30 minutes before), and **Send test** (disabled until permission is granted).
- The reminder scheduler becomes a revamp composable mounted in the app shell (so it runs on any page, as the legacy one does, but without asking for the location on load), and is rebuilt on the monthly cache: prayer instants come from the **location's** time zone and **tomorrow's real times** (the legacy scheduler rolled today's time forward a day and used device-local `setHours`). It recalculates at each firing, when settings change, when the tab becomes visible, and at midnight.
- A reminder whose time passed while the tab was paused is shown once on return **only if it is less than 5 minutes late**; older ones are skipped, never shown stale (Open question 7). Each reminder is shown at most once (dedupe by prayer and date).
- The page states the limit in one fixed sentence in the Notifications section, next to the switch: "Reminders appear only while Quran App is open. If the app or browser is closed, or the tab has been paused by your phone, a reminder can be late or missing." No claim of closed-app delivery anywhere.
- The setting is stored in the legacy `prayerSettings` key and shape, so the legacy scheduler honours it too.

## 5. Keeping controls in sync with the store and with other tabs

- **One source of truth:** every control reads `usePreferencesStore().prefs.<field>` and writes with `store.set(field, value)`, which persists to the legacy key and applies the effect at once (theme class, accessibility flags, Arabic scale variable). The page holds no copy of its own (no `ref` that could drift).
- **Extending the store:** add descriptors for what is missing (`calcMethods`, `asr`, `wifiOnly`, `verseLayout`, and `notifications` as one object over `prayerSettings`), each with a default and a validator, plus the key map for cross-tab events. `tests/preferences.test.ts` already checks one descriptor per field and the key map.
- **Other tabs, same app:** the store listens to the `storage` event and reloads only the preferences whose key changed (already built); the Settings controls follow because they read the store. `usePrayerTimes` and the notification scheduler watch the store, so a change in one tab updates Home and the reminders in another.
- **The legacy app in another tab:** it writes the same keys, so its changes also arrive through the `storage` event; its values are validated on read (an invalid theme or fiqh falls back to the default; unknown fields in shared objects are kept).
- **Not synced by storage events:** the notification permission (a browser state): refreshed on focus and, where supported, through the Permissions API change event. The location is read when the page opens and on focus.
- **Validation on write:** values are clamped or checked before storing (Arabic scale 0.8 to 1.6, Hijri -2 to +2, speed from the offered list), so a bad value can never be written by the UI.

## 6. Legacy imports in the production build and in Vitest (confirmed after the Phase 1 bridge fix)

Checked on 2026-10-15 on Node 22.23.3:
- **Vitest:** a throwaway test imported four legacy modules that rely on the `~/` alias: `@legacy/data/quranPersons` (its own value import `~/utils/quranReference`), `@legacy/data/wajibat/marja`, `@legacy/utils/personStudy`, `@legacy/utils/personsSearch`. All resolved and returned the right values (for example `SECTION_LABELS["key-lessons"]` is "Key Lessons"; the person "nuh" is named "Nuh").
- **Production build:** the build succeeds and the browser suite (`e2e/home.spec.ts`, "returning user") renders "You were reading: Key Lessons" and "Nuh", which can only come from `@legacy/data/quranPersons` loaded through the bridge in the built app.
- **Dev server:** the same Home state renders in `nuxt dev` with no console error.
- Settings needs `@legacy/assets/data/reciters.json` and `@legacy/data/wajibat/marja` (the marja' list, 3 KB). Both are plain files with no `~/` import. The one limit stays documented: a legacy file with a *dynamic* `~/` import (for example `quranAyahCounts.js`) is not rewritten under Vitest, so it is not called from revamp code or tests.
- Guard added in this phase: the throwaway test becomes a permanent test (`tests/bridge.test.ts`), and `npm run verify` already builds and runs the browser suite against the built output.

## 7. Layout and components

- **Desktop (768px and up):** the section list on the left (`Tabs`-style vertical list with icons, current section marked), the panel on the right, max width about 720px. **Mobile:** a section picker (the shared `ResponsiveMenu`, a bottom sheet with 46px rows) above the panel. The section is in the URL query.
- **Groups:** a bordered container with rows and separators (design system "set-group, set-row"); labels and descriptions in `ink` and `ink-2`.
- **Controls:** shadcn-vue `Switch` (with an accessible name), `ToggleGroup` (single) for segmented choices (theme, fiqh, speed, Asr, Hijri, reminder presets are `ResponsiveMenu`), `Slider` for Arabic size with a numeric value, `Badge`-style toggle buttons (`aria-pressed`) for the five prayers, `ResponsiveMenu` for translation, tafsir, reciter, calculation method, reminder time and the mobile section picker. Status messages use `role="status"`.
- **Reading preview:** shows the current translation and the verse layout order with the Arabic at the chosen size; its text is a clearly marked sample sentence supplied by the app, not Qur'an text, **unless** the Qur'an ayah of the day is already cached, in which case that ayah (real text from the service) is used. Nothing from the prototype's preview ayah is copied.
- Files (all inside `revamp-quran/`): `app/pages/settings.vue`; `components/settings/` (`SettingsNav`, `SettingsGroup`, `SettingsRow`, one component per section); `lib/preferences.ts` (new descriptors); `lib/notifySchedule.ts` (pure scheduling); `lib/exportData.ts` and `lib/clearData.ts` (pure, spy-tested); `lib/hijri.ts`; `lib/calcMethods.ts` (method list with ids); composables `usePrayerNotifications`, `useStorageEstimate`; edits to `usePrayerTimes` (watch settings) and the default layout (scheduler).
- No change outside `revamp-quran/`.

## 8. Offline

Level A. The page, every control, the reciter and method lists, Export and Clear all work with no connection.

| Part | Offline behaviour |
| --- | --- |
| Saved prayer times, **Update now** | Shows the saved months and "Last updated ..."; Update now is disabled with "You're offline. The saved times stay in use." |
| Switching fiqh or method to one never saved | The new key has no cache: Home and Settings say "Needs a connection once to load Ja'fari times"; the choice is kept; switching back restores the saved times |
| **Use my location** | Device GPS may work offline on a phone; if it fails the message says so. Saving does not need a connection |
| Notification permission, test notification, reminders | Work offline (local) once permission is granted |
| Storage estimate | Local |

## 9. Verification plan

- **Unit:** every new descriptor (valid, invalid, clamped, unknown fields kept, key map); `notifySchedule` (instants in the location's zone, offsets, tomorrow's real times, dedupe, the 5-minute rule, month end); Export (every key, raw and JSON, local date in the file name, never throws on blocked storage); **Clear all calls only `localStorage.clear()`** (spies on `indexedDB.deleteDatabase`, `caches.delete`, service worker unregister); Reset with Undo (snapshot and restore, unknown fields kept); calculation methods match the service's ids and names (a fixture of `/v1/methods`); Hijri preview from cached days incl. month edges; Wi-Fi capability detection.
- **Browser (mocked network, fixed clock, as in Phase 1):** each control writes the exact legacy key and format and reads back values seeded by the legacy app; invalid legacy values fall back safely; **cross-tab**: change in tab A appears in tab B for every setting; fiqh switch with a cached and an uncached target, offline switch, failure; Update now success, failure keeps the old times; notification flows (grant, deny, test button, a reminder firing under a fake clock, tab-hidden and late rules, dedupe) using stubbed `Notification` and `showNotification`; Export download content; Clear all (confirm, `localStorage` empty, IndexedDB and caches untouched); Reset and Undo; mobile section picker and `?section=`; keyboard (every control reachable, switch toggles with Space, slider with arrows); labels; 44px targets at 375px; one `h1`; no console errors; only expected hosts.
- **Screenshots (next section).**
- `npm run verify` on Node 22, then the same ten-run stability check is **not** repeated (it was done in Phase 0); a single full run plus two extra runs of the browser suite.

### Screenshots plan (eight sections, 1280 and 375, light and dark)

For each of the 8 sections: prototype and revamp side by side at **1280px light, 1280px dark, 375px light, 375px dark** = 32 pairs, produced by one script (the prototype driven through its own tab buttons and, on mobile, the section picker; the revamp through `?section=<id>`, seeded storage, mocked AlAdhan, fixed clock). Extra state shots at 1280 light and 375 dark: Notifications on and off; permission blocked; Prayer & location with Ja'fari selected (Asr row hidden) and with the saved-times row updating, offline and failed; the Clear all confirmation; Export done; Reset with its Undo toast; the mobile section picker open. Saved in `docs/design/settings-compare/` with a README listing every difference and whether it is intentional. I will look at all eight desktop-light pairs and every state shot individually, and say which of the rest I only generated.

## Open questions

1. **Clear all scope.** Strict parity (only localStorage and a reload), or also delete the revamp's own `quran-revamp-db` (re-fetchable prayer times whose keys hold rounded coordinates)? I recommend deleting that one database too, and nothing else. Until you answer: strict parity.
2. **Marja' for Daily Fiqh.** The legacy Settings page has this picker (Ja'fari only, `quran:fiqh-prefs:v1`); the prototype's eight sections do not. Dropping it would remove a way to choose a marja' until Phase 13. Proposal: show it under Prayer & location, only when Ja'fari is selected, using the legacy key and the legacy marja' list. OK?
3. **Reading section differences from legacy.** (a) The prototype's "Default translation: Off" has no legacy value; propose "Not set (choose per ayah)" which removes the key (legacy meaning); Home's ayah still shows English until you choose. (b) Legacy `preferredVerseDisplay` has no control and no prototype counterpart; propose leaving it untouched and unused, **or** treating a value of english, urdu or bengali as the default translation when `translationDefaultLang` is not set (read only, never writing the legacy key), so people who used the legacy reader's text tabs keep their language. Which?
4. **Calculation method defaults** stay ISNA (Sunni) and Leva (Ja'fari), as in the legacy app, even though many users in South Asia prefer the Karachi method. Keep the defaults and only change by choice?
5. **Wi-Fi-only downloads:** show the row everywhere with the "only where your browser reports the connection type" note, or show it only where `navigator.connection.type` exists?
6. **Reset settings** scope as listed (settings only; keeps data, the saved place and the marja'), with Undo instead of a confirm. OK?
7. **Late reminders:** show a reminder up to 5 minutes late when the tab resumes, skip older ones. OK, or never show late?
8. **Reminder wording** changes from the legacy page (inline messages instead of `alert()`, one fixed limitation sentence). OK?

## Risks

- Notifications are the most browser-dependent part; the Playwright tests stub the APIs, so a **real device check** (permission prompt, the test notification, a reminder on a phone) is yours on the Vercel preview, as for Phase 1.
- Timer-based reminders cannot be made reliable in a paused tab; the page says so rather than promising.
- Two apps (legacy and revamp) sharing `prayerSettings`, `prayerFiqh` and the others on one origin after cutover: formats are kept identical and tested against legacy-written values.
- The scheduler in the shell runs on every page; it must be cheap (one timer per upcoming prayer, none when notifications are off).

## Not part of Phase 2

The Prayer and Qibla pages (Phase 5), the Downloads manager and Wi-Fi enforcement (Phase 11), Daily Fiqh (Phase 13), real push notifications (needs a backend), the Surah reader's use of verse layout (Phase 4).
