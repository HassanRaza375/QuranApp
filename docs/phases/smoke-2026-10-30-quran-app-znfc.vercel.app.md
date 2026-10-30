# Smoke test of https://quran-app-znfc.vercel.app

- Date: 2026-10-30T07:03:53.435Z. Kind: production. Result: **9 of 21 FAILED**.
- Not covered: installing the PWA, a real phone, audio, and every item in docs/phases/phase-16-checks.md.

| Check | Result | Detail |
| --- | --- | --- |
| /sw.js: 200, JavaScript, not immutable | pass | public, max-age=0, must-revalidate |
| manifest.webmanifest: name, scope, start_url, icons | pass |  |
| /: own <title>, description, canonical | **FAIL** | no canonical link |
| /about: own <title>, description, canonical | **FAIL** | no canonical link |
| /surah-listing: own <title>, description, canonical | **FAIL** | no canonical link |
| /api/surahs is JSON, not the app shell | pass |  |
| production: no X-Robots-Tag, no robots meta | pass |  |
| robots.txt | **FAIL** | not a plain robots.txt |
| sitemap.xml: 136 routes at one host, none of Poets, /foundation or a personal page | **FAIL** | status 200, text/html;charset=utf-8 |
| deep link /settings renders the app | pass |  |
| deep link /surah/18 renders the app | pass |  |
| deep link /prayerTime renders the app | pass |  |
| deep link /fiqh renders the app | pass |  |
| deep link /hifz renders the app | pass |  |
| an unknown address shows Page not found | **FAIL** | no Page not found |
| /poets shows Page not found (deferred, no stub) | **FAIL** | no Page not found |
| /foundation shows Page not found (test page is not shipped) | **FAIL** | the test page is live |
| /juz/7 redirects into the reader | **FAIL** | landed on https://quran-app-znfc.vercel.app/juz/7 |
| the service worker registers, and a reload works offline | pass |  |
| no uncaught page error on any page above | pass |  |
| a clean-profile first run opens Home with no error | pass |  |
