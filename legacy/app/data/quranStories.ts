// Stories — dataset types + data (Phase 4 of
// quranic_knowledge_platform_phased_plan.md). The narrative layer
// connecting People & Groups, Peoples & Nations, and Places — a Story does
// not duplicate any of their content; it sequences and cross-links it.
//
// ============================================================
// ARCHITECTURE DECISION — cross-module IDs (the question deferred since
// Phase 0, explicitly revisited here per this phase's instructions)
// ============================================================
// Conclusion: the existing bare-id-per-dedicated-field pattern (Place's
// `relationships`/`associatedCommunityIds`/`relatedPlaceIds`, each field's
// own name disambiguating which module/array the ids belong to) remains
// fully sufficient for Stories and was reused as-is: `personIds` →
// QURAN_PERSONS, `communityIds` → QURAN_COMMUNITIES, `placeIds` →
// QURAN_PLACES, `relatedStoryIds` → this same file. A typed
// `{ module, id }` reference was considered and rejected for THIS phase —
// it would only earn its complexity if something needed to treat "any
// entity from any module" polymorphically (a single mixed list, generic
// graph traversal). Nothing in Phase 4 needs that: every relationship here
// is already known, by its field name, to point at exactly one module. The
// question remains legitimately open for Phase 10 (Knowledge Graph), where
// genuine polymorphic traversal is the whole point — deferred there again,
// deliberately, not by oversight.
//
// One deliberate deviation from Place's own precedent: Place reused the
// richer `PersonRelationship` type (with `relationshipType`/`sourceType`/
// `verificationStatus`) for its person-links. A Story's connection to a
// person is uniformly "this person appears in this narrative" — grading it
// with a `relationshipType` would always resolve to a meaningless "other,"
// carrying no real information. `personIds`/`communityIds`/`placeIds` here
// are therefore plain string arrays, not because consistency with Place
// doesn't matter, but because forcing a richer shape onto data with no
// richer content would violate this phase's own "do not add fields
// speculatively" instruction more than a small pattern deviation would.
//
// ============================================================
// ARCHITECTURE DECISION — Story vs. Story Episode
// ============================================================
// A hierarchy is genuinely needed (Musa's and Ibrahim's narratives alone
// justify it) but is modeled as an INLINE, nested `episodes?: StoryEpisode[]`
// array on the parent Story — not a second top-level dataset/array with its
// own ids and a `parentStoryId` back-reference. Episodes are never
// independently searched, bookmarked, or linked to from outside their own
// parent, so a separate referenceable entity type would add exactly the
// kind of speculative complexity this phase warns against. This also
// sidesteps, by construction, the entire class of integrity concerns the
// phased plan raises ("episode parent/child integrity," "no circular
// hierarchy") — there is no id-based parent/child link to go stale or
// cycle. The dataset validator still checks what a nested structure CAN
// still get wrong: unique episode ids within their own parent, and every
// episode's own passages validated against real ayah bounds, same as any
// other passage in this file.
//
// Not every Story has episodes — only ones where the Qur'an's own telling
// (or this app's own already-established Person/Peoples/Places passage
// citations) supports a genuinely distinct multi-beat sequence. A short,
// single-passage account (e.g. People of the Trench) stays flat.
//
// ============================================================
// INCLUSION RULE (applied to every candidate investigated, not just the
// ones that made it in — see the excluded-candidates note at the end)
// ============================================================
// A candidate becomes a Story only if it clears MOST of: an identifiable,
// sequential arc (not a single static fact); a real consequence/outcome;
// enough independent Qur'anic weight to be worth a narrative-sequence view
// distinct from its already-existing Person/Peoples/Places profile; and
// participants specific enough to link, not a generic unnamed population.
// A short mention that only adds color to a LARGER story becomes a passage
// or episode inside that story, not its own entry. A narrative already
// fully captured by an existing Peoples & Nations entry (which already
// carries its own passages/outcome/themes) is not force-duplicated into a
// second Story unless the sequence view itself adds something the
// community profile doesn't.
//
// Source discipline: `narrativeStatus` grades how much of a story's
// POPULARLY KNOWN version is actually IN the Qur'an text, distinctly from
// `IdentificationBasis` (which grades individual place/name claims) and
// from each `QuranLesson.basis` (which grades individual lesson claims).
// This 3-tier grading is deliberate, not redundant — see each type's own
// doc comment.
import { asRef } from "~/utils/quranReference";
import type { QuranReference, RelatedPassage, SourceReference } from "~/utils/quranReference";

export type StoryType =
  | "prophetic_narrative"
  | "individual_narrative"
  | "group_narrative"
  | "communal_narrative"
  | "journey_narrative";

/** How much of this story's popularly-known version is actually in the
 * Qur'an text — distinct from IdentificationBasis (which grades a single
 * name/place claim) and QuranLesson.basis (which grades a single lesson). */
export type NarrativeStatus =
  | "quran_complete" // the Qur'an's own text gives an essentially full, sequential account
  | "quran_primary_traditional_expansion" // the Qur'an gives the essential core; popular retellings commonly add significant sequence/detail not in the text
  | "quran_fragmentary"; // the account is pieced together from multiple non-sequential passages across different surahs, no single continuous telling

export type StoryEpisode = {
  id: string;
  title: string;
  summary: string;
  passages: RelatedPassage[];
  themes?: string[];
};

/** Distinguishes what kind of claim a lesson is — the specific discipline
 * Phase 4 asked for: never let a developer's own interpretation read with
 * the same weight as something the Qur'an states directly. */
export type QuranLesson = {
  text: string;
  basis: "quran_explicit" | "derived_thematic" | "traditional_interpretation";
  quranReferences?: QuranReference[];
};

export type QuranStory = {
  id: string;

  title: string;
  arabicTitle: string;
  alternateTitles?: string[];

  storyType: StoryType;
  narrativeStatus: NarrativeStatus;

  shortDescription: string;
  detailedDescription?: string;

  themes?: string[];
  outcome?: string;

  /** The main, fullest telling(s) — where a reader should start. */
  primaryPassages: RelatedPassage[];
  /** Shorter parallel/repeated retellings of the same narrative elsewhere
   * in the Qur'an — present because the Qur'an genuinely repeats stories
   * with different emphasis, not because every passing mention belongs
   * here (see this file's own inclusion-rule note above). */
  supportingPassages?: RelatedPassage[];

  episodes?: StoryEpisode[];

  personIds?: string[];
  communityIds?: string[];
  placeIds?: string[];
  relatedStoryIds?: string[];

  lessons?: QuranLesson[];

  sources?: SourceReference[];
  statusNotes?: string[];
};

