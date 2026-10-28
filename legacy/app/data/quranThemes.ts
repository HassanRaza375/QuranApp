// Themes — dataset types + data (Phase 5 of
// quranic_knowledge_platform_phased_plan.md). The conceptual/thematic layer
// over People & Groups, Peoples & Nations, Places, and Stories.
//
// ============================================================
// ARCHITECTURE DECISION — canonical source of truth (explicitly required
// by this phase's own instructions, not left implicit)
// ============================================================
// Chosen: a canonical QURAN_THEMES dataset, each theme CURATING its own
// explicit `storyIds`/`personIds`/`communityIds`/`placeIds` — the same
// established pattern Stories used for its own cross-module links.
//
// Rejected: mechanically migrating the existing free-text `themes: string[]`
// fields already present on 59 Person, 14 Community, 16 Place, and 21
// Story (+38 episode) entries into `themeIds: string[]` pointing at this
// dataset. Considered and explicitly rejected for three reasons: (1) those
// arrays are short, entry-specific descriptive phrases ("A prophet's
// steadfastness across a long span of time"), not normalized keywords —
// mapping ~150 existing free-text phrases onto a controlled vocabulary
// would require ~150 individual judgment calls with real risk of silently
// narrowing or misreading already-approved content, which the phased plan
// explicitly prohibits ("do not silently change the meaning of existing
// content"); (2) it would touch data across all four already-shipped,
// tested phases for a marginal DRY benefit the curated-links approach
// already delivers; (3) "computed dynamically" reverse relationships
// (matching theme names against those same free-text arrays) was also
// considered and rejected — the arrays aren't normalized enough for
// reliable automated matching (e.g. "Justice" vs "Wise counsel and
// consultation" vs "Recognizing truth over pride" are all in the same
// entry's array and are not string-matchable to one canonical theme name).
//
// What "one canonical source of truth" means here, concretely: the
// DEFINITION of what a theme covers, and which entities substantively
// illustrate it, lives in exactly one place — this file. The pre-existing
// `themes` arrays elsewhere are UNCHANGED and keep serving their original,
// narrower purpose (a quick, entry-specific descriptor) — they are not
// read by, or claimed to be authoritative for, this module. This file's
// own citations were curated fresh by reviewing each entity's actual
// content, not by string-matching those arrays.
//
// ============================================================
// ARCHITECTURE DECISION — hierarchy
// ============================================================
// Flat list + a `category` enum (6 values, matching this phase's own
// candidate groupings) — NOT a self-referential parent/child theme tree.
// A full tree was considered and rejected: the task's own example
// hierarchy is exactly two levels (category → theme) with no third tier
// shown, so a general N-deep tree would be unused complexity, and a flat
// category tag sidesteps circular-hierarchy validation entirely (there is
// no parent id to cycle through) — the same reasoning Stories applied to
// reject a separate Episode entity type. `relatedThemeIds` (a same-level,
// non-hierarchical cross-link) covers genuine conceptual adjacency
// (Tawhid ↔ Shirk, Sabr ↔ Tawakkul) without implying one is a subtype of
// the other.
//
// ============================================================
// INCLUSION RULE + TAG-EXPLOSION DISCIPLINE
// ============================================================
// A candidate becomes its own theme only if it has real independent
// Qur'anic grounding, recurs substantially (not a single incidental
// mention), has an identifiable conceptual boundary distinct from its
// neighbors, and offers real cross-module linking value. Where two
// candidates on the phase's own audit list turned out to be near-
// synonyms or two facets of one Qur'anic concept, they were MERGED into
// one theme rather than kept as separate near-duplicates — every merge is
// listed in that theme's own `statusNotes`, not silently done. 12 merge/
// exclusion decisions were made this way (see the file-end summary).
//
// ============================================================
// SOURCE DISCIPLINE — `conceptualBasis`
// ============================================================
// Distinct from IdentificationBasis (Places) and NarrativeStatus (Stories)
// — this grades whether the CONCEPT ITSELF, as a bounded category, is the
// Qur'an's own framing or a later/modern synthesis:
//   - quran_explicit_concept: the Qur'an itself repeatedly uses a specific
//     Arabic term for this exact concept (e.g. "الصبر," "الشرك").
//   - quran_derived_concept: no single recurring Qur'anic term names this
//     exact boundary, but it is a reasonable synthesis across passages
//     that clearly share one concern (e.g. "Family," "Leadership &
//     Authority").
//   - scholarly_interpretation: a category drawn substantially from later
//     scholarship's own organizing framework, not primarily from a single
//     Qur'anic term (used sparingly here — most themes below are explicit
//     or derived).
//
// ============================================================
// QUR'ANIC REFERENCE METHODOLOGY (disclosed per this phase's explicit
// "do not claim exhaustive references unless actually verified" rule)
// ============================================================
// `representativePassages` are curated, well-established proof-texts for
// each concept — NOT an exhaustive occurrence-search the way Persons/
// Places verify a named entity's exact mentions. A theme is a synthesized
// concept, not a searchable proper noun; claiming an exhaustive count
// would misrepresent what curation actually happened here. Every passage
// listed IS validated against real ayah bounds (surah.json) by this
// module's own validator, the same as every other module — only the
// SELECTION is editorial, not the bounds-checking.
import type { RelatedPassage, SourceReference } from "~/utils/quranReference";

export type ThemeCategory =
  | "belief"
  | "worship_spirituality"
  | "character"
  | "moral_warning"
  | "social_civilizational"
  | "trials_human_experience";

export type ConceptualBasis = "quran_explicit_concept" | "quran_derived_concept" | "scholarly_interpretation";

export type QuranTheme = {
  id: string;

  name: string;
  arabicName: string;
  alternateNames?: string[];

  category: ThemeCategory;
  conceptualBasis: ConceptualBasis;

  /** One or two sentences: what this concept means in this dataset. */
  definition: string;
  /** A fuller paragraph: how the Qur'an itself presents/develops it. */
  description: string;

  representativePassages: RelatedPassage[];

  storyIds?: string[];
  personIds?: string[];
  communityIds?: string[];
  placeIds?: string[];
  relatedThemeIds?: string[];

  sources?: SourceReference[];
  statusNotes?: string[];
};

