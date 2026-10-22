// Peoples & Nations — dataset types + data (Phase 2 of
// quranic_knowledge_platform_phased_plan.md; see MODULE_BLUEPRINT.md's
// "Qur'anic Knowledge Platform — Shared Foundation" section for the
// conventions this file follows). Builds on Module 17 (Prophets & Qur'anic
// Persons) rather than duplicating it: individuals and small, individually-
// flavored groups directly embedded in one narrative stay in that module
// (People & Groups) — this file is for larger COLLECTIVE populations
// (an entire tribe/nation/community/religious-community), generally with
// their own place, era, and a stated collective outcome, often spanning
// several narratives/generations rather than one bounded story.
//
// Boundary decision (documented per the phased plan's explicit
// instruction, not made casually): the 7 existing People & Groups entries
// with `entityType: "group"` (People of the Cave, People of the Trench,
// Companions of the Elephant, Hawariyyun, Pharaoh's Magicians, Yusuf's
// Brothers, The Two Men of the Gardens) were re-examined against this
// module and NONE were migrated. Every one of them is a small, individually
// -flavored cast bounded to one narrative (often with recorded group
// dialogue/action), not a civilizational/tribal/national population with
// its own independent identity across the Qur'an — the defining trait of
// every entity below. No overlap, no duplication.
//
// Phase 3 (Places) migration: audited every `associatedPlaces` free-text
// value below and converted 2 of 5 to structured `relatedPlaceIds` links
// (Al-Ahqaf for 'Ad, Al-Hijr for Thamud) where a dedicated, adequately-
// supported Place entity was justified — the other 3 (Saba's "South
// Arabia," People of Lut's "Dead Sea region," People of Yunus's "Nineveh")
// were deliberately left as free text, since no Qur'an-named location
// exists to anchor a real entity to. See each entity's own statusNotes for
// the specific reasoning, and app/data/quranPlaces.ts for the Place side.
//
// Verification: every entity's core Qur'anic term was checked against this
// app's live Quran search API (alquran.cloud) at authoring time. Several
// short/common Arabic roots used for these terms (e.g. "عاد," "سبأ,"
// "مدين") returned heavily contaminated substring matches (root/letter
// overlap with unrelated words — "مدين" is literally a substring of
// "المدينة," for example) that Phase 1's whole-word normalizer was built
// for but this file does not reproduce. Where the API result was clean
// (a distinctive multi-word or low-collision phrase), `directMentions`
// reflects it directly; where it was contaminated, `directMentions` is a
// smaller, manually-verified, high-confidence anchor set rather than a
// claimed-exhaustive list — this module's `directMentions` should be read
// as curated representative citations, NOT the exhaustive-per-ayah standard
// Module 17 achieved. Each entity's `relatedPassages` carries the
// substantive narrative citation either way, per this app's established
// Direct-Mentions-vs-Related-Passages discipline.
import { asRef } from "~/utils/quranReference";
import type { QuranReference, RelatedPassage, SourceReference, IdentificationBasis } from "~/utils/quranReference";
import type { PersonRelationship } from "~/data/quranPersons";

export type { IdentificationBasis } from "~/utils/quranReference";

export type CommunityType =
  | "nation"
  | "tribe"
  | "community"
  | "religious_community"
  | "historical_population"
  | "narrative_group";

export type QuranCommunity = {
  id: string;

  name: string;
  arabicName: string;
  alternateNames?: string[];

  communityType: CommunityType;
  identificationBasis: IdentificationBasis;

  shortDescription: string;
  detailedDescription?: string;

  themes?: string[];
  outcome?: string;

  directMentions: QuranReference[];
  relatedPassages: RelatedPassage[];

  /** Links to Persons-module entries (prophets sent to them, or other
   * directly-connected figures) — reuses `PersonRelationship` verbatim
   * rather than a parallel type, since the shape (personId + directional
   * relationshipType + source/verification) is identical and this is
   * still fundamentally "a link to a Person entity." Cross-module links to
   * a future Places/Stories/Events module are deliberately NOT modeled
   * this way — see `associatedPlaces` below and MODULE_BLUEPRINT.md's
   * Phase 10 flag on typed cross-module references. */
  relationships?: PersonRelationship[];

  /** Free-text place names — kept for entities where no Place entity is (yet)
   * defensible (see each entity's own statusNotes for the source basis).
   * Phase 3 (Places) migration: where a real, adequately-supported Place
   * entity now exists, prefer `relatedPlaceIds` below and either trim or
   * keep this array only for the human-readable label — see this file's
   * Phase 3 migration note near the top for which of the 5 original
   * entries were upgraded and which were deliberately left as free text. */
  associatedPlaces?: string[];

  /** Added in Phase 3 — ids into QURAN_PLACES (app/data/quranPlaces.ts).
   * Optional and only set where the Place↔Community connection is actually
   * textually supported, not for every place name ever mentioned near this
   * entity. */
  relatedPlaceIds?: string[];

  sources?: SourceReference[];
  statusNotes?: string[];
};

