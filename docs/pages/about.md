# Page: About

- Routes: `/about` (legacy, kept)
- Phase: 15
- Prototype section: none. Designed from the existing type scale and tokens; checked at the screenshot checkpoint (`docs/design/phase15-small/`, accepted 2026-10-28).
- Offline level: **A.** Static text; nothing is read from storage and nothing is requested.
- Indexable: yes. **Only the head is prerendered** (title, description, Open Graph, from `lib/publicMeta.ts`): the page body is client-rendered like every other page, so with JavaScript off the page shows no text (`DECISIONS.md`, Phase 15, item 12).

## Purpose

Say plainly what the app is, what stays on the device, which services it asks for what, and what it is not.

## Layout

One narrow column, hairline dividers between sections, no cards, no emoji.

1. **About**, and a one-sentence lede.
2. **What stays on your device:** no account; your place, bookmarks, notes, goals, Hifz progress and settings are saved in this browser and not uploaded; a link to Settings, Data & privacy.
3. **Where things come from:** the five services, each with its name (a link), its host, what it provides and what is sent to it.
4. **The study pages:** how entries are grounded (each points to its ayahs; where one rests on tradition or interpretation it says so, in the data's own words) and the seven modules, each a link with its question.
5. **What it is not:** not affiliated with any religious institution; nothing in it is a ruling; where traditions differ it shows them side by side; follow your own marja' or a local scholar.
6. A link to the Sitemap.

## The facts are checked against the code (`lib/about.ts`, `tests/about.test.ts`)

- The five services (Quran API, AlQuran Cloud, AlAdhan, Open-Meteo, GitHub for the audio files) are one list. A test reads the hosts from `nuxt.config.ts`, `prayer.service.ts`, `geocode.ts` and `downloadPlan.ts` and fails if one is missing from the list; another fails if the list names a host the code does not contain.
- "Sent" says what each request carries: the surah and ayah numbers; for AlAdhan the saved place's coordinates **rounded to about 1 km**, the method and a month (prayer times) and only a month and year (the Hijri calendar); for Open-Meteo only the typed city, only when you press Search.
- The three labels quoted ("Traditional identification", "Scholarly interpretation", "Disputed interpretation") are found in the knowledge modules' code.
- The page's description is the same text in the page and in the prerendered head (a test compares them).
- It names no interface library and has no emoji (the legacy page named Vuetify and used emoji headings; it listed two services and typed module counts).

## Components

Existing: `NuxtLink`, `Icon`. The module list reads `lib/knowledge/modules.ts` (the one module list); nothing new.

## States

Static. Dark mode designed.

## Accessibility

One `h1`, `h2` per section, links at least 44px on a phone, the services as a description list. Checked at 1280 and 375 px, light and dark.

## Tests

`tests/about.test.ts` (8), `e2e/smallpages.spec.ts` (About: content, services, links, phone targets, offline), `e2e/prerender.spec.ts` (head only), `tests/bridge.test.ts` (the head).

## Open questions

- All the wording is ours (`docs/CONTENT_TO_VERIFY.md`, About): confirm or change it.
