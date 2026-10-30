// Duas — dataset types + data (Phase 6 of
// quranic_knowledge_platform_phased_plan.md). Qur'an-grounded supplications
// only — see this file's own inclusion rule and source-basis discipline
// below before adding anything here.
//
// ============================================================
// ARCHITECTURE DECISION — Arabic text, translation, and transliteration
// (explicitly required by this phase's own instructions)
// ============================================================
// This dataset stores NO Arabic text, translation, or transliteration of
// its own. Every dua entry is defined by a `passage` (surah/ayah range)
// into the real Qur'an — the same `RelatedPassage` shape every other
// module already uses — and the UI fetches Arabic/translation live via
// this app's EXISTING content pipeline (`useVerse()` -> `VerseService` ->
// quranapi.pages.dev, already returning `arabic1`/`arabic2`/`english`/
// `urdu`/`bengali` per ayah, exactly as AyahReferenceCard.vue already
// consumes it). Storing a second copy of Qur'an text in this file would be
// the "second Arabic source" this phase explicitly prohibits, and would
// drift from the canonical text over time.
//
// Transliteration specifically (checked before writing anything, per this
// phase's explicit licensing checkpoint):
//   - Inspected first: this app's existing content API
//     (quranapi.pages.dev, queried live at authoring time) returns
//     arabic1/arabic2/english/urdu/bengali/audio per ayah — NO
//     transliteration field. The only existing transliteration in this
//     codebase is hand-typed, short, per-entry strings for the Tasbeeh
//     presets and the 99 Names (app/composables/useTasbeeh.ts,
//     app/assets/data/names.json) — not infrastructure for full ayahs,
//     and not reusable here.
//   - Source selected: `api.alquran.cloud`'s `en.transliteration` edition
//     — the SAME provider this app already integrates for Module 3
//     (Search) and Places' page-reads (see MODULE_BLUEPRINT.md). Verified
//     live (e.g. `GET /v1/ayah/21:87/en.transliteration` — HTTP 200,
//     verse-level Latin-script text) before this decision was made, not
//     assumed.
//   - Granularity: verse-level (one string per whole ayah), not
//     word-level — there is no word-level transliteration source
//     available to this app. This directly shapes how partial-ayah duas
//     are handled (see `isPartialAyah` below).
//   - Licensing/redistribution: NOTHING is copied into this repository.
//     The transliteration is fetched live at render time, the same
//     architectural pattern this app already uses for Arabic text,
//     translations, tafsir, and audio (per CLAUDE.md: "fetched from
//     external content APIs, cached indefinitely," never bundled as a
//     static local dataset) — so no new redistribution-rights question is
//     introduced; this app was never going to "own" a copy of this text
//     either way.
//   - Extracted (partial-ayah) dua segments: since only verse-level
//     transliteration exists, a partial-ayah dua's UI displays the FULL
//     ayah's transliteration, clearly labeled as covering more than the
//     quoted dua segment — never a hand-produced partial transliteration,
//     which would risk silent transcription errors across dozens of
//     entries (a risk this phase's own instructions explicitly flagged).
//
// ============================================================
// ARCHITECTURE DECISION — data model
// ============================================================
// A dua is defined by exactly ONE primary Qur'an passage (unlike Stories/
// Themes, which cite many) — `passage: RelatedPassage`, singular, not an
// array. `parallelPassages?: RelatedPassage[]` was added ONLY after
// discovering real, repeated-wording duas during the audit (Zakariyya's
// prayer for a son appears near-identically at 19:4-6, 3:38, and 21:89;
// Nuh's plea for help against his people at 23:26 and 54:10) — one
// canonical entry per distinct REQUEST, with every textual occurrence
// listed, rather than duplicating the same dua as separate entries. This
// is the concrete resolution of this phase's own "duplicate handling"
// requirement, not a speculative field.
//
// `speakerType` deliberately has three values, not a bare optional
// personId — "For generic believer supplications, do NOT invent a
// person" is a direct instruction from this phase, so the type forces a
// choice: a real Person (`personId` set), the believers generally
// (`speakerLabel` describing which group, e.g. "the believers," "the
// servants of the Most Merciful"), or an unspecified narrative figure
// (past communities/warriors described but not named/profiled — also
// `speakerLabel`, not a fabricated Person entry).
//
// No `sources: SourceReference[]` field (unlike Stories/Themes/Places) —
// a dua's source IS its `passage`; a parallel citation array would only
// restate what `passage`/`parallelPassages` already state.
import type { RelatedPassage } from "~/utils/quranReference";

