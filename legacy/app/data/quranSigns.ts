// Signs & Miracles — dataset types + data (Phase 8 of
// quranic_knowledge_platform_phased_plan.md). A catalog of specific
// extraordinary occurrences the Qur'an itself frames as signs (āyāt),
// miracles, divine aid, or punishment-signs — distinct from Events (the
// temporal/occurrence/narrative layer, Phase 7) and from Themes (broad
// doctrinal concepts, Phase 5).
//
// ============================================================
// ARCHITECTURE — reuse, not duplication (approved Phase 8 decisions)
// ============================================================
// This module deliberately does NOT duplicate Events' narrative prose.
// Every bounded Sign here that corresponds to an existing Event links to
// it via `eventIds` (and the Event gets a reciprocal `signIds` — see
// quranEvents.ts's own additions) rather than re-telling the occurrence.
// A Sign entry's `description` stays short and gives the SIGN/MIRACLE
// lens specifically (why this counts as a sign, what it evidences) —
// the full narrative stays on the linked Event or Story.
//
// `sourceBasis` reuses the existing shared `IdentificationBasis` type
// (app/utils/quranReference.ts) rather than inventing a third
// near-duplicate source-basis enum (Events' own `EventSourceBasis` is
// left untouched — no retroactive Phase 7 refactor). All 14 entries in
// this initial dataset use `quran_explicit` — every one is directly
// stated in its cited passage; see this file's own audit trail
// (conversation record) for why weaker-tier candidates (e.g. the
// Splitting of the Moon) were excluded rather than included with a hedge.
//
// `occurrenceType: "bounded" | "recurring"` — all 14 current entries are
// "bounded" (tied to a specific historical person/moment). "recurring"
// (for universal cosmic/natural sign-arguments — rain, ships, bees, the
// night/day cycle) is a real, valid value in this type but deliberately
// unused here: none of the audited candidates were of that kind, and
// none were manufactured just to exercise the value. Do not add
// chronology fields here — where a chronological position exists, it
// lives on the linked Event (via `eventIds`) and is not duplicated.
import type { RelatedPassage, IdentificationBasis } from "~/utils/quranReference";

export type SignClassification =
  | "sign" // a cosmic/natural proof-argument — unused in this initial dataset (see note above)
  | "miracle" // an extraordinary act given to a specific prophet as evidentiary proof
  | "divine_aid" // unseen help sent to believers, short of a personal miracle
  | "punishment_sign" // a destructive sign/warning sent against a rejecting people
  | "extraordinary_event"; // catch-all, used sparingly — unused in this initial dataset

export type OccurrenceType = "bounded" | "recurring";

export type QuranSign = {
  id: string;

  title: string;
  arabicTitle: string;

  classification: SignClassification;
  occurrenceType: OccurrenceType;
  sourceBasis: IdentificationBasis;

  description: string;

  passage: RelatedPassage;
  parallelPassages?: RelatedPassage[];

  personIds?: string[];
  communityIds?: string[];
  placeIds?: string[];
  storyIds?: string[];
  themeIds?: string[];
  duaIds?: string[];
  eventIds?: string[];

  statusNotes?: string[];
};

