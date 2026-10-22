// Events — dataset types + data (Phase 7 of
// quranic_knowledge_platform_phased_plan.md). Discrete occurrences within
// or across Stories — this module does NOT duplicate Stories; it extracts
// and cross-links the individually significant beats.
//
// ============================================================
// ARCHITECTURE DECISION — Story vs. Event boundary (explicitly required)
// ============================================================
// Test applied to every candidate: does the parent Story have real
// internal episode structure (a Story with `episodes`, i.e. a multi-beat
// arc), such that "the Event" is meaningfully a COMPONENT of a larger
// narrative rather than the whole of it? If yes, extraction is justified
// (Musa & Pharaoh has 5 episodes -> up to 5 Events). If a Story has NO
// internal episodes — it is already one tightly-bounded occurrence at
// Event-level granularity (People of the Cave, People of the Trench,
// People of the Elephant, The Night Journey, The Cow, Dawud/Talut/Jalut,
// Sulaiman & Saba', Ayyub, Yunus, Zakariyya & Yahya, Qarun) — NO separate
// Event was created for it: a second entry would just restate the Story
// with nothing new to cross-link, which is exactly the duplication this
// phase warns against. This is a deliberate, documented exclusion, not an
// oversight — see the file-end audit note for the full list.
//
// Where an Event entry exists, it deliberately keeps `description` SHORT
// and defers the full narrative prose to the Story's own episode summary
// (linked via `storyIds`) — an Event is a graph node (classification +
// cross-links + chronology), not a second copy of the story text.
//
// ============================================================
// ARCHITECTURE DECISION — Timeline integration (explicitly required)
// ============================================================
// Inspected first: app/utils/personsTimeline.ts / PropheticTimeline.vue
// are tightly coupled to the `QuranPerson` shape (the template reads
// `node.person.arabicName`/`chronology`/etc. directly) — not a generic
// entity-timeline. Genericizing it would be exactly the kind of
// speculative refactor of a stable module this phase explicitly warns
// against, for a benefit ("Events on the same visual timeline") that a
// lighter mechanism achieves anyway.
//
// Chosen instead: (1) each Event carries its own lightweight
// `relativeChronology` (a `duringPersonId`/`beforeEventId`/`afterEventId`
// object, plain ids, no new relationship-type taxonomy) rendered as plain
// text on the Event's own detail page — satisfies "record relationships
// such as before/after another event, during a prophet's lifetime"
// without any shared timeline data structure; (2) one small, purely
// additive change to PropheticTimeline.vue: each mainline node gets a
// computed "N related events" link to the Events directory, pre-filtered
// to that person — coexists with the existing timeline exactly as this
// phase asks, without touching `buildTimeline`/`personsTimeline.ts` or
// the rendering of mainline/branches/unlinked at all. No dedicated Events
// Timeline page was built — not requested strongly enough to justify the
// UI investment, and the person-filtered Events directory already serves
// the same need.
//
// ============================================================
// TAXONOMY
// ============================================================
// 14 categories: creation, birth, migration, journey, confrontation,
// battle, miracle, trial, rescue, destruction, revelation, covenant,
// worship, communal_transformation. Dropped from the phase's own
// candidate list: "death" (no event here is purely a death — Isa's
// ascension is a rescue, not a death, per the Qur'an's own denial of his
// crucifixion), "judgment" and "eschatological_event" (explicitly
// deferred to a future Signs & Miracles/Hereafter module, per this
// phase's own instruction not to let eschatology become Events here).
// Added "communal_transformation" — genuinely needed for events like the
// Golden Calf that don't fit any listed category, and directly named as
// a qualifying factor in this phase's own inclusion rule ("a significant
// communal transformation").
import type { RelatedPassage } from "~/utils/quranReference";
import type { ChronologyStatus } from "~/data/quranPersons";

export type EventCategory =
  | "creation"
  | "birth"
  | "migration"
  | "journey"
  | "confrontation"
  | "battle"
  | "miracle"
  | "trial"
  | "rescue"
  | "destruction"
  | "revelation"
  | "covenant"
  | "worship"
  | "communal_transformation";

export type EventSourceBasis =
  | "quran_explicit" // the Qur'an directly describes the occurrence
  | "quran_context" // established through the Qur'an's own surrounding narrative context, not a single direct statement
  | "traditional" // the specific identification (a name, a site, a date) is a later tafsir/seerah layer, not itself in the Qur'an text
  | "disputed"; // scholars differ and the Qur'an does not settle the matter

export type RelativeChronology = {
  duringPersonId?: string;
  beforeEventId?: string;
  afterEventId?: string;
};

