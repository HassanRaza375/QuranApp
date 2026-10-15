# Design system

Direction: **Night Study** craft with a **light default**. Ink-and-paper personality in both modes. The reference implementation is `prototype.html` (plain HTML/JS, not code to port).

## Principles

1. **Scripture flows, UI is contained.** Ayahs and translations are never inside a bordered card. Cards are for widgets, progress and reference items.
2. **One accent does the interactive work.** Gold is a mark, not a theme (verse-end markers, later Hifz mastery).
3. **Arabic is the most cared-for text on any screen.** Larger, generous line height, never letter-spaced, follows the Arabic size setting.
4. **Navigation is grouped by intent.** Read, Study, Knowledge base, Worship, Literary modules (optional), then Settings and About.
5. **Borders over shadows.**
6. **Quiet progress.** No streaks, badges or points.
7. **Both traditions, honestly.** Where Sunni and Ja'fari practice differ, show both and say which one the user follows.

## Tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#F3F1EA` | `#14161C` | Page |
| `--surface` | `#FBFAF6` | `#1B1E26` | Cards, header, player, menus |
| `--sunken` | `#ECE7DA` | `#191B22` | Sidebar, inputs, inset notes |
| `--ink` | `#1C1B17` | `#EDEAE2` | Primary text |
| `--ink-2` | `#6B6558` | `#B4AFA0` | Secondary text |
| `--ink-3` | `#9C978A` | `#75726A` | Muted, placeholders |
| `--border` | `#E1DDD0` | `#2A2D36` | Hairlines |
| `--accent` | `#2B6777` | `#5CA0AF` | Links, active states, primary buttons, progress |
| `--accent-soft` | `#E3EDEF` | `#1B2A2D` | Active rows, widgets, selected chips |
| `--gold` | `#9C7A3C` | `#C9A15E` | Verse markers only |
| `--gold-soft` | `#F1E6D2` | `#2E2717` | Gold badge backgrounds |
| `--danger` | `#A5433A` | `#D97B72` | Destructive actions |

High contrast mode (accessibility setting) strengthens `--border`, `--ink-2`, `--ink-3` (see the prototype's `.stage.hc` rules).

### Mapping onto shadcn-vue variables

| shadcn variable | Token |
| --- | --- |
| `--background` | `--bg` |
| `--foreground` | `--ink` |
| `--card`, `--popover` | `--surface` |
| `--card-foreground`, `--popover-foreground` | `--ink` |
| `--primary` | `--accent` |
| `--primary-foreground` | `--bg` |
| `--secondary`, `--muted` | `--sunken` |
| `--secondary-foreground` | `--ink` |
| `--muted-foreground` | `--ink-2` |
| `--accent` (shadcn) | `--accent-soft` |
| `--accent-foreground` | `--ink` |
| `--destructive` | `--danger` |
| `--border`, `--input` | `--border` |
| `--ring` | `--accent` |
| extra | `--ink-3`, `--gold`, `--gold-soft` |

shadcn-vue defaults to OKLCH; convert the hex values above and keep them as the source of truth.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Qur'an Arabic | Keep the legacy Qur'an script font (prototype uses Noto Naskh Arabic only as a stand-in) | Size `32px × Arabic scale` desktop, `25px × scale` mobile, line height about 2.1, no letter-spacing |
| Urdu | Noto Nastaliq Urdu | Right-to-left, about 20px, line height about 2.4 |
| Bengali | A Bengali serif (prototype: Noto Serif Bengali) | About 16.5px, line height 1.9 |
| Reading and headings | Newsreader | Translation 16.5px / 1.65; page titles 22px; story chapter title 28px |
| UI | Instrument Sans | Nav 13.5px, body 14px, captions 11–12.5px |

Arabic scale: 0.8 to 1.6, set in Settings, applied everywhere through one CSS variable.

## Spacing and shape

- 4px base. Common steps: 8, 12, 16, 20, 24, 32, 44.
- Cards: radius 10px, padding 18–24px, 1px border, no shadow. Controls: radius 8px. Pills and chips: full radius.
- Ayah rows: 36px vertical and 20px horizontal padding on desktop, 28px and 12px on mobile; hairline between ayahs; translation below the Arabic with a 14–16px gap.
- List rows (surahs, people, library): 14–20px vertical padding, hairline dividers, no card.
- Sidebar items: about 40px tall; the active item has a 2px bar in the **accent** colour. Decision: the prototype shows a gold bar, but the product uses the accent so gold stays reserved for verse markers.

## Component patterns (prototype class to shadcn-vue)

| Prototype | Build with |
| --- | --- |
| `.dd-btn`, `.dd-menu` (icon + value dropdown) | `DropdownMenu` on desktop, `Drawer` (bottom sheet) on mobile, wrapped as one `ResponsiveMenu` |
| `.sc` segmented control | `ToggleGroup` or `Tabs` |
| `.switch` | `Switch` |
| `.mchip`, `.pt-tag` | `Badge` (default, outline, dashed, accent variants) |
| `.btn-primary`, `.btn-sec` | `Button` (default, outline, destructive) |
| `.set-group`, `.set-row` | Bordered container with rows and `Separator` |
| Side panel and bottom sheet (`.ov-panel`) | `Sheet` (right on desktop, bottom on mobile) |
| `.lib-toast` with Undo | `Sonner` toast with an action |
| Range inputs | `Slider` |
| Timetable | `Table` |
| Search and text fields | `Input`, `Textarea` |
| Tasbeeh ring, Qibla compass, night strip, page chips | Custom components |

## Shared interaction patterns

- **Responsive menus:** one logical menu, popover on desktop, bottom sheet on mobile (46px rows).
- **Undo over confirm:** removing shows a toast with Undo and keeps notes. Only "clear all data" asks first.
- **Status labels on content:** chips for Qur'an, Traditional chronology, Scholarly, Source note. Always visible where content is not directly from the Qur'an.
- **Both fiqhs:** a "Following" or "Showing" segmented control (Sunni, Ja'fari) bound to the global fiqh setting (legacy key `prayerFiqh`, raw string `sunni` | `jafari`; the prototype's internal `shia` value is never stored); events and explainers show both when relevant.
- **Offline states:** a clear message, the last known data when it exists, and a retry or Update now action.
- **Empty and first-run states:** explain what the page does and how to fill it.
- **Playing state:** the active row gets a tinted background and a pause icon; the mini player and full player reflect it.

## Story Mode rules (Prophets & People)

- One story, owned by the Stories module; person, event and theme pages open into it at the right chapter.
- Chapters: one per screen, progress rail, previous and next. Qur'an excerpt first-class; context notes are sourced and labelled; reflections only where a "Qur'an explicit" lesson exists.
- Stories told in pieces show a permanent "Arranged for study" notice and an "Also told in" row with a Compare tellings drawer.
- Visuals: calligraphy of the name, places, objects, geometry. Never people, silhouettes or avatars.
- No streaks. Progress is quiet chapter dots and a resume point.

## Accessibility

- Visible focus rings; full keyboard operation; labels on icon-only buttons.
- Contrast checked in light, dark and high contrast.
- 44px touch targets on mobile (the "Larger touch targets" setting increases them further).
- "Reduce motion" removes transitions and animations.
- Do not rely on colour alone (use text tags, icons, dashed vs solid borders).
