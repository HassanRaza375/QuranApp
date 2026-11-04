# Smoke test of https://quran-app-znfc.vercel.app

- Date: 2026-10-30T13:06:39.703Z. Kind: production. Result: all 21 passed.
- Not covered: installing the PWA, a real phone, audio, and every item in docs/phases/phase-16-checks.md.

| Check | Result | Detail |
| --- | --- | --- |
| /sw.js: 200, JavaScript, not immutable | pass | public, max-age=0, must-revalidate |
| manifest.webmanifest: name, scope, start_url, icons | pass |  |
| /: own <title>, description, canonical | pass | https://quran-app-znfc.vercel.app/ |
| /about: own <title>, description, canonical | pass | https://quran-app-znfc.vercel.app/about |
| /surah-listing: own <title>, description, canonical | pass | https://quran-app-znfc.vercel.app/surah-listing |
| /api/surahs is JSON, not the app shell | pass |  |
| production: no X-Robots-Tag, no robots meta | pass |  |
| robots.txt | pass |  |
| sitemap.xml: 136 routes at one host, none of Poets, /foundation or a personal page | pass | quran-app-znfc.vercel.app |
| deep link /settings renders the app | pass |  |
| deep link /surah/18 renders the app | pass |  |
| deep link /prayerTime renders the app | pass |  |
| deep link /fiqh renders the app | pass |  |
| deep link /hifz renders the app | pass |  |
| an unknown address shows Page not found | pass |  |
| /poets shows Page not found (deferred, no stub) | pass |  |
| /foundation shows Page not found (test page is not shipped) | pass |  |
| /juz/7 redirects into the reader | pass |  |
| the service worker registers, and a reload works offline | pass |  |
| no uncaught page error on any page above | pass |  |
| a clean-profile first run opens Home with no error | pass |  |