export const QURAN_STORIES: QuranStory[] = [
  {
    id: "adamandiblis",
    title: "Adam and Iblis",
    arabicTitle: "آدم وإبليس",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "Adam's creation, the command for the angels (and Iblis) to prostrate before him, Iblis's refusal out of arrogance, the trial in the garden, the fall, and Adam's repentance and forgiveness.",
    themes: ["Arrogance versus humility", "Iblis's refusal as the archetype of disobedience", "Repentance accepted"],
    outcome: "Adam and Hawwa are sent down from the garden after repenting and being forgiven; Iblis is expelled and granted respite to mislead until the Last Day.",
    primaryPassages: [
      {
        id: "adamandiblis-baqarah-creation",
        surahNumber: 2, ayahStart: 30, ayahEnd: 39,
        title: "Creation and the Command to Prostrate",
        description: "Allah's announcement of a vicegerent on earth, the teaching of names, the prostration command, Iblis's refusal, and the garden/fall/repentance in condensed form.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "adamandiblis-araf-account",
        surahNumber: 7, ayahStart: 11, ayahEnd: 25,
        title: "The Fuller Account in Al-A'raf",
        description: "Iblis's own stated reason for refusing ('I am better than him — You created me from fire'), his request for respite, and the garden/fall narrated at greater length.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "adamandiblis-hijr-account", surahNumber: 15, ayahStart: 26, ayahEnd: 44, source: "quran", verificationStatus: "verified" },
      { id: "adamandiblis-taha-account", surahNumber: 20, ayahStart: 115, ayahEnd: 123, source: "quran", verificationStatus: "verified" },
    ],
    episodes: [
      {
        id: "adamandiblis-ep1",
        title: "Creation and the Command to the Angels",
        summary: "Adam is created and taught 'the names of all things'; the angels and Iblis are commanded to prostrate before him.",
        passages: [{ id: "adamandiblis-ep1-p1", surahNumber: 2, ayahStart: 30, ayahEnd: 34, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "adamandiblis-ep2",
        title: "Iblis's Refusal and Expulsion",
        summary: "Iblis refuses, citing his own claimed superiority ('created from fire'), is expelled, and asks for respite until the Day of Resurrection to mislead Adam's descendants.",
        passages: [{ id: "adamandiblis-ep2-p1", surahNumber: 7, ayahStart: 12, ayahEnd: 18, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "adamandiblis-ep3",
        title: "The Garden and the Fall",
        summary: "Adam and Hawwa are placed in the garden, warned away from one tree, and Iblis causes their fall through whispered deception.",
        passages: [{ id: "adamandiblis-ep3-p1", surahNumber: 7, ayahStart: 19, ayahEnd: 22, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "adamandiblis-ep4",
        title: "Repentance and Forgiveness",
        summary: "Adam receives 'words' from his Lord and is forgiven — the Qur'an's own model of repentance accepted, not a permanent fall from grace.",
        passages: [{ id: "adamandiblis-ep4-p1", surahNumber: 2, ayahStart: 37, ayahEnd: 37, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["adam"],
    lessons: [
      { text: "Refusal to submit out of a claimed superiority is the Qur'an's own paradigm case of arrogance leading to disobedience.", basis: "quran_explicit", quranReferences: [asRef(7, 12), asRef(7, 13)] },
      { text: "A sincere return after failure is met with forgiveness, not permanent rejection — repentance is shown accepted, not merely offered.", basis: "quran_explicit", quranReferences: [asRef(2, 37)] },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:30-39; Al-A'raf 7:11-25" }],
    statusNotes: [
      "IMPORTANT: The specific content of 'the words' Adam received (2:37) is not detailed in this passage — 7:23 supplies the actual words as a prayer ('Our Lord, we have wronged ourselves...'); this entry treats them as the same episode based on that cross-reference, which is itself Qur'anic (not a traditional addition).",
      "Popular retellings often add extensive dialogue and detail (the specific tree's identity, the serpent, elaborate angelic debate) not present in the Qur'an text — `narrativeStatus: 'quran_fragmentary'` reflects that the Qur'an's own account is real but distributed and comparatively spare; this entry does not import those additions.",
    ],
  },

  {
    id: "nuhflood",
    title: "Nuh and the Flood",
    arabicTitle: "نوح والطوفان",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Nuh's centuries-long call to his people, their rejection, the command to build the Ark, the Flood, and the Ark's resting on Al-Judi.",
    themes: ["Patience across an extraordinary span of time", "Salvation tied to belief, not family"],
    outcome: "Nuh's people are drowned; he, the believers with him, and pairs of creatures are saved aboard the Ark, which comes to rest on Al-Judi.",
    primaryPassages: [
      {
        id: "nuhflood-hud-account",
        surahNumber: 11, ayahStart: 25, ayahEnd: 49,
        title: "The Fullest Account, in Hud",
        description: "Nuh's call, his people's rejection, the Ark, the Flood, his son's refusal to board, and the landing on Al-Judi.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "nuhflood-surah-nuh",
        surahNumber: 71, ayahStart: 1, ayahEnd: 28,
        title: "Surah Nuh — In His Own Voice",
        description: "An entire surah narrated as Nuh's own account of his mission, his people's specific idols, and his final prayer.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "nuhflood-muminun-account", surahNumber: 23, ayahStart: 23, ayahEnd: 30, source: "quran", verificationStatus: "verified" },
      { id: "nuhflood-qamar-account", surahNumber: 54, ayahStart: 9, ayahEnd: 17, source: "quran", verificationStatus: "verified" },
    ],
    episodes: [
      {
        id: "nuhflood-ep1",
        title: "The Call and Rejection",
        summary: "Nuh preaches 'night and day, in public and in private' for a very long span; only a small number believe.",
        passages: [{ id: "nuhflood-ep1-p1", surahNumber: 71, ayahStart: 1, ayahEnd: 20, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "nuhflood-ep2",
        title: "Building the Ark",
        summary: "Nuh is commanded to build the Ark under Allah's watch and instruction, mocked by his people as he does so.",
        passages: [{ id: "nuhflood-ep2-p1", surahNumber: 11, ayahStart: 37, ayahEnd: 38, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "nuhflood-ep3",
        title: "The Flood and the Landing on Al-Judi",
        summary: "The Flood comes, Nuh's own son refuses to board and drowns, and the Ark eventually comes to rest on Al-Judi once the waters recede.",
        passages: [{ id: "nuhflood-ep3-p1", surahNumber: 11, ayahStart: 40, ayahEnd: 44, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["nuh"],
    communityIds: ["peopleofnuh"],
    placeIds: ["mountjudi"],
    lessons: [
      { text: "Family relation does not itself guarantee salvation — Nuh's own son is not saved for lack of belief.", basis: "quran_explicit", quranReferences: [asRef(11, 45), asRef(11, 46)] },
      { text: "Sustained patience in calling people to Allah is modeled across a scale of time the Qur'an itself calls extraordinary (29:14).", basis: "quran_explicit", quranReferences: [asRef(29, 14)] },
    ],
    sources: [{ type: "quran", citation: "Hud 11:25-49; Surah Nuh 71:1-28" }],
  },

  {
    id: "ibrahimnarrative",
    title: "Ibrahim's Narrative",
    arabicTitle: "قصة إبراهيم",
    alternateTitles: ["Ibrahim and the Idols", "Ibrahim and the Fire", "Ibrahim and His Guests"],
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "A parent narrative spanning Ibrahim's confrontation with his father and people over idol worship, his ordeal in the fire, the angelic guests who bring news of Ishaq and of Lut's people's fate, and the trial of sacrifice culminating in raising the House with Isma'il.",
    themes: ["Confronting inherited falsehood, even from one's own father", "Trial answered with complete submission", "A House built together, across generations"],
    outcome: "Ibrahim is saved from the fire unharmed, is given Ishaq (and, earlier, Isma'il) despite old age, and — with Isma'il — raises the foundations of the Ka'bah.",
    primaryPassages: [
      {
        id: "ibrahimnarrative-anbiya-fire",
        surahNumber: 21, ayahStart: 51, ayahEnd: 73,
        title: "Breaking the Idols and the Fire",
        description: "Ibrahim's reasoning against idolatry, breaking the idols, and being cast into — and saved from — the fire.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ibrahimnarrative-hud-guests",
        surahNumber: 11, ayahStart: 69, ayahEnd: 76,
        title: "The Angelic Guests",
        description: "The messengers' visit, glad tidings of Ishaq, and news of the judgment coming on Lut's people.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ibrahimnarrative-saffat-sacrifice",
        surahNumber: 37, ayahStart: 83, ayahEnd: 113,
        title: "The Trial of Sacrifice",
        description: "Ibrahim's vision, his son's willing submission, the redemption of the sacrifice, and the promise of Ishaq.",
        storyOrder: 3, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ibrahimnarrative-baqarah-house",
        surahNumber: 2, ayahStart: 124, ayahEnd: 141,
        title: "Raising the House",
        description: "Ibrahim's trials, the covenant, and raising the foundations of the Ka'bah with Isma'il.",
        storyOrder: 4, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "ibrahimnarrative-shuara-idols", surahNumber: 26, ayahStart: 69, ayahEnd: 89, source: "quran", verificationStatus: "verified" },
      { id: "ibrahimnarrative-maryam-father", surahNumber: 19, ayahStart: 41, ayahEnd: 50, source: "quran", verificationStatus: "verified" },
    ],
    episodes: [
      {
        id: "ibrahimnarrative-ep1",
        title: "Confronting Idolatry",
        summary: "Ibrahim reasons publicly against his father's and people's idol worship and breaks the idols 'into fragments, except the biggest of them.'",
        passages: [{ id: "ibrahimnarrative-ep1-p1", surahNumber: 21, ayahStart: 51, ayahEnd: 58, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "ibrahimnarrative-ep2",
        title: "The Fire",
        summary: "His people cast him into a fire commanded by Allah to be 'cool and safe' for him.",
        passages: [{ id: "ibrahimnarrative-ep2-p1", surahNumber: 21, ayahStart: 68, ayahEnd: 70, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "ibrahimnarrative-ep3",
        title: "The Angelic Guests and Glad Tidings",
        summary: "Messengers visit with news of Ishaq's birth and of the coming judgment on Lut's people.",
        passages: [{ id: "ibrahimnarrative-ep3-p1", surahNumber: 11, ayahStart: 69, ayahEnd: 73, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "ibrahimnarrative-ep4",
        title: "The Trial of Sacrifice and Raising the House",
        summary: "Ibrahim's vision of sacrificing his son, the son's willing submission, the sacrifice's redemption, and — later — raising the Ka'bah's foundations with Isma'il.",
        passages: [{ id: "ibrahimnarrative-ep4-p1", surahNumber: 37, ayahStart: 99, ayahEnd: 113, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["ibrahim", "azar", "ismail", "ishaq", "ibrahimwife", "namrud"],
    placeIds: ["makkah", "almasjidalharam"],
    relatedStoryIds: ["lutandhispeople"],
    lessons: [
      { text: "Standing for truth applies even within one's own family, delivered with respect ('O my father') rather than contempt.", basis: "quran_explicit", quranReferences: [asRef(19, 42), asRef(19, 45)] },
      { text: "Complete submission to a command is modeled by both father and son together, not imposed on one alone.", basis: "quran_explicit", quranReferences: [asRef(37, 102), asRef(37, 103)] },
    ],
    sources: [{ type: "quran", citation: "Al-Anbiya 21:51-73; Hud 11:69-76; As-Saffat 37:83-113; Al-Baqarah 2:124-141" }],
    statusNotes: [
      "IMPORTANT: As-Saffat 37:99-113 does not name which son is to be sacrificed — this entry does not assert Isma'il (or Ishaq), matching the same caution already documented on both their own Persons-module entries.",
      "The specific identity of the king who disputed with Ibrahim about his Lord (2:258, traditionally 'Namrud'/Nimrod) and the fire episode are two separate incidents in the Qur'an, not explicitly the same confrontation — this entry keeps them as distinct episodes/passages rather than merging them into one scene the way some popular retellings do.",
      "This entry deliberately spans what popular usage often treats as separate 'stories' (idols, fire, guests, sacrifice) as episodes of one narrative, since the Qur'an itself repeatedly frames them as parts of the same life's trials, not unrelated incidents — see this file's own header comment for the Story/Episode design rationale.",
    ],
  },

  {
    id: "lutandhispeople",
    title: "Lut and His People",
    arabicTitle: "لوط وقومه",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Lut's warning to his people over an act the Qur'an calls unprecedented, the angelic messengers' visit, and the town's destruction — sparing Lut's household except his wife.",
    themes: ["A practice the Qur'an calls unprecedented", "Rejection escalating to threats", "A spouse's unbelief within a prophet's own household"],
    outcome: "The town is overturned and struck with a shower of stones; Lut and his believing family are saved, except his wife.",
    primaryPassages: [
      {
        id: "lutandhispeople-hud-account",
        surahNumber: 11, ayahStart: 77, ayahEnd: 83,
        title: "The Messengers and the Overturned Town",
        description: "The angelic messengers' visit to Lut, his people's response, and the town's destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "lutandhispeople-araf-account", surahNumber: 7, ayahStart: 80, ayahEnd: 84, source: "quran", verificationStatus: "verified" },
      { id: "lutandhispeople-shuara-account", surahNumber: 26, ayahStart: 160, ayahEnd: 175, source: "quran", verificationStatus: "verified" },
    ],
    episodes: [
      {
        id: "lutandhispeople-ep1",
        title: "The Warning",
        summary: "Lut warns his people against their practice, described as unprecedented 'among the worlds'; they threaten to expel him.",
        passages: [{ id: "lutandhispeople-ep1-p1", surahNumber: 7, ayahStart: 80, ayahEnd: 82, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "lutandhispeople-ep2",
        title: "The Messengers' Visit and Destruction",
        summary: "Angelic guests arrive at Lut's house; the town presses upon it; the town is overturned and struck with stones.",
        passages: [{ id: "lutandhispeople-ep2-p1", surahNumber: 11, ayahStart: 77, ayahEnd: 83, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["lut", "lutwife", "ibrahim"],
    communityIds: ["peopleoflut"],
    relatedStoryIds: ["ibrahimnarrative"],
    lessons: [
      { text: "Rescue is tied to belief and conduct, not to a relationship, even within a prophet's own household.", basis: "quran_explicit", quranReferences: [asRef(66, 10)] },
    ],
    sources: [{ type: "quran", citation: "Hud 11:77-83; Al-A'raf 7:80-84" }],
  },

  {
    id: "yusufstory",
    title: "Yusuf",
    arabicTitle: "قصة يوسف",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "The one narrative the Qur'an itself calls 'the best of stories' (12:3) and tells as a single continuous account in one surah: betrayal by his brothers, slavery, temptation, imprisonment, and rise to authority in Egypt, ending in reconciliation.",
    themes: ["Patience through repeated trial", "Forgiveness offered from a position of real power", "Interpretation of dreams as a granted gift"],
    outcome: "Yusuf rises to authority over Egypt's stores, is reunited with his family, and forgives his brothers directly.",
    primaryPassages: [
      {
        id: "yusufstory-full-surah",
        surahNumber: 12, ayahStart: 4, ayahEnd: 101,
        title: "Surah Yusuf, in Full",
        description: "The complete, single continuous telling — the Qur'an's own example of one uninterrupted narrative.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "yusufstory-ep1",
        title: "The Dream and the Betrayal",
        summary: "Yusuf's dream draws his brothers' jealousy; they cast him into a well.",
        passages: [{ id: "yusufstory-ep1-p1", surahNumber: 12, ayahStart: 4, ayahEnd: 20, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "yusufstory-ep2",
        title: "Egypt and the Temptation",
        summary: "Sold into slavery, Yusuf resists the temptation of his master's wife.",
        passages: [{ id: "yusufstory-ep2-p1", surahNumber: 12, ayahStart: 21, ayahEnd: 35, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "yusufstory-ep3",
        title: "Prison and Interpretation",
        summary: "Yusuf interprets fellow prisoners' dreams, then the king's, and rises to authority.",
        passages: [{ id: "yusufstory-ep3-p1", surahNumber: 12, ayahStart: 36, ayahEnd: 57, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "yusufstory-ep4",
        title: "Reunion and Reconciliation",
        summary: "His brothers' journeys to Egypt, the test with Binyamin, and the family's reunion.",
        passages: [{ id: "yusufstory-ep4-p1", surahNumber: 12, ayahStart: 58, ayahEnd: 101, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["yusuf", "yaqub", "alaziz", "alazizwife", "kingofegypt", "yusufbrothers"],
    placeIds: ["egypt"],
    lessons: [
      { text: "Trials endured with patience can be followed by a position of great responsibility and mercy toward those who wronged you.", basis: "quran_explicit", quranReferences: [asRef(12, 90), asRef(12, 92)] },
      { text: "Seeking refuge in Allah, not one's own resolve alone, is presented as the real defense against temptation.", basis: "quran_explicit", quranReferences: [asRef(12, 23), asRef(12, 24)] },
    ],
    sources: [{ type: "quran", citation: "Yusuf 12:3-101" }],
    statusNotes: [
      "The Qur'an itself explicitly frames this as one of the strongest examples of a self-contained, sequential narrative (12:3, 'the best of stories') — `narrativeStatus: 'quran_complete'` and the absence of a separate `supportingPassages` array both reflect that this story does not need to be reassembled from scattered retellings the way most others in this file do.",
    ],
  },

  {
    id: "musaandpharaoh",
    title: "Musa and Pharaoh",
    arabicTitle: "موسى وفرعون",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "Musa's birth and rescue, flight to Madyan, calling at the sacred valley, confrontation with Fir'aun and his magicians, and the Exodus culminating in the sea crossing.",
    themes: ["Deliverance from tyranny", "Signs escalating against repeated denial", "A tyrant's power ending in drowning"],
    outcome: "Musa leads Bani Isra'il out of Egypt; Fir'aun and his army drown pursuing them at the sea.",
    primaryPassages: [
      {
        id: "musaandpharaoh-qasas-earlylife",
        surahNumber: 28, ayahStart: 3, ayahEnd: 28,
        title: "Early Life, Exile, and Madyan",
        description: "Musa's birth and rescue, the accidental killing, flight to Madyan, and his marriage.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "musaandpharaoh-taha-calling",
        surahNumber: 20, ayahStart: 9, ayahEnd: 79,
        title: "The Calling and Confrontation, in Ta-Ha",
        description: "The burning bush, the miracles given, and the confrontation with Fir'aun and his magicians.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
      {
        id: "musaandpharaoh-shuara-exodus",
        surahNumber: 26, ayahStart: 10, ayahEnd: 68,
        title: "Confrontation and the Exodus, in Ash-Shu'ara",
        description: "Musa and Harun before Fir'aun, the contest with the magicians, and the crossing of the sea.",
        storyOrder: 3, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "musaandpharaoh-ep1",
        title: "Birth and Rescue",
        summary: "Musa's mother sets him adrift; he is found and raised in Fir'aun's own household.",
        passages: [{ id: "musaandpharaoh-ep1-p1", surahNumber: 28, ayahStart: 7, ayahEnd: 13, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandpharaoh-ep2",
        title: "Madyan",
        summary: "After an accidental killing, Musa flees to Madyan, draws water for two women, and marries into their household.",
        passages: [{ id: "musaandpharaoh-ep2-p1", surahNumber: 28, ayahStart: 22, ayahEnd: 28, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandpharaoh-ep3",
        title: "The Calling at Tuwa",
        summary: "Musa is called to prophethood at the sacred valley and given the staff and hand as signs.",
        passages: [{ id: "musaandpharaoh-ep3-p1", surahNumber: 20, ayahStart: 9, ayahEnd: 36, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandpharaoh-ep4",
        title: "Confrontation with Fir'aun",
        summary: "Musa and Harun deliver the message to Fir'aun; the contest with the magicians, who then believe.",
        passages: [{ id: "musaandpharaoh-ep4-p1", surahNumber: 26, ayahStart: 23, ayahEnd: 51, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandpharaoh-ep5",
        title: "The Exodus and Sea Crossing",
        summary: "Musa leads the Israelites out of Egypt; Fir'aun's pursuing army drowns at the sea.",
        passages: [{ id: "musaandpharaoh-ep5-p1", surahNumber: 26, ayahStart: 52, ayahEnd: 68, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["musa", "harun", "firaun", "firaunwife", "believingman", "musawarner", "sahara"],
    communityIds: ["aalfiraun"],
    placeIds: ["egypt", "madinah", "sinai", "tuwa", "thesea"],
    relatedStoryIds: ["musaandbaniisrael", "musaandkhidr"],
    lessons: [
      { text: "Allah's help can arrive at the point of complete apparent hopelessness ('Indeed, with me is my Lord; He will guide me').", basis: "quran_explicit", quranReferences: [asRef(26, 62)] },
    ],
    sources: [{ type: "quran", citation: "Al-Qasas 28:3-28; Ta-Ha 20:9-79; Ash-Shu'ara 26:10-68" }],
    statusNotes: [
      "This entry deliberately ends at the sea crossing; the covenant, golden calf, and wilderness period that follow are told as a separate story ('Musa and the Children of Israel') since they represent a distinct arc — Musa's relationship with his own people rather than confrontation with an external tyrant. See that entry's own statusNotes for the reasoning.",
    ],
  },

  {
    id: "musaandbaniisrael",
    title: "Musa and the Children of Israel",
    arabicTitle: "موسى وبنو إسرائيل",
    storyType: "communal_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "After the Exodus: the covenant at the Mount, the golden calf, and the refusal to enter the Holy Land that led to forty years of wandering.",
    themes: ["A covenant repeatedly renewed and repeatedly broken", "Leadership over a people prone to fear and impatience"],
    outcome: "The covenant is taken and broken more than once; the refusal to enter the Holy Land results in forty years of wandering before a new generation is finally able to enter.",
    primaryPassages: [
      {
        id: "musaandbaniisrael-baqarah-covenant",
        surahNumber: 2, ayahStart: 51, ayahEnd: 61,
        title: "The Covenant, the Calf, and Their Complaints",
        description: "The covenant taken at the Mount, the golden calf made in Musa's absence, and a series of specific complaints and favors recalled.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "musaandbaniisrael-maidah-refusal",
        surahNumber: 5, ayahStart: 20, ayahEnd: 26,
        title: "The Refusal to Enter the Holy Land",
        description: "Musa's command to enter, the people's fearful refusal, and the forty-year consequence.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "musaandbaniisrael-taha-calf", surahNumber: 20, ayahStart: 83, ayahEnd: 98, source: "quran", verificationStatus: "verified" },
      { id: "musaandbaniisrael-araf-covenant", surahNumber: 7, ayahStart: 142, ayahEnd: 156, source: "quran", verificationStatus: "verified" },
    ],
    episodes: [
      {
        id: "musaandbaniisrael-ep1",
        title: "The Covenant at the Mount",
        summary: "The Mount is described as 'raised over them' as the covenant is taken.",
        passages: [{ id: "musaandbaniisrael-ep1-p1", surahNumber: 2, ayahStart: 63, ayahEnd: 63, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandbaniisrael-ep2",
        title: "The Golden Calf",
        summary: "In Musa's forty-night absence, Samiri leads the people to worship a calf; Musa's confrontation on his return.",
        passages: [{ id: "musaandbaniisrael-ep2-p1", surahNumber: 20, ayahStart: 83, ayahEnd: 98, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandbaniisrael-ep3",
        title: "The Holy Land Refusal and Wandering",
        summary: "Commanded to enter the Holy Land, the people refuse out of fear, resulting in forty years of wandering.",
        passages: [{ id: "musaandbaniisrael-ep3-p1", surahNumber: 5, ayahStart: 21, ayahEnd: 26, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["musa", "harun", "samiri"],
    communityIds: ["baniisrael"],
    placeIds: ["sinai", "theholyland"],
    relatedStoryIds: ["musaandpharaoh", "thecow"],
    lessons: [
      { text: "Fear of a described obstacle led a people to refuse a command directly given to them, with a stated forty-year consequence — a caution against fear overriding a clear instruction.", basis: "quran_explicit", quranReferences: [asRef(5, 24), asRef(5, 26)] },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:51-61; Al-Ma'idah 5:20-26" }],
  },

  {
    id: "thecow",
    title: "The Cow (Al-Baqarah)",
    arabicTitle: "قصة البقرة",
    storyType: "communal_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Musa commands Bani Isra'il to sacrifice a cow; their repeated, reluctant questioning narrows the description until they finally comply — after which a dead man is struck with a piece of it and revived, the surah's own namesake narrative.",
    themes: ["Reluctant, over-questioning compliance", "A sign given directly in response to that reluctance"],
    outcome: "The cow is eventually sacrificed after extensive questioning; a slain man is struck with part of it and revived, given as a direct sign.",
    primaryPassages: [
      {
        id: "thecow-baqarah-account",
        surahNumber: 2, ayahStart: 67, ayahEnd: 73,
        title: "The Full Narrative",
        description: "Musa's command, the people's repeated questions narrowing the cow's description, their compliance, and the sign of the revived man.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["musa"],
    communityIds: ["baniisrael"],
    relatedStoryIds: ["musaandbaniisrael"],
    lessons: [
      { text: "Excessive questioning of a clear command is shown making an easy matter difficult for the ones asking, not for the one who gave it.", basis: "derived_thematic", quranReferences: [asRef(2, 70), asRef(2, 71)] },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:67-73" }],
    statusNotes: [
      "This is a self-contained, single-passage narrative — kept as its own Story (related to, but not folded into, 'Musa and the Children of Israel') because of its independent fame as the surah's own namesake account and because merging it would bury a well-known, distinctly-shaped narrative inside a much larger one.",
    ],
  },

  {
    id: "musaandkhidr",
    title: "Musa and Khidr",
    arabicTitle: "موسى والخضر",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Musa journeys to learn from a righteous servant of Allah (traditionally 'Al-Khidr'), who acts in three ways Musa cannot reconcile until each is explained by unseen knowledge Musa did not have.",
    themes: ["Unseen wisdom behind apparently wrong actions", "Patience with what is not yet understood", "Even a prophet as a learner"],
    outcome: "After three tested departures from their agreement not to question, Musa and Khidr part ways once each of the three deeds is explained.",
    primaryPassages: [
      {
        id: "musaandkhidr-kahf-account",
        surahNumber: 18, ayahStart: 60, ayahEnd: 82,
        title: "The Journey and the Three Deeds",
        description: "Musa's request to follow him, the condition set, the three episodes, and the explanation given at the end.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "musaandkhidr-ep1",
        title: "The Boat",
        summary: "Khidr damages a boat belonging to poor fishermen — later explained as protecting it from a king seizing every sound boat by force.",
        passages: [{ id: "musaandkhidr-ep1-p1", surahNumber: 18, ayahStart: 71, ayahEnd: 71, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandkhidr-ep2",
        title: "The Boy",
        summary: "Khidr kills a young boy — explained as sparing his believing parents a future of grief and rebellion the boy would have caused them.",
        passages: [{ id: "musaandkhidr-ep2-p1", surahNumber: 18, ayahStart: 74, ayahEnd: 74, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "musaandkhidr-ep3",
        title: "The Wall",
        summary: "Khidr repairs a wall for no apparent reward in a town that refused them hospitality — explained as protecting a treasure beneath it belonging to two orphan boys.",
        passages: [{ id: "musaandkhidr-ep3-p1", surahNumber: 18, ayahStart: 77, ayahEnd: 82, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["musa", "khidr"],
    relatedStoryIds: ["musaandpharaoh"],
    lessons: [
      { text: "Outward appearances can conceal a deeper wisdom not yet visible — patience is asked of Musa before, not after, understanding.", basis: "quran_explicit", quranReferences: [asRef(18, 68), asRef(18, 82)] },
    ],
    sources: [{ type: "quran", citation: "Al-Kahf 18:60-82" }],
    statusNotes: [
      "Kept as its own Story, separate from 'Musa and Pharaoh,' since it is thematically and narratively distinct (a journey of learning unseen wisdom, not a confrontation with a ruling power) despite sharing the same central figure — matching how the phased plan's own candidate list treats them as separate items.",
    ],
  },

  {
    id: "dawudandjalut",
    title: "Talut, Dawud, and Jalut",
    arabicTitle: "طالوت وداود وجالوت",
    alternateTitles: ["Dawud and Jalut", "Saul, David, and Goliath"],
    storyType: "communal_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "A king (Talut) is chosen for Bani Isra'il despite objections over his wealth, a small army is tested at a river, and the young Dawud kills the enemy commander Jalut in single combat.",
    themes: ["A test that filters a large force down to a small, committed one", "Victory not measured by numbers"],
    outcome: "Dawud kills Jalut; Allah gives Dawud kingship and wisdom afterward.",
    primaryPassages: [
      {
        id: "dawudandjalut-baqarah-account",
        surahNumber: 2, ayahStart: 246, ayahEnd: 251,
        title: "The Full Narrative",
        description: "Talut's selection, the river test, the small army's confidence, and Dawud's killing of Jalut.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "dawudandjalut-ep1",
        title: "Talut's Selection and the River Test",
        summary: "Talut is chosen as king despite objections; the army is tested by a river, and only a small number pass.",
        passages: [{ id: "dawudandjalut-ep1-p1", surahNumber: 2, ayahStart: 246, ayahEnd: 249, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "dawudandjalut-ep2",
        title: "The Battle and Jalut's Death",
        summary: "The small army faces Jalut's forces; Dawud kills Jalut, and Allah grants him kingship and wisdom.",
        passages: [{ id: "dawudandjalut-ep2-p1", surahNumber: 2, ayahStart: 250, ayahEnd: 251, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["talut", "dawud", "jalut"],
    communityIds: ["baniisrael"],
    lessons: [
      { text: "A small, committed group is stated to have overcome a much larger one 'by Allah's permission,' not by numerical strength.", basis: "quran_explicit", quranReferences: [asRef(2, 249)] },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:246-251" }],
  },

  {
    id: "sulaimanandsaba",
    title: "Sulaiman and Saba'",
    arabicTitle: "سليمان وسبأ",
    alternateTitles: ["Sulaiman and the Queen of Sheba"],
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "The hoopoe's report of a sun-worshipping kingdom ruled by a woman, Sulaiman's letter, her council's counsel, her visit to his court, and her declaration of submission to Allah.",
    themes: ["Wise counsel over pride", "Recognizing truth and correcting one's own error"],
    outcome: "The queen submits with Sulaiman to 'Allah, Lord of the worlds.'",
    primaryPassages: [
      {
        id: "sulaimanandsaba-naml-account",
        surahNumber: 27, ayahStart: 20, ayahEnd: 44,
        title: "The Full Narrative",
        description: "The hoopoe's report, Sulaiman's letter, her council's counsel, her visit, and her submission.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["sulaiman", "bilqis"],
    communityIds: ["saba"],
    lessons: [
      { text: "She consults her council before deciding and states plainly that kings 'ruin a city' when they conquer it by force — measured judgment shown before, not only after, her conversion.", basis: "quran_explicit", quranReferences: [asRef(27, 32), asRef(27, 34)] },
    ],
    sources: [{ type: "quran", citation: "An-Naml 27:20-44" }],
  },

  {
    id: "ayyubstory",
    title: "Ayyub",
    arabicTitle: "قصة أيوب",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "Ayyub's affliction, his call upon his Lord, and the relief and restoration granted — the Qur'an's own model of patience through hardship.",
    themes: ["Patience through prolonged affliction", "Calling on Allah without complaint against Him"],
    outcome: "Ayyub's affliction is removed and his family/means restored, described as 'a mercy from Us and a reminder for the worshippers.'",
    primaryPassages: [
      {
        id: "ayyubstory-anbiya-account",
        surahNumber: 21, ayahStart: 83, ayahEnd: 84,
        title: "The Core Narrative in Al-Anbiya",
        description: "Ayyub's call and the relief granted.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ayyubstory-sad-account",
        surahNumber: 38, ayahStart: 41, ayahEnd: 44,
        title: "The Account in Sad",
        description: "Ayyub's affliction, his call, and the restoration, including an instruction about an earlier oath.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["ayyub"],
    lessons: [
      { text: "Ayyub's own words to Allah state hardship without complaint against Him: 'affliction has touched me, and You are the Most Merciful of the merciful.'", basis: "quran_explicit", quranReferences: [asRef(21, 83)] },
    ],
    sources: [{ type: "quran", citation: "Al-Anbiya 21:83-84; Sad 38:41-44" }],
    statusNotes: [
      "The Qur'an does not detail the specific nature or duration of Ayyub's affliction, nor the elaborate loss-of-family/wealth narrative popular retellings often supply — this entry states only what 21:83-84 and 38:41-44 themselves say.",
    ],
  },

  {
    id: "yunusstory",
    title: "Yunus",
    arabicTitle: "قصة يونس",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "Yunus leaves his people in anger before receiving permission, is swallowed by a fish, calls out from within it, and is cast onto land before returning to a people who — uniquely — had by then believed.",
    themes: ["Leaving a mission without permission has a consequence", "A prayer of acknowledgment answered from extremity"],
    outcome: "Yunus is cast onto barren land and recovers; he returns to a people who, unusually, are found to have believed and are spared.",
    primaryPassages: [
      {
        id: "yunusstory-saffat-account",
        surahNumber: 37, ayahStart: 139, ayahEnd: 148,
        title: "The Fullest Account, in As-Saffat",
        description: "Yunus's flight, the fish, his prayer, being cast ashore, and his return to a believing people.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "yunusstory-anbiya-account", surahNumber: 21, ayahStart: 87, ayahEnd: 88, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["yunus"],
    communityIds: ["peopleofyunus"],
    lessons: [
      { text: "His own prayer from within the fish — 'there is no deity except You; exalted are You. Indeed, I have been of the wrongdoers' — is given as the Qur'an's own model supplication in distress (21:88 states it was answered specifically because of this).", basis: "quran_explicit", quranReferences: [asRef(21, 87), asRef(21, 88)] },
    ],
    sources: [{ type: "quran", citation: "As-Saffat 37:139-148; Al-Anbiya 21:87-88" }],
  },

  {
    id: "zakariyyayahya",
    title: "Zakariyya and Yahya",
    arabicTitle: "زكريا ويحيى",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Zakariyya's private prayer for a righteous heir in old age, the sign given to him, and the birth of Yahya, given wisdom 'while yet a boy.'",
    themes: ["A private prayer answered", "A sign requested and given as reassurance, not doubt"],
    outcome: "Yahya is born and given the Book/wisdom 'while yet a boy,' with a life the Qur'an describes as devoted to compassion, purity, and dutifulness.",
    primaryPassages: [
      {
        id: "zakariyyayahya-maryam-account",
        surahNumber: 19, ayahStart: 2, ayahEnd: 15,
        title: "The Full Narrative in Surah Maryam",
        description: "Zakariyya's private prayer, the sign given, and Yahya's birth and description.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "zakariyyayahya-imran-account", surahNumber: 3, ayahStart: 38, ayahEnd: 41, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["zakariyya", "yahya"],
    lessons: [
      { text: "Asking for a sign after a promise is shown as reassurance-seeking, not doubt, and is answered rather than rebuked.", basis: "quran_explicit", quranReferences: [asRef(19, 10)] },
    ],
    sources: [{ type: "quran", citation: "Maryam 19:2-15" }],
  },

  {
    id: "maryamandisa",
    title: "Maryam and Isa",
    arabicTitle: "مريم وعيسى",
    storyType: "prophetic_narrative",
    narrativeStatus: "quran_fragmentary",
    shortDescription:
      "Maryam's upbringing and the annunciation, Isa's birth and his speaking in the cradle in her defense, his later ministry and miracles, the disciples' request for a table from heaven, and the Qur'an's own denial of his crucifixion.",
    themes: ["Miracles explicitly attributed to Allah's permission, not Isa's own power", "A mother defended by her own newborn son", "Rejection of divinity claims"],
    outcome: "Isa is not killed or crucified, per the Qur'an, but raised up to Allah; his own words are recorded disavowing any claim to have asked to be worshipped.",
    primaryPassages: [
      {
        id: "maryamandisa-imran-annunciation",
        surahNumber: 3, ayahStart: 33, ayahEnd: 51,
        title: "The Annunciation and Early Miracles",
        description: "Maryam's family, the announcement of Isa's birth, and his early miracles and mission.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "maryamandisa-maryam-birth",
        surahNumber: 19, ayahStart: 16, ayahEnd: 34,
        title: "The Birth Narrative",
        description: "Maryam's seclusion, the birth, and Isa speaking in the cradle in her defense.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
      {
        id: "maryamandisa-maidah-dialogue",
        surahNumber: 5, ayahStart: 109, ayahEnd: 120,
        title: "The Day-of-Judgment Dialogue",
        description: "Allah's dialogue with Isa disavowing any claim that he told people to worship him and his mother as gods.",
        storyOrder: 3, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "maryamandisa-ep1",
        title: "Maryam's Upbringing and the Annunciation",
        summary: "Maryam, dedicated to the Temple, is visited by an angel announcing Isa's birth.",
        passages: [{ id: "maryamandisa-ep1-p1", surahNumber: 19, ayahStart: 16, ayahEnd: 21, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "maryamandisa-ep2",
        title: "The Birth and Defense in the Cradle",
        summary: "Isa is born; on returning to her people, Maryam points to the infant, who speaks in her defense.",
        passages: [{ id: "maryamandisa-ep2-p1", surahNumber: 19, ayahStart: 27, ayahEnd: 33, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "maryamandisa-ep3",
        title: "Ministry and Miracles",
        summary: "Isa's mission to the Children of Israel and his miracles, explicitly 'by Allah's permission' in every instance.",
        passages: [{ id: "maryamandisa-ep3-p1", surahNumber: 3, ayahStart: 49, ayahEnd: 51, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "maryamandisa-ep4",
        title: "The Disciples and the Table",
        summary: "The disciples ask Isa for a table of food from heaven as a sign; it is granted, with a warning attached.",
        passages: [{ id: "maryamandisa-ep4-p1", surahNumber: 5, ayahStart: 111, ayahEnd: 115, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "maryamandisa-ep5",
        title: "Denial of the Crucifixion",
        summary: "The Qur'an states Isa was not killed or crucified but that it was made to appear so, and that he was raised up.",
        passages: [{ id: "maryamandisa-ep5-p1", surahNumber: 4, ayahStart: 157, ayahEnd: 158, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["isa", "maryam", "maryammother", "zakariyya", "hawariyyun"],
    lessons: [
      { text: "Every miracle performed through Isa is explicitly attributed to Allah's permission, not to his own power.", basis: "quran_explicit", quranReferences: [asRef(3, 49), asRef(5, 110)] },
      { text: "Isa's own words, per the Qur'an, disavow any claim that he asked to be worshipped.", basis: "quran_explicit", quranReferences: [asRef(5, 116), asRef(5, 117)] },
    ],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:33-51; Maryam 19:16-34; Al-Ma'idah 5:109-120; An-Nisa 4:157-158" }],
  },

  {
    id: "peopleofthecavestory",
    title: "People of the Cave",
    arabicTitle: "أصحاب الكهف",
    storyType: "group_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Young believers flee persecution to a cave, are made to sleep for a long span of years as a sign, wake believing only a day has passed, and are eventually discovered — with the Qur'an itself instructing against speculating over their exact number.",
    themes: ["Refuge in faith under persecution", "Allah's power over time", "The Qur'an's own caution against speculation"],
    outcome: "Their eventual discovery becomes a public sign of the resurrection; the Qur'an declines to settle their exact number, era, or count of years.",
    primaryPassages: [
      {
        id: "peopleofthecavestory-kahf-account",
        surahNumber: 18, ayahStart: 9, ayahEnd: 26,
        title: "The Full Narrative",
        description: "Taking refuge, the long sleep, waking, and the sign becoming known — including the Qur'an's own caution against speculating over their number.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["ashabalkahf"],
    placeIds: ["alkahf"],
    lessons: [
      { text: "The Qur'an itself models restraint about a detail it does not resolve — instructing believers not to argue over the youths' exact number.", basis: "quran_explicit", quranReferences: [asRef(18, 22)] },
    ],
    sources: [{ type: "quran", citation: "Al-Kahf 18:9-26" }],
    statusNotes: [
      "This Story does not restate the group's own profile (already a full entry in People & Groups) or the location's own profile (already in Places) — it exists specifically to give the narrative-sequence view those two entries aren't designed to carry, cross-linking both.",
    ],
  },

  {
    id: "peopleofthetrenchstory",
    title: "People of the Trench",
    arabicTitle: "أصحاب الأخدود",
    storyType: "group_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "Believers burned alive in a trench of fire by a persecuting people whose only stated grievance against them was their belief in Allah.",
    themes: ["Steadfastness under the ultimate persecution", "Faith valued over life itself"],
    outcome: "The believers are burned; the Qur'an states their only offense was belief in Allah, with no further narrative resolution given for the persecutors.",
    primaryPassages: [
      {
        id: "peopleofthetrenchstory-buruj-account",
        surahNumber: 85, ayahStart: 4, ayahEnd: 8,
        title: "The Full Narrative",
        description: "The trench of fire, the persecuting people watching, and the believers' only stated offense.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["ashabalukhdud"],
    lessons: [
      { text: "The Qur'an states their only offense was belief in Allah — no other cause is offered for the persecution.", basis: "quran_explicit", quranReferences: [asRef(85, 8)] },
    ],
    sources: [{ type: "quran", citation: "Al-Buruj 85:4-8" }],
  },

  {
    id: "peopleoftheelephantstory",
    title: "People of the Elephant",
    arabicTitle: "أصحاب الفيل",
    storyType: "group_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "An army marching with elephants to attack the Ka'bah is destroyed by flocks of birds throwing stones of baked clay — the whole of a short surah devoted to the one event.",
    themes: ["Divine protection of the sanctuary", "A materially overwhelming force made to fail"],
    outcome: "The army is destroyed, left 'like eaten straw.'",
    primaryPassages: [
      {
        id: "peopleoftheelephantstory-fil-account",
        surahNumber: 105, ayahStart: 1, ayahEnd: 5,
        title: "Surah Al-Fil, in Full",
        description: "The plan, and the destruction by birds and stones of baked clay.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["ashabalfil"],
    placeIds: ["makkah", "almasjidalharam"],
    lessons: [
      { text: "A materially overwhelming force is shown as no match at all for Allah's decree.", basis: "quran_explicit", quranReferences: [asRef(105, 1), asRef(105, 2)] },
    ],
    sources: [{ type: "quran", citation: "Al-Fil 105:1-5" }],
  },

  {
    id: "qarunstory",
    title: "Qarun",
    arabicTitle: "قصة قارون",
    storyType: "individual_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "A wealthy member of Musa's people grows arrogant over his riches, is warned by those with knowledge, boasts the wealth is his own doing, and is swallowed by the earth along with his home.",
    themes: ["Wealth attributed to one's own skill rather than Allah", "A stated warning preceding the consequence"],
    outcome: "Qarun and his home are swallowed by the earth; those who had envied him reconsider, recognizing 'it is not the wrongdoers who will succeed.'",
    primaryPassages: [
      {
        id: "qarunstory-qasas-account",
        surahNumber: 28, ayahStart: 76, ayahEnd: 82,
        title: "The Full Narrative",
        description: "Qarun's wealth and arrogance, the warning given to him, his boast, and his destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    personIds: ["qarun", "musa"],
    communityIds: ["baniisrael"],
    lessons: [
      { text: "Qarun's own claim that his wealth came 'through knowledge I have' is directly contrasted with those who reject that framing and attribute it to Allah alone.", basis: "quran_explicit", quranReferences: [asRef(28, 78), asRef(28, 79)] },
    ],
    sources: [{ type: "quran", citation: "Al-Qasas 28:76-82" }],
  },

  {
    id: "dhulqarnaynstory",
    title: "Dhul-Qarnayn's Journeys",
    arabicTitle: "ذو القرنين",
    storyType: "journey_narrative",
    narrativeStatus: "quran_complete",
    shortDescription:
      "A Qur'anic figure granted extraordinary means undertakes three journeys — westward, eastward, and to a place between two mountains, where he builds a barrier against Ya'juj and Ma'juj.",
    themes: ["Extraordinary means used with stated justice, not exploitation", "A barrier built as protection, credited to Allah's mercy"],
    outcome: "The barrier is built; Dhul-Qarnayn attributes its success to 'a mercy from my Lord,' not his own achievement.",
    primaryPassages: [
      {
        id: "dhulqarnaynstory-kahf-account",
        surahNumber: 18, ayahStart: 83, ayahEnd: 98,
        title: "The Full Narrative",
        description: "The three journeys and the building of the barrier.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    episodes: [
      {
        id: "dhulqarnaynstory-ep1",
        title: "The Journey West",
        summary: "Dhul-Qarnayn reaches 'the setting of the sun' and is given a choice of how to treat the people there.",
        passages: [{ id: "dhulqarnaynstory-ep1-p1", surahNumber: 18, ayahStart: 85, ayahEnd: 88, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "dhulqarnaynstory-ep2",
        title: "The Journey East",
        summary: "He reaches 'the rising of the sun,' finding a people with no shelter from it.",
        passages: [{ id: "dhulqarnaynstory-ep2-p1", surahNumber: 18, ayahStart: 89, ayahEnd: 91, source: "quran", verificationStatus: "verified" }],
      },
      {
        id: "dhulqarnaynstory-ep3",
        title: "The Barrier Against Ya'juj and Ma'juj",
        summary: "Between two mountains, a people ask for protection from Ya'juj and Ma'juj; Dhul-Qarnayn builds a barrier of iron and molten copper.",
        passages: [{ id: "dhulqarnaynstory-ep3-p1", surahNumber: 18, ayahStart: 92, ayahEnd: 98, source: "quran", verificationStatus: "verified" }],
      },
    ],
    personIds: ["dhulqarnayn"],
    lessons: [
      { text: "Dhul-Qarnayn credits the barrier's success to 'a mercy from my Lord,' not to his own power or ingenuity.", basis: "quran_explicit", quranReferences: [asRef(18, 98)] },
    ],
    sources: [{ type: "quran", citation: "Al-Kahf 18:83-98" }],
    statusNotes: [
      "Ya'juj and Ma'juj themselves are referenced within this narrative but are not made a separate entity here — their status (a people? an eschatological sign, given 21:96?) remains an open boundary question flagged since Phase 2, not resolved by this entry.",
      "The places and peoples in the journeys are described in the Qur'an's own phenomenological language (where the sun 'appeared to set'/'rose upon' a people) — not mapped here onto any specific modern geography, matching Dhul-Qarnayn's own Persons-module entry.",
    ],
  },

  {
    id: "thenightjourney",
    title: "The Night Journey (Al-Isra)",
    arabicTitle: "الإسراء",
    alternateTitles: ["Isra' and Mi'raj"],
    storyType: "journey_narrative",
    narrativeStatus: "quran_primary_traditional_expansion",
    shortDescription:
      "The Prophet Muhammad ﷺ is taken by night from Al-Masjid al-Haram to Al-Masjid al-Aqsa — the Qur'an's own explicit content for this narrative is a single, dense opening verse; the far more elaborate popular account of an ascension through the heavens (the Mi'raj) is predominantly hadith-based, not the Qur'an's own narration.",
    themes: ["A journey stated, not elaborated, by the Qur'an itself"],
    outcome: "The Prophet ﷺ is taken to Al-Masjid al-Aqsa 'that We might show him of Our signs.'",
    primaryPassages: [
      {
        id: "thenightjourney-isra-account",
        surahNumber: 17, ayahStart: 1, ayahEnd: 1,
        title: "The Qur'an's Own Statement",
        description: "The single verse naming the journey from Al-Masjid al-Haram to Al-Masjid al-Aqsa.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    supportingPassages: [
      { id: "thenightjourney-najm-vision", surahNumber: 53, ayahStart: 1, ayahEnd: 18, source: "quran", verificationStatus: "verified" },
    ],
    personIds: ["muhammad"],
    placeIds: ["almasjidalharam", "almasjidalaqsa"],
    lessons: [
      { text: "The stated purpose given directly in the text is 'that We might show him of Our signs' — the journey's significance is framed around what was shown, not travel for its own sake.", basis: "quran_explicit", quranReferences: [asRef(17, 1)] },
    ],
    sources: [
      { type: "quran", citation: "Al-Isra 17:1" },
      { type: "authentic_hadith", citation: "The far more detailed Mi'raj account — passing through the heavens, meeting earlier prophets, the negotiation of the number of daily prayers — is related in hadith literature (e.g. Sahih al-Bukhari, Sahih Muslim), not narrated in this level of detail anywhere in the Qur'an text.", note: "Presented here as a distinct source tier, not folded into the Qur'anic narrative." },
    ],
    statusNotes: [
      "IMPORTANT: `narrativeStatus: 'quran_primary_traditional_expansion'` is a deliberate, load-bearing flag on this entry — the Qur'an's OWN text for this story is essentially one verse (17:1). Everything about the ascension through seven heavens, meeting specific earlier prophets in sequence, and the prayers being negotiated down from fifty to five is hadith-based tradition, not Qur'anic narration, and is not asserted as Qur'anic content anywhere in this entry.",
      "53:1-18 (An-Najm) is traditionally connected by many exegetes to a vision associated with this journey, but the passage's own text describes a vision/encounter in general terms and does not explicitly narrate a heavenly ascension in unambiguous terms — listed here as a supporting passage, not folded into the primary narrative as if it settles the connection.",
      "'Al-Masjid al-Aqsa's traditional identification with Jerusalem is disclosed on that place's own entry, not restated as settled fact here.",
    ],
  },
];

export const getStoryById = (id: string): QuranStory | undefined =>
  QURAN_STORIES.find((s) => s.id === id);

// ============================================================
// Candidates investigated and excluded (per this phase's explicit
// "if a candidate does not meet the inclusion threshold, exclude it and
// document why" instruction):
//
// - The Two Gardens (parable, 18:32-44) — already a full Person & Groups
//   entry ("gardenmen") with its own complete narrative content (it's a
//   short, self-contained parable, not a historical account). A separate
//   Story would duplicate it with nothing new to add.
// - Sabbath-breakers — already a full Peoples & Nations entry with its own
//   passages/outcome/themes, functionally already a mini-story. No
//   distinct narrative-sequence value left to add as a separate Story.
// - Ya'juj wa Ma'juj — remains the unresolved boundary case flagged since
//   Phase 2 (Peoples & Nations vs. a future Signs & Miracles module,
//   given their release is framed as an eschatological sign at 21:96).
//   Referenced within Dhul-Qarnayn's story but not made its own entity.
// - Broad "Creation" narrative (heavens/earth in six days, etc.) — the
//   creation OF ADAM specifically is the first episode of "Adam and
//   Iblis"; the wider cosmological creation account has no
//   participants/sequence in the narrative sense this module covers and
//   is better suited to a future Themes/Events module.
// - Eschatological narrative passages (Day of Judgment, Paradise/Hell
//   descriptions) — doctrinal/thematic content, not narratives with
//   identifiable participants and a sequence of earthly events. Squarely
//   out of scope for this module.
// - Al-'Aziz and his wife's own narrative — already fully carried inside
//   the "Yusuf" story's episodes; no independent arc apart from his.
// ============================================================
