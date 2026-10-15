# Page: App shell (layout used by every page)

- Route(s): all (`app/layouts/default.vue`)
- Phase: 0
- Prototype section: shell (`.d-header`, `.d-sidebar`, `#drawer`, `.d-player` / `.m-player`)
- Offline level: A
- Indexable: n/a

## Purpose

The frame around every page: grouped navigation, a header with the theme menu, the mini player area, toasts. Pages only fill the main column.

## Layout

- Desktop (768px and up): fixed 256px sidebar (`sunken`), header 56px (`surface`) with the theme menu, content column max 896px.
- Mobile: header with a menu button (44px) opens a left drawer with the same navigation; content is full width with 16px gutters.
- Groups in order: Read, Study, Knowledge base, Worship, Literary modules (only when the legacy `quran:additional-modules-enabled:v1` flag is true), then Settings and About. The list is `app/lib/nav.ts`; every link is a legacy route.
- The mini player (`MiniPlayer.vue`) renders only when a track is set; on desktop it sits right of the sidebar. It is a shell until Phase 4.

## Components

| Component | Source | Notes |
| --- | --- | --- |
| `NavList` | custom | Active item: accent 2px bar and `aria-current="page"` |
| `AppHeader` | custom | Theme menu through `ResponsiveMenu` |
| `ResponsiveMenu` | custom on `DropdownMenu` and `Drawer` | Popover at 768px and up, bottom sheet below, 46px rows |
| Drawer | shadcn-vue `Sheet` | Focus trap, Escape closes and returns focus |
| `PwaUpdateToast` | custom on Sonner | Persistent toast with Reload and Later |
| Toaster | shadcn-vue Sonner | Accent action button, 10px radius |

## Data

| Data | Service / composable | Cache or storage key |
| --- | --- | --- |
| theme, literary modules flag | `usePreferencesStore` | `themeMode`, `quran:additional-modules-enabled:v1` |

## States

- Loading: the shell is static; the theme is applied before first paint.
- Empty / first run: light theme, Literary modules hidden.
- Error: unknown routes show "This page is not rebuilt yet" (`pages/[...slug].vue`).
- Offline: works from the precached shell.
- Fiqh variants: none in the shell.
- Dark mode and high contrast: both implemented; high contrast uses the `data-high-contrast` flag.

## Interactions

Menu button, nav links, theme menu (Light, Dark, System), skip link. Keyboard: Tab order is skip link, sidebar (desktop) or menu button (mobile), header, content; Escape closes the drawer and menus.

## Accessibility

Skip link; landmark `nav` named "Main"; visible 2px focus ring; touch targets 44px or more on mobile; group labels use `ink-2` (ink-3 fails contrast for text).

## Cross-links

Links to every legacy route. Unbuilt ones land on the "not rebuilt yet" page.

## Known differences from the prototype

Accent bar instead of the prototype's gold (design decision).

## Tests

`e2e/foundation.spec.ts` (shell, drawer, menu, keyboard, touch targets), `e2e/offline.spec.ts`, `tests/bridge.test.ts` (nav routes exist in the legacy app).
