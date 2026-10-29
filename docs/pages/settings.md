# Page: Settings

- Route(s): `/settings` (`?section=<id>`; the default is Appearance)
- Phase: 2
- Prototype section: `d-page-settings` / `m-page-settings` (seven sections since Phase 16; mobile uses a section picker)
- Offline level: A. Update now is the only control that needs a connection.
- Indexable: no (`robots: noindex, follow`)

## Purpose

Every preference in one place. Changes are saved at once on this device, in the same storage keys the legacy app uses, and take effect everywhere without a reload (and in other open tabs).

## Layout

- Desktop (768px and up): a section list on the left (icons, current section marked with the accent bar), the section on the right, up to about 720px wide.
- Mobile: a section picker (a bottom sheet with 46px rows) above the section.
- Each section: a `h2` with the section name, "Changes save automatically on this device.", then bordered groups of rows. A row has a label and description and one control (below the text on mobile). A switch row is one tap target across the whole row (56px).
- One `h1` ("Settings", visually hidden; the header shows the title).

## Added in Phase 5

- Prayer & location now uses the same **Location** and **Saved prayer times** rows as the Prayer page: Set location or Use my location, **Enter a city** (a place search plus a coordinates entry), and Update now. Data & privacy gained a **Place search** row (what is sent, and the Open-Meteo attribution).

## Sections

| Section | Controls |
| --- | --- |
| Appearance | Theme: Light, Dark, System |
| Reading | Preview; verse layout (Arabic first, Translation first); default translation (Not set, English, Urdu, Bengali, Arabic (Alt)); default tafsir (Not set, Ibn Kathir, Maarif Ul Quran, Tazkirul Quran); Arabic text size 0.8 to 1.6 |
| Audio | Preferred reciter; playback speed 0.75 to 2; auto-play the next surah; download on Wi-Fi only |
| Prayer & location | Fiqh (Sunni, Ja'fari); calculation method; Asr (Sunni only); Hijri adjustment -2 to +2 with a live preview; Daily Fiqh marja' (Ja'fari only); location; saved prayer times and Update now |
| Notifications | Prayer notifications switch and the permission state; the five prayers; reminder time; Send test |
| Accessibility | Reduce motion, high contrast, larger touch targets |
| Data & privacy | Storage use and Manage downloads; Export; Reset settings; Clear all local data |

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `SettingsSegmentedControl` | custom | A radio group: the chosen option is the one tab stop, arrows move the choice, Home and End jump |
| `SettingsRow`, `SettingsGroup`, `SettingsStatus` | custom | `role="status"` messages, never `alert()` |
| `ResponsiveMenu` | custom | Popover on desktop, bottom sheet on mobile |
| `Switch`, `Slider`, `Button` | shadcn-vue | Switch: unchecked has an `ink-2` outline; Slider: named thumb, 44px target on mobile |

## Data

| Data | Source | Key |
| --- | --- | --- |
| All preferences | `usePreferencesStore` | see `docs/phases/phase-02-settings.md` |
| Reciters, marja' list | `@legacy/assets/data/reciters.json`, `@legacy/data/wajibat/marja` | legacy data files |
| Saved prayer times, Update now | `usePrayerTimes` | IndexedDB `quran-revamp-db` |
| Place | `useLocation` | `quran:location:v1` (read: also legacy `last_location`) |
| Storage figure | `navigator.storage.estimate()` | none |

## States

- **Loading:** none needed (all local); the storage figure shows "Checking…".
- **First run:** defaults (light theme, Sunni, ISNA, nothing selected).
- **No place:** "Not set yet. Prayer times and Qibla direction need your location."; Set location; Update now disabled; no default city.
- **Permission:** Not asked yet, Allowed, Blocked, Not available in this browser; refused or blocked shows an inline explanation; a revoked permission with reminders on is reported.
- **Offline:** Update now disabled with a note; saved times keep showing; everything else works.
- **Errors:** location declined, update failed (old times kept), test notification could not be shown: each an inline message.
- **Fiqh variants:** Sunni shows 5 methods and the Asr row; Ja'fari shows 2 methods and the marja' row.
- **Dark mode and high contrast:** tokens only; text uses `ink` and `ink-2`.

## Interactions

Every control writes at once. Reset shows a toast with Undo. Clear all asks first (inline, Cancel focused, Escape cancels). Export downloads a file. Update now fetches and reports "Updated just now for <months>." or the reason it could not.

## Accessibility

One `h1`; every switch is named by its row label (`aria-labelledby`); radio groups named by their label; chips are toggle buttons with `aria-pressed`; the slider has a name, a value and a text value ("1.4 times"); messages are polite live regions; visible focus ring on everything (inside the segment for radio options); 44px targets at 375px (asserted); the permission state is text, not colour.

## Cross-links

Linked from the header gear and the sidebar. Links out to `/downloads` (Manage downloads), `/about`, `/sitemap`, and to Reading from Accessibility.

## Known differences from the prototype

See `docs/design/settings-compare/README.md`.

## Tests

`e2e/settings.spec.ts` (50 checks), `tests/settingsLogic.test.ts` (40), plus the preference tests.