export type QuranEvent = {
  id: string;

  title: string;
  arabicTitle: string;

  category: EventCategory;
  sourceBasis: EventSourceBasis;
  chronologyStatus: ChronologyStatus;
  relativeChronology?: RelativeChronology;

  description: string;

  passage: RelatedPassage;
  parallelPassages?: RelatedPassage[];

  personIds?: string[];
  communityIds?: string[];
  placeIds?: string[];
  storyIds?: string[];
  themeIds?: string[];
  duaIds?: string[];
  relatedEventIds?: string[];
  // Reciprocal of Signs & Miracles' own `eventIds` (Phase 8,
  // app/data/quranSigns.ts). Added only where Phase 8's own audit
  // verified a real relationship — never for symmetry. Left undefined
  // (not an empty array) on every Event with no linked Sign.
  signIds?: string[];

  statusNotes?: string[];
};

export const QURAN_EVENTS: QuranEvent[] = [
  {
    id: "creationadam",
    title: "Creation of Adam",
    arabicTitle: "خلق آدم",
    category: "creation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    description: "Adam's creation and the teaching of 'the names of all things,' announced to the angels as the placing of a vicegerent on earth.",
    passage: { id: "creationadam-p", surahNumber: 2, ayahStart: 30, ayahEnd: 34, source: "quran", verificationStatus: "verified" },
    personIds: ["adam"],
    storyIds: ["adamandiblis"],
    themeIds: ["creation"],
    relatedEventIds: ["iblisrefusal"],
    statusNotes: [
      "Extracted from 'Adam and Iblis' (Story) Episode 1 — kept as its own Event since 'Creation of Adam' is explicitly named as a distinct candidate in this phase's own audit list, separate from Iblis's subsequent refusal.",
    ],
  },
  {
    id: "creationheavensearth",
    title: "Creation of the Heavens and Earth",
    arabicTitle: "خلق السماوات والأرض",
    category: "creation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    description: "The Qur'an's recurring statement that the heavens and earth were created, repeatedly invoked as a sign of Allah's power distinct from Adam's own creation specifically.",
    passage: { id: "creationheavensearth-p", surahNumber: 41, ayahStart: 9, ayahEnd: 12, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "creationheavensearth-parallel-araf", surahNumber: 7, ayahStart: 54, ayahEnd: 54, source: "quran", verificationStatus: "verified" },
    ],
    themeIds: ["creation", "tawhid"],
    statusNotes: [
      "Kept separate from 'Creation of Adam' — a broader cosmological claim repeated across many surahs, not one bounded narrative moment; the Creation THEME (Phase 5) covers the recurring sign-argument pattern, while this Event entry is the specific claim itself.",
    ],
  },
  {
    id: "iblisrefusal",
    title: "Iblis's Refusal and Expulsion",
    arabicTitle: "رفض إبليس وطرده",
    category: "confrontation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    relativeChronology: { afterEventId: "creationadam" },
    description: "Iblis refuses the command to prostrate before Adam, citing his own claimed superiority, and is expelled — granted respite to mislead until the Day of Resurrection.",
    passage: { id: "iblisrefusal-p", surahNumber: 7, ayahStart: 12, ayahEnd: 18, source: "quran", verificationStatus: "verified" },
    personIds: ["adam"],
    storyIds: ["adamandiblis"],
    themeIds: ["arrogance", "shirk"],
    relatedEventIds: ["creationadam", "gardenfall"],
  },
  {
    id: "gardenfall",
    title: "The Fall and Descent from the Garden",
    arabicTitle: "الهبوط من الجنة",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    relativeChronology: { afterEventId: "iblisrefusal" },
    description: "Adam and Hawwa are deceived by Iblis's whispering, eat from the forbidden tree, and are sent down — followed immediately by Adam's repentance and its acceptance.",
    passage: { id: "gardenfall-p", surahNumber: 7, ayahStart: 19, ayahEnd: 25, source: "quran", verificationStatus: "verified" },
    personIds: ["adam"],
    storyIds: ["adamandiblis"],
    duaIds: ["adamrepentance"],
    themeIds: ["tawbah", "trials"],
    statusNotes: [
      "Combines what could be read as two beats (the fall itself, and the repentance) into one Event — the Qur'an's own telling (2:36-37) presents them as one immediate sequence, not two separated occurrences worth splitting.",
    ],
  },
  {
    id: "floodark",
    title: "The Flood and the Ark",
    arabicTitle: "الطوفان والسفينة",
    category: "rescue",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "nuh" },
    description: "The Ark is built under divine instruction; the Flood comes, drowning the rejecters (including Nuh's own son) while the Ark carries the believers and pairs of creatures to rest on Al-Judi.",
    passage: { id: "floodark-p", surahNumber: 11, ayahStart: 36, ayahEnd: 44, source: "quran", verificationStatus: "verified" },
    personIds: ["nuh"],
    communityIds: ["peopleofnuh"],
    placeIds: ["mountjudi"],
    storyIds: ["nuhflood"],
    duaIds: ["nuhclosingprayer", "nuhhelpprayer"],
    themeIds: ["trials"],
  },
  {
    id: "ibrahimidolatry",
    title: "Ibrahim Confronts Idolatry",
    arabicTitle: "مواجهة إبراهيم لعبادة الأصنام",
    category: "confrontation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "ibrahim" },
    description: "Ibrahim reasons publicly against his father's and people's idol worship and breaks the idols 'into fragments, except the biggest of them.'",
    passage: { id: "ibrahimidolatry-p", surahNumber: 21, ayahStart: 51, ayahEnd: 58, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim", "azar"],
    storyIds: ["ibrahimnarrative"],
    themeIds: ["shirk", "tawhid"],
    relatedEventIds: ["ibrahimfire"],
  },
  {
    id: "ibrahimfire",
    title: "Ibrahim's Fire",
    arabicTitle: "نار إبراهيم",
    category: "miracle",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "ibrahim", afterEventId: "ibrahimidolatry" },
    description: "Ibrahim's people cast him into a fire commanded by Allah to be 'cool and safe' for him.",
    passage: { id: "ibrahimfire-p", surahNumber: 21, ayahStart: 68, ayahEnd: 70, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim"],
    storyIds: ["ibrahimnarrative"],
    themeIds: ["tawakkul"],
    signIds: ["ibrahimfiresign"],
  },
  {
    id: "angelsvisitibrahim",
    title: "The Angels' Visit and the Announcement of Lut's Judgment",
    arabicTitle: "زيارة الملائكة وإنذار قوم لوط",
    category: "revelation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "Angelic messengers visit Ibrahim's household with glad tidings of Ishaq, then continue on to announce the coming judgment on Lut's people — a single visit bridging two narratives.",
    passage: { id: "angelsvisitibrahim-p", surahNumber: 11, ayahStart: 69, ayahEnd: 76, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim", "ibrahimwife", "lut"],
    storyIds: ["ibrahimnarrative", "lutandhispeople"],
    themeIds: ["angels"],
    relatedEventIds: ["lutdestruction"],
    statusNotes: [
      "Deliberately linked to BOTH Story entries — a concrete case of an Event adding real cross-linking value a single Story's own episode boundary can't (Ibrahim's Narrative and Lut and His People are separate Stories; this one occurrence bridges them).",
    ],
  },
  {
    id: "ibrahimmigration",
    title: "Ibrahim's Migration",
    arabicTitle: "هجرة إبراهيم",
    category: "migration",
    sourceBasis: "quran_explicit",
    chronologyStatus: "uncertain",
    relativeChronology: { duringPersonId: "ibrahim" },
    description: "Ibrahim's own stated declaration, after Lut's belief in him, that he is emigrating toward his Lord.",
    passage: { id: "ibrahimmigration-p", surahNumber: 29, ayahStart: 26, ayahEnd: 26, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim", "lut"],
    storyIds: ["ibrahimnarrative"],
    statusNotes: [
      "The Qur'an states the migration directly (29:26, 'innī muhājirun ilā rabbī') but gives no route, origin, or destination detail — `chronologyStatus: 'uncertain'` reflects that the ACT is explicit while its specifics are not established in the text.",
    ],
  },
  {
    id: "sacrificetrial",
    title: "The Trial of Sacrifice",
    arabicTitle: "ابتلاء الذبح",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "ibrahim" },
    description: "Ibrahim's vision of sacrificing his son, the son's willing submission, and the sacrifice's redemption.",
    passage: { id: "sacrificetrial-p", surahNumber: 37, ayahStart: 99, ayahEnd: 113, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim"],
    storyIds: ["ibrahimnarrative"],
    duaIds: ["ibrahimrighteoussonprayer"],
    themeIds: ["trials"],
    statusNotes: [
      "IMPORTANT: 37:99-113 does not name which son is sacrificed — this entry does not assert Isma'il (or Ishaq), matching the same caution already documented on their own Persons-module entries and on this same passage in the Ibrahim's Narrative Story.",
    ],
  },
  {
    id: "raisingkabah",
    title: "Raising the Ka'bah's Foundations",
    arabicTitle: "رفع قواعد البيت",
    category: "worship",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "ibrahim", afterEventId: "sacrificetrial" },
    description: "Ibrahim and Isma'il raise the foundations of the House, praying for its acceptance and for a future messenger from among their descendants.",
    passage: { id: "raisingkabah-p", surahNumber: 2, ayahStart: 127, ayahEnd: 129, source: "quran", verificationStatus: "verified" },
    personIds: ["ibrahim", "ismail"],
    placeIds: ["makkah", "almasjidalharam"],
    storyIds: ["ibrahimnarrative"],
    duaIds: ["ibrahimkabah"],
    themeIds: ["prayer", "prophethood"],
  },
  {
    id: "lutdestruction",
    title: "Destruction of Lut's People",
    arabicTitle: "هلاك قوم لوط",
    category: "destruction",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "lut", afterEventId: "angelsvisitibrahim" },
    description: "The town is overturned and struck with a shower of stones; Lut and his believing household are saved, except his wife.",
    passage: { id: "lutdestruction-p", surahNumber: 11, ayahStart: 77, ayahEnd: 83, source: "quran", verificationStatus: "verified" },
    personIds: ["lut", "lutwife"],
    communityIds: ["peopleoflut"],
    storyIds: ["lutandhispeople"],
    duaIds: ["lutrescueprayer", "luthelpprayer"],
    themeIds: ["oppression"],
  },
  {
    id: "yusufwell",
    title: "Yusuf Thrown into the Well",
    arabicTitle: "إلقاء يوسف في الجب",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "yusuf" },
    description: "Yusuf's brothers, driven by jealousy over his dream, cast him into a well and deceive their father with a false account.",
    passage: { id: "yusufwell-p", surahNumber: 12, ayahStart: 8, ayahEnd: 18, source: "quran", verificationStatus: "verified" },
    personIds: ["yusuf", "yaqub", "yusufbrothers"],
    storyIds: ["yusufstory"],
    relatedEventIds: ["yusufsold"],
  },
  {
    id: "yusufsold",
    title: "Yusuf Sold into Slavery",
    arabicTitle: "بيع يوسف",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "yusuf", afterEventId: "yusufwell" },
    description: "Travelers find Yusuf in the well and sell him in Egypt 'for a reduced price' to the household that would raise him.",
    passage: { id: "yusufsold-p", surahNumber: 12, ayahStart: 19, ayahEnd: 22, source: "quran", verificationStatus: "verified" },
    personIds: ["yusuf", "alaziz"],
    placeIds: ["egypt"],
    storyIds: ["yusufstory"],
  },
  {
    id: "yusufprison",
    title: "Yusuf Imprisoned",
    arabicTitle: "سجن يوسف",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "yusuf", afterEventId: "yusufsold" },
    description: "After the temptation by his master's wife, Yusuf is imprisoned despite the evidence pointing to his innocence.",
    passage: { id: "yusufprison-p", surahNumber: 12, ayahStart: 33, ayahEnd: 35, source: "quran", verificationStatus: "verified" },
    personIds: ["yusuf", "alazizwife"],
    storyIds: ["yusufstory"],
    duaIds: ["yusuftemptationprayer"],
    themeIds: ["trials"],
  },
  {
    id: "yusufauthority",
    title: "Yusuf's Rise to Authority",
    arabicTitle: "تمكين يوسف في مصر",
    category: "communal_transformation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "yusuf", afterEventId: "yusufprison" },
    description: "Yusuf interprets the king's dream from prison, is released, and is appointed to a position of authority over Egypt's stores.",
    passage: { id: "yusufauthority-p", surahNumber: 12, ayahStart: 43, ayahEnd: 57, source: "quran", verificationStatus: "verified" },
    personIds: ["yusuf", "kingofegypt"],
    placeIds: ["egypt"],
    storyIds: ["yusufstory"],
  },
  {
    id: "yusufreunion",
    title: "Reunion of Yusuf and His Family",
    arabicTitle: "لقاء يوسف بأهله",
    category: "communal_transformation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "yusuf", afterEventId: "yusufauthority" },
    description: "Yusuf's brothers travel to Egypt for grain, the test involving Binyamin unfolds, and the family is reunited and reconciled.",
    passage: { id: "yusufreunion-p", surahNumber: 12, ayahStart: 58, ayahEnd: 100, source: "quran", verificationStatus: "verified" },
    personIds: ["yusuf", "yaqub", "yusufbrothers"],
    storyIds: ["yusufstory"],
    duaIds: ["yusuffinalprayer"],
    themeIds: ["forgiveness"],
  },
  {
    id: "musabirth",
    title: "Musa's Birth and Rescue",
    arabicTitle: "ولادة موسى وإنقاذه",
    category: "birth",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa" },
    description: "Musa's mother sets him adrift on the river; he is found and raised within Fir'aun's own household.",
    passage: { id: "musabirth-p", surahNumber: 28, ayahStart: 7, ayahEnd: 13, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "firaunwife"],
    placeIds: ["egypt"],
    communityIds: ["aalfiraun"],
    storyIds: ["musaandpharaoh"],
  },
  {
    id: "musacalling",
    title: "Musa's Calling at Sinai",
    arabicTitle: "تكليف موسى عند الطور",
    category: "revelation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "musabirth" },
    description: "Musa is commissioned to prophethood at the sacred valley of Tuwa, given the staff and hand as signs, and asks for Harun to share the task.",
    passage: { id: "musacalling-p", surahNumber: 20, ayahStart: 9, ayahEnd: 36, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "harun"],
    placeIds: ["sinai", "tuwa"],
    storyIds: ["musaandpharaoh"],
    duaIds: ["musacallingprayer"],
    themeIds: ["revelation", "prophethood"],
    signIds: ["musastaff", "musahand"],
  },
  {
    id: "confrontpharaoh",
    title: "Confrontation with Fir'aun",
    arabicTitle: "مواجهة فرعون",
    category: "confrontation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "musacalling" },
    description: "Musa and Harun deliver the message to Fir'aun, whose repeated refusal is met with a series of escalating signs.",
    passage: { id: "confrontpharaoh-p", surahNumber: 7, ayahStart: 103, ayahEnd: 137, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "harun", "firaun", "believingman"],
    communityIds: ["aalfiraun"],
    storyIds: ["musaandpharaoh"],
    duaIds: ["musaprayeragainstfiraun"],
    themeIds: ["oppression"],
    relatedEventIds: ["magiciansconvert"],
    signIds: ["musaplagues"],
  },
  {
    id: "magiciansconvert",
    title: "The Contest with the Magicians",
    arabicTitle: "مباراة السحرة",
    category: "confrontation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "confrontpharaoh" },
    description: "Fir'aun's magicians are overtaken by Musa's staff and immediately fall into prostration in belief, remaining steadfast even under threat of execution.",
    passage: { id: "magiciansconvert-p", surahNumber: 26, ayahStart: 38, ayahEnd: 51, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "sahara", "firaun"],
    storyIds: ["musaandpharaoh"],
    duaIds: ["saharaconversionprayer"],
    themeIds: ["faith"],
    signIds: ["musastaff"],
  },
  {
    id: "exoduscrossing",
    title: "The Exodus and Sea Crossing",
    arabicTitle: "الخروج وشق البحر",
    category: "rescue",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "magiciansconvert" },
    description: "Musa leads the Israelites out of Egypt; the sea parts at his staff, and Fir'aun's pursuing army drowns behind them.",
    passage: { id: "exoduscrossing-p", surahNumber: 26, ayahStart: 52, ayahEnd: 68, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "firaun"],
    communityIds: ["aalfiraun", "baniisrael"],
    placeIds: ["egypt", "thesea"],
    storyIds: ["musaandpharaoh"],
    themeIds: ["tawakkul"],
    signIds: ["seasplitting"],
    statusNotes: [
      "This entry covers both the crossing and Fir'aun's drowning as one event — no separate 'Destruction of Aal Fir'aun' entry was created, since it would duplicate this same occurrence's own climax.",
    ],
  },
  {
    id: "sinaicovenant",
    title: "The Covenant at Sinai",
    arabicTitle: "الميثاق عند الطور",
    category: "covenant",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "exoduscrossing" },
    description: "The covenant is taken from Bani Isra'il with the Mount described as 'raised over them.'",
    passage: { id: "sinaicovenant-p", surahNumber: 2, ayahStart: 63, ayahEnd: 63, source: "quran", verificationStatus: "verified" },
    personIds: ["musa"],
    communityIds: ["baniisrael"],
    placeIds: ["sinai"],
    storyIds: ["musaandbaniisrael"],
  },
  {
    id: "goldencalf",
    title: "The Golden Calf",
    arabicTitle: "عبادة العجل",
    category: "communal_transformation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "sinaicovenant" },
    description: "In Musa's forty-night absence, Samiri leads the people to worship a calf; Musa's confrontation and prayer for forgiveness follow his return.",
    passage: { id: "goldencalf-p", surahNumber: 20, ayahStart: 83, ayahEnd: 98, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "harun", "samiri"],
    communityIds: ["baniisrael"],
    storyIds: ["musaandbaniisrael"],
    duaIds: ["musagoldencalfprayer"],
    themeIds: ["shirk", "forgiveness"],
  },
  {
    id: "holylandrefusal",
    title: "The Refusal to Enter the Holy Land",
    arabicTitle: "رفض دخول الأرض المقدسة",
    category: "trial",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "musa", afterEventId: "goldencalf" },
    description: "Commanded to enter the Holy Land, the people refuse out of fear, resulting in forty years of wandering.",
    passage: { id: "holylandrefusal-p", surahNumber: 5, ayahStart: 21, ayahEnd: 26, source: "quran", verificationStatus: "verified" },
    personIds: ["musa"],
    communityIds: ["baniisrael"],
    placeIds: ["theholyland"],
    storyIds: ["musaandbaniisrael"],
  },
  {
    id: "khidrjourney",
    title: "The Journey of Musa and Khidr",
    arabicTitle: "رحلة موسى مع الخضر",
    category: "journey",
    sourceBasis: "quran_explicit",
    chronologyStatus: "uncertain",
    description: "Musa journeys to learn from a righteous servant of Allah, witnessing three acts he cannot reconcile until each is explained by unseen knowledge he did not have.",
    passage: { id: "khidrjourney-p", surahNumber: 18, ayahStart: 60, ayahEnd: 82, source: "quran", verificationStatus: "verified" },
    personIds: ["musa", "khidr"],
    storyIds: ["musaandkhidr"],
    themeIds: ["guidance"],
    statusNotes: [
      "Kept as one Event covering all three episodes (boat, boy, wall) — the Story's own 3 episodes are already thin/short individually; splitting further here would fragment past this phase's own inclusion bar.",
    ],
  },
  {
    id: "battlejalut",
    title: "The Battle Against Jalut",
    arabicTitle: "المعركة مع جالوت",
    category: "battle",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "Talut is chosen as king despite objections, a small army passes a river test, and Dawud kills the enemy commander Jalut in single combat.",
    passage: { id: "battlejalut-p", surahNumber: 2, ayahStart: 246, ayahEnd: 251, source: "quran", verificationStatus: "verified" },
    personIds: ["talut", "dawud", "jalut"],
    communityIds: ["baniisrael"],
    storyIds: ["dawudandjalut"],
    themeIds: ["leadership"],
  },
  {
    id: "sabavisit",
    title: "The Queen of Saba's Visit and Submission",
    arabicTitle: "زيارة ملكة سبأ وإسلامها",
    category: "confrontation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "Following the hoopoe's report and Sulaiman's letter, the queen visits his court and declares her submission to Allah.",
    passage: { id: "sabavisit-p", surahNumber: 27, ayahStart: 20, ayahEnd: 44, source: "quran", verificationStatus: "verified" },
    personIds: ["sulaiman", "bilqis"],
    communityIds: ["saba"],
    storyIds: ["sulaimanandsaba"],
    themeIds: ["guidance"],
    signIds: ["sulaimancreatures"],
  },
  {
    id: "yunusfish",
    title: "Yunus and the Fish",
    arabicTitle: "يونس والحوت",
    category: "rescue",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "Yunus leaves his people without permission, is swallowed by a fish, and is cast onto land after his prayer from within the darkness.",
    passage: { id: "yunusfish-p", surahNumber: 37, ayahStart: 139, ayahEnd: 148, source: "quran", verificationStatus: "verified" },
    personIds: ["yunus"],
    communityIds: ["peopleofyunus"],
    storyIds: ["yunusstory"],
    duaIds: ["yunusindarkness"],
    themeIds: ["tawbah", "tawhid"],
  },
  {
    id: "yahyabirth",
    title: "Birth of Yahya",
    arabicTitle: "ولادة يحيى",
    category: "birth",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "In answer to Zakariyya's private prayer in old age, Yahya is born and given wisdom 'while yet a boy.'",
    passage: { id: "yahyabirth-p", surahNumber: 19, ayahStart: 7, ayahEnd: 15, source: "quran", verificationStatus: "verified" },
    personIds: ["zakariyya", "yahya"],
    storyIds: ["zakariyyayahya"],
    duaIds: ["zakariyyasonprayer"],
    themeIds: ["family", "hope"],
  },
  {
    id: "annunciationmaryam",
    title: "The Annunciation to Maryam",
    arabicTitle: "بشارة مريم",
    category: "revelation",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    description: "An angel announces to Maryam the coming birth of Isa.",
    passage: { id: "annunciationmaryam-p", surahNumber: 19, ayahStart: 16, ayahEnd: 21, source: "quran", verificationStatus: "verified" },
    personIds: ["maryam", "maryammother"],
    storyIds: ["maryamandisa"],
    themeIds: ["angels"],
    relatedEventIds: ["isabirth"],
  },
  {
    id: "isabirth",
    title: "Birth of Isa",
    arabicTitle: "ولادة عيسى",
    category: "birth",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { afterEventId: "annunciationmaryam" },
    description: "Isa is born; on Maryam's return to her people, the infant speaks in her defense.",
    passage: { id: "isabirth-p", surahNumber: 19, ayahStart: 27, ayahEnd: 33, source: "quran", verificationStatus: "verified" },
    personIds: ["isa", "maryam"],
    storyIds: ["maryamandisa"],
    themeIds: ["creation"],
    signIds: ["isacradlespeech"],
  },
  {
    id: "isamiracles",
    title: "Miracles of Isa",
    arabicTitle: "معجزات عيسى",
    category: "miracle",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    relativeChronology: { afterEventId: "isabirth" },
    description: "Isa's mission to the Children of Israel, with every miracle — healing the blind and the leper, giving life to the dead — explicitly attributed to Allah's permission.",
    passage: { id: "isamiracles-p", surahNumber: 3, ayahStart: 49, ayahEnd: 51, source: "quran", verificationStatus: "verified" },
    personIds: ["isa"],
    communityIds: ["baniisrael"],
    storyIds: ["maryamandisa"],
    themeIds: ["tawhid"],
    signIds: ["isamiraclessign"],
  },
  {
    id: "tablefromheaven",
    title: "The Table from Heaven",
    arabicTitle: "المائدة من السماء",
    category: "miracle",
    sourceBasis: "quran_explicit",
    chronologyStatus: "unknown",
    relativeChronology: { afterEventId: "isamiracles" },
    description: "The disciples ask Isa for a table of food sent down from heaven as a sign; it is granted, with a warning attached for anyone who disbelieves afterward.",
    passage: { id: "tablefromheaven-p", surahNumber: 5, ayahStart: 111, ayahEnd: 115, source: "quran", verificationStatus: "verified" },
    personIds: ["isa", "hawariyyun"],
    storyIds: ["maryamandisa"],
    duaIds: ["isatableprayerdua"],
    themeIds: ["faith"],
    signIds: ["tablesign"],
  },
  {
    id: "isaascension",
    title: "The Ascension of Isa",
    arabicTitle: "رفع عيسى",
    category: "rescue",
    sourceBasis: "quran_explicit",
    chronologyStatus: "uncertain",
    relativeChronology: { afterEventId: "tablefromheaven" },
    description: "The Qur'an states Isa was not killed or crucified, but that it was made to appear so, and that he was raised up to Allah.",
    passage: { id: "isaascension-p", surahNumber: 4, ayahStart: 157, ayahEnd: 158, source: "quran", verificationStatus: "verified" },
    personIds: ["isa"],
    storyIds: ["maryamandisa"],
    themeIds: ["resurrection"],
    statusNotes: [
      "`chronologyStatus: 'uncertain'` reflects a genuine, long-standing scholarly discussion about the timing and eventual return implied by this event — the Qur'an states the fact (not killed/crucified, raised up) without giving a chronology for what follows; this entry does not adjudicate that discussion.",
    ],
  },
  {
    id: "addestruction",
    title: "Destruction of 'Ad",
    arabicTitle: "هلاك عاد",
    category: "destruction",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "hud" },
    description: "'Ad is destroyed by a violent, roaring wind lasting seven nights and eight days, after rejecting Hud's warning.",
    passage: { id: "addestruction-p", surahNumber: 69, ayahStart: 6, ayahEnd: 8, source: "quran", verificationStatus: "verified" },
    personIds: ["hud"],
    communityIds: ["ad"],
    placeIds: ["alahqaf", "iram"],
    themeIds: ["arrogance"],
    statusNotes: [
      "No Story entry exists for 'Ad (their own Peoples & Nations entry already carries the full narrative/outcome) — this Event exists specifically to give the occurrence its own classification and cross-links (place, chronology) that the community profile doesn't provide in event-graph form.",
    ],
  },
  {
    id: "thamuddestruction",
    title: "Destruction of Thamud",
    arabicTitle: "هلاك ثمود",
    category: "destruction",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "salih" },
    description: "Thamud is seized by a violent blast after hamstringing the she-camel given as a sign and ignoring Salih's three-day warning.",
    passage: { id: "thamuddestruction-p", surahNumber: 11, ayahStart: 65, ayahEnd: 68, source: "quran", verificationStatus: "verified" },
    personIds: ["salih"],
    communityIds: ["thamud"],
    placeIds: ["alhijr"],
    themeIds: ["disobedience"],
    signIds: ["salihcamel"],
  },
  {
    id: "battlebadr",
    title: "Battle of Badr",
    arabicTitle: "غزوة بدر",
    category: "battle",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "muhammad" },
    description: "Allah gives the believers victory at Badr 'while you were few in number' — the Qur'an's own direct naming of the battle, with the fuller circumstances narrated in Surah Al-Anfal.",
    passage: { id: "battlebadr-p", surahNumber: 3, ayahStart: 123, ayahEnd: 123, source: "quran", verificationStatus: "verified" },
    parallelPassages: [
      { id: "battlebadr-parallel-anfal", surahNumber: 8, ayahStart: 5, ayahEnd: 19, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["muhammad"],
    placeIds: ["badr"],
    themeIds: ["tawakkul"],
    signIds: ["badrangels"],
  },
  {
    id: "siegeconfederates",
    title: "The Siege of the Confederates",
    arabicTitle: "غزوة الأحزاب",
    category: "battle",
    sourceBasis: "quran_context",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "muhammad" },
    description: "Surah Al-Ahzab ('The Confederates') describes a siege by allied forces, the believers' fear, the hypocrites' wavering, and a wind and unseen forces sent against the attackers.",
    passage: { id: "siegeconfederates-p", surahNumber: 33, ayahStart: 9, ayahEnd: 27, source: "quran", verificationStatus: "verified" },
    personIds: ["muhammad"],
    placeIds: ["madinah"],
    signIds: ["ahzabwind"],
    statusNotes: [
      "IMPORTANT: The Qur'an itself never uses the word 'trench' (khandaq) — the digging of a trench, and the specific identification of this siege as 'the Battle of the Trench,' are traditional/seerah details layered onto this surah's own content. `sourceBasis: 'quran_context'` reflects that the SIEGE is established through the surah's own narrative content and its very name ('the Confederates'), while the trench detail specifically is not asserted here as Qur'anic.",
    ],
  },
  {
    id: "pledgeunderthetree",
    title: "The Pledge Under the Tree",
    arabicTitle: "بيعة الشجرة",
    category: "covenant",
    sourceBasis: "quran_explicit",
    chronologyStatus: "traditional",
    relativeChronology: { duringPersonId: "muhammad" },
    description: "Allah expresses pleasure with the believers who pledged allegiance to the Prophet ﷺ 'under the tree.'",
    passage: { id: "pledgeunderthetree-p", surahNumber: 48, ayahStart: 18, ayahEnd: 18, source: "quran", verificationStatus: "verified" },
    personIds: ["muhammad"],
    themeIds: ["faith"],
    statusNotes: [
      "IMPORTANT: This entry is deliberately NOT titled 'Hudaybiyyah' — the Qur'an itself describes the pledge ('under the tree,' 48:18) directly, but the site name 'Hudaybiyyah' and the surrounding treaty narrative are traditional/seerah identifications, not stated in this ayah. `sourceBasis: 'quran_explicit'` grades the pledge event itself; the Hudaybiyyah/treaty context is disclosed here as traditional, not asserted as this ayah's own content.",
    ],
  },
];

