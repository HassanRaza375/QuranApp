// Places — dataset types + data (Phase 3 of
// quranic_knowledge_platform_phased_plan.md). Builds on Phase 0's shared
// foundation and Phase 2's precedent (reusing QuranReference/RelatedPassage/
// SourceType/SourceReference/IdentificationBasis from
// app/utils/quranReference.ts, PersonRelationship from quranPersons.ts, and
// the same directory/detail-page/bookmark/search patterns) rather than
// inventing parallel mechanisms.
//
// Scope discipline: NOT every geographic word in the Qur'an gets an entry
// here. Included only where the location has independent Qur'anic textual
// weight (an explicit name, or a description specific enough to anchor a
// real identity) AND enough narrative/thematic significance to be worth a
// profile — see this file's own excluded-candidates note at the bottom for
// what was investigated and deliberately left out, and why.
//
// Cross-module relationships are modeled unidirectionally FROM this file:
// a Place's `relationships` (→ Persons) and `associatedCommunityIds` (→
// Peoples & Nations) fields carry the link. Neither QuranPerson nor
// QuranCommunity's own type was modified to add a reverse field — avoiding
// any change to those already-shipped, tested modules, per the phased
// plan's explicit "avoid unnecessary refactoring" instruction. A Place's
// own detail page is therefore the one place these connections are
// browsable from; this is a deliberate, documented choice, not an
// oversight — revisit only if a future phase (e.g. the Phase 10 Knowledge
// Graph) genuinely needs bidirectional traversal.
//
// Verification: every entity's core Qur'anic term was checked against this
// app's live Quran search API (alquran.cloud) at authoring time. Several
// terms use the Qur'an's generic definite-article nouns ("المدينة," "الطور,"
// "طوى") which return many matches un-related to the specific place this
// entry is about (e.g. "المدينة" ["the city"] is used generically for
// several different unnamed towns across different narratives, not only
// Madinah) — `directMentions` below reflects only the matches manually
// confirmed by reading each ayah's actual narrative context, never a raw
// substring-match count. See each entry's own statusNotes for term-specific
// caveats.
import { asRef } from "~/utils/quranReference";
import type { QuranReference, RelatedPassage, SourceReference, IdentificationBasis } from "~/utils/quranReference";
import type { PersonRelationship } from "~/data/quranPersons";

export type PlaceType =
  | "city"
  | "settlement"
  | "region"
  | "mountain"
  | "valley"
  | "land_territory"
  | "body_of_water"
  | "sanctuary_site"
  | "battlefield"
  | "other";

export type QuranPlace = {
  id: string;

  name: string;
  arabicName: string;
  alternateNames?: string[];

  placeType: PlaceType;
  identificationBasis: IdentificationBasis;

  shortDescription: string;
  detailedDescription?: string;

  themes?: string[];

  directMentions: QuranReference[];
  relatedPassages: RelatedPassage[];

  /** Associated people/prophets — reuses PersonRelationship verbatim,
   * same rationale as QuranCommunity's own `relationships` field. */
  relationships?: PersonRelationship[];

  /** Associated Peoples & Nations — plain ids into QURAN_COMMUNITIES,
   * kept simple (unlike `relationships`) since the connection is usually
   * a direct, undisputed "this is where they lived/were sent," not a
   * claim needing per-link source/verification grading of its own. */
  associatedCommunityIds?: string[];

  /** Related Places — plain ids into this same file (e.g. Al-Masjid al-
   * Aqsa ↔ the Holy Land, Makkah ↔ Al-Masjid al-Haram). */
  relatedPlaceIds?: string[];

  sources?: SourceReference[];
  statusNotes?: string[];
};

