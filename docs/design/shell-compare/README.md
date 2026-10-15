# Shell next to the prototype shell (Phase 0 follow-up)

`<name>.png` puts the prototype (left) next to the revamp (right). `<name>-prototype.png` and `<name>-revamp.png` are the two halves. Prototype: `docs/design/prototype.html`, Home page, driven through its own Desktop/Mobile and Light/Dark buttons (desktop frame, mobile frame, mobile drawer via `toggleDrawer()`). Revamp: production build, 1280x800 and 375x812, theme from the legacy `themeMode` key. Pairs: desktop light and dark, mobile light and dark, mobile drawer light and dark.

The page body is not compared (the revamp Home is a placeholder until Phase 1). Only the shell: header, sidebar or drawer, player area.

## Differences

| # | Prototype | Revamp | Kind | Where it gets resolved |
| --- | --- | --- | --- | --- |
| 1 | Active nav item: flat highlight with a left bar (gold-looking) | Rounded `accent-soft` highlight with a 2px **accent** bar | Intentional (DESIGN_SYSTEM.md: gold is only for verse markers) | n/a |
| 2 | Group labels in `ink-3`, light weight | `ink-2`, semibold, uppercase, letter-spaced | Intentional (contrast: `ink-3` fails AA for text) | n/a |
| 3 | No icons in the nav | A Lucide icon on every nav row | **Mine, not in the design.** Decide: keep or remove | Your call now; cheap to remove |
| 4 | Header (desktop): page title (crumb), a search field, moon and gear icons | Header shows only the theme menu; no crumb, no search, no gear | **Gap** | The crumb arrives with each page (Phases 1 to 15); the search field with Search (Phase 10); Settings stays in the sidebar footer unless you want the gear |
| 5 | Header (mobile): page title and a search icon | Brand "Quran App" and the theme icon | **Gap**, same as 4 | Same |
| 6 | Nav rows: "Continue reading", "Downloads", "Peoples & Nations", merged rows "Places · Stories · Themes", "Duas · Events · Signs", "Commands & Prohibitions", "Prayer times · Qibla", "Ramadan & events" | One row per legacy route (no Downloads, no Continue reading; Peoples, Places, Stories, Themes, Duas, Events, Signs, Commands each separate; Prayer times, Qibla, Ramadan separate) | **Mismatch, needs a decision.** The prototype's merged rows look like shorthand, but the nav list is part of the design. My list is the legacy routes grouped by intent, so the sidebar is longer and scrolls | Decide the final nav (including Downloads and Continue reading) before Phase 1 ships the nav |
| 7 | Persistent mini player bar shown while "Reciting ..." | Hidden while nothing plays (placeholder store) | Intentional for now | Phase 4 |
| 8 | Mobile drawer: close icon (x) in the accent colour, drawer about 82% wide, rows without icons | Close icon in the foreground colour, drawer 288px (about 77%), rows with icons | Close colour: **minor gap**; width: close enough; icons: see 3 | Close colour with the nav decision |
| 9 | Brand "Quran App" in the sidebar at the top, and again in the mobile drawer | Same | Same | n/a |
| 10 | Colours (light and dark): `bg`, `surface`, `sunken`, borders, accent | Match the design tokens (checked by `tests/tokens.test.ts` and the e2e colour check) | Same | n/a |
| 11 | Type: serif brand (Newsreader), sans nav (Instrument Sans) | Same families, self-hosted | Same | n/a |

Not compared: screen-reader and keyboard behaviour (the prototype has none).

## Status after Phase 1

The images above are the Phase 0 shell. Rows 3 (icons, kept: approved as an intentional change), 4 and 5 (header: title, search link, theme menu and gear added), 6 (nav: one row per destination in the prototype's five groups, collapsible, plus "Continue reading" and Downloads) and 8 (drawer close icon now the accent colour) were resolved in Phase 1; see `docs/design/home-compare/`.