export type DuaSourceBasis =
  | "quran_explicit" // the words of the dua/prayer appear directly in the Qur'an text
  | "quran_narrative" // a person is described calling upon Allah, with their words preserved
  | "quran_instruction"; // a command/instruction ("and say...") presenting exact words to pray

export type DuaCategory =
  | "forgiveness"
  | "guidance"
  | "protection"
  | "mercy"
  | "family"
  | "provision"
  | "patience"
  | "gratitude"
  | "knowledge"
  | "worship"
  | "repentance"
  | "help"
  | "faith"
  | "hereafter";

export type DuaSpeakerType = "person" | "believers_general" | "unspecified_narrative";

export type QuranDua = {
  id: string;

  title: string;
  arabicTitle: string;

  sourceBasis: DuaSourceBasis;
  category: DuaCategory;

  passage: RelatedPassage;
  /** Set only when this exact request/dua recurs, in whole or near-
   * identical wording, at other Qur'an locations — not for merely
   * thematically-similar duas (see file header). */
  parallelPassages?: RelatedPassage[];

  /** True when `passage` covers a whole ayah that contains narrative
   * material beyond the dua itself, or when the dua is only a clause
   * within a longer ayah — the UI uses this to label the fetched
   * Arabic/translation/transliteration as "full ayah shown" rather than
   * implying every word belongs to the dua. */
  isPartialAyah: boolean;
  /** Required when isPartialAyah is true — describes in plain English
   * which portion of the ayah/range is the actual dua wording. */
  segmentNote?: string;

  /** The narrative situation the dua occurs in. */
  context: string;
  /** What the dua asks for, in plain English — not a re-translation of
   * the ayah (the live-fetched translation already provides that). */
  askingFor: string;

  speakerType: DuaSpeakerType;
  /** Set only when speakerType === "person" — a real Persons-module id
   * (individual or, per Phase 4's own precedent, a `entityType: "group"`
   * Persons-module entry, e.g. Pharaoh's Magicians). */
  personId?: string;
  /** Set when speakerType !== "person" — a short descriptive label
   * ("the believers," "the servants of the Most Merciful," "believing
   * warriors of earlier communities"), never a fabricated proper name. */
  speakerLabel?: string;

  storyId?: string;
  themeIds?: string[];
  communityIds?: string[];
  placeIds?: string[];

  statusNotes?: string[];
};