export const QURAN_COMMUNITIES: QuranCommunity[] = [
  {
    id: "ad",
    name: "'Ad",
    arabicName: "عاد",
    communityType: "tribe",
    identificationBasis: "quran_explicit",
    shortDescription:
      "An ancient people of great physical strength and monumental building, sent the prophet Hud, who rejected him and were destroyed by a violent, roaring wind.",
    detailedDescription:
      "Described as tall and physically powerful, 'the like of whom had not been created in the lands' (89:8), 'Ad built with 'landmarks' or monuments (26:128-129) and lived in luxury. Hud, 'their brother,' calls them to worship Allah alone; they accuse him of foolishness and refuse to abandon their idols, boasting 'who is greater than us in strength?' (41:15). They are destroyed by a furious, roaring wind lasting seven nights and eight days (69:6-7), left 'lying dead as if they were hollow trunks of palm trees' (69:7).",
    themes: ["Arrogance from physical strength", "Rejection of a warner", "Destruction by wind"],
    outcome: "Destroyed by a violent wind over seven nights and eight days (69:6-7); only Hud and the believers with him were saved (11:58).",
    directMentions: [
      asRef(7, 65), asRef(11, 50), asRef(11, 60), asRef(26, 123), asRef(41, 15), asRef(53, 50), asRef(54, 18),
    ],
    relatedPassages: [
      {
        id: "ad-araf-mission",
        surahNumber: 7, ayahStart: 65, ayahEnd: 72,
        title: "Hud's Mission to 'Ad",
        description: "Hud's call to worship Allah alone, 'Ad's refusal, and their destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ad-hud-account",
        surahNumber: 11, ayahStart: 50, ayahEnd: 60,
        title: "The Fuller Account in Surah Hud",
        description: "Hud's warning, 'Ad's boast of their own strength, and the wind that destroyed them.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ad-haqqah-destruction",
        surahNumber: 69, ayahStart: 4, ayahEnd: 8,
        title: "The Wind, in Surah Al-Haqqah",
        description: "The specific description of the destroying wind: seven nights and eight days.",
        storyOrder: 3, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "hud", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["alahqaf", "iram"],
    sources: [{ type: "quran", citation: "Al-A'raf 7:65-72; Hud 11:50-60; Al-Haqqah 69:4-8" }],
    statusNotes: [
      "Phase 3 migration: the free-text 'Al-Ahqaf' place note from this entity's original Phase 2 version was upgraded to a real, structured link (`relatedPlaceIds`) once a dedicated Al-Ahqaf entity was created — 46:21 directly names Al-Ahqaf as where 'Ad was warned, a strong enough textual link to justify the entity. 'Iram' (89:7) is also linked — see its own entry for the disputed question of whether it names 'Ad's city specifically or is a broader description.",
      "'Ad's precise present-day geographic location is still not established by the Qur'an text itself — see Al-Ahqaf's own entry for the traditional-vs-modern identification distinction; this entry does not assert a specific location beyond the Qur'an-named 'Al-Ahqaf.'",
      "`directMentions` here is a manually-verified anchor set, not an exhaustive whole-word count like Module 17's — the root 'ع-و-د' is common enough (e.g. 'return,' 'promise') that this app's search API returns heavy false-positive contamination for the bare word 'عاد,' so an exhaustive count was not attempted for this entry. See this file's own header comment.",
    ],
  },

  {
    id: "thamud",
    name: "Thamud",
    arabicName: "ثمود",
    communityType: "tribe",
    identificationBasis: "quran_explicit",
    shortDescription:
      "A people sent the prophet Salih and given a she-camel as a sign; they hamstrung her in defiance and were destroyed by a violent blast.",
    detailedDescription:
      "Salih, 'their brother,' calls Thamud to worship Allah alone and presents the she-camel as 'a sign' with a specific right to graze and water on alternating days (26:155, 54:28). The people hamstring (kill) her, defying the sign, and are given three days' warning (11:65) before being seized by 'the blast' (as-sayhah) and left 'lying on their faces in their homes' (7:78).",
    themes: ["A sign defied", "A specific test tied to shared resources", "Destruction by 'the blast'"],
    outcome: "Destroyed by a violent blast (as-sayhah) after hamstringing the she-camel and rejecting Salih's three-day warning (11:65-67).",
    directMentions: [
      asRef(7, 73), asRef(9, 70), asRef(11, 61), asRef(11, 68), asRef(11, 95), asRef(14, 9), asRef(17, 59),
      asRef(22, 42), asRef(25, 38), asRef(26, 141), asRef(27, 45), asRef(29, 38), asRef(38, 13), asRef(40, 31),
      asRef(41, 13), asRef(41, 17), asRef(50, 12), asRef(51, 43), asRef(53, 51), asRef(54, 23), asRef(69, 4),
      asRef(69, 5), asRef(85, 18), asRef(89, 9), asRef(91, 11),
    ],
    relatedPassages: [
      {
        id: "thamud-araf-mission",
        surahNumber: 7, ayahStart: 73, ayahEnd: 79,
        title: "Salih's Mission and the She-Camel",
        description: "Salih's call, the she-camel given as a sign, and its hamstringing.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "thamud-hud-account",
        surahNumber: 11, ayahStart: 61, ayahEnd: 68,
        title: "The Fuller Account in Surah Hud",
        description: "Salih's warning, the three-day ultimatum, and the blast that destroyed them.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
      {
        id: "thamud-shams-account",
        surahNumber: 91, ayahStart: 11, ayahEnd: 15,
        title: "A Short Retelling in Ash-Shams",
        description: "Thamud's denial 'in their transgression,' the hamstringing, and the leveling of their punishment.",
        storyOrder: 3, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "salih", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    relatedPlaceIds: ["alhijr"],
    sources: [{ type: "quran", citation: "Al-A'raf 7:73-79; Hud 11:61-68; Ash-Shams 91:11-15" }],
    statusNotes: [
      "Phase 3 migration: the free-text 'Al-Hijr' note from this entity's original Phase 2 version was upgraded to a structured link (`relatedPlaceIds`), but with a documented caveat carried onto Al-Hijr's own entry: 15:80 ('Ashab al-Hijr denied the messengers') does not itself name Thamud — the identification of 'Ashab al-Hijr' as Thamud is contextual/traditional (matching Thamud's own description elsewhere as carving homes from mountains, e.g. 7:74, 89:9), not a direct Qur'an-stated equation. `identificationBasis: 'quran_context'` on that link reflects this, not 'quran_explicit.'",
      "`directMentions` here is the full result of a live search for the distinctive term 'ثمود,' which — unlike 'عاد' — showed no evident false-positive contamination on inspection (no common unrelated Arabic word shares this root), so this list is treated as reliable, though it was not independently re-verified ayah-by-ayah the way Module 17's exhaustive standard requires.",
    ],
  },

  {
    id: "madyan",
    name: "Madyan",
    arabicName: "مدين",
    alternateNames: ["Midian"],
    communityType: "community",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The community of the prophet Shu'ayb, condemned for fraud in weights and measures; also where Musa took refuge after fleeing Egypt.",
    detailedDescription:
      "Shu'ayb, 'their brother,' calls Madyan to worship Allah alone and to give full measure and weight, warning against 'sitting on every path, threatening and averting from the way of Allah those who believe' (7:85-86). They reject him, mockingly ask if his prayer commands him to make them abandon their fathers' ways (11:87), and are seized by 'the blast'/a mighty cry (29:37, 11:94). Separately, Madyan is also where Musa flees after leaving Egypt, is given water for two women's flocks, and is taken in and later married by their father (28:22-28) — a different episode, generations apart, connected only by the same place-name.",
    themes: ["Fraud in trade", "A place, not only a punished people — also Musa's refuge"],
    outcome: "Seized by a mighty blast/cry after rejecting Shu'ayb (11:94, 29:37); a separate, later episode has Musa welcomed there peacefully.",
    directMentions: [asRef(7, 85), asRef(9, 70), asRef(11, 84), asRef(28, 22), asRef(28, 23), asRef(28, 45), asRef(29, 36)],
    relatedPassages: [
      {
        id: "madyan-araf-mission",
        surahNumber: 7, ayahStart: 85, ayahEnd: 93,
        title: "Shu'ayb's Mission to Madyan",
        description: "Shu'ayb's call against fraud in trade, the people's rejection, and their destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "madyan-qasas-musa-refuge",
        surahNumber: 28, ayahStart: 22, ayahEnd: 28,
        title: "Musa's Refuge in Madyan (a Separate, Later Episode)",
        description: "Musa's flight to Madyan, drawing water for the two women, and his stay with their father.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "shuayb", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-A'raf 7:85-93; Al-Qasas 28:22-28" }],
    statusNotes: [
      "This app's search API returns heavy false-positive contamination for 'مدين' (it is literally a substring of 'المدينة,' 'the city'/Madinah), so `directMentions` here is a manually-verified anchor set from established knowledge of these passages, not an API-exhaustive count — see this file's own header comment.",
      "Madyan's relationship to 'Ashab al-Aykah' (the separate entry below, also associated with Shu'ayb) is a genuine, unresolved scholarly question — see that entry's own statusNotes; this entry does not assert they are the same community.",
      "Phase 3 boundary decision: 'Madyan' is both a people-name and a place-name in Arabic (the same word functions both ways across different ayahs, e.g. 28:22 'Musa oriented himself toward Madyan' uses it as a destination/place). No separate Place entity was created for it — that would duplicate this entry for no added content — this entity is deliberately understood to cover both senses.",
    ],
  },

  {
    id: "ashabalaykah",
    name: "The Companions of the Wood (Ashab al-Aykah)",
    arabicName: "أصحاب الأيكة",
    communityType: "community",
    identificationBasis: "quran_explicit",
    shortDescription:
      "A people also associated with the prophet Shu'ayb in several passages, named by a distinct Qur'anic term ('the companions of the thicket/wood') rather than 'Madyan' — whether they are the same community as Madyan or a related-but-distinct one is a genuine, unresolved scholarly question.",
    detailedDescription:
      "In four passages (15:78-79, 26:176-191, 38:13, 50:14), a people called 'Ashab al-Aykah' are addressed by 'their brother Shu'ayb' (26:176-177) with warnings very close in content to the Madyan passages — full measure and weight, not cheating people of their due. They are seized by 'the punishment of the day of shadow' (26:189), described as 'a great day's punishment.'",
    themes: ["Fraud in trade (parallel to Madyan)", "A disputed identification, held open rather than resolved"],
    outcome: "Seized by 'the punishment of the day of shadow' (26:189).",
    directMentions: [asRef(15, 78), asRef(26, 176), asRef(38, 13), asRef(50, 14)],
    relatedPassages: [
      {
        id: "ashabalaykah-shuara-account",
        surahNumber: 26, ayahStart: 176, ayahEnd: 191,
        title: "Shu'ayb's Warning and Their Punishment",
        description: "Shu'ayb's warning against fraud in trade, their rejection, and the 'day of shadow' punishment.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "shuayb", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Ash-Shu'ara 26:176-191; Al-Hijr 15:78-79; Sad 38:13; Qaf 50:14" }],
    statusNotes: [
      "IMPORTANT: The Qur'an does not explicitly equate 'Ashab al-Aykah' with 'Madyan' anywhere in the text — they are addressed by the same prophet (Shu'ayb) with closely parallel warnings, but under two different collective names in different passages. Exegetes are genuinely divided: some hold they are the same community described two ways, others that they are two related but distinct communities Shu'ayb was sent to. This entry does not assert either resolution — kept as a separate entity from Madyan for that reason, with this note on both entries.",
      "Phase 3: no separate 'Al-Aykah' Place entity was created for the same reason given on Madyan's entry — 'الأيكة' ('the thicket/wood') functions as this community's designation, not a distinct additional location to catalog.",
    ],
  },

  {
    id: "saba",
    name: "Saba' (Sheba)",
    arabicName: "سبأ",
    alternateNames: ["Sheba"],
    communityType: "nation",
    identificationBasis: "quran_explicit",
    shortDescription:
      "A prosperous South Arabian kingdom — home to the ruling queen who corresponds with Sulaiman — whose people later turned away from gratitude and lost their famed gardens to a catastrophic flood.",
    detailedDescription:
      "27:20-44 tells of the hoopoe's report to Sulaiman of a kingdom ruled by a woman with 'a great throne,' from Saba' (27:22), leading to her eventual visit and submission to Allah (see the separate Bilqis entry in People & Groups for that individual narrative). Surah 34 (named for them) separately describes Saba's own prosperity — 'a sign in their dwelling place: two gardens, on the right and the left' (34:15) — and their later turning away, met with 'the flood of the dam' (sayl al-'arim, 34:16) that ruined their gardens and scattered them 'as narrations [among the people]' (34:19).",
    themes: ["Prosperity met with gratitude, then its absence", "A specific engineering/agricultural catastrophe as consequence"],
    outcome: "Their two gardens ruined by 'the flood of the dam' after turning away from gratitude; the people 'scattered, [becoming] narrations' (34:19).",
    directMentions: [asRef(27, 22), asRef(34, 15)],
    relatedPassages: [
      {
        id: "saba-naml-report",
        surahNumber: 27, ayahStart: 20, ayahEnd: 44,
        title: "The Hoopoe's Report and the Queen's Story",
        description: "The hoopoe's news of Saba's kingdom and queen, leading to her correspondence with and eventual visit to Sulaiman (see the separate Bilqis entry for the individual narrative).",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "saba-surah-gardens",
        surahNumber: 34, ayahStart: 15, ayahEnd: 19,
        title: "The Two Gardens and the Flood of the Dam",
        description: "Saba's prosperity, their turning away, and the flood that ruined their gardens.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "bilqis", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "sulaiman", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedPlaces: ["South Arabia (Yemen) — the standard geographic/historical identification, not a Qur'an-stated coordinate"],
    sources: [{ type: "quran", citation: "An-Naml 27:20-44; Saba' 34:15-19" }],
    statusNotes: [
      "This entity is deliberately distinct from the Bilqis entry in People & Groups: Bilqis is the individual queen (whose very name is a traditional, not Qur'anic, identification — see her own statusNotes); this entry is the nation/kingdom of Saba' itself, including the later, separate narrative of its people's own turning away and the flood — a passage that does not involve Bilqis or Sulaiman at all.",
      "The Qur'an does not date the flood of the dam or connect it explicitly to any specific ruler; the well-known 'Ma'rib Dam' identification is a later historical/archaeological association, not stated in these ayahs.",
      "Phase 3 migration note: 'South Arabia (Yemen)' remains free text, not a structured `relatedPlaceIds` link — no dedicated Place entity was created for it in Phase 3, since the identification is a broad modern/historical regional association rather than a specific Qur'an-named location the way Al-Ahqaf or Al-Hijr are.",
    ],
  },

  {
    id: "baniisrael",
    name: "Bani Isra'il (Children of Israel)",
    arabicName: "بنو إسرائيل",
    alternateNames: ["Children of Israel", "Israelites"],
    communityType: "nation",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The most frequently addressed collective people in the Qur'an — descendants of Ya'qub (Isra'il), enslaved in Egypt, delivered by Musa, given the Torah, and repeatedly recalled to their covenant across the text.",
    detailedDescription:
      "Bani Isra'il's story is not one bounded narrative but the Qur'an's most sustained recurring collective address: their enslavement and the killing of their sons under Fir'aun (2:49, 28:4), deliverance through the sea (2:50), the covenant at the mount (2:63, 2:93), the golden calf, forty years of wandering (5:26), the gift of the Torah and repeated prophets sent 'one after another' (5:70, 23:44), and recurring Qur'anic reminders of specific favors and specific failings. This entry is a collective-identity overview; the individual episodes belong to the already-covered Persons (Musa, Harun, Dawud, Sulaiman, Yahya, Zakariyya, Isa, Maryam) and their own detail pages, not restated here.",
    themes: ["A recurring covenant, recurring reminders", "Deliverance and its responsibilities", "Prophets sent 'one after another'"],
    directMentions: [
      asRef(2, 40), asRef(2, 122), asRef(5, 32), asRef(5, 70), asRef(17, 2), asRef(17, 4), asRef(17, 101),
      asRef(20, 80), asRef(44, 30), asRef(45, 16),
    ],
    relatedPassages: [
      {
        id: "baniisrael-baqarah-favors",
        surahNumber: 2, ayahStart: 40, ayahEnd: 61,
        title: "'O Children of Israel, Remember My Favor'",
        description: "A sustained direct address recalling specific favors (deliverance, the manna and quails, the covenant) and specific failings (the golden calf, killing prophets).",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "baniisrael-isra-decree",
        surahNumber: 17, ayahStart: 2, ayahEnd: 8,
        title: "The Decree of Two Corruptions, in Al-Isra",
        description: "The giving of the Torah and a stated decree of two periods of corruption/loss and restoration.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "yaqub", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:40-61; Al-Isra 17:2-8" }],
    statusNotes: [
      "This entry is deliberately an overview, not an exhaustive catalog — Bani Isra'il is directly addressed or referenced dozens of times across the Qur'an (a full search returns roughly 40 distinct ayahs for the exact phrase 'بني إسرائيل' alone, before counting indirect references like 'the Children of Israel' via pronoun continuation). `directMentions` above is a representative anchor set, not that full count, consistent with this module's documented curated-citation approach — see this file's header.",
      "'Isra'il' itself is the Qur'an's own alternate name for the prophet Ya'qub (used this way at, e.g., 3:93) — 'Bani Isra'il' literally means 'sons/descendants of Isra'il/Ya'qub,' a Qur'an-stated etymology, not a later gloss.",
    ],
  },

  {
    id: "peopleofnuh",
    name: "The People of Nuh",
    arabicName: "قوم نوح",
    communityType: "historical_population",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Nuh's own people, who rejected his call across a very long span of time and were destroyed in the Flood, saved only through the Ark.",
    detailedDescription:
      "Nuh preaches to his people 'night and day, in public and in private' (71:8-9) for what the Qur'an describes as an extraordinarily long span — traditionally understood via 29:14's '950 years' as the length of his mission, not necessarily his full lifespan. Only a small number believe; the rest, including one of Nuh's own sons, are not saved, and are drowned in the Flood while the believers are carried in the Ark.",
    themes: ["Mass rejection across a long span of time", "Salvation tied to the Ark, not to family alone"],
    outcome: "Drowned in the Flood; only Nuh, the believers with him, and pairs of creatures aboard the Ark were saved (11:40, 71:25-26).",
    directMentions: [asRef(7, 59), asRef(7, 69), asRef(9, 70), asRef(11, 89), asRef(26, 105), asRef(40, 5), asRef(71, 1)],
    relatedPassages: [
      {
        id: "peopleofnuh-hud-flood",
        surahNumber: 11, ayahStart: 25, ayahEnd: 49,
        title: "The Ark, the Flood, and the Refusing Son",
        description: "Nuh's call, his people's rejection, the building of the Ark, and the Flood.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "peopleofnuh-surah-nuh",
        surahNumber: 71, ayahStart: 1, ayahEnd: 28,
        title: "Surah Nuh — His People's Idols and Their Fate",
        description: "Nuh's own account of preaching to his people night and day, their specific idols, and his final prayer against them.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "nuh", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Hud 11:25-49; Surah Nuh 71:1-28" }],
    statusNotes: [
      "29:14 ('a thousand years minus fifty') describes the length of Nuh's mission/da'wah among his people before the Flood, not a claim about his total lifespan — this entry follows that same distinction already documented on Nuh's own Persons-module entry.",
    ],
  },

  {
    id: "peopleoflut",
    name: "The People of Lut",
    arabicName: "قوم لوط",
    communityType: "community",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The town Lut was sent to, condemned in the Qur'an for an act of sexual immorality 'no one in the worlds' had committed before them, and destroyed by an overturning and a shower of stones.",
    detailedDescription:
      "Lut warns his people against their practice; they threaten to expel him and, in the version told alongside Ibrahim's story, press upon his house when angelic guests arrive in human form. The town is 'overturned' and struck with 'stones of hard clay, marked from your Lord' (11:82-83) — sparing Lut and his believing family, but not his wife (see her own entry in People & Groups).",
    themes: ["A practice the Qur'an calls unprecedented", "Rejection escalating to threats against a warner", "Total destruction of a town"],
    outcome: "The town overturned and struck with a shower of stones (11:82-83); only Lut and his believing household (except his wife) were saved.",
    directMentions: [asRef(11, 70), asRef(11, 74), asRef(22, 43), asRef(26, 160), asRef(54, 33)],
    relatedPassages: [
      {
        id: "peopleoflut-hud-messengers",
        surahNumber: 11, ayahStart: 69, ayahEnd: 83,
        title: "The Messengers and the Overturned Town",
        description: "The angelic messengers visit Ibrahim, then Lut; the people's response, and the town's destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "peopleoflut-araf-people",
        surahNumber: 7, ayahStart: 80, ayahEnd: 84,
        title: "Lut's Warning, Described as Unprecedented",
        description: "Lut's rebuke describing their practice as unprecedented 'among the worlds.'",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "lut", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedPlaces: ["Traditionally located near the Dead Sea region — not a coordinate the Qur'an itself states"],
    sources: [{ type: "quran", citation: "Hud 11:69-83; Al-A'raf 7:80-84" }],
    statusNotes: [
      "This entry is the town/population collectively; the individual fate of Lut's wife specifically is already covered on her own People & Groups entry and is not restated in full here beyond the outcome summary.",
      "Phase 3 migration note: 'the Dead Sea region' remains free text — no dedicated Place entity was created for it, since the identification is a broad modern geographic hypothesis about an unnamed town, not a specific Qur'an-named location.",
    ],
  },

  {
    id: "aalfiraun",
    name: "The People of Fir'aun (Aal Fir'aun)",
    arabicName: "آل فرعون",
    alternateNames: ["People of Pharaoh"],
    communityType: "nation",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Fir'aun's ruling household, court, and nation collectively — distinct from Bani Isra'il (the enslaved people within Egypt) and from Fir'aun himself as an individual, though closely tied to both.",
    detailedDescription:
      "'Aal Fir'aun' ('the family/house of Fir'aun,' i.e. his court and nation collectively) appears throughout the Musa narrative as the collective addressee/actor: enslaving Bani Isra'il and killing their sons (2:49, 40:25), pursuing the Israelites after the Exodus and drowning at the sea (2:50), and repeatedly rejecting Musa's signs 'that they might return' (43:46). The believing man of Pharaoh's family (already a separate entry in People & Groups) speaks explicitly 'from' this collective, distinguishing individual conscience from the nation's rejection as a whole.",
    themes: ["A nation acting collectively under a tyrant", "Enslavement and its reversal", "Drowning as final consequence"],
    outcome: "Drowned pursuing the Israelites at the sea (2:50, 8:54), after prolonged rejection of Musa's signs.",
    directMentions: [
      asRef(2, 49), asRef(2, 50), asRef(7, 130), asRef(7, 141), asRef(8, 52), asRef(40, 28), asRef(40, 45), asRef(40, 46),
    ],
    relatedPassages: [
      {
        id: "aalfiraun-baqarah-deliverance",
        surahNumber: 2, ayahStart: 49, ayahEnd: 50,
        title: "Enslavement and Deliverance",
        description: "The killing of the Israelites' sons under Aal Fir'aun, and their drowning at the sea.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "aalfiraun-araf-signs",
        surahNumber: 7, ayahStart: 130, ayahEnd: 141,
        title: "Repeated Signs and Repeated Rejection",
        description: "Years of drought and crop shortage as a sign, blamed on Musa; further signs (the flood, locusts, lice, frogs, blood) each met with a broken promise to believe.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "firaun", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
      { personId: "believingman", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-Baqarah 2:49-50; Al-A'raf 7:130-141" }],
    statusNotes: [
      "This entity is the ruling Egyptian nation/court collectively — kept distinct from Fir'aun as an individual (his own People & Groups entry), from his wife and the believing man of his family (both individually significant enough for their own People & Groups entries already), and from Bani Isra'il (this file's own separate entry) — a deliberate boundary decision, not an oversight.",
    ],
  },

  {
    id: "peopleofthetown",
    name: "The People of the Town (Ashab al-Qaryah)",
    arabicName: "أصحاب القرية",
    communityType: "narrative_group",
    identificationBasis: "quran_explicit",
    shortDescription:
      "An unnamed town's population in Surah Ya-Sin, sent three messengers they rejected — the same narrative whose individual defender is already covered as a Person; this entry is the town's collective identity and outcome.",
    detailedDescription:
      "36:13-29 tells of a town sent two messengers, then reinforced with a third, all rejected as 'nothing but men like ourselves' bringing 'nothing but lies.' A man runs from the edge of the city to defend them and is killed for it (already covered as his own entry, 'The Man of Ya-Sin,' in People & Groups); Allah's response is a single blast ('one shout') that leaves the town 'extinguished' (36:29). Deferred from the Phase 1 audit specifically as better suited to this module once it existed, rather than force-fit into the Persons/Groups model as an individually-flavored 'group.'",
    themes: ["Collective rejection of repeated messengers", "A single decisive consequence ('one shout')"],
    outcome: "Destroyed by a single blast/shout (36:29), 'extinguished' — no rescue, no survivors named.",
    directMentions: [asRef(36, 13)],
    relatedPassages: [
      {
        id: "peopleofthetown-yasin-account",
        surahNumber: 36, ayahStart: 13, ayahEnd: 29,
        title: "The Three Messengers and the Town's Fate",
        description: "The messengers sent, the town's rejection, the runner's defense of them, and the town's destruction.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "yasinman", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Ya-Sin 36:13-29" }],
    statusNotes: [
      "Neither the town's name/location nor the three messengers' names are given anywhere in the Qur'an text — later tradition has proposed identifications (e.g. Antioch) that are not treated as established here. `communityType: 'narrative_group'` reflects that this population's identity is defined entirely by its role in this one narrative, unlike a tribe/nation with an independent identity across the Qur'an.",
    ],
  },

  {
    id: "sabbathbreakers",
    name: "The Sabbath-Breakers",
    arabicName: "أصحاب السبت",
    communityType: "narrative_group",
    identificationBasis: "quran_context",
    shortDescription:
      "A coastal fishing community — identified through the Qur'an's own surrounding context as part of Bani Isra'il — that devised a scheme to fish on the Sabbath in violation of their covenant, and were warned of transformation as a consequence.",
    detailedDescription:
      "7:163-166 asks the Prophet's audience about 'the town that was by the sea,' whose fish came to them plainly only on the Sabbath and stayed away on other days — 'a trial because they were defiantly disobedient.' Among them, one group warns; a second asks the warners why they bother warning 'a people whom Allah is going to destroy'; the warners answer it is 'an excuse to your Lord.' 7:166 describes 'those who transgressed' as told 'be apes, despised' — a punishment 16:124 separately notes was tied to a Sabbath observance 'made only for those who differed concerning it.'",
    themes: ["A scheme to technically evade a command", "Internal division: violators, warners, and a passive group", "Warning as an obligation regardless of outcome"],
    outcome: "Those who transgressed were told 'be apes, despised' (7:166); the fate of the warning group and the silent group is not separately detailed in this passage.",
    directMentions: [asRef(4, 47)],
    relatedPassages: [
      {
        id: "sabbathbreakers-araf-account",
        surahNumber: 7, ayahStart: 163, ayahEnd: 166,
        title: "The Town by the Sea",
        description: "The Sabbath-fish trial, the three-way internal division, and the transformation of the transgressors.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "musa", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Al-A'raf 7:163-166; An-Nahl 16:124" }],
    statusNotes: [
      "`identificationBasis: 'quran_context'` (not 'quran_explicit'): 7:163 does not use a fixed name for this community, and does not itself state they were Israelites — that identification comes from the immediately preceding verses (7:160-162), which are addressed to/about Bani Isra'il, giving strong Qur'anic CONTEXT for the connection without a direct explicit label inside 7:163-166 itself. This is the precise distinction Phase 2 asked this field to capture.",
      "`directMentions` reflects only 4:47's use of the phrase 'أصحاب السبت' as a general referenced example to the People of the Book; the narrative itself (7:163-166) does not repeat that exact phrase, which is why it is catalogued under Related Passages rather than Direct Mentions — consistent with this app's existing direct-mention-vs-narrative-passage discipline.",
    ],
  },

  {
    id: "quraysh",
    name: "Quraysh",
    arabicName: "قريش",
    communityType: "tribe",
    identificationBasis: "quran_explicit",
    shortDescription:
      "The Prophet Muhammad's ﷺ own tribe, named directly in a short surah recalling their trade caravans and calling them to gratitude to 'the Lord of this House.'",
    detailedDescription:
      "Surah Quraysh (106), a very short surah, is named for and directly addresses this tribe: recalling 'their familiarity with the journey of winter and summer' (their trade caravans) as a favor, and instructing them to 'worship the Lord of this House [the Ka'bah], who has fed them, [saving them] from hunger, and made them safe, [saving them] from fear.'",
    themes: ["Trade security as a stated favor", "A direct call to gratitude tied to the Ka'bah"],
    directMentions: [asRef(106, 1)],
    relatedPassages: [
      {
        id: "quraysh-surah",
        surahNumber: 106, ayahStart: 1, ayahEnd: 4,
        title: "Surah Quraysh",
        description: "The full short surah: their trade journeys recalled as a favor, and the call to worship the Lord of the House.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "muhammad", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    sources: [{ type: "quran", citation: "Quraysh 106:1-4" }],
    statusNotes: [
      "Unlike the destroyed-nation entries above, Quraysh is not narrated as punished or destroyed in this surah — the tone is a call to gratitude, not a warning of consequence; this entry does not import the 'outcome: destroyed' pattern of the other entities here for that reason (no `outcome` field is set).",
    ],
  },

  {
    id: "ahlalkitab",
    name: "Ahl al-Kitab (People of the Book)",
    arabicName: "أهل الكتاب",
    alternateNames: ["People of the Book"],
    communityType: "religious_community",
    identificationBasis: "quran_explicit",
    shortDescription:
      "A religious-community designation — not one ethnic nation — for Jews and Christians collectively, addressed dozens of times across the Qur'an on shared scripture, shared prophets, and points of both commonality and dispute.",
    detailedDescription:
      "'Ahl al-Kitab' spans both Jewish and Christian communities (distinguished from each other elsewhere in the Qur'an, e.g. 'al-Yahud' and 'an-Nasara'), addressed collectively as recipients of earlier revealed scripture. The Qur'an calls them to 'a word common between us' (3:64), debates specific theological claims with them (including the divinity of Isa and claims about Uzair, both already covered on their own Persons-module entries), and both criticizes specific historical conduct and affirms 'among the People of the Book is a community standing [in obedience]' (3:113) — the address is not monolithic.",
    themes: ["Shared scriptural lineage", "A call to common ground alongside real theological dispute", "Internal diversity acknowledged, not treated as monolithic"],
    directMentions: [
      asRef(3, 64), asRef(3, 65), asRef(3, 70), asRef(3, 98), asRef(3, 110), asRef(3, 113),
      asRef(5, 15), asRef(5, 19), asRef(5, 59), asRef(5, 68),
    ],
    relatedPassages: [
      {
        id: "ahlalkitab-imran-common-word",
        surahNumber: 3, ayahStart: 64, ayahEnd: 71,
        title: "'A Word Common Between Us'",
        description: "The call to shared monotheism, and a direct rebuttal of specific claims made in the People of the Book's own scriptural disputes.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "ahlalkitab-imran-not-monolithic",
        surahNumber: 3, ayahStart: 110, ayahEnd: 115,
        title: "'Not All Alike'",
        description: "An explicit acknowledgment that the People of the Book are not a single undifferentiated group — some 'stand [in obedience]' and are praised directly.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    sources: [{ type: "quran", citation: "Aal-i-Imran 3:64-71, 110-115" }],
    statusNotes: [
      "This is deliberately classified `religious_community`, not `nation`/`tribe`: it spans multiple actual peoples (historically, primarily Jewish and Christian communities) unified by a shared scriptural-revelation status in the Qur'an's own address, not by ethnicity, geography, or genealogy the way 'Ad, Thamud, or Bani Isra'il are. The roadmap's own suggested classification list anticipated exactly this case.",
      "`directMentions` here is a representative anchor set, not exhaustive — the phrase 'أهل الكتاب' appears roughly 31 times across the Qur'an per a live search; restating the full list was judged to add citation volume without added narrative content beyond what the Related Passages already carry.",
    ],
  },

  {
    id: "peopleofyunus",
    name: "The People of Yunus",
    arabicName: "قوم يونس",
    communityType: "community",
    identificationBasis: "quran_explicit",
    shortDescription:
      "Rare among the Qur'an's destroyed-people narratives for a positive outcome: having seen the coming punishment, they believed in time and were spared — held up directly as the one clear example of a whole town whose belief 'benefited it.'",
    detailedDescription:
      "10:98 states directly: 'Then has there not been a town that believed so its faith benefited it except the people of Yunus? When they believed, We removed from them the punishment of disgrace in worldly life and gave them enjoyment for a time.' Surah As-Saffat separately narrates Yunus's own flight from his mission, his time in the fish, and his eventual return 'to [his people of] a hundred thousand or more, and they believed, so We gave them enjoyment for a time' (37:147-148).",
    themes: ["A rare positive outcome among destroyed-people narratives", "Timely, collective repentance"],
    outcome: "Spared after believing when they saw the coming punishment — the Qur'an's one explicit example of a whole town whose faith 'benefited it' (10:98).",
    directMentions: [asRef(10, 98)],
    relatedPassages: [
      {
        id: "peopleofyunus-yunus-spared",
        surahNumber: 10, ayahStart: 98, ayahEnd: 98,
        title: "The One Town Whose Faith Benefited It",
        description: "The direct statement that the people of Yunus believed in time and were spared.",
        storyOrder: 1, source: "quran", verificationStatus: "verified",
      },
      {
        id: "peopleofyunus-saffat-return",
        surahNumber: 37, ayahStart: 139, ayahEnd: 148,
        title: "Yunus's Return to Them, in As-Saffat",
        description: "Yunus's flight, his time in the fish, and his return to a people of '100,000 or more' who believed.",
        storyOrder: 2, source: "quran", verificationStatus: "verified",
      },
    ],
    relationships: [
      { personId: "yunus", relationshipType: "other", sourceType: "quran", verificationStatus: "verified" },
    ],
    associatedPlaces: ["Traditionally identified as Nineveh — not a place-name the Qur'an itself states"],
    sources: [{ type: "quran", citation: "Yunus 10:98; As-Saffat 37:139-148" }],
    statusNotes: [
      "The Qur'an does not name this town; 'Nineveh' is the standard traditional/historical identification (also reflected in the Biblical account of Jonah), not stated in the Arabic text of either passage cited here.",
      "Phase 3 migration note: 'Nineveh' remains free text — no dedicated Place entity was created for it, since it would carry no Qur'anic textual content beyond what this entry already states (the town is never named in the text).",
    ],
  },
];

export const getCommunityById = (id: string): QuranCommunity | undefined =>
  QURAN_COMMUNITIES.find((c) => c.id === id);
