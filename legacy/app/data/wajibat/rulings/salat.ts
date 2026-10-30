// Salat (§6.3, excluding doubts) rulings — Phase 3.
//
// GENERATED from the official texts, do not hand-edit the quoted strings:
// every `text`/`instruction` was looked up verbatim (by script) on the marja's
// official website as downloaded on 2026-09-25 / 2026-10-02 —
//   Sistani:  sistani.org Islamic Laws 4th ed. (English) / توضیح المسائل (Urdu)
//   Khamenei: leader.ir "The Rules on Prayer & Fasting 2023" (book 241), first priority
//             for salat (decision R6). It has no official Urdu edition, so Khamenei's
//             salat entries are English only (decision R1).
// Revised (*) Sistani rulings were compared with the Urdu one by one (decision P6).
// `basis` comes from the ruling's own opening words — never inferred beyond them (R3).
import type { Ruling } from "../types";

export const SALAT_RULINGS: Ruling[] = [
  {
    id: "obligatoryprayers",
    topicId: "dailyprayers",
    subject: {
      en: "The obligatory prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are six obligatory prayers in the period of the Imam of the Time’s (ʿA) occultation (ghaybah):\n1. the daily prayers;\n2. the prayer of signs (ṣalāt al‑āyāt);\n3. the funeral prayer (ṣalāt al‑mayyit);\n4. the prayer for the obligatory circumambulation (ṭawāf) of the Kaʿbah;\n5. the lapsed (qaḍāʾ) prayers of one’s father that, based on obligatory precaution (al‑iḥtiyāṭ al‑wājib), are obligatory for the eldest son to perform;\n6. prayers that become obligatory on account of hire (ijārah), vow (nadhr), oath (qasam), and covenant (ʿahd).\nThe Friday prayer (ṣalāt al‑jumuʿah) is regarded as one of the daily prayers."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "The Obligatory (Wājib) Prayers — section introduction",
          url: "https://www.sistani.org/english/book/48/2207/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Obligatory prayers are as follows:\n1. Daily prayers;\n2. Prayer of ṭawāf which is said after obligatory tawāf around Ka‘bah;\n3. Āyāt prayer which is performed due to natural phenomena such as a lunar/solar eclipse, earthquake, etc.\n4. Mayyit prayer which is performed on the corpse of a deceased Muslim\n5. Qaḍā’ prayers of one's father and, by obligatory caution, of the mother as well; to be performed by the eldest son.\n6. The prayer which becomes obligatory due to nadhr (reciprocal vow), ‘ahd (covenant), qasam (oath), or through being hired to preform it."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "1.",
          url: "https://www.leader.ir/en/book/241?sn=32480"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 1",
          url: "https://www.leader.ir/fa/book/180/1?sn=30757"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "dailyrakat",
    topicId: "dailyprayers",
    subject: {
      en: "The five daily prayers and their rakʿahs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are five obligatory daily prayers: (1) midday (ẓuhr) and (2) afternoon (ʿaṣr) prayers – each of these consists of four units (rakʿahs); (3) after sunset (maghrib), which is three rakʿahs; (4) evening (ʿishāʾ), which is four rakʿahs; and (5) morning (ṣubḥ), which is two rakʿahs."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "The Obligatory Daily Prayers — section introduction",
          url: "https://www.sistani.org/english/book/48/2208/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The daily prayers consist of 17 rak‘ah which are made up of the following:\n1. Fajr prayer (two rak‘ah)\n2. Ẓuhr prayer (four rak‘ah)\n3. ‘Aṣr prayer (four rak‘ah)\n4. Maghrib prayer (three rak‘ah)\n5. ‘ishā’ prayer (four rak‘ah)",
          ur: "یومیہ واجب نمازیں 17 رکعت ہیں جوکہ درج ذیل ہیں؛\nنماز صبح (دو رکعت)\nنماز ظہر (چار رکعت)\nنماز عصر (چار رکعت)\nنماز مغرب (تین رکعت)\nنماز عشاء (چار رکعت)"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "3.",
          url: "https://www.leader.ir/en/book/241?sn=32481"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 3",
          url: "https://www.leader.ir/ur/book/197/1?sn=31067"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 3",
          url: "https://www.leader.ir/fa/book/180/1?sn=30758"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "importanceofprayer",
    topicId: "dailyprayers",
    subject: {
      en: "The place of the daily prayers in the religion"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Daily prayers are among the most important obligations in Islamic Law. Furthermore, they are pillars of the religion and should never be neglected.",
          ur: "یومیہ نمازیں شریعت اسلام کے انتہائی اہم واجبات میں سے بلکہ دین کا ستون ہیں اور ا نہیں کسی بھی حالت میں ترک نہیں کرنا چاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "2.",
          url: "https://www.leader.ir/en/book/241?sn=32481"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 2",
          url: "https://www.leader.ir/ur/book/197/1?sn=31067"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 2",
          url: "https://www.leader.ir/fa/book/180/1?sn=30758"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "zuhrasrtime",
    topicId: "prayertimes",
    subject: {
      en: "The time for ẓuhr and ʿaṣr"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The time for ẓuhr and ʿaṣr prayers is from zawāl [i.e. the time after midday when the sun begins to decline] (known as the ‘legal midday’ (al‑ẓuhr al‑sharʿī)) until sunset (ghurūb). However, in the event that one intentionally (ʿamdan) performs the ʿaṣr prayer before the ẓuhr prayer, his prayer is invalid (bāṭil), except if this happens at the end of the prescribed time and there is scope for performing only one prayer, in which case if someone has not performed the ẓuhr prayer by then, his ẓuhr prayer is deemed to have become qaḍāʾ and he must perform the ʿaṣr prayer. If before this time someone mistakenly performs the whole of the ʿaṣr prayer before the ẓuhr prayer, his prayer is valid (ṣaḥīḥ), and he must then perform the ẓuhr prayer. And the recommended precaution (al‑iḥtiyāṭ al‑mustaḥabb) is that he should perform the second set of four rakʿahs with the intention (niyyah) to fulfil whatever his legal obligation happens to be (mā fī al‑dhimmah)."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 717",
          url: "https://www.sistani.org/english/book/48/2209/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Both ẓuhr and ‘aṣr prayers have special and common times. A few minutes — enough to say it — after shar‘ī noon is special for ẓuhr prayer. A few minutes — enough to perform it — before sunset is special to ‘aṣr prayer. The gap between these two special times is common time for both.",
          ur: "نماز ظہر اور عصر میں سے ہر ایک کے لئے مخصوص اور مشترک وقت ہے۔ نماز ظہر کا مخصوص وقت ابتدائے ظہر سے لے کر اتنا وقت گزرنے تک ہے کہ جس میں نماز ظہر پڑھ سکیں اور نماز عصر کا مخصوص وقت غروب آفتاب سے پہلے اتنا وقت ہے کہ جس میں فقط نماز عصر پڑھ سکیں۔ ان دونوں کا درمیانی وقت نماز ظہر و عصر کا مشترک وقت ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "8.",
          url: "https://www.leader.ir/en/book/241?sn=32483"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 8",
          url: "https://www.leader.ir/ur/book/197/1?sn=31069"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 8",
          url: "https://www.leader.ir/fa/book/180/1?sn=30760"
        },
        verification: "A",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "maghribishatime",
    topicId: "prayertimes",
    subject: {
      en: "The time for maghrib and ʿishāʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "For a person under normal circumstances, the time for the maghrib prayer is until midnight, but for a helpless person – who due to forgetfulness, oversleeping, menstruation (ḥayḍ), or suchlike did not perform prayers before midnight – the time for maghrib and ʿishāʾ prayers is extended until dawn. However, in both cases, the proper order between the two prayers must be observed, meaning that if the ʿishāʾ prayer is knowingly performed before the maghrib prayer, it is invalid unless the time remaining is sufficient for performing only the ʿishāʾ prayer, in which case it is necessary that one perform the ʿishāʾ prayer before the maghrib prayer.",
          ur: "مغرب اورعشاکی نماز کاوقت مختار شخص کے لئے آدھی رات تک برقرار رہتا ہے لیکن جن لوگوں کوکوئی عذرہو(مثلاً بھول جانے کی وجہ سے یانیند یاحیض یاان جیسے دوسرے امورکی وجہ سے آدھی رات سے پہلے نماز نہ پڑھ سکتے ہوں ) توان کے لئے مغرب اورعشاکی نماز کاوقت فجرطلوع ہونے تک باقی رہتاہے۔ لیکن ان دونوں نمازوں کے درمیان متوجہ ہونے کی صورت میں ترتیب معتبرہے یعنی عشاکی نماز کو جان بوجھ کرمغرب کی نماز سے پہلے پڑھے توباطل ہے۔ لیکن اگرعشاکی نمازاداکرنے کی مقدارسے زیادہ وقت باقی نہ رہاہوتواس صورت میں لازم ہے کہ عشاکی نماز کومغرب کی نماز سے پہلے پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 723",
          url: "https://www.sistani.org/english/book/48/2212/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (723)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Both maghrib and ‘ishā’ prayers have special and common times. A few minutes — enough to perform it — after maghrib is special for maghrib prayer. A few minutes — enough to perform it — before shar‘ī midnight is special to ‘ishā’ prayer. The gap between these two special times is common time for both.",
          ur: "نماز مغرب و عشاء کےلئے مخصوص اور مشترک وقت ہے۔ نماز مغرب کا مخصوص وقت مغرب کی ابتدا سے اس وقت تک ہے جس میں تین رکعت نماز پڑھ سکیں۔ نماز عشاء کا مخصوص وقت آدھی رات ہونے سے پہلے اتنا وقت ہو جس میں فقط نماز عشاء پڑھ سکیں۔ ان دونوں کا درمیانی وقت دونوں نمازوں کا مشترکہ وقت ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "13.",
          url: "https://www.leader.ir/en/book/241?sn=32484"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 13",
          url: "https://www.leader.ir/ur/book/197/1?sn=31070"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 13",
          url: "https://www.leader.ir/fa/book/180/1?sn=30761"
        },
        verification: "A",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "fajrtime",
    topicId: "prayertimes",
    subject: {
      en: "The time for the ṣubḥ (fajr) prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Near the time of the morning call to prayer, a whiteness in the sky moves upwards from the east; this is known as ‘the first dawn’. When this whiteness spreads, it is called ‘the second dawn’, which is the start of the prescribed time for the morning prayer. The end of the time for the morning prayer is when the sun rises.",
          ur: "صبح کی اذان کے قریب مشرق کی طرف سے ایک سفیدی اوپراٹھتی ہے، جسے فجراول کہاجاتاہے۔ جب یہ سفیدی پھیل جائے تووہ فجردوم اورصبح کی نماز کا اول وقت ہے اور صبح کی نماز کاآخری وقت سورج نکلنے تک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 728",
          url: "https://www.sistani.org/english/book/48/2213/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (728)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The time for fajr prayer begins from the true dawn (al-fajr al-ṣādiq) and continues until sunrise.",
          ur: "نماز صبح کا وقت طلوع فجر (صبح صادق) سے طلوع آفتاب تک ہے۔\n* صبح صادق صبح کاذب کے مقابلے میں ہے۔ صبح کاذب اس سفیدی کو کہتے ہیں جو صبح صادق سے پہلے آسمان میں نمودار ہوتی ہے اور افق پر پھیلنے کے بجائے عمودی شکل میں اوپر کی طرف اٹھتی ہے۔ صبح صادق اس وقت ہوتی ہے جب سفیدی افق کی سطح کے ساتھ متصل اور کم روشنی کے ساتھ افق پر پھیل جائےاور وقت گزرنے کے ساتھ اس کی روشنی میں اضافہ ہوجائے۔ چونکہ صبح صادق باریک ہوتی ہے لہذا اس کو مشاہدہ کرنے کے لئے مشرق کا افق پوری طرح کھلا اور مکمل تاریک ہونا چاہئے جو شہروں کے اندر نہایت مشکل ہے۔ چونکہ طلوع فجر کو واضح اور دقیق تشخیص دینا سخت ہے لہذا احتیاط کی رعایت کرتے ہوئے اذان شروع ہونے کے دس منٹ بعد صبح کی نماز ادا کی جائے۔"
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "4.",
          url: "https://www.leader.ir/en/book/241?sn=32482"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 4",
          url: "https://www.leader.ir/ur/book/197/1?sn=31068"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 4",
          url: "https://www.leader.ir/fa/book/180/1?sn=30759"
        },
        verification: "A",
        note: "The English edition's footnote differs from the Persian original and the official Urdu edition, so it is not shown here; the Urdu text carries the footnote."
      }
    ]
  },
  {
    id: "missedbymidnight",
    topicId: "prayertimes",
    subject: {
      en: "Maghrib and ʿishāʾ not prayed by midnight"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone wilfully does not perform maghrib or ʿishāʾ prayers by midnight, he must, based on obligatory precaution, perform them before the time of the morning call to prayer (adhān) without making the intention of performing them in their prescribed time (adāʾ) belatedly or (qaḍāʾ).",
          ur: "اگرکوئی شخص اختیاری حالت میں مغرب اورعشاکی نمازآدھی رات تک نہ پڑھے تو(احتیاط واجب کی بناپر)ضروری ہے کہ اذان صبح سے پہلے قضااوراداکی نیت کئے بغیران نمازوں کوپڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 727",
          url: "https://www.sistani.org/english/book/48/2212/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (727)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person does not offer the maghrib or ‘ishā’ prayers until 'midnight' due to a sin or an excuse, according to the obligatory caution, he should offer them before the morning adhān, without the intention of performing it as qaḍā’ or adā’ (rather with the intention of doing one's actual duty).\n[1] Translator’s note: The time gap between sunset and when the redness that appears in the east after sunset disappears varies with the change of the seasons of the year.",
          ur: "اگر کوئی شخص کسی عذر کی وجہ سے یا معصیت کرتے ہوئے مغرب اور عشاء کی نماز کو آدھی رات تک نہ پڑھے تو احتیاط واجب کی بنا پر اذان صبح تک ادا یا قضا کی نیت کے بغیر (مافی الذمہ کی نیت سے) بجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "15.",
          url: "https://www.leader.ir/en/book/241?sn=32484"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 15",
          url: "https://www.leader.ir/ur/book/197/1?sn=31070"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 15",
          url: "https://www.leader.ir/fa/book/180/1?sn=30761"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "certaintyoftime",
    topicId: "prayertimes",
    subject: {
      en: "Being certain that the time has set in"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One can start performing prayers when he attains certainty (yaqīn) that the time has set in or when two dutiful men inform him that the time has set in. In fact, one can conclude that the time for the morning prayer has set in if he hears the adhān said by someone whom he knows is extremely careful in observing the time of prayers, or if he is informed by such a person, provided that he derives confidence (iṭmiʾnān) from it."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 729",
          url: "https://www.sistani.org/english/book/48/5418/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person can start offering prayers only when he becomes certain that the time has set in, when two just persons inform him that the time has set in, or if a reliable and punctual reciter of the adhān recites the adhān.",
          ur: "نماز پڑھنے کے لئے مکلف کو چاہئے کہ وقت داخل ہونے پر یقین یا اطمینان حاصل کرے یا دو عادل مرد وقت داخل ہونے کی خبر دیں یا وقت شناس اور موثق موذن اذان دے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "18.",
          url: "https://www.leader.ir/en/book/241?sn=32485"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 18",
          url: "https://www.leader.ir/ur/book/197/1?sn=31071"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 18",
          url: "https://www.leader.ir/fa/book/180/1?sn=30762"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "onerakahintime",
    topicId: "prayertimes",
    subject: {
      en: "Time left for only one rakʿah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who has time to perform one rakʿah of the prayer must perform the prayer with the intention of adāʾ; however, he must not intentionally delay the prayer until this time.",
          ur: "جس شخص کے پاس نمازکی فقط ایک رکعت اداکرنے کاوقت ہو اسے چاہئے کہ نماز اداکی نیت سے پڑھے البتہ اسے جان بوجھ کرنماز میں اتنی تاخیر نہیں کرنی چاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 735",
          url: "https://www.sistani.org/english/book/48/5418/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (735)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who has time enough to perform only one rak‘ah should perform the prayer with the intention of adā’, but he should not postpone performing the prayer until such a time intentionally.",
          ur: "اگر فقط ایک رکعت نماز پڑھنے کا وقت ہو تو نماز کو ادا کی نیت سے پڑھے لیکن جان بوجھ کر نمازمیں اس وقت تک تاخیر نہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "24.",
          url: "https://www.leader.ir/en/book/241?sn=32485"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 24",
          url: "https://www.leader.ir/ur/book/197/1?sn=31071"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 24",
          url: "https://www.leader.ir/fa/book/180/1?sn=30762"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "prayingearly",
    topicId: "prayertimes",
    subject: {
      en: "Praying at the start of the time"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is recommended that one perform prayers at the start of their prescribed time; this is something that has been highly advised. The nearer to the start of the prescribed time, the better, unless delaying the prayer is better for some reason; for example, someone waits a little to perform the prayer in congregation, on condition that it does not pass the prime time (waqt al‑faḍīlah).",
          ur: "انسان کے لئے مستحب ہے کہ نمازاول وقت میں پڑھے اوراس کے متعلق بہت زیادہ تاکید کی گئی ہے اورجتنااول وقت کے قریب ہوبہترہے ماسوااس کے کہ اس میں تاخیرکسی وجہ سے بہترہومثلاً اس لئے تھوڑا انتظارکرے کہ نمازجماعت کے ساتھ پڑھے۔ اس شرط کے ساتھ کہ فضیلت کا وقت نہ گزرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 738",
          url: "https://www.sistani.org/english/book/48/5418/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (738)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is mustaḥabb that one offers prayers at the beginning of their times as Islamic instructions advise it with emphasis. If a person cannot offer a prayer at the beginning of its time, then the closest to this time you offer, the better unless it is better to delay it for a reason, such as when a person wants to perform the prayer in congregation.",
          ur: "مستحب ہے کہ انسان نماز کو اول وقت میں پڑھے۔ اس کے بارے میں اسلامی دستورات میں تاکید کے ساتھ سفارش کی گئی ہے اور اگر اول وقت میں نہ پڑھ سکے تو اول وقت سے جتنا نزدیک پڑھ سکے بہتر ہے مگر یہ کہ تاخیر سے پڑھنا کسی لحاظ سے بہتر ہو مثلا جماعت کے ساتھ نماز پڑھنا چاہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "16.",
          url: "https://www.leader.ir/en/book/241?sn=32485"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 16",
          url: "https://www.leader.ir/ur/book/197/1?sn=31071"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 16",
          url: "https://www.leader.ir/fa/book/180/1?sn=30762"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "orderzuhrasr",
    topicId: "prayertimes",
    subject: {
      en: "Ẓuhr before ʿaṣr, maghrib before ʿishāʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must perform the ʿaṣr prayer after the ẓuhr prayer, and the ʿishāʾ prayer after the maghrib prayer. If someone intentionally performs ʿaṣr before ẓuhr or ʿishāʾ before maghrib, the prayer is invalid.",
          ur: "ضروری ہے کہ انسان نماز عصر،نماز ظہرکے بعداورنماز عشا، نماز مغرب کے بعدپڑھے اوراگرجان بوجھ کرنماز عصرنماز ظہر سے پہلے اورنماز عشا نماز مغرب سے پہلے پڑھے تواس کی نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 742",
          url: "https://www.sistani.org/english/book/48/2214/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (742)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person has to perform ẓuhr prayer and then the ‘aṣr prayer. The same rule applies to maghrib and ‘ishā’ prayers. If a person intentionally performs ‘aṣr prayer before ẓuhr prayer, or performs ‘ishā’ prayer before maghrib prayer, his prayer is void.",
          ur: "نماز عصر کو نماز ظہر کے بعد اور نماز عشاء کو نماز مغرب کے بعد پڑھا جائے اور اگر جان بوجھ کر اس ترتیب کے برعکس پڑھی جائے تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "27.",
          url: "https://www.leader.ir/en/book/241?sn=32486"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 27",
          url: "https://www.leader.ir/ur/book/197/1?sn=31072"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 27",
          url: "https://www.leader.ir/fa/book/180/1?sn=30765"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qibladirection",
    topicId: "qibla",
    subject: {
      en: "Facing the qibla"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Qibla is the place of the Kaʿbah in Mecca, and prayers must be performed facing it. However, for someone who is far away, it is sufficient to stand in such a manner that it can be said he is performing prayers facing qibla. The same applies to other acts – such as slaughtering animals – that must be performed facing qibla.",
          ur: "خانۂ کعبہ جومکۂ مکرمہ میں ہے وہ ہماراقبلہ ہے لہٰذا(ہرمسلمان کے لئے) ضروری ہے کہ اس کے سامنے کھڑے ہوکرنمازپڑھے،لیکن جوشخص اس سے دورہو اگروہ اس طرح کھڑاہوکہ لوگ کہیں کہ قبلے کی طرف منہ کرکے نمازپڑھ رہاہے توکافی ہے اور دوسرے کام جوقبلے کی طرف منہ کرکے انجام دینے ضروری ہیں ۔(مثلاً حیوانات کو ذبح کرنا)ان کابھی یہی حکم ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 763",
          url: "https://www.sistani.org/english/book/48/2218/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (763)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Muslims should offer their prayers facing the Ka‘bah, and, thus, they call it qiblah. However, for those who are away from it, it is not possible to face it in the exact direction, so it is sufficient for them to perform it in a way that it is commonly regarded as facing the qiblah.",
          ur: "مکلف کو چاہئے کہ خانہ کعبہ کی طرف رخ کرکے نماز پڑھے اس اعتبار سے کعبہ کو قبلہ کہتے ہیں۔ البتہ جو افراد اس سے دور ہیں اوران کے لئے حقیقی طور پر روبرو ہونا ممکن نہیں ہے، اتنا ہی کافی ہے کہ کہا جائے کہ قبلے کی طرف منہ کرکے نماز پڑھ رہے ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "41.",
          url: "https://www.leader.ir/en/book/241?sn=32488"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 41",
          url: "https://www.leader.ir/ur/book/197/1?sn=31074"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 41",
          url: "https://www.leader.ir/fa/book/180/1?sn=30766"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qiblaeffort",
    topicId: "qibla",
    subject: {
      en: "Finding the direction of the qibla"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who wants to perform prayers must make efforts to find out the direction of qibla to the extent that he attains certainty about its direction, or that which comes under the rule (ḥukm) of certainty, such as the testimony of two dutiful people if their testimony is based on sensory perception and suchlike. If he cannot [find out its direction to this extent], he must act according to what he supposes to be the direction of qibla based on the position of the miḥrāb of a mosque, or the graves of believers, or by some other way. Even if he bases his supposition (ẓann) on the words of an immoral person or a disbeliever who knows the direction of qibla by employing scientific principles, it is sufficient.",
          ur: "جوشخص نمازپڑھناچاہے ضروری ہے کہ قبلے کی سمت کاتعین کرنے کے لئے کوشش کرے تاکہ قبلے کی سمت کے بارے میں یقین یاایسی کیفیت جویقین کے حکم میں ہو ۔(مثلاًدوعادل آدمیوں کی گواہی اگر محسوسات اور اس کے جیسی دوسری چیز سے مستند ہو)حاصل کرلے اوراگرایسانہ کرسکے تو ضروری ہے کہ مسلمانوں کی مسجدکے محراب سے یاان کی قبروں سے یادوسرے طریقوں سے جوگمان پیداہواس کے مطابق عمل کرے حتیٰ کہ اگرکسی ایسے فاسق یا کافر کے کہنے پر جو علمی قواعد کے ذریعے قبلے کا رخ پہچانتاہوقبلے کے بارے میں گمان پیداکرے تووہ بھی کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 769",
          url: "https://www.sistani.org/english/book/48/2218/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (769)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who wants to offer prayer has to become certain and confident about the direction of qiblah, whether through a reliable compass, through the sun* and stars (for those who know how to use them), or through other ways; and if he cannot acquire confidence, he should offer the prayer in whichever direction he considers more likely, like when you guess qiblah from a masjid's miḥrāb.",
          ur: "نمازپڑھنے والے کو قبلے کی سمت کے بارے میں یقین یا اطمینان ہونا چاہئے، خواہ صحیح اور معتبر قبلہ نما کے ذریعے یا سورج اور ستاروں کی روشنی(جبکہ ان سے استفادہ کرنے سے واقفیت رکھتا ہو) کے ذریعے ہو یا دیگر ذرائع سے ہو۔ اگر اطمینان پیدا نہ کرسکے تو جس طرف زیادہ گمان ہو اسی سمت نماز پڑھے جیسے کہ محراب مسجد سے حاصل ہونے والا گمان ۔\n* ۔ کہاجاتا ہے کہ شمسی کیلنڈر کے تیسرے مہینے کی سات تاریخ(۲۸ مئی) اور چوتھے مہینے کی پچییس تاریخ(۱۶ جولائی) کو مکہ کے افق پر ظہر کے وقت سورج عمودی حالت میں کعبہ کے اوپر چمکتا ہے چنانچہ سیدھی لکڑی کی مانند کوئی مقیاس یا شاخص ہموار زمین میں سیدھا گاڑ دیا جائے تو ظہر کے وقت مکہ کے افق پر شاخص کا سایہ جس سمت کی نشاندہی کرے، قبلہ اس کی مخالف سمت میں ہوگا یعنی قبلہ سائے کی سیدھ میں شاخص کے اسی سمت ہوگا جہاں سایہ نہیں ہے۔ چنانچہ یہ طریقہ قبلے کی سمت کے بارے میں اطمینان کا باعث بنے تو اس کے مطابق عمل کرنا جائز ہے۔"
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "44.",
          url: "https://www.leader.ir/en/book/241?sn=32488"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 44",
          url: "https://www.leader.ir/ur/book/197/1?sn=31074"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 44",
          url: "https://www.leader.ir/fa/book/180/1?sn=30766"
        },
        verification: "A",
        note: "The English edition's footnote differs from the Persian original and the official Urdu edition, so it is not shown here; the Urdu text carries the footnote."
      }
    ]
  },
  {
    id: "qiblanomeans",
    topicId: "qibla",
    subject: {
      en: "When the direction cannot be found"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone does not have any means to find the direction of qibla, or despite his efforts he cannot arrive at a supposition as to its direction, it is sufficient for him to perform prayers facing a direction that he thinks could be qibla. Furthermore, the recommended precaution is that if there is enough time, he should perform prayers four times, each time facing one of the four compass directions [i.e. what he supposes to be north, east, south, and west].",
          ur: "اگرکسی کے پاس قبلے کارخ متعین کرنے کاکوئی ذریعہ نہ ہو (مثلاً قطب نما) یاکوشش کے باوجود اس کاگمان کسی ایک طرف نہ جاتاہوتواس کاکسی بھی طرف منہ کرکے نماز پڑھناکافی ہے اور احتیاط مستحب یہ ہے کہ اگرنماز کاوقت وسیع ہوتوچار نمازیں چاروں طرف منہ کرکے پڑھے (یعنی وہی ایک نماز چار مرتبہ ایک ایک سمت کی جانب منہ کرکے پڑھے)۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 771",
          url: "https://www.sistani.org/english/book/48/2218/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (771)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who does not have any means to find out the direction of qiblah nor gives more probability to any direction should perform the prayer in four directions, by obligatory caution. But if there is not enough time to perform the prayer in four directions, he should perform the prayer in the maximum possible number of directions.",
          ur: "اگر قبلے کی سمت معلوم کرنے کے لئے کوئی راہ نہ ہو اور کسی سمت گمان بھی نہ ہو تو احتیاط واجب کی بناپر چاروں طرف رخ کرکے نماز پڑھے اور اگر چار نمازیں پڑھنے کا وقت نہ ہو تو جتنا وقت ہے اس کے مطابق نماز تکرار کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "45.",
          url: "https://www.leader.ir/en/book/241?sn=32488"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 45",
          url: "https://www.leader.ir/ur/book/197/1?sn=31074"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 45",
          url: "https://www.leader.ir/fa/book/180/1?sn=30766"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "qiblarecommended",
    topicId: "qibla",
    subject: {
      en: "Recommended prayers while walking or riding"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A recommended prayer can be performed while walking and riding, and if a person performs a recommended prayer in either of these ways, it is not necessary that he face qibla."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 768",
          url: "https://www.sistani.org/english/book/48/2218/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Mustaḥabb prayers can be offered while one is walking or riding, and in such conditions, it is not necessary to face qiblah.",
          ur: "مستحب نمازوں کو چلتے ہوئے یا سواری کی حالت میں پڑھ سکتے ہیں اور اس صورت میں قبلے کی رعایت لازمی نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "42.",
          url: "https://www.leader.ir/en/book/241?sn=32488"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 42",
          url: "https://www.leader.ir/ur/book/197/1?sn=31074"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 42",
          url: "https://www.leader.ir/fa/book/180/1?sn=30766"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "coveringmen",
    topicId: "clothing",
    subject: {
      en: "Covering in prayer: men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "While performing prayers, a man must cover his private parts even if no one sees him; and it is better that he cover his body from the navel to the knees."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 775",
          url: "https://www.sistani.org/english/book/48/2219/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A man should cover his private parts in the prayer, even if no one sees him, and it is better for him to cover from the navel down to the knees."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "50.",
          url: "https://www.leader.ir/en/book/241?sn=32489"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 50",
          url: "https://www.leader.ir/fa/book/180/1?sn=30767"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "coveringwomen",
    topicId: "clothing",
    subject: {
      en: "Covering in prayer: women"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "While performing prayers, a woman must cover her entire body, even her head and hair; and based on obligatory precaution, she must cover her body in a way that even she cannot see it. Therefore, if she wears a chador in a way that she can see her body, it is problematic [i.e. based on obligatory precaution, a woman must not wear a chador in such a way]. However, it is not necessary for a woman to cover her face, her hands below the wrists, or her feet below the ankles. To be certain that she has covered the obligatory areas, she must also cover a little of the sides of her face and a little of the area below her wrists and ankles.",
          ur: "ضروری ہے کہ عورت نماز کے وقت اپناتمام بدن حتیٰ کہ سراور بال بھی ڈھانپے اوراحتیاط واجب یہ ہےکہ اپنی نظروں سے بھی اپنے سر اور بال کو چھپائے لہٰذا اگر نماز کی چادر کو اس طرح سے پہنے کہ اپنے بدن کو دیکھ سکتی ہے تو( ایسی نماز میں ) اشکال ہے البتہ چہرے اورکلائیوں تک ہاتھ اورٹخنوں تک پاؤں کاڈھانپنا ضروری نہیں ہے لیکن یہ یقین کرنے کے لئے کہ اس نے بدن کی واجب مقدار ڈھانپ لی ہے ضروری ہے کہ چہرے کے اطراف کاکچھ حصہ اورکلائیوں سے نیچے کاکچھ حصہ بھی ڈھانپے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 776",
          url: "https://www.sistani.org/english/book/48/2219/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (776)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Women should cover the whole body and hair using a covering which covers them all. But it is not necessary to cover the part of face washed during wuḍū’, the hands up to the wrists, and the feet up to the ankles. Of course, in the presence of a non-maḥram person, she must cover her feet up to the ankles as well.",
          ur: "عورت نماز پڑھتے وقت پورے بدن اور بالوں کو چھپائے لیکن چہرے کا وہ حصہ جو وضو میں دھونا واجب ہے، ہاتھوں اور پاوں کو ٹخنے تک چھپانا لازمی نہیں ہے البتہ اگر کوئی نامحرم موجود ہوتو پاوں کو بھی ٹخنوں تک چھپائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "51.",
          url: "https://www.leader.ir/en/book/241?sn=32489"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 51",
          url: "https://www.leader.ir/ur/book/197/1?sn=31075"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 51",
          url: "https://www.leader.ir/fa/book/180/1?sn=30767"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "coveringintentional",
    topicId: "clothing",
    subject: {
      en: "Leaving the private parts uncovered"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "When performing prayers, if one intentionally does not cover his private parts, his prayers are invalid. If he does this on account of not knowing the ruling, then in the event that he was negligent in not learning the ruling, he must, based on obligatory precaution, perform the prayers again.",
          ur: "اگرانسان جان بوجھ کر اپنی شرم گاہ نہ ڈھانپے تواس کی نماز باطل ہےاور اگر مسئلہ نہ جاننے کی بناپر ہو چنانچہ اس کی یہ جہالت مسئلہ سیکھنے میں کوتاہی کرنے کی بنا پرہو تو (احتیاط واجب کی بنا پر) نماز دوبارہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 778",
          url: "https://www.sistani.org/english/book/48/2219/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (778)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The obligation of covering in prayer is not limited to the presence of a non-mahram in the place of worship; rather, even if nobody is present, covering is a condition for validity of prayer.",
          ur: "نماز میں بدن کو ڈھانپنا نامحرم کی موجودگی سے مخصوص نہیں ہے بلکہ اگر کوئی موجود نہ ہو تو بھی بدن کو ڈھانپنا نماز صحیح ہونے کی شرط ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "49.",
          url: "https://www.leader.ir/en/book/241?sn=32489"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 49",
          url: "https://www.leader.ir/ur/book/197/1?sn=31075"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 49",
          url: "https://www.leader.ir/fa/book/180/1?sn=30767"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "clothingconditions",
    topicId: "clothing",
    subject: {
      en: "The conditions of the clothing"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The clothing worn by someone performing prayers must meet six conditions:\n1. it must be pure (ṭāhir);\n2. it must be permissible (mubāḥ) [i.e. it must not be usurped], as an obligatory precaution;\n3. it must not be made from the parts of the carcass [of an animal that has not been slaughtered according to Islamic law];\n4. it must not be from a predatory animal; and based on obligatory precaution, nor must it be from an animal whose meat is unlawful to eat;\n5.–6. if the person performing prayers is male, it must not be made from pure silk nor embroidered with gold.\nThe details of these conditions will be explained in the following rulings."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 785",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of a praying person should be:\n1. pure;\n2. permissible to use;\n3. not a part of an animal of not-ritually slaughtered;\n4. not a part of an animal of ḥarām meat;\n5. for men, not to be golden;\n6. for men, not to made from silk only.",
          ur: "نمازی کے لباس کی شرائط درج ذیل ہیں:\n1۔ پاک ہو؛\n2۔ مباح ہو؛\n3۔ مردار کے اجزاء سے نہ بنا ہو؛\n4۔ حرام گوشت حیوان کے اجزاء سے نہ بنا ہو؛\n5۔ مرد کا لباس سونے کا نہ ہو؛\n6۔ مرد کا لباس خالص ریشم کا نہ ہو؛"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "56.",
          url: "https://www.leader.ir/en/book/241?sn=32490"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 57",
          url: "https://www.leader.ir/ur/book/197/1?sn=31076"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 57",
          url: "https://www.leader.ir/fa/book/180/1?sn=30768"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "clothingpure",
    topicId: "clothing",
    subject: {
      en: "Clothing must be pure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The first condition: the clothing worn by a person performing prayers must be pure. If someone voluntarily performs prayers with an impure body or with impure clothing, his prayers are invalid.",
          ur: "نماز پڑھنے والے کالباس پاک ہوناضروری ہے۔ اگرکوئی شخص حالت اختیار میں نجس بدن یانجس لباس کے ساتھ نماز پڑھے تواس کی نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 786",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (786)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of a praying person should be pure.",
          ur: "نماز پڑھنے والے کا بدن اور لباس پاک ہونا چاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "57.",
          url: "https://www.leader.ir/en/book/241?sn=32491"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 58",
          url: "https://www.leader.ir/ur/book/197/1?sn=31077"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 58",
          url: "https://www.leader.ir/fa/book/180/1?sn=30769"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "impureunaware",
    topicId: "clothing",
    subject: {
      en: "Praying unaware that the clothing was impure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone is certain that his body or clothing is not impure and after prayers he realises it was impure, his prayers are valid.",
          ur: "اگرکسی شخص کویہ یقین ہوکہ اس کابدن یالباس نجس نہیں ہے اور اس کے نجس ہونے کے بارے میں اسے نماز کے بعدپتا چلے تواس کی نماز صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 789",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (789)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person does not know that his body or clothes are najis and realizes it after the prayer, his prayer is valid, but if he knew before the prayer that his body or clothes were najis, then forgot and performed the prayer with it, his prayer is invalid.",
          ur: "جو شخص نہیں جانتا کہ اس کا بدن یا لباس نجس ہے اور نماز کے بعد معلوم ہوجائے تو اس کی نماز صحیح ہے لیکن اگر پہلے سے اس کے نجس ہونے کا علم تھامگر بھول کر اس کے ساتھ نماز پڑھی ہو تو اس کی نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "59.",
          url: "https://www.leader.ir/en/book/241?sn=32491"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 60",
          url: "https://www.leader.ir/ur/book/197/1?sn=31077"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 60",
          url: "https://www.leader.ir/fa/book/180/1?sn=30769"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "impurityexemptions",
    topicId: "clothing",
    subject: {
      en: "Cases where impurity on the body or clothing is excused"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In three cases – the details of which will follow afterwards – if the body or clothing of someone performing prayers is impure, his prayers are valid:\n1. if due to a wound, sore, or boil on his body the clothing or his body has become impure with blood;\n2. if the amount of blood that has made his body or clothing impure is less than the area covered by a dirham. Based on obligatory precaution, a dirham is equal to the size of the upper joint of the thumb;\n3. if he is compelled to perform prayers with an impure body or clothing.\nIn one case, [despite not falling under any of the three cases above,] if the clothing of someone performing prayers is impure, his prayers are valid, and that is when his small items of clothing – such as his socks and cap – are impure.\nThe laws (aḥkām) of these four situations will be explained in detail in the following rulings."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 834",
          url: "https://www.sistani.org/english/book/48/2221/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In the following four cases, if the body or clothes of a person who offers prayer are najis, his prayer is valid:",
          ur: "چار صورتوں میں نماز پڑھنے والے کا بدن یا لباس نجس ہوتو بھی نماز صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "64.",
          url: "https://www.leader.ir/en/book/241?sn=32492"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 65",
          url: "https://www.leader.ir/ur/book/197/1?sn=31078"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 65",
          url: "https://www.leader.ir/fa/book/180/1?sn=30770"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "woundblood",
    topicId: "clothing",
    subject: {
      en: "Blood from a wound or sore"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If blood from a wound, sore, or boil is on the body or clothing of someone performing prayers, he can perform prayers with that blood as long as the wound, sore, or boil has not healed. The same applies to pus that comes out with blood or any medicine that is applied to the wound and becomes impure.",
          ur: "اگر نماز پڑھنے والے کے بدن یالباس پرزخم یاجراحت یاپھوڑے کا خون ہوتووہ اس خون کے ساتھ اس وقت تک نماز پڑھ سکتاہے جب تک زخم یا جراحت یا پھوڑاٹھیک نہ ہوجائے اوراگراس کے بدن یالباس پرایسی پیپ ہوجوخون کے ساتھ نکلی ہو یا ایسی دوائی ہو جوزخم پرلگائی گئی ہواورنجس ہوگئی ہوتواس کے لئے بھی یہی حکم ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 835",
          url: "https://www.sistani.org/english/book/48/2221/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (835)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If there is blood from a wound, sore or abscess on the body or clothes of the person performing the prayer, and rinsing the body or clothes or changing the clothes is unbearably difficult for him or for most people, he may offer prayer with that blood so long as the wound or abscess has not healed. The same ruling applies to pus which comes out with the blood, or a medicine applied to the wound that becomes najis.",
          ur: "اگر نماز پڑھنے والے کے بدن یا لباس پر زخم، جراحت یا پھوڑے کا خون ہو چنانچہ بدن یا لباس کو دھونا یا لباس کو بدلنا اکثر لوگوں کے لئے یا خود اس شخص کے لئے مشکل اور مشقت و تکلیف کا باعث ہوتو جب تک زخم، جراحت یا پھوڑا ٹھیک نہ ہوجائے اس خون کے ساتھ نماز پڑھ سکتا ہے۔ اسی طرح خون کے ساتھ نکلنے والی پیپ اور زخم پر لگائی جانے والی دوائی نجس ہوجائے توبھی یہی حکم ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "65.",
          url: "https://www.leader.ir/en/book/241?sn=32492"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 66",
          url: "https://www.leader.ir/ur/book/197/1?sn=31078"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 66",
          url: "https://www.leader.ir/fa/book/180/1?sn=30770"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "usurpedclothing",
    topicId: "clothing",
    subject: {
      en: "Usurped clothing"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The second condition: based on obligatory precaution, the clothing with which a person performing prayers covers his private parts must be permissible (mubāḥ) [i.e. it must not be usurped (ghaṣbī)]. If a person knows that wearing usurped clothing is unlawful, or he does not know the ruling due to his negligence, and he intentionally performs prayers with that clothing, then based on obligatory precaution, his prayers are invalid. However, with regard to usurped things that do not on their own cover the private parts, and things that the person performing prayers is not currently wearing – such as a big handkerchief or a loincloth in his pocket, even though they could cover his private parts – and things that he is currently wearing but under which he has some other clothes that are not usurped and which cover his private parts, in all of these cases, the fact that these things are usurped do not affect the validity of the prayer, although as a recommended precaution using such things should be avoided."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 802",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of the praying person should be permissible (they should not be usurped).",
          ur: "نماز پڑھنے والے کا لباس مباح ہو یعنی غصبی نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "78.",
          url: "https://www.leader.ir/en/book/241?sn=32493"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 79",
          url: "https://www.leader.ir/ur/book/197/1?sn=31079"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 79",
          url: "https://www.leader.ir/fa/book/180/1?sn=30771"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "nonslaughtered",
    topicId: "clothing",
    subject: {
      en: "Clothing from an animal not ritually slaughtered"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The third condition: the clothing that is large enough to cover the private parts on its own of someone performing prayers must not be made from the carcass [of an animal that has not been slaughtered according to Islamic law] and whose blood gushes out when its jugular vein is cut. Based on obligatory precaution, this condition also applies to clothing that cannot cover the private parts on its own. And the recommended precaution is that one should not perform prayers with clothing that has been made from an animal whose blood does not gush out, such as a snake."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 808",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of a praying person should not be made of the parts of the body of an animal not slaughtered as per Islamic law if its blood gushes out when the body is cut. By obligatory caution, the same rule is applied if it is a cold-blooded animal.",
          ur: "نماز پڑھنے والے کا لباس خون جہندہ رکھنے والے مردار حیوان کے اجزاء سے نہ بنا ہو اور احتیاط واجب یہ ہے کہ خون جہندہ نہ رکھنے والے مردار کے اجزاء سے بھی نہ بنا ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "82.",
          url: "https://www.leader.ir/en/book/241?sn=32494"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 83",
          url: "https://www.leader.ir/ur/book/197/1?sn=31080"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 83",
          url: "https://www.leader.ir/fa/book/180/1?sn=30772"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "haramanimal",
    topicId: "clothing",
    subject: {
      en: "Clothing from an animal whose meat is unlawful"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The fourth condition: the clothing of a person performing prayers – apart from things that do not cover the private parts on their own, such as socks – must not be made from a predatory animal; in fact, based on obligatory precaution, it must not be made from an animal whose blood gushes out when its jugular vein is cut. Similarly, a person’s body and clothing must not be tainted with the urine, faeces, sweat, milk, or hair of such an animal. However, there is no problem if, for example, one strand of hair of such an animal is on his clothing, and the same applies if he carries something on his person from that animal; for example, in a container or box."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 811",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of a praying person should not be made of the parts of an animal whose meat is ḥarām; even if a hair of it is on the clothes or body of the praying person, his prayer is invalid.",
          ur: "نماز پڑھنے والے کا لباس حرام گوشت حیوان کے اجزاء سے نہ بنا ہو حتی کہ اگر حرام گوشت حیوان کا ایک بال بھی نماز پڑھنے والے کے بدن یا لباس کے ساتھ ہوتو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "85.",
          url: "https://www.leader.ir/en/book/241?sn=32495"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 86",
          url: "https://www.leader.ir/ur/book/197/1?sn=31081"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 86",
          url: "https://www.leader.ir/fa/book/180/1?sn=30773"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "goldmen",
    topicId: "clothing",
    subject: {
      en: "Gold for men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The fifth condition: wearing clothing embroidered with gold for men is unlawful, and prayers performed with it are invalid. However, for women, wearing it in prayers and at other times is not a problem.",
          ur: "سونے کے تار سے بنا ہوا لباس مردوں کے لئے پہننا حرام ہے اور اس کے ساتھ نمازپڑھناباطل ہے لیکن عورتوں کے لئے نمازمیں یانماز کے علاوہ اس کے پہننے میں کوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 818",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (818)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Wearing clothes woven with gold is forbidden for men and prayer performed in them is invalid. However, there is no problem for women to wear them in any situation.",
          ur: "جو لباس سونے سے بنایا گیا ہو یا اس میں سونا استعمال کیا گیا ہو ، مرد کے لئے اس کو پہننا حرام اور اس میں نماز باطل ہے لیکن عورت کے لئے نماز اور دیگر تمام حالات میں کوئی اشکال نہیں رکھتا۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "89.",
          url: "https://www.leader.ir/en/book/241?sn=32496"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 90",
          url: "https://www.leader.ir/ur/book/197/1?sn=31082"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 90",
          url: "https://www.leader.ir/fa/book/180/1?sn=30774"
        },
        verification: "A",
        englishWithheld: "English says 'woven with gold'; the Persian and Urdu say woven with gold OR in which gold is used (یا طلا در آن به کار رفته باشد). The English leaves out a case."
      }
    ]
  },
  {
    id: "goldjewellerymen",
    topicId: "clothing",
    subject: {
      en: "Gold jewellery and watches for men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Wearing gold, such as a gold necklace, ring, and wristwatch, is unlawful for men, and performing prayers with it is invalid. However, for women, wearing it in prayers and at other times is not a problem.",
          ur: "سوناپہننامثلاً سونے کی زنجیرگلے میں پہننا،سونے کی انگوٹھی ہاتھ میں پہننا، سونے کی گھڑی کلائی پرباندھنامردوں کے لئے حرام ہے اوران چیزوں کے ساتھ نمازپڑھناباطل ہے۔ لیکن عورتوں کے لئے نمازمیں اورنماز کے علاوہ ان چیزوں کے استعمال میں کوئی حرج نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 819",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (819)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Wearing a gold chain, gold ring, as well as a gold wrist watch is forbidden for men even for a short period, such as the moment of reading the marriage contract, even for a purpose other than using it as an adornment and hidden from the sight of people. By obligatory caution, prayer performed with them is invalid.",
          ur: "مرد کے لئے سونے کی زنجیر، انگوٹھی اور ہاتھ کی گھڑی استعمال کرنا حرام ہے اگرچہ زینت کی نیت کے بغیر اور دوسروں کی نظروں سے مخفی اور مختصر مدت مثلا ًنکاح کے وقت ہی کیوں نہ ہو اور احتیاط واجب کی بناپر اس کے ساتھ نماز بھی باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "90.",
          url: "https://www.leader.ir/en/book/241?sn=32496"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 91",
          url: "https://www.leader.ir/ur/book/197/1?sn=31082"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 91",
          url: "https://www.leader.ir/fa/book/180/1?sn=30774"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "silkmen",
    topicId: "clothing",
    subject: {
      en: "Pure silk for men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The sixth condition: the clothing of a man performing prayers that can cover the private parts on its own must not be made of pure silk. Furthermore, it is unlawful for a man to wear such clothing at other times."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 821",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The clothes of a man performing prayer, (even the things which are too small to cover the private parts such as skullcaps, socks) should not be made of pure silk. Wearing such clothes is forbidden for men outside the prayers as well, but there is no problem if a man has a silken handkerchief or anything similar in his pocket. It does not invalidate the prayer either.",
          ur: "مرد کا لباس یہاں تک کہ وہ لباس بھی جس سے شرم گاہ کو چھپایا نہ جائے مثلا گول والی ٹوپی، جوراب وغیرہ بھی خالص ریشم کا ہوا تو اس کے ساتھ نماز باطل ہے اور مرد کے لئے نماز کے علاوہ بھی اس کو پہننا حرام ہے لیکن اگر ریشم کا رومال وغیرہ نماز پڑھنے والے کے ہمراہ مثلا ًجیب میں ہوتو کوئی اشکال نہیں ہے اور نماز باطل نہیں ہوتی ۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "94.",
          url: "https://www.leader.ir/en/book/241?sn=32497"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 95",
          url: "https://www.leader.ir/ur/book/197/1?sn=31083"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 95",
          url: "https://www.leader.ir/fa/book/180/1?sn=30775"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "silkwomen",
    topicId: "clothing",
    subject: {
      en: "Silk for women"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "For women, there is no problem in wearing silk clothing in prayers and at other times.",
          ur: "عورت کے لئے نماز میں یااس کے علاوہ ریشمی لباس پہننے میں کوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 825",
          url: "https://www.sistani.org/english/book/48/2220/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (825)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A woman may wear silken clothes whether or not she is performing her prayer.",
          ur: "عورت کے لئے نماز اور دوسرے مواقع پر ریشم کا لباس پہننے میں کوئی اشکال نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "97.",
          url: "https://www.leader.ir/en/book/241?sn=32497"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 98",
          url: "https://www.leader.ir/ur/book/197/1?sn=31083"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 98",
          url: "https://www.leader.ir/fa/book/180/1?sn=30775"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "usurpedplace",
    topicId: "placeofprayer",
    subject: {
      en: "Praying on usurped property"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone performs prayers on usurped property, even if it is a carpet, couch, or something similar, then based on obligatory precaution, his prayers are invalid. However, there is no problem in performing prayers under a usurped roof or in a usurped tent.",
          ur: "جوشخص غصبی جگہ پراگرچہ وہ قالین،تخت اوراسی طرح کی دوسری چیزیں ہوں ،نماز پڑھ رہاہوتو(احتیاط لازم کی بناپر) اس کی نماز باطل ہے، لیکن غصبی چھت کے نیچے اورغصبی خیمے میں نماز پڑھنے میں کوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 853",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (853)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The place of offering the prayer should not be usurped.",
          ur: "نماز پڑھنے والے کی جگہ غصبی نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "100.",
          url: "https://www.leader.ir/en/book/241?sn=32500"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 101",
          url: "https://www.leader.ir/ur/book/197/1?sn=31086"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 101",
          url: "https://www.leader.ir/fa/book/180/1?sn=30778"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "stillplace",
    topicId: "placeofprayer",
    subject: {
      en: "The place must be still"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The second condition: the place where obligatory prayers are performed must not move so vigorously that it would prevent the person from performing prayers from standing and performing rukūʿ and sujūd normally; in fact, based on obligatory precaution, the movement must not prevent his body from being steady. If one is compelled to perform prayers in such a place due to shortage of time or any other reason – for example, in certain types of cars or on a ship or train – he must remain still and face qibla as much as possible. If the vehicle moves away from the direction of qibla, he must turn and face the qibla again; and if it is not possible to face qibla precisely, he must try to ensure that the difference is less than ninety degrees; and if this is not possible, he must face qibla at least while performing takbīrat al‑iḥrām; and if even this is not possible, it is not necessary for him to face qibla.",
          ur: "(دوسری شرط:) ضروری ہے کہ نمازی کی جگہ واجب نمازوں میں ایسی نہ ہوکہ تیزحرکت نمازی کے کھڑے ہونے یارکوع اورسجود کرنے میں اختیاری طور سے مانع ہوبلکہ (احتیاط لازم کی بناپر)ضروری ہے کہ اس کے بدن کوساکن رکھنے میں بھی مانع نہ ہواور اگر وقت کی تنگی یاکسی اوروجہ سے ایسی جگہ مثلاً بس، ٹرک،کشتی یاریل گاڑی میں نماز پڑھنے پر مجبور ہو تو جس قدرممکن ہوبدن کے ٹھہراؤ اورقبلے کی سمت کاخیال رکھے اوراگر سواری قبلے سے کسی دوسری طرف مڑجائے تواپنامنہ قبلے کی جانب موڑدے اور اگر قبلہ کی رعایت پورے طور سے ممکن نہ ہو تو کوشش کرے کہ اس کا (قبلہ)سےانحراف (۹۰) درجہ سے کم ہو اور اگر یہ بھی ممکن نہ ہو تو صرف تکبیرۃ الاحرام کہتے وقت قبلہ کی رعایت کرے اور اگر یہ بھی ممکن نہ ہوتوقبلہ کی رعایت ضروری نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 866",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (866)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The place at which one is offering their prayer should be immovable so that one can pray while their body is still and without movement. Therefore, to pray at a place where one moves against their will (like in a moving car or train) or on some spring mattresses, is incorrect except if one is compelled to offer the prayer there due to time shortage or some other reason.",
          ur: "نماز پڑھنے والے کی جگہ متحرک نہ ہو یعنی اس طرح ہو کہ نماز پڑھنے والاحرکت کے بغیر اور آرام سے نماز پڑھ سکے، بنابرایں ایسی جگہوں پر نماز پڑھنا کہ جہاں بے اختیار بدن کو حرکت آئے مثلا ً چلتی ہوئی گاڑی اور ریل یا اسپرنگ والے کچھ پلنگوں پر نماز صحیح نہیں ہے مگر یہ کہ وقت کی کمی یا کسی اور وجہ سے ایسی جگہ نماز پڑھنے پر مجبور ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "106.",
          url: "https://www.leader.ir/en/book/241?sn=32501"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 107",
          url: "https://www.leader.ir/ur/book/197/1?sn=31088"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 107",
          url: "https://www.leader.ir/fa/book/180/1?sn=30779"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "vehicleprayer",
    topicId: "placeofprayer",
    subject: {
      en: "Praying in a car, train or plane"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Performing prayers in a car, ship, train etc. is permitted while it is standing still. The same applies when it is moving, provided that it does not move to such an extent that it prevents the person’s body from being steady.",
          ur: "جب گاڑی،کشتی یاریل گاڑی وغیرہ کھڑی ہوئی ہوں توان میں نماز پڑھنے میں کوئی حرج نہیں اوراسی طرح جب چل رہی ہوں تواس حدتک نہ ہل جل رہی ہوں کہ نمازی کے بدن کے ٹھہراؤ میں حائل ہوں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 867",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (867)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory for passengers who travel on buses to ask the driver to stop the bus at a place appropriate for praying if they fear of lapse of the prayer’s time; and it will be obligatory for the driver to accept their request. If he refuses to stop the bus for an acceptable reason, or for no reason, the passengers should perform the prayer on the bus while it is moving, and observe qiblah, standing position, rukū‘ and sajdah as much as possible.",
          ur: "عمومی سفری وسائل میں سفر کرنے والوں کو نماز کا وقت ختم ہونے کا خوف ہوتو واجب ہے کہ ڈرائیور سے رکنے کی درخواست کریں اور ڈرائیور پر بھی ان کی درخواست قبول کرنا واجب ہے۔ اگر کسی وجہ سے نہ رکے تو مسافروں پر واجب ہے کہ حرکت کی حالت میں نماز پڑھیں اورحتی الامکان قبلے کی سمت، قیام، رکوع اور سجود کی رعایت کریں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "107.",
          url: "https://www.leader.ir/en/book/241?sn=32501"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 108",
          url: "https://www.leader.ir/ur/book/197/1?sn=31088"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 108",
          url: "https://www.leader.ir/fa/book/180/1?sn=30779"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "aheadofgrave",
    topicId: "placeofprayer",
    subject: {
      en: "Standing ahead of the grave of the Prophet or an Imam"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In prayers and other situations, it is unlawful to turn one’s back to the grave of the Prophet (Ṣ) or the Infallible Imams (ʿA) if it amounts to disrespecting them. However, if it would not amount to disrespecting them due to there being a large distance or an obstacle like a wall between the person and the grave, then there is no problem. Of course, on its own, the distance between the person and the sacred coffin, or the cloth that is placed over it, or the sacred lattice enclosure of the tomb (ḍarīḥ), would not be sufficient for discounting any disrespectful behaviour towards them; but in either case, if the person establishes an intention to attain proximity to Allah, his prayer will be valid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 872",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The praying person should not stand ahead of the grave of the Holy Prophet (S.A.W.) or an infallible Imam (a.), but there is no problem with standing in line with them.",
          ur: "نماز پڑھتے وقت پیغمبراکرم صلی اللہ علیہ و آلہ وسلم اور امام علیہ السلام کی قبر سے آگے کھڑے نہ ہوں لیکن برابر میں کھڑے ہوں تو کوئی اشکال نہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "109.",
          url: "https://www.leader.ir/en/book/241?sn=32503"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 110",
          url: "https://www.leader.ir/ur/book/197/1?sn=31090"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 110",
          url: "https://www.leader.ir/fa/book/180/1?sn=30781"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "menwomengap",
    topicId: "placeofprayer",
    subject: {
      en: "A man and a woman praying side by side"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a woman stands level with or in front of a man and they both start prayers together, then based on obligatory precaution, they must perform the prayer again. If one of them starts prayers before the other, then based on obligatory precaution, the prayer of the one who performed takbīrat al‑iḥrām second is invalid, and the prayer of the one who performed takbīrat al‑iḥrām first is valid provided that what is mentioned in the next ruling is observed; if it is not observed, the prayer of the first person who performed takbīrat al‑iḥrām will also be invalid. However, if observing what is mentioned in the next ruling is not possible, then the person should continue with the prayer and it will be valid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 873",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "According to the obligatory caution, there must be at least one span gap between a man and a woman who are praying (outside Masjid al- Ḥarām), and in this case, if they stand (in the same row) next to each other or the woman stands in front of the man, their prayer is correct. It makes no difference whether or not they are maḥrams.",
          ur: "احتیاط واجب کی بناپر نماز کی حالت میں (مسجد الحرام کے علاوہ) کم از کم ایک بالشت فاصلہ ہونا چاہئے اور اس صورت میں اگر مرد اور عورت ایک دوسرے کے برابر یا عورت مرد سے آگے کھڑی ہوجائے تو دونوں کی نماز صحیح ہے ، کوئی فرق نہیں کہ مرد و عورت دونوں محرم ہوں یا نامحرم ۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "112.",
          url: "https://www.leader.ir/en/book/241?sn=32505"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 113",
          url: "https://www.leader.ir/ur/book/197/1?sn=31092"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 113",
          url: "https://www.leader.ir/fa/book/180/1?sn=30783"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "insidekaba",
    topicId: "placeofprayer",
    subject: {
      en: "Obligatory prayers inside the Kaʿbah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The obligatory precaution is that obligatory prayers must not be wilfully performed inside the Kaʿbah or on its roof. There is no problem, however, if one is compelled.",
          ur: "احتیاط واجب یہ ہے کہ اختیارکی حالت میں خانۂ کعبہ کے اندراور اس کی چھت کے اوپرواجب نماز نہ پڑھی جائے۔ لیکن مجبوری کی حالت میں کوئی اشکال نہیں ہے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 877",
          url: "https://www.sistani.org/english/book/48/2224/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (877)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "mosquevirtue",
    topicId: "placeofprayer",
    subject: {
      en: "Praying in a mosque"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In the sacred law of Islam, it has been highly advised to perform prayers in a mosque. The best of all mosques is Masjid al-Ḥarām, and after that the Mosque of the Prophet (Ṣ), and after that the Mosque of Kufa, and after that the al-Aqsa Mosque, and after that the jāmiʿ mosque of every town, and after that one’s local mosque, and after that a mosque in the bazaar.",
          ur: "اسلام کی مقدس شریعت میں بہت تاکیدکی گئی ہے کہ نمازمسجد میں پڑھی جائے۔ دنیا بھرکی ساری مسجدوں میں سب سے بہترمسجدالحرام اوراس کے بعد مسجد نبویؐ ہے اوراس کے بعدمسجدکوفہ اور اس کے بعدمسجدبیت المقدس کادرجہ ہے۔ اس کے بعدشہرکی جامع مسجداوراس کے بعدمحلے کی مسجداور اس کے بعدبازارکی مسجد کانمبر آتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 879",
          url: "https://www.sistani.org/english/book/48/2225/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (879)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is mustaḥabb to offer prayer in the following places:\n1. a masjid; (The best masjid is Masjid al- Ḥarām, followed by Masjid al-Nabī (peace be upon him and his family), then Masjid of Kūfah, Masjid al-Aqṣā, and then masjid jāmi‘ in any city).\n2. The shrine of an infallible Imam (a.). To offer prayer in their shrine brings more reward than offering in a masjid.\n3. To offer prayer in the holy shrine of a prophet (a.) or the place in which a friend of Allah, a pious man or a great scholar (upon whom be the blessing of Allah) is buried.",
          ur: "جن مقامات پر نماز پڑھنا مستحب ہے، درج ذیل ہیں:\n1۔ مسجد (مساجد میں سب سے افضل مسجد الحرام اس کے بعد مسجد نبوی اس کے بعد مسجد کوفہ اور مسجد اقصی اور اس کے بعد ہر شہر کی جامع مسجد افضل ہے)۔\n2۔ ائمہ علیہم السلام کے حرم (حرم اور مشاہد مشرفہ میں نماز پڑھنا مساجد سے زیادہ افضل ہے)۔\n3۔ انبیاء (علیہم السلام) مقدس روضے اور اولیاء، صلحاء اور علماء(رضوان اللہ علیہم) کے مقامات و مزارات۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "114.",
          url: "https://www.leader.ir/en/book/241?sn=32506"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 115",
          url: "https://www.leader.ir/ur/book/197/1?sn=31093"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 115",
          url: "https://www.leader.ir/fa/book/180/1?sn=30784"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "mosqueimpure",
    topicId: "placeofprayer",
    subject: {
      en: "Making a mosque impure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is unlawful to make impure a mosque’s floor, ceiling, roof, and inside walls, as well as fixtures and fittings that are deemed to be part of the building, such as doors and windows.\nWhoever finds out that it has become impure must immediately purify it. The recommended precaution is that the outside walls of the mosque should not be made impure either, but if they become impure, it is not necessary to purify them. However, if making the outside walls of a mosque impure amounts to disrespecting the mosque, it would, of course, be unlawful and make it necessary to purify them to the extent that it would no longer be considered disrespectful.",
          ur: "مسجد کی زمین،اندرونی چھت اوراندرونی دیوارکونجس کرناحرام ہے اورجس شخص کوپتا چلے کہ ان میں سے کوئی مقام نجس ہوگیاہے توضروری ہے کہ اس کی نجاست کوفوراً دورکرے اور احتیاط مستحب یہ ہے کہ مسجدکی دیوار کے بیرونی حصے کو بھی نجس نہ کیاجائے اوراگروہ نجس ہوجائے تو نجاست کاہٹانالازم نہیں لیکن اگردیوار کابیرونی حصہ نجس کرنامسجد کی بے حرمتی کاسبب ہوتوقطعاً حرام ہے اور اس قدرنجاست کازائل کرناکہ جس سے بے حرمتی ختم ہوجائے ضروری ہے۔"
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 886",
          url: "https://www.sistani.org/english/book/48/2227/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (886)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is forbidden to make the floor, roof, ceiling, and walls of a masjid najis, and if a masjid becomes najis, it is obligatory to purify it immediately.",
          ur: "مسجد کا فرش ، دیواراوراندرونی و بیرونی چھت کو نجس کرنا حرام ہے۔ اگر نجس ہوجائے تو اس کو فوراپاک کرنا واجب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "115.",
          url: "https://www.leader.ir/en/book/241?sn=32507"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 116",
          url: "https://www.leader.ir/ur/book/197/1?sn=31094"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 116",
          url: "https://www.leader.ir/fa/book/180/1?sn=30785"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "adhanrecommended",
    topicId: "adhaniqamah",
    subject: {
      en: "Status of adhān and iqāmah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is recommended for both men and women to say adhān and then iqāmah before the daily obligatory prayers; however, they have not been sanctioned in Islamic law (they are not mashrūʿ) for other obligatory prayers or for recommended prayers. If Eid al-Fiṭr and Eid al-Aḍḥā prayers are performed in congregation, it is recommended to say ‘aṣṣalāh’ three times before commencing them."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 902",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Reciting the adhān and iqāmah before the daily prayers is mustaḥabb. This recommendation is emphasized about the fajr and maghrib prayers, especially when they are performed in congregation, but reciting adhān and iqāmah is not prescribed for other obligatory prayers, such as the āyāt prayer.",
          ur: "یومیہ واجب نمازوں سے پہلے اذان اور اقامت کہنا مستحب ہے اور نماز فجراور نماز مغرب مخصوصا ًنماز جماعت میں مستحب ہونے کی تاکید کی گئی ہے لیکن دوسری واجب نمازوں مثلا ًنماز آیات میں اذان و اقامہ نہیں ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "129.",
          url: "https://www.leader.ir/en/book/241?sn=32508"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 130",
          url: "https://www.leader.ir/ur/book/197/1?sn=31095"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 130",
          url: "https://www.leader.ir/fa/book/180/1?sn=30786"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "adhanwording",
    topicId: "adhaniqamah",
    subject: {
      en: "The words of adhān and iqāmah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Adhān consists of the following eighteen sentences:\nIqāmah consists of the following seventeen sentences:"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 904",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The adhān consists of eighteen phrases, as follows:\n1. Allāhu akbar, four times (“God is greater than any description”).\n2. Ashhadu allā ilāha illallāh, two times (“I testify that there is no god but Allah”).\n3. Ashhadu anna Muḥammadan rasūlullāh, two times (“I testify that Muhammad is Allah’s Messenger”).\n4. Ḥayya ‘alaṣ ṣalāh, two times (“Hasten to prayer”).\n5. Ḥayya ‘alal falāḥ, two times (“Hasten to ultimate happiness”).\n6. Ḥayya ‘alā khayril ‘amal, two times (“Hasten to the best of acts”).\n7. Allāhu akbar, two times (“God is greater than any description”).\n8. Lā ilāha illallāh, two times (“There is no god but Allah”).\nand the iqāmah is like the adhān, except for the following differences:\nThe first phrase is repeated twice instead of four times.\nBetween the 7th and 8th phrases, the following is repeated twice:\nqad qāmati-ṣṣalāh;\ncertainly, the prayer has been established;\nThe final phrase, lā ilāha ill-Allāh, is said once instead of repeated twice.",
          ur: "اذان اٹھارہ جملوں پر مشتمل ہے جو ذیل کی ترتیب سے ہیں:\n«اَللهُ اَکْبَرُ» چار مرتبہ\n«اَشْهَد اَنْ لا اِلهَ اِلاَّ اللهُ» دو مرتبہ،\n«اَشْهَدُ اَنَّ مُحَمَّداً (صلّی الله علیه و آله )رَسُولُ اللهِ» دو مرتبہ،\n«حَیَّ عَلَی الصَّلاهِ» دو مرتبہ،\n«حَیَّ عَلَی الفَلاحِ» دو مرتبہ،\n«حَیَّ عَلی خَیْرِ العَمَلِ» دو مرتبہ،\n«اَللهُ اَکْبَرُ» دو مرتبہ،\n«لا اِلهَ اِلاَّ اللهُ» دو مرتبہ.\nاقامت بھی اذان کی طرح ہے اس فرق کے ساتھ کہ اقامت کے شروع میں الله اکبر دو مرتبہ کہا جائے گا اور «حیّ علی‌ خیر العمل» کے بعد دو مرتبہ «قد قامت الصلوة» کہا جاتا ہے و آخر میں «لااله الا الله» ایک مرتبہ کہاجاتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "130.",
          url: "https://www.leader.ir/en/book/241?sn=32508"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 131",
          url: "https://www.leader.ir/ur/book/197/1?sn=31095"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 131",
          url: "https://www.leader.ir/fa/book/180/1?sn=30786"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "shahadathalithah",
    topicId: "adhaniqamah",
    subject: {
      en: "“Ashhadu anna ʿAliyyan waliyyullāh”"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The sentence:\nأَشْهَدُ أَنَّ عَلِيًّا وَلِيُّ اللهِ\nashhadu anna ʿaliyyan waliyyul lāh\n...is not a part of adhān and iqāmah, but it is good to say it after the sentence ‘ashhadu anna muḥammadar rasūlul lāh’ with the intention of attaining proximity to Allah.\nTranslation of the sentences of adhān and iqāmah:"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 905",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        verification: "A",
        arabicInSource: true,
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Saying “ashhadu anna ‘Aliyyan waliyyullāh” (“I testify that Ali is the Friend of God”) in the adhān and iqāmah with the intention of it being a symbol for the Shi‘a is good and important, and it should be said only with the intention of closeness to Allah, but it is not a part of the adhān and iqāmah.",
          ur: "«اَشْهَدُ اَنَّ عَلِیّاً وَلیُّ اللهِ» کہنا تشیع کے شعار کی حیثیت سے اہم اور بہتر ہے لیکن اذان اور اقامت کا جزء نہیں ہے اور قربت مطلقہ کی نیت سے کہا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "131.",
          url: "https://www.leader.ir/en/book/241?sn=32508"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 132",
          url: "https://www.leader.ir/ur/book/197/1?sn=31095"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 132",
          url: "https://www.leader.ir/fa/book/180/1?sn=30786"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "adhancongregation",
    topicId: "adhaniqamah",
    subject: {
      en: "Joining a congregation that has said adhān"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If adhān and iqāmah have been said for a congregational prayer, a person joining that congregation must not say adhān and iqāmah for his own prayers.",
          ur: "اگرنماز جماعت کے لئے اذان اوراقامت کہی جاچکی ہوتوجو شخص اس جماعت کے ساتھ نماز پڑھ رہاہواس کے لئے ضروری نہیں کہ اپنی نماز کے لئے اذان اور اقامت کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 909",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (909)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If they have said adhān and iqāmah for congregational prayer, a person who prays with that congregation should not say adhān and iqāmah for his/her own prayer.",
          ur: "اگر نماز جماعت کے لئے اذان اور اقامت کہی جاچکی ہو اور کوئی اس نماز جماعت میں شریک ہونا چاہے تو اپنی نماز کے لئے اذان و اقامہ نہ کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "134.",
          url: "https://www.leader.ir/en/book/241?sn=32508"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 135",
          url: "https://www.leader.ir/ur/book/197/1?sn=31095"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 135",
          url: "https://www.leader.ir/fa/book/180/1?sn=30786"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "adhanafter",
    topicId: "adhaniqamah",
    subject: {
      en: "Adhān and iqāmah after the time has set in"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Adhān and iqāmah must be said after the time for prayer has set in. If a person says them before that time – whether intentionally or forgetfully – they are invalid, except in the case when the time of prayer sets in during a prayer and the prayer is ruled to be valid, as explained in Ruling 731."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 921",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "iqamahstanding",
    topicId: "adhaniqamah",
    subject: {
      en: "Saying iqāmah standing and with ṭahārah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Iqāmah must be said after adhān, and it is a requirement that iqāmah be said while one is standing and in the state of ritual purity, i.e. while one has wuḍūʾ, ghusl, or tayammum.",
          ur: "ضروری ہے کہ اقامت،اذان کے بعدکہی جائے اس کےعلاوہ اقامت میں معتبرہے کہ کھڑے ہوکراورحدث سے پاک ہوکر(وضویاغسل یاتیمم کرکے) کہی جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 917",
          url: "https://www.sistani.org/english/book/48/2228/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (917)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "elevencomponents",
    topicId: "obligatoryparts",
    subject: {
      en: "The eleven obligatory components"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are eleven obligatory components of the prayer:\n1. intention (niyyah);\n2. standing (qiyām);\n3. takbīrat al‑iḥrām, i.e. saying ‘allāhu akbar’ at the beginning of the prayer;\n4. bowing (rukūʿ);\n5. prostrating (sujūd);\n6. recitation (qirāʾah);\n7. declaring in rukūʿ and sujūd that Allah is free from imperfections (dhikr);\n8. testifying (tashahhud);\n9. salutation (salām);\n10. sequence (tartīb);\n11. close succession (muwālāh)."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Obligatory Components of the Prayer — section introduction",
          url: "https://www.sistani.org/english/book/48/2229/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "There are eleven obligatory acts in a prayer as follows:\n1. Intention\n2. Takbīrah al-iḥrām (saying Allāhu akbar at the beginning of the prayer);\n3. Being in a standing posture;\n4. Recitation;\n5. Rukū‘ (bowing);\n6. Sajdah (prostration);\n7. Dhikr (the prescribed recitation while doing rukū‘ and sajdah)\n8. Tashahhud (bearing witness)\n9. Salām\n10. Tartīb (sequence)\n11. Muwālāt (succession)\nNow we will discuss these obligatory acts in details as well as their rules:",
          ur: "واجبات نماز گیارہ ہیں:\n1۔ نیت؛ 2۔ قیام؛ 3۔ تکبیرہ الاحرام؛ 4۔ قرائت ؛ 5۔ رکوع ؛ 6۔ سجدے؛ 7۔ ذکر؛ 8۔ تشہد؛ 9۔ سلام؛ 10۔ ترتیب؛ 11۔ موالات۔\nواجبات نماز اور ان کے احکام کی تفصیل آنے والے مسائل میں بیان کی جائے گی۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "138.",
          url: "https://www.leader.ir/en/book/241?sn=32509"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 139",
          url: "https://www.leader.ir/ur/book/197/1?sn=31096"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 139",
          url: "https://www.leader.ir/fa/book/180/1?sn=30787"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "rukns",
    topicId: "obligatoryparts",
    subject: {
      en: "The elemental parts (rukn)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Some of the obligatory components of the prayer are elemental (rukn), i.e. if one does not perform them – whether intentionally or mistakenly – the prayer is invalid. Some other obligatory components are not elemental, i.e. if they are omitted mistakenly, the prayer is not invalid. There are five rukns of the prayer:\n1. intention;\n2. takbīrat al‑iḥrām while standing;\n3. standing that is joined to rukūʿ, i.e. standing before rukūʿ;\n4. rukūʿ;\n5. two sajdahs in one rakʿah.\nIf a rukn is intentionally performed more than the prescribed number of times, the prayer is invalid. If it is done mistakenly, and if the additional act is a rukūʿ or two sajdahs in one rakʿah, then based on obligatory precaution, the prayer is invalid; otherwise [i.e. if the additional act is not a rukūʿ or two sajdahs in one rakʿah], it is not invalid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 928",
          url: "https://www.sistani.org/english/book/48/2229/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The foundational elements (rukns) of prayer are:\n1. intention\n2. takbīrah al-iḥrām\n3. standing (at the time of saying takbīrah al-iḥrām and before the rukū‘)\n4. rukū‘\n5. two sajdah.",
          ur: "ارکان نماز درج ذیل ہیں؛\n1۔ نیت؛ 2۔ تکبیرہ الاحرام؛ 3۔ تکبیرہ الاحرام کے دوران اور رکوع سے پہلے قیام (قیام متصل بہ رکوع)؛ 4۔ رکوع؛ 5۔ دونوں سجدے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "140.",
          url: "https://www.leader.ir/en/book/241?sn=32509"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 141",
          url: "https://www.leader.ir/ur/book/197/1?sn=31096"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 141",
          url: "https://www.leader.ir/fa/book/180/1?sn=30787"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "intention",
    topicId: "obligatoryparts",
    subject: {
      en: "Intention (niyyah)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must perform prayers with the intention of qurbah, i.e. in humility and obedience to the Lord of the worlds. It is not necessary for him to make the intention pass through his heart or, for example, to say ‘I am performing four rakʿahs of the ẓuhr prayer qurbatan ilal lāh [to attain proximity to Allah]’."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 929",
          url: "https://www.sistani.org/english/book/48/2230/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Making an intention is obligatory for performing the prayer, which means performing a specified prayer to comply with the order of God.",
          ur: "نیت (جو واجبات رکنی میں سے ایک ہے) کا معنی نماز کو خدا کے فرمان کی اطاعت کے قصد سے انجام دینا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "141.",
          url: "https://www.leader.ir/en/book/241?sn=32510"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 142",
          url: "https://www.leader.ir/ur/book/197/1?sn=31097"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 142",
          url: "https://www.leader.ir/fa/book/180/1?sn=30788"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "intentionspecified",
    topicId: "obligatoryparts",
    subject: {
      en: "Specifying which prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person makes the intention in ẓuhr or ʿaṣr prayers that ‘I am performing a four rakʿah prayer’ but does not specify if it is the ẓuhr or ʿaṣr prayer, his prayer is invalid. However, it is sufficient if he specifies the ẓuhr prayer as the first prayer and the ʿaṣr prayer as the second prayer. With regard to someone for whom it is obligatory, for example, to make up a ẓuhr prayer, if he wants to make up that prayer or perform the ẓuhr prayer within the prescribed time for ẓuhr prayers, he must specify in his intention which prayer he is performing.",
          ur: "اگرکوئی شخص ظہر کی نمازمیں یاعصرکی نماز میں نیت کرے کہ چار رکعت نماز پڑھتاہوں لیکن اس امرکاتعین نہ کرے کہ نمازظہرکی ہے یاعصرکی تواس کی نمازباطل ہے۔ لیکن کافی ہے کہ نماز کو پہلی نماز کےعنوان سے اور نماز عصر کو دوسری نماز کے عنوان سے معین کرےنیزمثال کے طورپراگر کسی شخص پرنمازظہرکی قضاواجب ہواوروہ اس قضا نماز یانمازظہرکو ’’ظہرکے وقت‘‘ میں پڑھناچاہے تو ضروری ہے کہ جونمازوہ پڑھے نیت میں اس کاتعین کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 930",
          url: "https://www.sistani.org/english/book/48/2230/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (930)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person should know which prayer he is performing. Hence, if a person, for example, makes the intention to perform a four-rak‘ah prayer, but does not specify whether it is ẓuhr or ‘aṣr prayer, his prayer is void.",
          ur: "نماز پڑھنے والے کو معلوم ہونا چاہئے کہ کون سی نماز پڑھ رہا ہے ۔ بنابرایں اگر نیت کرے کہ چار رکعت نماز پڑھتا ہوں لیکن اس امر کا تعین نہ کرے کہ ظہر کی نماز ہے یا عصر کی تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "143.",
          url: "https://www.leader.ir/en/book/241?sn=32510"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 144",
          url: "https://www.leader.ir/ur/book/197/1?sn=31097"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 144",
          url: "https://www.leader.ir/fa/book/180/1?sn=30788"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "riya",
    topicId: "obligatoryparts",
    subject: {
      en: "Praying to be seen by others (riyāʾ)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must only perform prayers in humility to the Lord of the worlds; therefore, if one performs prayers ostentatiously – i.e. to show off to people – his prayer is invalid, irrespective of whether he does so solely for people or partly for Allah the Exalted and partly for people."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 932",
          url: "https://www.sistani.org/english/book/48/2230/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person should perform the prayer to comply with the order of God. Thus, if a person performs the very prayer for riyā’, i.e. in order to pretend to be religious or the like, it is ḥarām and the prayer is void.",
          ur: "انسان کو چاہئے کہ فقط اللہ کے فرمان کی اطاعت کے قصد سے نماز پڑھے۔ بنابرایں اگر اصل نماز کو ریا یعنی اپنی دینداری کے دکھاوے وغیرہ کے لئے پڑھے تویہ عمل حرام اور نماز باطل ہونے کا باعث ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "144.",
          url: "https://www.leader.ir/en/book/241?sn=32510"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 145",
          url: "https://www.leader.ir/ur/book/197/1?sn=31097"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 145",
          url: "https://www.leader.ir/fa/book/180/1?sn=30788"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "takbir",
    topicId: "obligatoryparts",
    subject: {
      en: "Takbīrat al-iḥrām"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Saying ‘allāhu akbar’ at the beginning of every prayer is obligatory and an elementary part of the prayer. The letters in ‘allāh’ and ‘akbar’, as well as the two words ‘allāh’ and ‘akbar’, must be said in succession. Furthermore, these two words must be pronounced in correct Arabic; if someone pronounces them in incorrect Arabic or, for example, says their translation in English, it is not correct."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 934",
          url: "https://www.sistani.org/english/book/48/2231/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Saying takbīrah al-iḥrām is obligatory for the prayer; namely, saying Allāhu akbar at the beginning of the prayer.",
          ur: "نماز میں تکبیرۃ الاحرام واجب ہے اور اس سے مراد نماز کی ابتدا میں' الله اکبر' کہنا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "164.",
          url: "https://www.leader.ir/en/book/241?sn=32512"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 165",
          url: "https://www.leader.ir/ur/book/197/1?sn=31099"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 165",
          url: "https://www.leader.ir/fa/book/180/1?sn=30790"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "takbirstill",
    topicId: "obligatoryparts",
    subject: {
      en: "Being still for takbīrat al-iḥrām"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "When saying takbīrat al‑iḥrām in an obligatory prayer, the body must be still; if one intentionally says takbīrat al‑iḥrām while his body is moving, it is invalid.",
          ur: "تکبیرۃ الاحرام کہتے وقت ضروری ہے کہ انسان کابدن ساکن ہو اور اگرکوئی شخص جان بوجھ کر اس حالت میں تکبیرۃ الاحرام کہے کہ اس کا بدن حرکت میں ہوتو باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 937",
          url: "https://www.sistani.org/english/book/48/2231/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (937)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is necessary that during pronunciation of the takbīrah al-iḥrām, the person’s body be still, so if a person intentionally pronounces takbīrah al-iḥrām while his body is moving, the prayer is invalid.",
          ur: "تکبیرۃ الاحرام کہتے وقت بدن سکون کے ساتھ اور حرکت کے بغیر ہونا چاہئے۔ بنابرایں اگر عمداً اور اختیار کے ساتھ اس وقت تکبیرۃ الاحرام کہے جب بدن حرکت میں ہو تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "168.",
          url: "https://www.leader.ir/en/book/241?sn=32512"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 169",
          url: "https://www.leader.ir/ur/book/197/1?sn=31099"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 169",
          url: "https://www.leader.ir/fa/book/180/1?sn=30790"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "qiyam",
    topicId: "obligatoryparts",
    subject: {
      en: "Standing (qiyām)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Standing while saying takbīrat al‑iḥrām and standing before rukūʿ – which is called ‘the standing that is connected to the rukūʿ’ (al‑qiyām al‑muttaṣil bil‑rukūʿ) – is a rukn. However, standing while reciting Sūrat al-Ḥamd and the other surah, and standing after rukūʿ, are not rukns; and if one omits these forgetfully, his prayer is valid.",
          ur: "تکبیرۃ الاحرام کہنے کے موقع پرقیام اوررکوع سے پہلے والاقیام جسے (قیام متصل برکوع کہتے ہیں ) رکن ہے۔ لیکن الحمداورسورہ پڑھنے کے موقع پرقیام اوررکوع کے بعدقیام رکن نہیں ہے اوراگرکوئی شخص اسے بھول چوک کی وجہ سے ترک کردے تواس کی نمازصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 944",
          url: "https://www.sistani.org/english/book/48/2232/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (944)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Standing while uttering takbīrah al-iḥrām and before going to rukū‘ is considered a foundational (rukn) element, meaning that if a person abandons it – even by mistake or due to forgetting it, the prayer becomes void.",
          ur: "تکبیرۃ الاحرام کہتے وقت اور اسی طرح رکوع میں جانے سے پہلے کھڑے ہونا رکن ہے یعنی اگر سہواً اور فراموشی سے بھی ترک ہوجائے تو نماز باطل ہوجاتی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "149.",
          url: "https://www.leader.ir/en/book/241?sn=32511"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 150",
          url: "https://www.leader.ir/ur/book/197/1?sn=31098"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 150",
          url: "https://www.leader.ir/fa/book/180/1?sn=30789"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qiyamstill",
    topicId: "obligatoryparts",
    subject: {
      en: "Not moving or leaning while standing"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "When one stands for takbīrat al‑iḥrām or qirāʾah, he must not walk nor incline to one side. And based on obligatory precaution, he must not move his body or voluntarily lean on anything; however, there is no problem if he is compelled to.",
          ur: "جس وقت ایک شخص تکبیرۃ الاحرام یاقرأت کے لئے کھڑاہوضروری ہے کہ راستہ نہ چلے اورکسی طرف نہ جھکے اوراحتیاط لازم کی بناپربدن کو حرکت نہ دے اور اختیار کی حالت میں کسی جگہ ٹیک نہ لگائے لیکن اگرایساکرنابہ امرمجبوری ہوتوکوئی اشکال نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 947",
          url: "https://www.sistani.org/english/book/48/2232/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (947)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "When a person stands for recitation, he should not move his body, nor should he tilt towards one side or lean on anything, unless it is inevitable to do so, or he does so by mistake or forgetfully.",
          ur: "نماز پڑھنے والے کو چاہئے کہ قیام کی حالت میں بدن کو حرکت نہ دے اور واضح طور پر کسی طرف نہ جھکے اور کسی جگہ ٹیک نہ لگائے مگر یہ کہ مجبور ہو یا بھولنے اور فراموشی کی وجہ سے ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "153.",
          url: "https://www.leader.ir/en/book/241?sn=32511"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 154",
          url: "https://www.leader.ir/ur/book/197/1?sn=31098"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 154",
          url: "https://www.leader.ir/fa/book/180/1?sn=30789"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "unabletostand",
    topicId: "obligatoryparts",
    subject: {
      en: "Praying sitting or lying down"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person is unable to stand while performing prayers, he must sit down; and if he is unable to sit down, he must lie down. However, he must not say any of the obligatory dhikrs until his body becomes still.",
          ur: "نمازکے دوران اگرکوئی شخص کھڑے ہونے کے قابل نہ ہوتو ضروری ہے کہ بیٹھ جائے اوراگربیٹھ بھی نہ سکتاہوتوضروری ہے کہ لیٹ جائے،لیکن جب تک اس کے بدن کوسکون حاصل نہ ہوضروری ہے کہ کوئی واجب ذکرنہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 955",
          url: "https://www.sistani.org/english/book/48/2232/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (955)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who is not able to offer the prayer in a standing posture should offer the prayer in a sitting posture, but if he is able to stand and lean on something, he should offer his prayer in a standing posture.",
          ur: "کوئی نماز کے دوران کھڑا نہ ہوسکے تو بیٹھ کر نماز پڑھے لیکن اگر کسی چیز پر ٹیک لگاکر کھڑا ہوسکتا ہو تو اس کا وظیفہ یہ ہے کہ کھڑے ہوکر نماز پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "156.",
          url: "https://www.leader.ir/en/book/241?sn=32511"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 157",
          url: "https://www.leader.ir/ur/book/197/1?sn=31098"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 157",
          url: "https://www.leader.ir/fa/book/180/1?sn=30789"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "fatihasurah",
    topicId: "qiraah",
    subject: {
      en: "Al-Ḥamd and another surah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah; and based on obligatory precaution, [the second surah] must be a complete surah. Also based on obligatory precaution, ‘Sūrat al-Ḍuḥā’ and ‘Sūrat al-Sharḥ’, and similarly ‘Sūrat al-Fīl’ and ‘Sūrah Quraysh’, are counted as one surah in prayers.",
          ur: "ضروری ہے کہ انسان روزانہ کی واجب نمازوں کی پہلی اور دوسری رکعت میں پہلے الحمداور اس کے بعد(احتیاط واجب کی بناپر)کسی ایک پورے سورے کی تلاوت کرے اور’’وَالضُّحیٰ‘‘ اور’’اَلَمْ نَشْرَح‘‘کی سورتیں اور اسی طرح ’’سورۂ فیل‘‘ اور’’سورۂ قریش‘‘( احتیاط واجب کی بناپر)نماز میں ایک سورت شمارہوتی ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 964",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (964)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter.",
          ur: "یومیہ نمازوں کی پہلی اور دوسری رکعت میں پہلے سورہ حمد اور اس کے بعد احتیاط واجب کی بناپر ایک مکمل سورہ پڑھا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "172.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 173",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 173",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "shorttimesurah",
    topicId: "qiraah",
    subject: {
      en: "When time is short"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If the time for prayers is short or one is compelled to not recite the other surah – for example, he fears that if he recites the other surah, a thief, predatory animal, or something else will harm him – or if one has some urgent matter to attend to, then in these cases, he can leave out reciting the other surah. In fact, when time is short and in some cases where a person is fearful, he must not recite the other surah.",
          ur: "اگرنمازکاوقت تنگ ہویاانسان کسی مجبوری کی وجہ سے سورہ نہ پڑھ سکتاہو مثلاًاسے خوف ہوکہ اگرسورہ پڑھے گاتوچوریادرندہ یاکوئی چیزاسے نقصان پہنچائے گی یااسے ضروری کام ہوتواگروہ چاہے توسورہ نہ پڑھے بلکہ وقت تنگ ہونے کی صورت میں اور خوف کی بعض حالتوں میں ضروری ہے کہ وہ سورہ نہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 965",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (965)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If the time is short for the prayer, he should not recite the chapter.",
          ur: "اگر نماز کا وقت تنگ ہوتو سورہ نہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "174.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 175",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 175",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "forgotrecitation",
    topicId: "qiraah",
    subject: {
      en: "Forgetting the recitation"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person forgets to recite Sūrat al-Ḥamd and the other surah, or one of them, and realises this after going into rukūʿ, his prayers are valid.",
          ur: "اگرکوئی شخص الحمداورسورہ یاان میں سے کسی ایک کاپڑھنابھول جائے اور رکوع میں جانے کے بعداسے یادآئے تواس کی نمازصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 967",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (967)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person forgets to recite chapter al-Fātiḥah and the other chapter, or one of them, and after he goes to rukū‘, he realizes it, his prayer is correct."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "176.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 177",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "sajdahsurahs",
    topicId: "qiraah",
    subject: {
      en: "Surahs with an obligatory sajdah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If during obligatory prayers one intentionally recites one of the four surahs that contain an obligatory sajdah – as mentioned in Ruling 354 – it is obligatory that he perform sajdah after reciting the verse of sajdah. However, based on obligatory precaution, by performing the sajdah his prayer becomes invalid, and it is obligatory that he perform the prayer again unless he performed the sajdah forgetfully. If he does not perform the sajdah, he can continue with the prayer but he will have sinned for not performing the sajdah."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 969",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In the obligatory prayers, it is not permissible to recite chapters that contain verses of obligatory sajdah, and if a person intentionally or by mistake recites one of those chapters, he should, by obligatory caution, perform sajdah instantly upon reciting the verse of sajdah; then he should stand up and finish the chapter if it has not ended yet and finish the prayer, and then repeat the prayer. In case he realizes this before reaching the verse of sajdah, based on obligatory caution, he should abandon that chapter and recite another chapter and perform the prayer to the end and then repeat the prayer.",
          ur: "واجب نماز میں ان سوروں کو پڑھنا جائز نہیں کہ جن میں واجب سجدے ہیں۔ اگر عمدا یا بھول کر ان سوروں میں سے کسی کو پڑھے اور سجدے والی آیت پر پہنچ جائے تو احتیاط واجب کی بناپر سجدہ تلاوت بجالائے اور کھڑا ہوجائے اور اگر سورہ ختم نہیں ہوا ہے تو اس کو آخر تک پہنچائے اور نماز ختم کرے اور اس کے بعد نماز کو دوبارہ پڑھے۔ اگر سجدے والی آیت پر پہنچنے سے پہلے متوجہ ہوجائے تو احتیاط واجب یہ ہے کہ سورہ کو ترک کردے اور دوسرا سورہ پڑھے اور بعد میں نماز دوبارہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "178.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 179",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 179",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "ikhlaskafirun",
    topicId: "qiraah",
    subject: {
      en: "Starting al-Ikhlāṣ or al-Kāfirūn"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If after Sūrat al-Ḥamd one begins reciting Sūrat al-Ikhlāṣ or Sūrat al-Kāfirūn, he cannot leave it and recite another surah instead. This rule applies to the nāfilah prayers as well based on obligatory precaution. However, in the Friday prayer and the prayers on Friday, if one forgetfully recites one of these two surahs instead of Sūrat al-Jumuʿah and Sūrat al-Munāfiqūn, he can leave it and recite Sūrat al-Jumuʿah and Sūrat al-Munāfiqūn instead; however, the recommended precaution is that one should not leave it [i.e. Sūrat al-Ikhlāṣ or Sūrat al-Kāfirūn] after having recited half of it."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 974*",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        verification: "A",
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        urduEditionLag: true,
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If after chapter al-Fātiḥah, the praying person begins reciting chapter al-Ikhlāṣ or al-Kāfirūn, he cannot abandon it and recite another chapter. However, if in the Friday prayer, he recites one of these two chapters instead of chapter al-Jumu‘ah and chapter al-Munāfiqūn inadvertently, he can abandon them and start reciting chapter al-Jumu‘ah and chapter al-Munāfiqūn.",
          ur: "اگر کوئی شخص الحمد کے بعد سورہ ' قل هو الله احد' یا 'قل یاایها الکافرون' شروع کرے تو اس کو چھوڑ کر دوسرا سورہ نہیں پڑھ سکتا لیکن نماز جمعہ میں اگر سورہ جمعہ یا منافقین کے بجائے بھول کر ان دونوں سوروں میں سے کسی ایک کو پڑھے تو اس کو چھوڑ کر سورہ جمعہ اور منافقین پڑھ سکتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "180.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 181",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 181",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "aloudmen",
    topicId: "qiraah",
    subject: {
      en: "Reciting aloud or quietly: men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, it is obligatory for a man to recite Sūrat al-Ḥamd and the other surah aloud (jahr) in ṣubḥ, maghrib, and ʿishāʾ prayers. And based on obligatory precaution, it is obligatory for a man and a woman to recite Sūrat al-Ḥamd and the other surah in ẓuhr and ʿaṣr in a whisper (ikhfāt).",
          ur: "مردپر(احتیاط کی بناءپر) واجب ہے کہ صبح اورمغرب وعشاکی نمازوں میں الحمد اور سورہ بلندآواز سے پڑھے اورمرداورعورت دونوں پر(احتیاط کی بناپر) واجب ہے کہ نماز ظہروعصرمیں الحمداورسورہ آہستہ پڑھیں ۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 978",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (978)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory for men to recite chapter al-Fātiḥah and the second chapter in fajr, maghrib and ‘ishā’ prayers loudly (in jahr), and in ẓuhr and ‘aṣr prayers in a whispering manner (ikhfāt).",
          ur: "مرد پر واجب ہے کہ نماز صبح، مغرب اور عشاء کی پہلی دو رکعتوں میں الحمد اور سورہ کو بلند آواز میں پڑھے اور مرد اور عورت پر واجب ہے کہ نماز ظہر اور عصر میں الحمد اور سورہ آہستہ پڑھیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "190.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 191",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 191",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        englishWithheld: "English leaves out 'the first two rak'ahs' of fajr/maghrib/'isha' and says only men for the quiet prayers; the Persian and Urdu say men AND women for zuhr/'asr (بر مرد و زن)."
      }
    ]
  },
  {
    id: "aloudsubhmaghrib",
    topicId: "qiraah",
    subject: {
      en: "Aloud in ṣubḥ, maghrib and ʿishāʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, in ṣubḥ, maghrib, and ʿishāʾ prayers, a man must be careful that he recites all the words of Sūrat al-Ḥamd and the other surah aloud, even their last letters.",
          ur: "(احتیاط کی بناپر)ضروری ہے کہ مردصبح اورمغرب وعشا کی نمازمیں خیال رکھے کہ الحمداور سورہ کے تمام کلمات حتیٰ کہ ان کے آخری حرف تک بلندآوازسے پڑھے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 979",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (979)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "aloudwomen",
    topicId: "qiraah",
    subject: {
      en: "Reciting aloud or quietly: women"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A woman can recite Sūrat al-Ḥamd and the other surah in ṣubḥ, maghrib, and ʿishāʾ prayers aloud or in a whisper. However, if someone who is not her maḥram is able to hear her voice and the situation is such that it would be unlawful for her to make her voice heard by a non-maḥram man, then she must recite them in a whisper. And if she intentionally recites them aloud, her prayer will be invalid based on obligatory precaution."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 980",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In the morning, maghrib and ‘ishā’ prayers, a female has the choice to recite the chapter al-Fātiḥah and another chapter quietly or loudly unless a non-maḥram is hearing her voice, in case of which it is better that she recites quietly.",
          ur: "عورت نماز صبح، مغرب اور عشاء میں الحمد او سورہ کو بلند آواز سے یا آہستہ پڑھ سکتی ہے لیکن اگر نامحرم اس کی آواز سن رہا ہو تو بہتر ہے کہ آہستہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "191.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 192",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 192",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "aloudmistake",
    topicId: "qiraah",
    subject: {
      en: "Reciting aloud or quietly by mistake"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If when one must recite aloud he intentionally recites in a whisper, or when one must recite in a whisper he intentionally recites aloud, his prayer is invalid based on obligatory precaution. However, his prayer is valid if he does this due to forgetfulness or not knowing the ruling. While reciting Sūrat al-Ḥamd or the other surah, if he realises that he has made a mistake [in not reciting aloud or in a whisper as per his duty], it is not necessary for him to repeat what he has already recited.",
          ur: "اگرکوئی شخص جس نمازکوبلندآوازسے پڑھناضروری ہے اسے عمداً آہستہ پڑھے یاجونماز آہستہ پڑھنی ضروری ہے اسے عمداً بلندآواز سے پڑھے تو(احتیاط واجب کی بناپر) اس کی نمازباطل ہے۔ لیکن اگربھول جانے کی وجہ سے یامسئلہ نہ جاننے کی وجہ سے ایسا کرے تو(اس کی نماز) صحیح ہے۔نیزالحمداورسورہ پڑھنے کے دوران بھی اگروہ متوجہ ہو جائے کہ اس سے غلطی ہوئی ہے توضروری نہیں کہ جوحصہ پڑھ چکاہواسے دوبارہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 981",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (981)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person intentionally offers a prayer quietly which should be offered loudly, or he intentionally offers a prayer loudly which should be offered quietly, his prayer is void. However, if he does so owing to forgetting or not knowing the ruling, his prayer is correct, and if he realizes his mistake while reciting chapter al-Fātiḥah, the other chapter, or the four tasbīḥ, it is not necessary for him to repeat what he has recited in the wrong manner.",
          ur: "اگرکوئی شخص جس جگہ بلند آواز سے پڑھنا چاہئے، عمداً آہستہ پڑھے یا جہاں آہستہ پڑھنا چاہئے ، عمداً بلند آواز سے پڑھے تو نماز باطل ہے لیکن اگر فراموشی یا مسئلہ نہ جاننے کی وجہ سے ہو تو نماز صحیح ہے چنانچہ الحمد اور سورہ یا تسبیحات پڑھتے ہوئے متوجہ ہوجائے تو جتنی مقدار غلطی سے بلند یا آہستہ پڑھی ہے، دوبارہ پڑھنا لازم نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "197.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 198",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 198",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "correctrecitation",
    topicId: "qiraah",
    subject: {
      en: "Reciting correctly"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must correctly recite qirāʾah of the prayer. If someone cannot in any way recite the whole of Sūrat al-Ḥamd correctly, he must recite it in the way he can, provided that the amount he recites correctly is significant. However, if that amount is insignificant, then based on obligatory precaution, he must add to it an amount of the Qur’an that he can recite correctly. If he cannot do this, he must add to it tasbīḥ [i.e. saying ‘subḥānal lāh’]. However, if someone cannot recite the other surah correctly at all, it is not necessary for him to recite something else in its place. In all the above cases, the recommended precaution is that such a person should perform prayers in congregation.",
          ur: "انسان کے لئے ضروری ہے کہ نمازکو صحیح قرأت کےساتھ پڑھے اورجوشخص کسی طرح بھی پورے سورۂ الحمدکوصحیح طرح نہ پڑھ سکتا ہو تو ضروری ہے کہ اسی طرح پڑھے اگر جس مقدار کو صحیح پڑھ سکتا ہے وہ قابل توجہ ہو لیکن اگروہ مقداربہت کم ہوتو(احتیاط واجب کی بناپر)قرآن کے دوسرے سوروں میں سے جس قدر صحیح پڑھنا ممکن ہواس کے ساتھ ملاکر پڑھنا ضروری ہے اوراگرایسانہ کرسکتاہوتوتسبیح (سبحان اللہ)اس کے ساتھ ملاکر پڑھنا ضروری ہے اوراگرکوئی پورے سورہ کو صحیح نہ پڑھ سکتاہوتوضروری نہیں کہ اس کے بدلے کچھ پڑھے اورہرحال میں احتیاط مستحب یہ ہے کہ نماز کوجماعت کے ساتھ بجا لائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 983",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (983)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory that the recitations of the prayer should be correct and without any problem. If one is not able to learn the correct pronunciation at all, he should recite in any manner he can, and by mustaḥabb caution he should offer his prayer in congregation.",
          ur: "انسان نماز کو غلطی کے بغیر اور صحیح پڑھے۔ جو شخص کسی بھی طور پر صحیح ادا ئیگی نہیں سیکھ سکتا ہو ضروری ہے کہ جس طریقے سے بھی ممکن ہو نماز پڑھے اور احتیاط مستحب یہ ہے کہ نماز کو جماعت کے ساتھ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "200.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 201",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 201",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ]
  },
  {
    id: "thirdfourthrakah",
    topicId: "qiraah",
    subject: {
      en: "The third and fourth rakʿahs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In the third and fourth rakʿahs of prayers, a person can either recite one Sūrat al-Ḥamd or say one al‑tasbīḥāt al‑arbaʿah, i.e. he can say once:\nسُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ\nsubḥānal lāhi wal ḥamdu lillāhi wa lā ilāha illal lāhu wallāhu akbar\nI declare emphatically that Allah is free from imperfections, and all praise is for Allah, and there is no god but Allah, and Allah is greater [than what He is described as].\n...and it is better that he says this three times. A person can recite Sūrat al-Ḥamd in one rakʿah and say al‑tasbīḥāt al‑arbaʿah in the second rakʿah, although it is better that he says al‑tasbīḥāt al‑arbaʿah in both the rakʿahs."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 991",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        verification: "A",
        arabicInSource: true,
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is enough in the 3rd and 4th rak‘ah of the prayer to say Subḥānallāhi wal ḥamdu lillhāhi wa lā ilḥā illallāu wallāhu akbar once. However, according to mustaḥabb caution, it is said three times. Of course, instead of this dhikr, which is called the four tasbīḥ, one may recite chapter al-Fātiḥah.",
          ur: "نماز کی تیسری اور چوتھی رکعت میں ایک دفعہ سبحان الله والحمدلله ولا الله الاالله والله اکبر پڑھنا کافی ہے اگرچہ احتیاط مستحب یہ ہے کہ تین دفعہ پڑھا جائے البتہ اس ذکر (جس کو تسبیحات اربعہ کہتے ہیں) کے بجائے سورہ حمد بھی پڑھ سکتے ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "184.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 185",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 185",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "thirdfourthquiet",
    topicId: "qiraah",
    subject: {
      en: "Reciting quietly in the third and fourth rakʿahs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, it is obligatory for men and women to recite Sūrat al-Ḥamd and to say al‑tasbīḥāt al‑arbaʿah in a whisper in the third and fourth rakʿahs of the prayer."
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 993",
          url: "https://www.sistani.org/english/book/48/2233/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory for both men and women in the third and fourth rak‘ah to recite the four tasbīḥ or chapter al-Fātiḥah in a whispering manner; and by caution, if a person recites chapter al-Fātiḥah, he should recite bismillāhir raḥmānir raḥīm in a whispering manner.",
          ur: "تیسری اور چوتھی رکعت میں تسبیحات یا الحمد کو آہستہ پڑھےاور الحمد پڑھنے کی صورت میں احتیاط کی بناپر بسم اللہ بھی آہستہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "192.",
          url: "https://www.leader.ir/en/book/241?sn=32513"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 193",
          url: "https://www.leader.ir/ur/book/197/1?sn=31100"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 193",
          url: "https://www.leader.ir/fa/book/180/1?sn=30791"
        },
        verification: "A",
        note: "Part of this text says 'caution' without stating whether it is obligatory or recommended (decision P5).",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "ruku",
    topicId: "rukusujud",
    subject: {
      en: "Rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’.",
          ur: "ضروری ہے کہ ہررکعت میں قرأت کے بعد اس قدر جھکے کہ اپنی انگلیوں کے سرے(انگوٹھے کے ساتھ) گھٹنے پررکھ سکے اوراس عمل کو’’رکوع‘‘ کہتے ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1008",
          url: "https://www.sistani.org/english/book/48/2234/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1008)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees.",
          ur: "ہر رکعت میں قرائت کے بعد رکوع کرے یعنی اس قدر جھک جائے کہ ہاتھ گھٹنوں پر رکھ سکے اور اگر انگلیوں کے سرے بھی گھٹنوں تک پہنچیں تو کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "213.",
          url: "https://www.leader.ir/en/book/241?sn=32514"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 214",
          url: "https://www.leader.ir/ur/book/197/1?sn=31127"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 214",
          url: "https://www.leader.ir/fa/book/180/1?sn=30792"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "rukudhikr",
    topicId: "rukusujud",
    subject: {
      en: "The dhikr of rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times.",
          ur: "بہتریہ ہے کہ اختیارکی حالت میں رکوع میں تین دفعہ ’’سُبْحَانَ اللہِ‘‘ یا ایک دفعہ’’سُبْحَانَ رَبِّیَ الْعَظِیْمِ وَبِحَمْدِہٖ‘‘ کہے اور ظاہریہ ہے کہ جوذکربھی اتنی مقدار میں کہا جائے کافی ہے اور( احتیاط واجب کی بناپر) ضروری ہے کہ اسی مقدار میں ہو لیکن وقت کی تنگی اور مجبوری کی حالت میں ایک دفعہ ’’سُبْحَانَ اللہِ‘‘ کہنا ہی کافی ہےاور جو شخصسُبْحَانَ رَبِّیَ الْعَظِیْمِ کو اچھی طرح سےادا نہ کرسکے اس کے لئے ضروری ہے کہ دوسرے ذکر جیسے سبحان اللہ کوتین دفعہ کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1014",
          url: "https://www.sistani.org/english/book/48/2234/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1014)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. The English 4th edition publishes this dhikr only as an image (/files-new/book-photo/48/ruku.png), so it is quoted here exactly as the English book has it (with the image left unretyped); the Arabic itself is shown separately as a sourced recitation (P12), taken from the official Urdu edition, not spliced into this English quote."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The obligatory dhikr in rukū‘ is to say subḥāna rabbīyal ‘aẓīmi wa biḥamdih once or subḥānallāh three times, and it is sufficient if a person says another dhikr such as alḥamdu lillāh, Allāhu akbar or another dhikr to the same amount.",
          ur: "رکوع میں ذکر پڑھنا ضروری ہے۔ رکوع کا واجب ذکر ایک دفعہ سُبْحانَ رَبِّیَ‌ الْعَظیْمِ وَ بِحَمْدِهِ یا تین دفعہ سُبْحانَ اللهِ ہے۔ اگر اس کے بجائے (سجدے کے مخصوص ذکر کے علاوہ) کوئی دوسرا ذکر مثلاً اَلْحَمْدُ لِلهِ اور اَللّهُ اَکبَرُ وغیرہ اسی مقدار میں پڑھے تو کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "221.",
          url: "https://www.leader.ir/en/book/241?sn=32514"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 222",
          url: "https://www.leader.ir/ur/book/197/1?sn=31127"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 222",
          url: "https://www.leader.ir/fa/book/180/1?sn=30792"
        },
        verification: "A",
        englishWithheld: "English allows 'another dhikr' in ruku' without the Persian/Urdu exception (غیر از ذکر مخصوص سجده: not the dhikr specific to sajdah). The English is more permissive."
      }
    ],
    differsBetweenMaraji: true,
    recitationIds: [
      "rukudhikrarabic"
    ]
  },
  {
    id: "rukustill",
    topicId: "rukusujud",
    subject: {
      en: "Stillness in rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "While performing rukūʿ, the body must be still and one must not intentionally move his body in a manner that it is no longer still, even when – based on obligatory precaution – he is not saying an obligatory dhikr. If a person intentionally does not observe this requirement to be still, then based on obligatory precaution, his prayer is invalid even if he says dhikr while his body is still.",
          ur: "رکوع کی حالت میں ضروری ہے کہ نماز پڑھنے والے کابدن ساکن ہو نیز ضروری ہے کہ وہ اپنے اختیار سے بدن کواس طرح حرکت نہ دے کہ اس پر ساکن ہونا صادق نہ آئے حتیٰ کہ( احتیاط کی بناپر)اگروہ واجب ذکرمیں مشغول نہ ہوتب بھی یہی حکم ہےاگر عمداً اطمینان کی رعایت نہ کرے تو (احتیاط واجب کی بنا پر) نماز باطل ہے یہاں تک کہ اگر وہ ذکر کو حالت استقرار میں دوہرائے تب بھی باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1016",
          url: "https://www.sistani.org/english/book/48/2234/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1016)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The body should be still while reciting the obligatory dhikr in rukū‘. Moreover, based on obligatory caution, the body should be still while reciting mustaḥabb dhikr with the intention of counting it a part of rukū‘, such as the repetition of subḥāna rabbīyal ‘aẓīmi wa biḥamdih.",
          ur: "رکوع میں واجب ذکر پڑھتے وقت بدن ساکن ہونا چاہئے بلکہ مستحب ہونے کے قصد سے پڑھنے والے اذکار کے دوران مثلا سُبْحانَ رَبِّیَ الْعَظیمِ وَ بِحَمْدِهِ کو تکرار کرے تو بھی احتیاط واجب یہ ہے کہ بدن کو سکون کی حالت میں رکھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "223.",
          url: "https://www.leader.ir/en/book/241?sn=32514"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 224",
          url: "https://www.leader.ir/ur/book/197/1?sn=31127"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 224",
          url: "https://www.leader.ir/fa/book/180/1?sn=30792"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "afterruku",
    topicId: "rukusujud",
    subject: {
      en: "Standing up after rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After completing the dhikr of rukūʿ, one must stand straight; and based on obligatory precaution, he must go into sajdah after his body has become still. If he intentionally goes into sajdah before standing, his prayer is invalid; and the same applies, based on obligatory precaution, if he intentionally goes into sajdah before his body has become still.",
          ur: "ضروری ہے کہ ذکررکوع ختم ہونے کے بعدسیدھاکھڑاہوجائے اور (احتیاط واجب کی بناء پر) جب اس کا بدن سکون حاصل کرلے اس کے بعدسجدے میں جائے اوراگرجان بوجھ کر کھڑےہونے سے پہلے یابدن کے سکون حاصل کرنے سے پہلے سجدے میں چلا جائے تو اس کی نمازباطل ہے اور(احتیاط واجب کی بناء پر) یہی حکم ہے اگر جان بوجھ کر بدن کے سکون حاصل کرنے سے پہلے سجدہ میں چلاجائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1026",
          url: "https://www.sistani.org/english/book/48/2234/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1026)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah. Thus, if a person intentionally goes to sajdah before standing straight or before his body becomes still, his prayer will be void.",
          ur: "نماز پڑھنے والا رکوع کا ذکر ختم ہونے کے بعد کھڑا ہوجائے اور بدن ساکن ہونے کے بعد سجدے میں جائے اور اگر کھڑا ہونے سے پہلے یا بدن ساکن ہونے سے پہلے عمداً سجدے میں چلا جائے تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "231.",
          url: "https://www.leader.ir/en/book/241?sn=32514"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 232",
          url: "https://www.leader.ir/ur/book/197/1?sn=31127"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 232",
          url: "https://www.leader.ir/fa/book/180/1?sn=30792"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "forgotruku",
    topicId: "rukusujud",
    subject: {
      en: "Forgetting rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person forgets to perform rukūʿ and remembers this before he performs sajdah, he must stand upright and then perform rukūʿ. It will not suffice if he performs rukūʿ while in the state of bending forward [not having stood upright].",
          ur: "اگرکوئی شخص رکوع اداکرنابھول جائے اور اس سے پیشترکہ سجدے کی حالت میں پہنچے اسے یادآجائے توضروری ہے کہ کھڑاہوجائے اورپھر رکوع میں جائے اورجھکے ہوئے ہونے کی حالت میں اگررکوع کی جانب لوٹ جائے توکافی نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1027",
          url: "https://www.sistani.org/english/book/48/2234/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1027)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person forgets to perform rukū‘, and before he performs the first sajdah, he recollects it, he should stand up and then go to rukū‘ (and it is not sufficient if he returns to rukū‘ from a bowing posture and if he does not make another rukū‘, his prayer is void).",
          ur: "اگر رکوع کرنا بھول جائے اور سجدے میں پہنچنے سے پہلے یاد آئے تو کھڑا ہوجائے اور قیام کی حالت سے رکوع میں جائے چنانچہ جھکے ہوئے ہونے کی حالت میں رکوع کی طرف جائے تو کافی نہیں ہے اور اگر اسی پر اکتفاء کرے تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "232.",
          url: "https://www.leader.ir/en/book/241?sn=32514"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 233",
          url: "https://www.leader.ir/ur/book/197/1?sn=31127"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 233",
          url: "https://www.leader.ir/fa/book/180/1?sn=30792"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "twosajdahs",
    topicId: "rukusujud",
    subject: {
      en: "The two sajdahs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ. A sajdah is performed when one places his forehead on the ground in a particular manner with the intention of humility [before Allah]. While performing a sajdah in prayers, it is obligatory that the palms of both hands, both knees, and both big toes be placed on the ground. Based on obligatory precaution, [for the purposes of sajdah] the ‘forehead’ refers to its middle area, i.e. the rectangular area when two imaginary lines are drawn between the place where the eyebrows begin in the middle of the forehead up to the point where the hair grows.",
          ur: "نمازپڑھنے والے کے لئے ضروری ہے کہ واجب اورمستحب نمازوں کی ہررکعت میں رکوع کے بعددوسجدے کرے۔سجدہ یہ ہے کہ خاص شکل میں پیشانی کوخضوع کی نیت سے زمین پر رکھے اورنماز کے سجدے کی حالت میں واجب ہے کہ دونوں ہتھیلیاں ، دونوں گھٹنے اوردونوں پاؤں کے انگوٹھے زمین پررکھے جائیں اور پیشانی سے مراد( احتیاط واجب کی بناء پر) اس کا درمیانی حصہ ہے اور دونوں ابرؤں اور سر پر بال کے اگنے کی جگہ کے درمیان دو فرضی لائنوں کے کھینچے جانے کی صورت میں ظاہر ہونے والی چوڑائی کو پیشانی کہتے ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1031",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1031)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah.",
          ur: "واجب او رمستحب نمازوں کی ہر رکعت میں رکوع کے بعد دو سجدے بجالائے یعنی خدا کے حضور خضوع سے پیشانی کو زمین پر رکھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "236.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 237",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 237",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sevenparts",
    topicId: "rukusujud",
    subject: {
      en: "The seven parts of the body in sajdah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In sajdah, one must place his two palms on the ground; and based on obligatory precaution, one must place the whole of his palms on the ground if possible. However, if it is not possible, there is no problem in him placing the back of his hand on the ground. If placing the back of the hand is not possible either, he must place his wrists on the ground based on obligatory precaution. In the event that this is not possible, he must place any part of his forearm up to his elbows on the ground. And if even this is not possible, then placing the upper arm on the ground is sufficient.",
          ur: "ضروری ہے کہ سجدے میں دونوں ہتھیلیاں زمین پررکھے( اور احتیاط واجب کی بناء پر) ممکنہ صورت میں پوری ہتھیلی کو رکھے، لیکن مجبوری کی حالت میں ہاتھوں کی پشت بھی زمین پررکھے توکوئی حرج نہیں اوراگرہاتھوں کی پشت بھی زمین پررکھناممکن نہ ہوتو(احتیاط واجب کی بناپر) ضروری ہے کہ ہاتھوں کی کلائیاں زمین پررکھے اوراگرانہیں بھی نہ رکھ سکے توپھرکہنی تک جوحصہ بھی ممکن ہوزمین پررکھے اور اگریہ بھی ممکن نہ ہوتوپھربازوکارکھنابھی کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1047",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1047)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In sajdah, it is obligatory to place seven body parts on the ground: the forehead, the palms, the knees, and the tips of both big toes.",
          ur: "سجدے میں پیشانی کے علاوہ دونوں ہاتھوں کی ہتھیلی، دونوں گھٹنوں اور دونوں پاوں کے انگوٹھوں کی نوک کو زمین پر رکھا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "237.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 238",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 238",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "sajdahrukn",
    topicId: "rukusujud",
    subject: {
      en: "The two sajdahs together are a rukn"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Two sajdahs together comprise one rukn, and if someone does not perform both of them in obligatory prayers in one rakʿah – even if this is due to forgetfulness or not knowing the ruling – his prayer is invalid. The same applies, based on obligatory precaution, if one adds two sajdahs in one rakʿah forgetfully or due to inculpable ignorance (al‑jahl al‑quṣūrī). (Inculpable ignorance is when someone has a valid excuse for not knowing.)",
          ur: "دوسجدے مل کرایک رکن ہیں اوراگرکوئی شخص واجب نمازمیں ( مسئلہ نہ جاننے کی بناپر یا بھولے سے) ایک رکعت میں دونوں سجدے ترک کردے تواس کی نمازباطل ہے اور اگر بھول کریا جاہل قاصر ہونے کی صورت میں ایک رکعت میں دوسجدوں کااضافہ کرے تو(احتیاط لازم کی بناپر)یہی حکم ہے(اور جاہل قاصر سے مراد وہ شخص ہےجو اپنے جاہل ہونے کا عذر رکھتا ہو)۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1032",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1032)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The two sajdah in one rak‘ah together comprise one foundational element (rukn), meaning that if a person, intentionally or forgetfully, abandons them or adds two more sajdah to them, his prayer becomes void.",
          ur: "ایک رکعت میں دونوں سجدے مل کر رکن ہیں بنابرایں اگر جان بوجھ کر یا بھولے سے دونوں ترک ہوجائیں یا دو سجدے زیادہ ہوجائیں تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "238.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 239",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 239",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahdhikr",
    topicId: "rukusujud",
    subject: {
      en: "The dhikr of sajdah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1035",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. The English 4th edition publishes this dhikr only as an image, so it is quoted here exactly as the English book has it (with the image left unretyped); the Arabic itself is shown separately as a sourced recitation (P12), taken from the official Urdu edition, not spliced into this English quote.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The obligatory dhikr in sajdah is to say subḥāna rabbī al‘alā wa biḥamdih once or subḥānallāh three times, and it is sufficient if a person says another dhikr such as alḥamdu lillāh, Allāhu akbar or another dhikr — except for rukū‘ dhikr — to the same amount.",
          ur: "سجدے کا واجب ذکر ایک دفعہ سُبْحانَ رَبِّیَ الْاَعْلی وَ بِحَمْدِهِ یا تین دفعہ سُبْحانَ اللهِ پڑھنا ہے اور اگر اس کے بجائے ( رکوع کے مخصوص ذکر کے علاوہ) کوئی اور ذکر مثلا اَلْحَمْدُ لِلّهِ، اَللهُ اَکْبَرُ وغیرہ اسی مقدار میں پڑھے تو کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "243.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 244",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 244",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true,
    recitationIds: [
      "sajdahdhikrarabic"
    ]
  },
  {
    id: "dhikrwording",
    topicId: "rukusujud",
    subject: {
      en: "Wording of the rukūʿ and sajdah dhikr"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Translations of the dhikr of rukū‘ and sajdah and some mustaḥabb phrases are as follows:\nسُبْحَانَ الله\nGlorified is God\nسُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him\nسُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the Highest, and I praise Him\nسمع الله لمن حمده\nMay God attend to the one who praises Him.\nأستغفرالله ربی و أتوب علیه\nI ask God, my Lord, to forgive me, and I return to Him.\nبحول الله و قوته أقوم و أقعد\nWith the will of God and His power, I stand and I sit.",
          ur: "رکوع اور سجدوں کے اذکار اور بعض مستحب اذکار کا ترجمہ:\nسُبْحَانِ اللهِ خدا پاک اور منزہ ہے۔\nسُبْحَانَ رَبِّیَ الْعَظیمِ وَ بِحَمْدِه میرا عظیم پروردگار پاک و منزہ ہے اور میں اس کی ستائش میں مشغول ہوں۔\nسُبْحانَ رَبِّیَ الْاَعْلی وَ بِحَمْدِهِ میرا پروردگار پاک و منزہ اور سب سے بالاتر ہے اور میں اس کی ستائش میں مشغول ہوں۔\nسَمِعَ اللهُ لِمَنْ حَمِدَهُ خدا کی عنایت اس پر ہو جو اس کی ستائش کرتا ہے۔\nاَسْتَغْفِرُ اللهَ رَبِّی وَ اَتُوبُ اِلَیْهِ میں اس خدا سے مغفرت چاہتا ہوں جو میرا پروردگار ہے اور میں اس کی طرف رجوع کرتا ہوں۔\nبِحَوْلِ اللهِ وَ قُوَّتِهِ اَقُومُ وَ اَقْعُدُ میں خدا کی قوت اور ارادے سے اٹھتا اور بیٹھتا ہوں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "318.",
          url: "https://www.leader.ir/en/book/241?sn=32524"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 319",
          url: "https://www.leader.ir/ur/book/197/1?sn=31138"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 319",
          url: "https://www.leader.ir/fa/book/180/1?sn=30803"
        },
        verification: "A",
        arabicInSource: true
      }
    ]
  },
  {
    id: "betweensajdahs",
    topicId: "rukusujud",
    subject: {
      en: "Sitting between the two sajdahs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again.",
          ur: "پہلے سجدے کاذکرختم ہونے کے بعدضروری ہے کہ بیٹھ جائے حتیٰ کہ اس کابدن سکون حاصل کرلے اورپھردوبارہ سجدے میں جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1042",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1042)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again.",
          ur: "پہلے سجدے کا ذکر ختم ہونے کے بعد بیٹھے تاکہ بدن ساکن ہوجائے اور دوبارہ سجدے میں جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "255.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 256",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 256",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahheight",
    topicId: "rukusujud",
    subject: {
      en: "Height of the place of the forehead"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In sajdah, the difference in height between the place where one places his forehead and where he places his knees and toes must not be more than the height of four closed fingers. In fact, the obligatory precaution is that the difference in height between the place where he places his forehead and the place where he stands must also not be more than four closed fingers."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1043",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The place where a person puts his forehead for sajdah should not be more than four joined fingers lower or higher than the place where he places his knees and the tips of his toes.",
          ur: "سجدے کی حالت میں پیشانی کی جگہ گھٹنوں اور پاوں کی انگلیوں کی جگہ سے چار ملی ہوئی انگلیوں کی مقدار سے نیچی یا بلند نہیں ہونا چاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "258.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 259",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 259",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahbarrier",
    topicId: "rukusujud",
    subject: {
      en: "Nothing between the forehead and the turbah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There must not be a barrier between one’s forehead and the thing on which it is permitted to perform sajdah. Therefore, if the turbah is so dirty that his forehead does not make contact with the turbah itself, the sajdah is invalid. However, if, for example, only the colour of the turbah has changed, there is no problem.",
          ur: "ضروری ہے کہ نمازپڑھنے والے کی پیشانی اوراس چیزکے درمیان جس پرسجدہ کرناصحیح ہے کوئی دوسری چیزکا فاصلہ نہ ہوپس اگرسجدہ گاہ اتنی میلی ہوکہ پیشانی سجدہ گاہ کو نہ چھوئے تواس کاسجدہ باطل ہے۔ لیکن اگرسجدہ گاہ کارنگ تبدیل ہوگیاہوتوکوئی حرج نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1046",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1046)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "There should not be any barrier such as hair or a hat between the forehead and what the sajdah is done on.",
          ur: "ضروری ہے کہ پیشانی اور سجدہ گاہ کے درمیان سر کے بال اور ٹوپی وغیرہ حائل نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "260.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 261",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 261",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "turbahpure",
    topicId: "rukusujud",
    subject: {
      en: "The place of the forehead must be pure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The part of the turbah or the thing on which it is permitted to perform sajdah must be pure. However, if, for example, one places a turbah on an impure carpet, or if one side of the turbah is impure and he places his forehead on its pure side, or if one part of the turbah is pure and another impure, then as long as it does not make the forehead impure, there is no problem.",
          ur: "سجدہ گاہ یادوسری چیزجس پرنمازپڑھنے والاسجدے کرے ضروری ہے کہ پاک ہو لیکن اگرمثال کے طورپرسجدہ گاہ کونجس فرش پررکھ دے یاسجدہ گاہ کی ایک طرف نجس ہواوروہ پیشانی پاک طرف رکھے توکوئی حرج نہیں ہے اور اگر سجدہ گاہ کاکچھ حصہ نجس اور کچھ حصہ پاک ہو اور پیشانی کو نجس نہ کرے تو اشکال نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1051",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1051)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The turbah or another thing on which a person prostrates should be pure, but there is no problem if he puts it on a najis carpet or if one side of it is najis and he places his forehead on the pure side.",
          ur: "سجدہ گاہ یا وہ چیز جس پر سجدہ کرے، پاک ہونی چاہئے لیکن نجس فرش پر سجدہ گاہ رکھنا چنانچہ بدن اور لباس تک نجاست سرایت نہ کرے یا سجدہ گاہ کی ایک طرف نجس ہونا جب کہ پیشانی کو پاک طرف رکھے تو کوئی اشکال نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "259.",
          url: "https://www.leader.ir/en/book/241?sn=32515"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 260",
          url: "https://www.leader.ir/ur/book/197/1?sn=31128"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 260",
          url: "https://www.leader.ir/fa/book/180/1?sn=30793"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahearth",
    topicId: "sajdahplace",
    subject: {
      en: "Earth and what grows from it"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must perform sajdah on earth and on those things that grow from the earth but are neither edible nor worn, such as wood and the leaves of trees. It is not permitted to perform sajdah on edible things, nor on things that are worn, such as wheat, barley, and cotton. Furthermore, it is not permitted to perform sajdah on things that are not considered parts of the earth, such as gold, silver, and suchlike. However, when one is compelled, performing sajdah on tar and asphalt (which is a lower grade of tar) take precedence over other things on which it is not permitted to perform sajdah.",
          ur: "سجدہ زمین پراوران چیزوں پرکرناضروری ہے جوکھائی اورپہنی نہ جاتی ہوں اور زمین سے اگتی ہوں مثلاً لکڑی اوردرختوں کے پتے پرسجدہ کرے۔ کھانے اور پہننے کی چیزوں مثلاً گندم،جو اورکپاس پراوران چیزوں پرجوزمین کے اجزاء میں شمار نہیں ہوتیں مثلاً سونے، چاندی اوراسی طرح کی دوسری چیزوں پرسجدہ کرناصحیح نہیں ہے لیکن تارکول اور بیروزا(ایک قسم کاگندا تارکول)کومجبوری کی حالت میں دوسری چیزوں کے مقابلے میں کہ جن پر سجدہ کرناصحیح نہیں سجدے کے لئے اولویت دے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1062",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1062)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Sajdah should be performed on earth or non-edible plants which grow on earth, including stone, soil, wood, leaves of trees and the like. Sajdah is not permissible on what is edible or worn, even though it may grow on the earth, such as cotton and wheat. Also, sajdah on minerals which are not considered earth, such as metals, glass, or the like, is invalid."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "265.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 266",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A",
        urduNote: "The official Urdu edition differs from the Persian original in this ruling, so only the English, which matches the Persian, is shown (decision R11)."
      }
    ]
  },
  {
    id: "sajdahfodder",
    topicId: "sajdahplace",
    subject: {
      en: "Plants eaten only by animals"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is permitted to perform sajdah on something that originates from the ground and is food for animals, such as grass and straw.",
          ur: "جوچیزیں زمین سے اگتی ہیں اورحیوانات کی خوراک ہیں مثلاً گھاس اور بھوساان پرسجدہ کرناصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1064",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1064)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Performing sajdah on what grows on earth and is served only as fodder for animals, such as grass, hay, etc., is valid.",
          ur: "ایسی چیزوں پر سجدہ صحیح ہے جو زمین سے اگتی ہیں اور فقط حیوانات کی خوراک ہیں مثلا بھوسا ًاور گھاس ۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "268.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 269",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 269",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahbuilding",
    topicId: "sajdahplace",
    subject: {
      en: "Limestone, gypsum and building materials"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is permitted to perform sajdah on limestone and gypsum. Moreover, there is no problem in performing sajdah on baked gypsum, baked lime, brick, and a clay pitcher.",
          ur: "چونے اورجپسم کے پتھرپرسجدہ کرناصحیح ہےبلکہ پختہ جپسم اورچونے اوراینٹ اورمٹی کے پکے ہوئے برتنوں اور ان سے ملتی جلتی چیزوں پرسجدہ کرنے میں کوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1067",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1067)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Prostrating on the brick, clay, gypsum, limestone, and cement is valid.",
          ur: "اینٹ، مٹی کے برتن، جپسم، چونے کے پتھر اور سیمنٹ پر سجدہ کرنا صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "267.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 268",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 268",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahpaper",
    topicId: "sajdahplace",
    subject: {
      en: "Paper"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is permitted to perform sajdah on writing paper made from something on which it is permitted to perform sajdah, such as wood and grass; the same applies if it is made out of cotton or flax. However, if it is made out of silk and suchlike, performing sajdah on it is not permitted. As for performing sajdah on tissue paper, it is only permitted if one knows that it is made out of something on which it is permitted to perform sajdah.",
          ur: "اگر لکھنے کےکاغذکوایسی چیزسے بنایاجائے کہ جس پرسجدہ صحیح ہے مثلاً لکڑی اور بھوسے سے تو اس پرسجدہ کیاجاسکتاہے اوراسی طرح اگرروئی یاکتان سے بنایاگیاہو تو بھی اس پرسجدہ کرناصحیح ہے لیکن اگرریشم یاابریشم اوراسی طرح کی کسی چیزسے بنایاگیاہو تو اس پرسجدہ صحیح نہیں ہے لیکن ٹیشو پیپر پر صرف اسی صورت میں سجدہ کرسکتے ہیں جب معلوم ہو کہ یہ ایسی چیز سے بنایا گیاہے جس پر سجدہ صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1068",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1068)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Sajdah on a piece of paper made of wood and plants (except for flax and cotton) is valid.",
          ur: "لکڑی اور گھاس (پٹ سن اور روئی کے علاوہ) سے تیارہ شدہ کاغذ پر سجدہ صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "272.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 273",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 273",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahbest",
    topicId: "sajdahplace",
    subject: {
      en: "The best thing to perform sajdah on"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The best thing on which to perform sajdah is the turbah of His Eminence Sayyid al-Shuhadāʾ [Imam al-Ḥusayn] (ʿA), and after that, earth, then stone, and then grass.",
          ur: "سجدے کے لئے خاک شفاسب چیزوں سے بہترہے اس کے بعد مٹی، مٹی کے بعدپتھراورپتھرکے بعدگھاس ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1069",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1069)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The best object to use for sajdah is soil and earth, because it is a sign of humility before God, the Almighty, and no soil approaches the great merits of the blessed soil of the grave of Imam al-Husayn (a).",
          ur: "مٹی اور زمین پر سجدہ کرنا سب سے بہترین سجدہ ہے جو خدا کے حضور خضوع و خشوع کی علامت ہے اور سجدے کے لئےکوئی بھی مٹی تربت مقدس سید الشہداء علیہ السلام کے برابر فضیلت نہیں رکھتی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "277.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 278",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 278",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sajdahnothing",
    topicId: "sajdahplace",
    subject: {
      en: "When nothing permitted is available"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person does not have anything on which it is permitted to perform sajdah, or if he does have something but cannot perform sajdah on it on account of severe heat or cold and suchlike, then performing sajdah on tar and asphalt takes precedence over performing sajdah on other things. However, if it is not possible to perform sajdah on them, one must perform sajdah on his clothes or any other thing on which performing sajdah is not permitted in normal circumstances. However, the recommended precaution is that as long as it is possible for one to perform sajdah on his clothes, he should not perform sajdah on anything else.",
          ur: "اگرکسی کے پاس ایسی چیزنہ ہوجس پرسجدہ کرناصحیح ہے یااگرہوتو سردی یازیادہ گرمی وغیرہ کی وجہ سے اس پرسجدہ نہ کرسکتاہوتوایسی صورت میں تارکول اور گندا بیروزاکوسجدے کے لئے دوسری چیزوں پراولویت حاصل ہے لیکن اگران پرسجدہ کرنا ممکن نہ ہوتوضروری ہے کہ اپنے لباس یا ہراس چیز پرجس پر حالت اختیار میں سجدہ جائزنہیں سجدہ کرے لیکن احتیاط مستحب یہ ہے کہ جب تک کپڑے پرسجدہ ممکن ہوکسی دوسری چیزپرسجدہ نہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1070",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1070)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person does not have anything on which he is allowed to perform sajdah, or he has such a thing but cannot perform sajdah on it due to severe heat or cold, he should perform sajdah on his clothes or something else made of flax or cotton. By obligatory caution, if it is possible to prostrate on clothes made of cotton or flax, a person should not prostrate on clothes which are not made of cotton or flax. If, however, he does not have these things, he may perform sajdah on the back of his hand, by obligatory caution.",
          ur: "اگر ایسی چیز نہ ہو جس پر سجدہ صحیح ہے یا سردی یا گرمی وغیرہ کی وجہ سے اس پر سجدہ کرنا ممکن نہ ہو چنانچہ روئی یا پٹ سن سے تیار شدہ لباس یا روئی اور پٹ سن سے تیار شدہ کوئی اور چیز ہو تو اس پر سجدہ کرے اور احتیاط واجب یہ ہے کہ جب تک روئی اور پٹ سن سے تیارشدہ لباس ممکن ہو دوسری جنس سے تیار شدہ لباس پر سجدہ نہ کرے اور ایسی اشیاء اختیار میں نہ ہوں تو احتیاط واجب کی بناپر ہاتھ کی پشت پر سجدہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "273.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 274",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 274",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "sajdahtaqiyyah",
    topicId: "sajdahplace",
    subject: {
      en: "Sajdah under taqiyyah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In a situation where one must observe taqiyyah, he can perform sajdah on a rug or something similar, and it is not necessary he go to another place to perform prayers or delay prayers to perform them in that place once the reason for observing taqiyyah is no longer valid. However, if in the same place he can perform sajdah on haṣīr or something else that is valid to perform sajdah on in a manner that does not contravene taqiyyah, then he must not perform sajdah on a rug or something similar.",
          ur: "جہاں انسان کے لئے تقیہ کرناضروری ہے وہاں وہ قالین یااس طرح کی چیزپرسجدہ کرسکتا ہے اوریہ ضروری نہیں کہ نمازکے لئے کسی دوسری جگہ جائے یانماز کو مؤخر کرے تاکہ اسی جگہ پراس سبب تقیہ کے ختم ہونے کے بعدنمازاداکرے۔ لیکن اگراسی جگہ چٹائی یاکسی دوسری چیزجس پرسجدہ کرناصحیح ہواگروہ اس طرح سجدہ کرسکتا ہو کہ تقیہ کی مخالفت نہ ہوتی ہوتوضروری ہے کہ پھروہ قالین یااس سے ملتی جلتی چیزپر سجدہ نہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1058",
          url: "https://www.sistani.org/english/book/48/2235/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1058)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "When a person has to observe taqiyyah, he can perform sajdah on a carpet or other similar objects, and it is not necessary for him to go somewhere else to perform the prayer. In case, however, he can perform sajdah in the same place on a straw mat, stone, or the like without any difficulty, he should do so by obligatory caution.",
          ur: "جہاں تقیہ واجب ہو فرش وغیرہ پر سجدہ کرسکتا ہے اور نماز کے لئے دوسری جگہ جانا لازم نہیں ہے لیکن اگر اسی جگہ کسی زحمت کے بغیر چٹائی یا پتھر وغیرہ پر سجدہ کرسکتا ہو تو احتیاط واجب کی بناپر ان اشیاء پر سجدہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "275.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 276",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 276",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "sajdahforother",
    topicId: "sajdahplace",
    subject: {
      en: "Sajdah for other than Allah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is unlawful to perform sajdah for any being other than Allah the Exalted. Some people place their forehead on the ground in front of the graves of the Infallible Imams (ʿA); if they do this for offering thanks to Allah the Exalted, there is no problem; otherwise, it is problematic [i.e. based on obligatory precaution, it must not be done].",
          ur: "اللہ تعالیٰ کے علاوہ کسی دوسرے کوسجدہ کرناحرام ہے۔ عوام میں سے بعض لوگ جوائمہ علیہم السلام کے مزارات مقدسہ کے سامنے پیشانی زمین پررکھتے ہیں اگروہ اللہ تعالیٰ کاشکراداکرنے کی نیت سے ایساکریں توکوئی حرج نہیں ورنہ ایساکرنامشکل ہے۔"
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1076",
          url: "https://www.sistani.org/english/book/48/2236/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1076)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is forbidden to perform sajdah for anyone other than the Almighty God. Regarding placing the forehead on the earth before the last entrance to the shrine — i.e. under the dome — of the Imams (a), if this is done with the intention of prostrating to thank God Almighty, there is no problem with it; otherwise, it is forbidden.",
          ur: "اللہ تعالی کے علاوہ کسی اور کو سجدہ کرنا حرام ہے اور بعض لوگ ائمہ علیہم السلام کے مزارات کے سامنے پیشانی کو زمین پر رکھتے ہیں، اگر اللہ تعالی کا شکر ادا کرنے کی نیت سے ایسا کریں تو اشکال نہیں ہے ورنہ حرام ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "280.",
          url: "https://www.leader.ir/en/book/241?sn=32516"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 281",
          url: "https://www.leader.ir/ur/book/197/1?sn=31129"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 281",
          url: "https://www.leader.ir/fa/book/180/1?sn=30794"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "quransajdah",
    topicId: "sajdahplace",
    subject: {
      en: "The obligatory sajdahs of the Qur'an"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In each of the four surahs al-Sajdah, Fuṣṣilat, al-Najm, and al-ʿAlaq, there is a verse of sajdah, which means that if one recites this verse or listens to it, he must immediately perform sajdah after the verse has finished. If he forgets to do this, he must perform sajdah whenever he remembers. Performing sajdah is not obligatory if one hears such a verse involuntarily, although it is better that he does."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1079",
          url: "https://www.sistani.org/english/book/48/2238/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In each of the four chapters of the holy Qur’an — chapter al-Sajdah, chapter Fuṣṣilat, chapter al-Najm, and chapter al-‘Alaq — there is a verse of obligatory sajdah. If you recite the whole verse or listen to it, you are immediately required to make sajdah. if you forget to perform it, you should do so when you remember.*\n\n* The verses of obligatory sajdah are 32:15, 41:37, 53:62, and 96:19.",
          ur: "چار سوروں سورہ سجدہ (الم تنزیل)، فصلت (حم سجدہ)، نجم اور علق میں سے ہر ایک میں واجب سجدے کی ایک آیت ہے جسےاگر انسان پڑھے یا سنے تو اس کے ختم ہونے کے فوراً بعد سجدہ کرنا ضروری ہے اور اگرسجدہ کرنا بھول جائے تو جب بھی یاد آئے سجدے کو انجام دے۔\n* سجدے والی آیات: 1۔ سورہ سجدہ، آیت 15۔ 2۔ سورہ فصلت، آیت37۔ 3۔ سورہ نجم، آیت62۔ 4۔ سورہ علق، آیت19"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "281.",
          url: "https://www.leader.ir/en/book/241?sn=32517"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 282",
          url: "https://www.leader.ir/ur/book/197/1?sn=31130"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 282",
          url: "https://www.leader.ir/fa/book/180/1?sn=30795"
        },
        verification: "A",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "tashahhud",
    topicId: "tashahhudsalam",
    subject: {
      en: "Tashahhud"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad\nI testify that there is no god but Allah, He alone, for whom there is no partner. And I testify that Muḥammad is His servant and His messenger. O Allah! Bless Muḥammad and the progeny of Muḥammad.\nAnd it is sufficient for one to say:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا صَلَّى اللهُ عَلَيْهِ وَآلِهِ عَبْدُهُ وَرَسُوْلُهُ\nashhadu an lā ilāha illal lāh, wa ashhadu anna muḥammadan ṣallal lāhu ʿalayhi wa ālihi ʿabduhu wa rasūluh\nI testify that there is no god but Allah. And I testify that Muḥammad – may Allah shower His blessings upon him and his progeny – is His servant and His messenger.\nTashahhud is also necessary in the witr prayer."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1086",
          url: "https://www.sistani.org/english/book/48/2239/"
        },
        verification: "A",
        arabicInSource: true,
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ",
          ur: "تشہد کی حالت میں واجب ذکر یہ ہے: اَشْهَدُ اَنْ لاَ اِلهَ اِلاَّ اللهُ وَحْدَهُ لاَ شَریْکَ لَهُ و اَشْهَدُ اَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ، اللّهُمَّ صَلِّ عَلی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "289.",
          url: "https://www.leader.ir/en/book/241?sn=32518"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 290",
          url: "https://www.leader.ir/ur/book/197/1?sn=31131"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 290",
          url: "https://www.leader.ir/fa/book/180/1?sn=30796"
        },
        verification: "A",
        arabicInSource: true
      }
    ]
  },
  {
    id: "tashahhudforgot",
    topicId: "tashahhudsalam",
    subject: {
      en: "Forgetting tashahhud"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person forgets tashahhud, stands up, and remembers before going into rukūʿ that he has not performed it, he must sit down, say tashahhud, stand up again, recite everything that must be recited in that rakʿah, and complete the prayer. And based on recommended precaution, after completing the prayer, he should perform sajdatā al‑sahw for standing without due reason. However, if he remembers [that he has not said tashahhud] during or after performing rukūʿ, then he must complete the prayer. And based on recommended precaution, after the salām of the prayer, he should perform qaḍāʾ of the tashahhud, and he must perform sajdatā al‑sahw for the forgotten tashahhud."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1088",
          url: "https://www.sistani.org/english/book/48/2239/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who forgets tashahhud and stands up for the third rak‘ah, if he remembers that he has not recited tashahhud before going to rukū‘, he has to sit, recite tashahhud, stand up again, say tasbīḥ of the third rak‘ah, and finish the prayer. Then, based on mustaḥabb caution, he performs two sahw sajdah because of his wrongly standing.",
          ur: "اگر تشہد پڑھنا بھول جائے اور تیسری رکعت کے لئے کھڑا ہوجائے لیکن رکوع سے پہلے یاد آئے تو بیٹھ جائے اور تشہد پڑھے اور دوبارہ کھڑے ہوکر تیسری رکعت کی تسبیحات کو دوبارہ پڑھے اور نماز جاری رکھے اور نماز کے بعد بے جا قیام کے لئے احتیاط مستحب کی بناپر دو سجدہ سہو بجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "292.",
          url: "https://www.leader.ir/en/book/241?sn=32518"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 293",
          url: "https://www.leader.ir/ur/book/197/1?sn=31131"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 293",
          url: "https://www.leader.ir/fa/book/180/1?sn=30796"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "salam",
    topicId: "tashahhudsalam",
    subject: {
      en: "Salām"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After completing tashahhud of the last rakʿah of the prayer, it is recommended that while one is sitting and his body is still, he should say:\nاَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\nassalāmu ʿalayka ayyuhan nabiyyu wa raḥmatul lāhi wa barakātuh\nPeace be upon you O Prophet, and Allah’s mercy and His blessings (be upon you too).\nAnd after that, he must say:\nاَلسَّلَامُ عَلَيْكُمْ\nassalāmu ʿalaykum\nPeace be upon you.\nAnd the recommended precaution is that [after saying assalāmu ʿalaykum,] one adds the sentence:\nوَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\nwa raḥmatul lāhi wa barakātuh\nAnd Allah’s mercy and His blessings (be upon you too).\nOr [i.e. instead of saying assalāmu ʿalaykum], one must say:\nاَلسَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللهِ الصَّالِحِيْنَ\nassalāmu ʿalaynā wa ʿalā ʿibādil lāhiṣ ṣāliḥīn\nPeace be upon us and upon the righteous servants of Allah.\nHowever, if he says this, then the obligatory precaution is that he must also say after it:\nاَلسَّلَامُ عَلَيْكُمْ\nassalāmu ʿalaykum\nPeace be upon you.",
          ur: "نماز کی آخری رکعت کے تشہدکے بعدجب نمازی بیٹھاہواور اس کا بدن سکون کی حالت میں ہوتومستحب ہے کہ وہ کہے: ’’اَلسَّلاَمُ عَلَیْکَ اَیُّھَاالنَّبِیُّ وَرَحْمَۃُ اللہِ وَبَرَکَاتُہٗ‘‘ اوراس کے بعد ضروری ہے کہ کہے: ’’اَلسَّلاَمُ عَلَیْکُمْ‘‘ (اور احتیاط مستحب یہ ہے کہ’’اَلسَّلاَمُ عَلَیْکُمْ‘‘ کے جملے کے ساتھ’’وَرَحْمَۃُ اللہِ وَبَرَکَاتُہٗ‘‘ کے جملے کااضافہ کرے)یایہ کہے: ’’اَلسَّلاَمُ عَلَیْنَاوَعَلیٰ عِبَادِاللہِ الصَّالِحِیْنَ‘‘ لیکن اگراس سلام کوپڑھے تواحتیاط واجب یہ ہے کہ اس کے بعد ’’اَلسَّلاَمُ عَلیْکُمْ‘‘ بھی کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1091",
          url: "https://www.sistani.org/english/book/48/2240/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1091)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A",
        arabicInSource: true,
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The last part of prayer, with the recitation of which the prayer ends, is salām. The obligatory salām of prayer is to say assalāmu ‘alaykum, and it is better to add to it, wa raḥmatullāhi wa barakātuh, or to say assalāmu ‘alaynā wa ‘alā ‘ibādillāhiṣ ṣāliḥīn.",
          ur: "سلام نماز کا آخری جزء ہے جس کو کہنے کے بعد نماز ختم ہوجاتی ہے۔ نماز کا واجب سلام یہ ہے کہ کہے: اَلسَّلاَمُ عَلَیْکُم اور بہتر ہے کہ وَ رَحْمَةُ اللهِ وَ بَرَکاتُهُ کو بھی اضافہ کرے یا کہے: اَلسَّلاَمُ عَلَیْنَا وَ عَلی عِبادِ اللهِ الصّالِحینَ."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "294.",
          url: "https://www.leader.ir/en/book/241?sn=32519"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 295",
          url: "https://www.leader.ir/ur/book/197/1?sn=31132"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 295",
          url: "https://www.leader.ir/fa/book/180/1?sn=30798"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "salamforgot",
    topicId: "tashahhudsalam",
    subject: {
      en: "Forgetting salām"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person forgets the salām of the prayer and remembers it before the form of the prayer has broken up, and if he has neither intentionally nor inadvertently done something that would invalidate his prayer – such as turning his back to qibla – then he must say the salām and his prayer is valid.",
          ur: "اگرکوئی شخص نمازکاسلام کہنابھول جائے اوراسے ایسے وقت یاد آئے جب ابھی نمازکی شکل ختم نہ ہوئی ہواوراس نے کوئی ایساکام بھی نہ کیاہوجسے عمداً اور سہواًکرنے سے نمازباطل ہوجاتی ہومثلاً قبلے کی طرف پیٹھ کرناتوضروری ہے کہ سلام کہے اوراس کی نمازصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1092",
          url: "https://www.sistani.org/english/book/48/2240/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1092)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person forgets to recite the salām of prayer, and remembers before the form of the prayer is disturbed and before performing any acts that invalidate the prayer both intentionally and inadvertently — such as turning away from the qiblah, he should recite salām, and his prayer is correct.",
          ur: "اگر نماز کا سلام کہنا بھول جائے اور اس وقت یاد آئے کہ ابھی نماز کی شکل ختم نہ ہوئی ہو اور ایسا کام بھی نہ کیا ہو جس کو عمداً یا بھول کر انجام دینے سے نماز باطل ہوجاتی ہے مثلا ًقبلے سے رخ موڑنا، تو سلام کہے اور نماز صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "297.",
          url: "https://www.leader.ir/en/book/241?sn=32519"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 298",
          url: "https://www.leader.ir/ur/book/197/1?sn=31132"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 298",
          url: "https://www.leader.ir/fa/book/180/1?sn=30798"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "tartib",
    topicId: "tashahhudsalam",
    subject: {
      en: "Sequence (tartīb)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person intentionally breaks the sequence of prayers – for example, he recites the other surah before Sūrat al-Ḥamd, or he performs sajdah before rukūʿ – his prayer becomes invalid.",
          ur: "اگرکوئی شخص جان بوجھ کرنماز کی ترتیب الٹ دے مثلاً الحمدسے پہلے سورہ پڑھ لے یارکوع سے پہلے سجدے بجالائے تواس کی نمازباطل ہوجاتی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1094",
          url: "https://www.sistani.org/english/book/48/2241/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1094)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who is offering the prayer should observe the sequence of the acts of prayer. Therefore, if he intentionally does not observe the sequence of acts in the prayer, for example, if he recites the second chapter before chapter al-Fātiḥah or if he performs the two sajdah before rukū‘, his prayer is void.",
          ur: "نماز پڑھنے والے کے لئے ضروری ہے کہ نماز کو بتائی گئی ترتیب کے مطابق پڑھے اور ہر جزء کو اس کے مخصوص مقام پر ادا کرے بنابرایں اگر کوئی عمداً اس ترتیب کی رعایت نہ کرے مثلا ًالحمد سے پہلے سورہ پڑھے یا رکوع سے پہلے سجدہ کرے تو اس کی نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "298.",
          url: "https://www.leader.ir/en/book/241?sn=32520"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 299",
          url: "https://www.leader.ir/ur/book/197/1?sn=31133"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 299",
          url: "https://www.leader.ir/fa/book/180/1?sn=30799"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "muwalat",
    topicId: "tashahhudsalam",
    subject: {
      en: "Close succession (muwālāh)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must perform the [parts of the] prayer in close succession, i.e. he must perform acts such as rukūʿ, sujūd, and tashahhud one after the other, and he must say those things that are said in prayers one after the other in a normal manner. If a person delays between the acts to the extent that it cannot be said he is performing prayers, his prayer is invalid.",
          ur: "ضروری ہے کہ انسان نمازموالات کے ساتھ پڑھے یعنی نماز کے افعال مثلاًرکوع، سجوداورتشہدتواتراورتسلسل کے ساتھ بجالائے اور جوچیزیں بھی نماز میں پڑھے معمول کے مطابق پے درپے پڑھے اوراگران کے درمیان اتنافاصلہ ڈالے کہ لوگ یہ نہ کہیں کہ نمازپڑھ رہاہے تواس کی نمازباطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1100",
          url: "https://www.sistani.org/english/book/48/2242/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1100)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The praying person should perform the acts of the prayer successively, meaning that he should not leave a lengthy unusual gap between the acts of prayer, such as rukū‘, sajdah and tashahhud. Therefore, if a person leaves a lengthy break between the acts of prayer so that, according to an onlooker, it seems like he is not praying, the prayer is void.",
          ur: "نماز پڑھنےوالے کو چاہئے کہ نماز کے اجزاء مثلا ًرکوع، سجدہ اور تشہد وغیرہ کو پے در پے بجالائے اور ان کے درمیان طویل اور غیرمعمولی فاصلہ نہ ڈالے۔ اس عمل کو موالات کہتے ہیں۔ بنابرایں اگر نماز کے اجزاء کے درمیان اتنا فاصلہ ڈالے کہ دیکھنے والے کی نظر میں نماز کی حالت سے خارج ہوجائے تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "303.",
          url: "https://www.leader.ir/en/book/241?sn=32521"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 304",
          url: "https://www.leader.ir/ur/book/197/1?sn=31134"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 304",
          url: "https://www.leader.ir/fa/book/180/1?sn=30800"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qunut",
    topicId: "tashahhudsalam",
    subject: {
      en: "Qunūt"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In all the obligatory and recommended prayers, it is recommended to perform qunūt before the rukūʿ of the second rakʿah. However, in the shafʿ prayer, one must perform qunūt with the intention of rajāʾ. In the witr prayer – despite it being only one rakʿah – it is recommended to perform qunūt before rukūʿ. In the Friday prayer, each rakʿah has a qunūt. Ṣalāt al‑āyāt has five qunūts. The Eid al-Fiṭr and Eid al-Aḍḥā prayers each have a number of qunūts in the two rakʿahs, details of which will be explained in their own place.",
          ur: "تمام واجب اورمستحب نمازوں میں دوسری رکعت کے رکوع سے پہلے قنوت پڑھنامستحب ہے لیکن نمازشفع میں ضروری ہے کہ اسے رجاء ً پڑھے اورنماز وتر میں بھی باوجودیکہ ایک رکعت کی ہوتی ہے رکوع سے پہلے قنوت پڑھنامستحب ہے اور نماز جمعہ کی ہررکعت میں ایک قنوت،نمازآیات میں پانچ قنوت،نمازعیدفطروقربان کی دونوں رکعتوں میں چندقنوت ہیں جن کی تفصیل اپنی جگہ آئے گی۔"
        },
        hukm: "mustahab",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1103",
          url: "https://www.sistani.org/english/book/48/2243/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1103)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In all obligatory and mustaḥabb prayers, it is mustaḥabb to raise the hands and recite supplication in the second rak‘ah, after recitation of chapter al-Fātiḥah and the second chapter but before rukū‘. This action is called qunūt.",
          ur: "مستحب ہے کہ تمام واجب اور مستحب نمازوں کی دوسری رکعت میں الحمد اور سورے کے بعد اور رکوع سے پہلے ہاتھوں کو بلند کرے اور دعا پڑھے۔ اس عمل کو قنوت کہتے ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "306.",
          url: "https://www.leader.ir/en/book/241?sn=32522"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 307",
          url: "https://www.leader.ir/ur/book/197/1?sn=31136"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 307",
          url: "https://www.leader.ir/fa/book/180/1?sn=30801"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qunutdhikr",
    topicId: "tashahhudsalam",
    subject: {
      en: "What may be said in qunūt"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In qunūt, it is sufficient to say any dhikr, even if it is one ‘subḥānal lāh’, and it is better if one says the following:\nلَا إِلٰهَ إِلَّا اللهُ الْحَلِيْمُ الْكَرِيْمُ، لَا إِلٰهَ إِلَّا اللهُ الْعَلِيُّ الْعَظِيْمُ، سُبْحَانَ اللهِ رَبِّ السَّمَاوَاتِ السَّبْعِ، وَرَبِّ الْأَرَضِيْنَ السَّبْعِ، وَمَا فِيْهِنَّ وَمَا بَيْنَهُنَّ وَرَبِّ الْعَرْشِ الْعَظِیْم، وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِيْنَ\nlā ilāha illal lāhul ḥalīmul karīm, lā ilāha illal lāhul ʿaliyyul ʿaẓīm, subḥānal lāhi rabbis samāwātis sabʿ, wa rabbil araḍīnas sabʿ, wa mā fīhinna wa mā baynahunna wa rabbil ʿarshil ʿaẓīm, wal ḥamdu lillāhi rabbil ʿālamīn\nThere is no god but Allah, the Forbearing, the Generous. There is no god but Allah, the High, the Great. I declare emphatically that Allah is free from imperfections, [Allah,] Lord of the seven skies and all that is in them and all that is between them, and Lord of the Great Throne. And all praise is for Allah, Lord of the worlds."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1105",
          url: "https://www.sistani.org/english/book/48/2243/"
        },
        verification: "A",
        arabicInSource: true,
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In qunūt, any dhikr, supplication or verse of the Qur’an can be recited. One can suffice with reciting one salāwāt, subḥānallāh, bismillāh, or bismillāhir raḥmānir raḥīm; but it is better to recite the supplications which are mentioned in the Holy Qur’an, such as\nرَبَّنَا آتِنَا فِی الدُّنْیَا حَسَنَةً وَفِی الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ\nor dhikr transmitted from Imams (a) such as\nلا اِلَهَ اِلاّ اللهُ الحَلِیمُ الکَرِیمُ، لا اِلهَ اِلاّ اللهُ العَلِیُّ العَظِیمُ، سُبْحَانَ اللهِ رَبِّ السَّمَاوَاتِ السَّبْعِ وَ رَبِّ الْاَرَضِینَ السَّبْعِ وَ مَا فِیهِنَّ وَ مَا بَیْنَهُنَّ وَ رَبِّ الْعَرْشِ العَظِیمِ وَ الْحَمْدُ لِلهِ رَبِّ العَالَمینَ",
          ur: "قنوت میں کوئی بھی ذکر، دعا یا قرآن کی آیت پڑھ سکتا ہے حتی کہ ایک صلوات یا سُبْحَانَ اللهِ یا بِسْمِ اللهِ یا بِسْمِ اللهِ الرَّحْمنِ الرَّحیمِ پر بھی اکتفا کرسکتا ہے لیکن بہترہے قرآن میں موجود دعائیں پڑھے مثلا رَبَّنا آتِنَا فِی الدُّنْیَا حَسَنَةً وَ فِی الْآخِرَةِ حَسَنَةً وَ قِنَا عَذابَ النَّار یا معصومین علیہم السلام سے منقول دعائیں اور اذکار پڑھے مثلا لا اِلَهَ اِلاّ اللهُ الحَلِیمُ الکَرِیمُ، لا اِلهَ اِلاّ اللهُ العَلِیُّ العَظِیمُ، سُبْحَانَ اللهِ رَبِّ السَّمَاوَاتِ السَّبْعِ وَ رَبِّ الْاَرَضِینَ السَّبْعِ وَ مَا فِیهِنَّ وَ مَا بَیْنَهُنَّ وَ رَبِّ الْعَرْشِ العَظِیمِ وَ الْحَمْدُ لِلهِ رَبِّ العَالَمینَ."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "309.",
          url: "https://www.leader.ir/en/book/241?sn=32522"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 310",
          url: "https://www.leader.ir/ur/book/197/1?sn=31136"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 310",
          url: "https://www.leader.ir/fa/book/180/1?sn=30801"
        },
        verification: "A",
        arabicInSource: true
      }
    ]
  },
  {
    id: "taqibat",
    topicId: "tashahhudsalam",
    subject: {
      en: "Supplications after the prayer (taʿqībāt)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After prayers, it is recommended that one engage himself in taʿqībāt, i.e. saying dhikr, reciting duʿāʾs, and reciting the Qur’an. It is better that he recite taʿqībāt facing qibla before he moves from his place and before his wuḍūʾ, ghusl, or tayammum becomes invalid. It is not necessary that the taʿqībāt be in Arabic, but it is better to recite what has been instructed in the books of duʿāʾs. One of the taʿqībāt that has been highly recommended is the tasbīḥ of Her Eminence [Fāṭimah] al-Zahrāʾ (ʿA), which must be said in this order: thirty-four times ‘allāhu akbar’, then thirty-three times ‘alḥamdu lillāh’, and then thirty-three times ‘subḥānal lāh’. It is possible to say the ‘subḥānal lāh’ before ‘alḥamdu lillāh’, but it is better to say it after it."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1108",
          url: "https://www.sistani.org/english/book/48/2245/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "After finishing the prayer, it is mustaḥabb to recite Qur'an, dhikr, or supplications. This act is called prayer’s ta‘qīb and it is better to do it while sitting facing the qiblah and being in the state of wuḍū’, ghusl, or tayammum.",
          ur: "نماز پڑھنے کے بعد مستحب ہے کہ دعا، ذکر یا قرآن پڑھے اس عمل کو تعقیبات نماز کہتے ہیں اور بہتر ہے کہ اسی حالت میں جب قبلہ رخ اور وضو یاغسل یا تیمم کے ساتھ ہو اس عمل کو انجام دے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "312.",
          url: "https://www.leader.ir/en/book/241?sn=32523"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 313",
          url: "https://www.leader.ir/ur/book/197/1?sn=31137"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 313",
          url: "https://www.leader.ir/fa/book/180/1?sn=30802"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "mubtilatlist",
    topicId: "mubtilat",
    subject: {
      en: "Things that invalidate the prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Twelve things invalidate prayers. These twelve things are called the ‘mubṭilāt’ of prayers.\nFirst: during prayers, one of the required conditions is no longer fulfilled. For example, during prayers one realises that his clothes are impure.\nSecond: during prayers, one intentionally, inadvertently, or due to helplessness, does something that invalidates wuḍūʾ or ghusl. For example, he urinates, even if – based on obligatory precaution – this happens inadvertently or due to helplessness after completing the last sajdah of the prayer. However, if one cannot prevent the discharge of urine and faeces, and during prayers urine or faeces is discharged from his body, then in the event that he acts according to the instructions mentioned in the section on wuḍūʾ, his prayer does not become invalid. Similarly, if during prayers, blood is discharged from a woman experiencing an irregular blood discharge (istiḥāḍah), in the event that she has acted according to the instructions concerning irregular blood discharge, her prayer is valid.",
          ur: "بارہ چیزیں نمازکوباطل کرتی ہیں اورانہیں ’’ مبطلات‘‘ کہاجاتاہے :\n(اول:) نمازکے دوران نماز کی شرطوں میں سے کوئی شرط مفقود ہوجائے مثلاً نماز پڑھتے ہوئے نمازی کوپتا چلے کہ اس کا لباس نجس ہے۔\n(دوم:) نمازکے دوران عمداًیاسہواًیامجبوری کی وجہ سے انسان کسی ایسی چیز سے دوچارہوجو وضویاغسل کوباطل کردے مثلاً اس کاپیشاب خارج ہوجائے اگرچہ( احتیاط واجب کی بنا پر) اس طرح نماز کے آخری سجدے کے بعدسہواًیامجبوری کی بناپرہو‘تاہم جوشخص پیشاب یا پاخانہ نہ روک سکتاہواگرنمازکے دوران اس کاپیشاب یاپاخانہ نکل جائے اوروہ اس طریقے پرعمل کرے جواحکام وضو کے ذیل میں بتائے گئےہیں تواس کی نمازباطل نہیں ہوگی اور اسی طرح اگرنماز کے دوران مستحاضہ کوخون آجائے تواگر وہ استحاضہ سے متعلق احکام کے مطابق عمل کرے تواس کی نمازصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1112",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1112)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The prayer is invalidated in the following cases:\n1. When one of the conditions of prayer ceases to exist during prayer;\n2. When wuḍū’ or ghusl is invalidated;\n3. To turn away from the qiblah;\n4. Talking;\n5. Laughing;\n6. Weeping;\n7. When the form of the prayer is disrupted;\n8. Eating and drinking;\n9. Doubts which invalidate the prayer;\n10. To repeat a foundational element or to neglect it;\n11. Saying āmīn after chapter al-Fātiḥah;\n12. Placing one hand on the other in a certain manner which is called takattuf."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "322.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 323",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "turningface",
    topicId: "mubtilat",
    subject: {
      en: "Turning away from the qibla"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person turns only his face away from qibla and his body remains facing qibla, in the event that he turns his neck to such an extent that he can see a little of what is behind him, the rule of turning away from qibla – which was mentioned earlier – applies. However, if his turning is not to this extent but is commonly considered a lot, then based on obligatory precaution, he must perform his prayer again. If he turns his neck a little, his prayer does not become invalid, although this action is disapproved.\nSixth: one intentionally speaks, even if what he says is only one letter, as long as it conveys a meaning; for example, he says ‘ قِ’ (qi), which in Arabic means ‘keep safe’. The same applies if what he says only means something in a particular context; for example, he says ‘ باء ’ (bāʾ) in response to someone who asks what the second letter of the Arabic alphabet is. In the event that what he intentionally says conveys no meaning at all but consists of two or more letters, then based on obligatory precaution, it also invalidates prayers."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1117",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        verification: "A",
        arabicInSource: true,
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person intentionally turns his face or his body from the qiblah so that he can see the right or left easily, his prayer is invalidated. If a person does so unintentionally, by obligatory caution, his prayer becomes invalidated. However, if a person turns his face a little to each side, his prayer is not invalidated.",
          ur: "اگر جان بوجھ کر قبلے سے اس حد تک اپنا بدن یا رخ پھیرے کہ دائیں اور بائیں طرف آسانی سے دیکھ سکتا ہو تو نماز باطل ہے اور اگر بھول کربھی ایسا کرے تو احتیاط واجب کی بناپر نماز باطل ہے لیکن اگر چہرے کو ایک طرف تھوڑا پھیرے تو نماز باطل نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "325.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 326",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 326",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "speaking",
    topicId: "mubtilat",
    subject: {
      en: "Speaking during the prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person inadvertently says a word that has one or more letters, then even if that word conveys a meaning, his prayer does not become invalid. However, based on obligatory precaution, it is necessary that after prayers he perform sajdatā al‑sahw, which will be discussed later.",
          ur: "اگرکوئی شخص سہواًایساکلمہ کہے جس کے حروف ایک یااس سے زیادہ ہوں توخواہ وہ کلمہ معنی بھی رکھتاہواس شخص کی نمازباطل نہیں ہوتی لیکن (احتیاط کی بناپر)اس کے لئے ضروری ہے کہ جیساکہ بعدمیں ذکرآئے گانماز کے بعدوہ سجدئہ سہوبجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1118",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1118)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a person intentionally talks, even to the extent of one word, the prayer is invalidated."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "326.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 327",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "replyingsalam",
    topicId: "mubtilat",
    subject: {
      en: "Replying to a salām during the prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "One must immediately reply to salām, irrespective of whether he is performing prayers or not. If a person intentionally or due to forgetfulness delays his reply to salām to the extent that were he to reply to it, it would not be considered a reply to that initial salām, then in the event that he is performing prayers, he must not reply; and if he is not performing prayers, replying is not obligatory.",
          ur: "انسان کوچاہئے کہ خواہ وہ نمازکی حالت میں ہویانہ ہوسلام کاجواب فوراًدے اوراگر جان بوجھ کریابھولے سے سلام کاجواب دینے میں اتناتوقف کرے کہ اگر جواب دے تووہ اس سلام کاجواب شمارنہ ہوتواگروہ نمازکی حالت میں ہو تو ضروری ہے کہ جواب نہ دے اوراگرنماز کی حالت میں نہ ہوتوجواب دیناواجب نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1124",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1124)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is obligatory to answer the salām immediately. If for any reason someone delays it to such an extent that the answer is not considered answer to the salām, then if he is praying, he should not give the answer to the salām and if he is not praying, it is not obligatory to answer it. In case of doubt regarding the delay the same rule applies. If delaying the greeting is intentional, it is a sin.",
          ur: "سلام کا جواب فوراً دینا واجب ہے اگر کوئی کسی بھی وجہ سے اتنی تاخیر کرے کہ اس سلام کا جواب شمار نہ کیا جائے چنانچہ نماز کی حالت میں ہو تو سلام کا جواب نہیں دینا چاہئے اور اگر نماز کی حالت میں نہ ہو تو بھی جواب دینا واجب نہیں ہے اور اگر تاخیر کی مقدار میں شک کرے تو بھی یہی حکم ہے ، تاہم جان بوجھ کر جواب دینے میں تاخیر کی ہے تو گناہ کیا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "332.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 333",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 333",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "laughing",
    topicId: "mubtilat",
    subject: {
      en: "Laughing"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If on account of refraining oneself from laughing aloud one’s condition changes – for example, the colour of his face turns red – the obligatory precaution is that he must perform his prayer again.\nEighth: based on obligatory precaution, intentionally crying loudly or silently over a worldly matter. However, if one cries silently or loudly out of fear of Allah the Exalted, or in eagerness for Him or the Hereafter, there is no problem; indeed, it is among the best actions. If one cries in asking Allah the Exalted for a worldly matter in humility to Him, there is no problem.\nNinth: doing something that breaks the form of the prayer, such as jumping in the air and suchlike, whether intentionally or forgetfully. However, doing something that does not break the form of the prayer, such as indicating with one’s hand, is not a problem."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1137",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Intentional loud laughter (guffawing) invalidates the prayer. But inadvertent or silent laughter does not.",
          ur: "جان بوجھ کر اور آواز کے ساتھ ہنسنا (قہقہہ لگانا) نماز کو باطل کرتا ہے لیکن بھول کر یا بغیر آواز کے ہنسنے سے نماز باطل نہیں ہوتی ۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "334.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 335",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 335",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "eatingdrinking",
    topicId: "mubtilat",
    subject: {
      en: "Eating and drinking"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, even if the form of prayer does not break by intentionally eating or drinking, one must perform the prayer again, irrespective of whether or not muwālāh is maintained, i.e. irrespective of whether or not it can be said that he is performing [the parts of] the prayer in close succession.",
          ur: "اگرکسی کاجان بوجھ کرکھاناپینانمازکی شکل کوختم نہ بھی کرے تب بھی (احتیاط واجب کی بناپر)ضروری ہے کہ نماز کودوبارہ پڑھے خواہ نمازکاتسلسل ختم ہو(یعنی یہ نہ کہا جائے کہ نمازکومسلسل پڑھ رہاہے) یانمازکاتسلسل ختم نہ ہو۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1140",
          url: "https://www.sistani.org/english/book/48/2247/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1140)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "To eat or drink, whether a little or a lot, during prayer does invalidate the prayer. However, swallowing food particles left here and there in the mouth or sucking the sweet of sugar remained in the mouth does not invalidate prayer. Also, if one absentmindedly or forgetfully eats or drinks something during prayer, the latter is not invalidated provided that prayer's form is not disturbed.",
          ur: "نماز کی حالت میں کھانا اور پینا نماز کو باطل کرتا ہے چاہے کم ہو یا زیادہ لیکن منہ کے اطراف میں باقی بچ جانے والی غذا کے ذرات کو نگلنا یا ذرا سی قند یا شکر کو چوسنا نماز باطل ہونے کا باعث نہیں ہے۔ اسی طرح اگر سہوا ًیا فراموشی سے کوئی چیز کھائے یا پیئے تو نماز باطل نہیں ہوتی ہےبشرطیکہ نماز کی شکل سے خارج نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "341.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 342",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 342",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "amin",
    topicId: "mubtilat",
    subject: {
      en: "Saying “āmīn” after al-Ḥamd"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is not permissible to say \"āmīn\" after reciting chapter al- Fātiḥah and it invalidates the prayer. But if it is because of taqiyyah, there is no problem. Also, putting folded-hands on one's chest while standing during prayer (putting hands together in front of the body) invalidates the prayer if it is done with the intention that it is a part of prayer. By obligatory caution, one should avoid it even without this intention.",
          ur: "سورہ حمد پڑھنے کے بعد آمین کہنا جائز نہیں اور نماز باطل ہونے کا سبب ہے لیکن اگر تقیہ کی خاطر ہوتو کوئی اشکال نہیں ہے۔ اسی طرح سینے پر ہاتھ رکھ کر کھڑا ہونا اگر اس نیت سے ہو کہ یہ عمل نماز کا جزءہے تو نماز باطل کردیتا ہے اور احتیاط واجب یہ ہے کہ اس نیت کے بغیر بھی اس عمل کو انجام نہ دے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "343.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 344",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 344",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "breakingprayer",
    topicId: "mubtilat",
    subject: {
      en: "Breaking an obligatory prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, it is not permitted for one to voluntarily break an obligatory prayer. However, there is no problem if one does so to protect property or prevent financial or physical harm. In fact, there is no problem [if one breaks an obligatory prayer] for any religious or worldly purpose that is of importance to him.",
          ur: "اختیاری حالت میں واجب نمازکاتوڑنا(احتیاط واجب کی بناپر) جائز نہیں ہے لیکن مال کی حفاظت اورمالی یاجسمانی ضررسے بچنے کے لئے نمازتوڑنے میں کوئی حرج نہیں بلکہ وہ تمام اہم دینی اور دنیاوی کام جونمازی کوپیش آئیں ان کے لئے نماز توڑنے میں کوئی حرج نہیں ۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1145",
          url: "https://www.sistani.org/english/book/48/2249/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1145)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is not permissible to cut obligatory prayers without an excuse.",
          ur: "بغیر کسی عذر کے واجب نماز کو توڑنا جائز نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "344.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 345",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 345",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "breakingnecessity",
    topicId: "mubtilat",
    subject: {
      en: "When the prayer must be broken"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If without breaking one’s prayers it is not possible for him to protect his life or the life of someone whose life is obligatory for him to protect, or property whose protection is obligatory for him, then he must break his prayers.",
          ur: "اگرانسان اپنی جان کی حفاظت یاکسی ایسے شخص کی جان کی حفاظت جس کی جان کی حفاظت واجب ہویاایسے مال کی حفاظت جس کی نگہداشت واجب ہواور وہ نماز توڑے بغیر ممکن نہ ہوتوانسان کو چاہئے کہ نمازتوڑدے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1146",
          url: "https://www.sistani.org/english/book/48/2249/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1146)",
          url: "https://www.sistani.org/urdu/book/61/3638/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If it is not possible, without cutting the prayer, to save life or property when it is obligatory, then the prayer should be abandoned. In general, it is permissible to cut the prayer to avoid life and financial risks that are significant and important for the praying person.",
          ur: "اگر نماز توڑے بغیر جان یا ایسے مال کی حفاظت کرنا ممکن نہ ہو کہ جسے بچانا واجب ہے تو ضروری ہے کہ نماز کو توڑدے اور مجموعی طور ان تمام جانی و مالی خطرات سے بچنے کے لئے نماز توڑنا جائز ہے جو نماز پڑھنے والے کے لئے قابل توجہ اور اہم ہوں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "345.",
          url: "https://www.leader.ir/en/book/241?sn=32525"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 346",
          url: "https://www.leader.ir/ur/book/197/1?sn=31173"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 346",
          url: "https://www.leader.ir/fa/book/180/1?sn=30804"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrintro",
    topicId: "travellerprayer",
    subject: {
      en: "Shortening the four-rakʿah prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "While travelling, one must perform the four rakʿah prayers as two rakʿahs in accordance with the conditions that will be mentioned later."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 716",
          url: "https://www.sistani.org/english/book/48/2208/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Among the obligatory daily prayers, a traveler must perform four-rak‘ah prayers in two rak‘ah in some conditions.",
          ur: "مسافر کے لئے ضروری ہے کہ اگر قصر کی شرائط موجود ہوں تو یومیہ واجب نمازوں میں سے چار رکعت والی نمازوں کو دو رکعت پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "407.",
          url: "https://www.leader.ir/en/book/241?sn=32547"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 408",
          url: "https://www.leader.ir/ur/book/197/1?sn=31195"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 408",
          url: "https://www.leader.ir/fa/book/180/1?sn=30826"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "qasrconditions",
    topicId: "travellerprayer",
    subject: {
      en: "The conditions for shortening"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Prayer during travel is shortened under eight conditions, which are as follows:\n1. Shar‘ī distance;\n2. Intention to travel the shar‘ī distance;\n3. Continuity of intention (not giving up on the intention of the shar‘ī distance nor having doubts about it);\n4. Not crossing the watan nor deciding to stay ten days in a place during the trip;\n5. The travel is not a sin;\n6. Not being at home;\n7. Traveling is not their job;\n8. Reaching the tarakhkhuṣ point.",
          ur: "آٹھ شرائط کے ساتھ سفر میں نماز قصر ہوتی ہے جو مندرجہ ذیل ہیں:\n1۔ شرعی مسافت پوری ہو؛\n2۔ مسافت شرعی طے کرنے کا قصد ہو؛\n3۔ آخر تک اپنے قصد پر باقی رہے (مسافت شرعی تک جانے کے ارادے سے باز نہ آئے یا اس میں تردد کا شکار نہ ہوجائے)\n4۔ سفر کے دوران اپنے وطن سے نہ گزرے یا کسی جگہ دس دن یا اس سے زیادہ رہنے کا قصدنہ کرے۔\n5۔ سفر حرام نہ ہو۔\n6۔ خانہ بدوش نہ ہو\n7۔ سفر اس کا پیشہ نہ ہو\n8۔ حد ترخص تک پہنچ جائے"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "408.",
          url: "https://www.leader.ir/en/book/241?sn=32547"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 409",
          url: "https://www.leader.ir/ur/book/197/1?sn=31195"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 409",
          url: "https://www.leader.ir/fa/book/180/1?sn=30826"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrdistance",
    topicId: "travellerprayer",
    subject: {
      en: "The distance of eight farsakhs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person’s outward and return journey totals eight farsakhs – irrespective of whether or not the outward or the return journey on its own is less than four farsakhs – he must perform qaṣr prayers. Therefore, if his outward journey is three farsakhs and his return is five, or vice versa, he must perform qaṣr prayers, i.e. [he must perform the four rakʿah prayers] as two rakʿah prayers."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1258",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The distance that shortens the prayer must be at least eight farsakhs, so if the journey is less than this distance, the prayer is not shortened.",
          ur: "نماز قصر ہونے کے لئے مسافت کم از کم آٹھ فرسخ ہونی چاہئے بنابراین اگر سفر اس مسافت سے کم ہوتو نماز، قصر نہیں ہوگی۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "409.",
          url: "https://www.leader.ir/en/book/241?sn=32548"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 410",
          url: "https://www.leader.ir/ur/book/197/1?sn=31196"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 410",
          url: "https://www.leader.ir/fa/book/180/1?sn=30827"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrkm",
    topicId: "travellerprayer",
    subject: {
      en: "Eight farsakhs in kilometres"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Shar‘ī distance (eight farsakhs) which shortens the prayers (according to the reliable research), is equivalent to 41 kilometers.",
          ur: "شرعی مسافت (آٹھ فرسخ) جس سے نماز قصر ہوتی ہے، (اطمینان بخش تحقیق کے مطابق) 41 کلومیٹر کے برابر ہوتی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "410.",
          url: "https://www.leader.ir/en/book/241?sn=32548"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 411",
          url: "https://www.leader.ir/ur/book/197/1?sn=31196"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 411",
          url: "https://www.leader.ir/fa/book/180/1?sn=30827"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrdistancestart",
    topicId: "travellerprayer",
    subject: {
      en: "Where the distance is measured from"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The start of the eight farsakhs on one’s journey must be calculated from the point beyond which a person is deemed to be a traveller; this is usually the outskirts of a town. However, in some very big cities, it is possible that it is the outskirts of a particular area. The end of the journey of a traveller who intends to travel to a town or village that is not his home town (waṭan) is deemed to be his destination in that town or village, not the point of entry into that town or village."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1266*",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        verification: "A",
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        urduEditionLag: true,
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The criterion for calculating the shar‘ī distance is the distance between the end of the city of departure and the beginning of the city of destination*; whether the city is large or not.\n* i.e. from the last houses in the city of departure till the first houses of the city of destination.",
          ur: "مسافت شرعی کو حساب کرنے کا معیار جس شہر سے سفر شروع کررہا ہے اس کے آخر سے لے کر جس شہر کی طرف سفر کررہا ہے اس کی ابتدا تک کا فاصلہ ہے اس میں کوئی فرق نہیں کہ شہر بڑا ہو یا نہ ہو۔\n* ۔ یعنی جس شہر سے سفر شروع کررہا ہے اس کے آخری گھروں سے منزل مقصود والے شہر کے ابتدائی گھروں تک کا فاصلہ حساب کیا جائے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "411.",
          url: "https://www.leader.ir/en/book/241?sn=32548"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 412",
          url: "https://www.leader.ir/ur/book/197/1?sn=31196"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 412",
          url: "https://www.leader.ir/fa/book/180/1?sn=30827"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrintention",
    topicId: "travellerprayer",
    subject: {
      en: "Intending the distance from the start"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A traveller must perform qaṣr prayers when he has decided to travel eight farsakhs. Therefore, if someone goes out of his town and, for example, his intention is that if he finds a friend he will travel for eight farsakhs, then in the event that he is confident that he will find a friend, he must perform qaṣr prayers; and if he is not confident about this, he must perform tamām prayers.",
          ur: "مسافرکونمازقصرکرکے اس صورت میں پڑھنی ضروری ہے جب اس کا آٹھ فرسخ طے کرنے کاپختہ ارادہ ہولہٰذااگرکوئی شخص شہرسے باہر جارہاہواورمثال کے طورپراس کاارادہ یہ ہوکہ اگرکوئی ساتھی مل گیاتوآٹھ فرسخ کے سفر پرچلاجاؤں گا اوراسے اطمینان ہوکہ ساتھی مل جائے گاتواسے نمازقصرکرکے پڑھنی ضروری ہے اور اگراسے اس بارے میں اطمینان نہ ہوتوضروری ہے کہ پوری نمازپڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1268",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1268)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "When leaving the city, the mukallaf must intend to travel eight farsakhs, one way or combined (see 413 to 415). Therefore, if at first, he intends to travel less than the shar‘ī distance; like if he plans to go three farsakhs and after reaching his destination (three farsakhs), he decides to go another five farsakhs and stay there for ten days, such a journey (even though eight farsakhs have been traveled) does not shorten the prayers.",
          ur: "مکلف کے لئے ضروری ہے کہ شہر سے خارج ہوتے وقت آٹھ فرسخ (یک طرفہ یا مجموعی طورپر ) طے کرنے کا قصد رکھتا ہو بنابرایں اگر سفر کے شروع میں شرعی مسافت سے کم طے کرنے کا ارادہ ہو مثلاً تین فرسخ تک جانے کا قصد ہو اور منزل (تین فرسخ) تک پہنچنے کے بعد مزید پانچ فرسخ سفر کرنے کا ارادہ کرے اور اس جگہ دس دن قیام کرے تو ایسا سفر (اگرچہ آٹھ فرسخ طے کیا ہے) نماز قصر ہونے کا باعث نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "430.",
          url: "https://www.leader.ir/en/book/241?sn=32550"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 431",
          url: "https://www.leader.ir/ur/book/197/1?sn=31198"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 431",
          url: "https://www.leader.ir/fa/book/180/1?sn=30829"
        },
        verification: "A",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "qasrsinful",
    topicId: "travellerprayer",
    subject: {
      en: "A journey for a sinful purpose"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "With regard to someone whose journey is not unlawful and who is not travelling for any unlawful purpose, if he commits a sin on his journey – for example, he backbites or drinks alcohol – he must perform qaṣr prayers.",
          ur: "جس شخص کاسفر حرام نہ ہواوروہ کسی حرام کام کے لئے بھی سفر نہ کر رہا ہووہ اگرچہ سفر میں گناہ بھی کرے مثلاً غیبت کرے یاشراب پئے تب بھی ضروری ہے کہ نمازقصر کرکے پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1282",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1282)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Another condition for shortening the prayer is that the journey is permissible (not ḥarām). Therefore, if a person goes on a ḥarām journey, whether the journey itself is ḥarām, such as fleeing from war or traveling to do a ḥarām act, like to steal, then his prayer is complete.",
          ur: "نماز قصر ہونے کی ایک شرط یہ ہے کہ سفر جائز ہو (حرام نہ ہو) بنابرایں اگر کوئی حرام سفر کرے چاہے خودسفر حرام ہو مثلاً جنگ سے بھاگنے کےلئے سفر کرے یا کسی حرام کام کو انجام دینے کے لئے سفر کرے مثلاً چوری کے لئے سفر کرے تو نماز پوری ہوگی۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "452.",
          url: "https://www.leader.ir/en/book/241?sn=32554"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 453",
          url: "https://www.leader.ir/ur/book/197/1?sn=31202"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 453",
          url: "https://www.leader.ir/fa/book/180/1?sn=30833"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrleisure",
    topicId: "travellerprayer",
    subject: {
      en: "Travelling for recreation"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person travels for recreational and leisure purposes, his journey is not unlawful and he must perform qaṣr prayers.",
          ur: "اگرکوئی شخص سیروتفریح کی غرض سے سفرکرے تواس کا سفرحرام نہیں ہے اورضروری ہے کہ نمازقصرکرکے پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1286",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1286)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Traveling for fun/recreation is not ḥarām, and prayer during such a travel is not shortened.",
          ur: "تفریح کے لئے سفر کرنا حرام نہیں ہے اور اس میں نماز قصر ہوگی۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "465.",
          url: "https://www.leader.ir/en/book/241?sn=32555"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 466",
          url: "https://www.leader.ir/ur/book/197/1?sn=31203"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 466",
          url: "https://www.leader.ir/fa/book/180/1?sn=30834"
        },
        verification: "A",
        englishWithheld: "P15: the English says prayer on a leisure trip 'is not shortened'; the Persian (مسأله 466) and the Urdu (مسئلہ 466) say it is shortened (قصر), as do Rules 452/462. Mistranslation."
      }
    ]
  },
  {
    id: "qasrjob",
    topicId: "travellerprayer",
    subject: {
      en: "Someone whose job is travelling"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "With regard to someone whose profession is travelling, if he travels for another purpose, such as ziyārah or hajj, he must perform qaṣr prayers unless he is commonly known to be a frequent traveller, such as someone who always travels three days in a week. However, if, for example, a car driver is hired for a ziyārah trip and on that trip he also performs ziyārah, he must perform tamām prayers.",
          ur: "جس شخص کے پیشے کاتعلق سفرسے ہواگروہ کسی دوسرے مقصد مثلاً حج یازیارت کے لئے سفرکرے توضروری ہے کہ نمازقصرکرکے پڑھے لیکن اگرعرف عام میں ’’ کثیرالسفر‘‘کہلاتاہوجیسے ہفتہ میں تین دن مسلسل سفر پر رہنے والا شخص (تو قصرنہ کرے) لیکن اگرمثال کے طورپر ڈرائیور اپنی گاڑی زیارت کے لئے کرائے پرچلائے اورضمناًخودبھی زیارت کرے توہرحال میں ضروری ہے کہ پوری نمازپڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1293",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1293)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "One of the conditions for shortening the prayer while traveling is that the trip is not for work, so if the trip is for work, whether travel constitute the work, such as driving or piloting, or whether traveling is a preliminary to the job, such as the travel of a doctor or a teacher who travels for his job, prayer is complete during that trip and fasting is correct.",
          ur: "سفر میں نماز قصر ہونے کی شرائط میں سے ایک یہ ہے کہ سفر اس کا پیشہ نہ ہو ، بنابرایں اگر کسی شخص کا پیشہ سفر ہو چاہے اس کے پیشے کا وجود سفر سےہو (یعنی سفر اس کی درآمد کا ذریعہ ہو) مثلاً ڈرائیور اور پائلٹ یا سفر اس کے پیشے کا مقدمہ(ضروری تمہید) ہو مثلاً ڈاکٹر یا معلم جو اپنے پیشے کے لئے سفر کرتے ہیں، اس سفر میں نماز پوری ہوگی اور روزہ صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "478.",
          url: "https://www.leader.ir/en/book/241?sn=32559"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 479",
          url: "https://www.leader.ir/ur/book/197/1?sn=31207"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 479",
          url: "https://www.leader.ir/fa/book/180/1?sn=30838"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrlimit",
    topicId: "travellerprayer",
    subject: {
      en: "The permitted limit (tarakhkhuṣ)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The permitted limit is the place where the people of a town – including those who live on its outskirts and are considered residents of the town – cannot see a traveller due to the distance he has travelled. A traveller would know he has reached this point when he can no longer see the people of the town nor those living on its outskirts."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1304",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A traveler who leaves his watan and intends to travel a shar‘ī distance, his prayer is shortened from the time he reaches a certain point, and on his return, when he reaches the same point, he must complete the prayer. They call this point \"tarakhkhuṣ point\". However, there is mustaḥabb caution to perform the prayer in both forms, complete and shortened, in the place between tarakhkhuṣ point and city entrance.\nThe criterion for determining the tarakhkhuṣ point is to be far from the last house of city so that one does not hear the sound of adhān said in the city without a loudspeaker, whether he sees the city walls or not.",
          ur: "جو مسافر وطن سے خارج ہوتا ہے اور مسافت شرعی طے کرنے کا قصد رکھتا ہے اس کی نماز اس وقت قصر ہوگی جب ایک معین حد تک پہنچے اسی طرح واپسی کے دوران جب اس حد تک پہنچ جائے توضروری ہے کہ نماز کو پوری پڑھے۔ اس حد کو حد ترخص کہتے ہیں اگرچہ احتیاط مستحب یہ ہے کہ حد ترخص اور شہر میں داخل ہونےکے درمیانی فاصلے میں نماز کو قصر کرکے بھی پڑھے اور پوری بھی پڑھے۔\nحد ترخص کو تشخیص دینے کا معیار یہ ہے کہ شہر کے آخری گھر سے اس قدر دور ہوجائے کہ لاوڈسپیکر کے بغیر شہر سے دی جانے والی اذان نہ سنے چاہے شہر کی دیوار یں دیکھے یا نہ دیکھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "506.",
          url: "https://www.leader.ir/en/book/241?sn=32560"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 508، 509",
          url: "https://www.leader.ir/ur/book/197/1?sn=31208"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 508، 509",
          url: "https://www.leader.ir/fa/book/180/1?sn=30839"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "qasrwatan",
    topicId: "travellerprayer",
    subject: {
      en: "The home town (waṭan)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A place that one adopts as his permanent residence is his home town, irrespective of whether he was born there or not, or it was the home of his parents, or he selected it himself for his residence."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1314",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "According to common view, watan is a place where a person resides and lives, whether it is a city or a village or else.",
          ur: "عرف میں وطن اس جگہ کو کہا جاتا ہے جہاں انسان زندگی گزارے اور سکونت و رہائش اختیار کرے، چاہے شہر ہو یا دیہات یا کوئی اور جگہ۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "529.",
          url: "https://www.leader.ir/en/book/241?sn=32562"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 531",
          url: "https://www.leader.ir/ur/book/197/1?sn=31210"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 531",
          url: "https://www.leader.ir/fa/book/180/1?sn=30841"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrtendays",
    topicId: "travellerprayer",
    subject: {
      en: "Intending to stay ten days"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A traveller who has the intention of staying somewhere for ten consecutive days, or knows that he has no choice but to stay somewhere for ten days, must perform tamām prayers in that place."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1320",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If a traveler intends to stay in a place for ten days, he must perform complete prayer there. But if he stays for ten days without intention or in doubt, his prayer is short.",
          ur: "اگر مسافر قصد کرے کہ کسی جگہ دس دن قیام کرے گا تو ضروری ہے کہ اس جگہ نماز پوری پڑھے لیکن اگر قصد کے بغیر یا تردید کی حالت میں دس دن قیام کرے تو اس کی نماز قصر ہوگی۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "558.",
          url: "https://www.leader.ir/en/book/241?sn=32568"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 560",
          url: "https://www.leader.ir/ur/book/197/1?sn=31216"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 560",
          url: "https://www.leader.ir/fa/book/180/1?sn=30847"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qasrthirtydays",
    topicId: "travellerprayer",
    subject: {
      en: "Staying thirty days without intending ten"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a traveller happens to stay somewhere for thirty days – for example, throughout those thirty days he was unsure about going or staying – he must perform tamām prayers after thirty days have passed even if he stays there for a short time [after the thirty days].",
          ur: "اگرکوئی مسافراتفاقاًکسی جگہ تیس دن رہ جائے مثلاً تیس کے تیس دنوں میں وہاں سے چلے جانے یاوہاں رہنے کے بارے میں مذبذب رہاہوتوتیس دن گزرنے کے بعداگرچہ وہ تھوڑی مدت ہی وہاں رہے ضروری ہے کہ نمازپوری پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1338",
          url: "https://www.sistani.org/english/book/48/2264/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1338)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If, after going eight farsakhs, one remains in a place for thirty days without intention to stay, he should perform complete prayers after the thirtieth day until he leaves the place (even if it is half a day)."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "588.",
          url: "https://www.leader.ir/en/book/241?sn=32572"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 590",
          url: "https://www.leader.ir/fa/book/180/1?sn=30850"
        },
        verification: "A",
        urduNote: "The official Urdu edition differs from the Persian original in this ruling, so only the English, which matches the Persian, is shown (decision R11)."
      }
    ]
  },
  {
    id: "qasrfourplaces",
    topicId: "travellerprayer",
    subject: {
      en: "Mecca, Medina, Kūfah and al-Ḥāʾir"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A traveller can perform tamām prayers in the entire city of Mecca, Medina, and Kufa, and in the shrine (ḥaram) of His Eminence Sayyid al-Shuhadāʾ [Imam al-Ḥusayn] (ʿA) up to a distance of approximately 11.5 metres from the sacred grave [i.e. the area known as the ‘ḥāʾir’]."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1341",
          url: "https://www.sistani.org/english/book/48/2265/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "In the four places of choice, i.e. the city of Mecca, Medina, the masjid of Kūfah and Hā’ir Hosseini (peace be upon him), a traveler can pray the four-rak‘ah prayers shortened or in full, and it is better to perform them in full, but it is mustaḥabb caution to perform them in short form.",
          ur: "مسافر چار مقامات پر( یعنی شہر مکہ، مدینہ، مسجد کوفہ اور حرم حضرت امام حسین علیہ السلام میں ) چار رکعتی نمازوں کو قصرکرکے اور پوری پڑھنے میں اختیار رکھتا ہے اور اگر پوری پڑھے تو افضل ہے لیکن قصر کرکے پڑھنا احتیاط مستحب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "620.",
          url: "https://www.leader.ir/en/book/241?sn=32576"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 622",
          url: "https://www.leader.ir/ur/book/197/1?sn=31223"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 622",
          url: "https://www.leader.ir/fa/book/180/1?sn=30854"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ]
  },
  {
    id: "qasrignorance",
    topicId: "travellerprayer",
    subject: {
      en: "Praying in full not knowing the ruling"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a traveller who does not know that he must perform qaṣr prayers performs tamām prayers, his prayers are valid.",
          ur: "جومسافریہ نہ جانتاہوکہ اسے نمازقصرکرکے پڑھنی ضروری ہے اگر وہ پوری نمازپڑھے تواس کی نمازصحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1344",
          url: "https://www.sistani.org/english/book/48/2265/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1344)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A traveler who does not know that the prayer is short while traveling, and performs complete prayer contrary to his duty while he is qāṣir* ignorant, then after understanding the ruling, he does not need to repeat the prayer.\n* It means that he does not know the ruling nor aware of his ignorance.",
          ur: "جو مسافر نہ جانتا ہو کہ سفر میں نماز قصر ہوتی ہے اور اپنے وظیفے کے برعکس نماز کو پوری پڑھتا ہو چنانچہ جاہل قاصر ہو تو حکم کو جاننے کے بعد نماز کو دوبارہ یا قضا کرنا لازمی نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "604.",
          url: "https://www.leader.ir/en/book/241?sn=32574"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 606",
          url: "https://www.leader.ir/ur/book/197/1?sn=31221"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 606",
          url: "https://www.leader.ir/fa/book/180/1?sn=30852"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadaobligation",
    topicId: "qadaprayers",
    subject: {
      en: "Making up missed prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "With regard to someone who has not performed his daily prayers within their prescribed time, he must make them up even if he slept throughout the prescribed time or did not perform them on account of being intoxicated. The same applies to any other obligatory prayer that was not performed within its prescribed time, even, based on obligatory precaution, those prayers that had become obligatory at a specific time on account of a vow. However, the prayers of Eid al-Fiṭr and Eid al-Aḍḥā cannot be made up, and the prayers that a woman does not perform while experiencing ḥayḍ or nifās are not required to be made up, irrespective of whether they are the daily prayers or other prayers. The rule concerning ṣalāt al‑āyāt will be mentioned later.",
          ur: "جس شخص نے اپنی یومیہ نمازیں ان کے وقت میں نہ پڑھی ہوں تو ضروری ہے کہ ان کی قضابجالائے اگرچہ وہ نمازکے تمام وقت کے دوران سویارہاہو یا اس نے مدہوشی کی وجہ سے نمازنہ پڑھی ہواوریہی حکم ہردوسری واجب نمازکاہے جسے اس کے وقت میں نہ پڑھاہو۔حتیٰ کہ( احتیاط لازم کی بناپر)یہی حکم ہے اس نمازکاجو منت ماننے کی وجہ سے معین وقت میں اس پرواجب ہوچکی ہو۔لیکن نماز عید فطر اور نماز عید قربان کی قضانہیں ہے۔ایسے ہی جونمازیں کسی عورت نے حیض یانفاس کی حالت میں نہ پڑھی ہوں ان کی قضاواجب نہیں خواہ وہ یومیہ نمازیں ہوں یاکوئی اورہوں اور نماز آیات کی قضا کا حکم آئندہ بیان ہو گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1355",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1355)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person, who has not performed the obligatory daily prayer at its specified time intentionally or due to forgetfulness or ignorance, or who realizes, after the prayer's time, that his prayer was invalid, must perform its qaḍā’.",
          ur: "اگر کسی نے یومیہ واجب نماز جان بوجھ کر یا بھولے سے یا لاعلمی کی بنا پر اس کے معین وقت میں نہ پڑھی ہویا وقت گزرنے کے بعد متوجہ ہوا ہو کہ نماز باطل ہوئی تھی تو ضروری ہے کہ اس کی قضا بجالائے ۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "627.",
          url: "https://www.leader.ir/en/book/241?sn=32577"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 629",
          url: "https://www.leader.ir/ur/book/197/1?sn=31224"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 629",
          url: "https://www.leader.ir/fa/book/180/1?sn=30855"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadanotdelay",
    topicId: "qadaprayers",
    subject: {
      en: "Not being negligent about qaḍāʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who has outstanding qaḍāʾ prayers must not be negligent about performing them; however, it is not obligatory for him to perform them immediately.",
          ur: "جس شخص کی نمازقضاہوجائے ضروری ہے کہ اس کی قضا پڑھنے میں کوتاہی نہ کرے البتہ اس کافوراً پڑھناواجب نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1357",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1357)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who owes some prayer is not obligated to perform them right away. However, negligence in performing them is not allowed.",
          ur: "جس شخص پر قضا نماز واجب ہو اس کو فوراً پڑھنا واجب نہیں ہے البتہ اس کو پڑھنے میں کوتاہی نہیں کرنی چاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "633.",
          url: "https://www.leader.ir/en/book/241?sn=32577"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 635",
          url: "https://www.leader.ir/ur/book/197/1?sn=31224"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 635",
          url: "https://www.leader.ir/fa/book/180/1?sn=30855"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadaorder",
    topicId: "qadaprayers",
    subject: {
      en: "Order of qaḍāʾ prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is not necessary to make up daily prayers in the order they became qaḍāʾ, except for the prayers that must be performed in a particular order when they are performed within their prescribed time, such as ẓuhr and ʿaṣr prayers, and maghrib and ʿishāʾ prayers, of the same day.",
          ur: "یومیہ نمازوں کی قضامیں ترتیب لازم نہیں ہے سوائے ان نمازوں کے جن کی ادامیں ترتیب ہے مثلاً ایک دن کی نمازظہروعصریامغرب وعشا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1360",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1360)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is not obligatory to observe the order in reading the qaḍā’ prayer; except for qaḍā’ of ẓuhr and ‘aṣr prayers of one day and qaḍā’ of maghrib and ‘ishā’ prayers of one day.",
          ur: "نماز کی قضا بجالاتے ہوئے ترتیب کی رعایت واجب نہیں ہے مگر یہ کہ ایک دن کی نماز ظہر اور عصر اور ایک دن کی نماز مغرب و عشاء ہو(تو رعایت واجب ہے)"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "638.",
          url: "https://www.leader.ir/en/book/241?sn=32577"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 640",
          url: "https://www.leader.ir/ur/book/197/1?sn=31224"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 640",
          url: "https://www.leader.ir/fa/book/180/1?sn=30855"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadaunknownnumber",
    topicId: "qadaprayers",
    subject: {
      en: "Not knowing how many prayers were missed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person deems it probable that he has qaḍāʾ prayers to perform or that the prayers he performed were not valid, it is recommended that he make them up as a precautionary measure.",
          ur: "اگرکسی شخص کواحتمال ہوکہ قضا نمازاس کے ذمے ہے یاجو نمازیں پڑھ چکاہے وہ صحیح نہیں تھیں تو(مستحب ہے کہ احتیاطاً )ان نمازوں کی قضاکرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1359",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1359)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who does not know the number of his qaḍā’ prayers, it suffices to settle them for the amount that he is sure he has missed.",
          ur: "اگر کسی شخص کو قضا ہونے والی نمازوں کی تعداد کے بارے میں علم نہ ہو تو جتنی مقدار کے قضا ہونے پر یقین ہے اس پر اکتفا کرسکتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "639.",
          url: "https://www.leader.ir/en/book/241?sn=32577"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 641",
          url: "https://www.leader.ir/ur/book/197/1?sn=31224"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 641",
          url: "https://www.leader.ir/fa/book/180/1?sn=30855"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadanafilah",
    topicId: "qadaprayers",
    subject: {
      en: "Recommended prayers while qaḍāʾ is owed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who has outstanding qaḍāʾ prayers can perform recommended prayers.",
          ur: "جس شخص پرکسی نمازکی قضا ہووہ مستحب نمازپڑھ سکتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1358",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1358)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who owes some qaḍā’ prayers can perform nāfilah and mustaḥabb prayers.",
          ur: "جس شخص پر قضا نماز واجب ہو، نافلہ اور مستحب نماز پڑھ سکتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "641.",
          url: "https://www.leader.ir/en/book/241?sn=32577"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 643",
          url: "https://www.leader.ir/ur/book/197/1?sn=31224"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 643",
          url: "https://www.leader.ir/fa/book/180/1?sn=30855"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qadaliving",
    topicId: "qadaprayers",
    subject: {
      en: "Qaḍāʾ for someone still alive"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "As long as one is alive, another person cannot make up prayers on his behalf, even if he is unable to perform his qaḍāʾ prayers himself.",
          ur: "جب تک انسان زندہ ہے خواہ وہ اپنی قضانمازیں پڑھنے سے قاصر ہی کیوں نہ ہوکوئی دوسراشخص اس کی قضا نمازیں نہیں پڑھ سکتا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1367",
          url: "https://www.sistani.org/english/book/48/2266/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1367)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "eldestson",
    topicId: "qadaprayers",
    subject: {
      en: "The eldest son and his parents' missed prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If one’s father is a believer who has not performed his daily and other obligatory prayers – excluding those prayers that had become obligatory at a specific time on account of a vow – and he could have made them up, in the event that he did not fail to perform them due to outright disobedience, then based on obligatory precaution, after the father’s death his eldest son must either perform them himself or hire someone to perform them. However, if his father intentionally did not perform them, it is not obligatory for his eldest son to make them up. The qaḍāʾ prayers of one’s mother are not obligatory for him to perform, although it is better that he does."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1370*",
          url: "https://www.sistani.org/english/book/48/2267/"
        },
        verification: "A",
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        urduEditionLag: true,
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is the elder son’s duty to make up in qaḍā’ for the missed prayers of his late father and, as per obligatory caution, those of his mother.",
          ur: "بڑے بیٹے پر واجب ہے کہ باپ سے قضا ہونے والی نمازوں اور احتیاط واجب کی بناپر ماں سے قضا ہونے والی نمازوں کی قضا بجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "651.",
          url: "https://www.leader.ir/en/book/241?sn=32579"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 653",
          url: "https://www.leader.ir/ur/book/197/1?sn=31226"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 653",
          url: "https://www.leader.ir/fa/book/180/1?sn=30857"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Data note (P14, not shown in the UI): the footnote to Ruling 656 in the same book describes this same duty as just \"a caution\" rather than \"an obligatory caution\". This is a plain caution in a footnote, not a second source to reconcile with 651 (which agrees with the Q&A book, Q 540) — so 651 is quoted verbatim and the footnote is left unshown."
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "eldestsonwho",
    topicId: "qadaprayers",
    subject: {
      en: "Who the eldest son is"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If at the time of his father’s death the eldest son was not of the age of legal responsibility (bāligh) or he was insane, then when he becomes bāligh and/or sane, it is not obligatory for him to perform his father’s qaḍāʾ prayers.",
          ur: "اگرباپ کے مرنے کے وقت بڑابیٹانابالغ یادیوانہ ہوتواس پر واجب نہیں کہ جب بالغ یا عاقل ہوجائے توباپ کی قضانمازیں پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1377",
          url: "https://www.sistani.org/english/book/48/2267/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1377)",
          url: "https://www.sistani.org/urdu/book/61/3639/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The eldest son means the oldest son who is alive when his parents die, whether he is an adult or minor."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "653.",
          url: "https://www.leader.ir/en/book/241?sn=32579"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 655",
          url: "https://www.leader.ir/fa/book/180/1?sn=30857"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "jamaahvirtue",
    topicId: "jamaah",
    subject: {
      en: "Praying in congregation"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is recommended to perform the daily prayers in congregation, and it is recommended more to perform ṣubḥ, maghrib, and ʿishāʾ prayers in congregation, especially for the neighbours of a mosque and for those who can hear the adhān of a mosque. Similarly, it is recommended for the other obligatory prayers to be performed in congregation; however, the legality (mashrūʿiyyah) of performing in congregation the prayer for ṭawāf and ṣalāt al‑āyāt – except for lunar and solar eclipses – is not established.",
          ur: "یومیہ نمازیں جماعت کے ساتھ پڑھنا مستحب ہے اور مسجد کے پڑوس میں رہنے والے کواوراس شخص کوجو مسجد کی اذان کی آواز سنتاہونمازصبح اورمغرب وعشاجماعت کے ساتھ پڑھنے کی بالخصوص بہت زیادہ تاکید کی گئی ہے اور اسی طرح مستحب ہےکہ تمام واجب نمازوں کو جماعت سے پڑھیں لیکن نماز طواف اور سورج اور چاند گرہن کے علاوہ بقیہ نماز آیات کےلئے جماعت کا جواز ثابت نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1379",
          url: "https://www.sistani.org/english/book/48/2268/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1379)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is mustaḥabb to perform the daily obligatory prayers in congregation, and it is more mustaḥabb to perform morning, maghrib and ‘ishā’ prayers in congregation.",
          ur: "یومیہ واجب نمازوں کو جماعت کے ساتھ بجالانا مستحب ہے اور نماز صبح ، نماز مغرب اور نماز عشاء کے بارے میں زیادہ تاکید کی گئی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "692.",
          url: "https://www.leader.ir/en/book/241?sn=32586"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 694",
          url: "https://www.leader.ir/ur/book/197/1?sn=31233"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 694",
          url: "https://www.leader.ir/fa/book/180/1?sn=30864"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "jamaahneglect",
    topicId: "jamaah",
    subject: {
      en: "Not attending out of indifference"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Not attending congregational prayers due to indifference about it is not permitted. And it is not befitting for one not to attend congregational prayers without a valid excuse.",
          ur: "بے اعتنائی برتتے ہوئے نمازجماعت میں شریک نہ ہوناجائزنہیں ہے اورانسان کے لئے یہ مناسب نہیں ہے کہ بغیرعذرکے نمازجماعت کوترک کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1381",
          url: "https://www.sistani.org/english/book/48/2268/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1381)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "It is not nice in shar‘ to not participate in the Friday prayer because of not attaching importance to it.",
          ur: "نماز جمعہ کو اہمیت نہ دیتے ہوئے اس میں شرکت نہ کرنا شرعی طور پر ناپسند ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "763.",
          url: "https://www.leader.ir/en/book/241?sn=32599"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 765",
          url: "https://www.leader.ir/ur/book/197/1?sn=31246"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 765",
          url: "https://www.leader.ir/fa/book/180/1?sn=30876"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "jamaahwhichprayers",
    topicId: "jamaah",
    subject: {
      en: "Which prayers may be prayed in congregation"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Recommended prayers cannot be performed in congregation (in some cases, however, this rule is based on obligatory precaution). [There are some exceptions,] however: ṣalāt al‑istisqāʾ, which is performed to invoke rain, can be performed in congregation. The same applies [i.e. they too can be performed in congregation] to the prayers that were obligatory and have become recommended due to some reason, such as the Eid al-Fiṭr and Eid al-Aḍḥā prayers that were obligatory when the Imam (ʿA) was present and are recommended during his occultation."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1387*",
          url: "https://www.sistani.org/english/book/48/2268/"
        },
        verification: "A",
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        urduEditionLag: true,
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "No mustaḥabb prayer can be recited in congregation except for ‘īd of Fitṛ and ‘Īd of Aḍḥā prayers (which are mustaḥabb during absence of the last Imam) and istisqā’ prayer (said to ask Allah for rain).",
          ur: "نماز عید فطر و عید قربان (جو زمان غیبت میں مستحب ہیں) اور نماز استسقاء (طلب باران) کے علاوہ کسی بھی مستحب نماز کو جماعت کے ساتھ نہیں پڑھا جاسکتا۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "707.",
          url: "https://www.leader.ir/en/book/241?sn=32588"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 709",
          url: "https://www.leader.ir/ur/book/197/1?sn=31235"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 709",
          url: "https://www.leader.ir/fa/book/180/1?sn=31064"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "imamconditions",
    topicId: "jamaah",
    subject: {
      en: "Conditions of the imam"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The imam of congregational prayers must be bāligh, sane (ʿāqil), a Twelver Shia, dutiful (ʿādil), of legitimate birth, and a person who performs prayers correctly. Furthermore, if the follower is a man, the imam must also be a man. The validity of following a ten year old child, although it has some basis, is problematic [i.e. based on obligatory precaution, one must not follow a ten year old child]. Being ‘dutiful’ means he does the things that are obligatory for him and refrains from doing the things that are unlawful for him. The sign of being dutiful is that he appears to be a good person, [and this is sufficient] as long as one does not have information that contradicts this.",
          ur: "امام جماعت کے لئے ضروری ہے کہ بالغ، عاقل، شیعہ اثناعشری، عادل اور حلال زادہ ہواور نماز صحیح طریقہ سے پڑھ سکتاہونیزاگرمقتدی مردہوتواس کاامام بھی مردہونا ضروری ہے اوردس سالہ بچے کی اقتداصحیح ہونااگرچہ وجہ سے خالی نہیں ،لیکن اشکال سے بھی خالی نہیں ہے اور عدالت یہ ہےکہ واجبات کو انجام دیتا ہو اور محرمات کو ترک کرتا ہو اور اس کی نشانی ظاہری وضع قطع ہے جب تک انسان کو اس کے برخلاف انجام دینے کی خبر نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1433",
          url: "https://www.sistani.org/english/book/48/2269/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1433)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The imam of congregational prayer should be sane, Twelver Shiite, just (‘ādil), legally born, can perform prayer correctly and by obligatory caution Islamically pubescent (bāligh). Also, if the congregant is a male, the imam should be a male.",
          ur: "امام جماعت کے لئے ضروری ہے کہ عاقل، عادل، شیعہ اثناء عشری، حلال زادہ اور احتیاط کی بناپر بالغ ہو اور نماز کو صحیح پڑھتا ہو اور اگر ماموم مرد ہو تو امام بھی مرد ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "711.",
          url: "https://www.leader.ir/en/book/241?sn=32589"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 713",
          url: "https://www.leader.ir/ur/book/197/1?sn=31236"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 713",
          url: "https://www.leader.ir/fa/book/180/1?sn=30866"
        },
        verification: "A",
        englishWithheld: "English says 'by obligatory caution' (bāligh); the Persian and Urdu say only 'by caution' (بنابر احتیاط) without 'obligatory'. The type is unspecified in the source.",
        note: "Part of this text says 'caution' (احتیاط) without stating whether it is obligatory or recommended (decision P5)."
      }
    ]
  },
  {
    id: "followerrecites",
    topicId: "jamaah",
    subject: {
      en: "What the follower recites"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A follower must say everything in congregational prayers except the recitation of Sūrat al-Ḥamd and the other surah; however, if the first or second rakʿah of the follower is the third or fourth rakʿah of the imam, then he must recite Sūrat al-Ḥamd and the other surah."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1441",
          url: "https://www.sistani.org/english/book/48/2270/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Except for chapter al-Fātiḥah and the other chapter, a ma‘mūm should read all the prayers' dhikr himself. But if one joins the prayer while imam is in the third or fourth rak‘ah of his prayer, the ma‘mūm should recite chapter al-Fātiḥah and the other chapter.",
          ur: "ماموم کے لئے ضروری ہے کہ الحمد اور سورہ کے علاوہ نماز کے تمام اذکار کو خود پڑھے لیکن اگر تیسری یا چوتھی رکعت میں امام کی اقتدا کی ہو تو ضروری ہے کہ الحمد اور سورہ پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "728.",
          url: "https://www.leader.ir/en/book/241?sn=32591"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 730",
          url: "https://www.leader.ir/ur/book/197/1?sn=31238"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 730",
          url: "https://www.leader.ir/fa/book/180/1?sn=30868"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "followerquietprayers",
    topicId: "jamaah",
    subject: {
      en: "The follower in ẓuhr and ʿaṣr"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, in the first and second rakʿah of ẓuhr and ʿaṣr prayers, a follower must not recite Sūrat al-Ḥamd and the other surah, and it is recommended that he say dhikr instead.",
          ur: "مقتدی کونمازظہروعصرکی پہلی اوردوسری رکعت میں (احتیاط کی بناپر) الحمد اورسورہ نہیں پڑھناچاہئے اورمستحب ہے کہ ان کے بجائے کوئی ذکرپڑھے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1446",
          url: "https://www.sistani.org/english/book/48/2270/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1446)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "During the first two rak‘ahs of the ẓuhr and ‘aṣr prayers, by obligatory caution, a ma‘mūm should not recite chapter al-Fātiḥah and another chapter and it is mustaḥabb to say dhikr instead.",
          ur: "نماز ظہر اور عصر کی پہلی اور دوسری رکعت میں احتیاط واجب کی بناپر ماموم کو چاہئے کہ الحمد اور سورہ نہ پڑھے اور مستحب ہے کہ اس کے بجائے ذکر پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "730.",
          url: "https://www.leader.ir/en/book/241?sn=32591"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 732",
          url: "https://www.leader.ir/ur/book/197/1?sn=31238"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 732",
          url: "https://www.leader.ir/fa/book/180/1?sn=30868"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        englishWithheld: "Held for review: the automated comparison found a difference in numbers or negation between the English and the Persian original; the Urdu, which matches the Persian, is shown until a person has checked it."
      }
    ]
  },
  {
    id: "takbirbeforeimam",
    topicId: "jamaah",
    subject: {
      en: "Saying takbīrat al-iḥrām before the imam"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A follower must not say takbīrat al‑iḥrām before the imam. In fact, the recommended precaution is that he should not say takbīrat al‑iḥrām until the imam has completed saying it.",
          ur: "مقتدی کوتکبیرۃ الاحرام امام سے پہلے نہیں کہنی چاہئے بلکہ احتیاط مستحب یہ ہے کہ جب تک امام تکبیر نہ کہہ چکے مقتدی تکبیرنہ کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1447",
          url: "https://www.sistani.org/english/book/48/2270/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1447)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A ma‘mūm should not perform the takbīrah al-iḥrām before the imam; rather, by obligatory caution, he is not to say the takbīr until the imam's takbīr is finished.",
          ur: "ماموم کے لئے ضروری ہے کہ امام سے پہلے تکبیرہ الاحرام نہ کہے بلکہ احتیاط واجب یہ ہے کہ جب تک امام کی تکبیر ختم نہ ہوجائے ماموم تکبیر نہ کہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "726.",
          url: "https://www.leader.ir/en/book/241?sn=32591"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 728",
          url: "https://www.leader.ir/ur/book/197/1?sn=31238"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 728",
          url: "https://www.leader.ir/fa/book/180/1?sn=30868"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "joiningruku",
    topicId: "jamaah",
    subject: {
      en: "Joining while the imam is in rukūʿ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person joins congregational prayers when the imam is in rukūʿ, then even if the dhikr of the imam has finished, his congregational prayer is valid and he is regarded as being in his first rakʿah. However, if he bows down to the extent that is required for rukūʿ but the imam is no longer in rukūʿ, he can either complete his prayer on his own or break his prayer to join in the next rakʿah.",
          ur: "اگرکوئی شخص اس وقت اقتداکرے جب امام رکوع میں ہواور امام کے رکوع میں شریک ہوجائے اگرچہ امام نے رکوع کاذکرپڑھ لیاہواس شخص کی نماز صحیح ہے اور وہ ایک رکعت شمار ہوگی لیکن اگروہ شخص بقدررکوع کے جھکے تاہم امام کو رکوع میں نہ پا سکے تو وہ شخص اپنی نمازفرادیٰ کی نیت سے ختم کر سکتاہے اور جماعت کی اگلی رکعت میں شریک ہونے کےلئے اپنی نماز کو توڑ سکتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1407",
          url: "https://www.sistani.org/english/book/48/2268/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1407)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If one joins the prayer while the imam is in rukū‘, one of the following situations may occur:\n1. If one reaches the imam's rukū‘, the congregational prayer is valid and counts as one rak‘ah even if the imam's dhikr is over.\n2. If the imam is getting up from rukū‘ or is in standing posture when the ma‘mūm starts to be in rukū‘, then the prayer in furādā form is valid and is considered as the first rak‘ah of his prayer. So, he must continue the prayer.\n3. If one bows to the extent of rukū‘ but doubts whether he has reached the imam's rukū‘ or not, his prayer is valid in the form of furādā, it is counted as the first rak‘ah of his prayer and he should continue the prayer.\n4. If the imam raises from rukū‘ before the ma‘mūm’s being in rukū‘ posture, then he can make furādā intention."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "745.",
          url: "https://www.leader.ir/en/book/241?sn=32594"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 747",
          url: "https://www.leader.ir/fa/book/180/1?sn=30871"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "followerahead",
    topicId: "jamaah",
    subject: {
      en: "Standing ahead of the imam"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A follower must not stand in front of the imam. In fact, the obligatory precaution is that if there are a number of followers, they must not stand in line with the imam; however, if the follower is only one person, there is no problem if he stands in line with the imam.",
          ur: "مقتدی کوامام سے آگے نہیں کھڑاہوناچاہئے بلکہ احتیاط واجب یہ ہے کہ اگرمقتدی زیادہ ہوں توامام کے برابر نہ کھڑے ہوں ۔ لیکن اگرمقتدی ایک آدمی ہو تو امام کے برابرکھڑے ہونے میں کوئی حرج نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1412",
          url: "https://www.sistani.org/english/book/48/2268/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1412)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The followings terms should be observed in congregational prayer:\n1- A ma‘mūm should not stand in front of the imam. Rather, it is an obligatory caution to stand a little behind.\n2- The imam’s place should not be higher than that of ma‘mūms. Of course, a little difference, less than one handspan, is no problem.\n3- There should not be a long gap between the imam and the ma‘mūm nor among different rows.\n4- There should not be a barrier, like a wall or a curtain, between the imam and the ma‘mūm nor among the rows. However, putting a curtain or the like between the rows of men and women is no problem."
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "717.",
          url: "https://www.leader.ir/en/book/241?sn=32590"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 719",
          url: "https://www.leader.ir/fa/book/180/1?sn=30867"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "womenimam",
    topicId: "jamaah",
    subject: {
      en: "A woman leading women"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If both the imam and the followers are women, the obligatory precaution is that they must all stand in one line, and the imam must not stand in front of the others.",
          ur: "اگرامام اورمقتدی دونوں عورتیں ہوں تواحتیاط واجب یہ ہے کہ سب ایک دوسرے کے برابر برابرکھڑی ہوں اورامام مقتدیوں سے آگے نہ کھڑی ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1460",
          url: "https://www.sistani.org/english/book/48/2271/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1460)",
          url: "https://www.sistani.org/urdu/book/61/3640/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "If all ma‘mūms are women, it is permissible for their imam to be a woman.",
          ur: "اگر تمام مامومین خواتین ہوں تو عورت کا امام جماعت ہونا جائز ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "712.",
          url: "https://www.leader.ir/en/book/241?sn=32589"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 714",
          url: "https://www.leader.ir/ur/book/197/1?sn=31236"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 714",
          url: "https://www.leader.ir/fa/book/180/1?sn=30866"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ayatcauses",
    topicId: "otherprayers",
    subject: {
      en: "When the prayer of signs (ṣalāt al-āyāt) is obligatory"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Ṣalāt al‑āyāt, for which the method of performance will be explained later, becomes obligatory when the following three phenomena occur:\n1. solar eclipse;\n2. lunar eclipse;\nand with the occurrence of these two phenomena, ṣalāt al‑āyāt becomes obligatory even if the eclipse is partial and one is not frightened by it;\n3. earthquake, based on obligatory precaution, even if one is not frightened by it.\nBased on recommended precaution, ṣalāt al‑āyāt should be performed when thunder and lightning, gales that make the sky look black or red, and other similar natural celestial phenomena occur, provided that most people are frightened by them. Similarly, [the prayer should be performed] when natural terrestrial phenomena occur that cause most people to fear, such as sinkholes and rock-slides."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1470",
          url: "https://www.sistani.org/english/book/48/2273/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Āyāt prayer becomes obligatory for one of the following four reasons:\n1. Solar eclipse, even if only a very small part of sun is not visible;\n2. lunar eclipse, even if only a very small part of moon is not visible;\n3. Earthquake;\n4. Any abnormal event in the sky that causes fear to most of the people, such as black and red winds and lightning.",
          ur: "نماز آیات مندرجہ ذیل چار میں سے کسی ایک کے سبب واجب ہوتی ہے؛\n1۔ کسوف (سورج گرہن) اگر چہ کچھ حصے کو ہی گرہن لگے۔\n2۔ خسوف (چاند گرہن) اگرچہ کچھ حصے کو ہی گرہن لگے۔\n3۔ زلزلہ\n4۔ ہر غیر معمولی حادثہ جس کے باعث لوگوں کی اکثریت خوف میں مبتلا ہوجائے مثلاً سیاہ و سرخ آندھی اور بجلی کی کڑک۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "660.",
          url: "https://www.leader.ir/en/book/241?sn=32580"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 662",
          url: "https://www.leader.ir/ur/book/197/1?sn=31227"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 662",
          url: "https://www.leader.ir/fa/book/180/1?sn=30858"
        },
        verification: "A",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "ayatmethod",
    topicId: "otherprayers",
    subject: {
      en: "How the prayer of signs is performed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Ṣalāt al‑āyāt consists of two rakʿahs, and in each rakʿah there are five rukūʿs. The method of performing the prayer is as follows: after one has made the intention [of performing the prayer], he says takbīr, recites one Sūrat al-Ḥamd and one other complete surah, goes into rukūʿ, and raises his head from rukūʿ; then, he again recites one Sūrat al-Ḥamd and one other complete surah, goes into rukūʿ again, and so on until he has done this a total of five times. After getting up from the fifth rukūʿ, he performs two sajdahs, stands up, and proceeds to perform the second rakʿah in the same way as the first; he then says tashahhud and the salām of the prayer."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1486",
          url: "https://www.sistani.org/english/book/48/2274/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The āyāt prayer consists of two rak‘ahs, each rak‘ah consists of five rukū‘ and two sajdah, and it can be performed in several ways:\nThe first form: in each rak‘ah, chapter al-Fātiḥah and another chapter are recited five times. In this way, after the intention and takbīrah al-iḥrām, he recites the chapter al-Fātiḥah and another complete chapter and goes to rukū‘, then lifts his head from rukū‘, recites chapter al-Fātiḥah and another chapter again and goes to the second rukū‘, and again lifts his head from rukū‘ and so on. He continues until five rukū‘ are performed, then he goes to prostration, and after performing two prostrations, he performs the second rak‘ah like the first rak‘ah, and after performing two prostrations, he recites tashahhud and salām.\nThe second form: only the chapter al-Fātiḥah and another complete chapter is recited in each rak‘ah. In this way, he divides the second chapter into five parts, and after the intention and takbīrah al-iḥrām, recites the chapter al-Fātiḥah and a part of the other chapter (whether it is one verse, less or more) and goes to rukū‘, and after rukū‘ without reciting chapter al-Fātiḥah he recites the second part of the other chapter and then performs the second rukū‘, and continues in this way until the chapter of which he recited a part before each rukū‘, is finished before the last rukū‘, then he performs the fifth rukū‘ and two sajdah, then he performs the second rak‘ah like the first rak‘ah and recites tashahhud and salām.",
          ur: "نماز آیات کی دو رکعت ہیں ۔ ہر رکعت میں پانچ رکوع اور دو سجدے ہیں اور اسے کئی طریقوں سے بجالاسکتے ہیں:\nپہلا طریقہ: ہر رکعت میں پانچ دفعہ الحمد اور سورہ پڑھے اس طرح کہ نیت اور تکبیر ہ الاحرام کہنے کے بعد ایک مرتبہ سورہ حمد اور پورا سورہ پڑھے، اس کے بعد رکوع کرے پھر سر اٹھا کر دوبارہ الحمد اور سورہ پڑھے اوردوسرے رکوع میں جائے پھر رکوع سے سر اٹھائے اور اسی طرح جاری رکھے یہاں تک کہ پانچ مرتبہ رکوع پورے ہوجائیں اور اس کے بعد سجدے میں جائے اور دو سجدے بجالانے کے بعد دوسری رکعت کو بھی پہلی رکعت کی طرح بجالائے اور دو سجدے انجام دینے کے بعد تشہد اور سلام پڑھے۔\nدوسرا طریقہ: ہر رکعت میں صرف ایک مرتبہ سورہ حمد اور سورہ پڑھے اس طرح کہ سورے کو پانچ حصوں میں تقسیم کرے اور نیت اور تکبیرہ الاحرام کے بعد الحمد اور سورہ کا ایک حصہ(ایک آیت یا اس سے کم یا زیادہ) پڑھے اور رکوع میں جائے اور رکوع سے سر اٹھانے کے بعد الحمد پڑھے بغیر سورے کا دوسرا حصہ پڑھے اور دوسرے رکوع میں جائے اور اسی طرح جاری رکھے اور ہر رکوع سے پہلے جس سورے کا ایک حصہ پڑھا ہے، آخری رکوع سے پہلے وہ سورہ ختم ہوجائے ،اس کے بعد پانچویں رکوع کو بجالائے اور سجدے میں جائے ۔ دونوں سجدوں کے بعد دوسری رکعت کو بھی پہلی رکعت کی طرح انجام دے اور تشہد اور سلام پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "673.",
          url: "https://www.leader.ir/en/book/241?sn=32582"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 675",
          url: "https://www.leader.ir/ur/book/197/1?sn=31229"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 675",
          url: "https://www.leader.ir/fa/book/180/1?sn=30860"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ayatshort",
    topicId: "otherprayers",
    subject: {
      en: "The shorter method of the prayer of signs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "[A shorter method of performing ṣalāt al‑āyāt is as follows:] after one has made the intention [of performing the prayer], he says takbīr and recites Sūrat al-Ḥamd; then, he divides the verses of the other surah into five parts and recites one verse or more, or even less, provided that – based on obligatory precaution – it is a complete sentence. He must start from the beginning of the surah and must not suffice with reciting bismillāh [on its own and count that as one verse]. Then, he goes into rukūʿ, raises his head, and without reciting Sūrat al-Ḥamd he recites the second part of the other surah. He then goes into rukūʿ again, and so on until he completes the other surah before he goes into the fifth rukūʿ. For example, if the other surah is Sūrat al-Falaq, he first says:\nبِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ۞ قُلْ أَعُوْذُ بِرَبِّ الْفَلَقِ\nbismil lāhir raḥmānir raḥīm. qul aʿūdhu birabbil falaq\nIn the Name of Allah, the All-Beneficent, the Ever-Merciful. Say, ‘I seek refuge in the Lord of the daybreak,\n...and goes into rukūʿ [for the first time]; he then stands up and says:\nمِنْ شَرِّ مَا خَلَقَ\nmin sharri mā khalaq\nfrom the evil of what He created,\n...and goes into rukūʿ again [for the second time]; he then stands up and says:\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nwa min sharri ghāsiqin idhā waqab\nand from the evil of the darkness of night when it settles,\n...and goes into rukūʿ again [for the third time]; he then stands up and says:\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nwa min sharrin naffāthāti fil ʿuqad\nand from the evil of those who blow on knots,\n...and goes into rukūʿ again [for the fourth time]; he then stands up and says:\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ\nwa min sharri ḥāsidin idhā ḥasad\nand from the evil of an envier when he envies.’\n...and goes into rukūʿ for the fifth time. He then stands up, performs two sajdahs, and proceeds to perform the second rakʿah in the same way as the first. After the second sajdah [of the second rakʿah], he says tashahhud and the salām of the prayer. It is permitted for one to divide the surah into less than five parts, but whenever he completes the surah, it is necessary that he recite Sūrat al-Ḥamd before performing the next rukūʿ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1487",
          url: "https://www.sistani.org/english/book/48/2274/"
        },
        verification: "A",
        arabicInSource: true,
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "ayatruku",
    topicId: "otherprayers",
    subject: {
      en: "Every rukūʿ of the prayer of signs is a rukn"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Every rukūʿ of ṣalāt al‑āyāt is a rukn; therefore, if a rukūʿ is intentionally omitted or added, the prayer is invalid. The same applies if a rukūʿ is mistakenly omitted or, based on obligatory precaution, if it is mistakenly added.",
          ur: "نمازآیات کاہررکوع رکن ہے اوراگران میں عمداًکمی یابیشی ہو جائے تونمازباطل ہے اوریہی حکم ہے اگرغلطی سے کمی ہویا(احتیاط کی بناپر)غلطی سےزیادہ ہو جائے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1494",
          url: "https://www.sistani.org/english/book/48/2274/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1494)",
          url: "https://www.sistani.org/urdu/book/61/3641/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "Each rukū‘ in āyāt prayer is rukn (a fundamental part), i.e. if one performs less/more rukū‘ intentionally or by mistake, the prayer is invalidated.",
          ur: "نماز آیات کا ہر رکوع رکن ہے لہذا اگر عمدا یا بھولے سے کم یا زیادہ ہوجائے تو نماز باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "679.",
          url: "https://www.leader.ir/en/book/241?sn=32583"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 681",
          url: "https://www.leader.ir/ur/book/197/1?sn=31230"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 681",
          url: "https://www.leader.ir/fa/book/180/1?sn=30861"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "eidstatus",
    topicId: "otherprayers",
    subject: {
      en: "The Eid prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The Eid al-Fiṭr and Eid al-Aḍḥā prayer is obligatory during the presence of the Imam (ʿA) and must be performed in congregation. In our time, when the Imam (ʿA) is in occultation, the prayer is recommended and it can be performed in congregation or on one’s own."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1495",
          url: "https://www.sistani.org/english/book/48/2275/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "‘Īd of Fitṛ and ‘Īd of Aḍḥā prayers are obligatory during the presence of the infallible Imam (peace be upon him) and should be performed in congregation. However, it is mustaḥabb at the present time (which is the time of his long absence).",
          ur: "عید فطر اور عید قربان کی نماز یں معصوم علیہ السلام کے زمانہ حضور میں واجب ہیں اور ضروری ہے کہ جماعت کے ساتھ پڑھی جائیں اور آج کے زمانے میں (زمانہ غیبت کبری میں) مستحب ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "681.",
          url: "https://www.leader.ir/en/book/241?sn=32584"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 683",
          url: "https://www.leader.ir/ur/book/197/1?sn=31231"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 683",
          url: "https://www.leader.ir/fa/book/180/1?sn=30862"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "eidtime",
    topicId: "otherprayers",
    subject: {
      en: "Time of the Eid prayers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The time for the Eid al-Fiṭr and Eid al-Aḍḥā prayer is from the start of sunrise to the time of ẓuhr prayers on the day of Eid.",
          ur: "نمازعیدفطروقربان کاوقت عیدکے دن طلوع آفتاب سے ظہرتک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1496",
          url: "https://www.sistani.org/english/book/48/2275/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (1496)",
          url: "https://www.sistani.org/urdu/book/61/3642/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "‘Īd of Fitṛ or ‘Īd of Aḍḥā prayer's time is from sunrise to shar‘ī noon.",
          ur: "نماز عید فطر و عید قربان کا وقت عید کے دن اول طلوع آفتاب سے ظہر تک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "682.",
          url: "https://www.leader.ir/en/book/241?sn=32584"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 684",
          url: "https://www.leader.ir/ur/book/197/1?sn=31231"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 684",
          url: "https://www.leader.ir/fa/book/180/1?sn=30862"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "fridayprayer",
    topicId: "otherprayers",
    subject: {
      en: "The Friday prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The Friday prayer consists of two rakʿahs like the ṣubḥ prayer, with the difference that in the Friday prayer, two sermons must be delivered before it. The Friday prayer is an optional obligation (al‑wājib al‑takhyīrī), meaning that on Fridays, someone who is duty-bound (mukallaf) has the option to either perform the Friday prayer – if all its conditions are fulfilled – or the ẓuhr prayer; and if he performs the Friday prayer, it will suffice in place of the ẓuhr prayer.\nSome conditions must be met for the Friday prayer to be obligatory:\n1. the time for the prayer must have set in. This refers to the time of zawāl, or in other words, the time of ẓuhr. Furthermore, the time for the Friday prayer is that which is commonly regarded to be the beginning of zawāl; therefore, if the Friday prayer is delayed beyond this time, its time will be deemed over and the ẓuhr prayer must be performed instead;\n2. the number of people must be at least five, including the imam. If five Muslims do not gather, the Friday prayer does not become obligatory;\n3. there must be an imam who meets all the conditions, such as being dutiful (ʿādil) and all the other qualities that are required of an imam, which will be mentioned in the section on congregational (jamāʿah) prayers. In the absence of an imam, the Friday prayer does not become obligatory.\nSome conditions must be met for the Friday prayer to be valid:\n1. it must be performed in congregation; therefore, it is not correct (ṣaḥīḥ) to perform the Friday prayer on one’s own (furādā). If the follower (maʾmūm) of an imam in congregational prayers joins the prayer before the rukūʿ of the second rakʿah of the Friday prayer and performs one more rakʿah on his own, his Friday prayer is valid. However, if one joins in the rukūʿ of the second rakʿah, then based on obligatory precaution, he cannot suffice with this Friday prayer and must perform ẓuhr prayers;\n2. the imam must deliver two sermons before the prayer. In the first sermon, he must praise (ḥamd) and eulogise (thanāʾ) Allah, exhort the congregation to God-wariness (taqwā), and recite a short chapter (surah) from the Qur’an. In the second sermon, again he must praise and eulogise Allah and invoke blessings (ṣalawāt) upon the Most Noble Messenger (Ṣ) and the Infallible Imams (ʿA); and the recommended precaution is that he should also seek forgiveness for the believers. Furthermore, it is necessary that the sermons be delivered before the prayer; therefore, if the imam starts the prayer before the two sermons, it is incorrect. Delivering the sermons before ẓuhr time is problematic (maḥall al‑ishkāl) [i.e. based on obligatory precaution, it is not correct]. In addition, it is necessary that the person delivering the sermons be in a standing position; therefore, if he delivers the sermons in a sitting position, it is incorrect. It is also necessary that he sit down a little between the two sermons and that his sitting be short and light. Furthermore, it is necessary that the imam of the congregation deliver the sermons himself, and based on obligatory precaution, he must praise Allah and pray for blessings to be showered upon the Most Noble Messenger (Ṣ) and the Infallible Imams (ʿA) in the Arabic language; however, saying other parts of the sermons in Arabic, such as eulogising Allah and exhorting the congregation to God-wariness, is not a requirement. Indeed, if most of the congregation do not understand Arabic, then the obligatory precaution is that exhorting the congregation to God-wariness must be said in the language of the attendees;\n3. the distance between two Friday prayers must not be less than one farsakh; therefore, if another Friday prayer takes place at a distance of less than 3.4 miles, then in the event that both prayers commenced together, both are invalid. If one of them commences before the other – even to the extent of the takbīrat al‑iḥrām – it is valid and the second one is invalid. However, if after a Friday prayer has taken place it becomes known that another Friday prayer took place at the same time or before it at a distance of less than 3.4 miles, it is not obligatory to perform the ẓuhr prayer. Furthermore, a Friday prayer can only have a prohibitive effect on another one taking place within the stipulated distance if it is a valid Friday prayer and fulfils all the conditions; otherwise, it does not have any prohibitive effect."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 719*",
          url: "https://www.sistani.org/english/book/48/2210/"
        },
        verification: "A",
        note: "Marked * (revised) in the 4th edition. The Urdu text was compared and matches in substance. Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The Friday prayer which replaces the ẓuhr prayer on Fridays is a takhyīrī (optionally incumbent) obligation* at the present time, i.e. during the occultation of Imam Mahdi (a). However, at a time when a just Islamic government is ruling in Iran, the mustaḥabb caution is not to miss it if possible.\n* Takhyīrī obligation means that the person is allowed to offer either the Friday prayer or ẓuhr prayer.",
          ur: "موجودہ زمانے (زمانہ غیبت امام عجل اللہ فرجہ الشریف) میں نماز جمعہ پڑھنا کہ جو جمعے کے روز نماز ظہر کے جگہ پڑھی جاتی ہے، واجب تخییری ہے اور احتیاط مستحب یہ ہے کہ آج کے دور میں کہ جب ایران میں اسلامی عادل حکومت قائم ہے حتی الامکان نماز جمعہ کو ترک نہ کیا جائے۔\n* ۔ واجب تخییری سے مراد یہ ہے کہ مکلف کو روز جمعہ کے ظہر کے وقت واجب فریضے کی ادائیگی میں نماز جمعہ یا نماز ظہر پڑھنے کے مابین اختیار حاصل ہے کہ کسی ایک کو واجب کی نیت سے پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "762.",
          url: "https://www.leader.ir/en/book/241?sn=32599"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 764",
          url: "https://www.leader.ir/ur/book/197/1?sn=31246"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 764",
          url: "https://www.leader.ir/fa/book/180/1?sn=30876"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ]
  },
  {
    id: "fridaybest",
    topicId: "otherprayers",
    subject: {
      en: "When the Friday prayer is established"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Whenever the Friday prayer takes place with all its conditions fulfilled, if the one establishing it is the infallible Imam (ʿA) or his specific representative, it is obligatory to attend it; otherwise, it is not obligatory. In the first situation, however, it is not obligatory for the following groups of people to attend:\n1. women;\n2. slaves;\n3. travellers, even those travellers whose duty is to perform the complete (tamām) form of the prayer, such as those who have made an intention to stay [at their destination for ten or more days];\n4. the sick, blind, and aged;\n5. those who are more than two farsakhs [6.8 miles] from a place of Friday prayer;\n6. those who find it difficult and hard to attend the Friday prayer on account of rain, severe cold, and suchlike."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 720",
          url: "https://www.sistani.org/english/book/48/2210/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "The required term for a Friday prayer to be valid are as follows:\n1. It should be in congregation;\n2. There must be five person, Imam and four ma‘mūms;\n3. observing all requirements for a congregational prayer, like valid connection among imam and ma‘mūms;\n4. The distance between this Friday prayer and the nearest one should not be less than 5125 meter (one farsakh).",
          ur: "نماز جمعہ کی شرائط مندرجہ ذیل ہیں :\n1 ۔ جماعت کے ساتھ ہو۔\n2 ۔ کم از کم پانچ افراد ہوں(ایک امام اور چار ماموم)\n3 ۔ نماز جماعت کی تمام شرائط کی رعایت کرنا مثلاً صفوں کا متصل ہونا۔\n4 ۔ دو نماز جمعہ کے درمیان کم از کم ایک فرسخ فاصلہ ہو۔\n* ۔ ایک فرسخ تقریباً 5125 میٹر (5/125 کلو میٹر) ہوتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "764.",
          url: "https://www.leader.ir/en/book/241?sn=32600"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 766",
          url: "https://www.leader.ir/ur/book/197/1?sn=31247"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 766",
          url: "https://www.leader.ir/fa/book/180/1?sn=30877"
        },
        verification: "A",
        referToRisala: "Held for review: an automated comparison found a difference in numbers or negation between the versions of this ruling that the Persian original did not settle. It is not shown until a person has checked it; please read it in the marja's own book."
      }
    ]
  },
  {
    id: "fridayzuhr",
    topicId: "otherprayers",
    subject: {
      en: "Praying ẓuhr instead of the Friday prayer"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If the Friday prayer is obligatory for someone but he performs the ẓuhr prayer instead, his prayer is valid.",
          ur: "جس شخص پر نماز جمعہ واجب ہے اگر وہ نماز جمعہ کےبجائے نماز ظہر پڑھ لے تو اس کی نماز صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 721",
          url: "https://www.sistani.org/english/book/48/2210/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (721)",
          url: "https://www.sistani.org/urdu/book/61/3637/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "A person who is not participating in the Friday prayer can perform ẓuhr prayer at the beginning of its time and it is not obligatory to wait until the Friday prayer ends.",
          ur: "جس شخص نے نماز جمعہ میں شرکت نہ کی ہو، نماز ظہر کو اول وقت میں پڑھ سکتا ہے اور نماز جمعہ ختم ہونے تک انتظار کرنا واجب نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "The Rules on Prayer & Fasting 2023",
          reference: "784.",
          url: "https://www.leader.ir/en/book/241?sn=32605"
        },
        urSource: {
          title: "نماز اور روزه کی احکام",
          reference: "مسئلہ 786",
          url: "https://www.leader.ir/ur/book/197/1?sn=31253"
        },
        persianSource: {
          title: "رساله نماز و روزه",
          reference: "مسأله 786",
          url: "https://www.leader.ir/fa/book/180/1?sn=30883"
        },
        verification: "A"
      }
    ]
  }
];
