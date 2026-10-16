# Audio URL check

Run on 2026-10-16 by `node scripts/check-audio-urls.mjs` (a one-off, not part of CI). A HEAD request, redirects followed, to every audio URL in the legacy `surah.json`: 570 (114 surahs x 5 reciters). A URL is **reachable** when the final answer is 200 and the size is over 10 KB; it is also **served as audio** when the content type is `audio/*`. GitHub serves its larger files as `application/octet-stream` with `X-Content-Type-Options: nosniff`.

**Result: 570 of 570 reachable, 0 unreachable. 210 of the reachable ones are served as a generic type, not `audio/*`** (the largest: 90656305 bytes). Smallest file: surah 112, Nasser Al Qatami, 183812 bytes. This shows the files exist on that day; it does not play them.

## Served as a generic type

210 files (47 surahs: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 55, 56, 57) answer 200 with `application/octet-stream`.

## Does a browser accept the generic type? (checked by hand, 2026-10-16)

An `Audio` element in desktop Chromium (Playwright) loaded the metadata of three files: surah 1 by reciter 1 (`audio/mpeg`, 52 s), surah 3 by reciter 1 (`application/octet-stream`, 74 MB, 77 min) and surah 3 by reciter 2 (`application/octet-stream`, 91 MB, 70 min). So desktop Chromium plays the generic-type files. **Safari and iOS, Firefox and Chrome on Android were not tried:** that is a real-device check before the full player is built on these files. Files of this size also make "download for offline" (Phase 11) large (up to about 91 MB per surah).