export const QURAN_DUAS: QuranDua[] = [
  {
    id: "adamrepentance",
    title: "Adam's Prayer of Repentance",
    arabicTitle: "دعاء آدم وحواء",
    sourceBasis: "quran_narrative",
    category: "repentance",
    passage: { id: "adamrepentance-p", surahNumber: 7, ayahStart: 23, ayahEnd: 23, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Adam and his wife's prayer immediately after eating from the forbidden tree and recognizing their fault.",
    askingFor: "Forgiveness and mercy, acknowledging they have wronged themselves.",
    speakerType: "person",
    personId: "adam",
    storyId: "adamandiblis",
    themeIds: ["tawbah", "forgiveness"],
    statusNotes: [
      "The ayah uses the dual form ('qala,' 'they both said') — Adam's wife joins this prayer, though she has no separate Persons-module entry (the Qur'an does not name her); this entry is attributed to Adam per the dataset's existing Persons-module convention for his own page.",
    ],
  },
  {
    id: "nuhclosingprayer",
    title: "Nuh's Closing Prayer",
    arabicTitle: "دعاء نوح الختامي",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "nuhclosingprayer-p", surahNumber: 71, ayahStart: 26, ayahEnd: 28, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "The closing verses of Surah Nuh, after his account of his people's rejection and their specific idols.",
    askingFor: "That no disbeliever be left on earth, and forgiveness for himself, his parents, and every believing man and woman.",
    speakerType: "person",
    personId: "nuh",
    storyId: "nuhflood",
    themeIds: ["forgiveness", "tawhid"],
  },
  {
    id: "nuhhelpprayer",
    title: "Nuh's Prayer for Help",
    arabicTitle: "دعاء نوح بالنصر",
    sourceBasis: "quran_explicit",
    category: "help",
    passage: { id: "nuhhelpprayer-p", surahNumber: 23, ayahStart: 26, ayahEnd: 26, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "nuhhelpprayer-parallel-qamar", surahNumber: 54, ayahStart: 10, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
    ],
    isPartialAyah: false,
    context: "Nuh's plea during his mission, after his people persistently denied him.",
    askingFor: "Allah's support/help because his own people have called him a liar.",
    speakerType: "person",
    personId: "nuh",
    storyId: "nuhflood",
    themeIds: ["trials"],
    statusNotes: [
      "This same request recurs in near-identical wording at 54:10, listed as a parallel passage rather than a separate entry — one dua, two textual occurrences.",
    ],
  },
  {
    id: "ibrahimkabah",
    title: "Ibrahim and Isma'il's Prayer at the Ka'bah",
    arabicTitle: "دعاء إبراهيم وإسماعيل عند رفع القواعد",
    sourceBasis: "quran_explicit",
    category: "worship",
    passage: { id: "ibrahimkabah-p", surahNumber: 2, ayahStart: 127, ayahEnd: 129, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Ibrahim and Isma'il's prayer while raising the foundations of the House.",
    askingFor: "Acceptance of their work, being made submitted to Allah, a nation of believers among their descendants, and a future messenger raised from among them.",
    speakerType: "person",
    personId: "ibrahim",
    storyId: "ibrahimnarrative",
    placeIds: ["makkah", "almasjidalharam"],
    themeIds: ["prayer", "prophethood"],
  },
  {
    id: "ibrahimmakkahsettlement",
    title: "Ibrahim's Prayer for Makkah and His Descendants",
    arabicTitle: "دعاء إبراهيم لمكة وذريته",
    sourceBasis: "quran_explicit",
    category: "family",
    passage: { id: "ibrahimmakkahsettlement-p", surahNumber: 14, ayahStart: 35, ayahEnd: 41, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Ibrahim's prayer after settling some of his descendants 'in a valley without vegetation' near the House.",
    askingFor: "Security for the city, protection from idolatry for himself and his descendants, that his descendants establish prayer, and forgiveness for himself, his parents, and the believers.",
    speakerType: "person",
    personId: "ibrahim",
    placeIds: ["makkah"],
    themeIds: ["prayer", "parents"],
    statusNotes: [
      "Kept as a separate entry from the Ka'bah-raising prayer (2:127-129) — different surah, different specific focus (the city's security and his descendants' settlement, not the raising of the House itself), though clearly related in occasion.",
    ],
  },
  {
    id: "ibrahimwisdomprayer",
    title: "Ibrahim's Prayer for Wisdom and His Father",
    arabicTitle: "دعاء إبراهيم بالحكم والمغفرة لأبيه",
    sourceBasis: "quran_explicit",
    category: "guidance",
    passage: { id: "ibrahimwisdomprayer-p", surahNumber: 26, ayahStart: 83, ayahEnd: 89, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Ibrahim's prayer within his account of confronting his people's idolatry, in Surah Ash-Shu'ara.",
    askingFor: "Wisdom, being joined with the righteous, a truthful legacy among later generations, Paradise, forgiveness for his father, and not being disgraced on the Day of Resurrection.",
    speakerType: "person",
    personId: "ibrahim",
    storyId: "ibrahimnarrative",
    themeIds: ["guidance", "forgiveness"],
    statusNotes: [
      "His prayer for his father's forgiveness here is the same request the Qur'an later says (9:113-114) he withdrew once it became clear his father remained an enemy of Allah — already documented on Azar's and Ibrahim's own Persons-module entries; this dua entry states the prayer as made, not its later withdrawal.",
    ],
  },
  {
    id: "ibrahimrighteoussonprayer",
    title: "Ibrahim's Prayer for a Righteous Son",
    arabicTitle: "دعاء إبراهيم بالولد الصالح",
    sourceBasis: "quran_explicit",
    category: "family",
    passage: { id: "ibrahimrighteoussonprayer-p", surahNumber: 37, ayahStart: 100, ayahEnd: 100, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Ibrahim's prayer immediately before the narrative of the trial of sacrifice, in Surah As-Saffat.",
    askingFor: "A son from among the righteous.",
    speakerType: "person",
    personId: "ibrahim",
    storyId: "ibrahimnarrative",
    themeIds: ["family"],
  },
  {
    id: "ibrahimdisavowalprayer",
    title: "Ibrahim's Prayer of Reliance and Disavowal",
    arabicTitle: "دعاء إبراهيم بالتوكل والبراءة",
    sourceBasis: "quran_explicit",
    category: "faith",
    passage: { id: "ibrahimdisavowalprayer-p", surahNumber: 60, ayahStart: 4, ayahEnd: 5, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Quoted approvingly as 'an excellent example' — Ibrahim's and his companions' words on disowning their people's disbelief.",
    askingFor: "Not to be made a trial for the disbelievers, and forgiveness — expressed alongside a declared reliance on and return to Allah alone.",
    speakerType: "person",
    personId: "ibrahim",
    themeIds: ["tawakkul", "shirk"],
  },
  {
    id: "lutrescueprayer",
    title: "Lut's Prayer for Rescue",
    arabicTitle: "دعاء لوط بالنجاة",
    sourceBasis: "quran_explicit",
    category: "protection",
    passage: { id: "lutrescueprayer-p", surahNumber: 26, ayahStart: 169, ayahEnd: 169, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Lut's prayer amid his people's practice, in Surah Ash-Shu'ara.",
    askingFor: "To be saved, along with his family, from what his people do.",
    speakerType: "person",
    personId: "lut",
    storyId: "lutandhispeople",
  },
  {
    id: "luthelpprayer",
    title: "Lut's Prayer for Help",
    arabicTitle: "دعاء لوط بالنصر",
    sourceBasis: "quran_explicit",
    category: "help",
    passage: { id: "luthelpprayer-p", surahNumber: 29, ayahStart: 30, ayahEnd: 30, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Lut's prayer in Surah Al-Ankabut's retelling of his account.",
    askingFor: "Support against the corrupting people.",
    speakerType: "person",
    personId: "lut",
    storyId: "lutandhispeople",
  },
  {
    id: "yusuftemptationprayer",
    title: "Yusuf's Prayer Against Temptation",
    arabicTitle: "دعاء يوسف من الفتنة",
    sourceBasis: "quran_explicit",
    category: "protection",
    passage: { id: "yusuftemptationprayer-p", surahNumber: 12, ayahStart: 33, ayahEnd: 33, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Yusuf's words during the temptation by his master's wife, preferring prison to what he is invited toward.",
    askingFor: "That Allah turn away the women's scheme from him, lest he incline toward them.",
    speakerType: "person",
    personId: "yusuf",
    storyId: "yusufstory",
    themeIds: ["trials"],
  },
  {
    id: "yusuffinalprayer",
    title: "Yusuf's Prayer of Gratitude at the Reunion",
    arabicTitle: "دعاء يوسف عند اللقاء",
    sourceBasis: "quran_explicit",
    category: "gratitude",
    passage: { id: "yusuffinalprayer-p", surahNumber: 12, ayahStart: 101, ayahEnd: 101, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Yusuf's own words after his family's reunion, near the close of Surah Yusuf.",
    askingFor: "To die as one submitted to Allah (a Muslim) and be joined with the righteous, acknowledging the authority and knowledge he was given.",
    speakerType: "person",
    personId: "yusuf",
    storyId: "yusufstory",
    themeIds: ["shukr", "resurrection"],
  },
  {
    id: "musacallingprayer",
    title: "Musa's Prayer at His Calling",
    arabicTitle: "دعاء موسى عند التكليف",
    sourceBasis: "quran_explicit",
    category: "help",
    passage: { id: "musacallingprayer-p", surahNumber: 20, ayahStart: 25, ayahEnd: 35, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's response immediately after being commissioned at the sacred valley.",
    askingFor: "That his chest be expanded, his task eased, the knot loosened from his speech, and his brother Harun appointed to share the task with him.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandpharaoh",
  },
  {
    id: "musaforgivenessprayer",
    title: "Musa's Prayer After the Accidental Killing",
    arabicTitle: "دعاء موسى بعد قتل القبطي",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "musaforgivenessprayer-p", surahNumber: 28, ayahStart: 16, ayahEnd: 16, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer immediately after the accidental killing in Egypt.",
    askingFor: "Forgiveness, acknowledging he has wronged himself.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandpharaoh",
    themeIds: ["forgiveness"],
  },
  {
    id: "musasafetyprayer",
    title: "Musa's Prayer for Safety",
    arabicTitle: "دعاء موسى بالنجاة من القوم الظالمين",
    sourceBasis: "quran_explicit",
    category: "protection",
    passage: { id: "musasafetyprayer-p", surahNumber: 28, ayahStart: 21, ayahEnd: 21, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer while fleeing Egypt, shortly after the killing.",
    askingFor: "To be saved from the wrongdoing people.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandpharaoh",
  },
  {
    id: "musamadyanprayer",
    title: "Musa's Prayer at the Well of Madyan",
    arabicTitle: "دعاء موسى عند بئر مدين",
    sourceBasis: "quran_explicit",
    category: "provision",
    passage: { id: "musamadyanprayer-p", surahNumber: 28, ayahStart: 24, ayahEnd: 24, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer after helping the two women water their flock and withdrawing to shade, before being taken in.",
    askingFor: "Whatever good Allah would send down to him, acknowledging his own need.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandpharaoh",
    communityIds: ["madyan"],
  },
  {
    id: "musagoldencalfprayer",
    title: "Musa's Prayer After the Golden Calf",
    arabicTitle: "دعاء موسى بعد العجل",
    sourceBasis: "quran_explicit",
    category: "mercy",
    passage: { id: "musagoldencalfprayer-p", surahNumber: 7, ayahStart: 151, ayahEnd: 151, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer for himself and Harun on returning to find the golden calf worshipped.",
    askingFor: "Forgiveness for himself and his brother, and entry into Allah's mercy.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandbaniisrael",
    themeIds: ["mercy", "forgiveness"],
  },
  {
    id: "musaelderquakeprayer",
    title: "Musa's Prayer After the Mountain's Shaking",
    arabicTitle: "دعاء موسى بعد رجفة الجبل",
    sourceBasis: "quran_explicit",
    category: "mercy",
    passage: { id: "musaelderquakeprayer-p", surahNumber: 7, ayahStart: 155, ayahEnd: 156, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer after the chosen seventy of his people were seized by a quaking, following the golden calf incident.",
    askingFor: "Not to be destroyed for what the foolish among his people did, and good in this world and the Hereafter.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandbaniisrael",
    themeIds: ["mercy", "resurrection"],
  },
  {
    id: "musaprayeragainstfiraun",
    title: "Musa's Prayer Against Fir'aun",
    arabicTitle: "دعاء موسى على فرعون",
    sourceBasis: "quran_explicit",
    category: "help",
    passage: { id: "musaprayeragainstfiraun-p", surahNumber: 10, ayahStart: 88, ayahEnd: 88, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Musa's prayer against Fir'aun and his court's persistent rejection.",
    askingFor: "That Fir'aun's wealth be obliterated and his heart hardened, so that he not believe until he sees the painful punishment.",
    speakerType: "person",
    personId: "musa",
    storyId: "musaandpharaoh",
    communityIds: ["aalfiraun"],
    statusNotes: [
      "10:89 states the prayer was accepted and addresses BOTH Musa and Harun ('your supplication,' dual form) even though only Musa's words are quoted — traditionally understood as Harun affirming ('Ameen') during the prayer; this entry attributes authorship to Musa per the quoted text, with Harun's role noted here rather than asserted as a second speaker.",
    ],
  },
  {
    id: "shuaybjudgmentprayer",
    title: "Shu'ayb's Prayer for Judgment",
    arabicTitle: "دعاء شعيب بالفتح",
    sourceBasis: "quran_explicit",
    category: "help",
    passage: { id: "shuaybjudgmentprayer-p", surahNumber: 7, ayahStart: 89, ayahEnd: 89, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Shu'ayb's response after his people threatened to expel him and those who believed with him.",
    askingFor: "That Allah decide with truth between him and his people.",
    speakerType: "person",
    personId: "shuayb",
    communityIds: ["madyan"],
    themeIds: ["justice"],
  },
  {
    id: "ayyubaffliction",
    title: "The Dua of Ayyub",
    arabicTitle: "دعاء أيوب",
    sourceBasis: "quran_explicit",
    category: "patience",
    passage: { id: "ayyubaffliction-p", surahNumber: 21, ayahStart: 83, ayahEnd: 83, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Ayyub's prayer amid his prolonged affliction.",
    askingFor: "Relief, appealing to Allah as the Most Merciful of the merciful — without listing demands or complaints against Allah.",
    speakerType: "person",
    personId: "ayyub",
    storyId: "ayyubstory",
    themeIds: ["sabr", "mercy"],
  },
  {
    id: "yunusindarkness",
    title: "The Dua of Yunus",
    arabicTitle: "دعاء يونس (ذو النون)",
    sourceBasis: "quran_narrative",
    category: "repentance",
    passage: { id: "yunusindarkness-p", surahNumber: 21, ayahStart: 87, ayahEnd: 87, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua itself is the quoted portion beginning 'lā ilāha illā anta' ('there is no deity except You'); the ayah's opening clauses narrate his flight and the reason he called out, which are not part of the dua's own words.",
    context: "Yunus's call from within the darkness — traditionally understood as the darkness of the fish's belly, the sea, and the night together — after leaving his people without permission.",
    askingFor: "Nothing is directly petitioned; the words are a declaration of Allah's oneness and glory, and an acknowledgment of his own wrongdoing.",
    speakerType: "person",
    personId: "yunus",
    storyId: "yunusstory",
    communityIds: ["peopleofyunus"],
    themeIds: ["tawhid", "tawbah"],
    statusNotes: [
      "One of the most frequently cited Qur'anic supplications; despite containing no explicit request, it is treated as a dua per long-standing convention (and per a well-known hadith describing it as such) — included here on the strength of its own Qur'anic narrative framing ('he called out,' 21:87) as an act of supplication, not merely a statement.",
    ],
  },
  {
    id: "zakariyyasonprayer",
    title: "Zakariyya's Prayer for a Son",
    arabicTitle: "دعاء زكريا بالولد",
    sourceBasis: "quran_explicit",
    category: "family",
    passage: { id: "zakariyyasonprayer-p", surahNumber: 19, ayahStart: 4, ayahEnd: 6, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "zakariyyasonprayer-parallel-imran", surahNumber: 3, ayahStart: 38, ayahEnd: 38, source: "quran", verificationStatus: "verified" },
      { id: "zakariyyasonprayer-parallel-anbiya", surahNumber: 21, ayahStart: 89, ayahEnd: 89, source: "quran", verificationStatus: "verified" },
    ],
    isPartialAyah: false,
    context: "Zakariyya's private prayer in old age, with a barren wife, worried for who would carry on after him.",
    askingFor: "A righteous heir, an inheritor of guidance from his own family line.",
    speakerType: "person",
    personId: "zakariyya",
    storyId: "zakariyyayahya",
    themeIds: ["family", "hope"],
    statusNotes: [
      "This same request is narrated three times (19:4-6, 3:38, 21:89) in different words but the same substance — one canonical entry, with 3:38 and 21:89 listed as parallel passages rather than separate entries.",
    ],
  },
  {
    id: "sulaimangratitudeprayer",
    title: "Sulaiman's Prayer of Gratitude",
    arabicTitle: "دعاء سليمان بالشكر",
    sourceBasis: "quran_explicit",
    category: "gratitude",
    passage: { id: "sulaimangratitudeprayer-p", surahNumber: 27, ayahStart: 19, ayahEnd: 19, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Sulaiman's response on hearing an ant warn its colony of his approaching army, smiling in amusement at its speech.",
    askingFor: "To be enabled to be grateful for Allah's favor upon him and his parents, and to do righteous deeds Allah approves of.",
    speakerType: "person",
    personId: "sulaiman",
    themeIds: ["shukr"],
  },
  {
    id: "sulaimankingdomprayer",
    title: "Sulaiman's Prayer for Kingship",
    arabicTitle: "دعاء سليمان بالملك",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "sulaimankingdomprayer-p", surahNumber: 38, ayahStart: 35, ayahEnd: 35, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Sulaiman's prayer in Surah Sad, following the account of the horses that distracted him from remembrance.",
    askingFor: "Forgiveness, and a kingship unmatched by anyone after him.",
    speakerType: "person",
    personId: "sulaiman",
    themeIds: ["forgiveness"],
  },
  {
    id: "isatableprayerdua",
    title: "Isa's Prayer for the Table",
    arabicTitle: "دعاء عيسى بالمائدة",
    sourceBasis: "quran_explicit",
    category: "provision",
    passage: { id: "isatableprayerdua-p", surahNumber: 5, ayahStart: 114, ayahEnd: 114, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Isa's own prayer following his disciples' request for a table of food sent down from heaven.",
    askingFor: "A table from heaven as a recurring occasion of celebration and a sign, together with provision.",
    speakerType: "person",
    personId: "isa",
    storyId: "maryamandisa",
    statusNotes: [
      "The disciples (Hawariyyun) who requested the table are a People & Groups entry, not a Peoples & Nations community — see MODULE_BLUEPRINT.md's Phase 0 note on group entities living in the Persons dataset. This dua is attributed to Isa alone, per the quoted text (5:114); the disciples' own preceding request (5:112) is their dialogue with Isa, not itself a supplication to Allah.",
    ],
  },
  {
    id: "muhammadentryexitprayer",
    title: "Prayer for a Sound Entrance and Exit",
    arabicTitle: "دعاء مدخل صدق ومخرج صدق",
    sourceBasis: "quran_instruction",
    category: "help",
    passage: { id: "muhammadentryexitprayer-p", surahNumber: 17, ayahStart: 80, ayahEnd: 80, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua is the portion following 'wa qul' ('and say'); the instruction verb itself is not part of the prayer's own words.",
    context: "An instruction given directly to the Prophet ﷺ.",
    askingFor: "A sound/truthful entrance and exit, and a supporting authority from Allah.",
    speakerType: "person",
    personId: "muhammad",
  },
  {
    id: "muhammadknowledgeprayer",
    title: "Prayer for Increase in Knowledge",
    arabicTitle: "رب زدني علما",
    sourceBasis: "quran_instruction",
    category: "knowledge",
    passage: { id: "muhammadknowledgeprayer-p", surahNumber: 20, ayahStart: 114, ayahEnd: 114, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua is the portion following 'wa qul' ('and say').",
    context: "An instruction given directly to the Prophet ﷺ, in Surah Ta-Ha.",
    askingFor: "An increase in knowledge.",
    speakerType: "person",
    personId: "muhammad",
  },
  {
    id: "muhammadrefugeprayer",
    title: "Prayer for Refuge from the Devils' Incitements",
    arabicTitle: "دعاء الاستعاذة من همزات الشياطين",
    sourceBasis: "quran_instruction",
    category: "protection",
    passage: { id: "muhammadrefugeprayer-p", surahNumber: 23, ayahStart: 97, ayahEnd: 98, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua is the portion following 'wa qul' ('and say').",
    context: "An instruction given directly to the Prophet ﷺ, in Surah Al-Mu'minun.",
    askingFor: "Refuge from the incitements of devils, and from their presence.",
    speakerType: "person",
    personId: "muhammad",
  },
  {
    id: "muhammadmercyprayer",
    title: "Prayer for Forgiveness and Mercy",
    arabicTitle: "رب اغفر وارحم",
    sourceBasis: "quran_instruction",
    category: "mercy",
    passage: { id: "muhammadmercyprayer-p", surahNumber: 23, ayahStart: 118, ayahEnd: 118, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua is the portion following 'wa qul' ('and say').",
    context: "An instruction given directly to the Prophet ﷺ, closing Surah Al-Mu'minun.",
    askingFor: "Forgiveness and mercy.",
    speakerType: "person",
    personId: "muhammad",
    themeIds: ["mercy", "forgiveness"],
  },
  {
    id: "rabbanabaqarahclosing",
    title: "The Closing Prayer of Al-Baqarah",
    arabicTitle: "دعاء خاتمة سورة البقرة",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "rabbanabaqarahclosing-p", surahNumber: 2, ayahStart: 286, ayahEnd: 286, source: "quran", verificationStatus: "verified" },
    isPartialAyah: true,
    segmentNote: "The dua occupies the second half of this long ayah, following its opening statement about not being burdened beyond capacity.",
    context: "The believers' own prayer, closing Surah Al-Baqarah.",
    askingFor: "Not to be blamed for forgetfulness or mistake, not to bear a burden as those before them did, not to be given a weight beyond capacity, pardon, forgiveness, mercy, and support against disbelieving people.",
    speakerType: "believers_general",
    speakerLabel: "The believers",
    themeIds: ["forgiveness"],
  },
  {
    id: "rabbanaheartprayer",
    title: "Prayer Against the Heart's Deviation",
    arabicTitle: "دعاء عدم زيغ القلوب",
    sourceBasis: "quran_explicit",
    category: "guidance",
    passage: { id: "rabbanaheartprayer-p", surahNumber: 3, ayahStart: 8, ayahEnd: 8, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Attributed to 'those firmly grounded in knowledge,' immediately after a description of guarding against unclear/ambiguous verses.",
    askingFor: "That their hearts not deviate after being guided, and mercy from Allah.",
    speakerType: "believers_general",
    speakerLabel: "Those firmly grounded in knowledge",
    themeIds: ["guidance"],
  },
  {
    id: "rabbanabelievedprayer",
    title: "Prayer of the Believing",
    arabicTitle: "ربنا آمنا فاغفر لنا",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "rabbanabelievedprayer-p", surahNumber: 3, ayahStart: 16, ayahEnd: 16, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Presented alongside other qualities of 'those who are righteous' in Surah Aal-i-Imran.",
    askingFor: "Forgiveness of sins and protection from the Fire's punishment, on the basis of having believed.",
    speakerType: "believers_general",
    speakerLabel: "The believers",
    themeIds: ["forgiveness", "faith"],
  },
  {
    id: "rabbanasteadfastprayer",
    title: "The Warriors' Prayer for Steadfastness",
    arabicTitle: "دعاء الثبات عند القتال",
    sourceBasis: "quran_narrative",
    category: "patience",
    passage: { id: "rabbanasteadfastprayer-p", surahNumber: 3, ayahStart: 147, ayahEnd: 147, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "The prayer of righteous companions who fought alongside earlier prophets, described as not weakening despite hardship, humiliation, or loss.",
    askingFor: "Forgiveness for their sins and excesses, firm feet, and support against a disbelieving people.",
    speakerType: "unspecified_narrative",
    speakerLabel: "Believing companions of earlier prophets",
    themeIds: ["sabr", "forgiveness"],
  },
  {
    id: "rabbanaululalbab",
    title: "The Prayer of the People of Understanding",
    arabicTitle: "دعاء أولي الألباب",
    sourceBasis: "quran_explicit",
    category: "hereafter",
    passage: { id: "rabbanaululalbab-p", surahNumber: 3, ayahStart: 191, ayahEnd: 194, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Following a description of those who reflect on the creation of the heavens and earth while remembering Allah in every posture, closing Surah Aal-i-Imran's central passage.",
    askingFor: "Protection from the Fire, that their deeds not be in vain, forgiveness and covering of sins, to die among the righteous, and the fulfillment of what was promised through the messengers.",
    speakerType: "believers_general",
    speakerLabel: "Those who reflect on creation ('people of understanding')",
    themeIds: ["creation", "resurrection"],
  },
  {
    id: "rabbanafamilyprayer",
    title: "Prayer for Righteous Family",
    arabicTitle: "دعاء قرة الأعين",
    sourceBasis: "quran_explicit",
    category: "family",
    passage: { id: "rabbanafamilyprayer-p", surahNumber: 25, ayahStart: 74, ayahEnd: 74, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Described as a characteristic prayer of 'the servants of the Most Merciful,' in Surah Al-Furqan.",
    askingFor: "Comfort of the eyes through spouses and offspring, and to be made a model for the righteous.",
    speakerType: "believers_general",
    speakerLabel: "The servants of the Most Merciful",
    themeIds: ["family"],
  },
  {
    id: "rabbanalaterbelieversprayer",
    title: "Prayer for Those Who Came Before in Faith",
    arabicTitle: "دعاء اللاحقين للسابقين بالإيمان",
    sourceBasis: "quran_explicit",
    category: "forgiveness",
    passage: { id: "rabbanalaterbelieversprayer-p", surahNumber: 59, ayahStart: 10, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Described as the prayer of 'those who came after' earlier believers, in Surah Al-Hashr.",
    askingFor: "Forgiveness for themselves and for those who preceded them in faith, and freedom from ill-will toward other believers.",
    speakerType: "believers_general",
    speakerLabel: "Later believers, regarding those who came before them",
    themeIds: ["forgiveness"],
  },
  {
    id: "saharaconversionprayer",
    title: "The Magicians' Prayer After Believing",
    arabicTitle: "دعاء السحرة بعد الإيمان",
    sourceBasis: "quran_explicit",
    category: "patience",
    passage: { id: "saharaconversionprayer-p", surahNumber: 7, ayahStart: 126, ayahEnd: 126, source: "quran", verificationStatus: "verified" },
    isPartialAyah: false,
    context: "Pharaoh's magicians' prayer immediately after falling into prostration in belief, upon seeing Musa's staff overtake what they had produced — spoken right after Fir'aun threatens them for it.",
    askingFor: "Patience poured upon them, and to die as ones submitted to Allah.",
    speakerType: "person",
    personId: "sahara",
    storyId: "musaandpharaoh",
    themeIds: ["sabr"],
  },
];

export const getDuaById = (id: string): QuranDua | undefined =>
  QURAN_DUAS.find((d) => d.id === id);

// ============================================================
// Boundary cases explicitly investigated and excluded (per this phase's
// "document boundary cases" and "do not resolve ambiguous cases by
// guesswork" instructions):
//
// - Ya'qub, 12:86 ("I only complain of my suffering and grief to Allah")
//   — EXCLUDED as its own dua entry. This is Ya'qub's own STATEMENT about
//   where he directs his grief, not itself the content of a petition
//   ("grant me X") — a narrative description adjacent to prayer, not a
//   preserved supplication's own words. Genuinely borderline; documented
//   rather than silently included or silently dropped.
// - Musa, 28:16 and 28:21 — kept as two SEPARATE entries rather than
//   merged, despite occurring within the same flight sequence: they are
//   textually distinct ayahs with different specific requests
//   (self-forgiveness vs. safety from a specific people), matching how
//   Lut's two short duas (26:169, 29:30) were also kept separate.
// - Ordinary requests between people (e.g. Yusuf's brothers' pleas to
//   their father, the disciples asking Isa for the table before HIS OWN
//   prayer for it) are not catalogued as duas themselves — only Isa's own
//   subsequent address TO ALLAH (5:114) is included; the disciples'
//   request to Isa (5:112) is dialogue between people, not supplication.
// - Zulaikha/Al-'Aziz's wife's line to her husband, Ya'qub's sons'
//   requests to buy grain, and similar ordinary inter-human dialogue
//   across the Stories module are not duas regardless of containing a
//   request — consistent with this phase's own explicit example
//   ("Give us food..." excluded when it is dialogue between humans).
// ============================================================
