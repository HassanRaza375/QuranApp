// Commands & Prohibitions — dataset types + data (Phase 9 of
// quranic_knowledge_platform_phased_plan.md). A focused catalog of the
// Qur'an's own direct commands and prohibitions, each with an explicit
// audience and source-tier — distinct from Themes (Phase 5), which
// explore the same concepts broadly and doctrinally.
//
// ============================================================
// ARCHITECTURE — Theme vs. Command/Prohibition boundary (approved)
// ============================================================
// A Theme is the broad conceptual/doctrinal exploration of an idea,
// illustrated across many representative passages and Stories. A Command
// or Prohibition entry here is the FOCUSED catalog entry for the specific
// verse(s) where the Qur'an issues the actual imperative/prohibitive
// grammar, with its own audience and source-tier — it does not restate
// or duplicate the Theme's own description or relationship graph.
// Wherever a matching Theme exists, `themeIds` is the primary
// relationship; broader illustrative cross-links (Stories, other People)
// stay on the Theme's own entry rather than being re-derived here.
//
// Eight of these 18 entries have a corresponding Theme (Prayer, Zakah,
// Fasting, Justice, Remembrance, Repentance, Honoring Parents, Shirk,
// Devouring Orphans' Wealth) — approved as a real, if heavy, overlap
// given each pair genuinely serves a different purpose (see Phase 9's
// own pre-implementation audit for the full boundary discussion).
// "Truthfulness" and "Transgression" were investigated and explicitly
// EXCLUDED for having no anchor distinct enough from their existing
// Themes to justify a separate entry — not an oversight.
//
// ============================================================
// SOURCE BASIS — CommandSourceBasis is a DELIBERATELY SEPARATE type from
// IdentificationBasis (app/utils/quranReference.ts, reused by Events and
// Signs & Miracles). IdentificationBasis answers "whose account
// establishes an identification" (a name, a site, a date).
// CommandSourceBasis answers a different question: "how is this
// command/prohibition CLAIM established" — a distinction between direct
// Qur'anic wording and layered legal derivation that IdentificationBasis
// was never built to express. Reusing it here would misuse values
// (`traditional`, `disputed`) whose meaning is already load-bearing on
// other modules. IdentificationBasis and EventSourceBasis are NOT
// modified by this file.
//
// All 18 entries in this initial dataset use `quran_explicit` — every
// one is a direct Qur'anic imperative or prohibitive statement. Theft
// (5:38) is `quran_explicit` too, but with a mandatory statusNotes
// disclosure: the ayah prescribes a punishment rather than phrasing a
// bare "do not steal" — the prohibition is certain, not weaker, but its
// textual FORM differs and that difference is disclosed rather than
// silently smoothed over. No entry in this dataset currently needs
// `quran_inferred`, `derived_ruling`, or `scholarly_interpretation` at
// the core-claim level — those tiers exist for the moment implementation
// adds any fiqh specifics (thresholds, percentages, procedures) beyond
// the bare Qur'anic wording, which this initial dataset deliberately
// does not do (see the "no fiqh expansion" rule below).
//
// ============================================================
// CONTENT RULE — no fiqh expansion in `description`
// ============================================================
// `description` states only what the cited passage itself says. Zakah's
// nisab/percentages, Hajj's detailed rites, Riba's classifications
// beyond the source, Theft's hadd conditions, and any other
// jurisprudential detail are deliberately NOT included anywhere in this
// file — not even in statusNotes — for this initial dataset. If such
// detail is added in a future phase, it must carry its own
// `derived_ruling`/`scholarly_interpretation` tagging in statusNotes,
// never asserted as this entry's core Qur'anic claim.
//
// ============================================================
// RELATIONSHIPS — one-directional this phase (approved)
// ============================================================
// `eventIds` links forward to Events (raisingkabah, gardenfall,
// ibrahimidolatry) but Events does NOT receive a reciprocal
// `commandIds`/`prohibitionIds` field in this phase — app/data/
// quranEvents.ts is untouched. Bidirectional traversal, if ever needed,
// is Phase 10's Knowledge Graph's job, not manufactured here for symmetry.
import type { RelatedPassage } from "~/utils/quranReference";

export type CommandType = "command" | "prohibition";

export type CommandSourceBasis =
  | "quran_explicit" // a direct Qur'anic imperative/prohibitive statement
  | "quran_inferred" // a principle drawn from the Qur'an's own context, not a single direct imperative
  | "derived_ruling" // a specific fiqh ruling reached through legal derivation, not itself Qur'anic wording
  | "scholarly_interpretation"; // a classical/scholarly gloss on what the text means or how far it extends

