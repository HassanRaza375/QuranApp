# Legacy reference docs

Copies of the legacy app's specs and notes that this project's docs refer to. They are **reference only**: this repository does not
contain the legacy app's source (only the files it uses, in `legacy/`), and these documents describe the legacy app, not this one.
Where they and `CLAUDE.md` or `docs/PLAN.md` disagree about how the **revamp** should look or be built, the revamp docs win. For
what a **feature should do**, these still win (see `CLAUDE.md`).

- Copied from legacy commit `7120b6cd6301ed267085b130052d767f95b2c15a` (branch `revamp-design-logic`), on 2026-10-22, straight from the commit's
  files. They are unmodified; only two were renamed (below). Do not edit them. If the legacy repo changes one before cutover, copy it
  again and update the commit above.
- Links inside the copies still use the legacy repo's layout. In particular `README.md` there is `LEGACY_README.md` here, and
  `CLAUDE.md` there is `LEGACY_CLAUDE.md` here. A path such as `app/...`, `scripts/wajibat/` or `tests/` in them means the legacy repo.

| File here | Was | What it is | Our docs that point at it |
|---|---|---|---|
| `LEGACY_CLAUDE.md` | `CLAUDE.md` | the legacy app's working rules and list of specs | `CLAUDE.md` |
| `LEGACY_README.md` | `README.md` | legacy stack, architecture, gotchas, known gaps | `CLAUDE.md`, `docs/KICKOFF_PROMPTS.md` |
| `MODULE_BLUEPRINT.md` | same | tech-agnostic spec of every module | `CLAUDE.md`, `docs/KICKOFF_PROMPTS.md`, `docs/phases/phase-04b-plan.md` |
| `PROJECT_PLAN.md` | same | the legacy product plan | `CLAUDE.md`, `docs/phases/phase-08-ramadan-plan.md` |
| `prophets-quran-feature.md` | same | Prophets and Qur'anic Persons feature | `CLAUDE.md`, `docs/phases/phase-07a-people.md` |
| `wajibat-fiqh-jafari-module.md` | same | Daily Fiqh (Wajibat) module spec | `docs/PLAN.md` (Phase 13) |
| `wajibat_decisions.md` | same | Daily Fiqh decisions and official sources (**wins over the spec**) | `docs/CONTENT_TO_VERIFY.md`, `docs/PLAN.md` |
| `wajibat_mismatch_report.md`, `wajibat_needs_human.md`, `wajibat_progress_log.md`, `wajibat_release_notes.md` | same | Daily Fiqh review and phase records | `docs/PLAN.md` |

`LEGACY_CLAUDE.md` and `LEGACY_README.md` are renamed on purpose. A file called `CLAUDE.md` in a subfolder is loaded as instructions by
Claude Code when it reads files there, and the legacy rules (Vuetify, the legacy folder layout) would contradict this project's.

Specs the legacy `CLAUDE.md` mentions but that are not copied, because no doc here points at them: `Mir_Anis_Module_Research.md`,
`mir_anis_module_research_extraction_plan.md`, `quranic_knowledge_platform_phased_plan.md`, `seo.md`. Two it names
(`Hifz_Module_Specification.md`, `Quran_WebApp_Feature_Roadmap_and_Module_Specification.md`) were not in the legacy repo at that commit.
