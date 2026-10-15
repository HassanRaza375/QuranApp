# Page: Foundation check

- Route(s): `/foundation`
- Phase: 0 (removed at cutover)
- Prototype section: none
- Offline level: A
- Indexable: no (`robots: noindex`)

## Purpose

A single page that exercises the Phase 0 pieces so they can be seen and tested: preferences on the legacy keys, `ResponsiveMenu`, the Arabic scale, undo toast, tokens, and the `@legacy` bridge. It is not a product page.

## Layout

One column of sections: Preferences, Arabic and legacy data, Undo over confirm, Tokens.

## Components

`ResponsiveMenu`, shadcn-vue `Switch`, `Slider`, `Button`; the undo toast through `useUndoToast`.

## Data

| Data | Source | Storage |
| --- | --- | --- |
| fiqh, verse text, high contrast, reduce motion, Arabic scale | `usePreferencesStore` | `prayerFiqh`, `preferredVerseDisplay`, `quran:accessibility:v1` |
| first three surah names | `@legacy/assets/data/surah.json` | none |
| `FIQH_PARAMS`, `searchCommands` | `@legacy/utils/...` | none |

## States

Loading, error: none. Empty: defaults. Offline: works.

## Interactions

Each control writes at once and survives a reload; another tab's change appears here without a reload.

## Accessibility

Labelled switches and slider; menus work by keyboard.

## Known differences from the prototype

None (no prototype page).

## Tests

`e2e/foundation.spec.ts`.