export const QURAN_SIGNS: QuranSign[] = [
  {
    id: "musastaff",
    title: "Musa's Staff",
    arabicTitle: "عصا موسى",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "The staff given to Musa as a sign — turning into a serpent when first demonstrated at his calling, and later swallowing the magicians' contrived ropes before Fir'aun's court.",
    passage: { id: "musastaff-p", surahNumber: 20, ayahStart: 17, ayahEnd: 21, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "musastaff-araf", surahNumber: 7, ayahStart: 107, ayahEnd: 107, source: "quran", verificationStatus: "verified" },
      { id: "musastaff-shuara", surahNumber: 26, ayahStart: 32, ayahEnd: 32, source: "quran", verificationStatus: "verified" },
      { id: "musastaff-ropes", surahNumber: 26, ayahStart: 45, ayahEnd: 45, source: "quran", verificationStatus: "verified" },
      { id: "musastaff-qasas", surahNumber: 28, ayahStart: 31, ayahEnd: 31, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["musa"],
    storyIds: ["musaandpharaoh"],
    eventIds: ["musacalling", "magiciansconvert"],
    statusNotes: [
      "This one Sign spans two distinct textual occasions — first given at the calling, then used again against the magicians — which is why it links to two separate Events rather than one.",
    ],
  },
  {
    id: "musahand",
    title: "Musa's Hand (the White Hand)",
    arabicTitle: "يد موسى البيضاء",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "Musa's hand, drawn out from his cloak shining white 'without any harm' — a second sign given alongside the staff at his calling.",
    passage: { id: "musahand-p", surahNumber: 20, ayahStart: 22, ayahEnd: 22, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "musahand-araf", surahNumber: 7, ayahStart: 108, ayahEnd: 108, source: "quran", verificationStatus: "verified" },
      { id: "musahand-shuara", surahNumber: 26, ayahStart: 33, ayahEnd: 33, source: "quran", verificationStatus: "verified" },
      { id: "musahand-naml", surahNumber: 27, ayahStart: 12, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
      { id: "musahand-qasas", surahNumber: 28, ayahStart: 32, ayahEnd: 32, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["musa"],
    storyIds: ["musaandpharaoh"],
    eventIds: ["musacalling"],
  },
  {
    id: "musaplagues",
    title: "Musa's Plagues",
    arabicTitle: "آيات الابتلاء على فرعون وقومه",
    classification: "punishment_sign",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "A sequence of afflictions — floods, locusts, lice, frogs, and blood — sent on Fir'aun's people as 'distinct signs,' escalating warnings they still rejected.",
    passage: { id: "musaplagues-p", surahNumber: 7, ayahStart: 130, ayahEnd: 135, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "firaun"],
    communityIds: ["aalfiraun"],
    placeIds: ["egypt"],
    storyIds: ["musaandpharaoh"],
    eventIds: ["confrontpharaoh"],
    statusNotes: [
      "The Qur'an's own wording (7:133) explicitly calls these 'signs, each explained in detail' (āyātin mufaṣṣalāt) — the basis for classifying them as punishment-signs rather than folding them into the broader confrontation narrative.",
    ],
  },
  {
    id: "seasplitting",
    title: "Splitting/Crossing of the Sea",
    arabicTitle: "انفلاق البحر",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "The sea parts before Musa's staff to let Bani Isra'il cross, then closes over Fir'aun's pursuing army.",
    passage: { id: "seasplitting-p", surahNumber: 26, ayahStart: 63, ayahEnd: 66, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "seasplitting-taha", surahNumber: 20, ayahStart: 77, ayahEnd: 78, source: "quran", verificationStatus: "verified" },
      { id: "seasplitting-baqarah", surahNumber: 2, ayahStart: 50, ayahEnd: 50, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["musa", "firaun"],
    communityIds: ["aalfiraun", "baniisrael"],
    placeIds: ["egypt", "thesea"],
    storyIds: ["musaandpharaoh"],
    eventIds: ["exoduscrossing"],
  },
  {
    id: "salihcamel",
    title: "The She-Camel of Salih",
    arabicTitle: "ناقة صالح",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "A she-camel given to Thamud as an explicit, tangible sign, with instructions to let her graze freely and not harm her — a test they failed.",
    passage: { id: "salihcamel-p", surahNumber: 7, ayahStart: 73, ayahEnd: 79, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "salihcamel-hud", surahNumber: 11, ayahStart: 64, ayahEnd: 65, source: "quran", verificationStatus: "verified" },
      { id: "salihcamel-shuara", surahNumber: 26, ayahStart: 155, ayahEnd: 158, source: "quran", verificationStatus: "verified" },
      { id: "salihcamel-shams", surahNumber: 91, ayahStart: 13, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["salih"],
    communityIds: ["thamud"],
    placeIds: ["alhijr"],
    themeIds: ["disobedience"],
    eventIds: ["thamuddestruction"],
    statusNotes: [
      "Linked to `thamuddestruction` because the she-camel's hamstringing is the direct, stated cause of that destruction — not a symmetry link.",
    ],
  },
  {
    id: "ibrahimfiresign",
    title: "Ibrahim's Fire Made Cool and Safe",
    arabicTitle: "النار بردا وسلاما",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "The fire his people threw him into is commanded to become 'cool and safe' for Ibrahim, sparing him unharmed.",
    passage: { id: "ibrahimfiresign-p", surahNumber: 21, ayahStart: 68, ayahEnd: 70, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "ibrahimfiresign-ankabut", surahNumber: 29, ayahStart: 24, ayahEnd: 24, source: "quran", verificationStatus: "verified" },
      { id: "ibrahimfiresign-saffat", surahNumber: 37, ayahStart: 97, ayahEnd: 98, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["ibrahim"],
    storyIds: ["ibrahimnarrative"],
    themeIds: ["tawakkul"],
    eventIds: ["ibrahimfire"],
  },
  {
    id: "isamiraclessign",
    title: "Isa's Miracles by Allah's Permission",
    arabicTitle: "معجزات عيسى بإذن الله",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "Healing the blind and the leper, giving life to the dead, and shaping a bird from clay and breathing life into it — every one of these explicitly attributed to Allah's permission, not Isa's own power.",
    passage: { id: "isamiraclessign-p", surahNumber: 3, ayahStart: 49, ayahEnd: 49, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "isamiraclessign-maidah", surahNumber: 5, ayahStart: 110, ayahEnd: 110, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["isa"],
    communityIds: ["baniisrael"],
    storyIds: ["maryamandisa"],
    themeIds: ["tawhid"],
    eventIds: ["isamiracles"],
    statusNotes: [
      "Kept as one combined entry rather than three (healing / raising the dead / the clay bird) — the Qur'an itself states all three together in a single connected declaration (3:49), each qualified by 'bi-idhni-Llah' (by Allah's permission); splitting them would fragment what the text presents as one unified list without adding distinct cross-links per sub-act.",
    ],
  },
  {
    id: "isacradlespeech",
    title: "Isa Speaking in the Cradle",
    arabicTitle: "كلام عيسى في المهد",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "As an infant, Isa speaks in his own defense when his people accuse Maryam, declaring himself a servant of Allah given revelation.",
    passage: { id: "isacradlespeech-p", surahNumber: 19, ayahStart: 29, ayahEnd: 33, source: "quran", verificationStatus: "verified" },
    personIds: ["isa", "maryam"],
    storyIds: ["maryamandisa"],
    eventIds: ["isabirth"],
    statusNotes: [
      "Kept separate from 'Isa's Miracles by Allah's Permission' — this is a textually distinct narrative moment (19:29-33, defending Maryam at birth) rather than part of the 3:49 list of ministry miracles.",
    ],
  },
  {
    id: "tablesign",
    title: "The Table from Heaven",
    arabicTitle: "المائدة من السماء",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "At the disciples' request, Isa prays for a table of food sent down as a sign from Allah; it is granted, with a warning attached for anyone who disbelieves afterward.",
    passage: { id: "tablesign-p", surahNumber: 5, ayahStart: 114, ayahEnd: 115, source: "quran", verificationStatus: "verified" },
    personIds: ["isa", "hawariyyun"],
    storyIds: ["maryamandisa"],
    duaIds: ["isatableprayerdua"],
    eventIds: ["tablefromheaven"],
    statusNotes: [
      "5:114 has Isa himself call the table 'a sign from Thee' (āyatan minka) — the direct basis for classifying this as a miracle/sign rather than only a narrative event (already covered separately by `tablefromheaven`).",
    ],
  },
  {
    id: "sulaimancreatures",
    title: "Sulaiman's Understanding of Creatures",
    arabicTitle: "فهم سليمان لغة الحيوان",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "Sulaiman is taught the speech of birds and understands an ant's warning to her colony as his army passes by.",
    passage: { id: "sulaimancreatures-p", surahNumber: 27, ayahStart: 16, ayahEnd: 19, source: "quran", verificationStatus: "verified" },
    personIds: ["sulaiman"],
    storyIds: ["sulaimanandsaba"],
    themeIds: ["shukr"],
    eventIds: ["sabavisit"],
    statusNotes: [
      "Linked to `sabavisit` because this same passage's hoopoe sequence (immediately following the ant scene, same surah) is the direct narrative lead-in to the Queen of Saba's visit — not a symmetry link.",
    ],
  },
  {
    id: "sulaimanwind",
    title: "Sulaiman's Command of the Wind",
    arabicTitle: "تسخير الريح لسليمان",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "The wind is placed under Sulaiman's command, carrying him a month's journey each morning and evening.",
    passage: { id: "sulaimanwind-p", surahNumber: 34, ayahStart: 12, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "sulaimanwind-sad", surahNumber: 38, ayahStart: 36, ayahEnd: 36, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["sulaiman"],
    statusNotes: [
      "No existing Event corresponds to this occurrence specifically (the existing `sabavisit` Event covers the Queen's visit, not this grant) — intentionally left without an `eventIds` link rather than attached to an unrelated Event for symmetry.",
    ],
  },
  {
    id: "sulaimanjinn",
    title: "Jinn Working Under Sulaiman's Authority",
    arabicTitle: "تسخير الجن لسليمان",
    classification: "miracle",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "Some of the jinn are made to work under Sulaiman's authority, by his Lord's permission, building what he willed.",
    passage: { id: "sulaimanjinn-p", surahNumber: 34, ayahStart: 12, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "sulaimanjinn-sad", surahNumber: 38, ayahStart: 37, ayahEnd: 38, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["sulaiman"],
    statusNotes: [
      "No existing Event corresponds to this occurrence specifically — intentionally left without an `eventIds` link, matching `sulaimanwind`'s own note.",
    ],
  },
  {
    id: "badrangels",
    title: "Angelic Reinforcement at Badr",
    arabicTitle: "نزول الملائكة يوم بدر",
    classification: "divine_aid",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "In answer to the believers' plea for aid, Allah sends a thousand angels, one after another, to support them at Badr.",
    passage: { id: "badrangels-p", surahNumber: 8, ayahStart: 9, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    personIds: ["muhammad"],
    placeIds: ["badr"],
    eventIds: ["battlebadr"],
    statusNotes: [
      "Deliberately cites Al-Anfal 8:9-12 (unambiguously Badr's own surah) rather than Aal-i-Imran 3:124-125 — the latter's 'three thousand/five thousand angels' promise sits in a conditional passage that continues the same context as 3:121's Uhud-adjacent setup, and using it here would risk conflating the two battles the same way this platform's own Events audit (Phase 7) already flagged and avoided for Uhud.",
    ],
  },
  {
    id: "ahzabwind",
    title: "The Wind and Unseen Forces at the Confederates' Siege",
    arabicTitle: "الريح والجنود غير المرئية يوم الأحزاب",
    classification: "divine_aid",
    occurrenceType: "bounded",
    sourceBasis: "quran_explicit",
    description:
      "Allah sends a storm wind and unseen forces against the besieging confederates — forces the believers themselves could not see.",
    passage: { id: "ahzabwind-p", surahNumber: 33, ayahStart: 9, ayahEnd: 9, source: "quran", verificationStatus: "verified" },
    personIds: ["muhammad"],
    placeIds: ["madinah"],
    eventIds: ["siegeconfederates"],
    statusNotes: [
      "The wind/unseen-forces claim itself is explicit in 33:9 and graded `quran_explicit` here, even though the linked Event's own overall siege-identification (`siegeconfederates`) is more cautiously graded `quran_context` — these are two different claims (this Sign's specific claim vs. the Event's broader identification), correctly graded independently rather than inherited wholesale.",
    ],
  },
];

export const getSignById = (id: string): QuranSign | undefined =>
  QURAN_SIGNS.find((s) => s.id === id);

// ============================================================
// Candidates investigated and deliberately excluded (per the approved
// Phase 8 audit) — not oversights:
//   - Splitting of the Moon (54:1) — its identification as a past,
//     historically-witnessed miracle (vs. an eschatological sign of the
//     Hour's nearness) is genuinely disputed among exegetes; excluded
//     rather than included with a `disputed` hedge, pending explicit
//     future direction.
//   - Dawud's iron made soft (34:10) and mountains/birds glorifying with
//     him (21:79, 34:10) — legitimate candidates, but outside the
//     approved 14; not added without explicit approval.
//   - A separate "virgin birth" Sign entry — already the `isabirth`
//     Event's own primary content; would duplicate it with no distinct
//     sign-lens to add.
//   - A third staff/serpent occurrence — only two genuine textual
//     moments exist (the calling, the magicians' contest); not
//     fragmented further.
//   - Recurring cosmic/natural signs (rain, ships, bees, night/day) —
//     none were in the approved candidate list; not manufactured to
//     exercise `occurrenceType: "recurring"` or `classification: "sign"`.
// ============================================================
