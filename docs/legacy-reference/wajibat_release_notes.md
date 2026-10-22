# Daily Fiqh (Wajibat), Phases 1–6: release note

Module 18, at `/fiqh`. Fiqh Ja'fari, per-marja' sourced rulings, no account, no backend. Every ruling is quoted from the marja's own official text; the app writes no rulings and translates nothing.

## What is live

- **46 topics in 4 categories** (Foundations 5, Ṭahārah 8, Ṣalāt 20, Ṣawm 13), **828 rulings (1,225 per-marja' entries)**, 11 guided step-by-step prayers/ablutions, a glossary, search, bookmarks and offline use.
- **Phase 6, Khums and Zakat (on `wajibat-module`, not yet merged):** 21 topics and 605 rulings. Sistani's Khums (1768–1866) and Zakat (1871–2002) chapters, and Khamenei's *The Rulings of Khums*: 305 questions and 78 of the book's own rule paragraphs (shown to his followers only). No calculator; amounts are quoted as written. The paying topics link only to the marja's own official website. **Khamenei has no zakat entries**: his published zakat rulings are in Persian and Arabic only (no English or Urdu chapter exists), so his followers see one notice there; the same for zakāt al-fiṭrah (his fiṭrah Q&A has no public page to cite). 92 of his khums rulings show a pointer to his book instead of text, because the English and Urdu differ from his Persian; 52 of the 78 paragraphs show English only.
- **Phase 5, Fasting (on `wajibat-module`, not yet merged):** 13 topics and 341 rulings. Sistani's Chapter Four (Rulings 1529–1718) and zakāt al-fiṭrah (2003–2044); Khamenei's *Rules* 787–981 and 41 of his Q&A answers. The dawn and maghrib topic shows today's times from Prayer Times, with a link to the Ramadan fasting log. **Zakāt al-fiṭrah has no Khamenei ruling** (no official source found), so his followers see one notice there. Not included: iʿtikāf.
- **Data loading:** each `/fiqh` category now loads its own data chunk (plus a small core) instead of one file: Foundations 36 KiB, Ṭahārah 295 KiB, Ṣalāt 814 KiB, Ṣawm 568 KiB, core 149 KiB (raw; 10, 66, 143, 103 and 35 KiB gzip). The largest page load is 962 KiB raw (Ṣalāt + core), down from 1,775 KiB. "Save all for offline" saves all five.
- **Two maraji':** Sayyid Ali al-Sistani (*Islamic Laws*, 4th edition) and Ayatollah Khamenei (*The Rules on Prayer & Fasting* 2023, with his Q&A as supplementary entries and, for wuḍūʾ, his official Urdu treatise). A reader sees **only the chosen marja's** rulings. Makarem Shirazi has no content until his risala is supplied.
- **English and Urdu.** Urdu appears only where the marja's own official Urdu book has the ruling.
- Content: wuḍūʾ, ghusl, purity and impurity, the daily prayers and their conditions, the traveller's prayer, congregational prayer, prayer doubts, ṣalāt al-iḥtiyāṭ, sajdat al-sahw and forgotten parts; and, in Phase 5, the fast of Ramadan (who must fast, the intention, what invalidates it, janābah/ḥayḍ/nifās, kaffārah, qaḍāʾ and fidyah, travel, the first of the month, the kinds of fast) and zakāt al-fiṭrah.
- **Every page says "Not scholar-reviewed".** Every quote is checked by tests against the official source text it was extracted from.

## What is not live

- **The four decision helpers** (prayer doubts and wuḍūʾ, for each marja') are **hidden**. A helper appears only when a reviewer has signed off every one of its 262 paths in total (none is signed off yet). The review pack is in `review_pack/`. Topic pages are unaffected.
- **Makarem Shirazi** and Phases 6–8 (Khums, Zakat, Hajj and later), 10, and the tracker (Phase 9). Iʿtikāf.

## Display holds from the automated mismatch check (decision B1)

An automated comparison of every language version found differences in numbers or negation words. Until a person reviews each, a **safe default controls what is shown. Nothing is accepted by it.**

- **Sistani:** for 193 rulings with a high-priority difference, the Urdu is hidden and the English is shown with a note (146 before Phase 5, 48 added by the fasting chapter, 1 lifted by the corrected check). (Sistani's English 4th edition is the authoritative text.)
- **Khamenei:** where the English and the Urdu differ from each other, the version that matches his Persian original is shown. 18 Urdu texts and 41 English texts are hidden on that basis (9 + 9 and 29 + 12, the second figure from Phase 5). Where a held English text is quoted by a guided prayer step or a helper answer, the official Urdu is shown there instead, with a notice.
- **92 rulings** (21 from Phases 4–5 and 71 of Khums in Phase 6) where neither the English nor the Urdu matches the Persian (Khamenei only: 8 prayer rulings, `ayatcauses`, `doubtkinds`, `fridaybest`, `maghribishatime`, `quransajdah`, `tashahhudforgot`, `turningface`, `zuhrasrtime`, and 13 fasting rulings, and, in Phase 6, 71 Khums rulings) are **held for review**: the card shows no text, only a pointer to his own book (*The Rules on Prayer & Fasting 2023*, with the official link), until a person decides. Recorded as `held-pending-review` (48 rows). No guided prayer step or helper answer quotes any of them.
- **66 rows** (Khamenei Q&A answers with no Persian original to decide with) are still shown as before and listed side by side in `wajibat_needs_human.md` for a person.
- Restoring a hidden text is a recorded decision (`scripts/wajibat/decide_mismatch.py`), never a hand edit.

## Safeguards

- The "show unreviewed helpers" dev flag (`NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS`) **fails a production build** if it is on. **Never set it on Vercel.**
- The ruling data is generated by `scripts/wajibat/` from the official sources; generated files are never hand-edited.

## Known limits

- The mismatch check cannot see a changed meaning that keeps the same numbers and negations, so it is not proof that the other pairs agree. A second human reader is recommended for the whole dataset before it is described as reviewed.
- The English edition of Khamenei's 2023 Rules has seven rulings that differ from his Persian original; they show the Urdu instead (decision R11, listed in `wajibat_progress_log.md`).
- Question screens in the helpers are English only.