export const getEventById = (id: string): QuranEvent | undefined =>
  QURAN_EVENTS.find((e) => e.id === id);

// ============================================================
// Candidates investigated and excluded as separate Events (per this
// phase's explicit "document candidates excluded" instruction) — every
// one below already exists as a Story with NO internal episode
// structure, i.e. already sitting at Event-level granularity. A separate
// Event entry would duplicate the Story with no additional cross-linking
// value (see this file's own Story-vs-Event architecture note above):
//   - People of the Cave (Story: peopleofthecavestory)
//   - People of the Trench (Story: peopleofthetrenchstory)
//   - Companions of the Elephant (Story: peopleoftheelephantstory)
//   - The Night Journey / Isra' (Story: thenightjourney) — Mi'raj
//     specifically remains hadith-based per that Story's own disclosure,
//     not promoted to an Event here either
//   - The Cow narrative (Story: thecow)
//   - Qarun's downfall (Story: qarunstory)
//   - Dhul-Qarnayn's journeys (Story: dhulqarnaynstory)
//
// Investigated and excluded as insufficiently Qur'an-grounded to name as
// a discrete historical battle Event:
//   - Uhud — unlike Badr (explicitly named, 3:123) or Al-Ahzab (the
//     surah's own name), no Qur'anic passage or surah name independently
//     identifies "Uhud"; importing it would rely on seerah alone, which
//     this phase's own instructions explicitly caution against.
//
// Investigated and excluded as eschatological (deferred to a future
// Signs & Miracles / Hereafter module, per this phase's explicit
// instruction not to let these become Events here):
//   - The Trumpet Blast, the Gathering, the Scales, Paradise/Hell scenes
//     — all remain covered thematically only (Phase 5: Resurrection &
//     the Hereafter, Paradise, Hell themes), not as discrete Events.
// ============================================================
