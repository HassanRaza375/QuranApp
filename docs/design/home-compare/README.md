# Home next to the prototype Home (Phase 1)

`<device>-<theme>-<state>.png` puts the prototype (left) next to the revamp (right). `-prototype.png` and `-revamp.png` are the two halves. Eight pairs: desktop and mobile, light and dark, Returning and New user. The prototype is driven through its own buttons; the revamp is the production build at 1280x800 and 375x812, in the Karachi time zone with the clock fixed at 15 Oct 2026, 09:14, the real recorded AlAdhan month for Lahore, and the real ayah service. Returning is seeded with legacy-format values.

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | Ayah in a smaller stand-in font (24px), translation with a gold left bar, "sample text for layout only" | The legacy Qur'an font at the design size (32px desktop, 25px mobile) with the Arabic size setting; no gold bar (gold is for verse markers only); real text from the service | Intentional |
| 2 | Labels in `ink-3` | `ink-2` (contrast) | Intentional |
| 3 | Resume row 2: "Continue the story of Yusuf (AS)", chapter and title | "You were reading: <section>" and the person's name (the Prophets & People study state; Phase 7 moves it to chapters) | Approved |
| 4 | Row icons are Arabic words | Lucide icons (Arabic words from the prototype are not copied) | Intentional |
| 5 | Hifz tile "14 to practice" | "Open Hifz" (no number; the count comes with Phase 14) | Approved |
| 6 | Today's goal "0 / 494 ayahs" (adjusted target) | "3 / 20 ayahs" (the goal's own daily target; no pace or streak) | Intentional |
| 7 | Prayer chips fixed sample times; Maghrib highlighted | Real times for the place and fiqh; the next prayer highlighted, none after Isha | Real data |
| 8 | No method or last-updated line | "Times follow: <method>" and "Last updated ..." under the chips | Added (data-layer honesty) |
| 9 | Sidebar fully expanded, merged rows, no icons | Collapsible groups (Read open), one row per destination, icons, "Continue reading" only with progress | Approved |
| 10 | Header: title, search field, moon and gear icons (mobile: search icon) | Title, search field linking to `/search`, theme menu, gear (mobile: search icon, theme, gear, each 44px) | Matches, plus the theme menu |
| 11 | Mini player bar at the bottom | Hidden until something plays (Phase 4) | Intentional for now |
| 12 | Share and Save icons are small glyphs | 16px Lucide icons in 44px targets on mobile; Save is a toggle with an Undo toast | Intentional |
| 13 | Reference "Ar-Rūm 30:7" | The reference from the service data, a link to the ayah in the reader | Real data |

Looked at closely: desktop light returning, mobile dark new, mobile light returning. The other five pairs were generated and not examined one by one.