export const QURAN_PLACES: QuranPlace[] = [
  {
    id: "makkah",
    name: "Makkah",
    arabicName: "بكة",
    alternateNames: ["Mecca", "Bakkah", "Umm al-Qura"],
    placeType: "city",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The city of the first House built for humanity's worship, called 'Bakkah' by name once and referred to elsewhere as 'this city,' 'the Mother of Settlements,' and 'the secure city.'",
    detailedDescription:
      "3:96 names the city directly: 'Indeed, the first House [of worship] established for mankind was that at Bakkah.' The Qur'an elsewhere calls it 'Umm al-Qura' ('Mother of Settlements,' 6:92, 42:7) and, in Surah At-Tin, 'al-balad al-amin' ('this secure city,' 95:3) — none of these is presented as a separate place; all are read as the same city by context and by the surrounding Ka'bah/House references. Ibrahim's prayer for the city's security and provision (2:126, 14:35-37) and the Prophet's ﷺ own attachment to it (repeatedly invoked as 'this city') both treat it as the same location throughout.",
    themes: ["Sanctuary and security", "Ibrahim's prayer for the city", "Center of pilgrimage"],
    directMentions: [asRef(3, 96), asRef(6, 92), asRef(42, 7), asRef(95, 3)],
    relatedPassages: [
      {
        id: "makkah-baqarah-ibrahim-prayer",
        surahNumber: 2, ayahStart: 126, ayahEnd: 129,
        title: "Ibrahim's Prayer for the City",
        description: "Ibrahim's prayer that the city be made secure and its people provided for, alongside raising the House.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "ibrahim", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "ismail", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["almasjidalharam"],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:96; Al-An'am 6:92; Ash-Shura 42:7; At-Tin 95:3" }],
    statusNotes: [
      "'Bakkah' (3:96) and 'Makkah' (48:24, in a different grammatical form referring to its valley) are both understood as the same city by essentially unanimous scholarly reading, not treated here as two separate cities.",
    ],
  },

  {
    id: "almasjidalharam",
    name: "Al-Masjid al-Haram (the Sacred Mosque / the Ka'bah)",
    arabicName: "المسجد الحرام",
    alternateNames: ["The Ka'bah", "The Sacred Mosque", "Bayt Allah"],
    placeType: "sanctuary_site",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The specific sanctuary within Makkah — 'the first House' — raised by Ibrahim and Isma'il, the qiblah for prayer, and the site of Hajj.",
    detailedDescription:
      "Distinct from Makkah the city (its own entry): this is the sanctuary itself, named directly and repeatedly ('Al-Masjid al-Haram,' e.g. 2:144, 2:149-150, 2:191, 2:196, 9:7, 9:19, 9:28, 17:1, 22:25, 48:25, 48:27). 2:127 has Ibrahim and Isma'il raising its foundations while praying for their work's acceptance; 2:144 commands turning toward it in prayer from wherever one is; it is also where 17:1 begins the Night Journey ('from Al-Masjid al-Haram to Al-Masjid al-Aqsa').",
    themes: ["The qiblah", "Built by Ibrahim and Isma'il", "Sanctity and restricted conduct"],
    directMentions: [asRef(2, 144), asRef(2, 149), asRef(2, 150), asRef(2, 191), asRef(2, 196), asRef(9, 7), asRef(9, 19), asRef(9, 28), asRef(17, 1), asRef(22, 25)],
    relatedPassages: [
      {
        id: "almasjidalharam-baqarah-house",
        surahNumber: 2, ayahStart: 124, ayahEnd: 129,
        title: "Raising the Foundations",
        description: "Ibrahim and Isma'il raising the House's foundations, praying for its acceptance.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "almasjidalharam-isra-journey",
        surahNumber: 17, ayahStart: 1, ayahEnd: 1,
        title: "The Starting Point of the Night Journey",
        description: "The Night Journey explicitly begins from Al-Masjid al-Haram.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "ibrahim", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "ismail", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["makkah", "almasjidalaqsa"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:124-150; Al-Isra 17:1" }],
    statusNotes: [
      "`directMentions` above is a representative anchor set — 'Al-Masjid al-Haram' is named 15 times across the Qur'an per a live search; the full list was judged to add citation volume without added narrative content beyond what the Related Passages already carry.",
    ],
  },

  {
    id: "madinah",
    name: "Madinah",
    arabicName: "المدينة",
    alternateNames: ["Medina", "Yathrib", "Tayba"],
    placeType: "city",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The Prophet's ﷺ city after the migration from Makkah, named 'Al-Madinah' directly and, once, by its pre-Islamic name 'Yathrib.'",
    detailedDescription:
      "'Al-Madinah' ('the city,' used as a proper name with the definite article) is addressed directly in passages concerning the hypocrites and the city's residents (9:101, 9:120, 33:60, 63:8). Its older name, 'Yathrib,' appears once: 33:13 quotes a group during the Battle of the Trench saying 'O people of Yathrib, there is no stand for you [here], so return.'",
    themes: ["The migration (Hijrah)", "Hypocrisy addressed directly", "A city renamed"],
    directMentions: [asRef(9, 101), asRef(9, 120), asRef(33, 13), asRef(33, 60), asRef(63, 8)],
    relatedPassages: [
      {
        id: "madinah-tawbah-hypocrites",
        surahNumber: 9, ayahStart: 101, ayahEnd: 101,
        title: "Hypocrites Among the City's People",
        description: "A direct address concerning hypocrisy among the Bedouins around Madinah and 'the people of the city' itself.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "At-Tawbah 9:101, 120; Al-Ahzab 33:13, 60; Al-Munafiqun 63:8" }],
    statusNotes: [
      "IMPORTANT: 'المدينة' ('the city,' with the definite article) is also used generically throughout the Qur'an for several different UNNAMED towns in entirely unrelated narratives (e.g. Yusuf's Egypt at 12:30, the People of the Cave's town at 18:19/18:82, Musa's Egypt at 28:15/18/20, Thamud's town at 27:48, the Ya-Sin town at 36:20, Fir'aun's threat at 7:123). `directMentions` above deliberately excludes every one of those — it lists only the ayahs confirmed by context to be about Madinah, the Prophet's ﷺ own city. Conflating the generic noun with this specific city would be a real accuracy error, not a stylistic choice.",
    ],
  },

  {
    id: "egypt",
    name: "Egypt (Misr)",
    arabicName: "مصر",
    alternateNames: ["Misr"],
    placeType: "land_territory",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Named directly as the land of Yusuf's rise to authority and later of Fir'aun's kingdom and Musa's confrontation with him.",
    detailedDescription:
      "'Misr' is named explicitly in Yusuf's narrative (12:21, the household that buys him; 12:99, his family entering Egypt) and in Musa's (10:87, told to establish homes for his people 'in Egypt'; 43:51, Fir'aun's own boast, 'is not the kingdom of Egypt mine'). The two narratives are generations apart within the same named land.",
    themes: ["Two separate major narratives sharing one place", "Authority granted, then authority overthrown"],
    directMentions: [asRef(10, 87), asRef(12, 21), asRef(12, 99), asRef(43, 51)],
    relatedPassages: [
      {
        id: "egypt-yusuf-authority",
        surahNumber: 12, ayahStart: 54, ayahEnd: 57,
        title: "Yusuf's Appointment Over Egypt's Stores",
        description: "The king's appointment of Yusuf to a position of authority in Egypt.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "egypt-yunus-musa-settlement",
        surahNumber: 10, ayahStart: 87, ayahEnd: 87,
        title: "Musa and Harun Told to Settle Their People",
        description: "The instruction to establish homes 'in Egypt' and orient them toward prayer.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "yusuf", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "firaun", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["aalfiraun", "baniisrael"],
    sources: [{ type: "quran", citation: "Yusuf 12:21, 99; Yunus 10:87; Az-Zukhruf 43:51" }],
    statusNotes: [
      "Several other raw matches for 'مصر' exist but were not confirmed by full-context reading and are deliberately excluded from `directMentions` rather than assumed — consistent with this module's conservative citation approach.",
    ],
  },

  {
    id: "sinai",
    name: "Mount Sinai (At-Tur)",
    arabicName: "الطور",
    alternateNames: ["Tur Sina", "Mount Sinai"],
    placeType: "mountain",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The mountain where Musa is called to prophethood and where the covenant with Bani Isra'il is described as having been raised over them.",
    detailedDescription:
      "'At-Tur' ('the Mount') is named across Musa's narrative: raised over Bani Isra'il at the covenant (2:63, 2:93, 4:154), where Musa is called 'from its right side' (19:52, 28:29-30, 28:46), and invoked as an oath in Surah At-Tur itself (52:1). 95:2 separately names it in full as 'Tur Sinin' ('Mount Sinai'), confirming the identification.",
    themes: ["The site of prophetic calling", "A covenant 'raised' over a people"],
    directMentions: [asRef(2, 63), asRef(2, 93), asRef(4, 154), asRef(19, 52), asRef(20, 80), asRef(28, 29), asRef(28, 46), asRef(52, 1), asRef(95, 2)],
    relatedPassages: [
      {
        id: "sinai-qasas-calling",
        surahNumber: 28, ayahStart: 29, ayahEnd: 35,
        title: "Musa's Calling at the Mount",
        description: "Musa's approach to the fire, the call from the right side of the Mount, and his commissioning.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["baniisrael"],
    relatedPlaceIds: ["tuwa"],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:63, 93; Al-Qasas 28:29-46; At-Tur 52:1; At-Tin 95:2" }],
  },

  {
    id: "tuwa",
    name: "Tuwa",
    arabicName: "طوى",
    placeType: "valley",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The sacred valley at the foot of the Mount where Musa is told to remove his sandals and is first addressed by Allah.",
    detailedDescription:
      "Both 20:12 and 79:16 name the valley directly: 'Indeed, I am your Lord, so remove your sandals. Indeed, you are in the sacred valley of Tuwa.' It is the immediate setting for Musa's call, distinct from — though adjacent to — the Mount itself.",
    themes: ["Sanctified ground", "The moment before prophethood"],
    directMentions: [asRef(20, 12), asRef(79, 16)],
    relatedPassages: [
      {
        id: "tuwa-taha-calling",
        surahNumber: 20, ayahStart: 9, ayahEnd: 16,
        title: "The Valley of Tuwa, in Ta-Ha",
        description: "Musa's approach to the fire and the command in the sacred valley.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["sinai"],
    sources: [{ type: "quran", citation: "Ta-Ha 20:9-16; An-Nazi'at 79:15-16" }],
    statusNotes: [
      "The Arabic root of 'طوى' is common (also meaning 'to fold' or 'traverse,' used unrelatedly elsewhere, e.g. 21:104, 39:67) — `directMentions` above is limited to the two ayahs that explicitly pair it with 'الواد المقدس' ('the sacred valley'), not every occurrence of the root.",
    ],
  },

  {
    id: "babylon",
    name: "Babylon (Babil)",
    arabicName: "بابل",
    placeType: "city",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Named once, as the location of the two angels Harut and Marut, who taught people something that became a means of discord — a single mention anchoring a developed, if brief, narrative.",
    detailedDescription:
      "2:102 references what was 'sent down to the two angels at Babylon, Harut and Marut,' who did not teach anyone without first saying 'we are a trial, so do not disbelieve' — yet what they taught was still used by some to cause division between a man and his wife. The Qur'an gives no further narrative detail about the city itself beyond this single anchor.",
    themes: ["A single-mention location anchoring a moral lesson about knowledge and its misuse"],
    directMentions: [asRef(2, 102)],
    relatedPassages: [
      {
        id: "babylon-baqarah-harutmarut",
        surahNumber: 2, ayahStart: 102, ayahEnd: 102,
        title: "Harut and Marut at Babylon",
        description: "The single Qur'anic reference to Babylon, tied to the two angels and the misuse of what they taught.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:102" }],
    statusNotes: [
      "This entity is deliberately thin, matching how little the Qur'an itself says — it is included because the single mention is explicit and unambiguous (unlike, e.g., excluded candidates with no textual anchor at all), not because a rich narrative exists here to draw on.",
      "Harut and Marut are named angels, not human — out of scope for the Persons module (People & Groups) by that module's own documented scope rule; no `relationships` link is set here for that reason.",
      "Two additional raw search matches for 'بابل' (13:14, 40:56) were not confirmed by full-context reading and are excluded from `directMentions` rather than assumed.",
    ],
  },

  {
    id: "badr",
    name: "Badr",
    arabicName: "بدر",
    placeType: "battlefield",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Named directly as the site where Allah gave the believers victory 'while you were few in number' — the Qur'an's own account of the battle's significance, with the narrative detail carried in Surah Al-Anfal.",
    detailedDescription:
      "3:123 states plainly: 'And already had Allah given you victory at Badr while you were few in number.' The name itself appears only this once, but the battle's circumstances, the disagreement over the spoils, and the description of angelic reinforcement are narrated at length in Surah Al-Anfal (8), without repeating the place-name.",
    themes: ["Victory attributed directly to Allah, not numbers", "A named battle, an unnamed-by-repetition narrative"],
    directMentions: [asRef(3, 123)],
    relatedPassages: [
      {
        id: "badr-imran-victory",
        surahNumber: 3, ayahStart: 123, ayahEnd: 123,
        title: "The Direct Naming of Badr",
        description: "The one explicit naming of the battle, crediting the victory to Allah despite being outnumbered.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "badr-anfal-account",
        surahNumber: 8, ayahStart: 5, ayahEnd: 19,
        title: "The Fuller Account in Al-Anfal",
        description: "The circumstances leading to the battle and the description of the encounter, without repeating the place-name.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:123; Al-Anfal 8:5-19" }],
    statusNotes: [
      "Surah Al-Anfal's connection to the Battle of Badr specifically is the well-established, essentially uncontested traditional/contextual reading (the surah's own content matches the battle's known circumstances) rather than the surah declaring 'Badr' by name itself — `identificationBasis` is set to 'quran_explicit' on the strength of 3:123's own direct naming, not on Al-Anfal's contextual match alone.",
    ],
  },

  {
    id: "mountjudi",
    name: "Mount Judi (Al-Judi)",
    arabicName: "الجودي",
    placeType: "mountain",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Where Nuh's Ark comes to rest once the Flood recedes — 'And it was said: swallow your water, O earth, and stop, O sky... and it (the Ark) came to rest on Al-Judi.'",
    detailedDescription:
      "11:44 narrates the Flood's end in a single, dense verse: the earth commanded to swallow its water, the sky to withhold rain, the water made to recede, the matter concluded, and the Ark settling on Al-Judi — closing with 'and it was said: away with the wrongdoing people.'",
    themes: ["The Flood narrative's resolution", "A single named endpoint after judgment"],
    directMentions: [asRef(11, 44)],
    relatedPassages: [
      {
        id: "mountjudi-hud-resting",
        surahNumber: 11, ayahStart: 44, ayahEnd: 44,
        title: "The Ark's Resting Place",
        description: "The recession of the Flood and the Ark coming to rest on Al-Judi.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "nuh", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["peopleofnuh"],
    sources: [{ type: "quran", citation: "Hud 11:44" }],
    statusNotes: [
      "The Qur'an names the mountain but does not give a geographic coordinate; traditional and modern proposals (commonly a mountain near the Turkey-Iraq border region) are historical/geographic identifications, not stated in the ayah itself.",
    ],
  },

  {
    id: "alhijr",
    name: "Al-Hijr",
    arabicName: "الحجر",
    placeType: "settlement",
    identificationBasis: "quran_explicit",
    shortDescription:
      "A rock-carved settlement whose people ('Ashab al-Hijr') are said to have denied the messengers — traditionally, though not explicitly within this verse itself, identified with Thamud.",
    detailedDescription:
      "15:80 (in the surah named for this place) states: 'And the companions of Al-Hijr denied the messengers.' The verse itself does not name Thamud or Salih. The identification of 'Ashab al-Hijr' with Thamud comes from context — Thamud is elsewhere described as a people who 'carved homes out of the mountains' (7:74, 26:149, 89:9), matching Al-Hijr's well-known rock-cut dwellings, and classical tafsir treats the identification as essentially settled — but this entry keeps the distinction explicit rather than silently merging it into Thamud's own entry.",
    themes: ["A place named by its distinctive rock-carved dwellings"],
    directMentions: [asRef(15, 80)],
    relatedPassages: [
      {
        id: "alhijr-hijr-denial",
        surahNumber: 15, ayahStart: 80, ayahEnd: 84,
        title: "The Companions of Al-Hijr",
        description: "Their denial of the messengers and their fate, told briefly in Surah Al-Hijr.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    associatedCommunityIds: ["thamud"],
    sources: [{ type: "quran", citation: "Al-Hijr 15:80-84" }],
    statusNotes: [
      "IMPORTANT: `identificationBasis` is 'quran_explicit' for the PLACE NAME itself (15:80 does name 'Al-Hijr' directly) — the link to Thamud specifically is contextual/traditional, not a direct equation stated in this verse, which is why `associatedCommunityIds` links to Thamud while this entry's own description keeps that distinction explicit rather than asserting it as settled Qur'anic fact.",
    ],
  },

  {
    id: "alahqaf",
    name: "Al-Ahqaf",
    arabicName: "الأحقاف",
    placeType: "region",
    identificationBasis: "quran_explicit",
    shortDescription:
      "'The sandy tracts' — named directly as where 'Ad's own brother (Hud) warned his people; a real Qur'anic place-name whose present-day location remains a traditional/modern geographic question, not a Qur'an-settled one.",
    detailedDescription:
      "46:21 (in the surah named for this term) states: 'And mention the brother of 'Ad, when he warned his people at Al-Ahqaf.' No further geographic detail is given in the text.",
    themes: ["A named region anchoring a warning narrative"],
    directMentions: [asRef(46, 21)],
    relatedPassages: [
      {
        id: "alahqaf-ahqaf-warning",
        surahNumber: 46, ayahStart: 21, ayahEnd: 26,
        title: "Hud's Warning at Al-Ahqaf",
        description: "Hud's warning to 'Ad and their dismissive response.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "hud", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["ad"],
    sources: [{ type: "quran", citation: "Al-Ahqaf 46:21-26" }],
    statusNotes: [
      "The Qur'an names the region but not its present-day location; the standard geographic proposal (a region of southern Arabia, e.g. parts of modern Oman/Yemen) is a traditional/modern-historical identification, not a Qur'an-stated coordinate — `identificationBasis` here grades the NAME ('Al-Ahqaf' as 'Ad's location) as explicit, while any specific modern map location remains outside what this entry asserts.",
    ],
  },

  {
    id: "iram",
    name: "Iram",
    arabicName: "إرم ذات العماد",
    alternateNames: ["Iram of the Pillars"],
    placeType: "city",
    identificationBasis: "disputed",
    shortDescription:
      "'Iram, of the lofty pillars' — named once, in a passage listing peoples destroyed for tyranny; whether this names 'Ad's own city specifically, or is a broader poetic description, is a genuine scholarly dispute the Qur'an does not settle.",
    detailedDescription:
      "89:6-8 asks: 'Have you not considered how your Lord dealt with 'Ad — [with] Iram, of the lofty pillars, the likes of which had not been created in the lands?' The grammatical relationship between ''Ad' and 'Iram' in this passage — apposition (Iram being 'Ad's city/name) versus a looser poetic pairing — is read differently by different exegetes.",
    themes: ["A disputed identification, held open rather than resolved"],
    directMentions: [asRef(89, 7)],
    relatedPassages: [
      {
        id: "iram-fajr-account",
        surahNumber: 89, ayahStart: 6, ayahEnd: 8,
        title: "'Ad and Iram, in Al-Fajr",
        description: "The passage naming both 'Ad and Iram together, among examples of destroyed tyrannical peoples.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    associatedCommunityIds: ["ad"],
    sources: [
      { type: "quran", citation: "Al-Fajr 89:6-8" },
      { type: "traditional_account", citation: "Some later tradition and modern archaeological speculation (e.g. proposals linking Iram to the Ubar/Wabar site) go further than the text itself.", note: "Neither reading is treated as established here." },
    ],
    statusNotes: [
      "IMPORTANT: `identificationBasis: 'disputed'` reflects that the Qur'an does not itself settle whether 'Iram' is 'Ad's city's proper name, a poetic epithet for 'Ad collectively, or something else — this entry presents the ayah's own wording without adjudicating the grammatical/exegetical dispute.",
    ],
  },

  {
    id: "almasjidalaqsa",
    name: "Al-Masjid al-Aqsa",
    arabicName: "المسجد الأقصى",
    alternateNames: ["The Farthest Mosque"],
    placeType: "sanctuary_site",
    identificationBasis: "quran_explicit",
    shortDescription:
      "'The farthest mosque' — the named endpoint of the Prophet's ﷺ Night Journey; its traditional identification with Jerusalem is near-universal but is a traditional identification layered onto the Qur'anic term, not a Qur'an-stated equation.",
    detailedDescription:
      "17:1 opens: 'Exalted is He who took His Servant by night from Al-Masjid al-Haram to Al-Masjid al-Aqsa, whose surroundings We have blessed.' The verse names the destination by this description ('the farthest mosque') without naming a city.",
    themes: ["The Night Journey's destination", "A blessed surrounding area, not only a single building"],
    directMentions: [asRef(17, 1)],
    relatedPassages: [
      {
        id: "almasjidalaqsa-isra-journey",
        surahNumber: 17, ayahStart: 1, ayahEnd: 1,
        title: "The Night Journey",
        description: "The single verse naming the journey from Al-Masjid al-Haram to Al-Masjid al-Aqsa.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["almasjidalharam", "theholyland"],
    sources: [{ type: "quran", citation: "Al-Isra 17:1" }],
    statusNotes: [
      "IMPORTANT: The Qur'an does not use the word 'Jerusalem' (or 'Bayt al-Maqdis') anywhere in the text. The identification of 'Al-Masjid al-Aqsa' with Jerusalem is a traditional identification — near-universal in Islamic scholarship and reinforced by early hadith literature, but still a later identification layered onto the Qur'an's own descriptive term, not a direct Qur'anic statement. This entry's `identificationBasis` grades the TERM itself ('the farthest mosque') as explicit; the Jerusalem identification is disclosed here as traditional, not folded into the main description as settled fact.",
    ],
  },

  {
    id: "theholyland",
    name: "The Holy Land (Al-Ard al-Muqaddasah)",
    arabicName: "الأرض المقدسة",
    placeType: "region",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The land Musa commands Bani Isra'il to enter, which they refuse out of fear — resulting in forty years of wandering; a distinct Qur'anic term from Al-Masjid al-Aqsa, though the two are often popularly conflated with the same general region.",
    detailedDescription:
      "5:21 has Musa tell his people: 'O my people, enter the Holy Land which Allah has assigned to you and do not turn back [from fighting in Allah's cause] and become losers.' They refuse, citing a 'tyrannical people' inside it (5:22), leading to the land being 'forbidden to them for forty years' during which 'they will wander throughout the land' (5:26) — a different episode from Bani Isra'il's earlier deliverance from Egypt.",
    themes: ["A land promised, then refused out of fear", "Consequence: forty years of wandering"],
    directMentions: [asRef(5, 21)],
    relatedPassages: [
      {
        id: "theholyland-maidah-refusal",
        surahNumber: 5, ayahStart: 21, ayahEnd: 26,
        title: "The Command and the Refusal",
        description: "Musa's command to enter the Holy Land, the people's fearful refusal, and the forty-year consequence.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["baniisrael"],
    relatedPlaceIds: ["almasjidalaqsa"],
    sources: [{ type: "quran", citation: "Al-Ma'idah 5:21-26" }],
    statusNotes: [
      "The Qur'an does not give this land's borders or a specific city name within it. Popular usage often treats 'the Holy Land' as roughly the same region associated with Al-Masjid al-Aqsa/Jerusalem, but the Qur'an itself does not explicitly equate the two terms — they are kept as separate, cross-referenced entries for that reason, not merged.",
    ],
  },

  {
    id: "alkahf",
    name: "The Cave (Al-Kahf)",
    arabicName: "الكهف",
    placeType: "other",
    identificationBasis: "quran_context",
    shortDescription:
      "The refuge where the People of the Cave took shelter and were made to sleep for a long span of years — a place identified only by the common noun 'the cave,' with no proper name or confirmed real-world location given.",
    detailedDescription:
      "18:9-11 and 18:16 describe the young men withdrawing to 'the cave' for refuge and the sleep placed upon them there. Distinct from the People of the Cave entry (People & Groups, Phase 1): that entry covers the group and their story; this entry is the location itself, included separately because Surah Al-Kahf is named for the place, and because it is a real Qur'anic location classification, not because there is additional narrative content to add beyond what the People of the Cave entry already covers.",
    themes: ["A named surah's title location", "Refuge, not sanctuary — no ritual significance attached to it in the text"],
    directMentions: [asRef(18, 9), asRef(18, 10), asRef(18, 11), asRef(18, 16)],
    relatedPassages: [
      {
        id: "alkahf-kahf-refuge",
        surahNumber: 18, ayahStart: 9, ayahEnd: 16,
        title: "Taking Refuge in the Cave",
        description: "The young men's withdrawal to the cave and the sleep placed upon them there.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    sources: [{ type: "quran", citation: "Al-Kahf 18:9-16" }],
    statusNotes: [
      "`identificationBasis: 'quran_context'`: 'الكهف' is the common noun 'the cave,' not a proper toponym — its identity as a specific real-world location is established only through the surrounding narrative context (Al-Kahf 18:9-26), not a named place the way Badr or Al-Ahqaf are. Various real caves have been traditionally proposed (e.g. near Amman, Jordan) but none is treated as established here.",
      "No `relationships`/`associatedCommunityIds` is set here — the People of the Cave themselves are already a full entry in People & Groups (id: `ashabalkahf`); duplicating that connection on both sides was judged unnecessary for a location with no further distinct content.",
    ],
  },

  {
    id: "thesea",
    name: "The Sea (of the Crossing)",
    arabicName: "البحر",
    placeType: "body_of_water",
    identificationBasis: "quran_context",
    shortDescription:
      "The sea Musa is commanded to strike with his staff, parting it for Bani Isra'il's crossing and drowning Fir'aun's pursuing army — never named beyond 'the sea' itself; 'the Red Sea' is a later geographic identification.",
    detailedDescription:
      "26:63 has Musa commanded: 'strike with your staff the sea,' after which 'it parted, and each portion was like a great towering mountain.' 20:77-78 and 44:24 separately narrate the crossing and Fir'aun's pursuit and drowning. No name beyond 'al-bahr' ('the sea') is given anywhere in these passages.",
    themes: ["Deliverance through a parted sea", "A tyrant's pursuit ending in drowning"],
    directMentions: [],
    relatedPassages: [
      {
        id: "thesea-shuara-crossing",
        surahNumber: 26, ayahStart: 52, ayahEnd: 68,
        title: "The Crossing, in Ash-Shu'ara",
        description: "Musa commanded to strike the sea, the crossing, and Fir'aun's army drowning behind them.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "firaun", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedCommunityIds: ["baniisrael", "aalfiraun"],
    sources: [{ type: "quran", citation: "Ash-Shu'ara 26:52-68; Ta-Ha 20:77-78; Ad-Dukhan 44:24" }],
    statusNotes: [
      "`directMentions` is empty and `identificationBasis` is 'quran_context' because 'البحر' ('the sea') is an extremely generic term used dozens of times across the Qur'an for many unrelated contexts — no phrase uniquely identifies this specific sea. Its narrative role is fully carried by the Related Passages instead, consistent with this app's existing convention for generic-noun-only references (e.g. Al-Khidr's 'a servant among Our servants').",
      "'The Red Sea' (or the Gulf of Suez/Aqaba in some modern proposals) is a traditional/modern geographic identification, not a Qur'an-stated name — not asserted as fact in this entry's main description.",
    ],
  },
];

export const getPlaceById = (id: string): QuranPlace | undefined =>
  QURAN_PLACES.find((p) => p.id === id);

// ============================================================
// Candidates investigated and excluded (documented per the phased plan's
// explicit "if a candidate does not meet the inclusion threshold, exclude
// it and document why" instruction):
//
// - Ur / Iraq (Ibrahim's traditional birthplace/homeland before his
//   migration) — no Qur'anic textual basis at all; entirely extra-Qur'anic
//   biographical tradition. Excluded, not a borderline case.
// - Al-A'raf ("the Heights," 7:46-49) — a genuine Qur'anic location, but an
//   eschatological one (a barrier between Paradise and Hell), not an
//   earthly-geography location the way every entity above is. Belongs
//   conceptually to a future Signs/Hereafter-adjacent module, not this
//   earthly-Places module — flagged, not silently placed in either.
// - "At-Tih" (the wilderness of the forty years' wandering, 5:26) — the
//   Qur'an uses a VERB ("يتيهون," "they will wander") here, not a place-
//   name; "Tih Desert" is a later toponym derived from that verb, not a
//   Qur'anic name to catalog as its own entity.
// - Madyan and Al-Aykah as PLACES — deliberately not duplicated; each
//   already has a full entry in Peoples & Nations covering both the
//   people and place sense of the same term. See those entries' own
//   Phase 3 statusNotes.
// - Nineveh, the Dead Sea region, "South Arabia/Yemen" — considered as
//   part of the Phase 2 associatedPlaces migration audit; not created as
//   entities since none is itself a Qur'an-named location (see the
//   corresponding Peoples & Nations entries' own Phase 3 notes).
// ============================================================