export const QURAN_THEMES: QuranTheme[] = [
  // ============================== BELIEF ==============================
  {
    id: "tawhid",
    name: "Tawhid (Oneness of Allah)",
    arabicName: "التوحيد",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "The affirmation that Allah is one, without partner, in His being, worship, and names/attributes.",
    description:
      "Tawhid is the Qur'an's central, organizing claim, restated across nearly every surah in some form — from Al-Ikhlas's four-verse summary to the extended reasoning in Al-An'am and Al-Baqarah's Ayat al-Kursi. Creation itself is repeatedly presented as evidence for it (see the Creation theme), and every prophet's mission is framed around the same call: 'worship Allah; you have no deity other than Him' (7:59, 7:65, 7:73, 7:85, 11:50, 11:61, 11:84 — the recurring refrain opening nearly every prophet's address to their people in this dataset's own Stories).",
    representativePassages: [
      { id: "tawhid-ikhlas", surahNumber: 112, ayahStart: 1, ayahEnd: 4, source: "quran", verificationStatus: "verified" },
      { id: "tawhid-ayatalkursi", surahNumber: 2, ayahStart: 255, ayahEnd: 255, source: "quran", verificationStatus: "verified" },
      { id: "tawhid-anam", surahNumber: 6, ayahStart: 102, ayahEnd: 103, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis", "ibrahimnarrative", "nuhflood"],
    personIds: ["ibrahim", "nuh"],
    relatedThemeIds: ["shirk", "faith"],
    sources: [{ type: "quran", citation: "Al-Ikhlas 112:1-4; Al-Baqarah 2:255" }],
  },
  {
    id: "shirk",
    name: "Shirk (Associating Partners with Allah)",
    arabicName: "الشرك",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "Attributing partners, rivals, or equal status to Allah in worship, lordship, or His names/attributes.",
    description:
      "The Qur'an calls shirk 'a tremendous injustice' (31:13, Luqman's own advice to his son) and the one sin explicitly stated not to be forgiven if unrepented (4:48, 4:116). Idol-worship narratives across this dataset's Stories (Ibrahim's confrontation with his people, the golden calf) illustrate it concretely rather than only abstractly.",
    representativePassages: [
      { id: "shirk-nisa", surahNumber: 4, ayahStart: 48, ayahEnd: 48, source: "quran", verificationStatus: "verified" },
      { id: "shirk-luqman", surahNumber: 31, ayahStart: 13, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["ibrahimnarrative", "musaandbaniisrael"],
    personIds: ["ibrahim", "luqman", "azar"],
    relatedThemeIds: ["tawhid"],
    sources: [{ type: "quran", citation: "An-Nisa 4:48; Luqman 31:13" }],
  },
  {
    id: "faith",
    name: "Faith (Iman)",
    arabicName: "الإيمان",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "Belief in Allah, His angels, His books, His messengers, the Last Day, and the unseen, coupled with righteous action.",
    description:
      "Al-Baqarah's opening description of 'those conscious of Allah' begins by naming belief in the unseen (2:2-3) before any ritual practice is mentioned — the Qur'an consistently pairs iman with 'amal salih (righteous deeds), not treating belief as a purely internal state disconnected from conduct.",
    representativePassages: [
      { id: "faith-baqarah-open", surahNumber: 2, ayahStart: 1, ayahEnd: 5, source: "quran", verificationStatus: "verified" },
      { id: "faith-hujurat", surahNumber: 49, ayahStart: 15, ayahEnd: 15, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["tawhid", "taqwa"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:1-5; Al-Hujurat 49:15" }],
    statusNotes: [
      "'The Unseen' (Al-Ghayb) as a candidate theme was folded into Faith rather than kept separate — belief in the unseen is the Qur'an's own opening qualification of faith (2:3), not a distinct standalone concept with its own separate body of content.",
    ],
  },
  {
    id: "revelation",
    name: "Revelation (Wahy)",
    arabicName: "الوحي",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "The process by which Allah communicates guidance and scripture to His prophets.",
    description:
      "The Qur'an describes its own revelation as sent down 'in truth' (17:105) and describes earlier scriptures (the Torah, the Gospel) as also revealed — distinct from Prophethood itself (the office/role) in that this theme is specifically about the mechanism/content of what was transmitted.",
    representativePassages: [
      { id: "revelation-isra", surahNumber: 17, ayahStart: 105, ayahEnd: 106, source: "quran", verificationStatus: "verified" },
      { id: "revelation-shura", surahNumber: 42, ayahStart: 51, ayahEnd: 52, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["thenightjourney"],
    personIds: ["muhammad", "musa", "isa"],
    relatedThemeIds: ["prophethood"],
    sources: [{ type: "quran", citation: "Al-Isra 17:105-106; Ash-Shura 42:51-52" }],
  },
  {
    id: "prophethood",
    name: "Prophethood (Nubuwwah)",
    arabicName: "النبوة",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "The office of being chosen by Allah to convey His message to a people.",
    description:
      "The Qur'an describes a chain of prophets sent 'one after another' (23:44) with a shared core mission (Tawhid) despite different peoples, laws, and circumstances — the entire People & Groups module's 25 traditionally-named prophets and this dataset's own prophetic-narrative Stories are the concrete illustration of this theme, not restated here.",
    representativePassages: [
      { id: "prophethood-muminun", surahNumber: 23, ayahStart: 44, ayahEnd: 44, source: "quran", verificationStatus: "verified" },
      { id: "prophethood-ahzab-seal", surahNumber: 33, ayahStart: 40, ayahEnd: 40, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["revelation"],
    sources: [{ type: "quran", citation: "Al-Mu'minun 23:44; Al-Ahzab 33:40" }],
  },
  {
    id: "resurrection",
    name: "Resurrection and the Hereafter",
    arabicName: "البعث والآخرة",
    alternateNames: ["Day of Judgment", "Al-Akhirah"],
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "Being raised after death to stand before Allah and be held accountable.",
    description:
      "One of the Qur'an's most frequently repeated doctrinal claims, often paired directly with rebuttals of those who denied it ('can We not... give life to the dead?,' 75:40). The people of Yunus's own repentance (10:98) and the Qur'an's treatment of destroyed nations both implicitly rest on the premise of ultimate accountability this theme names directly.",
    representativePassages: [
      { id: "resurrection-qiyamah", surahNumber: 75, ayahStart: 36, ayahEnd: 40, source: "quran", verificationStatus: "verified" },
      { id: "resurrection-hajj", surahNumber: 22, ayahStart: 5, ayahEnd: 7, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["paradise", "hell", "divinedecree"],
    sources: [{ type: "quran", citation: "Al-Qiyamah 75:36-40; Al-Hajj 22:5-7" }],
    statusNotes: [
      "'Day of Judgment' is treated as the same concept as Resurrection here, not a second theme — the Qur'an narrates the raising and the judgment as sequential phases of one described event, not two independently-bounded topics.",
      "Specific eschatological signs/sequence details (the trumpet, the scales, the bridge) are not catalogued exhaustively here — this theme covers the doctrinal concept and representative proof-texts, not a full eschatology; a future Signs & Miracles module (if built) would be the more appropriate home for that level of detail.",
    ],
  },
  {
    id: "paradise",
    name: "Paradise (Jannah)",
    arabicName: "الجنة",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "The eternal reward described for the righteous in the Hereafter.",
    description:
      "Described repeatedly with concrete imagery — gardens beneath which rivers flow, described first for Adam's original dwelling (2:35) before that word recurs as the destination promised to believers throughout the rest of the Qur'an.",
    representativePassages: [
      { id: "paradise-baqarah-adam", surahNumber: 2, ayahStart: 25, ayahEnd: 25, source: "quran", verificationStatus: "verified" },
      { id: "paradise-muhammad", surahNumber: 47, ayahStart: 15, ayahEnd: 15, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis"],
    relatedThemeIds: ["hell", "resurrection"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:25; Muhammad 47:15" }],
  },
  {
    id: "hell",
    name: "Hell (Jahannam)",
    arabicName: "جهنم",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "The punishment described for those who reject Allah's message and persist in wrongdoing.",
    description:
      "Consistently paired in the same passages with Paradise as the two described outcomes, and frequently invoked as the stated consequence facing the destroyed nations covered across this dataset's own Peoples & Nations and Stories modules ('Ad, Thamud, and others), though the immediate worldly destruction narrated for them is described separately from this Hereafter punishment.",
    representativePassages: [
      { id: "hell-baqarah", surahNumber: 2, ayahStart: 24, ayahEnd: 24, source: "quran", verificationStatus: "verified" },
      { id: "hell-mulk", surahNumber: 67, ayahStart: 6, ayahEnd: 11, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["paradise", "resurrection"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:24; Al-Mulk 67:6-11" }],
  },
  {
    id: "angels",
    name: "Angels (Al-Mala'ikah)",
    arabicName: "الملائكة",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "Created beings who carry out Allah's commands without disobedience.",
    description:
      "Angels appear across this dataset's own Stories in concrete narrative roles, not only doctrinal statements — commanded to prostrate before Adam, visiting Ibrahim and Lut with news, announcing Isa's birth to Maryam, and the two named at Babylon in the Peoples & Nations-adjacent Places module.",
    representativePassages: [
      { id: "angels-baqarah-prostrate", surahNumber: 2, ayahStart: 34, ayahEnd: 34, source: "quran", verificationStatus: "verified" },
      { id: "angels-tahrim", surahNumber: 66, ayahStart: 6, ayahEnd: 6, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis", "ibrahimnarrative", "lutandhispeople", "maryamandisa"],
    placeIds: ["babylon"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:34; At-Tahrim 66:6" }],
  },
  {
    id: "divinedecree",
    name: "Divine Decree (Al-Qadar)",
    arabicName: "القدر",
    category: "belief",
    conceptualBasis: "quran_explicit_concept",
    definition: "Allah's foreordaining knowledge and measure over all that occurs.",
    description:
      "Stated directly — 'We have created all things by [precise] decree' (54:49) — and closely tied in classical scholarship to Tawakkul (reliance on Allah given that outcomes are already known to Him), while remaining a distinct doctrinal claim in its own right rather than a practice.",
    representativePassages: [
      { id: "divinedecree-qamar", surahNumber: 54, ayahStart: 49, ayahEnd: 49, source: "quran", verificationStatus: "verified" },
      { id: "divinedecree-hadid", surahNumber: 57, ayahStart: 22, ayahEnd: 23, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["tawakkul", "resurrection"],
    sources: [{ type: "quran", citation: "Al-Qamar 54:49; Al-Hadid 57:22-23" }],
  },
  {
    id: "creation",
    name: "Creation (Al-Khalq)",
    arabicName: "الخلق",
    category: "belief",
    conceptualBasis: "quran_derived_concept",
    definition: "Allah's creative power over the heavens, earth, and humankind, repeatedly presented as a sign pointing to Him.",
    description:
      "Distinct from any one narrative — this synthesizes a recurring argument-pattern used across many surahs ('do they not look at the camels, how they are created... and at the earth, how it is spread out,' 88:17-20) rather than one bounded story with named participants, which is why it is modeled as a Theme, not a Story (see Stories' own excluded-candidates note on this exact question).",
    representativePassages: [
      { id: "creation-anam", surahNumber: 6, ayahStart: 1, ayahEnd: 1, source: "quran", verificationStatus: "verified" },
      { id: "creation-ghashiyah", surahNumber: 88, ayahStart: 17, ayahEnd: 20, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis"],
    relatedThemeIds: ["tawhid"],
    sources: [{ type: "quran", citation: "Al-An'am 6:1; Al-Ghashiyah 88:17-20" }],
  },

  // ======================== WORSHIP & SPIRITUALITY ========================
  {
    id: "prayer",
    name: "Prayer (Salah)",
    arabicName: "الصلاة",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "The ritual worship prescribed at set times, repeatedly commanded alongside charity.",
    description:
      "Established as a defining practice of the believer from the Qur'an's earliest address ('those who establish prayer,' 2:3) through to its description as 'a decree of specified times' (4:103); Ibrahim's own prayer for his descendants to be established in it (14:37, 14:40) links this practice directly to the Ka'bah's own founding narrative.",
    representativePassages: [
      { id: "prayer-baqarah", surahNumber: 2, ayahStart: 3, ayahEnd: 3, source: "quran", verificationStatus: "verified" },
      { id: "prayer-nisa", surahNumber: 4, ayahStart: 103, ayahEnd: 103, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["ibrahimnarrative"],
    personIds: ["ibrahim"],
    placeIds: ["almasjidalharam"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:3; An-Nisa 4:103" }],
  },
  {
    id: "fasting",
    name: "Fasting (Sawm)",
    arabicName: "الصيام",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Abstaining from food, drink, and specific acts from dawn to sunset, prescribed for a set period.",
    description:
      "Prescribed directly with a stated purpose: 'that you may become righteous [attain taqwa]' (2:183) — its own explicit textual link to the Taqwa theme, not an incidental connection.",
    representativePassages: [
      { id: "fasting-baqarah", surahNumber: 2, ayahStart: 183, ayahEnd: 184, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["taqwa"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:183-184" }],
  },
  {
    id: "charity",
    name: "Charity (Zakat and Sadaqah)",
    arabicName: "الزكاة والصدقة",
    alternateNames: ["Zakat"],
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Obligatory (zakat) and voluntary (sadaqah) giving of wealth to those entitled to it.",
    description:
      "Paired with prayer so consistently across the Qur'an ('establish prayer and give zakat,' repeated dozens of times) that the two are treated as companion obligations; 9:60 names the specific categories of recipients directly in the text.",
    representativePassages: [
      { id: "charity-baqarah", surahNumber: 2, ayahStart: 43, ayahEnd: 43, source: "quran", verificationStatus: "verified" },
      { id: "charity-tawbah", surahNumber: 9, ayahStart: 60, ayahEnd: 60, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["wealth", "generosity"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:43; At-Tawbah 9:60" }],
    statusNotes: [
      "Zakat (obligatory) and Sadaqah (voluntary) are kept as one combined theme rather than two — the Qur'an itself does not draw a hard terminological line between them the way later fiqh does, and splitting them would separate closely-related content without a clear Qur'anic boundary to split on.",
    ],
  },
  {
    id: "dhikr",
    name: "Remembrance of Allah (Dhikr)",
    arabicName: "الذكر",
    alternateNames: ["Du'a"],
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Consciously remembering and calling upon Allah, in speech, heart, or supplication.",
    description:
      "'In the remembrance of Allah do hearts find rest' (13:28) — a broad theme covering both structured remembrance and personal supplication (du'a), which the Qur'an treats as closely related expressions of the same turning-toward-Allah rather than as fully separate practices.",
    representativePassages: [
      { id: "dhikr-rad", surahNumber: 13, ayahStart: 28, ayahEnd: 28, source: "quran", verificationStatus: "verified" },
      { id: "dhikr-ghafir", surahNumber: 40, ayahStart: 60, ayahEnd: 60, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["zakariyya"],
    storyIds: ["zakariyyayahya"],
    sources: [{ type: "quran", citation: "Ar-Ra'd 13:28; Ghafir 40:60" }],
    statusNotes: [
      "Du'a (supplication) is folded into this theme rather than kept as its own separate entry — the Qur'an's own supplications (e.g. Zakariyya's private prayer, Yunus's prayer in the fish) are consistently framed as acts of remembering/calling upon Allah, without a sharp independent boundary from dhikr broadly.",
    ],
  },
  {
    id: "tawbah",
    name: "Repentance (Tawbah)",
    arabicName: "التوبة",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Sincerely turning back to Allah after wrongdoing, seeking His forgiveness.",
    description:
      "Adam's own repentance and its acceptance (2:37) is the Qur'an's own paradigm case — a model of a fall followed by sincere return, not permanent rejection. Distinct from Forgiveness (below): Tawbah is the human act of turning back; Forgiveness covers the response, both divine and interpersonal.",
    representativePassages: [
      { id: "tawbah-baqarah", surahNumber: 2, ayahStart: 37, ayahEnd: 37, source: "quran", verificationStatus: "verified" },
      { id: "tawbah-zumar", surahNumber: 39, ayahStart: 53, ayahEnd: 53, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis", "yunusstory"],
    personIds: ["adam", "yunus"],
    relatedThemeIds: ["forgiveness"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:37; Az-Zumar 39:53" }],
    statusNotes: [
      "Kept in Worship & Spirituality (as an act directed toward Allah) rather than duplicated under Trials & Human Experience, where the phase's own candidate list also mentions it — one canonical entry, not two.",
    ],
  },
  {
    id: "taqwa",
    name: "God-Consciousness (Taqwa)",
    arabicName: "التقوى",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "A vigilant awareness of Allah that shapes conduct — often translated 'piety' or 'God-consciousness.'",
    description:
      "Stated explicitly as fasting's own purpose (2:183) and invoked as the true measure of honor among people regardless of lineage (49:13) — distinct from Faith (belief itself) in that Taqwa describes the resulting disposition and restraint that belief is meant to produce.",
    representativePassages: [
      { id: "taqwa-hujurat", surahNumber: 49, ayahStart: 13, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
      { id: "taqwa-baqarah", surahNumber: 2, ayahStart: 197, ayahEnd: 197, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["faith", "fasting"],
    sources: [{ type: "quran", citation: "Al-Hujurat 49:13; Al-Baqarah 2:197" }],
  },
  {
    id: "tawakkul",
    name: "Reliance on Allah (Tawakkul)",
    arabicName: "التوكل",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Placing one's trust in Allah's outcome after taking the means available.",
    description:
      "Musa's words at the sea — 'my Lord is with me; He will guide me' (26:62) — are this dataset's clearest narrative illustration. Distinct from Sabr: Tawakkul is about trusting an outcome to Allah, where Sabr is about enduring a hardship already underway — related, frequently paired, but not the same act.",
    representativePassages: [
      { id: "tawakkul-imran", surahNumber: 3, ayahStart: 159, ayahEnd: 159, source: "quran", verificationStatus: "verified" },
      { id: "tawakkul-talaq", surahNumber: 65, ayahStart: 3, ayahEnd: 3, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["musaandpharaoh"],
    personIds: ["musa"],
    relatedThemeIds: ["sabr", "divinedecree"],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:159; At-Talaq 65:3" }],
  },
  {
    id: "sabr",
    name: "Patience (Sabr)",
    arabicName: "الصبر",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Steadfast endurance through hardship, delay, or provocation, without abandoning what is right.",
    description:
      "Modeled at length across this dataset's own prophetic Stories — Nuh's centuries-long patience with rejection, Ayyub's patience through affliction, Yusuf's patience through repeated trial — each illustrating a different flavor of the same underlying virtue.",
    representativePassages: [
      { id: "sabr-baqarah", surahNumber: 2, ayahStart: 153, ayahEnd: 153, source: "quran", verificationStatus: "verified" },
      { id: "sabr-zumar", surahNumber: 39, ayahStart: 10, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["nuhflood", "ayyubstory", "yusufstory"],
    personIds: ["nuh", "ayyub", "yusuf"],
    relatedThemeIds: ["tawakkul", "shukr", "trials"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:153; Az-Zumar 39:10" }],
  },
  {
    id: "shukr",
    name: "Gratitude (Shukr)",
    arabicName: "الشكر",
    category: "worship_spirituality",
    conceptualBasis: "quran_explicit_concept",
    definition: "Acknowledging and giving thanks for Allah's favors, in heart, speech, and action.",
    description:
      "Paired directly with Sabr as the Qur'an's own complementary pair of responses to circumstance ('in that are signs for everyone patient and grateful,' 14:5, 31:31) — one virtue for hardship, one for ease.",
    representativePassages: [
      { id: "shukr-ibrahim", surahNumber: 14, ayahStart: 7, ayahEnd: 7, source: "quran", verificationStatus: "verified" },
      { id: "shukr-luqman", surahNumber: 31, ayahStart: 12, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["luqman"],
    relatedThemeIds: ["sabr"],
    sources: [{ type: "quran", citation: "Ibrahim 14:7; Luqman 31:12" }],
  },

  // ============================== CHARACTER ==============================
  {
    id: "truthfulness",
    name: "Truthfulness and Trustworthiness",
    arabicName: "الصدق والأمانة",
    alternateNames: ["Sidq", "Amanah"],
    category: "character",
    conceptualBasis: "quran_explicit_concept",
    definition: "Honesty in speech (sidq) and reliability in fulfilling trusts and commitments (amanah).",
    description:
      "Yusuf is repeatedly addressed as 'the truthful one' (12:46) after his integrity is established through trial; the believing man of Fir'aun's family risks his own safety to speak truthfully in Musa's defense (40:28).",
    representativePassages: [
      { id: "truthfulness-yusuf", surahNumber: 12, ayahStart: 46, ayahEnd: 46, source: "quran", verificationStatus: "verified" },
      { id: "truthfulness-nisa-amanah", surahNumber: 4, ayahStart: 58, ayahEnd: 58, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["yusufstory", "musaandpharaoh"],
    personIds: ["yusuf", "believingman"],
    sources: [{ type: "quran", citation: "Yusuf 12:46; An-Nisa 4:58" }],
    statusNotes: [
      "Trustworthiness (Amanah) is combined with Truthfulness here rather than kept as a fully separate theme — both concern personal integrity/reliability and are commonly discussed as companion virtues; splitting them would not add a clearly distinct body of content.",
    ],
  },
  {
    id: "justice",
    name: "Justice (Adl)",
    arabicName: "العدل",
    alternateNames: ["Ihsan"],
    category: "character",
    conceptualBasis: "quran_explicit_concept",
    definition: "Giving each due right and judging fairly, without being swayed by bias, wealth, or relation.",
    description:
      "'Allah commands justice and excellence [ihsan]' (16:90) is the Qur'an's own direct pairing of Justice with something beyond it — going further than mere fairness. Talut/Dawud/Jalut's narrative and Sulaiman's own famous judgment scenes both illustrate just rule in this dataset's Stories.",
    representativePassages: [
      { id: "justice-nahl", surahNumber: 16, ayahStart: 90, ayahEnd: 90, source: "quran", verificationStatus: "verified" },
      { id: "justice-nisa", surahNumber: 4, ayahStart: 135, ayahEnd: 135, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["dawudandjalut", "sulaimanandsaba"],
    personIds: ["dawud", "sulaiman", "talut"],
    relatedThemeIds: ["oppression"],
    sources: [{ type: "quran", citation: "An-Nahl 16:90; An-Nisa 4:135" }],
    statusNotes: [
      "'Fairness' as a separate candidate theme was not created — the Qur'an's own vocabulary here is 'adl (justice); a distinct 'fairness' entry would only restate this one under another name.",
      "Ihsan (excellence, going beyond strict justice) is folded into this entry rather than made a separate theme, on the strength of its direct textual pairing with 'adl at 16:90, rather than being independently split out.",
    ],
  },
  {
    id: "mercy",
    name: "Mercy (Rahmah)",
    arabicName: "الرحمة",
    category: "character",
    conceptualBasis: "quran_explicit_concept",
    definition: "Compassion and kindness, both as a divine attribute and a human character trait.",
    description:
      "'My mercy encompasses all things' (7:156) — the Qur'an's own claim about the scope of Allah's mercy — while also commanding mercy between people, e.g. the instruction to lower 'the wing of humility' toward one's parents 'out of mercy' (17:24).",
    representativePassages: [
      { id: "mercy-araf", surahNumber: 7, ayahStart: 156, ayahEnd: 156, source: "quran", verificationStatus: "verified" },
      { id: "mercy-anbiya", surahNumber: 21, ayahStart: 107, ayahEnd: 107, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["forgiveness", "parents"],
    sources: [{ type: "quran", citation: "Al-A'raf 7:156; Al-Anbiya 21:107" }],
  },
  {
    id: "forgiveness",
    name: "Forgiveness",
    arabicName: "العفو والمغفرة",
    alternateNames: ["Afw", "Maghfirah"],
    category: "character",
    conceptualBasis: "quran_explicit_concept",
    definition: "Releasing a wrong done against oneself (afw), or Allah's pardoning of sin (maghfirah).",
    description:
      "Yusuf's own words to his brothers — 'no blame will there be upon you today' (12:92) — are the Qur'an's clearest narrative model of interpersonal forgiveness offered from a position of real power, not weakness, distinct from Tawbah (which is the wrongdoer's own act of turning back).",
    representativePassages: [
      { id: "forgiveness-yusuf", surahNumber: 12, ayahStart: 92, ayahEnd: 92, source: "quran", verificationStatus: "verified" },
      { id: "forgiveness-shura", surahNumber: 42, ayahStart: 40, ayahEnd: 40, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["yusufstory"],
    personIds: ["yusuf"],
    relatedThemeIds: ["tawbah", "mercy"],
    sources: [{ type: "quran", citation: "Yusuf 12:92; Ash-Shura 42:40" }],
  },
  {
    id: "humility",
    name: "Humility",
    arabicName: "التواضع",
    category: "character",
    conceptualBasis: "quran_explicit_concept",
    definition: "Freedom from self-exaltation before Allah and other people.",
    description:
      "The Qur'an describes 'the servants of the Most Merciful' as those who 'walk upon the earth in humility' (25:63) — presented as a mark of true servanthood, directly contrasted with Arrogance across multiple narratives in this dataset (Iblis's refusal, 'Ad's boast of their own strength).",
    representativePassages: [
      { id: "humility-furqan", surahNumber: 25, ayahStart: 63, ayahEnd: 63, source: "quran", verificationStatus: "verified" },
      { id: "humility-luqman", surahNumber: 31, ayahStart: 18, ayahEnd: 19, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis"],
    personIds: ["luqman"],
    relatedThemeIds: ["arrogance"],
    sources: [{ type: "quran", citation: "Al-Furqan 25:63; Luqman 31:18-19" }],
  },
  {
    id: "generosity",
    name: "Generosity",
    arabicName: "الكرم والجود",
    category: "character",
    conceptualBasis: "quran_derived_concept",
    definition: "Willing, open-handed giving to others, as a character disposition distinct from the specific obligation of charity.",
    description:
      "Ibrahim's own hospitality to his unrecognized guests (51:24-27, bringing 'a fattened calf' without being asked) is the Qur'an's own narrative model, distinct from Charity (the institutionalized practice/obligation) in that this theme covers the underlying disposition itself.",
    representativePassages: [
      { id: "generosity-dhariyat", surahNumber: 51, ayahStart: 24, ayahEnd: 27, source: "quran", verificationStatus: "verified" },
      { id: "generosity-insan", surahNumber: 76, ayahStart: 8, ayahEnd: 9, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["ibrahimnarrative"],
    personIds: ["ibrahim"],
    relatedThemeIds: ["charity"],
    sources: [{ type: "quran", citation: "Adh-Dhariyat 51:24-27; Al-Insan 76:8-9" }],
  },

  // ============================ MORAL WARNINGS ============================
  {
    id: "arrogance",
    name: "Arrogance",
    arabicName: "الكبر",
    alternateNames: ["Kibr", "Mockery"],
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Considering oneself superior to others or above submission to Allah's command.",
    description:
      "Iblis's own stated reason for refusing to prostrate — 'I am better than him' (7:12) — is the Qur'an's paradigm case, echoed by 'Ad's boast of their own strength (41:15) and Fir'aun's self-exaltation (79:24). Mockery of prophets and believers, a recurring companion behavior in the destroyed-nations narratives, is treated here as an expression of the same underlying disposition rather than a separate theme.",
    representativePassages: [
      { id: "arrogance-araf", surahNumber: 7, ayahStart: 12, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
      { id: "arrogance-nahl", surahNumber: 16, ayahStart: 23, ayahEnd: 23, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis", "musaandpharaoh"],
    personIds: ["firaun"],
    communityIds: ["ad"],
    relatedThemeIds: ["humility"],
    sources: [{ type: "quran", citation: "Al-A'raf 7:12-13; An-Nahl 16:23" }],
    statusNotes: [
      "Mockery/ridicule of messengers, a candidate theme on its own, is treated here as a specific expression of arrogance rather than split into a separate entry — the recurring pattern across destroyed-nations narratives is consistently one of a people considering themselves too important to be corrected.",
    ],
  },
  {
    id: "hypocrisy",
    name: "Hypocrisy (Nifaq)",
    arabicName: "النفاق",
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Outwardly professing faith while inwardly disbelieving or acting in bad faith.",
    description:
      "An entire surah (63, Al-Munafiqun) is devoted to describing this behavior. This is deliberately modeled as a Theme (a behavioral/moral category), not a Peoples & Nations entity — 'Munafiqun' describes a moral posture found within Madinah's population, not a distinct genealogical or historical people, a distinction flagged as a deferred question back in Phase 2 and resolved here.",
    representativePassages: [
      { id: "hypocrisy-munafiqun", surahNumber: 63, ayahStart: 1, ayahEnd: 4, source: "quran", verificationStatus: "verified" },
      { id: "hypocrisy-baqarah", surahNumber: 2, ayahStart: 8, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
    ],
    placeIds: ["madinah"],
    sources: [{ type: "quran", citation: "Al-Munafiqun 63:1-4; Al-Baqarah 2:8-10" }],
    statusNotes: [
      "Resolves the boundary question flagged in Phase 2's Peoples & Nations report: hypocrisy is a moral/behavioral category (a Theme), not a population with independent genealogical/historical identity — no Peoples & Nations entity was ever created for it, and none is created now either.",
    ],
  },
  {
    id: "oppression",
    name: "Oppression and Injustice (Zulm)",
    arabicName: "الظلم",
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Wronging others, or oneself, by placing something other than where it rightfully belongs.",
    description:
      "'Zulm' is the Qur'an's own single broad term covering both oppressing others and self-wronging through sin — Fir'aun's tyranny over Bani Isra'il and Qarun's own arrogance are both described using this same root, which is why Oppression and Injustice are combined into one theme rather than kept as two.",
    representativePassages: [
      { id: "oppression-ibrahim", surahNumber: 14, ayahStart: 42, ayahEnd: 42, source: "quran", verificationStatus: "verified" },
      { id: "oppression-shura", surahNumber: 42, ayahStart: 42, ayahEnd: 42, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["musaandpharaoh", "qarunstory"],
    personIds: ["firaun", "qarun"],
    communityIds: ["aalfiraun"],
    relatedThemeIds: ["justice"],
    sources: [{ type: "quran", citation: "Ibrahim 14:42; Ash-Shura 42:42" }],
    statusNotes: [
      "'Oppression' and 'Injustice' are combined into one theme, not two — the Qur'an uses one term (zulm) for both, with no clear textual line separating them into distinct concepts.",
    ],
  },
  {
    id: "greed",
    name: "Greed and Envy",
    arabicName: "البخل والحسد",
    alternateNames: ["Bukhl", "Hasad"],
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Withholding what should rightfully be given (bukhl), or resenting another's favor and wishing it removed (hasad).",
    description:
      "Qarun's refusal to see his wealth as anything but his own doing (28:78) illustrates stinginess/greed narratively; envy has its own dedicated closing plea in Surah Al-Falaq — 'from the evil of an envier when he envies' (113:5) — grounding both halves of this combined theme directly in the text.",
    representativePassages: [
      { id: "greed-imran", surahNumber: 3, ayahStart: 180, ayahEnd: 180, source: "quran", verificationStatus: "verified" },
      { id: "greed-falaq", surahNumber: 113, ayahStart: 5, ayahEnd: 5, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["qarunstory"],
    personIds: ["qarun"],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:180; Al-Falaq 113:5" }],
    statusNotes: [
      "Greed (Bukhl) and Envy (Hasad) are combined into one theme — both concern a disordered relationship to what others have or what one is due to give, and neither has enough independently distinct Qur'anic content to justify a fully separate entry from the other.",
    ],
  },
  {
    id: "corruption",
    name: "Corruption (Fasad)",
    arabicName: "الفساد",
    alternateNames: ["Backbiting", "Ghibah"],
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Spreading harm or moral/social decay, including through speech that damages others.",
    description:
      "'Do not cause corruption in the land after its reformation' (7:56) is a recurring refrain addressed to several of the destroyed peoples in this dataset. Backbiting is included here as a specific form of social corruption — 49:12's vivid metaphor (comparing it to eating a dead brother's flesh) is its own clear, singular locus rather than a body of content large enough for an independent theme.",
    representativePassages: [
      { id: "corruption-araf", surahNumber: 7, ayahStart: 56, ayahEnd: 56, source: "quran", verificationStatus: "verified" },
      { id: "corruption-hujurat-backbiting", surahNumber: 49, ayahStart: 12, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["musaandpharaoh"],
    communityIds: ["aalfiraun"],
    sources: [{ type: "quran", citation: "Al-A'raf 7:56; Al-Hujurat 49:12" }],
    statusNotes: [
      "Backbiting/slander (Ghibah), a candidate theme in its own right, is folded into Corruption rather than made independent — it has one clear, well-known locus (49:12) but not enough additional distinct content to justify a standalone entry under this phase's own inclusion rule.",
    ],
  },
  {
    id: "disobedience",
    name: "Sin and Disobedience",
    arabicName: "المعصية والذنب",
    category: "moral_warning",
    conceptualBasis: "quran_explicit_concept",
    definition: "Acting contrary to Allah's command, whether a specific act of disobedience or sin more broadly.",
    description:
      "Iblis's refusal is framed explicitly as disobedience to a direct command (20:121, 'Adam disobeyed his Lord') — the Qur'an's own vocabulary treats sin as fundamentally an act of disobedience rather than two separable categories, which is why this theme combines both under one entry.",
    representativePassages: [
      { id: "disobedience-taha", surahNumber: 20, ayahStart: 121, ayahEnd: 121, source: "quran", verificationStatus: "verified" },
      { id: "disobedience-najm", surahNumber: 53, ayahStart: 32, ayahEnd: 32, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["adamandiblis"],
    personIds: ["adam"],
    relatedThemeIds: ["tawbah"],
    sources: [{ type: "quran", citation: "Ta-Ha 20:121; An-Najm 53:32" }],
    statusNotes: [
      "'Sin' and 'Disobedience,' two separate candidates on this phase's audit list, are combined into one theme — the Qur'an's own framing of Adam's episode (20:121) treats them as the same act, not two distinguishable categories.",
    ],
  },

  // ======================== SOCIAL & CIVILIZATIONAL ========================
  {
    id: "family",
    name: "Family and Marriage",
    arabicName: "الأسرة والزواج",
    alternateNames: ["Marriage", "Nikah"],
    category: "social_civilizational",
    conceptualBasis: "quran_explicit_concept",
    definition: "Kinship bonds and the marital relationship, both given explicit Qur'anic regulation and description.",
    description:
      "Marriage is described as a sign in itself — spouses made 'that you may find tranquility in them,' with 'love and mercy' placed between them (30:21) — while broader family narratives (Ibrahim and Isma'il, Ya'qub and his sons, Maryam's own upbringing) run throughout this dataset's Stories.",
    representativePassages: [
      { id: "family-rum", surahNumber: 30, ayahStart: 21, ayahEnd: 21, source: "quran", verificationStatus: "verified" },
      { id: "family-nisa", surahNumber: 4, ayahStart: 1, ayahEnd: 1, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["ibrahimnarrative", "yusufstory"],
    sources: [{ type: "quran", citation: "Ar-Rum 30:21; An-Nisa 4:1" }],
    statusNotes: [
      "Marriage is combined with the broader Family theme rather than split out separately — both share the same core textual anchor (30:21, 4:1) and splitting them would not isolate a clearly distinct additional body of content.",
    ],
  },
  {
    id: "parents",
    name: "Kindness to Parents",
    arabicName: "بر الوالدين",
    alternateNames: ["Birr al-Walidayn"],
    category: "social_civilizational",
    conceptualBasis: "quran_explicit_concept",
    definition: "Honoring, obeying, and caring for one's parents, especially in their old age.",
    description:
      "Paired directly with Tawhid itself — 'worship none but Him, and to parents do good' (17:23) — one of the strongest textual pairings in the whole Qur'an, which is why this is kept as its own theme distinct from the broader Family entry rather than folded into it.",
    representativePassages: [
      { id: "parents-isra", surahNumber: 17, ayahStart: 23, ayahEnd: 24, source: "quran", verificationStatus: "verified" },
      { id: "parents-luqman", surahNumber: 31, ayahStart: 14, ayahEnd: 15, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["luqman"],
    relatedThemeIds: ["family", "tawhid"],
    sources: [{ type: "quran", citation: "Al-Isra 17:23-24; Luqman 31:14-15" }],
  },
  {
    id: "orphans",
    name: "Orphans",
    arabicName: "اليتامى",
    category: "social_civilizational",
    conceptualBasis: "quran_explicit_concept",
    definition: "Children who have lost one or both parents, given specific, repeated Qur'anic protection.",
    description:
      "Protection of orphans' property is legislated in specific detail (4:2, 4:6, 4:10) and their kind treatment is used as a direct test of righteousness (89:17, 93:9, 107:2) — a body of both legal and moral content substantial enough to warrant its own theme distinct from the broader Family entry.",
    representativePassages: [
      { id: "orphans-nisa", surahNumber: 4, ayahStart: 2, ayahEnd: 2, source: "quran", verificationStatus: "verified" },
      { id: "orphans-duha", surahNumber: 93, ayahStart: 9, ayahEnd: 9, source: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "An-Nisa 4:2, 6, 10; Ad-Duha 93:9" }],
  },
  {
    id: "wealth",
    name: "Wealth",
    arabicName: "المال",
    category: "social_civilizational",
    conceptualBasis: "quran_derived_concept",
    definition: "Material provision and property, treated in the Qur'an as a trust and a test rather than an unqualified good.",
    description:
      "Qarun's downfall (28:76-82) and the Qur'an's repeated instruction to spend from wealth given illustrate both its potential and its danger; this theme also covers trade ethics (Madyan's specific warning against fraud in measure and weight) and poverty as wealth's counterpart, rather than splitting either into a separate entry.",
    representativePassages: [
      { id: "wealth-qasas", surahNumber: 28, ayahStart: 76, ayahEnd: 79, source: "quran", verificationStatus: "verified" },
      { id: "wealth-baqarah", surahNumber: 2, ayahStart: 261, ayahEnd: 261, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["qarunstory"],
    personIds: ["qarun"],
    communityIds: ["madyan"],
    relatedThemeIds: ["charity", "greed"],
    sources: [{ type: "quran", citation: "Al-Qasas 28:76-79; Al-Baqarah 2:261" }],
    statusNotes: [
      "Trade ethics and poverty, both candidate themes on their own, are treated as facets of this broader Wealth theme rather than separate entries — neither has an independently large enough body of distinct content under this phase's inclusion rule.",
    ],
  },
  {
    id: "leadership",
    name: "Leadership and Authority",
    arabicName: "القيادة والسلطة",
    category: "social_civilizational",
    conceptualBasis: "quran_derived_concept",
    definition: "The exercise of rule or authority over others, and the Qur'an's own contrast between just and tyrannical leadership.",
    description:
      "Talut's selection despite objections over wealth/lineage (2:247), Sulaiman's rule paired with gratitude (27:19), and Fir'aun's tyranny sit at opposite ends of this same theme — leadership itself is not condemned or praised uniformly; its exercise is.",
    representativePassages: [
      { id: "leadership-baqarah", surahNumber: 2, ayahStart: 247, ayahEnd: 247, source: "quran", verificationStatus: "verified" },
      { id: "leadership-sad", surahNumber: 38, ayahStart: 26, ayahEnd: 26, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["dawudandjalut", "musaandpharaoh"],
    personIds: ["talut", "dawud", "firaun"],
    relatedThemeIds: ["justice", "oppression"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:247; Sad 38:26" }],
  },
  {
    id: "community",
    name: "Community, Brotherhood, and Peace",
    arabicName: "الأمة والأخوة والسلم",
    alternateNames: ["Ummah", "Conflict and Peace"],
    category: "social_civilizational",
    conceptualBasis: "quran_derived_concept",
    definition: "The bonds of the believing community, mutual brotherhood, and the Qur'an's regulation of conflict and reconciliation.",
    description:
      "'The believers are but brothers, so make reconciliation between your brothers' (49:10) sits directly beside instructions for making peace between two disputing groups of believers (49:9) in the same passage — brotherhood and conflict-resolution are treated in the same breath in the text itself, which is why they are combined into one theme here.",
    representativePassages: [
      { id: "community-hujurat", surahNumber: 49, ayahStart: 9, ayahEnd: 10, source: "quran", verificationStatus: "verified" },
      { id: "community-anbiya", surahNumber: 21, ayahStart: 92, ayahEnd: 92, source: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-Hujurat 49:9-10; Al-Anbiya 21:92" }],
    statusNotes: [
      "'Conflict' and 'Peace,' separate candidates on this phase's audit list, are combined into this one theme along with Community/Brotherhood — the Qur'an's own treatment (49:9-10) presents peacemaking as an expression of the same brotherhood bond, not an unrelated topic.",
    ],
  },

  // ===================== TRIALS & HUMAN EXPERIENCE =====================
  {
    id: "trials",
    name: "Trials and Tests",
    arabicName: "الابتلاء",
    alternateNames: ["Ibtila'", "Fitnah", "Temptation"],
    category: "trials_human_experience",
    conceptualBasis: "quran_explicit_concept",
    definition: "Difficulty, loss, or temptation sent as a test of faith and conduct.",
    description:
      "'We will surely test you with something of fear and hunger and loss of wealth, lives, and fruits — but give good tidings to the patient' (2:155) directly links this theme to Sabr as the called-for response. Fitnah's dual sense (both 'trial' and 'temptation toward wrong') is treated as one concept here rather than split into two, since the Qur'an itself uses the same word for both senses without a sharp dividing line.",
    representativePassages: [
      { id: "trials-baqarah", surahNumber: 2, ayahStart: 155, ayahEnd: 157, source: "quran", verificationStatus: "verified" },
      { id: "trials-ankabut", surahNumber: 29, ayahStart: 2, ayahEnd: 3, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["ayyubstory", "ibrahimnarrative"],
    personIds: ["ayyub", "ibrahim"],
    relatedThemeIds: ["sabr"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:155-157; Al-Ankabut 29:2-3" }],
    statusNotes: [
      "'Tests' and 'Trials,' listed as two separate candidates in this phase's own audit list, are treated as one theme — they are synonyms in English with no distinguishable Qur'anic concept separating them.",
      "'Temptation,' a third candidate, is folded in here rather than kept separate — the Qur'anic term (fitnah) covers both senses without the text itself drawing a boundary between them.",
    ],
  },
  {
    id: "fearandgrief",
    name: "Freedom from Fear and Grief",
    arabicName: "الخوف والحزن",
    category: "trials_human_experience",
    conceptualBasis: "quran_explicit_concept",
    definition: "The emotional states of fear and sorrow, and the Qur'an's repeated promise of freedom from both for the believing and steadfast.",
    description:
      "'No fear will there be upon them, nor will they grieve' is one of the Qur'an's most frequently repeated refrains, applied to the righteous across many different contexts (2:38, 2:62, 2:112, 2:262, 5:69, 6:48, and others) — combined into one theme here since the text itself almost always pairs the two states together rather than treating them separately.",
    representativePassages: [
      { id: "fearandgrief-baqarah", surahNumber: 2, ayahStart: 38, ayahEnd: 38, source: "quran", verificationStatus: "verified" },
      { id: "fearandgrief-yunus", surahNumber: 10, ayahStart: 62, ayahEnd: 62, source: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:38; Yunus 10:62" }],
    statusNotes: [
      "Fear and Grief, two separate candidates in this phase's audit list, are combined into one theme — the Qur'an's own recurring refrain ('no fear... nor grief') treats them as a paired condition, not two independent topics.",
    ],
  },
  {
    id: "hope",
    name: "Hope",
    arabicName: "الرجاء",
    category: "trials_human_experience",
    conceptualBasis: "quran_explicit_concept",
    definition: "Expectant trust in Allah's mercy, especially amid hardship or after sin.",
    description:
      "'Do not despair of the mercy of Allah' (39:53) is addressed directly to 'those who have transgressed against themselves' — hope is presented as the necessary companion to Tawbah, not a separate, unrelated emotional state.",
    representativePassages: [
      { id: "hope-zumar", surahNumber: 39, ayahStart: 53, ayahEnd: 53, source: "quran", verificationStatus: "verified" },
      { id: "hope-yusuf", surahNumber: 12, ayahStart: 87, ayahEnd: 87, source: "quran", verificationStatus: "verified" },
    ],
    relatedThemeIds: ["tawbah"],
    sources: [{ type: "quran", citation: "Az-Zumar 39:53; Yusuf 12:87" }],
  },
  {
    id: "guidance",
    name: "Guidance and Misguidance",
    arabicName: "الهدى والضلال",
    category: "trials_human_experience",
    conceptualBasis: "quran_explicit_concept",
    definition: "Being directed to, or straying from, the right path — a personal, spiritual-direction concept distinct from Revelation (the scriptural transmission process itself).",
    description:
      "Al-Fatihah's own central request — 'guide us to the straight path' (1:6) — makes this arguably the single most-repeated request in the entire Qur'an; misguidance is treated as its direct counterpart throughout, most visibly in Samiri's leading the Israelites astray during Musa's absence.",
    representativePassages: [
      { id: "guidance-fatihah", surahNumber: 1, ayahStart: 6, ayahEnd: 6, source: "quran", verificationStatus: "verified" },
      { id: "guidance-kahf", surahNumber: 18, ayahStart: 17, ayahEnd: 17, source: "quran", verificationStatus: "verified" },
    ],
    storyIds: ["musaandbaniisrael"],
    personIds: ["samiri"],
    relatedThemeIds: ["revelation"],
    sources: [{ type: "quran", citation: "Al-Fatihah 1:6; Al-Kahf 18:17" }],
    statusNotes: [
      "Kept distinct from Revelation: Revelation covers the prophetic transmission mechanism (what is sent down and to whom); Guidance covers the broader, personal experience of being directed or straying, requested by every reader in Al-Fatihah regardless of any one revelation event.",
    ],
  },
];

export const getThemeById = (id: string): QuranTheme | undefined =>
  QURAN_THEMES.find((t) => t.id === id);

// ============================================================
// Merge/exclusion decisions (documented per this phase's explicit
// "document important merges/splits" instruction — every one of these
// was a genuine candidate on the audit list, not silently dropped):
//
//   1. Day of Judgment -> merged into Resurrection & the Hereafter
//   2. The Unseen -> merged into Faith
//   3. Angels kept separate (real distinct narrative content)
//   4. Du'a -> merged into Dhikr (Remembrance of Allah)
//   5. Ihsan -> merged into Justice
//   6. Trustworthiness (Amanah) -> merged into Truthfulness (Sidq)
//   7. Mockery -> merged into Arrogance
//   8. Backbiting/Slander (Ghibah) -> merged into Corruption
//   9. Envy (Hasad) -> merged into Greed (Bukhl)
//  10. Sin -> merged into Disobedience
//  11. Marriage -> merged into Family
//  12. Trade ethics, Poverty -> merged into Wealth
//  13. Neighbors -> excluded (too thin for an independent theme; not
//      merged anywhere since no natural parent theme fit without forcing it)
//  14. Conflict, Peace -> merged into Community/Brotherhood
//  15. Tests -> merged with Trials (pure synonym)
//  16. Temptation (Fitnah's second sense) -> merged into Trials
//  17. Fear, Grief -> merged into one "Freedom from Fear and Grief" theme
//  18. Repentance (as listed a second time under Trials & Human
//      Experience) -> kept as the single Tawbah entry under Worship &
//      Spirituality only, not duplicated
//  19. Munafiqun (as a Peoples & Nations population) -> resolved as the
//      Hypocrisy THEME, per the Phase 2 deferral — no population entity
//      created
//  20. Paradise/Hell -> included here (Belief category), not deferred to
//      a future Signs & Miracles module — they are doctrinal concepts,
//      not specific eschatological event-sequences
//  21. Creation -> included here as a Theme (recurring sign-argument
//      pattern), not as a Story (no narrative participants/sequence) —
//      consistent with Phase 4's own exclusion reasoning
//  22. Death (as its own theme, distinct from Resurrection) -> excluded;
//      folded contextually into Resurrection & the Hereafter rather than
//      given independent treatment, since the phase's own candidate list
//      names Resurrection and Day of Judgment but not Death separately
// ============================================================
