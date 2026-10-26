// Salat guided prayers — Phase 3. Step titles are app-written labels; each
// `instruction` is a verbatim excerpt of the ruling in `rulingId` for the same
// marja' (the validator checks this). Recitations are text only (decision Q9).
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
import type { Procedure } from "../types";

export const SALAT_PROCEDURES: Procedure[] = [
  {
    id: "fajrsistani",
    topicId: "guidedprayers",
    marjaId: "sistani",
    title: {
      en: "Guided prayer: ṣubḥ (fajr), 2 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "One must perform prayers with the intention of qurbah, i.e. in humility and obedience to the Lord of the worlds"
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying ‘allāhu akbar’ at the beginning of every prayer is obligatory and an elementary part of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all the obligatory and recommended prayers, it is recommended to perform qunūt before the rukūʿ of the second rakʿah."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "After completing tashahhud of the last rakʿah of the prayer, it is recommended that while one is sitting and his body is still, he should say:\nاَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\nassalāmu ʿalayka ayyuhan nabiyyu wa raḥmatul lāhi wa barakātuh\nPeace be upon you O Prophet, and Allah’s mercy and His blessings (be upon you too).\nAnd after that, he must say:\nاَلسَّلَامُ عَلَيْكُمْ\nassalāmu ʿalaykum"
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      }
    ]
  },
  {
    id: "maghribsistani",
    topicId: "guidedprayers",
    marjaId: "sistani",
    title: {
      en: "Guided prayer: maghrib, 3 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "One must perform prayers with the intention of qurbah, i.e. in humility and obedience to the Lord of the worlds"
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying ‘allāhu akbar’ at the beginning of every prayer is obligatory and an elementary part of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all the obligatory and recommended prayers, it is recommended to perform qunūt before the rukūʿ of the second rakʿah."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Rakʿah 3 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "In the third and fourth rakʿahs of prayers, a person can either recite one Sūrat al-Ḥamd or say one al‑tasbīḥāt al‑arbaʿah, i.e. he can say once:\nسُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ\nsubḥānal lāhi wal ḥamdu lillāhi wa lā ilāha illal lāhu wallāhu akbar"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s20",
        order: 20,
        title: {
          en: "Rakʿah 3 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s21",
        order: 21,
        title: {
          en: "Rakʿah 3 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s22",
        order: 22,
        title: {
          en: "Rakʿah 3 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s23",
        order: 23,
        title: {
          en: "Rakʿah 3 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s24",
        order: 24,
        title: {
          en: "Rakʿah 3 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s25",
        order: 25,
        title: {
          en: "Rakʿah 3 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s26",
        order: 26,
        title: {
          en: "Rakʿah 3 · Tashahhud"
        },
        instruction: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s27",
        order: 27,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "After completing tashahhud of the last rakʿah of the prayer, it is recommended that while one is sitting and his body is still, he should say:\nاَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\nassalāmu ʿalayka ayyuhan nabiyyu wa raḥmatul lāhi wa barakātuh\nPeace be upon you O Prophet, and Allah’s mercy and His blessings (be upon you too).\nAnd after that, he must say:\nاَلسَّلَامُ عَلَيْكُمْ\nassalāmu ʿalaykum"
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      }
    ]
  },
  {
    id: "zuhrsistani",
    topicId: "guidedprayers",
    marjaId: "sistani",
    title: {
      en: "Guided prayer: ẓuhr, 4 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "One must perform prayers with the intention of qurbah, i.e. in humility and obedience to the Lord of the worlds"
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying ‘allāhu akbar’ at the beginning of every prayer is obligatory and an elementary part of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "In the first and second rakʿahs of the daily obligatory prayers, one must recite Sūrat al-Ḥamd followed by another surah"
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all the obligatory and recommended prayers, it is recommended to perform qunūt before the rukūʿ of the second rakʿah."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Rakʿah 3 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "In the third and fourth rakʿahs of prayers, a person can either recite one Sūrat al-Ḥamd or say one al‑tasbīḥāt al‑arbaʿah, i.e. he can say once:\nسُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ\nsubḥānal lāhi wal ḥamdu lillāhi wa lā ilāha illal lāhu wallāhu akbar"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s20",
        order: 20,
        title: {
          en: "Rakʿah 3 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s21",
        order: 21,
        title: {
          en: "Rakʿah 3 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s22",
        order: 22,
        title: {
          en: "Rakʿah 3 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s23",
        order: 23,
        title: {
          en: "Rakʿah 3 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s24",
        order: 24,
        title: {
          en: "Rakʿah 3 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s25",
        order: 25,
        title: {
          en: "Rakʿah 3 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s26",
        order: 26,
        title: {
          en: "Rakʿah 4 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "In the third and fourth rakʿahs of prayers, a person can either recite one Sūrat al-Ḥamd or say one al‑tasbīḥāt al‑arbaʿah, i.e. he can say once:\nسُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ\nsubḥānal lāhi wal ḥamdu lillāhi wa lā ilāha illal lāhu wallāhu akbar"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s27",
        order: 27,
        title: {
          en: "Rakʿah 4 · Rukūʿ"
        },
        instruction: {
          en: "In every rakʿah after qirāʾah, one must bend forward to the extent that he can place all his fingertips, including his thumb, on his knees. This action is called ‘rukūʿ’."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s28",
        order: 28,
        title: {
          en: "Rakʿah 4 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "It is better that when one has the option to, he says in rukūʿ:\n...although saying any dhikr suffices; and based on obligatory precaution, [the other dhikr] must be of this length. However, if time is short or one is compelled, then saying subḥānal lāh once suffices. Someone who cannot say subḥāna rabbiyal ʿaẓīmi wa biḥamdih properly must say another dhikr, such as subḥānal lāh, three times."
        },
        rulingId: "rukudhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "rukudhikrarabic"
        ]
      },
      {
        id: "s29",
        order: 29,
        title: {
          en: "Rakʿah 4 · Stand up straight"
        },
        instruction: {
          en: "After completing the dhikr of rukūʿ, one must stand straight"
        },
        rulingId: "afterruku"
      },
      {
        id: "s30",
        order: 30,
        title: {
          en: "Rakʿah 4 · First sajdah"
        },
        instruction: {
          en: "In every rakʿah of the obligatory and recommended prayers, one must perform two sajdahs after rukūʿ."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the five rukns of the prayer in Ruling 928. Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s31",
        order: 31,
        title: {
          en: "Rakʿah 4 · Dhikr of sajdah"
        },
        instruction: {
          en: "When one has the option to, it is better that in sajdah he says:\n...and these words must be said consecutively and in correct Arabic. Saying any dhikr suffices, but it must be of this length based on obligatory precaution. And it is recommended that one say subḥāna rabbiyal aʿlā wa biḥamdih three, five, seven, or even more times."
        },
        rulingId: "sajdahdhikr",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction).",
        recitationIds: [
          "sajdahdhikrarabic"
        ]
      },
      {
        id: "s32",
        order: 32,
        title: {
          en: "Rakʿah 4 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After completing the dhikr of the first sajdah, one must sit until his body becomes still and then go into sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s33",
        order: 33,
        title: {
          en: "Rakʿah 4 · Tashahhud"
        },
        instruction: {
          en: "In the second rakʿah of all obligatory and recommended prayers, and in the third rakʿah of maghrib prayers, and in the fourth rakʿah of ẓuhr, ʿaṣr and ʿishāʾ prayers, one must sit [in a kneeling type of position] after the second sajdah; and while his body is still, he must say tashahhud, i.e.:\nأَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اَللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ\nashhadu an lā ilāha illal lāhu waḥdahu lā sharīka lah, wa ashhadu anna muḥammadan ʿabduhu wa rasūluh, allāhumma ṣalli ʿalā muḥammadin wa āli muḥammad"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      },
      {
        id: "s34",
        order: 34,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "After completing tashahhud of the last rakʿah of the prayer, it is recommended that while one is sitting and his body is still, he should say:\nاَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\nassalāmu ʿalayka ayyuhan nabiyyu wa raḥmatul lāhi wa barakātuh\nPeace be upon you O Prophet, and Allah’s mercy and His blessings (be upon you too).\nAnd after that, he must say:\nاَلسَّلَامُ عَلَيْكُمْ\nassalāmu ʿalaykum"
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory components listed in “Obligatory Components of the Prayer” (section introduction)."
      }
    ]
  },
  {
    id: "fajrkhamenei",
    topicId: "guidedprayers",
    marjaId: "khamenei",
    title: {
      en: "Guided prayer: ṣubḥ (fajr), 2 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "Making an intention is obligatory for performing the prayer, which means performing a specified prayer to comply with the order of God."
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying takbīrah al-iḥrām is obligatory for the prayer; namely, saying Allāhu akbar at the beginning of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all obligatory and mustaḥabb prayers, it is mustaḥabb to raise the hands and recite supplication in the second rak‘ah, after recitation of chapter al-Fātiḥah and the second chapter but before rukū‘. This action is called qunūt."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "The last part of prayer, with the recitation of which the prayer ends, is salām."
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      }
    ]
  },
  {
    id: "maghribkhamenei",
    topicId: "guidedprayers",
    marjaId: "khamenei",
    title: {
      en: "Guided prayer: maghrib, 3 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "Making an intention is obligatory for performing the prayer, which means performing a specified prayer to comply with the order of God."
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying takbīrah al-iḥrām is obligatory for the prayer; namely, saying Allāhu akbar at the beginning of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all obligatory and mustaḥabb prayers, it is mustaḥabb to raise the hands and recite supplication in the second rak‘ah, after recitation of chapter al-Fātiḥah and the second chapter but before rukū‘. This action is called qunūt."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Rakʿah 3 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "It is enough in the 3rd and 4th rak‘ah of the prayer to say Subḥānallāhi wal ḥamdu lillhāhi wa lā ilḥā illallāu wallāhu akbar once.",
          ur: "نماز کی تیسری اور چوتھی رکعت میں ایک دفعہ سبحان الله والحمدلله ولا الله الاالله والله اکبر پڑھنا کافی ہے"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s20",
        order: 20,
        title: {
          en: "Rakʿah 3 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s21",
        order: 21,
        title: {
          en: "Rakʿah 3 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s22",
        order: 22,
        title: {
          en: "Rakʿah 3 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s23",
        order: 23,
        title: {
          en: "Rakʿah 3 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s24",
        order: 24,
        title: {
          en: "Rakʿah 3 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s25",
        order: 25,
        title: {
          en: "Rakʿah 3 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s26",
        order: 26,
        title: {
          en: "Rakʿah 3 · Tashahhud"
        },
        instruction: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s27",
        order: 27,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "The last part of prayer, with the recitation of which the prayer ends, is salām."
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      }
    ]
  },
  {
    id: "zuhrkhamenei",
    topicId: "guidedprayers",
    marjaId: "khamenei",
    title: {
      en: "Guided prayer: ẓuhr, 4 rakʿahs"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "Making an intention is obligatory for performing the prayer, which means performing a specified prayer to comply with the order of God."
        },
        rulingId: "intention",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Takbīrat al-iḥrām"
        },
        instruction: {
          en: "Saying takbīrah al-iḥrām is obligatory for the prayer; namely, saying Allāhu akbar at the beginning of the prayer."
        },
        rulingId: "takbir",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Rakʿah 1 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Rakʿah 1 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Rakʿah 1 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Rakʿah 1 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Rakʿah 1 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s8",
        order: 8,
        title: {
          en: "Rakʿah 1 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s9",
        order: 9,
        title: {
          en: "Rakʿah 1 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s10",
        order: 10,
        title: {
          en: "Rakʿah 2 · Recite al-Ḥamd and another surah"
        },
        instruction: {
          en: "One should recite chapter al-Fātiḥah in the first and second rak‘ah of the daily obligatory prayers, and thereafter, one should recite, by obligatory caution, a complete chapter."
        },
        rulingId: "fatihasurah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s11",
        order: 11,
        title: {
          en: "Rakʿah 2 · Qunūt (recommended)"
        },
        instruction: {
          en: "In all obligatory and mustaḥabb prayers, it is mustaḥabb to raise the hands and recite supplication in the second rak‘ah, after recitation of chapter al-Fātiḥah and the second chapter but before rukū‘. This action is called qunūt."
        },
        rulingId: "qunut",
        hukm: "mustahab"
      },
      {
        id: "s12",
        order: 12,
        title: {
          en: "Rakʿah 2 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s13",
        order: 13,
        title: {
          en: "Rakʿah 2 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s14",
        order: 14,
        title: {
          en: "Rakʿah 2 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s15",
        order: 15,
        title: {
          en: "Rakʿah 2 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s16",
        order: 16,
        title: {
          en: "Rakʿah 2 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s17",
        order: 17,
        title: {
          en: "Rakʿah 2 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s18",
        order: 18,
        title: {
          en: "Rakʿah 2 · Tashahhud"
        },
        instruction: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s19",
        order: 19,
        title: {
          en: "Rakʿah 3 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "It is enough in the 3rd and 4th rak‘ah of the prayer to say Subḥānallāhi wal ḥamdu lillhāhi wa lā ilḥā illallāu wallāhu akbar once.",
          ur: "نماز کی تیسری اور چوتھی رکعت میں ایک دفعہ سبحان الله والحمدلله ولا الله الاالله والله اکبر پڑھنا کافی ہے"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s20",
        order: 20,
        title: {
          en: "Rakʿah 3 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s21",
        order: 21,
        title: {
          en: "Rakʿah 3 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s22",
        order: 22,
        title: {
          en: "Rakʿah 3 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s23",
        order: 23,
        title: {
          en: "Rakʿah 3 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s24",
        order: 24,
        title: {
          en: "Rakʿah 3 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s25",
        order: 25,
        title: {
          en: "Rakʿah 3 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s26",
        order: 26,
        title: {
          en: "Rakʿah 4 · Al-tasbīḥāt al-arbaʿah (or al-Ḥamd), quietly"
        },
        instruction: {
          en: "It is enough in the 3rd and 4th rak‘ah of the prayer to say Subḥānallāhi wal ḥamdu lillhāhi wa lā ilḥā illallāu wallāhu akbar once.",
          ur: "نماز کی تیسری اور چوتھی رکعت میں ایک دفعہ سبحان الله والحمدلله ولا الله الاالله والله اکبر پڑھنا کافی ہے"
        },
        rulingId: "thirdfourthrakah",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s27",
        order: 27,
        title: {
          en: "Rakʿah 4 · Rukūʿ"
        },
        instruction: {
          en: "In every rak‘ah after the recitation, the praying person should make a rukū‘, i.e. to bow to an extent that he is able to place his palms on his knees, and it is sufficient if only the fingertips can reach the knees."
        },
        rulingId: "ruku",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s28",
        order: 28,
        title: {
          en: "Rakʿah 4 · Dhikr of rukūʿ"
        },
        instruction: {
          en: "سُبْحَانَ ربی العظیم و بحمده\nGlorified is my Lord, the Almighty, and I praise Him"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s29",
        order: 29,
        title: {
          en: "Rakʿah 4 · Stand up straight"
        },
        instruction: {
          en: "It is obligatory to stand straight after the completion of rukū‘, and after the body has become still, one should go to sajdah."
        },
        rulingId: "afterruku"
      },
      {
        id: "s30",
        order: 30,
        title: {
          en: "Rakʿah 4 · First sajdah"
        },
        instruction: {
          en: "In every rak‘ah of the obligatory or mustaḥabb prayers after rukū‘, two sajdah should be performed, which is to put the forehead on the ground out of humility before Allah."
        },
        rulingId: "twosajdahs",
        hukm: "wajib",
        isRukn: true,
        note: "Rukn: listed among the foundational elements (rukns) of prayer in ruling 140. Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s31",
        order: 31,
        title: {
          en: "Rakʿah 4 · Dhikr of sajdah"
        },
        instruction: {
          en: "سُبْحَانَ ربی الأعلی و بحمده\nGlorified is my Lord, the H"
        },
        rulingId: "dhikrwording",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s32",
        order: 32,
        title: {
          en: "Rakʿah 4 · Sit, then the second sajdah"
        },
        instruction: {
          en: "After finishing the dhikr of the first sajdah, the praying person should sit until his body becomes still and then make sajdah again."
        },
        rulingId: "betweensajdahs"
      },
      {
        id: "s33",
        order: 33,
        title: {
          en: "Rakʿah 4 · Tashahhud"
        },
        instruction: {
          en: "The obligatory dhikr in tashahhud is:\nأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِیکَ لَهُ وَ أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَ رَسُولُهُ اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ"
        },
        rulingId: "tashahhud",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      },
      {
        id: "s34",
        order: 34,
        title: {
          en: "Salām"
        },
        instruction: {
          en: "The last part of prayer, with the recitation of which the prayer ends, is salām."
        },
        rulingId: "salam",
        hukm: "wajib",
        note: "Marked wājib because it is one of the eleven obligatory acts listed in ruling 138."
      }
    ]
  }
];
