# Prompts for Claude Code

Start Claude Code in the repo root so that `CLAUDE.md` loads. Use one session per phase, and clear the context between phases.

## Phase 0: plan first

Phase 0 is done. This is kept as the record of the original brief; it was written when this project was the `revamp-quran/` folder inside the legacy repo, so its wording about folders and root tooling no longer applies (the legacy app now lives in its own repo and `legacy/` holds a read-only snapshot).

```
Read, in order: docs/legacy-reference/LEGACY_CLAUDE.md, docs/legacy-reference/LEGACY_README.md, CLAUDE.md, docs/PLAN.md,
docs/design/DESIGN_SYSTEM.md, docs/design/PROTOTYPE_MAP.md, docs/CONTENT_TO_VERIFY.md,
docs/PROGRESS.md. Skim docs/legacy-reference/MODULE_BLUEPRINT.md. Open docs/design/prototype.html in a browser
as the visual reference.

We are rebuilding the UI as a Nuxt 4 SPA with shadcn-vue and Tailwind v4, replacing Vuetify.
The legacy app (its own repo) must stay untouched and working; legacy/ is a read-only snapshot.

Phase 0 is the foundation only, no page work. First write a plan and do not code yet:
1. Inventory the legacy app: routes in app/pages, composables, services, plugins,
   server/api routes, and every localStorage / IndexedDB key and its format.
2. Propose how revamp-quran reuses legacy code (alias, layer or copy), with trade-offs,
   per kind of code (data JSON, utils, services, composables, plugins).
3. The install steps for shadcn-vue, Tailwind v4 and the shadcn-nuxt module for Nuxt 4,
   taken from the current official docs.
4. How the prototype tokens map onto shadcn variables for light and dark (see
   DESIGN_SYSTEM.md), and the no-flash theme approach.
5. A spike plan to prove two things before anything else: (a) SPA by default with a few
   prerendered public pages (Home, About, Surah listing), and (b) offline navigation from
   a precached app shell via @vite-pwa/nuxt, tested with build + preview and Playwright
   offline mode. Include the fallback if per-route prerender does not work.
6. How root tooling (ESLint, Vitest, tsconfig, .gitignore) will ignore revamp-quran/ so the
   legacy app is unaffected.
7. The preferences store design (fiqh, theme, Arabic scale, default translation and tafsir,
   reciter, playback speed, autoplay, verse layout, accessibility flags, literary modules,
   Hijri adjustment) using the legacy storage keys.
Wait for my approval before writing any code.
```

## Phase 0: build (after approval)

```
Approved. Build Phase 0 as planned. Commit in small steps. Then:
- run the full verification list in CLAUDE.md (build, lint, browser at 1280 and 375 in
  light and dark, offline test on a built preview);
- write docs/phases/phase-00-foundation.md from docs/templates/PHASE_TEMPLATE.md;
- update docs/PROGRESS.md;
- stop and report: what changed, what is unverified, open questions.
```

## Any later phase (template)

```
Phase <N>: <name>. Prototype section: <ids from docs/design/PROTOTYPE_MAP.md>.

Read CLAUDE.md, docs/PLAN.md, docs/design/DESIGN_SYSTEM.md, docs/PROGRESS.md and the
phase and page docs of every phase this one depends on. Open the prototype section in a
browser, including its mobile frame, dark mode and its empty or first-run state.

Step 1, plan only: list the components, the legacy services and composables to reuse,
storage keys touched, offline level per page, states to cover, intentional differences from
the prototype, risks and open questions. Wait for my approval.

Step 2, after approval: build, verify (full list in CLAUDE.md), write
docs/phases/phase-<NN>-<name>.md and docs/pages/<page>.md from the templates, update
docs/PROGRESS.md and docs/CONTENT_TO_VERIFY.md, and stop. Do not start the next phase.
```

## Resume after a break

```
Read CLAUDE.md, docs/PROGRESS.md and the latest phase doc. Summarise where we are and what
is left in the current phase. Do not change code until I confirm.
```

## Review a finished phase

```
Review Phase <N> against its page docs and the prototype. Check: legacy app untouched,
storage keys unchanged, no placeholder content, offline states, both fiqh variants,
keyboard and contrast, 44px touch targets. List problems by severity. Do not fix anything
until I choose.
```
