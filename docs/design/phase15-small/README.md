# About, Sitemap and Surah videos (Phase 15)

These three pages have no prototype. They were designed from the existing components and tokens and shown to the owner as screenshots before the phase was finished; **approved 2026-10-28** (one layout fix after the first look: the study-page list on About and the Settings link).

Made by `node scripts/screenshots/phase-15-small-pages.mjs` against a production build: each page, light and dark, at 1280 and 375 px, full page. The pages request nothing from any service.

**Looked at one by one:** about-desktop-light, about-mobile-dark, sitemap-desktop-light, sitemap-mobile-dark, videos-desktop-light, videos-mobile-light (and About again after the fix). **Not looked at:** the other six (about-desktop-dark, about-mobile-light, sitemap-desktop-dark, sitemap-mobile-light, videos-desktop-dark, videos-mobile-dark). In the full-page desktop shots the sidebar stops at the viewport height; that is how a full-page capture draws a fixed sidebar, not a layout fault.
