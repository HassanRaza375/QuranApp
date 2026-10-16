# Surah reader next to the prototype reader (Phase 4A)

`<device>-<theme>-fatiha.jpg` puts the prototype (left) next to the revamp (right): desktop is 1280px, mobile is 375px, light and dark = 4 pairs. The prototype only draws Al-Fatihah, so that is the surah compared; its full frame is captured (the revamp side is the first screen only). `state-<name>-<device>-<theme>.jpg` are revamp-only state shots: 19 states at 1280 light and 375 dark = 38 images (the prototype has no counterpart). The revamp is the production build reading the **real service** (so the text is real), with the reading-progress and similar records seeded only where a state needs them.

## Differences

| # | Prototype | Revamp | Kind |
| --- | --- | --- | --- |
| 1 | A play button on every ayah (desktop gutter, mobile tools row), and a playing ayah highlighted | None in 4A (a button that does nothing is worse than none); "Play surah" in the header uses the Phase 3 player. Per-ayah audio arrives in 4B | Approved (split) |
| 2 | A download button on every ayah | None in 4A (Phase 4B and Downloads) | Approved (split) |
| 3 | The title "سورة الفاتحة" without marks (typed) | The name exactly as the service gives it (marked for some surahs, plain for others, for example Al-Fatihah has marks and Al-Baqarah does not) | Real data |
| 4 | "Makkah" | "Mecca" (the legacy data's word; the listing uses it too) | Real data |
| 5 | Typed sample translations ("In the name of God ...") | The service's real English, Urdu, Bengali and Arabic (Alt) texts; the translators are not named in the data | Real data (CONTENT_TO_VERIFY) |
| 6 | A saved ayah has a gold star | The accent colour (gold is only for verse markers); `aria-pressed` | Intentional |
| 7 | The verse marker number is gold | The ring is gold, the number is `ink-2` (contrast) | Intentional |
| 8 | Pin is a map-marker icon | A lucide pin; `aria-pressed`, a name ("Pin ayah 3 as where you stopped") and Undo | Intentional |
| 9 | Tafsir shows "Sample excerpt for layout only" | The real text of the chosen source, the group note when there is one, the source name, and "No Ja’fari tafsir is available from this app’s data provider." | Real data |
| 10 | Menu buttons carry an icon (language, book, microphone) | Text and a chevron only | Intentional |
| 11 | No Mark as read | A "Mark as read" button under the bar (the Completed marker the listing then shows) | Added (approved) |
| 12 | The Tafsir menu is only the source list | Plus the Ja'fari line (a one-sentence statement of what the data has) | Added (approved) |
| 13 | The mini player is always shown | Hidden until something plays | Intentional for now (Phase 0 decision) |
| 14 | A bismillah only on other surahs, typed in the page | From the data of surah 1; never typed; left out when that is not available offline; its height is reserved while it loads | Real data |
| 15 | Header title "Al-Fātiḥah" (the surah) | "Quran App" (the shell title; the page's `h1` is the Arabic name) | Shell decision (Phase 1) |
| 16 | Ayahs have no focus or link state | An ayah opened by a link is scrolled to, focused and highlighted | Added |

The sidebar and header differences are the Phase 1 ones (`docs/design/home-compare/README.md`).

**Looked at individually:** the four Al-Fatihah pairs (desktop light and dark, mobile light and dark); states: Urdu (desktop light), tafsir menu (desktop light), loading (desktop light), Al-Baqarah with the bismillah (desktop light), saved and pinned (desktop light), translation menu (mobile dark), tafsir with the group note (mobile dark), tafsir error (mobile dark), translation first (mobile dark), offline never opened (mobile dark), Completed marker in the listing (mobile dark). (A first title overlap, where the marked Arabic name touched the facts line, was found in these and fixed before the final images.) **Generated but not examined one by one:** the other 28 state shots (At-Tawbah with no bismillah, tafsir in each source, tafsir loading, translation Off, opened by a link, not found, marked as read, translation menu and tafsir menu at the other size, and the rest at the other size).
