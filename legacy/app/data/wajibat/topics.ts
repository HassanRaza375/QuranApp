// Wajibat topics. Every `summary`/`explanations` entry is app-written
// explanation (kind: "explanation"). It orients the reader and is never shown
// as a ruling. The rulings themselves live in ./rulings/*.ts, each quoted
// from a marja's own book.
import type { WajibatTopic } from "./types";

const explain = (en: string) => ({ kind: "explanation" as const, text: { en } });

export const WAJIBAT_TOPICS: WajibatTopic[] = [
  {
    id: "taqlid",
    fiqh: "jafari",
    categoryId: "foundations",
    title: { en: "Taqlid — following a marja'", ur: "تقلید" },
    arabicTerm: "التقليد",
    summary: explain(
      "Someone who is not a mujtahid, and who cannot act on precaution, follows the rulings of a qualified mujtahid (their marja'). This topic covers who may be followed, how their rulings are learned, what \"obligatory\" and \"recommended\" precaution mean, and what happens when a marja' passes away."
    ),
    rulingIds: [
      "taqlidoptions",
      "mujtahidconditions",
      "meaningofadil",
      "followingthealam",
      "identifyingmujtahid",
      "obtainingfatwa",
      "ihtiyatwajib",
      "ihtiyatmustahab",
      "deceasedmujtahid",
      "learningrulings",
      "actionswithouttaqlid",
    ],
    relatedTopicIds: ["ahkam", "usuldin"],
    glossaryIds: ["taqlid", "mujtahid", "marja", "muqallid", "mukallaf", "adil", "alam", "ihtiyat", "ihtiyatlazim", "ihtiyatmustahab"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "ahkam",
    fiqh: "jafari",
    categoryId: "foundations",
    title: { en: "The five categories of rulings", ur: "احکام خمسہ" },
    arabicTerm: "الأحكام الخمسة",
    summary: explain(
      "Every act a duty-bound person does falls under one of five rulings. Throughout this module each ruling carries a badge for its category, and for its strength when the marja' states it as a precaution."
    ),
    explanations: [
      {
        heading: { en: "The five rulings" },
        body: explain(
          "Wājib (obligatory): must be done; leaving it is a sin.\nḤarām (unlawful): must be avoided; doing it is a sin.\nMustaḥabb (recommended): rewarded if done, no sin if left.\nMakrūh (disapproved): better avoided, no sin if done.\nMubāḥ (permissible): neither encouraged nor discouraged."
        ),
      },
      {
        heading: { en: "Fatwa and precaution" },
        body: explain(
          "A marja' may state a ruling as a definite fatwa, as an obligatory precaution (iḥtiyāṭ wājib, on which a follower may instead act on the fatwa of the next most learned mujtahid), or as a recommended precaution (iḥtiyāṭ mustaḥabb, which a follower does not have to act on). The marja's own wording of these rules is under Taqlid."
        ),
      },
    ],
    rulingIds: ["mustahabbatrajaan"],
    relatedTopicIds: ["taqlid"],
    glossaryIds: ["wajib", "haram", "mustahab", "makruh", "mubah", "ihtiyatlazim", "ihtiyatmustahab"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "usuldin",
    fiqh: "jafari",
    categoryId: "foundations",
    title: { en: "Fundamentals of religion (overview)", ur: "اصول دین" },
    arabicTerm: "أصول الدين",
    summary: explain(
      "The fundamentals of religion are matters of belief. Unlike the practical laws, they are held through one's own conviction, not by following a marja'. This page is a brief overview only."
    ),
    explanations: [
      {
        heading: { en: "The five fundamentals" },
        body: explain(
          "Tawḥīd: the oneness of Allah.\nʿAdl: divine justice.\nNubuwwah: prophethood.\nImāmah: the imamate.\nQiyāmah: the Day of Resurrection."
        ),
      },
    ],
    rulingIds: ["usulnottaqlid"],
    relatedTopicIds: ["taqlid", "furuaddin"],
    glossaryIds: ["usuldin"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "furuaddin",
    fiqh: "jafari",
    categoryId: "foundations",
    title: { en: "Branches of religion (overview)", ur: "فروع دین" },
    arabicTerm: "فروع الدين",
    summary: explain(
      "The branches of religion are the practical obligations. Each one has its own section in this module; the sections are filled in phase by phase."
    ),
    explanations: [
      {
        heading: { en: "The ten branches" },
        body: explain(
          "Ṣalāh (prayer)\nṢawm (fasting)\nḤajj (pilgrimage)\nZakāt\nKhums\nJihād\nAmr bil-maʿrūf (enjoining good)\nNahy ʿan al-munkar (forbidding evil)\nTawallā (loving the friends of Allah)\nTabarrā (dissociating from the enemies of Allah)"
        ),
      },
    ],
    rulingIds: [],
    relatedTopicIds: ["usuldin", "taqlid"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "bulugh",
    fiqh: "jafari",
    categoryId: "foundations",
    title: { en: "Age of legal responsibility (bulugh)", ur: "بلوغ" },
    arabicTerm: "البلوغ",
    summary: explain(
      "Religious obligations begin at bulugh, the age of legal responsibility. This topic covers its signs for girls and boys and how the age is counted."
    ),
    rulingIds: ["bulughsigns", "bulughlunaryears", "bulughfacialhair", "bleedingbeforenine"],
    relatedTopicIds: ["taqlid", "haydistihadanifas"],
    glossaryIds: ["bulugh", "baligh", "mukallaf", "mumayyiz"],
    lastSourceCheck: "2026-09-25",
  },

  // ---------------------------- Taharat (Phase 2) ----------------------------
  // Qur'anic basis (decision R2): an ayah is linked only where its own text names
  // the act — 5:6 (washing the face and arms, wiping the head and feet; "if you are
  // junub, purify yourselves"; tayammum) and 4:43 ("until you bathe"; tayammum).
  // Checked against the app's Qur'an text (quranapi.pages.dev) on 2026-09-25.
  {
    id: "water",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Water and its types", ur: "پانی کے احکام" },
    arabicTerm: "المياه",
    summary: explain(
      "Water is either unmixed (muṭlaq), which can purify and be used for wuḍūʾ and ghusl, or mixed (muḍāf), which cannot. Unmixed water is further divided by quantity and source (kurr, qalīl, flowing, rain and well water), which decides whether it becomes impure on contact with an impurity."
    ),
    rulingIds: ["watertypes", "kurrdefinition", "kurrimpurity", "kurrdoubt", "qalilwater", "flowingwater", "tapwater", "rainwater", "mixedwateruse", "waterchangedbyimpurity", "waterpuritydoubt"],
    relatedTopicIds: ["najasat", "mutahhirat", "wudu"],
    glossaryIds: ["kurr", "qalil", "mutlaq", "mudaf"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "najasat",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Impurities (najāsāt)", ur: "نجاسات" },
    arabicTerm: "النجاسات",
    summary: explain(
      "Certain things are intrinsically impure (najis). This topic covers what they are, how impurity is established, and how it transfers from one thing to another."
    ),
    rulingIds: ["tennajasat", "urinefaeces", "birddroppings", "semen", "corpse", "deadskin", "importedleather", "blood", "dogpig", "wineintoxicants", "alcohol", "establishingimpurity", "purityimpuritydoubt", "impuritytransfer", "wetnessdoubt", "quranimpure", "eatingimpure", "personsnotbelieving", "personsghulat", "personsrejecting", "personsahlalkitab", "personsnonkitabi", "personschild", "personsunknown", "personsabusingimams"],
    relatedTopicIds: ["mutahhirat", "water"],
    glossaryIds: ["najis", "tahir"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "mutahhirat",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Purifiers (muṭahhirāt)", ur: "مطہرات" },
    arabicTerm: "المطهرات",
    summary: explain(
      "The things that make an impure object pure again: water, earth, the sun, transformation and others. This topic covers the most common ones and how to wash impure things and utensils."
    ),
    rulingIds: ["twelvemutahhirat", "waterconditions", "utensilwashing", "immersionkurr", "urinequalilwater", "otherimpurityqalil", "intrinsicremoval", "washingmachine", "earthpurifies", "asphalt", "sunpurifies", "istihala", "islampurifies", "purityestablished", "goldsilverutensils"],
    relatedTopicIds: ["najasat", "water"],
    glossaryIds: ["najis", "tahir", "kurr", "qalil"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "istinja",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "The toilet and istinjāʾ", ur: "بیت الخلاء کے احکام" },
    arabicTerm: "أحكام التخلي",
    summary: explain(
      "What is obligatory and what is recommended when using the toilet: covering, facing the qibla, purifying the urinary outlet and the anus, and istibrāʾ."
    ),
    rulingIds: ["coveringprivateparts", "toiletqibla", "toiletprohibitedplaces", "anuswateronly", "urinaryoutlet", "anuswithwater", "anuswithstone", "anusthreetimes", "istinjadoubt", "istibra", "dischargesmadhi", "istibradoubt", "istibrawomen"],
    relatedTopicIds: ["najasat", "wudu"],
    glossaryIds: ["istibra"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "wudu",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Wuḍūʾ (ablution)", ur: "وضو" },
    arabicTerm: "الوضوء",
    summary: explain(
      "Wuḍūʾ is washing the face and arms and wiping the head and feet, in order and without a break. This topic covers how it is done, its conditions, what invalidates it, and doubts about it."
    ),
    quranicBasis: [{ surahNumber: 5, ayahNumber: 6 }],
    // Decision P9: the app's default translation renders 5:6 as "wash your feet". The clause
    // below was checked verbatim in two independent online copies of al-Mīzān (2026-09-25).
    quranicBasisNotes: [
      {
        surahNumber: 5,
        ayahNumber: 6,
        note: explain(
          "Ja'fari fiqh reads this ayah as wiping (masḥ) the feet, not washing them: Ṭabāṭabāʾī concludes in al-Mīzān that the ayah conveys the obligation of washing the face and hands, and wiping the head and feet."
        ),
        quote: { text: "وفهمت من الكلام وجوب غسل الوجه واليدين، ومسح الرأس والرجلين", lang: "ar" },
        source: {
          title: "al-Mīzān fī Tafsīr al-Qurʾān (Ṭabāṭabāʾī)",
          reference: "vol. 5, pp. 187–199, commentary on 5:6",
          urls: [
            "https://almerja.com/reading.php?idm=73433",
            "https://www.greattafsirs.com/Tafsir_Library.aspx?QuranAyat_Home=1&MadhabNo=4&TafsirNo=56&SoraNo=5&AyahNo=6&LanguageID=1",
          ],
        },
      },
    ],
    rulingIds: ["wuduobligatoryacts", "wuduface", "wududirection", "wuduarms", "wuduwashingcount", "wuduhead", "wuduheadarea", "wudufeet", "wudusocks", "wuduimmersive", "wuduwaterimpure", "wuduusurpedwater", "wuduintention", "wudusequence", "wudusuccession", "wuduobstruction", "wududoubtvoid", "wududoubtperformed", "wududoubtafterprayer", "wududoubtduring", "wuduorderunknown", "wuduvoidtime", "wuduunaware", "wuduexcessive", "wuduwhenwajib", "touchingquran", "wuduinvalidators", "jabirauncovered", "jabiracovered"],
    procedureIds: ["wudusistani"],
    decisionTreeIds: ["sistaniwudu", "khameneiwudu"],
    relatedTopicIds: ["ghusl", "tayammum", "istinja"],
    glossaryIds: ["wudu", "jabirah", "tartib", "muwalah"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "ghusl",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Ghusl (ritual bath)", ur: "غسل" },
    arabicTerm: "الغسل",
    summary: explain(
      "Ghusl is washing the whole body with the intention of ghusl, either in sequence (head and neck first, then the body) or by immersion. This topic covers janābah, the ghusl for janābah and its conditions, and the ghusl for touching a corpse."
    ),
    quranicBasis: [
      { surahNumber: 5, ayahNumber: 6 },
      { surahNumber: 4, ayahNumber: 43 },
    ],
    rulingIds: ["becomingjunub", "semensigns", "womenjanabah", "junubunlawful", "ghusljanabahobligatory", "ghusltypes", "ghusltartibi", "ghuslirtimasi", "ghuslgradual", "ghuslwholebody", "ghuslobstruction", "ghuslhair", "ghusldoubt", "ghusleventduring", "ghuslseveral", "ghuslreplaceswudu", "ghuslmassmayyit"],
    procedureIds: ["ghusltartibisistani", "ghuslirtimasisistani"],
    relatedTopicIds: ["wudu", "haydistihadanifas", "tayammum"],
    glossaryIds: ["ghusl", "junub", "janabah"],
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "haydistihadanifas",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Ḥayḍ, istiḥāḍah and nifās", ur: "حیض، استحاضہ اور نفاس" },
    arabicTerm: "الحيض والاستحاضة والنفاس",
    summary: explain(
      "Rulings on menstruation (ḥayḍ), irregular bleeding (istiḥāḍah) and post-natal bleeding (nifās): how each is recognised, and what it means for prayer, fasting and ghusl. The rulings are shown in full, inside a collapsed section."
    ),
    rulingIds: ["istihadablood", "istihadatypes", "istihadaslight", "istihadamedium", "istihadaexcessive", "haydblood", "haydduration", "haydunlawful", "haydghusl", "haydprayers", "haydfast", "haydpostponing", "haydpregnancy", "haydcategories", "haydspotting", "haydcontraceptive", "nifasdefinition", "nifasduration", "nifasrulings", "menopause"],
    relatedTopicIds: ["ghusl", "bulugh"],
    glossaryIds: ["hayd", "istihadah", "nifas"],
    sensitive: true,
    lastSourceCheck: "2026-09-25",
  },
  {
    id: "tayammum",
    fiqh: "jafari",
    categoryId: "taharat",
    title: { en: "Tayammum (dry ablution)", ur: "تیمم" },
    arabicTerm: "التيمم",
    summary: explain(
      "Tayammum replaces wuḍūʾ or ghusl when water cannot be used: when there is none, when using it is harmful, or when time is too short. This topic covers when it is allowed, what it may be performed on, how it is done, and what invalidates it."
    ),
    quranicBasis: [
      { surahNumber: 5, ayahNumber: 6 },
      { surahNumber: 4, ayahNumber: 43 },
    ],
    rulingIds: ["tayammumnoaccess", "tayammumharm", "tayammumhardship", "tayammumshorttime", "tayammumsurfaces", "tayammumgypsum", "tayammumpure", "tayammumobligatory", "tayammumcomplete", "tayammumdirection", "tayammumexcuseends", "tayammuminvalidators", "tayammuminsteadofghusl", "tayammumneither"],
    procedureIds: ["tayammumsistani", "tayammumkhamenei"],
    relatedTopicIds: ["wudu", "ghusl"],
    glossaryIds: ["tayammum"],
    lastSourceCheck: "2026-09-25",
  },

  // ---------------------------- Salat (Phase 3) ----------------------------
  {
    id: "dailyprayers",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "The obligatory prayers", ur: "واجب نمازیں" },
    arabicTerm: "الصلوات الواجبة",
    summary: explain(
      "Which prayers are obligatory, and the five daily prayers with the number of rakʿahs in each."
    ),
    rulingIds: ["obligatoryprayers", "dailyrakat", "importanceofprayer", "khqa337"],
    relatedTopicIds: ["prayertimes", "guidedprayers"],
    glossaryIds: ["rakah", "nafilah"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "prayertimes",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Prayer times", ur: "اوقات نماز" },
    arabicTerm: "مواقيت الصلاة",
    summary: explain(
      "When each daily prayer may be performed, the shared and specific times of ẓuhr/ʿaṣr and maghrib/ʿishāʾ, and the order between them. Today's times are shown live from the app's Prayer Times feature; nothing is recalculated here."
    ),
    liveTool: "prayertimes",
    rulingIds: ["zuhrasrtime", "khqa361", "maghribishatime", "fajrtime", "khqa350", "missedbymidnight", "certaintyoftime", "khqa358", "onerakahintime", "khqa348", "prayingearly", "orderzuhrasr", "khqa360"],
    relatedTopicIds: ["dailyprayers", "qibla"],
    glossaryIds: ["zawal", "ada", "qada"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "qibla",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Qibla", ur: "قبلہ" },
    arabicTerm: "القبلة",
    summary: explain(
      "Facing the Kaʿbah in prayer and what to do when its direction is uncertain. The app's Qibla tool shows the direction from your location."
    ),
    liveTool: "qibla",
    rulingIds: ["qibladirection", "qiblaeffort", "qiblaeffortqa", "qiblanomeans", "khqa364", "qiblanomeansqa", "qiblarecommended"],
    relatedTopicIds: ["prayertimes", "placeofprayer"],
    glossaryIds: ["qibla"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "clothing",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Covering and clothing in prayer", ur: "نماز گزار کا لباس" },
    arabicTerm: "لباس المصلي",
    summary: explain(
      "What men and women must cover in prayer, and the conditions of the clothing: pure, not usurped, not from a non-slaughtered or ḥarām-meat animal, and no gold or pure silk for men."
    ),
    rulingIds: ["coveringmen", "coveringwomen", "khqa435", "coveringintentional", "clothingconditions", "clothingpure", "impureunaware", "khqa428", "impurityexemptions", "woundblood", "usurpedclothing", "nonslaughtered", "haramanimal", "khqa439", "goldmen", "goldjewellerymen", "khqa440", "khqa443", "silkmen", "silkwomen", "khqa429"],
    relatedTopicIds: ["placeofprayer", "najasat"],
    glossaryIds: ["najis", "tahir"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "placeofprayer",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "The place of prayer", ur: "نماز کی جگہ" },
    arabicTerm: "مكان المصلي",
    summary: explain(
      "Conditions of the place where one prays: permitted to use, still, and the rules on mosques."
    ),
    rulingIds: ["usurpedplace", "khqa382", "stillplace", "vehicleprayer", "khqa386", "khqa723", "aheadofgrave", "menwomengap", "khqa372", "insidekaba", "mosquevirtue", "khqa384", "mosqueimpure"],
    relatedTopicIds: ["clothing", "sajdahplace"],
    glossaryIds: [],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "adhaniqamah",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Adhān and iqāmah", ur: "اذان و اقامت" },
    arabicTerm: "الأذان والإقامة",
    summary: explain(
      "The call to prayer and the call to stand for prayer: their status, wording and conditions."
    ),
    rulingIds: ["adhanrecommended", "adhanwording", "shahadathalithah", "khqa454", "adhancongregation", "adhanafter", "iqamahstanding"],
    relatedTopicIds: ["obligatoryparts"],
    glossaryIds: ["adhan", "iqamah"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "obligatoryparts",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "The obligatory parts of prayer", ur: "واجبات نماز" },
    arabicTerm: "واجبات الصلاة",
    summary: explain(
      "The eleven obligatory parts of the prayer, which of them are elemental (rukn), and the rulings on intention, takbīrat al-iḥrām and standing."
    ),
    rulingIds: ["elevencomponents", "rukns", "intention", "intentionspecified", "riya", "takbir", "takbirstill", "qiyam", "qiyamstill", "unabletostand", "khqa455"],
    relatedTopicIds: ["qiraah", "rukusujud", "tashahhudsalam", "guidedprayers"],
    glossaryIds: ["rukn", "niyyah", "takbiratalihram"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "qiraah",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Recitation in prayer", ur: "قرأت" },
    arabicTerm: "القراءة",
    summary: explain(
      "Reciting al-Ḥamd and another surah, reciting aloud or quietly, and what is recited in the third and fourth rakʿahs."
    ),
    rulingIds: ["fatihasurah", "khqa473", "shorttimesurah", "forgotrecitation", "sajdahsurahs", "ikhlaskafirun", "aloudmen", "khqa456", "aloudsubhmaghrib", "aloudwomen", "khqa469", "aloudmistake", "correctrecitation", "khqa465", "thirdfourthrakah", "khqa481", "thirdfourthquiet"],
    relatedTopicIds: ["obligatoryparts", "rukusujud"],
    glossaryIds: ["qiraah", "jahr", "ikhfat"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "rukusujud",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Rukūʿ and sajdah", ur: "رکوع و سجدہ" },
    arabicTerm: "الركوع والسجود",
    summary: explain(
      "Bowing and prostrating: how they are done, their dhikr, stillness, and what happens if one is forgotten."
    ),
    rulingIds: ["ruku", "rukudhikr", "rukusajdahdhikrqa", "rukustill", "afterruku", "forgotruku", "twosajdahs", "sevenparts", "sajdahrukn", "sajdahdhikr", "dhikrwording", "betweensajdahs", "sajdahheight", "sajdahbarrier", "khqa489", "turbahpure"],
    relatedTopicIds: ["sajdahplace", "obligatoryparts"],
    glossaryIds: ["ruku", "sajdah", "rukn"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "sajdahplace",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "What sajdah may be performed on", ur: "سجدہ کی جگہ" },
    arabicTerm: "ما يصح السجود عليه",
    summary: explain(
      "Earth and what grows from it that is neither eaten nor worn, and the obligatory sajdahs of the Qur'an."
    ),
    rulingIds: ["sajdahearth", "khqa493", "sajdahfodder", "sajdahbuilding", "khqa487", "sajdahpaper", "sajdahbest", "sajdahnothing", "sajdahtaqiyyah", "sajdahforother", "quransajdah", "khqa498"],
    relatedTopicIds: ["rukusujud", "placeofprayer"],
    glossaryIds: ["turbah", "sajdah"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "tashahhudsalam",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Tashahhud, salām, order and qunūt", ur: "تشہد، سلام اور قنوت" },
    arabicTerm: "التشهد والسلام والقنوت",
    summary: explain(
      "Tashahhud and salām, keeping the parts of the prayer in sequence and in close succession, qunūt, and the supplications after prayer."
    ),
    rulingIds: ["tashahhud", "tashahhudforgot", "salam", "salamforgot", "tartib", "muwalat", "qunut", "qunutdhikr", "taqibat"],
    relatedTopicIds: ["obligatoryparts", "guidedprayers"],
    glossaryIds: ["tashahhud", "salam", "qunut", "tartib", "muwalah", "taqibat"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "mubtilat",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Things that invalidate the prayer", ur: "مبطلات نماز" },
    arabicTerm: "مبطلات الصلاة",
    summary: explain(
      "What breaks the prayer, replying to a greeting during prayer, and when a prayer may or must be broken."
    ),
    rulingIds: ["mubtilatlist", "turningface", "speaking", "replyingsalam", "khqa510", "laughing", "khqa503", "eatingdrinking", "amin", "khqa501", "breakingprayer", "breakingnecessity"],
    relatedTopicIds: ["obligatoryparts"],
    glossaryIds: ["mubtilat"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "doubts",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Doubts in prayer", ur: "شکیات نماز" },
    arabicTerm: "الشكوك في الصلاة",
    summary: explain(
      "Doubting whether you prayed, whether you did a part of the prayer, or how many rakʿahs you have prayed: which doubts invalidate the prayer, which are dismissed, and which are valid and how to act on them."
    ),
    rulingIds: ["doubtkinds", "doubtprayeritself", "doubtsinvalidating", "doubtinvalidthink", "doubtrakahhow", "doubtsvalid", "doubtsupposition", "doubtsuppositionchange", "doubtsuppositionunsure", "doubtvaliddontbreak", "doubtvalidrestart", "doubtknowsnextstage", "doubtafterprayerunsure", "doubtsajdahandrakah", "doubtbeforetashahhud", "doubtforgotsajdahstanding", "doubtchanges", "doubtafterprayertwo", "doubtafterprayerkind", "doubtsdismissedlist", "doubtpartgeneral", "khqa514", "doubttakbir", "doubtfatiha", "doubtsurah", "doubtverse", "doubtcorrectness", "doubtruku", "doubtrukn", "doubtrising", "doubtsittingprayer", "doubtrepeated", "doubtremembermissing", "doubtsalam", "doubtaftersalam", "khqa517", "doubtaftersalaminvalid", "doubtaftertime", "doubtzuhrasr", "doubtmaghribisha", "excessivedoubter", "excessiveact", "khqa516", "excessivepart", "excessiveprayer", "excessiveplace", "excessiveunsure", "excessiverukn", "excessivenonrukn", "doubtimam", "doubtmustahabnumber", "doubtmustahabrukn", "doubtmustahabpart", "khqa515", "doubtmustahabsupposition", "doubtmustahabsahw", "doubtmustahabprayed", "doubtotherprayers"],
    decisionTreeIds: ["sistanidoubts", "khameneidoubts"],
    relatedTopicIds: ["ihtiyatprayer", "sahwforgotten", "mubtilat"],
    glossaryIds: ["shakk", "shakkiyyat", "zann", "kathiralshakk", "rakah", "rukn"],
    lastSourceCheck: "2026-10-07",
  },
  {
    id: "ihtiyatprayer",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "The precautionary prayer (ṣalāt al-iḥtiyāṭ)", ur: "نماز احتیاط" },
    arabicTerm: "صلاة الاحتياط",
    summary: explain(
      "The prayer some valid doubts about the number of rakʿahs call for after the salām: how it is performed, and what to do if you find out more before, during or after it."
    ),
    rulingIds: ["ihtiyatmethod", "ihtiyatrecitation", "ihtiyatnotneeded", "ihtiyatfewer", "ihtiyatsame", "ihtiyatless", "ihtiyatmore", "ihtiyattwothreefour", "ihtiyatremembersduring", "ihtiyatremembersthree", "ihtiyatdifferentshortfall", "ihtiyatdoubtperformed", "ihtiyatadded", "ihtiyatdoubtpart", "ihtiyatdoubtnumber", "ihtiyatnosahw", "ihtiyatdoubtaftersalam", "ihtiyatforgot", "ihtiyatorder", "ihtiyatsitting", "ihtiyatcannotstand", "ihtiyatcanstand", "khqa520"],
    relatedTopicIds: ["doubts", "sahwforgotten"],
    glossaryIds: ["salatalihtiyat", "shakk", "rakah"],
    lastSourceCheck: "2026-10-07",
  },
  {
    id: "sahwforgotten",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Sajdat al-sahw and forgotten parts", ur: "سجدۂ سہو اور بھولے ہوئے اجزاء" },
    arabicTerm: "سجدتا السهو",
    summary: explain(
      "The two prostrations for inadvertence and when they are due, making up a forgotten sajdah or tashahhud, and leaving out or adding parts of the prayer."
    ),
    rulingIds: ["sahwcases", "sahwtalking", "sahwsounds", "sahwrecitedagain", "khqa521", "sahwonemistake", "sahwtasbihat", "sahwsalampart", "sahwsalamall", "forgotbeforeruku", "forgotafterruku", "khqa519", "forgotsajdahqada", "forgottashahhudqada", "forgotnonrukn", "khqa518", "sahwintentional", "sahwdoubtobligatory", "sahwdoubttwofour", "sahwonemissed", "sahwmethod", "qadaconditions", "qadanosalam", "qadaseveral", "qadasajdahtashahhud", "qadasajdahorder", "qadainvalidator", "qadalastrakah", "qadasahwbetween", "qadasajdahortashahhud", "qadadoubtforgot", "qadadoubtremembered", "qadasahwboth", "qadadoubtdone", "omitintentional", "omitignorance", "omitwudu", "omittwosajdahs", "omitlastsajdahs", "omitrakahbefore", "omitrakahafter", "omitsajdahsafter", "omittimeqibla"],
    relatedTopicIds: ["doubts", "ihtiyatprayer", "obligatoryparts"],
    glossaryIds: ["sajdatalsahw", "sajdah", "tashahhud", "rukn"],
    lastSourceCheck: "2026-10-07",
  },
  {
    id: "travellerprayer",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "The traveller's prayer", ur: "نماز مسافر" },
    arabicTerm: "صلاة المسافر",
    summary: explain(
      "When a traveller shortens the four-rakʿah prayers to two (qaṣr): the distance, intention, purpose of the journey, the permitted limit, and what ends the journey."
    ),
    rulingIds: ["qasrintro", "khqa637", "qasrconditions", "khqa638", "qasrdistance", "qasrkm", "qasrdistancestart", "qasrintention", "qasrsinful", "qasrleisure", "qasrjob", "khqa641", "qasrlimit", "khqa674", "qasrwatan", "qasrtendays", "qasrthirtydays", "khqa671", "qasrfourplaces", "qasrignorance"],
    relatedTopicIds: ["qadaprayers"],
    glossaryIds: ["qasr", "tamam", "watan"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "qadaprayers",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Qaḍāʾ (missed) prayers", ur: "قضا نمازیں" },
    arabicTerm: "قضاء الصلاة",
    summary: explain(
      "Making up missed prayers, their order, and the eldest son's duty for his parents' missed prayers."
    ),
    rulingIds: ["qadaobligation", "qadanotdelay", "qadaorder", "khqa531", "qadaunknownnumber", "khqa536", "qadanafilah", "qadaliving", "eldestson", "khqa540", "eldestsonwho"],
    relatedTopicIds: ["travellerprayer", "dailyprayers"],
    glossaryIds: ["qada", "ada"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "jamaah",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Congregational prayer", ur: "نماز جماعت" },
    arabicTerm: "صلاة الجماعة",
    summary: explain(
      "The basics of praying in congregation: which prayers, the conditions of the imam, what the follower recites, and joining late."
    ),
    rulingIds: ["jamaahvirtue", "jamaahneglect", "khqa607", "jamaahwhichprayers", "imamconditions", "followerrecites", "khqa577", "followerquietprayers", "khqa563", "takbirbeforeimam", "joiningruku", "followerahead", "khqa574", "womenimam", "khqa594"],
    relatedTopicIds: ["otherprayers"],
    glossaryIds: ["jamaah", "mamum", "furada"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "otherprayers",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Other obligatory prayers", ur: "دیگر واجب نمازیں" },
    arabicTerm: "الصلوات الواجبة الأخرى",
    summary: explain(
      "The prayer of signs (ṣalāt al-āyāt), the Eid prayers, and the Friday prayer."
    ),
    rulingIds: ["ayatcauses", "khqa707", "ayatmethod", "ayatshort", "ayatruku", "eidstatus", "khqa631", "eidtime", "fridayprayer", "khqa605", "fridaybest", "khqa622", "fridayzuhr", "khqa629"],
    relatedTopicIds: ["jamaah", "dailyprayers"],
    glossaryIds: ["salatalayat"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "guidedprayers",
    fiqh: "jafari",
    categoryId: "salat",
    title: { en: "Guided prayers (step by step)", ur: "نماز کا طریقہ" },
    arabicTerm: "كيفية الصلاة",
    summary: explain(
      "Step-by-step ṣubḥ (2 rakʿahs), maghrib (3) and ẓuhr (4) prayers according to your marja'. Each step quotes the ruling it rests on, and rukn steps are marked. Recitations are shown as text only."
    ),
    procedureIds: ["fajrsistani", "maghribsistani", "zuhrsistani", "fajrkhamenei", "maghribkhamenei", "zuhrkhamenei"],
    rulingIds: [],
    relatedTopicIds: ["obligatoryparts", "qiraah", "rukusujud", "tashahhudsalam"],
    glossaryIds: ["rukn", "rakah"],
    lastSourceCheck: "2026-10-02",
  },
  {
    id: "sawmwho",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Who must fast", ur: "روزہ واجب ہونے اور صحیح ہونے کی شرائط" },
    arabicTerm: "الصوم",
    summary: explain(
      "The conditions under which fasting in the month of Ramadan becomes obligatory, and how they apply to a child who reaches bulūgh, a girl who has just reached bulūgh, a sick person who recovers during the day and a disbeliever who becomes a Muslim."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 183 }, { surahNumber: 2, ayahNumber: 185 }],
    rulingIds: ["sawmconditions", "sawmwhonot", "sawmbulugh", "sawmgirls", "sawmkafir", "sawmsickrecovers"],
    relatedTopicIds: ["sawmexempt", "sawmniyyah", "bulugh"],
    glossaryIds: ["sawm", "baligh", "bulugh", "mukallaf"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmexempt",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Illness, harm, old age, pregnancy and breastfeeding", ur: "وہ لوگ جن پر روزہ واجب نہیں ہے" },
    summary: explain(
      "When fasting is not obligatory because it is harmful or very hard, and the fidyah and qaḍāʾ that follow for someone who is ill, elderly, pregnant or breastfeeding."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 185 }],
    rulingIds: ["sawmharm", "khqa751", "khqa753", "sawmdoctor", "khqa744", "khqa749", "khqa750", "sawmharmafter", "sawmthirst", "sawmthirstextreme", "sawmweakness", "sawmold", "sawmoldafter", "sawmpregnant", "khqa741", "sawmbreastfeeding", "khqa743", "sawmpregnantdelay", "sawmfidyahwho", "sawmfidyahamount"],
    relatedTopicIds: ["sawmwho", "sawmqada"],
    glossaryIds: ["sawm", "fidyah", "mudd", "qada"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmniyyah",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "The intention for the fast", ur: "نیت" },
    arabicTerm: "نية الصوم",
    summary: explain(
      "What the intention for a fast is, the nights and times at which it may be made, specifying the kind of fast, and what follows when it is forgotten, delayed or doubted."
    ),
    rulingIds: ["sawmrequires", "sawmintentwhat", "sawmintentnight", "sawmintentlatest", "sawmintentkind", "sawmintentduty", "sawmintentother", "sawmintentsleep", "sawmintentnone", "sawmintentdeliberate", "sawmintentforgot", "sawmintentday", "sawmintentunconscious", "sawmintentintoxicated", "sawmintentassigned", "sawmintentfree", "sawmintentrecommended", "sawmdoubtday", "sawmdoubtdayfound", "sawmintentcontinue", "sawmintentreturn", "khqa754", "sawmintentbreak"],
    relatedTopicIds: ["sawmwho", "sawmmubtilat"],
    glossaryIds: ["niyyah", "sawm", "qada", "kaffarah", "nadhr", "rajaa", "madhimmah"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmmubtilat",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "What invalidates the fast", ur: "مبطلات روزہ" },
    arabicTerm: "مفطرات الصوم",
    summary: explain(
      "Eating and drinking, sexual intercourse, discharging semen, ascribing falsehood to Allah and the Imams, thick dust and smoke, immersing the head in water, enema and vomiting: what each book says invalidates the fast, what it excuses, and the acts it disapproves of."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 187 }],
    rulingIds: ["sawmlist", "sawmeating", "sawmeatingdawn", "sawmeatingforgot", "sawminjections", "khqa763", "sawmspray", "khqa758", "sawmpills", "khqa764", "khqa765", "sawmsublingual", "sawmteeth", "khqa760", "sawmtoothpick", "sawmsaliva", "sawmmucus", "sawmbleeding", "khqa755", "khqa761", "sawmbleedingsaliva", "khqa759", "sawmtasting", "sawmintercourse", "sawmintercoursepartial", "sawmintercoursedoubt", "sawmintercourseforgot", "sawmmasturbation", "sawmcourtship", "sawmcourtshipno", "sawminvoluntary", "khqa782", "sawmwetdreamsleep", "sawmwetdreamwake", "sawmwetdreamurinate", "sawmwetdreamresidue", "sawmwetdreamghusl", "sawmlying", "sawmlyingreport", "sawmlyingbelief", "sawmlyingtrue", "sawmlyingfabricated", "sawmlyingask", "sawmlyingrepent", "sawmdust", "khqa796", "sawmdustthin", "sawmdustcare", "sawmsmoke", "khqa756", "khqa757", "sawmdustdoubt", "sawmdustforgot", "sawmhead", "sawmheadbody", "sawmheadhalf", "sawmheadhair", "sawmheaddoubt", "sawmheadfell", "sawmshower", "sawmenema", "sawmvomit", "sawmvomitnight", "sawmvomitsick", "sawmswallowed", "sawmswallowedforgot", "sawmburpcertain", "sawmburp", "sawmintentional", "khqa793", "sawmrepeat", "sawmforced", "sawmforcedplace", "sawmdoubtdone", "sawmmakruh"],
    relatedTopicIds: ["sawmjanabah", "sawmkaffarah", "sawmonlyqada"],
    glossaryIds: ["sawm", "mubtilat", "junub", "qada", "kaffarah"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmjanabah",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Janābah, ḥayḍ and nifās and the fast" },
    summary: explain(
      "Remaining in janābah, or in ḥayḍ or nifās, until the time of dawn: the ghusl and tayammum, sleeping while junub, forgetting the ghusl, and a woman's fast when her ḥayḍ or nifās begins or ends."
    ),
    rulingIds: ["sawmjunubonpurpose", "sawmjunubqada", "sawmjunubother", "sawmjunubtayammum", "sawmjunubforgot", "khqa779", "sawmjunubmake", "sawmjunubmaketayammum", "khqa772", "sawmjunubsleepknow", "sawmjunubsleepprobable", "sawmjunubsleepexpect", "sawmjunubsleepunmindful", "sawmjunubsleepagain", "sawmjunubsleepsecond", "sawmjunubfirstsleep", "sawmjunubdoubt", "sawmjunubwetdream", "sawmjunubwetdreamqada", "sawmhaydfast", "sawmhaydstops", "sawmhaydbegins", "sawmhaydbefore", "sawmhaydtayammum", "sawmhaydtime", "sawmhaydnear", "sawmhaydforgot", "sawmhaydnegligent", "sawmistihadah", "sawmcorpse"],
    relatedTopicIds: ["sawmmubtilat", "ghusl", "haydistihadanifas", "tayammum"],
    glossaryIds: ["junub", "janabah", "hayd", "nifas", "ghusl", "tayammum", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmtimes",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Dawn, maghrib and breaking the fast" },
    summary: explain(
      "When the fast begins and ends: doubting the dawn, doubting maghrib, breaking the fast too early, and praying before breaking the fast. Today's dawn and maghrib times are shown from the app's Prayer Times feature."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 187 }],
    rulingIds: ["sawmdawndoubt", "sawmdawninvestigate", "sawmmaghribdoubt", "sawmmaghribwrong", "sawmmaghribcloud", "sawmprayerfirst", "sawmabstain"],
    liveTool: "sawm",
    relatedTopicIds: ["prayertimes", "sawmmubtilat"],
    glossaryIds: ["sawm", "iftar", "maghrib", "qada"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmkaffarah",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Kaffārah for breaking the fast", ur: "عمداً افطار کرنے کا کفارہ" },
    arabicTerm: "كفارة الصوم",
    summary: explain(
      "When kaffārah is due in addition to qaḍāʾ, the kinds of kaffārah and how to give them, and cases that affect it: several acts in a day, spouses, travelling after breaking the fast, and delay."
    ),
    rulingIds: ["sawmkaffwhen", "sawmkaffignorance", "khqa813", "sawmkaffharam", "sawmkafftypes", "sawmkaffunable", "sawmkaffable", "sawmkaffmonths", "sawmkaffmonthsstart", "sawmkaffmonthsbreak", "sawmkaffmonthsexcuse", "sawmkaffsixty", "sawmkaffsixtyhow", "sawmkaffpoor", "sawmkaffunlawful", "khqa780", "sawmkaffallah", "sawmkaffseveral", "khqa790", "sawmkaffthen", "sawmkaffmixed", "sawmkaffburp", "sawmkaffvow", "sawmkaffmaghribword", "sawmkaffjourney", "sawmkaffexcuse", "sawmkaffwrongday", "sawmkaffshawwal", "sawmkaffspouses", "khqa766", "sawmkaffcompelhusband", "sawmkaffcompelwife", "sawmkaffasleep", "sawmkaffcompelother", "sawmkaffcompeltraveller", "sawmkaffdelay", "sawmkaffnoadd", "sawmkaffqadaorder", "khqa803"],
    relatedTopicIds: ["sawmonlyqada", "sawmqada"],
    glossaryIds: ["kaffarah", "qada", "mudd", "faqir", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmonlyqada",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "When only qaḍāʾ is due", ur: "وہ صورتیں جن میں روزے کی صرف قضا واجب ہے" },
    summary: explain(
      "Cases in which a fast must be made up but no kaffārah is due, including mistakes about dawn or maghrib and gargling."
    ),
    rulingIds: ["sawmonlyqadalist", "sawmonlyqadaforgot", "khqa769", "sawmonlyqadaallowed", "sawmgargle", "sawmgargleunintended", "sawmswallowother", "sawmgarglemuch"],
    relatedTopicIds: ["sawmkaffarah", "sawmqada"],
    glossaryIds: ["qada", "kaffarah", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmqada",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Making up missed fasts (qaḍāʾ) and the fidyah", ur: "قضا روزے کے احکام" },
    arabicTerm: "قضاء الصوم",
    summary: explain(
      "Who must make up missed fasts and who need not, when they must be made up, breaking a qaḍāʾ fast, and what the kaffārah of delay and the fidyah are, including a deceased parent's fasts."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 185 }],
    rulingIds: ["sawmqadainsane", "sawmqadakafir", "sawmqadaunconscious", "sawmqadadrunk", "sawmqadadrunkpart", "sawmqadadrunkany", "sawmqadahayd", "sawmqadadeath", "sawmqadacount", "sawmqadaorder", "sawmqadaintention", "sawmqadabreak", "sawmqadabreakafter", "sawmqadadead", "sawmqadaable", "sawmqadaillness", "sawmqadaanother", "sawmqadatravel", "sawmqadaweak", "sawmqadadelayed", "sawmqadashortage", "sawmqadaillnessyears", "sawmqadamudd", "sawmqadadelayyears", "khqa799", "sawmqadadelayamount", "sawmqadadelayignorance", "khqa809", "sawmqadaintentionalmiss", "sawmqadaintentionalrepeat", "sawmqadaparents", "sawmqadaparentspurpose", "sawmqadaparentsother"],
    relatedTopicIds: ["sawmexempt", "sawmkaffarah"],
    glossaryIds: ["qada", "fidyah", "kaffarah", "mudd", "faqir", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmtravel",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Fasting and travel", ur: "مسافر کے روزے کے احکام" },
    arabicTerm: "صوم المسافر",
    summary: explain(
      "Whether a traveller fasts, setting out or arriving during the day, vowed and recommended fasts on a journey, a journey of sin, and a traveller who did not know the ruling."
    ),
    quranicBasis: [{ surahNumber: 2, ayahNumber: 185 }],
    rulingIds: ["sawmtravelnofast", "sawmtravelcannot", "sawmtravelallowed", "sawmtravelassigned", "sawmtravelvow", "sawmtravelrecommended", "sawmtravelmedina", "sawmtravelplaces", "sawmtravelsin", "sawmtravelsinchange", "sawmtravelsinafternoon", "sawmtravelunaware", "sawmtravelunawareterms", "sawmtravelunawareshari", "sawmtravelforgot", "sawmtraveldepart", "sawmtravelbreak", "khqa794", "sawmtravelarrive", "sawmtravelarriveafter", "sawmtravelfull"],
    relatedTopicIds: ["travellerprayer", "sawmqada"],
    glossaryIds: ["qasr", "tamam", "watan", "hadd", "nadhr", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmmonth",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Establishing the first of the month", ur: "پہلی تاریخ ثابت ہونے کے طریقے" },
    arabicTerm: "ثبوت الهلال",
    summary: explain(
      "How the first of a lunar month is established, such as by sighting the crescent, testimony, the passing of thirty days or a jurist's ruling, and what to do when it is doubtful whether it is Ramadan or Shawwāl."
    ),
    rulingIds: ["sawmmonthways", "khqa844", "sawmmonthevening", "sawmmonthequipment", "khqa831", "sawmmoonshape", "khqa841", "sawmmonthastronomers", "sawmmonthhakim", "khqa839", "sawmmonthhakimcountry", "khqa840", "sawmmonthhorizon", "khqa834", "khqa836", "sawmmonthgovernment", "sawmmonthmedia", "khqa832", "sawmmonthnotestablished", "khqa833", "sawmmonthshawwaldoubt", "sawmmonthshawwal", "sawmmonthprisoner"],
    relatedTopicIds: ["sawmtimes", "sawmtypes"],
    glossaryIds: ["sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "sawmtypes",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Obligatory, forbidden, disapproved and recommended fasts", ur: "روزے کی قسمیں" },
    summary: explain(
      "The kinds of fast and which days or situations fall under each, a recommended fast while owing qaḍāʾ, and the rights of a husband or parents over a recommended fast."
    ),
    rulingIds: ["sawmkinds", "sawmobligatory", "sawmharam", "sawmharamother", "sawmharamwife", "sawmharamchild", "sawmharamchildday", "sawmdisapproved", "sawmrecommended", "sawmrecommendedbreak", "sawmrecommendedqada", "sawmrecommendedqadaunaware", "sawmrecommendedqadaunsure", "sawmrecommendedqadaforgot"],
    relatedTopicIds: ["sawmniyyah", "sawmqada"],
    glossaryIds: ["sawm", "wajib", "haram", "makruh", "mustahab", "qada"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "zakatfitrah",
    fiqh: "jafari",
    categoryId: "sawm",
    title: { en: "Zakāt al-fiṭrah", ur: "زکوٰۃ فطرہ" },
    arabicTerm: "زكاة الفطرة",
    summary: explain(
      "Zakāt al-fiṭrah, given at the end of Ramadan: who must give it, for whom, to whom, in what, and when. Only Sistani's rulings are included for now: Khamenei's official books do not state them, so his followers are pointed to his office."
    ),
    rulingIds: ["fitrahwho", "fitrahpoor", "fitrahdependants", "fitrahdependanttown", "fitrahguestbefore", "fitrahguestafter", "fitrahinsane", "fitrahbeforesunset", "fitrahaftersunset", "fitrahconvert", "fitrahonesaa", "fitrahbirth", "fitrahmove", "fitrahother", "fitrahowngive", "fitrahsayyid", "fitrahbreastfed", "fitrahunlawful", "fitrahhired", "fitrahdeath", "fitrahrecipients", "fitrahchild", "fitrahnotdutiful", "fitrahsin", "fitrahless", "fitrahhalf", "fitrahmixed", "fitrahrelatives", "fitrahnotpoor", "fitrahclaim", "fitrahintention", "fitrahearly", "fitrahsoil", "fitrahdefective", "fitrahitems", "fitrahprayer", "fitrahsetaside", "fitrahlate", "fitrahuse", "fitrahworth", "fitrahperish", "fitrahtransfer"],
    relatedTopicIds: ["sawmtypes"],
    glossaryIds: ["zakatfitrah", "saa", "faqir", "sawm"],
    lastSourceCheck: "2026-10-08",
  },
  {
    id: "khumsitems",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "What khums is due on" },
    arabicTerm: "الخمس",
    summary: explain(
      "The things khums is due on, surplus income from earnings, property acquired without earning it, a minor's profit, and who pays when living expenses are paid by someone else."
    ),
    rulingIds: ["sk1768", "sk1769", "sk1770", "sk1774", "sk1775", "sk1776", "sk1810", "ks1", "ks2", "ks3", "ks4", "ks5", "ks6", "kq241", "kq242", "kq243"],
    relatedTopicIds: ["khumsmaunah", "khumsexempt", "khumsyear"],
    glossaryIds: ["khums", "mashhur"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsunpaid",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Property on which khums has not been paid" },
    summary: explain(
      "Buying, receiving or using property on which khums has not been paid, doubting whether it was paid, and khums that has been unpaid for years."
    ),
    rulingIds: ["sk1777", "sk1778", "sk1779", "sk1780", "sk1781", "sk1811", "sk1812", "sk1813", "sk1814", "kq252", "kq253", "kq254", "kq293", "kq294", "kq295"],
    relatedTopicIds: ["khumsyear", "khumsmisc"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumscapital",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Capital, trade and business property" },
    summary: explain(
      "Working and fixed capital, trade goods, tools, land, shares, deposits and loans, and what happens to their value during the khums year."
    ),
    rulingIds: ["sk1785", "sk1786", "sk1787", "sk1788", "sk1789", "sk1790", "sk1791", "ks7", "ks8", "ks9", "ks10", "ks11", "ks12", "ks13", "ks14", "ks15", "ks16", "ks17", "ks18", "ks19", "ks20", "ks21", "ks22", "ks23", "kq1", "kq2", "kq3", "kq4", "kq5", "kq6", "kq7", "kq8", "kq9", "kq10", "kq11", "kq12", "kq13", "kq14", "kq15", "kq16", "kq17", "kq18", "kq19", "kq20", "kq21", "kq22", "kq23", "kq24", "kq25", "kq27", "kq28", "kq29", "kq30", "kq31", "kq32", "kq33", "kq34", "kq35", "kq36", "kq37", "kq38", "kq39", "kq40", "kq41", "kq42", "kq43", "kq44", "kq45", "kq46", "kq47", "kq48", "kq49", "kq50", "kq51", "kq52", "kq53", "kq54", "kq55", "kq58", "kq59", "kq60", "kq61", "kq62", "kq63", "kq64", "kq65", "kq66", "kq67", "kq68", "kq69", "kq71", "kq73", "kq74", "kq75", "kq76", "kq77", "kq78"],
    relatedTopicIds: ["khumsmaunah", "khumsexpenses", "khumsyear"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsmaunah",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Living expenses (maʾūnah)" },
    arabicTerm: "المؤونة",
    summary: explain(
      "What counts as the year's living expenses, such as the home, furniture, clothing, gifts, a daughter's trousseau, and what is left over at the year's end."
    ),
    rulingIds: ["sk1773", "sk1792", "sk1793", "sk1794", "sk1795", "sk1796", "sk1797", "sk1798", "sk1799", "ks33", "ks34", "ks35", "ks36", "ks37", "ks38", "ks39", "ks40", "ks41", "ks42", "ks43", "ks44", "ks45", "ks46", "ks47", "kq84", "kq85", "kq86", "kq87", "kq88", "kq89", "kq90", "kq91", "kq92", "kq93", "kq94", "kq95", "kq96", "kq97", "kq98", "kq99", "kq100", "kq101", "kq102", "kq103", "kq104", "kq105", "kq106", "kq108", "kq109", "kq111", "kq112", "kq113", "kq114", "kq116", "kq117", "kq118", "kq119", "kq120", "kq121", "kq122", "kq123", "kq124", "kq125", "kq126", "kq127", "kq128", "kq129", "kq130", "kq131", "kq132", "kq133", "kq134", "kq135", "kq136", "kq137", "kq138", "kq139", "kq140", "kq141", "kq142", "kq143", "kq144"],
    relatedTopicIds: ["khumsexpenses", "khumscapital", "khumsexempt"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsexpenses",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Expenses of earning, debts and savings" },
    summary: explain(
      "Expenses of earning an income, taxes, borrowing and repaying, losses, and how balances in an account are treated."
    ),
    rulingIds: ["sk1800", "sk1801", "sk1802", "sk1803", "sk1804", "ks48", "ks50", "ks51", "ks52", "ks53", "ks54", "ks55", "ks56", "ks57", "ks58", "ks59", "ks60", "ks61", "ks62", "ks63", "ks64", "kq145", "kq146", "kq147", "kq148", "kq149", "kq150", "kq151", "kq152", "kq153", "kq154", "kq155", "kq156", "kq157", "kq158", "kq159", "kq160", "kq161", "kq162", "kq163", "kq165", "kq166", "kq167", "kq168", "kq169", "kq170", "kq171", "kq172", "kq173", "kq174", "kq175", "kq176", "kq177", "kq178", "kq179", "kq180", "kq181", "kq182", "kq183", "kq184"],
    relatedTopicIds: ["khumsmaunah", "khumscapital", "khumsyear"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsexempt",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Property and income not subject to khums" },
    summary: explain(
      "Dowry, inherited property, maintenance, blood money, endowments, pensions, bonuses and insurance payments, and what each marja' says about them."
    ),
    rulingIds: ["sk1771", "sk1772", "ks65", "ks67", "kq185", "kq186", "kq187", "kq188", "kq189", "kq190", "kq191", "kq192", "kq193", "kq194", "kq195", "kq196", "kq197", "kq198", "kq199", "kq200", "kq201", "kq202", "kq203", "kq204", "kq207", "kq208", "kq209", "kq210", "kq211", "kq212", "kq213", "kq214", "kq215", "kq216", "kq217", "kq218", "kq219", "kq220", "kq221", "kq222", "kq223"],
    relatedTopicIds: ["khumsitems", "khumsmaunah"],
    glossaryIds: ["khums", "mashhur"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsyear",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "The khums year, calculation and payment" },
    summary: explain(
      "Setting the khums year, when to calculate and pay, paying early or late, in instalments, and paying with another's permission."
    ),
    rulingIds: ["sk1782", "sk1783", "sk1784", "sk1805", "sk1806", "sk1807", "sk1808", "sk1809", "ks68", "ks69", "ks70", "ks71", "ks72", "ks73", "ks74", "kq224", "kq225", "kq226", "kq228", "kq229", "kq230", "kq231", "kq232", "kq233", "kq234", "kq235", "kq236", "kq237", "kq239", "kq244", "kq245", "kq246", "kq247", "kq248", "kq249", "kq250", "kq251", "kq257", "kq258", "kq259", "kq260", "kq261", "kq262", "kq263", "kq264", "kq265", "kq266", "kq267", "kq268", "kq269", "kq270", "kq271"],
    relatedTopicIds: ["khumsunpaid", "khumscapital", "khumsdistribution"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsmined",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Mined products" },
    summary: explain(
      "Gold, silver, oil, salt and other mined products: when khums is due and the niṣāb, as the text states it."
    ),
    rulingIds: ["sk1815", "sk1816", "sk1817", "sk1818", "sk1819", "sk1820", "sk1821", "sk1822", "ks24", "ks25", "ks26", "ks27", "kq83"],
    relatedTopicIds: ["khumstreasure", "khumsgems"],
    glossaryIds: ["khums", "nisab"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumstreasure",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Treasure troves" },
    summary: explain(
      "What a treasure trove is, where and by whom it may be found, and the niṣāb, as the text states it."
    ),
    rulingIds: ["sk1823", "sk1824", "sk1825", "sk1826", "sk1827", "sk1828", "sk1829", "ks28", "ks29"],
    relatedTopicIds: ["khumsmined", "khumsgems"],
    glossaryIds: ["khums", "nisab"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsmixed",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Lawful property mixed with unlawful" },
    summary: explain(
      "What to do when ḥarām property has become mixed with ḥalāl property, according to what is known about the quantity and the owner."
    ),
    rulingIds: ["sk1830", "sk1831", "sk1832", "sk1833", "sk1834", "sk1835", "kq81", "kq82"],
    relatedTopicIds: ["khumsunpaid"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsgems",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Gems from the sea" },
    summary: explain(
      "Pearls, corals and other gems brought out by diving, and the amount from which khums is due, as the text states it."
    ),
    rulingIds: ["sk1836", "sk1837", "sk1838", "sk1839", "sk1840", "sk1841", "sk1842", "sk1843", "sk1844", "ks30", "ks31", "ks32"],
    relatedTopicIds: ["khumsmined", "khumstreasure"],
    glossaryIds: ["khums", "nukhud"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsspoils",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Spoils of war and other property" },
    summary: explain(
      "Spoils of war, property of a ḥarbī disbeliever or a nāṣibī, and land a dhimmī buys from a Muslim."
    ),
    quranicBasis: [{ surahNumber: 8, ayahNumber: 41 }],
    rulingIds: ["sk1845", "sk1846", "sk1847", "sk1848", "sk1849", "sk1850"],
    relatedTopicIds: ["khumsmixed"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsdistribution",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "How khums is divided and to whom it may be given" },
    summary: explain(
      "The share of the sayyids and the share of the Imam (ʿA), who may receive khums, how much, and the role of the marja'. Where and how to pay is not given by this app: it only points to your marja's official website."
    ),
    rulingIds: ["sk1851", "sk1852", "sk1853", "sk1854", "sk1855", "sk1856", "sk1857", "sk1858", "sk1859", "sk1860", "sk1861", "sk1862", "sk1863", "sk1864", "sk1865", "sk1866", "ks75", "ks76", "ks77", "ks78", "kq272", "kq273", "kq274", "kq275", "kq276", "kq277", "kq278", "kq279", "kq280", "kq281", "kq282", "kq283", "kq284", "kq285", "kq286", "kq287", "kq288"],
    payLink: true,
    relatedTopicIds: ["khumsyear", "khumsmisc"],
    glossaryIds: ["khums", "sahmsadat", "sahmimam", "sayyid"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "khumsmisc",
    fiqh: "jafari",
    categoryId: "khums",
    title: { en: "Heirs, partners and other issues" },
    summary: explain(
      "Khums owed by someone who has died, dealing with those who do not pay khums, partners, forgiving khums, and paying on another's behalf."
    ),
    rulingIds: ["ks79", "ks80", "kq289", "kq290", "kq291", "kq292", "kq297", "kq298", "kq299", "kq300", "kq301", "kq302", "kq303", "kq304", "kq305", "kq306", "kq307", "kq308", "kq309", "kq310", "kq311", "kq312", "kq313", "kq314"],
    relatedTopicIds: ["khumsunpaid", "khumsdistribution"],
    glossaryIds: ["khums"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatconditions",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "What zakat is due on and its conditions", ur: "زکوٰۃ واجب ہونے کی شرائط" },
    arabicTerm: "الزكاة",
    summary: explain(
      "The ten things zakat is due on, the taxable limit (niṣāb), and the conditions that must hold: ownership, sanity and bulūgh, and the time of ownership."
    ),
    rulingIds: ["zk1871", "zk1872", "zk1873", "zk1874", "zk1875", "zk1876", "zk1877", "zk1878", "zk1879"],
    relatedTopicIds: ["zakatcrops", "zakatgoldsilver", "zakatlivestock"],
    glossaryIds: ["zakat", "nisab"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatcrops",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Wheat, barley, dates and raisins" },
    summary: explain(
      "The niṣāb of wheat, barley, dates and raisins, the rate by the kind of irrigation, expenses, and when and how the zakat is given."
    ),
    rulingIds: ["zk1880", "zk1881", "zk1882", "zk1883", "zk1884", "zk1885", "zk1886", "zk1887", "zk1888", "zk1889", "zk1890", "zk1891", "zk1892", "zk1893", "zk1894", "zk1895", "zk1896", "zk1897", "zk1898", "zk1899", "zk1900", "zk1901", "zk1902", "zk1903", "zk1904", "zk1905", "zk1906", "zk1907", "zk1908", "zk1909", "zk1910", "zk1911"],
    relatedTopicIds: ["zakatconditions", "zakatgiving"],
    glossaryIds: ["zakat", "nisab", "saa"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatgoldsilver",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Gold and silver", ur: "سونے کا نصاب" },
    summary: explain(
      "The niṣābs of gold and of silver, minted coins and ornaments, and the eleven months of ownership. The text's own amounts are shown; the app converts nothing."
    ),
    rulingIds: ["zk1912", "zk1913", "zk1914", "zk1915", "zk1916", "zk1917", "zk1918", "zk1919", "zk1920", "zk1921", "zk1922"],
    relatedTopicIds: ["zakatconditions", "zakatbusiness"],
    glossaryIds: ["zakat", "nisab", "nukhud"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatlivestock",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Camels, cows and sheep" },
    summary: explain(
      "The niṣābs of camels, cows and sheep and the zakat on each, grazing for the year, and the animal that is given."
    ),
    rulingIds: ["zk1923", "zk1924", "zk1925", "zk1926", "zk1927", "zk1928", "zk1929", "zk1930", "zk1931", "zk1932", "zk1933", "zk1934", "zk1935", "zk1936", "zk1937", "zk1938", "zk1939"],
    relatedTopicIds: ["zakatconditions", "zakatgiving"],
    glossaryIds: ["zakat", "nisab"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatbusiness",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Business goods" },
    summary: explain(
      "Zakat on goods kept for business and profit, the conditions, and the rate, as the text states them."
    ),
    rulingIds: ["zkbusiness"],
    relatedTopicIds: ["zakatgoldsilver"],
    glossaryIds: ["zakat", "nisab"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatrecipients",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Who may receive zakat" },
    summary: explain(
      "The eight ways zakat can be spent: the poor, the needy, debtors, the stranded traveller and others, and who may not receive it. Where and how to pay is not given by this app: it only points to your marja's official website."
    ),
    quranicBasis: [{ surahNumber: 9, ayahNumber: 60 }],
    rulingIds: ["zk1940", "zk1941", "zk1942", "zk1943", "zk1944", "zk1945", "zk1946", "zk1947", "zk1948", "zk1949", "zk1950", "zk1951", "zk1952", "zk1953", "zk1954", "zk1955", "zk1956", "zk1957", "zk1958", "zk1959", "zk1960", "zk1961", "zk1962", "zk1963", "zk1964", "zk1965", "zk1966", "zk1967", "zk1968", "zk1969", "zk1970"],
    payLink: true,
    relatedTopicIds: ["zakatgiving", "zakatfitrah"],
    glossaryIds: ["zakat", "faqir", "miskin", "sayyid"],
    lastSourceCheck: "2026-10-09",
  },
  {
    id: "zakatgiving",
    fiqh: "jafari",
    categoryId: "zakat",
    title: { en: "Giving zakat: intention, setting aside and transfer" },
    summary: explain(
      "The intention for giving zakat, setting it aside, when to give it, what happens if it perishes, taking it to another town, and the other debts of a person who dies."
    ),
    rulingIds: ["zk1971", "zk1972", "zk1973", "zk1974", "zk1975", "zk1976", "zk1977", "zk1978", "zk1979", "zk1980", "zk1981", "zk1982", "zk1983", "zk1984", "zk1985", "zk1986", "zk1987", "zk1988", "zk1989", "zk1990", "zk1991", "zk1992", "zk1993", "zk1994", "zk1995", "zk1996", "zk1997", "zk1998", "zk1999", "zk2000", "zk2001", "zk2002"],
    payLink: true,
    relatedTopicIds: ["zakatrecipients", "zakatfitrah"],
    glossaryIds: ["zakat", "niyyah"],
    lastSourceCheck: "2026-10-09",
  },
];
