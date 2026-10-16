# Phase 2: Settings

- Branch: `revamp-design-logic`
- Date: 2026-10-16
- Status: Done, awaiting review
- Plan and decisions: `phase-02-settings-plan.md`

## Goal

The real Settings page (`/settings`) with the prototype's eight sections, every control on the legacy storage key and format where one exists, and the notification, Export, Reset and Clear all behaviour behind it.

## Scope

- Pages and components built: `app/pages/settings.vue`; `app/components/settings/` (`SettingsGroup`, `SettingsRow`, `SettingsSegmentedControl`, `SettingsStatus`, and one section component each for Appearance, Reading, Audio, Prayer & location, Notifications, Accessibility, Modules, Data & privacy).
- Prototype sections used: `d-page-settings` and `m-page-settings` (`settingsPanel`, `renderSettings`).
- Legacy code reused: `@legacy/assets/data/reciters.json`, `@legacy/data/wajibat/marja` (the marja' list), `@legacy/assets/data/surah.json` (the Reading preview, lazy).

## Approved decisions (from the plan review)

1. **Clear all** = strict legacy parity (`localStorage.clear()` then a reload) **plus deleting `quran-revamp-db` only**. The confirmation lists what is removed and what stays; downloaded audio stays, with a link to Downloads.
2. **Marja' picker** under Prayer & location, only for Ja'fari, labelled as the Daily Fiqh marja' and separate from the calculation method.
3. **Default translation** "Not set (choose per ayah)" removes the key. `preferredVerseDisplay` is read only, as the default when `translationDefaultLang` is unset; no control, never written.
4. **Defaults** stay ISNA and Leva.
5. **Wi-Fi-only** row greyed with an explanation where the connection type is not reported.
6. **Reset** = settings only (keeps data, saved location and marja'), with Undo.
7. **Late reminders** up to 5 minutes on resume; older ones skipped.
8. **Inline messages, no `alert()`.** One fixed sentence: reminders only appear while the app is open. iPhone: checked against a current source before claiming anything.
9. The scheduler uses the location's time zone from the monthly cache; no silent Lahore fallback anywhere in Settings (a Set location prompt instead).

## What was built

### Controls and keys
Every control reads `usePreferencesStore().prefs` and writes with `store.set`; the page keeps no copy (so another tab, Reset and Undo all show up at once).

| Setting | Key | Format |
| --- | --- | --- |
| Theme, fiqh, default translation, default tafsir | `themeMode`, `prayerFiqh`, `translationDefaultLang`, `tafsirDefaultAuthor` | raw strings (as the legacy app); the translation and tafsir keys are removed when set to "Not set" |
| Arabic size, reduce motion, high contrast, larger touch targets | `quran:accessibility:v1` | JSON object, merged (unknown fields kept) |
| Reciter | `reciter` | JSON `{ reciter: <name> }` (as the legacy Settings writes it) |
| Playback speed, auto-play | `quran:audio-prefs:v1` | JSON object, merged (`repeatOne` kept) |
| Literary modules | `quran:additional-modules-enabled:v1` | JSON boolean |
| Prayer notifications, prayers, reminder time | `prayerSettings` | the legacy shape `{ notificationsEnabled, enabledPrayers, reminderOffset }`, merged |
| Daily Fiqh marja' | `quran:fiqh-prefs:v1` | the legacy shape; `lang` kept |
| Calculation method (per fiqh) and Asr school | `quran:prayer-calc:v1` | **new** `{ sunniMethod, jafariMethod, asr }` |
| Wi-Fi-only downloads | `quran:download-prefs:v1` | **new** `{ wifiOnly }` |
| Verse layout | `quran:verse-layout:v1` | **new** `{ order: "ar" \| "tr" }` |
| Hijri adjustment | `quran:hijri-adjust:v1` | new (approved in Phase 0) `{ days }` |

Read only: `preferredVerseDisplay`, `last_location`, `quran:location:v1` (written only by "Use my location").

### Prayer and location
- **Calculation methods** are the real AlAdhan methods with the service's exact names; a test compares every id and name with a recorded `GET /v1/methods` response. Sunni: ISNA (2), Muslim World League (3), Umm Al-Qura University, Makkah (4), University of Islamic Sciences, Karachi (1), Egyptian General Authority of Survey (5). Ja'fari: Leva Institute, Qum (0) and Institute of Geophysics, University of Tehran (7).
- **What a request contains:** Sunni sends the chosen method and `school` 0 or 1 (Hanafi); Ja'fari always sends `school=0` and `midnightMode=1`, so a hidden Asr setting can never change its cache key.
- **Switching fiqh** (or method or Asr): the record for the new combination is already cached, so it shows at once; otherwise the old tradition's times are not shown, the text says "Loading Ja'fari times…", and on failure "Saved times for Ja'fari: none yet. They need a connection once." The choice is kept; switching back restores the saved times. A small plugin (`prayer-watch.client.ts`) reloads the right month when the fiqh, method, school or place **changes** (not on the first read of the place, so opening an unrelated page never makes a request).
- **Hijri adjustment** shows a live line from the cached days: "Today: 4 Jumādá al-ūlá 1448. With your adjustment: 5 ...". The adjusted date is the neighbouring cached day's own Hijri date, so month lengths are never guessed; no preview when that day is not cached.
- **Location:** "Set location" or "Use my location" asks the device only on the tap; saved in the new key; a refusal gives an inline message. **Saved prayer times** shows the months saved, the last-updated time and **Update now** (fetch first, swap only on success; offline: disabled with a note; failure: "Couldn't update (HTTP 500). The saved times are still in use.").

### Notifications
- Turning the switch on asks permission in that tap; refused, it goes back to off with an inline explanation. The current permission state is shown and refreshed on focus and where the browser announces changes.
- Chips for the five prayers, reminder time (at prayer time, 5, 10, 15, 30 minutes before), and **Send test** (enabled only with permission).
- **Scheduler** (`usePrayerNotifications`, mounted in the layout, so any page): pure logic in `lib/notifySchedule.ts`. Reminders come from the cached month in the **location's time zone**, using **tomorrow's real times**; the next one is a single timer, recalculated at each firing, on setting changes and when the tab becomes visible. A reminder up to 5 minutes late is shown on return; older ones are skipped; each is shown once (and the notification `tag` stops other open tabs from duplicating it). It never asks for permission or location by itself.
- **The limit, stated once on the page:** "Reminders only appear while Quran App is open." Nothing claims delivery while the app is closed.
- **iPhone:** the WebKit post ["Web Push for Web Apps on iOS and iPadOS"](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) says notifications work for web apps added to the Home Screen from iOS and iPadOS 16.4. The page shows one line saying so, **only** on an iPhone or iPad where the browser has no Notification API at all.

### Data & privacy
- **Export:** a flat JSON object of every localStorage key (parsed when JSON, raw otherwise), named with the **local** date; the row says it includes saved places. IndexedDB and Cache Storage are not included.
- **Reset settings:** restores the defaults for the settings listed above, keeps other fields of shared objects, and keeps all data, the saved place and the marja'; a toast with **Undo** restores every value byte for byte.
- **Clear all local data:** an inline confirmation ("This removes: ... This stays: downloaded audio and cached Qur'an text ... Manage downloads"), focus on Cancel, Escape cancels. Confirmed: `localStorage.clear()`, the `quran-revamp-db` database is deleted, the page reloads. Tests prove nothing else is touched: no `caches.delete`, no service worker call, and the legacy `quran-app-db` keeps its data and version 1.
- Storage use is the browser's real figure; "Manage downloads" links to `/downloads`.

## Decisions and why (working decisions)

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Own radio-group segmented control | shadcn-vue `ToggleGroup` | Its items are `aria-pressed` buttons, not radios; a "choose one" control should be a radio group (one tab stop, arrows select). Found when the first tests looked for radios |
| Unchecked switch: `ink-2` outline and thumb on a `sunken` track | shadcn default (`input` colour) | The default was nearly invisible on the surface (seen in the screenshots); the outline gives at least 3:1 |
| A switch row is a `<label>` (56px tap target) | Only the small switch | 44px minimum on mobile |
| Solid danger button for "Yes, delete everything" | shadcn tinted variant | An irreversible action should not look faint |
| Reading preview: today's stored ayah, else a real surah name from the legacy data, labelled | A sample ayah typed in | No Qur'an text is typed into the app |
| Settings dims the notification options when permission is blocked | Leave them live | They would look active but cannot work |
| `forbidRealApis` in every browser test | Trust each test | It caught a real leak (the settings watcher) and two tests needing mocks |

## Files

- Added: `app/pages/settings.vue`, `app/components/settings/*`, `app/lib/{calcMethods,notifySchedule,notifyBrowser,hijri,settingsData}.ts`, `app/composables/usePrayerNotifications.ts`, `app/plugins/prayer-watch.client.ts`, `tests/settingsLogic.test.ts`, `tests/fixtures/aladhan-methods.json`, `e2e/settings.spec.ts`, `docs/design/settings-compare/`.
- Changed: `lib/preferences.ts` (five new fields and the key map; `effectiveTranslationLang`), `lib/storage.ts` (`listKeys`, `clearAllKeys`), `db/revampDb.ts` (`closeRevampDb`, `deleteDatabase`, release on another tab's delete), `usePrayerTimes` (settings-driven parameters, `nextRecord` exposed), `stores/preferences.ts` (`reloadAll`), the default layout (scheduler), Home's ayah (effective translation), `ui/switch`, `ui/slider` (named thumb, bigger touch target), `e2e/mocks.ts` (`forbidRealApis`).
- Changes outside `revamp-quran/`: **none**.

## Data and storage

- Written in the legacy format: `themeMode`, `prayerFiqh`, `translationDefaultLang`, `tafsirDefaultAuthor`, `reciter`, `quran:accessibility:v1`, `quran:audio-prefs:v1`, `quran:additional-modules-enabled:v1`, `prayerSettings`, `quran:fiqh-prefs:v1`.
- Written, new and additive: `quran:prayer-calc:v1`, `quran:download-prefs:v1`, `quran:verse-layout:v1`, `quran:hijri-adjust:v1`, `quran:location:v1`.
- Never written: `preferredVerseDisplay`, `last_location`, any `prayer_*` key, anything in `quran-app-db`.
- Migrations: none. A rollback to the legacy app ignores the new keys; it keeps using method 2 or 0 and the standard school.

## Offline

Level A (every control is local). Update now is disabled offline with a note; a fiqh or method never saved needs a connection once; "Use my location" may work offline on a phone and says so when it fails; permission, the test notification and reminders work offline.

## Verification

- [x] `npm run verify` on Node 22.23.3: build, lint clean, **217 unit tests**, dev-server smoke test, **126 browser checks**; the browser suite was then run twice more (126 of 126 passed in both; those two extra runs happened to run under the machine's Node 20 instead of 22 (a path mistake in my command), against the same production build, so they are weaker evidence than the Node 22 run).
- [x] Screenshots: 59 prototype-versus-revamp images in `docs/design/settings-compare/` (all eight sections, 1280 and 375, light and dark, plus 13 state shots at two sizes and the mobile section picker). **Looked at individually:** all eight sections at 1280 light, and at 1280 light the 11 state shots Notifications on, blocked, refused, Ja'fari, no location, offline, update failed, Clear all confirmation, Reset with Undo, Reading fallback and Export done; mobile: Prayer (dark), Notifications (light), Clear all confirmation (dark) and the section picker. **Only generated, not examined one by one:** the 1280 dark pairs, the other 375 pairs, the Hijri and Wi-Fi state shots.
- [x] Browser checks: every section writes the exact legacy key and format and reads back legacy-written values; cross-tab sync for theme, fiqh, calculation method and accessibility, and a legacy write in another tab; fiqh switch cached, uncached and failing; Update now success, failure and offline; notification grant, refusal, blocked, revoked, the test button, a reminder firing under a fake clock once, the late rules, and none when off; Export content and file name; Reset and Undo; Clear all (confirmation text, Cancel and Escape, then localStorage emptied, `quran-revamp-db` gone, `quran-app-db` at version 1 with its data, Cache Storage intact); 375px touch targets in every section and no horizontal scroll; keyboard (switches, radio groups, slider, tab order with visible focus); offline.
- [ ] Screen-reader pass (not done).
- [ ] Real-device notification check (permission prompt, test notification, a reminder on a phone): yours, on the Vercel preview.

## Differences from the prototype

See `docs/design/settings-compare/README.md`.

## Content placeholders replaced

See `docs/CONTENT_TO_VERIFY.md` (Settings items).

## Open issues and risks

1. **Notifications while closed are not possible** without a backend (stated on the page). Reminders in a paused tab can be late; a missed one older than 5 minutes is skipped.
2. **Asr (Hanafi) explanation text** ("when a shadow is twice the object's length") comes from the prototype and has not been checked against a source; listed in CONTENT_TO_VERIFY.md.
3. **Real-device checks** (notifications, GPS, Wi-Fi detection on Chrome for Android) are not done.
4. The calculation-method choice is not visible to the legacy app (after a rollback it shows ISNA or Leva).
5. Reading: the Surah reader (Phase 4) will use `verseLayout` and the effective default translation; until then only the preview and Home use them.
6. Wi-Fi-only is stored now and enforced by the Downloads manager (Phase 11), and only where the browser reports the connection type.
7. A second build warning from Nitro about `cache-driver.mjs` persists (harmless, from the unused server part).

## Next phase needs

Phase 3 (Surah listing, Juz, Page): the reciter preference (read through `prefs.reciter`) and the Arabic size are ready. Phase 4 consumes `verseLayout`, the effective translation and tafsir defaults, and replaces the plain share. Phase 5 adds manual city entry and the Prayer page (Update now there reuses `usePrayerTimes().refresh()`).