export type QuranCommand = {
  id: string;

  title: string;
  arabicTitle: string;

  type: CommandType;
  sourceBasis: CommandSourceBasis;
  audience: string;

  description: string;

  passage: RelatedPassage;
  parallelPassages?: RelatedPassage[];

  personIds?: string[];
  communityIds?: string[];
  placeIds?: string[];
  storyIds?: string[];
  eventIds?: string[];
  signIds?: string[];
  themeIds?: string[];
  duaIds?: string[];

  statusNotes?: string[];
};

export const QURAN_COMMANDS: QuranCommand[] = [
  // ---------------- COMMANDS ----------------
  {
    id: "prayercommand",
    title: "Prayer",
    arabicTitle: "إقامة الصلاة",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Believers are commanded to guard the prayers strictly and to stand before Allah in devout obedience.",
    passage: { id: "prayercommand-p", surahNumber: 2, ayahStart: 238, ayahEnd: 238, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "prayercommand-baqarah43", surahNumber: 2, ayahStart: 43, ayahEnd: 43, source: "quran", verificationStatus: "verified" },
      { id: "prayercommand-taha", surahNumber: 20, ayahStart: 14, ayahEnd: 14, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["prayer"],
  },
  {
    id: "zakahcommand",
    title: "Zakah",
    arabicTitle: "إيتاء الزكاة",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Believers are commanded to give zakah, repeatedly paired in the text with the command to establish prayer.",
    passage: { id: "zakahcommand-p", surahNumber: 2, ayahStart: 110, ayahEnd: 110, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "zakahcommand-tawbah", surahNumber: 9, ayahStart: 60, ayahEnd: 60, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["charity"],
    statusNotes: [
      "9:60 names the categories of zakah recipients directly in the text; it is cited here only as that direct textual naming — no nisab threshold, percentage, or other fiqh calculation is stated here or anywhere in this entry.",
    ],
  },
  {
    id: "fastingcommand",
    title: "Fasting",
    arabicTitle: "فرض الصيام",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Fasting is ordained for believers as it was ordained for those before them, with the Qur'an's own stated purpose being the attainment of taqwa.",
    passage: { id: "fastingcommand-p", surahNumber: 2, ayahStart: 183, ayahEnd: 183, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "fastingcommand-p2", surahNumber: 2, ayahStart: 185, ayahEnd: 185, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["fasting"],
  },
  {
    id: "hajjcommand",
    title: "Hajj",
    arabicTitle: "فرض الحج",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "\"whoever is able to find a way there\" among mankind",
    description: "Pilgrimage to the House is declared a duty owed to Allah by whoever is able to make the journey to it.",
    passage: { id: "hajjcommand-p", surahNumber: 3, ayahStart: 97, ayahEnd: 97, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "hajjcommand-baqarah", surahNumber: 2, ayahStart: 196, ayahEnd: 197, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["ibrahim", "ismail"],
    placeIds: ["makkah", "almasjidalharam"],
    storyIds: ["ibrahimnarrative"],
    eventIds: ["raisingkabah"],
    statusNotes: [
      "No detailed rite-by-rite procedure or jurisprudential condition is described here — only the Qur'an's own direct statement of the obligation and its condition ('whoever is able').",
    ],
  },
  {
    id: "justicecommand",
    title: "Justice",
    arabicTitle: "الأمر بالعدل",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "general — \"mankind\"",
    description: "Allah commands justice, excellence, and generosity to relatives, in the same verse that forbids immorality, wrongdoing, and oppression.",
    passage: { id: "justicecommand-p", surahNumber: 16, ayahStart: 90, ayahEnd: 90, source: "quran", verificationStatus: "verified" },
    themeIds: ["justice"],
    statusNotes: [
      "This one ayah pairs a command (justice, excellence, generosity) with a prohibition (immorality, wrongdoing, oppression) in a single sentence. Rather than splitting the prohibition into a separate entity — which would require inventing a broad, poorly-bounded 'Transgression'-style entry — it is disclosed here as part of this command's own text; the Justice Theme remains the canonical place for the fuller conceptual exploration, and the existing Oppression Theme already covers the broader zulm concept this ayah's prohibition clause touches.",
    ],
  },
  {
    id: "remembrancecommand",
    title: "Remembrance (Dhikr)",
    arabicTitle: "الأمر بالذكر",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Believers are commanded to remember Allah with frequent, unceasing remembrance.",
    passage: { id: "remembrancecommand-p", surahNumber: 33, ayahStart: 41, ayahEnd: 41, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "remembrancecommand-p2", surahNumber: 2, ayahStart: 152, ayahEnd: 152, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["dhikr"],
  },
  {
    id: "repentancecommand",
    title: "Repentance",
    arabicTitle: "الأمر بالتوبة",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "all believers",
    description: "All believers are commanded to turn to Allah in repentance together.",
    passage: { id: "repentancecommand-p", surahNumber: 24, ayahStart: 31, ayahEnd: 31, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "repentancecommand-p2", surahNumber: 66, ayahStart: 8, ayahEnd: 8, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["adam"],
    eventIds: ["gardenfall"],
    themeIds: ["tawbah"],
    statusNotes: [
      "The repentance command is the closing clause of 24:31, a longer verse primarily addressed to believing women regarding modesty — cited here specifically for that closing command, not as though the whole ayah concerns repentance alone.",
    ],
  },
  {
    id: "honoringparentscommand",
    title: "Honoring Parents",
    arabicTitle: "الإحسان إلى الوالدين",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "Immediately after the command to worship none but Allah, the same verse decrees excellent treatment of one's parents.",
    passage: { id: "honoringparentscommand-p", surahNumber: 17, ayahStart: 23, ayahEnd: 23, source: "quran", verificationStatus: "verified" },
    themeIds: ["parents"],
  },
  {
    id: "keepingpromisescommand",
    title: "Keeping Promises",
    arabicTitle: "الوفاء بالعهد",
    type: "command",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "A promise/covenant is to be fulfilled, for it will be asked about.",
    passage: { id: "keepingpromisescommand-p", surahNumber: 17, ayahStart: 34, ayahEnd: 34, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "keepingpromisescommand-p2", surahNumber: 5, ayahStart: 1, ayahEnd: 1, source: "quran", verificationStatus: "verified" },
    ],
    statusNotes: [
      "17:34's opening clause (not cited as this entry's own subject) addresses an orphan's wealth — that prohibition is covered separately under 'Devouring Orphans' Wealth' (4:10), which uses its own distinct primary reference rather than this verse.",
    ],
  },

  // ---------------- PROHIBITIONS ----------------
  {
    id: "shirkprohibition",
    title: "Shirk",
    arabicTitle: "النهي عن الشرك",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "Opening a list of what Allah has forbidden, the Qur'an instructs: do not ascribe divinity to anything besides Him.",
    passage: { id: "shirkprohibition-p", surahNumber: 6, ayahStart: 151, ayahEnd: 151, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "shirkprohibition-p2", surahNumber: 4, ayahStart: 48, ayahEnd: 48, source: "quran", verificationStatus: "verified" },
      { id: "shirkprohibition-p3", surahNumber: 4, ayahStart: 116, ayahEnd: 116, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["ibrahim"],
    eventIds: ["ibrahimidolatry"],
    themeIds: ["shirk"],
    statusNotes: [
      "6:151 is a multi-clause list verse ('Come, let me recite what your Lord has forbidden you...') that also includes the prohibitions on murder and other matters covered by separate entries in this dataset — cited here specifically for its opening shirk clause.",
    ],
  },
  {
    id: "murderprohibition",
    title: "Murder",
    arabicTitle: "النهي عن قتل النفس",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "Do not take any life that Allah has made sacred, except through due right.",
    passage: { id: "murderprohibition-p", surahNumber: 17, ayahStart: 33, ayahEnd: 33, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "murderprohibition-p2", surahNumber: 6, ayahStart: 151, ayahEnd: 151, source: "quran", verificationStatus: "verified" },
      { id: "murderprohibition-p3", surahNumber: 5, ayahStart: 32, ayahEnd: 32, source: "quran", verificationStatus: "verified" },
    ],
    communityIds: ["baniisrael"],
    statusNotes: [
      "5:32's own wording is addressed specifically to the Children of Israel ('We decreed upon the Children of Israel...') — cited here as a parallel that the Qur'an itself frames as establishing a universal principle (whoever kills a soul, it is as if...), not as though 5:32 addresses all people directly in its own grammar.",
    ],
  },
  {
    id: "zinaprohibition",
    title: "Zina",
    arabicTitle: "النهي عن الزنا",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "Do not approach zina — it is an immorality and an evil way.",
    passage: { id: "zinaprohibition-p", surahNumber: 17, ayahStart: 32, ayahEnd: 32, source: "quran", verificationStatus: "verified" },
  },
  {
    id: "ribaprohibition",
    title: "Riba",
    arabicTitle: "تحريم الربا",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Those who consume riba are described as confounded by Satan's touch; Allah has permitted trade and forbidden riba.",
    passage: { id: "ribaprohibition-p", surahNumber: 2, ayahStart: 275, ayahEnd: 275, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "ribaprohibition-p2", surahNumber: 2, ayahStart: 278, ayahEnd: 279, source: "quran", verificationStatus: "verified" },
      { id: "ribaprohibition-p3", surahNumber: 3, ayahStart: 130, ayahEnd: 130, source: "quran", verificationStatus: "verified" },
    ],
    statusNotes: [
      "No classification of riba's forms (e.g. riba al-nasi'ah vs. riba al-fadl) or any modern financial-instrument ruling is presented here — those are later jurisprudential developments, not stated in these ayat.",
    ],
  },
  {
    id: "theftprohibition",
    title: "Theft",
    arabicTitle: "حد السرقة",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "The Qur'an prescribes a punishment for the man or woman who steals, as a deterrent from Allah.",
    passage: { id: "theftprohibition-p", surahNumber: 5, ayahStart: 38, ayahEnd: 38, source: "quran", verificationStatus: "verified" },
    statusNotes: [
      "5:38 prescribes the punishment for theft rather than phrasing a standalone imperative such as 'do not steal' — the prohibition itself is unambiguous and certain, but its textual form is a prescribed ruling, not a bare command sentence; this distinction is disclosed here rather than smoothed into an invented direct-command wording. No hadd threshold, evidentiary condition, or other jurisprudential detail is stated here.",
    ],
  },
  {
    id: "backbitingprohibition",
    title: "Backbiting",
    arabicTitle: "النهي عن الغيبة",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Believers are told not to backbite one another — likened to eating the flesh of one's dead brother.",
    passage: { id: "backbitingprohibition-p", surahNumber: 49, ayahStart: 12, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    statusNotes: [
      "The backbiting clause is the closing portion of 49:12, which opens with a separate instruction against suspicion and spying — cited here specifically for the backbiting clause.",
    ],
  },
  {
    id: "falsetestimonyprohibition",
    title: "False Testimony",
    arabicTitle: "النهي عن شهادة الزور",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "The believers described favorably are those who do not bear witness to falsehood; elsewhere believers are commanded to stand firm in justice as witnesses for Allah, even against themselves.",
    passage: { id: "falsetestimonyprohibition-p", surahNumber: 25, ayahStart: 72, ayahEnd: 72, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "falsetestimonyprohibition-p2", surahNumber: 4, ayahStart: 135, ayahEnd: 135, source: "quran", verificationStatus: "verified" },
    ],
  },
  {
    id: "consumingwealthunjustlyprohibition",
    title: "Consuming Wealth Unjustly",
    arabicTitle: "النهي عن أكل المال بالباطل",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "believers",
    description: "Believers are told not to consume one another's wealth unjustly, except through trade by mutual consent.",
    passage: { id: "consumingwealthunjustlyprohibition-p", surahNumber: 4, ayahStart: 29, ayahEnd: 29, source: "quran", verificationStatus: "verified" },
    statusNotes: [
      "Kept distinct from Riba and Theft (this dataset's two other economic prohibitions) — this is the Qur'an's own broader general principle covering unjust consumption of wealth generally, not a restatement of either of those two specific, separately-named categories.",
    ],
  },
  {
    id: "orphanswealthprohibition",
    title: "Devouring Orphans' Wealth",
    arabicTitle: "أكل مال اليتيم ظلما",
    type: "prohibition",
    sourceBasis: "quran_explicit",
    audience: "general",
    description: "Those who sinfully devour the wealth of orphans are described as filling their bellies with fire.",
    passage: { id: "orphanswealthprohibition-p", surahNumber: 4, ayahStart: 10, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "orphanswealthprohibition-p2", surahNumber: 4, ayahStart: 2, ayahEnd: 2, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["orphans"],
  },
];

export const getCommandById = (id: string): QuranCommand | undefined =>
  QURAN_COMMANDS.find((c) => c.id === id);

// ============================================================
// Candidates investigated and deliberately excluded (per the approved
// Phase 9 audit) — not oversights:
//   - Truthfulness — no direct imperative-form anchor distinct from the
//     existing Truthfulness Theme, which relies on narrative illustration
//     (Yusuf, the believing man of Fir'aun's family) rather than a single
//     commanding verse.
//   - Transgression — no anchor distinct from the existing Oppression
//     (Zulm) Theme; its closest textual candidate (baghy, 16:90) is
//     already disclosed inside the Justice command entry above rather
//     than fragmented into its own broad, poorly-bounded entity.
// Any other command/prohibition candidate is out of scope for this
// initial 18-entry dataset unless explicitly approved in a future phase.
// ============================================================
