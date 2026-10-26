// Taharat (§6.2) rulings — Phase 2.
//
// GENERATED from the official texts, do not hand-edit the quoted strings:
// every `text`/`question`/`instruction` was looked up verbatim (by script) in
// the marja's official website as downloaded on 2026-09-25 —
//   Sistani:  sistani.org Islamic Laws 4th ed. (English) / توضیح المسائل (Urdu)
//   Khamenei: leader.ir Practical Laws of Islam, "Rules on Purity" (English) /
//             استفتاآت کے جوابات, "احکام طهارت" (Urdu; Q numbers run one ahead of the English)
// Revised (*) rulings were compared with the Urdu one by one: where the Urdu
// still has the pre-revision wording, it is withheld (`urduEditionLag`, decision P6).
// `basis` comes from the ruling's own opening words (fatwa / obligatory /
// recommended / unspecified precaution) — never inferred beyond them (R3).
import type { Ruling } from "../types";

export const TAHARAT_RULINGS: Ruling[] = [
  {
    id: "watertypes",
    topicId: "water",
    subject: {
      en: "Unmixed (muṭlaq) and mixed (muḍāf) water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Water is either ‘unmixed’ or ‘mixed’. ‘Mixed’ water is either water obtained from something, such as watermelon juice or rose water; or it is water that has been mixed with something else, such as water that has been mixed with some mud etc., such that it can no longer be called ‘water’. If water is not of the above type, it is ‘unmixed’; and unmixed water is of five types:\n1. kurr water;\n2. qalīl water;\n3. flowing water;\n4. rainwater;\n5. well water.",
          ur: "پانی یامطلق ہوتاہے یامضاف۔ مضاف وہ پانی ہے جوکسی چیز سے حاصل کیاجائے مثلاً تربوز کاپانی گلاب کاعرق (وغیرہ)۔ اس پانی کو بھی مضاف کہتے ہیں جوکسی دوسری چیز سے آلودہ ہومثلاً گدلاپانی جواس حد تک مٹیالا ہو کہ پھراسے پانی نہ کہاجاسکے۔ ان کے علاوہ جو پانی ہو ،اسےآب مطلق کہتے ہیں اور اس کی پانچ قسمیں ہیں :\n(اول:) کرپانی\n(دوم:)قلیل پانی\n(سوم:) جاری پانی\n(چہارم:) بارش کاپانی\n(پنجم:) کنویں کاپانی"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 13",
          url: "https://www.sistani.org/english/book/48/2118/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (13)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the rule of wuḍū’ or ghusl made with water hard by nature such as sea water which is hard by its natural salts (like the water of Urumiyeh Lake in Iran) or water that is harder than that?",
          ur: "جو پانی بذات خود گاڑھاہے اس سے وضو اور غسل کرنے کا حکم کیا ہے ؟ جیسے سمندر کا پانی جو نمکیات کی فراوانی کی وجہ سے گاڑھا ہوچکاہے یا ارومیہ کی جھیل کا پانی یا اس سے بھی زیادہ گاڑھاپانی؟"
        },
        text: {
          en: "The mere hardness of the water due to the presence of salts does not prevent it from being considered as unadulterated water. And the criteria by which the shar‘ī application of unadulterated water comes into effect, is that the water must be regarded as such in the common view.",
          ur: "پانی کا صرف نمکیات کی وجہ سے گاڑھاہونا، اسے خالص پانی کے دائرے سے خارج نہیں کرتا اور خالص پانی کے شرعی احکام کے مرتب ہونے کا معیار یہ ہے کہ اسے عرف عام میں خالص پانی کہا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 73",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 74",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "kurrdefinition",
    topicId: "water",
    subject: {
      en: "What kurr water is"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Kurr water is an amount of water that fills a container with dimensions [i.e. length, breadth, and depth] totalling thirty-six cubic hand spans, which is equivalent to approximately 384 litres."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 14",
          url: "https://www.sistani.org/english/book/48/2119/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "kurrimpurity",
    topicId: "water",
    subject: {
      en: "When kurr water becomes impure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If an intrinsic impurity (ʿayn al‑najāsah) – such as urine or blood – or something that has become impure (mutanajjis) – such as impure clothing – comes into contact with kurr water, in the event that kurr water acquires the smell, colour, or taste of that impurity, it becomes impure; but if the kurr water does not change [in its smell, colour, or taste], it does not become impure.",
          ur: "اگرکوئی چیزعین نجس ہو مثلاً پیشاب یاخون یاوہ چیز جو نجس ہوگئی ہو جیسے کہ نجس لباس ایسے پانی میں گرجائے جس کی مقدار ایک کر کے برابر ہو اور اس کے نتیجے میں نجاست کی بو، رنگ یاذائقہ پانی میں سرایت کرجائے توپانی نجس ہوجائے گا، لیکن اگر ایسی کوئی تبدیلی واقع نہ ہوتونجس نہیں ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 15",
          url: "https://www.sistani.org/english/book/48/2119/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (15)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "kurrdoubt",
    topicId: "water",
    subject: {
      en: "Doubt whether water is still kurr"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "With regard to water that had been equivalent to kurr, if one doubts whether it has become less than kurr or not, it is to be treated as kurr water, meaning that it can still purify an impure object and if an impurity makes contact with it, it does not become impure [as long as its smell, colour, or taste does not change]. As for water that had been less than kurr, if one doubts whether it has become equal to kurr or not, it is ruled to be (i.e. it has the ḥukm of) less than kurr.",
          ur: "اگرپانی کی مقدار ایک کرکے برابر ہواوربعد میں شک ہوکہ آیااب بھی کرکے برابرہے یانہیں تواس کی حیثیت ایک کرپانی ہی کی ہوگی یعنی وہ نجاست کوبھی پاک کرے گااور نجاست کےملنے سے نجس بھی نہیں ہوگا۔ اس کے برعکس جوپانی ایک کر سے کم تھااگراس کے متعلق شک ہوکہ اب اس کی مقدارایک کرکے برابر ہوگئی ہے یا نہیں تواسے ایک کرسے کم ہی سمجھاجائے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 21",
          url: "https://www.sistani.org/english/book/48/2119/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (21)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "For the consequences of kurr water to apply (in the case of waters such as the water stored in train toilets, etc.), is it obligatory to know for sure that the water is kurr? Or is it enough to assume that it is kurr?",
          ur: "کیا پانی پر کر کا حکم اس وقت لگے گا جب اس کے کر ہونے کا علم ہو یا صرف کر پر بنارکھ لینا ہی کافی ہے؟ (جیسے ٹرین و غیرہ کی ٹینکیوں میں موجود پانی)۔"
        },
        text: {
          en: "If it is established that the water was kurr in its previous situation, it will be permissible to apply rules of kurr water to it.",
          ur: "اگر یہ ثابت ہوجائے کہ پہلے وہ کر تھا، تو اس کے کر ہونے پر بنا رکھنا جائز ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 74",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 75",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "qalilwater",
    topicId: "water",
    subject: {
      en: "Qalīl (little) water and impurity"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If qalīl water is poured onto an impure object or an impure object comes into contact with qalīl water, the qalīl water becomes impure. However, if qalīl water is poured over an impure object from above, then the amount that comes into contact with the object is impure, and the amount that does not come into contact with it is pure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 24",
          url: "https://www.sistani.org/english/book/48/2120/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "flowingwater",
    topicId: "water",
    subject: {
      en: "Flowing water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In the event that an impurity makes contact with flowing water – even if it is less than kurr – then as long as the smell, colour, or taste of the water does not change by means of the impurity, it is pure.",
          ur: "جاری پانی اگرچہ کرسے کم ہی کیوں نہ ہونجاست کے ملنے سے تب تک نجس نہیں ہوتاجب تک نجاست کی وجہ سے اس کی بو، رنگ یاذائقہ بدل نہ جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 27",
          url: "https://www.sistani.org/english/book/48/2121/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (27)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the difference between running water and kurr water as far as purification is concerned?",
          ur: "پاک کرنے کے لحاظ سے کر اور جاری پانی میں کیا فرق ہے ؟"
        },
        text: {
          en: "There is no difference between the two in this regard.",
          ur: "دونوں میں کوئی فرق نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 77",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 78",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tapwater",
    topicId: "water",
    subject: {
      en: "Tap and shower water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "With regard to water that pours out from taps and showers and flows in the pipes of bathrooms and buildings, if it is connected to a source that is equal to or greater than kurr, it is ruled to be kurr.",
          ur: "حمام اوربلڈنگ کے نلوں کاپانی جوٹونٹیوں اورشاوروں کے ذریعے بہتاہے اگراس حوض کے پانی سے مل کرجوان نلوں سے متصل ہوایک کرکے برابر ہو تونلوں کاپانی بھی کرپانی کے حکم میں شامل ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 33",
          url: "https://www.sistani.org/english/book/48/2121/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (33)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "To purify a najis carpet or the like, is it enough to apply tap water — which is connected to the city water supply pipes — to a najis area; or should the used water be extracted as well?",
          ur: "اگر نجس قالین یا بڑی دری کو اس ٹونٹی کے پانی سے دھویا جائے جو شہر کو پانی سپلائی کرنے والے بڑے منبع سے متصل ہے تو کیا صرف نجس جگہ تک پانی کے پہنچ جانے سے وہ پاک ہوجائیں گے یا ان سے دھوون (غسالہ)کا جدا کرنا بھی ضروری ہے ؟"
        },
        text: {
          en: "After applying piped water, removal of the used water is not necessary; rather, after the inherently najis substance has been removed, water has reached the najis area, and the used water has been removed from this area by pressing with the hand while connected to piped water; the carpet becomes pure.",
          ur: "اس پانی کے ساتھ پاک کرنے کی صورت میں دھوون کا جدا کرنا شرط نہیں ہے بلکہ جب پانی نجس مقام تک پہنچ جائے تو نجاست کے دور ہو جانے اور پانی کے قالین کے ساتھ اتصال کے وقت قالین پر ہاتھ پھیر کر پانی (غسالہ) کو اپنی جگہ سے حرکت دینے کے بعد قالین پاک ہو جائے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 72",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 73",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "rainwater",
    topicId: "water",
    subject: {
      en: "Rainwater as a purifier"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If rain falls once on an impure object that does not contain an intrinsic impurity, the area that comes into contact with the rain becomes pure. However, if a person’s body or some clothing has become impure by urine, then based on obligatory precaution, rain must fall on it twice for it to become pure. As for the impure inside of a utensil, rain must fall on it three times for it to become pure based on obligatory precaution. With carpets, clothing, and similar things, wringing out the rainwater is not necessary. Of course, a few drops of rainfall does not suffice; rather, it must be such that it can be commonly said to be raining."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 35*",
          url: "https://www.sistani.org/english/book/48/2122/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "mixedwateruse",
    topicId: "water",
    subject: {
      en: "Using mixed water for purification, wuḍūʾ and ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Mixed water – the meaning of which was mentioned in Ruling 13 – does not purify an impure object, and ritual bathing (ghusl) and ablution (wuḍūʾ) performed with it are invalid (bāṭil)."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 44",
          url: "https://www.sistani.org/english/book/48/2124/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "waterchangedbyimpurity",
    topicId: "water",
    subject: {
      en: "Water whose smell, colour or taste changes"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If an intrinsic impurity like blood or urine comes into contact with water and changes its smell, colour, or taste, it becomes impure even if it is kurr or flowing water. In fact, based on obligatory precaution, the water also becomes impure even if the smell, colour, or taste of the water changes by means of an impurity that is outside it; for example, an impure carcass that is lying by the side of the water changes the water’s smell."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 49",
          url: "https://www.sistani.org/english/book/48/2124/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "waterpuritydoubt",
    topicId: "water",
    subject: {
      en: "Doubt whether water is pure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Water that was pure, and it is not known whether it has become impure or not, is pure. Water that was impure, and it is not known whether it has become pure or not, is impure.",
          ur: "جوپانی پہلے پاک ہواوریہ علم نہ ہوکہ بعدمیں نجس ہوایانہیں ، وہ پاک ہے اور جوپانی پہلے نجس ہواورمعلوم نہ ہوکہ بعدمیں پاک ہوایانہیں ،وہ نجس ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 52",
          url: "https://www.sistani.org/english/book/48/2124/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (52)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "coveringprivateparts",
    topicId: "istinja",
    subject: {
      en: "Covering the private parts"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is obligatory (wājib) for one to cover his private parts when emptying his bowels and/or bladder, and at other times, from people who are duty-bound (mukallaf), even if they are his maḥram, like his mother and sister. Similarly, it is obligatory for one to cover his private parts from an insane person and from a child who is mumayyiz, i.e. someone who is able to discern between right and wrong. However, it is not necessary for a husband and wife to cover their private parts from each other.",
          ur: "انسان پرواجب ہے کہ پیشاب اورپاخانہ کرتے وقت اور دوسرے مواقع پراپنی شرم گاہوں کوان لوگوں سے جوبالغ ہوں خواہ وہ ماں اوربہن کی طرح اس کے محرم ہی کیوں نہ ہوں اوراسی طرح دیوانوں اوران بچوں سے جواچھے برے کی تمیز رکھتے ہوں چھپاکررکھے۔لیکن بیوی اورشوہر کے لئے اپنی شرم گاہوں کوایک دوسرے سے چھپانا لازم نہیں ۔"
        },
        hukm: "wajib",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 53",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (53)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Employment in some companies and institutions depends on undergoing a medical examination that partly includes exposing one’s private parts and looking at them. Is that permissible when one needs to find a job?",
          ur: "بعض کمپنیوں اور اداروں میں کام کرنے کیلئے طبی معائنہ ضروری ہوتاہے اور اس سلسلہ میں کبھی شرمگاہ کو بھی دکھانا پڑتاہے تو کیا ضرورت کے پیش نظر ، ایسا کرنا جائز ہے ؟"
        },
        text: {
          en: "It is not permissible to expose one’s private parts before another person nor the latter's looking at them, even if one’s employment depends upon it. Of course, if the doctor thinks the would-be employee may be sick while employing him like that is against the law and there is no way other than direct physical examination to diagnose the illness, looking becomes permissible only in this case.",
          ur: "شرمگاہ کو ظاہر کرنا اور شرمگاه کو دیکهنا جائز نہیں ہے،اگر چہ ملازمت کے حصول کے لئے ہی ہو ۔ البته ان موارد میں که جهاں پر اگر ڈاکٹر یه احتمال دے که مراجعه کرنے والا ایک خاص بیماری میں مبتلا هے که اس بیماری کے هوتے هوے ملازمت دینا ممنوع هے اور جب تک مستقیم طور پر شرمگاه کو نه دیکهے اس بیماری میں مبتلا نه هونے کا علم حاصل نهیں هوتا هو تو اس صورت میں دیکهنا جایز ہے."
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 96",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 97",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "toiletqibla",
    topicId: "istinja",
    subject: {
      en: "Facing the qibla in the toilet"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, when one is emptying his bowels and/or bladder, neither the front of the body – i.e. the stomach and chest – nor the back must face qibla.",
          ur: "پیشاب یاپاخانہ کرتے وقت (احتیاط لازم کی بناپر)بدن کااگلاحصہ یعنی پیٹ اورسینہ قبلہ کی طرف نہ ہواورنہ ہی پشت قبلہ کی طرف ہو۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 55",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (55)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "A toilet seat was fixed in a direction totally different from the direction believed to be that of the qiblah. After some time it was known that the direction of the toilet seat is deviated with 20 to 22 degrees from the direction of the qiblah. Is it obligatory to change the direction of the toilet seat or not?",
          ur: "لیٹرین کی سیٹ اس سے مخالف سمت میں لگائی گئی ہے جس طرف قبلہ ہونے کا یقین ہے اور کچھ عرصہ بعد معلوم ہوا کہ سیٹ کا انحراف قبلہ سے صرف ٢٠ سے ٢٢ درجے ہے براہ مہربانی بتائیں کہ سیٹ کی سمت بدلنا واجب ہے یا نہیں ؟"
        },
        text: {
          en: "Assuming the deviation from the direction of qiblah is enough to be considered a deviation, there is no problem.",
          ur: "اگر انحراف اس حد تک ہو کہ اس پر سمت قبلہ سے انحراف صادق آئے تو یہ کافی ہے اور کوئی حرج نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 93",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 94",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "toiletprohibitedplaces",
    topicId: "istinja",
    subject: {
      en: "Places where relieving oneself is unlawful"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is unlawful (ḥarām) for one to empty his bowels and/or bladder in four places:\n1. in dead-end alleys without the owner’s consent. The same applies to public alleys and roads in the event that it causes harm to pedestrians;\n2. on the property of someone who has not given his consent for one to empty his bowels and/or bladder on it;\n3. in a place that is a charitable endowment (waqf) for use by particular groups, such as some schools;\n4. on the graves of believers, whether it is disrespectful to them or not, except if the land is al‑mubāḥāt al‑aṣliyyah. The same applies to any place where emptying one’s bowels and/or bladder causes dishonour to one of the sacred things of the religion or faith."
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 60",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "anuswateronly",
    topicId: "istinja",
    subject: {
      en: "When the anus can be purified with water only"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In three cases, the anus can be purified with water only:\n1. another impurity like blood comes out with the faeces;\n2. an external impurity comes into contact with the anus, except if urine comes into contact with the anus in the case of women;\n3. if the area around the anus has become impure by an amount that is more than usual.\nIn cases other than these three, the anus can be purified with water, or, in accordance with the instructions that will be mentioned later, it can be purified with cloth, stone, or a similar thing, although it is better to wash it with water.",
          ur: "تین صورتوں میں مقعد(پاخانہ خارج ہونے کامقام) فقط پانی سے پاک ہوتاہے:\n(۱) پاخانے کے ساتھ کوئی اورنجاست (مثلاًخون) باہر آئی ہو۔\n(۲) کوئی بیرونی نجاست مقعدپرلگ گئی ہو۔سوائے خواتین کے کہ اگر پیشاب، پاخانہ کےمقام تک پہنچ جائے۔\n(۳) مقعدکااطراف معمول سے زیادہ آلودہ ہوگیاہو۔\nان تین صورتوں کے علاوہ مقعدکویاتوپانی سے دھویاجاسکتاہے اوریااس طریقے کے مطابق جوبعدمیں بیان کیاجائے گاکپڑے یاپتھروغیرہ سے بھی پاک کیا جاسکتا ہے اگرچہ پانی سے دھونابہترہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 61",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (61)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "urinaryoutlet",
    topicId: "istinja",
    subject: {
      en: "Purifying the urinary outlet"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The urinary outlet does not become pure with anything other than water and washing it once is sufficient, although the recommended precaution is that it should be washed twice, and it is even better to wash it three times."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 62",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "After urination, how many times should the urinary outlet be washed to become pure?",
          ur: "پیشاب کے بعد مقام پیشاب کتنی مرتبہ دھونے سے پاک ہوتاہے؟"
        },
        text: {
          en: "According to the obligatory caution, the urinary outlet will become pure by washing it two times with qalīl water.",
          ur: "بنابر احتیاط واجب ، مقام پیشاب آب قلیل کے ساتھ دو مرتبہ دھونے سے پاک ہو تاہے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 97",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 98",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "anuswithwater",
    topicId: "istinja",
    subject: {
      en: "Purifying the anus with water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If the anus is washed with water, no trace of faeces must remain on it. However, there is no problem if the colour and smell remain. If no particle of faeces remains after the first time it is washed, it is not necessary to rewash it.",
          ur: "اگرمقعدکوپانی سے دھویاجائے توضروری ہے کہ پاخانے کاکوئی ذرہ باقی نہ رہے، البتہ رنگ یابوباقی رہ جائے توکوئی حرج نہیں اور اگرپہلی بارہی وہ مقام یوں دھل جائے کہ پاخانے کاکوئی ذرہ باقی نہ رہے تودوبارہ دھونالازم نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 63",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (63)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "How could the excretory outlet (anus) be made pure?",
          ur: "مقام پاخانہ کو پاک کرنے کا طریقہ کیا ہے ؟"
        },
        text: {
          en: "The excretory outlet could be made pure through two methods. First: washing it with water until the najis material is removed after which there would be no need for further washing. Second: removing the najis material with three pure pieces of stone, clothes or the likes. If the najis material is not removed with these three pieces, more pieces could be used until the najis material is completely removed. Instead of three pieces, one could use three sites of the same piece of stone or cloth.",
          ur: "مقام پاخانہ کو دوطریقوں سے پاک کیا جاسکتاہے۔\n١) یہ کہ پانی سے اتنا دھوئے کہ نجاست زائل ہوجائے اسکے بعد پانی ڈالنا ضروری نہیں ہے۔\n٢)یہ کہ تین پاک پتھروں یا کپڑے و غیرہ کے ٹکڑوں سے نجاست کو پاک کرے اور اگر تین سے نجاست برطرف نہ ہو تو دیگر پتھروں یا کپڑے و غیرہ کے ٹکڑوں سے اسے مکمل طور پر صاف کرے ۔ تین پتھروں یا کپڑے کے تین ٹکڑوں کی بجائے ، ایک پتھر یا ایک کپڑے و غیرہ کی تین جگہوں سے بھی استفادہ کرسکتاہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 98",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 99",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "anuswithstone",
    topicId: "istinja",
    subject: {
      en: "Purifying the anus with stone, earth or cloth"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The anus can be purified with stone, a clod of earth, cloth, or a similar thing if they are dry and pure; and there is no problem if they have a little moisture that does not wet the outlet.",
          ur: "پتھر،ڈھیلا، کپڑایاانہی جیسی دوسری چیزیں اگرخشک اورپاک ہوں توان سے مقعد کوپاک کیاجاسکتاہے اوراگران میں معمولی نمی بھی ہوجومقعدتک نہ پہنچے تو کوئی حرج نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 64",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (64)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "anusthreetimes",
    topicId: "istinja",
    subject: {
      en: "How many times with stone or cloth"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It suffices if the anus is completely purified once with stone, a clod of earth, or cloth. However, it is better to purify it three times by using three pieces; and if it does not become purified after three times, one must keep trying to purify it until it becomes completely purified. However, there is no problem if traces remain that are not normally removed except by washing.",
          ur: "اگرمقعدکوپتھریاڈھیلے یاکپڑے سے ایک مرتبہ بالکل صاف کر دیا جائے توکافی ہے، لیکن بہتریہ ہے کہ تین مرتبہ صاف کیاجائے اور(جس چیزسے صاف کیاجائے اس کے) تین ٹکڑے بھی ہوں اوراگر تین ٹکڑوں سے صاف نہ ہوتواتنے مزید ٹکڑوں کااضافہ کرناچاہئے کہ مقعدبالکل صاف ہوجائے۔ البتہ اگراتنے چھوٹے ذرے باقی رہ جائیں جودھوئے بغیر صاف نہیں ہوتے توکوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 65",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (65)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "istinjadoubt",
    topicId: "istinja",
    subject: {
      en: "Doubt whether one has purified"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person doubts whether or not he has purified the anus or urinary outlet, it is necessary that he purify it even if he habitually purifies it immediately after emptying his bowels and/or bladder."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 67",
          url: "https://www.sistani.org/english/book/48/2125/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "istibra",
    topicId: "istinja",
    subject: {
      en: "Istibrāʾ (clearing the urethra) for men"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Istibrāʾ is a recommended (mustaḥabb) act performed by men after urinating in order to be confident that no urine is left in the urethra. It is performed in a number of ways; one way is as follows: after urinating, the anus is first purified if it has become impure; then, the middle finger of the left hand is slid three times from the anus up to the scrotum; then, the thumb is placed on the penis, and the forefinger is placed under the penis, and the thumb and forefinger are pulled three times along the penis up to the point of circumcision; finally, the end of the penis is pressed three times."
        },
        hukm: "mustahab",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 69",
          url: "https://www.sistani.org/english/book/48/2126/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Customarily, it is obligatory for men who want to perform prayer to do istibrā’ after urination. I have a wound on my penis that bleeds while doing istibrā’ due to pressure upon the penis, and thus blood is mixed with the water used for purification causes my body and clothes to become najis. If I do not do istibrā’, the wound will possibly heal earlier. Doing istibrā’, which puts pressure on the penis, would certainly cause the wound to persist and heel only after the next three months. Please explain whether I should do istibrā’ or not.",
          ur: "پیشاب کرنے کے بعد حسب عادت نمازی کو استبراء کرنا چاہیئے ، جبکہ میری شرم گاہ میں ایک زخم ہے جس سے استبراء کے دوران دباؤ کے نتیجے میں خون نکل آتاہے جو طہارت کے لئے استعمال کئے جانے والے پانی میں مل کر میرے بدن اور لباس کو نجس کردیتاہے اور اگر میں استبراء نہ کروں تو زخم جلدی ٹھیک ہوجانے کا امکان ہے جبکہ استبراء کرنے کی صورت میں دباؤ پڑنے کی وجہ سے زخم باقی رہے گا اوراسکے ٹھیک ہونے میں تین ماہ لگ جائیں گے ۔ آپ فرمائیے کہ میں استبراء کروں یا نہیں؟"
        },
        text: {
          en: "Doing istibrā’ is not obligatory. Furthermore, it is not allowed if it causes a considerable harm. However, after urination if one does not do istibrā’ and a doubtful liquid comes out, it will be ruled as urine.",
          ur: "استبراء واجب نہیں ہے اور اگر وہ قابل توجہ ضرر کا موجب بنے تو جائز بھی نہیں ہے۔ البتہ اگر پیشاب کے بعد استبراء نہ کرے اور مشتبہ رطوبت نکلے تو وہ پیشاب کے حکم میں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 90",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 91",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "dischargesmadhi",
    topicId: "istinja",
    subject: {
      en: "Madhī, wadhī and wadī discharges"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The fluid that sometimes comes out of the penis due to sexual arousal, called ‘madhī’, is pure. The fluid that sometimes comes out after the ejaculation of semen, called ‘wadhī’, is also pure. As for fluid that sometimes comes out after urinating and which is called ‘wadī’, it is pure if it has not come into contact with urine. Furthermore, in the event that a man performs istibrāʾ after urinating and then fluid comes out and he doubts whether it is urine or one of these three fluids, it is pure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 70",
          url: "https://www.sistani.org/english/book/48/2126/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Please give an explanation concerning the different wet discharges that one may experience.",
          ur: "براہ مہربانی اگر ہوسکے تو انسان سے نکلنے والی رطوبت کی اقسام کی وضاحت فرمائیے ؟"
        },
        text: {
          en: "The wetness that comes out occasionally after the discharge of semen is called ‘wadhi’ That which comes out occasionally after urinating is called ‘wadi’, and that which comes out after foreplay is called ‘madhi’. All of them are pure and do not invalidate wuḍū’.",
          ur: "منی نکلنے کے بعد بعض اوقات جو رطوبت خارج ہوتی ہے اس کا نام \"وذی\" ہے اور جو پیشاب کے بعد بعض اوقات خارج ہوتی ہے وہ \"ودی\" کہلاتی ہے ۔ اور میاں بیوی کی باہمی خوش فعلی کے بعد نکلنے والی رطوبت کا نام \"مذی\" ہے ۔ اور یہ سب پاک ہیں اور ان سے طہارت ختم نہیں ہوتی۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 92",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 93",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "istibradoubt",
    topicId: "istinja",
    subject: {
      en: "Discharge after doubting istibrāʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a man doubts whether he has performed istibrāʾ or not and fluid comes out and he does not know whether it is pure or not, it is impure; and in the event that he performed wuḍūʾ, his wuḍūʾ becomes void (bāṭil). However, if a man doubts whether the istibrāʾ he performed was correct or not and fluid comes out and he is unsure whether it is pure or not, it is pure and it does not invalidate his wuḍūʾ either.",
          ur: "اگرکسی شخص کوشک ہوکہ استبراء کیاہے یانہیں اوراس کے پیشاب کے مخرج سے رطوبت خارج ہوجس کے بارے میں وہ نہ جانتاہوکہ پاک ہے یانہیں تو وہ نجس ہے۔ نیزیہ کہ اگروہ وضوکرچکاہو تووہ بھی باطل ہوگا۔لیکن اگراسے اس بارے میں شک ہوکہ جواستبراء اس نے کیاتھاوہ صحیح تھایانہیں اور اس دوران رطوبت خارج ہواور وہ نہ جانتاہو کہ وہ رطوبت پاک ہے یانہیں تووہ پاک ہوگی اوراس کاوضو بھی باطل نہ ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 71",
          url: "https://www.sistani.org/english/book/48/2126/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (71)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Occasionally, after urinating and doing istibrā’, wetness similar to urine comes out involuntarily. Is it najis or pure? And, if one notices the problem by chance after a while, what is the rule concerning the prayers he has performed earlier? Is it obligatory in the future to examine this wetness, which comes out involuntarily?",
          ur: "پیشاب اور استبراء کے بعد کبھی پیشاب کے مقام سے بلا اختیار ایسی رطوبت نکلتی ہے جو پیشاب سے مشابہ ہوتی ہے، کیا یہ رطوبت نجس ہے یا پاک ؟ اور اگر انسان کچھ مدت کے بعد اسکی طرف اتفاقاًمتوجہ ہو تو اس سے پہلے پڑھی گئی نمازوں کا حکم کیا ہے ؟ کیا اس پر واجب ہے کہ آئندہ اس بے اختیار نکلنے والی رطوبت کے بارے میں تحقیق کرے ؟"
        },
        text: {
          en: "The wetness that comes out after doing istibrā’, about which one doubts whether it is urine or not, is not considered urine. It is to be considered pure, and it is not obligatory to do any investigation in this case.",
          ur: "استبراء کے بعد نکلنے والی رطوبت کے بارے میں اگر شک ہو کہ وہ پیشاب ہے یا نہیں تو وہ پیشاب کے حکم میں نہیں ہے اور پاک ہے ، اور اس سلسلے میں تحقیق و جستجو واجب نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 91",
          url: "https://www.leader.ir/en/book/32/1?sn=5141"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 92",
          url: "https://www.leader.ir/ur/book/106/1?sn=11375"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "istibrawomen",
    topicId: "istinja",
    subject: {
      en: "Discharge for women after urinating"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There is no istibrāʾ for women after urinating; if a woman sees fluid and doubts whether it is urine or not, it is pure and it does not invalidate her wuḍūʾ or ghusl.",
          ur: "عورت کے لئے پیشاب کے بعد استبراء نہیں ہے۔ پس اگرکوئی رطوبت خارج ہواورشک ہوکہ یہ پیشاب ہے یانہیں تووہ رطوبت پاک ہوگی اوراس کے وضو اور غسل کوبھی باطل نہیں کرے گی۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 74",
          url: "https://www.sistani.org/english/book/48/2126/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (74)",
          url: "https://www.sistani.org/urdu/book/61/3627/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tennajasat",
    topicId: "najasat",
    subject: {
      en: "The ten intrinsically impure things"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Ten things are impure [intrinsically]:\n1. urine;\n2. faeces;\n3. semen;\n4. corpse;\n5. blood;\n6. dog;\n7. pig;\n8. disbeliever (kāfir);\n9. wine;\n10. the sweat of an excrement-eating animal."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 80",
          url: "https://www.sistani.org/english/book/48/2128/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "urinefaeces",
    topicId: "najasat",
    subject: {
      en: "Urine and faeces"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The urine and faeces of a human being and every animal whose meat is unlawful to eat and whose blood gushes out – meaning that if its jugular vein is cut, blood runs out with a gush – is impure. The faeces of an animal whose meat is unlawful but whose blood does not gush out, like fish that are unlawful to eat, as well as the droppings of small animals, like mosquitoes and flies that do not have flesh, are pure. Furthermore, the urine of an animal whose meat is unlawful and whose blood does not gush out must be avoided [i.e. it is ruled to be impure], based on obligatory precaution.",
          ur: "انسان کااورہراس حیوان کاجس کاگوشت حرام ہے اورجس کا خون جہندہ ہے یعنی اگر اس کی رگ کاٹی جائے توخون اچھل کرنکلتاہو، پیشاب اورپاخانہ نجس ہے۔اور اس حیوان کاپاخانہ پاک ہے جس کاگوشت حرام ہے مگراس کاخون اچھل کرنہیں نکلتا، مثلاً وہ مچھلی جس کاگوشت حرام ہے اور اسی طرح گوشت نہ رکھنے والے چھوٹے حیوانوں مثلاً مکھی، مچھر کافضلہ یاآلائش بھی پاک ہے، لیکن حرام گوشت حیوان جواچھلنے والاخون نہ رکھتاہو(احتیاط لازم کی بناپر)اس کے پیشاب سے بھی پرہیز کرنا ضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 81",
          url: "https://www.sistani.org/english/book/48/2129/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (81)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "birddroppings",
    topicId: "najasat",
    subject: {
      en: "Droppings of birds whose meat is unlawful"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The urine and droppings of birds whose meat is unlawful are pure, but it is better to avoid them [i.e. it is better not to treat them as being pure]."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 82",
          url: "https://www.sistani.org/english/book/48/2129/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Are the droppings of a bird whose meat is not ḥalāl, like that of a crow or an eagle najis?",
          ur: "کیا حرام گوشت پرندوں جیسے عقاب، طوطا، کوا اور جنگلی کوا ۔ کا پاخانہ نجس ہے ؟"
        },
        text: {
          en: "They are not najis.",
          ur: "حرام گوشت پرندوں کا پاخانہ نجس نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 278",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 279",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "semen",
    topicId: "najasat",
    subject: {
      en: "Semen"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The semen of a man and every male animal whose meat is unlawful and whose blood gushes out is impure. The fluid that comes out of a woman following sexual arousal and causes her to be in a state of ritual impurity (janābah) – as per the details that will be mentioned in Ruling 345 – has the ruling of semen. Furthermore, based on obligatory precaution, the semen of an animal whose meat is lawful (ḥalāl) and whose blood gushes out must be avoided [i.e. it is ruled to be impure]."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 84",
          url: "https://www.sistani.org/english/book/48/2130/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "If the clothes of a junub person become najis with semen, what is the rule if a hand touches the clothes when there is moisture in any one of them? Secondly, is it permissible for the junub person to give this dress to another for washing it? Is it obligatory for him to inform the person who wants to wash the dress about its najāsah?",
          ur: "اگر مجنب کا لباس منی سے نجس ہو جائے تو اول: یہ کہ اگر ہاتھ یا اس کپڑے میں سے کوئی ایک گیلا ہو تو ہاتھ سے اس لباس کو چھونے کا کیا حکم ہے؟ اور دوسرے: کیا مجنب کے لئے جائز ہے کہ وہ کسی اور شخص کو وہ لباس پاک کرنے کے لئے دے؟ نیز کیا مجنب کے لئے ضروری ہے کہ وہ دھونے والے شخص کو بتائے کہ یہ نجس ہے؟"
        },
        text: {
          en: "Semen is najis, and if it comes into contact with something with transmitting moisture, it makes the latter najis. It is not necessary to inform the person washing the dress about its najāsah. However, unless the owner of the clothes becomes certain about their purity, he could not apply rules of purity to them.",
          ur: "منی نجس ہے اور جب سرایت کرنے والی رطوبت کے ساتھ اسے کوئی چیز لگے تو وہ بھی نجس ہو جائے گی، اور لباس دھونے والے کو یہ بتانا ضروری نہیں ہے کہ یہ نجس ہے لیکن صاحب لباس کو جب تک اسکی طہارت کا یقین نہ ہو اس پر طہارت کے اثرات جاری نہیں کرسکتا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 276",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 277",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "corpse",
    topicId: "najasat",
    subject: {
      en: "Corpses and carcasses"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The corpse of a human being is impure, as is the carcass of an animal whose blood gushes out, irrespective of whether it died naturally or was killed in a manner that is not in accordance with Islamic law. As for fish, as they do not have blood that gushes out, they are pure even if they die in the water.",
          ur: "انسان کی اوراچھلنے والاخون رکھنے والے ہرحیوان کی لاش نجس ہے خواہ وہ (قدرتی طورپر) خود مراہویاشرعی طریقے کے علاوہ کسی اورطریقہ سے ذبح کیا گیا ہو۔\nمچھلی چونکہ اچھلنے والاخون نہیں رکھتی اس لئے پانی میں مرجائے توبھی پاک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 85",
          url: "https://www.sistani.org/english/book/48/2131/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (85)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "deadskin",
    topicId: "najasat",
    subject: {
      en: "Skin that peels off the body"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If small pieces of skin from the lips or other parts of the body are peeled off, in the event that they do not contain life and are easily peeled off, they are pure.",
          ur: "اگرہونٹوں یابدن کی کسی اورجگہ سے باریک سی تہہ (پپڑی)جس میں روح نہ ہو اور آسانی سے اکھیڑلی جائے تووہ پاک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 88",
          url: "https://www.sistani.org/english/book/48/2131/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (88)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Are the dead cells of the skin that at times fall off from the hands, lips and feet, pure or najis?",
          ur: "ہاتھوں ، ہونٹوں یا پیروں سے بعض اوقات جو کھال جد اہوتی ہے، کیا وہ پاک ہے یا نجس؟"
        },
        text: {
          en: "The fine skin that separates by itself from the hands, lips, feet or any other part of the body, is pure.",
          ur: "ہاتھوں ، ہونٹوں یا بدن کے دیگر اعضاء سے کھال کے جو باریک چھلکے خود بخود جدا ہو جاتے ہیں، وہ پاک ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 271",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 272",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "importedleather",
    topicId: "najasat",
    subject: {
      en: "Leather and meat of unknown slaughter"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If there is a probability that some meat, fat, or hide has come from an animal that has been killed according to Islamic law, it is pure. However, if it is obtained from a disbeliever or from a Muslim who obtained it from a disbeliever without investigating whether or not it was from an animal that was killed according to Islamic law, then the meat or fat is unlawful to eat but performing prayers with the hide is permitted (jāʾiz). If it is obtained from a Muslim market or a Muslim but it is not known whether or not he obtained it from a disbeliever, or there is a probability that he has investigated even though he obtained it from a disbeliever, then in all of these cases, eating the meat or fat is permitted on condition that the Muslim had right of disposal over it that is particular to lawful meat, such as selling it for eating.",
          ur: "گوشت،چربی اورچمڑاجس کے بارے میں احتمال ہوکہ کسی ایسے جانور کاہے جسے شرعی طریقے سے ذبح کیاگیاہے پاک ہے۔ لیکن اگریہ چیزیں کسی کافر کے ہاتھ سے لی گئی ہوں یاکسی ایسے مسلمان کے ہاتھ سے لی گئی ہوں جس نے کافر سے لی ہوں اوریہ تحقیق نہ کی ہو کہ آیایہ کسی ایسے جانورکی ہیں جسے شرعی طریقے سے ذبح کیاگیاہے یانہیں توایسے گوشت اورچربی کاکھاناحرام ہے، البتہ ایسے چمڑے پرنماز جائزہے۔ لیکن اگر یہ چیزیں مسلمانوں کے بازار سے یاکسی مسلمان سے خریدی جائیں اوریہ معلوم نہ ہوکہ اس سے پہلے یہ کسی کافر سے خریدی گئی تھیں یا اس بات کا احتمال ہوکہ تحقیق کرلی گئی ہے توخواہ کافر سے ہی خریدی جائیں اس گوشت اورچربی کا کھانا جائز ہے اس شرط کے ساتھ کہ وہ مسلمان اس میں کوئی ایسا تصرف کرے جو حلال گوشت سے مخصوص ہوجیسے کھانے کے لئے بیچنا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 92",
          url: "https://www.sistani.org/english/book/48/2131/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (92)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Would you mind clearing up for us your respected opinion regarding leather and other animal parts that are imported from non-Muslim countries?",
          ur: "چمڑے اور دیگر حیوانی اجزاء جو غیر اسلامی ممالک سے آتے ہیں کے بارے میں آپ کی رائے کیا ہے؟"
        },
        text: {
          en: "If you think that the animal may have been slaughtered ritually, it is pure. But in case you are sure of its not having been ritually slaughtered, it is ruled to be najis.",
          ur: "اگر جانور کے ذبح شرعی ہونے کا احتمال ہو تو پاک ہیں لیکن اگر یقین ہو کہ شرعی طریقے سے ذبح نہیں ہوا تو نجس ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 275",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 276",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "blood",
    topicId: "najasat",
    subject: {
      en: "Blood"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The blood of a human being and every animal whose blood gushes out (i.e. an animal whose blood runs out with a gush when its jugular vein is cut) is impure. Therefore, the blood of an animal whose blood does not gush out, such as fish or mosquitoes, is pure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 93",
          url: "https://www.sistani.org/english/book/48/2132/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is blood pure?",
          ur: "کیا خون پاک ہے؟"
        },
        text: {
          en: "The blood of an animal, whose blood gushes out when its body is cut, is najis.",
          ur: "جن جانداروں کا خون اچھل کر نکلتا ہو انکا خون نجس ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 265",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 266",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "dogpig",
    topicId: "najasat",
    subject: {
      en: "Dogs and pigs"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Dogs and pigs are impure, even their hair, bones, paws, nails, and the moisture from their body.",
          ur: "کتااورسور،نجس ہیں حتیٰ کہ ان کے بال، ہڈیاں ، پنجے، ناخن اور رطوبتیں بھی نجس ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 102",
          url: "https://www.sistani.org/english/book/48/2133/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (102)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In view of the use of brushes in painting and sketching, and considering that good quality brushes are imported from non-Islamic countries and are often made of pig’s hair and are accessible to all, especially in cultural and propagational centers, what is the legal rule regarding using such brushes?",
          ur: "پینٹنگ اور تصویریں بنانے میں بالوں والے برش سے استفادہ کیا جاتاہے۔ انکی بہترین قسم عام طور پر سور کے بالوں سے بنی ہوئی ہوتی ہے اور غیر اسلامی ملکوں سے منگوائی جاتی ہے ایسے برش ہر جگہ خاص طور سے ایڈورٹائزنگ کے اور ثقافتی مراکز میں استعمال کئے جاتے ہیں۔ اس قسم کے برش کے استعمال کے سلسلے میں شرعی حکم کیا ہے؟"
        },
        text: {
          en: "Pig’s hair is najis and its use is not permissible in situations where purity is required by Islamic law; but there is no problem in using it where purity is not necessary. Further, if it is not known whether the brush is made of pig’s hair or not, there is no problem in its use even in cases where purity is required.",
          ur: "سور کے بال نجس ہیں اور ان سے ایسے امور میں استفادہ کرنا جائز نہیں ہے جن میں شرعاً طہارت شرط ہے، لیکن ایسے امور میں ان کو استعمال کرنے میں کوئی حرج نہیں ہے کہ جن میں طہارت شرط نہیں ہے۔ اور اگر ان کے بارے میں یہ معلوم نہ ہو کہ وہ سور کے بالوں سے بنے ہوئے ہیں یا نہیں تو ان کا استعمال ان امور میں بھی بلا اشکال ہے جن میں طہارت شرط ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 273",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 274",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wineintoxicants",
    topicId: "najasat",
    subject: {
      en: "Wine and other intoxicants"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Wine is impure. Apart from wine, other things that intoxicate a human being are not impure.",
          ur: "شراب نجس ہےاس کے علاوہ تمام مست کرنے والی چیزیں نجس نہیں ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 108",
          url: "https://www.sistani.org/english/book/48/2135/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (108)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Are alcoholic beverages najis?",
          ur: "کیا ایسے مشروبات جن میں الکحل کا استعمال ہوتا ہے نجس ہیں ؟"
        },
        text: {
          en: "By obligatory caution, intoxicating drinks are najis.",
          ur: "مست کردینے والے مشروبات بنابر احتیاط نجس ہیں۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 300",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 301",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "alcohol",
    topicId: "najasat",
    subject: {
      en: "Industrial and medicinal alcohol"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Alcohol, whether industrial or medicinal, in all its types, is pure unless it is known and ascertained that the alcohol has been obtained from the vaporisation and distillation of grape wine, in which case it is impure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 109*",
          url: "https://www.sistani.org/english/book/48/2135/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is it permissible to use white alcohol for disinfecting the hands and medical equipment, like thermometers, or to use them for medical purposes and treatment by doctors? Are prayers valid in clothes on which a drop or more of this alcohol has fallen?",
          ur: "کیا ہاتھ اور طبی آلات جیسے تھرمامیٹر و غیرہ کو طبی امور میں استعمال کرنے کی غرض سے جراثیم سے پاک کرنے کیلئے نیز ڈاکٹر یا میڈیکل بورڈ کے ذریعہ علاج کی غرض سے سفید الکحل کا استعمال جائز ہے؟ سفید الکحل وہی طبی الکحل ہے جو پینے کے قابل بھی ہے، کیا جس کپڑے پر اس الکحل کا ایک قطرہ یا اس سے زیادہ گرجائے، اس کپڑے میں نماز جائز ہے؟"
        },
        text: {
          en: "In general, alcohol is pure, and praying with the clothes that have come into contact with it is valid. It does not require purification.",
          ur: "بطور کلی الکحل پاک ہے اور جس لباس پر یہ لگا ہو اس کے ساتھ نماز صحیح ہے اور اس لباس کو پا ک کرنے کی کوئی ضرورت نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 304",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 305",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "establishingimpurity",
    topicId: "najasat",
    subject: {
      en: "How impurity is established"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are three ways to establish the impurity of an object:\n1. one is certain, or is confident by rational means, that the object is impure. If one only supposes (i.e. has a ẓann) that an object is impure, it is not necessary for him to avoid it and it is ruled to be pure. Therefore, there is no problem in eating in public places, restaurants, and guesthouses where the people who eat there are unconcerned about religious matters and who do not observe laws relating to what is pure and what is impure, as long as one is not confident that the food brought to him is impure;\n2. someone who is in possession of an object says it is impure; for example, one’s spouse or domestic worker says that a utensil or something else that they have in their possession is impure;\n3. two dutiful men say that an object is impure, on condition that they give the reason for its impurity; for example, they say that the object has come into contact with blood or urine. If one dutiful man, or another reliable person, says something is impure but one does not attain confidence in what he says, the obligatory precaution is that one must avoid that thing [i.e. it is ruled to be impure]."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 115",
          url: "https://www.sistani.org/english/book/48/2137/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "purityimpuritydoubt",
    topicId: "najasat",
    subject: {
      en: "Doubt whether something is pure or impure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "An impure object about which one doubts whether it has become pure or not is impure. And a pure object about which one doubts whether it has become impure or not is pure. Even if one is able to know whether the object is really impure or pure, it is not necessary for him to investigate.",
          ur: "اگرکسی نجس چیزکے بارے میں شک ہوکہ پاک ہوئی ہے یانہیں تووہ نجس ہے۔ اگرکسی پاک چیز کے بارے میں شک ہوکہ نجس ہوگئی ہے یانہیں تووہ پاک ہے۔ اگر کوئی شخص ان چیزوں کے نجس یاپاک ہونے کے متعلق پتالگابھی سکتاہوتوتحقیق ضروری نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 117",
          url: "https://www.sistani.org/english/book/48/2137/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (117)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the rule concerning a child’s wet hand, his saliva and leftover food if he regularly makes himself najis? What is the rule applicable to children who place their wet hands on their feet?",
          ur: "اس بچے کے گیلے ہاتھ، اس کے منہ کے پانی اور اس کی جوٹھی غذا کا کیا حکم ہے، جو ہمیشہ خود کو نجس کرتا رہتا ہے اور ان بچوں کا کیا حکم ہے جو اپنے گیلے ہاتھوں سے اپنے پیر چھوتے ہیں؟"
        },
        text: {
          en: "As long as it is not certain that they have become najis, they are considered pure.",
          ur: "جب تک ان کے نجس ہونے کا یقین حاصل نہ ہو اس وقت تک یہ پاک ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 284",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 285",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "impuritytransfer",
    topicId: "najasat",
    subject: {
      en: "How impurity transfers (wetness)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a pure object touches an impure object and both or one of them is wet – such that the wetness of one transfers onto the other – the pure object also becomes impure; however, it does not become impure through multiple intermediaries [i.e. the spread of impurity is limited to two intermediaries].\nAn example: if the right hand has become impure (mutanajjis) with urine, and [after drying,] that hand touches the left hand with a new wetness, this touching causes the left hand to become impure; and if after drying, the left hand touches something else, such as some clothing, with a new wetness, the clothing also becomes impure; but, if the clothing touches some other object with a new wetness, that other object is not ruled to be impure. Therefore, the third intermediary [the clothing in the example above] is impure but it does not make anything impure. Furthermore, if the wetness is so little that it does not transfer onto another object, the pure object does not become impure even if it touches an intrinsic impurity."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 119",
          url: "https://www.sistani.org/english/book/48/2138/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Something comes in contact with an extrinsically najis object. Does it become najis? And if it becomes najis, does it make anything else najis? What about the subsequent things in this chain?",
          ur: "کیا کسی نجاست سے لگ کر نجس ہونے والی (متنجس) چیز سے لگنے والی چیز بھی نجس ہو جاتی ہے یا نہیں؟ اور اگر نجس ہو جاتی ہے تو یہ حکم کتنے واسطوں تک جاری ہو گا؟"
        },
        text: {
          en: "The object, which contacts an intrinsically najis material and becomes najis, makes another thing najis if they come into contact with each other when one of the two is wet. The latter makes, by obligatory caution, another thing najis on contact. However this third extrinsically najis object does not make anything najis.",
          ur: "عین نجاست سے لگنے والی چیز نجس ہو جاتی ہے اور اسی طرح اس سے لگنے والی دوسری چیز بھی اگر ان میں سے ایک تر ہو تونجس ہو جاتی ہے اور بنا بر احتیاط واجب اس سے لگنے والی تیسری چیزبھی نجس ہو جاتی ہے، لیکن یہ تیسری لگنے والی چیز کسی چیز کو نجس نہیں کرے گی۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 282",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 283",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "wetnessdoubt",
    topicId: "najasat",
    subject: {
      en: "Doubt whether there was wetness"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a pure object touches an impure object and one doubts whether both or one of them was wet or the wetness was enough to spread onto the other object, the pure object is not considered to have become impure.",
          ur: "اگرکوئی پاک چیزکسی نجس چیزکولگ جائے اوران دونوں یاکسی ایک کے ترہونے کے متعلق کسی کوشک ہوتوپاک چیزنجس نہیں ہوتی۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 120",
          url: "https://www.sistani.org/english/book/48/2138/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (120)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the degree of wetness that causes najāsah spread from one object to another?",
          ur: "اس رطوبت کی مقدار کیا ہے جو ایک چیز سے دوسری چیز میں سرایت کرتی ہے؟"
        },
        text: {
          en: "The criterion for transmitting moisture is that the wetness should spread from a wet body to another body when they contact each other.",
          ur: "سرایت کرنے والی رطوبت کا معیار یہ ہے کہ کوئی گیلی چیز جب دوسری چیز کو لگے تو اس کی رطوبت اس دوسری چیز کی طرف سرایت کرجائے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 289",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 290",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "quranimpure",
    topicId: "najasat",
    subject: {
      en: "Making the Qur'an impure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is unlawful to make the script of the Qur’an and its pages impure in the event that this amounts to disrespect; and if they become impure, one must wash them immediately. In fact, based on obligatory precaution, it is unlawful to make them impure even if it does not amount to disrespect, and washing them would be obligatory.",
          ur: "قرآن مجیدکی تحریر اورورق کونجس کرناجب کہ یہ فعل بے حرمتی میں شمار ہوتاہوبلاشبہ حرام ہے اوراگرنجس ہوجائے توفوراً پانی سے دھوناضروری ہے، بلکہ اگر بے حرمتی کاپہلونہ بھی نکلے تب بھی (احتیاط واجب کی بناپر)کلام پاک کو نجس کرنا حرام اور پانی سے دھوناواجب ہے۔"
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 129",
          url: "https://www.sistani.org/english/book/48/2139/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (129)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "personsnotbelieving",
    topicId: "najasat",
    subject: {
      en: "Not believing in Allah or His oneness"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A person who does not believe in Allah or His oneness is impure."
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 103",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ],
    panel: "persons"
  },
  {
    id: "personsghulat",
    topicId: "najasat",
    subject: {
      en: "Ghulāt, Khawārij and Nawāṣib"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Similarly, the following are impure: extremists (ghulāt) (i.e. those who regard one of the Infallible Imams (ʿA) as Allah, or say that Allah has immanence (ḥulūl) in the Imam (ʿA)), Kharijites (khawārij), and nawāṣib (i.e. those who display enmity towards the Infallible Imams (ʿA)).",
          ur: "اوراسی طرح غلات (یعنی وہ لوگ جوائمہ علیہم السلام میں سے کسی کوخداکہیں یا یہ کہیں کہ خدا،امام میں سماگیاہے)اور خارجی وناصبی (یعنی وہ لوگ جوائمہ علیہم السلام سے نفرت اوربغض کااظہارکریں ) بھی نجس ہیں ۔"
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 103",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (103)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "There is a sect that calls itself ‘Aliyyullāhī, and it considers the Commander of the Faithful, Ali ibn Abītālib (a.), as a god and believes in supplicating and seeking fulfillment of requests as an alternative to prayers and fasting. Are they najis?",
          ur: "ایک فرقہ ہے جو اپنے کو \"علی اللہٰی\" کہتا ہے۔ وہ لوگ امیرالمؤمنین علی ابن ابی طالب علیہ السلام کو خدا سمجھتے ہیں اور ان کا عقیدہ ہے کہ دعا اور طلب حاجت، نماز اور روزے کا بدل ہیں، کیا یہ لوگ نجس ہیں؟"
        },
        text: {
          en: "If they believe that Amīr al-Mu’minīn, Ali ibn Abītālib (a.), is a god (Allah, the exalted, is above what they say), then the rule applicable to them is that of non-Muslims who have not a Book, i.e., they are kāfirs and najis.",
          ur: "اگر وہ امیرالمؤمنین علی بن ابیطالب علیہ السلام کو اللہ مانتے ہیں \"تعالی اللہ عن ذلک علواً کبیراً\" تو ان کا حکم اہل کتاب کے سوا دوسرے غیر مسلموں جیسا ہے یعنی کافر اور نجس ہیں۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 316",
          url: "https://www.leader.ir/en/book/32/1?sn=5255"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 317",
          url: "https://www.leader.ir/ur/book/106/1?sn=11386"
        },
        verification: "A"
      }
    ],
    panel: "persons"
  },
  {
    id: "personsrejecting",
    topicId: "najasat",
    subject: {
      en: "Rejecting prophethood or an indispensable of the religion"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The same applies to a person who rejects prophethood or any one of the indispensable aspects of the religion – such as prayers (ṣalāh) and fasting (ṣawm) – if it is in a way that it amounts to refuting Prophet Muḥammad (Ṣ), albeit in a general manner."
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 103",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Does the rule applicable to a non-Muslim apply to a person who rejects some indispensable elements of the religion, such as fasting, etc.?",
          ur: "جو شخص ضروریات دین ۔جیسے روزہ و غیرہ ۔میں سے کسی کامنکر ہو جائے تو کیا اس پر کافر کا حکم لگے گا یا نہیں؟"
        },
        text: {
          en: "If rejection of some indispensable elements of religion amounts to rejection of the Prophet’s (s.) prophethood, denial of the Prophet’s mission, or belief that the sharī‘ah is defective, then it leads to apostasy and being a non-Muslim.",
          ur: "اگر ضروریات دین میں سے کسی چیز کا انکار، نبوت کے انکار یا پیغمبر اسلام صلی اللہ علیہ و آلہ و سلم کی تکذیب یا شریعت کی تنقیص کی طرف بازگشت کرے تو یہ کفر و ارتداد ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 335",
          url: "https://www.leader.ir/en/book/32/1?sn=5255"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 336",
          url: "https://www.leader.ir/ur/book/106/1?sn=11386"
        },
        verification: "A"
      }
    ],
    panel: "persons"
  },
  {
    id: "personsahlalkitab",
    topicId: "najasat",
    subject: {
      en: "The People of the Book"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "As for the People of the Book (ahl al‑kitāb) (i.e. Jews, Christians, and Zoroastrians), they are ruled to be pure.",
          ur: "لیکن اھل کتاب(یعنی یہود، نصاریٰ و مجوسی) پاک ہیں ۔"
        },
        basis: "fatwa",
        excerpt: true,
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 103",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (103)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Some mujtahids are of the opinion that the People of the Book are najis, while some others consider them pure. What is your opinion?",
          ur: "بعض فقہا اہل کتاب کو نجس اور بعض انہیں پاک قرار دیتے ہیں آپ کی کیا رائے ہے؟"
        },
        text: {
          en: "It is not established that the People of the Book are najis themselves; rather, we consider them as pure by themselves.",
          ur: "اہل کتاب کی ذاتی نجاست ثابت نہیں ہے، بلکہ ہماری نظر میں ان پر ذاتی طہارت کا حکم لگایا جائیگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 312",
          url: "https://www.leader.ir/en/book/32/1?sn=5255"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 313",
          url: "https://www.leader.ir/ur/book/106/1?sn=11386"
        },
        verification: "A"
      }
    ],
    panel: "persons"
  },
  {
    id: "personsnonkitabi",
    topicId: "najasat",
    subject: {
      en: "A disbeliever who is not of the People of the Book"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, the entire body of a disbeliever who is not kitābī [i.e. not from among the People of the Book] is impure; this includes his hair, nails, and the moisture from his body. As for an apostate (i.e. someone who is no longer a Muslim), the rule that applies to him is determined by his new religious status. Therefore, if the apostate person becomes a kitābī disbeliever, he is pure; and if he becomes a non-kitābī disbeliever, he is impure based on obligatory precaution."
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 104*",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "The vast majority of people here are Buddhist non-Muslims. Therefore if a university student rents a house, what is the rule concerning its state of purity and najāsah? Is it necessary to wash and clean the house? It is noteworthy that most of the houses are made of wood and to wash them is not possible. Further, what is the rule concerning hotels and their furniture and articles?",
          ur: "ہماری تعلیم اور رہائش کے علاقے کی اکثر آبادی بدھ مذہب کے ماننے والے کافروں کی ہے، لذا اگر یونیورسٹی کا کوئی طالب علم کرایہ پر مکان لے تو اس مکان کی طہارت و نجاست کا کیا حکم ہے؟ کیا اس مکان کو دھونا اور اسے پاک کرنا ضروری ہے یا نہیں؟ اس بات کی طرف بھی اشارہ کرنا مناسب ہے کہ یہاں اکثر مکان لکڑی کے بنے ہوئے ہیں اور ان کا دھونا ممکن نہیں ہے، نیز ہوٹلوں، سامان اور ان میں موجود دیگر چیزوں کا کیا حکم ہے؟"
        },
        text: {
          en: "Unless it is confirmed that the hand or body of a non-Muslim that is not among The People of the Book has touched something in the presence of transferable wetness, that thing will not be considered najis. Presuming that its najāsah has been ascertained, it is not obligatory to purify the doors and walls of homes and hotels, nor their furniture and articles. All that is obligatory is to purify those things which are used for eating, drinking, and praying.",
          ur: "جس چیز کو آپ استعمال کرنا چاہتے ہیں جب تک آپ کو اس کے غیر کتابی کافر کے تر ہاتھ اور بدن کے ساتھ مس ہونے کا یقین نہ ہو، اس پر نجاست کا حکم نہیں لگے گا اور نجاست کا یقین ہونے کی صورت میں ہوٹلوں اور مکانوں کے دروازوں اور دیواروں کا پاک کرنا واجب نہیں ہے اور نہ ہی سامان اور ان چیزوں کا پاک کرنا واجب ہے جو ان میں موجود ہیں، بلکہ کھانے پینے اور نماز کے لئے استعمال کی جانے والی چیزیں اگر نجس ہوں تو ان کا پاک کرنا واجب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 320",
          url: "https://www.leader.ir/en/book/32/1?sn=5255"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 321",
          url: "https://www.leader.ir/ur/book/106/1?sn=11386"
        },
        verification: "A"
      }
    ],
    panel: "persons"
  },
  {
    id: "personschild",
    topicId: "najasat",
    subject: {
      en: "Children of disbelievers"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If the father, mother, paternal grandfather, and paternal grandmother of a child who is not of the age of legal responsibility (bāligh) are non-kitābī disbelievers, that child is also impure based on obligatory precaution, unless he is mumayyiz and professes Islam, in which case he is pure. If he turns away from his father and mother and inclines towards Muslims, or if he is in the process of researching and investigating, then ruling him as being impure is problematic [and therefore, based on obligatory precaution, the requisite precautionary action must be taken]. If either his father, mother, paternal grandfather, or paternal grandmother is a Muslim, then as per the details that will be mentioned in Ruling 210, the child is pure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 105*",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ],
    panel: "persons"
  },
  {
    id: "personsunknown",
    topicId: "najasat",
    subject: {
      en: "Someone not known to be Muslim"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If it is not known whether someone is a Muslim and there is no indication of him being a Muslim, he is pure. However, other rules of being a Muslim do not apply to him; for example, he cannot marry a Muslim woman nor be buried in a Muslim cemetery.",
          ur: "اگرکسی کے متعلق یہ علم نہ ہوکہ مسلمان ہے یانہیں اورکوئی علامت اس کے مسلمان ہونے کی نہ ہوتووہ پاک سمجھاجائے گا،لیکن اس پراسلام کے دوسرے احکام کااطلاق نہیں ہوگامثلاً نہ ہی وہ مسلمان عورت سے شادی کر سکتاہے اورنہ ہی اسے مسلمانوں کے قبرستان میں دفن کیاجاسکتاہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 106",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (106)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In an Islamic country a foreign person, whose religion is unknown, sells food items and touches it in the presence of transmitting moisture. Is it obligatory to ask him about his religion, or will the principle of presuming a state of purity apply?",
          ur: "ایک شخص کھا نا بیچتا ہے اور سرایت کرنے والی تری کے ساتھ کھا نے کو اپنے جسم سے چھوتا ہے، لیکن اس کے دین کا پتہ نہیں ہے اور وہ کسی دوسرے ملک سے اسلامی ملک میں کام کرنے کیلئے آیا ہے کیا اس سے اس کے دین کے بارے میں سوال کرنا واجب ہے؟ یا اس پر اصالت طہارت کا حکم جاری ہوگا؟"
        },
        text: {
          en: "It is not obligatory to ask about his religion and the principle of presuming state of purity will be applicable in respect to him as well as the food he touches in the presence of transmitting moisture.",
          ur: "اس سے اس کا دین پوچھنا واجب نہیں ہے اور اس شخص کے بارے میں اور رطوبت کے ساتھ اس کے جسم سے لگنے والی چیز کے بارے میں اصالت طہارت جاری کریں گے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 298",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 299",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ],
    panel: "persons"
  },
  {
    id: "personsabusingimams",
    topicId: "najasat",
    subject: {
      en: "Abusing the Infallible Imams"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, a person who abuses any of the Infallible Imams (ʿA) on account of his enmity towards them is impure."
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 107*",
          url: "https://www.sistani.org/english/book/48/2134/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6)."
      }
    ],
    panel: "persons"
  },
  {
    id: "eatingimpure",
    topicId: "najasat",
    subject: {
      en: "Eating or drinking impure things"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is unlawful to eat or drink something that has become impure, and the same applies to feeding that thing to someone. However, it is permitted to feed that thing to a child or an insane person. Furthermore, if a child or an insane person eats impure food himself or makes food impure with his impure hand and eats it, it is not necessary to prevent him from doing so.",
          ur: "نجس چیزکاکھاناپینایاکسی دوسرے کوکھلاناپلاناحرام ہے، لیکن بچے یا دیوانے کوکھلاناپلاناجائزہے اوراگربچہ یادیوانہ نجس غذاکھائے پیے یانجس ہاتھ سے غذاکونجس کرکے کھائے تواسے روکناضروری نہیں ۔"
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 135",
          url: "https://www.sistani.org/english/book/48/2139/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (135)",
          url: "https://www.sistani.org/urdu/book/61/3628/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "twelvemutahhirat",
    topicId: "mutahhirat",
    subject: {
      en: "The twelve purifiers (muṭahhirāt)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Twelve things make an impure object pure; these are known as ‘muṭahhirāt’: (1) water; (2) earth; (3) the sun; (4) transformation (istiḥālah); (5) change (inqilāb); (6) transfer (intiqāl); (7) Islam; (8) subsequence (tabaʿiyyah); (9) removal of the intrinsic impurity; (10) istibrāʾ of an excrement-eating animal; (11) absence of a Muslim; and (12) draining of blood from a slaughtered animal. The rules about these things will be mentioned in detail in the forthcoming rulings (masāʾil).",
          ur: "بارہ چیزیں ایسی ہیں جونجاست کوپاک کرتی ہیں اورانہیں مطہرات کہاجاتاہے:\n۱)پانی ۲)زمین ۳)سورج ۴)استحالہ\n۵)انقلاب ۶)انتقال ۷)اسلام ۸)تبعیت\n۹)عین نجاست کازائل ہوجانا ۱۰)نجاست کھانے والے حیوان کااستبراء\n۱۱)مسلمان کاغائب ہوجانا ۱۲)ذبح کئے گئے جانورکے بدن سے خون کا نکل جانا۔\nان مطہرات کے بارے میں مفصل احکام آئندہ مسائل میں بیان کئے جائیں گے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 142",
          url: "https://www.sistani.org/english/book/48/2140/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (142)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "waterconditions",
    topicId: "mutahhirat",
    subject: {
      en: "Conditions for water to purify"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Water makes an impure object pure provided that four conditions are met:\n1. the water must be unmixed; therefore, mixed water such as rose water and willow essence does not make an impure object pure;\n2. the water must be pure;\n3. when an impure object is washed, the water must not turn into mixed water before the object has become pure; and in cases where only one wash is required, the water must not attain the smell, colour, or taste of the impurity. However, in other cases, there is no problem if the water changes; for example, if a person washes an object with kurr or qalīl water and it is necessary to wash that object twice, then even if in the first wash the water changes its colour, smell, or taste because of the impurity, if in the second wash he purifies the object with water that does not change, the object becomes pure;\n4. after washing an impure object, small particles of the intrinsic impurity must not remain on the object. Purifying an impure object with qalīl water – i.e. water that is less than kurr – has other conditions, which will be mentioned later."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 143",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "utensilwashing",
    topicId: "mutahhirat",
    subject: {
      en: "Washing an impure utensil"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The impure inside of a utensil must be washed three times with qalīl water. Similarly, [it must be washed three times] with kurr, flowing, or rainwater, based on obligatory precaution. A utensil that a dog has licked or drank water or some other liquid out of must first be scrubbed with pure soil; then, that soil must be discarded and the utensil washed twice with qalīl, kurr, or flowing water. If a dog’s saliva falls into a utensil or its sweat, urine, or excrement touches the inside of it, or if a wet part of a dog’s body touches the inside of a utensil, then based on obligatory precaution, the utensil must first be scrubbed with soil and then washed three times with water. If a dog licks something other than a utensil, such as a person’s hand, the rule for utensils does not apply and scrubbing it with soil is not necessary; instead, washing it once is sufficient."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 144",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "immersionkurr",
    topicId: "mutahhirat",
    subject: {
      en: "Purifying in kurr or flowing water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If an impure object is immersed once in kurr or flowing water such that water reaches all its impure areas, it becomes pure. In the case of a rug, clothing, or a similar thing, it is not necessary to squeeze or wring it or stamp on it. Furthermore, in case a person’s body or clothing becomes impure with urine, then based on obligatory precaution, it is necessary to wash it twice with kurr water and the like; however, if flowing water is used, it becomes pure by washing it once.",
          ur: "اگرکسی نجس چیز کوکریاجاری پانی میں ایک دفعہ یوں ڈبودیاجائے کہ پانی اس کے تمام نجس مقامات تک پہنچ جائے تووہ چیزپاک ہوجائے گی اورقالین یادری اور لباس وغیرہ کوپاک کرنے کے لئے اسے نچوڑنااوراسی طرح سے ملنایاپاؤں سے رگڑنا ضروری نہیں ہے اوراگربدن یالباس پیشاب سے نجس ہوگیا ہوتواسےکُریا اس کے جیسے پانی میں احتیاط واجب کی بناء پر دو دفعہ دھونا لازم ہے لیکن آب جاری میں ایک دفعہ دھونے سے پاک ہوجائے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 153",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (153)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "urinequalilwater",
    topicId: "mutahhirat",
    subject: {
      en: "Washing something impure with urine using qalīl water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person wants to wash with qalīl water an object that has become impure with urine, in the event that water is poured over it once and separates from it and urine does not remain on the object, it becomes pure. However, with clothing and a person’s body, water must be poured over it twice for it to become pure. As for washing clothing, rugs, and similar things with qalīl water, one must wring them until the remaining water comes out. (The meaning of ‘the remaining water’ is water that usually drips out by itself or by wringing at the time of washing and after washing.)"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 154",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "otherimpurityqalil",
    topicId: "mutahhirat",
    subject: {
      en: "Washing other impurities with qalīl water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If an object becomes impure by something other than urine, in the event that the impurity is removed and qalīl water is poured over it once and separates from it, it becomes pure. However, clothing and similar things must be wrung so that the remaining water comes out.",
          ur: "اگرکوئی چیز پیشاب کے علاوہ کسی نجاست سے نجس ہوجائے تو وہ نجاست دورکرنے کے بعدایک دفعہ قلیل پانی اس پرڈالاجائے۔ جب وہ پانی بہہ جائے تو وہ چیزپاک ہوجاتی ہے البتہ لباس اوراس سے ملتی جلتی چیزوں کونچوڑ لینا چاہئے تاکہ ان کا دھوون نکل جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 156",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (156)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "intrinsicremoval",
    topicId: "mutahhirat",
    subject: {
      en: "The intrinsic impurity must be removed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "An impure object does not become pure until the intrinsic impurity is removed from it. There is no problem, however, if the smell or colour of the impurity remains on it; for example, if clothing that has become impure with blood is washed with water and the blood substance is removed but the colour of the blood remains, the clothing is pure. And even if the colour of the blood could be removed by using a cleaning product, it is not necessary to do so.",
          ur: "جب تک عین نجاست کسی نجس چیزسے الگ نہ ہووہ پاک نہیں ہوگی لیکن اگربویانجاست کارنگ اس میں باقی رہ جائے توکوئی حرج نہیں ۔لہٰذااگرخون لباس پر سے ہٹادیاجائے اورلباس دھولیاجائے اورخون کارنگ لباس پرباقی بھی رہ جائے تو لباس پاک ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 164",
          url: "https://www.sistani.org/english/book/48/2141/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (164)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "If a faint bloodstain remains on the dress after it has been washed, is that faint-colored stain najis?",
          ur: "کیا دھلنے کے بعد کپڑے پر موجود خون کا ہلکے رنگ کا دھبہ نجس ہے؟"
        },
        text: {
          en: "If it is not the blood itself and only the color remains, it is pure.",
          ur: "اگر خود خون نہ ہو اور فقط رنگ باقی رہ جائے تو وہ پاک ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 267",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 268",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "washingmachine",
    topicId: "mutahhirat",
    subject: {
      en: "Washing clothes in a washing machine"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Do the clothes washed in a fully automatic domestic washing machine become pure or not? The mode of functioning of this machine is as follows: Initially when the clothes are washed in it with detergent, some water and foam of the detergent spreads on the glass door of the machine and the rubber surrounding it. After this, the used water is drawn while the foam of the detergent remains on the glass door and the rubber surrounding it. And, at later stages, the machine washes the clothes thrice with qalīl water and then the used water is driven out. Please explain whether the clothes washed in this manner are pure or not?",
          ur: "جو کپڑے گھر کی آٹومیٹک کپڑے دھونے والی مشین سے دھوئے جاتے ہیں، کیا وہ پاک ہوجاتے ہیں یا نہیں؟ مذکورہ مشین اس طرح کام کرتی ہے کہ پہلے مرحلے میں مشین کپڑوں کو کپڑے دھونے والے پاؤڈر سے دھوتی ہے جس کی وجہ سے کچھ پانی اور کپڑوں کا جھاگ مشین کے دروازے کے شیشے اور اسکے اطراف میں لگے ہوئے ربڑ کے خول پر پھیل جاتا ہے دوسرے مرحلے میں دھوون (غسالہ ) کو نکال دیا جاتا ہے لیکن جھاگ اس کے دروازے اور ربڑ کے خول کو پوری طرح گھیر لیتا ہے اور اگلے مراحل میں مشین کپڑوں کو تین مرتبہ آب قلیل سے دھوتی ہے پھر اس کے بعد دھوون کو باہر نکالتی ہے، تو کیا اس طرح دھوئے جانے والے کپڑے پاک ہوتے ہیں یا نہیں؟"
        },
        text: {
          en: "As far as purifying clothes in a washing machine is concerned, if, after removal of the inherently najis material, the clothes are washed once with water connected to kurr, they are purified. The same ruling applies if you use qalīl water provided that the inner part of machine is pure before putting clothes inside the machine, clothes are washed twice with qalīl water and the used water is drained to the normal extent after each washing.",
          ur: "ڈرائی کلیننگ مشین کے ذریعے کپڑے پاک کرنے کے حوالے سے اگر عین نجاست زائل ہونے کے بعد کپڑے  ایک دفعہ کُر سے متصل پانی سے دھوئے جائیں اور نیز اگر کپڑے ڈالنے سے پہلے مشین کا اندرونی حصہ پاک ہو اور دو دفعہ قلیل پانی سے دھویا جائے اور معمول کے مطابق ان کا پانی نکال دیا جائے تو لباس پاک ہوجاتا ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 291",
          url: "https://www.leader.ir/en/book/32/1?sn=5252"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 292",
          url: "https://www.leader.ir/ur/book/106/1?sn=11383"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "earthpurifies",
    topicId: "mutahhirat",
    subject: {
      en: "Earth purifies the soles of the feet and shoes"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Earth purifies the sole of one’s foot or shoe on four conditions:\n1. the earth is pure;\n2. the earth is dry; however, there is no problem if there is some wetness or moisture on the earth that does not spread;\n3. based on obligatory precaution, the impurity has spread onto the sole of one’s foot or shoe from impure earth;\n4. an intrinsic impurity – such as blood and urine – or an object that has become impure – such as mud that has become impure and is on the sole of one’s foot or shoe – is removed by walking or rubbing the foot on earth; and in the event that the intrinsic impurity had previously been removed, then based on obligatory precaution, the sole of one’s foot or shoe does not become pure by walking or rubbing the foot on earth. Furthermore, the earth must be of soil, stone, brick, or something similar; therefore, walking on a rug, ḥaṣīr, and grass does not purify the impure sole of one’s foot or shoe."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 177",
          url: "https://www.sistani.org/english/book/48/2142/"
        },
        verification: "A",
        urduNote: "The official Urdu مسئلہ ۱۷۷ omits the English ruling's allowance for moisture on the earth that does not spread, so only the English is shown (decision P10).",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In order to purify the bottom of one’s foot or shoes one should walk at least fifteen steps. Is this true only after removing the inherently najis material, or can the foot be purified even while the said material is there? Thus, does the bottom of one’s foot or shoes become purified when the inherently najis material is removed by walking fifteen steps?",
          ur: "پاؤں یاجوتے کا تلوا پاک کرنے کے لئے پندرہ قدم چلنا شرط ہے ، تو کیا عین نجاست کے زائل ہونے کے بعد اتنا چلنا ضروری ہے یا عین نجاست کے ہوتے ہوئے بھی پندرہ قدم چلنا کافی ہے ؟ اور اگر پندرہ قدم چلنے سے عین نجاست زائل ہوجائے تو کیا پاؤں یاجوتے کا تلوا پاک ہوجائے گا؟۔"
        },
        text: {
          en: "When the bottom of one’s shoes / soles of feet become najis as a result of walking, one can purify them by walking almost ten steps on a dry and pure ground provided that the inherently najis substance is removed.",
          ur: "جس شخص کے پاؤں یاجوتے کا تلوا زمین پر چلنے کی وجہ سے نجس ہوا ہو اگر وہ پاک اور خشک زمین پر تقریبا دس قدم چلے اور زمین پر چلنے یا رگڑنے سے عین نجس یا متنجس چیز دور ہوجائے تو پاوں یا جوتے کا تلوا پاک ہوجائے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 79",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 80",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "asphalt",
    topicId: "mutahhirat",
    subject: {
      en: "Walking on asphalt or wooden floors"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, the impure sole of one’s foot or shoe does not become pure by walking on asphalt or ground paved with wood. Similarly, it does not become pure by rubbing it against or drawing it along a wall."
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 178*",
          url: "https://www.sistani.org/english/book/48/2142/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Are the roads paved with asphalt or other materials considered as instances of the earth that purifies, so that by walking upon them the sole of the feet or the underneath surface of the shoes can be purified?",
          ur: "کیا تارکول یا اسفالٹ سے بنی ہوئی سڑک پرچلنے سے پاؤں یا جوتے کا تلوا پاک ہوجاتاہے۔"
        },
        text: {
          en: "When the bottom of one’s shoes / soles of feet become najis as a result of walking on the ground, they are purified by walking almost ten steps on a dry and pure ground if the inherently najis substance or the made-najis object is removed from it by walking on, or rubbing it against, the ground.",
          ur: "وہ زمین جو تارکول سے آمیختہ ہو یا اس پرکنکریٹ بچھا یا گیا ہو پاؤں یا جوتے کے تلوے کو پاک نہیں کرتی۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 80",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 81",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "sunpurifies",
    topicId: "mutahhirat",
    subject: {
      en: "The sun as a purifier"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The sun purifies earth, buildings, and walls on five conditions:\n1. the impure object is sufficiently wet, such that were something else to come into contact with it, the latter would become wet. Therefore, if the object is dry, it must be wetted by some means so that the sun can then dry it;\n2. no intrinsic impurity remains on the impure object;\n3. nothing prevents the sun from shining on the impure object. Therefore, if the sun shines on the impure object from behind a curtain or cloud etc. and makes it dry, the object does not become pure. However, there is no problem if the cloud is so thin that it does not prevent the sun from shining on the object;\n4. the sun must dry the impure object by itself. Therefore, if, for example, an impure object is dried by both the wind and the sun, it does not become pure. However, there is no problem if the drying of the object can be commonly attributed to the sun shining on it;\n5. the sun must dry the building that is impure in one go. Therefore, if one time the sun shines on impure earth or a building and it dries its surface and another time it dries its underside, then only its surface becomes pure and its underside remains impure."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 185",
          url: "https://www.sistani.org/english/book/48/2143/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is the sun considered one of the purifying agents? If so, what are the conditions for it to purify?",
          ur: "کیا سورج مطہرات میں سے ہے ؟ اور اگر یہ مطہرات میں سے ہے تو اس کے پاک کرنے کے شرائط کیا ہیں ؟"
        },
        text: {
          en: "The sun purifies the ground and all immovable objects such as trees, plants, buildings, and/or whatever is fixed inside of them — such as timbers, doors and so forth. These things are purified by sunshine provided that at first the inherently najis substance is removed and then they are wet and dried out just by sunshine while nothing such as clouds or a curtain prevents direct sunshine on it.",
          ur: "سورج زمین کو اور ہر غیر منقول چیز کو پاک کرتاہے جیسے درخت، سبزہ، مکان اور اس میں استعمال شدہ چیزیں جیسے لکڑی ، دروازے اور کھڑکیاں وغیرہ یہ چیزیں سورج کی شعاعیں پڑنے سے پاک ہوجاتی ہیں لیکن شرط یہ ہے کہ اس سے پہلے ان کی عین نجاست زائل ہوچکی ہو اور سورج کی شعاعوں کے پڑنے کے وقت یہ گیلی ہوں اور بادل یا پردہ جیسی کوئی چیز براہ راست دھوپ پڑنے میں مانع نہ بنی ہو بلکہ فقط سورج کے ذریعے خشک ہوں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 81",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 82",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "istihala",
    topicId: "mutahhirat",
    subject: {
      en: "Transformation (istiḥālah)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If the essence of an impure object changes in such a way that it transforms into a pure object, it becomes pure. For example, if impure wood burns and transforms into ash, or a dog falls into a salt marsh and transforms into salt [the ash and the salt are pure]. However, if the essence of the object does not change – for example, impure wheat is turned into flour or made into bread – then it does not become pure.",
          ur: "اگرکسی نجس چیزکی جنس یوں بدل جائے کہ ایک پاک چیزکی شکل اختیار کرلے تووہ پاک ہوجاتی ہے۔مثال کے طورپرنجس لکڑی جل کرراکھ ہوجائے یا کتا نمک کی کان میں گرکرنمک بن جائے۔لیکن اگراس چیزکی جنس نہ بدلے مثلاً نجس گیہوں کا آٹاپیس لیاجائے یانجس آٹے کی روٹی پکالی جائے تووہ پاک نہیں ہوگی۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 189",
          url: "https://www.sistani.org/english/book/48/2144/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (189)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Does najis oil remain najis after performing a chemical reaction on it so that it has new properties or does the metamorphosis rule apply to it?",
          ur: "اگر نجس گھی میں ایسا کیمیاوی عمل انجام دیا جائے کہ اب یہ مادہ نئے خواص کا حامل بن جائے تو کیا پھر بھی یہ نجس رہے گا یا یہ کہ اس پر استحالہ کا حکم جاری ہوگا؟"
        },
        text: {
          en: "For the purification of a najis substance, it is not sufficient merely to perform chemical reaction upon it so as to give it new properties.",
          ur: "(ایسی) نجس چیزوں کو پاک کرنے کیلئے ان میں صرف ایسا کیمیاوی عمل انجام دینا کافی نہیں ہے جو ان میں نئی خاصیات پیدا کردے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 85",
          url: "https://www.leader.ir/en/book/32/1?sn=5140"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 86",
          url: "https://www.leader.ir/ur/book/106/1?sn=11374"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "islampurifies",
    topicId: "mutahhirat",
    subject: {
      en: "Becoming Muslim"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a disbeliever declares in any language the shahādatayn (two testimonies) – i.e. he testifies to the oneness of Allah the Exalted and to the prophethood of the Seal of the Prophets [Prophet Muḥammad (Ṣ)] – he becomes a Muslim. In the event that he was previously ruled to be impure based on obligatory precaution, then, after becoming a Muslim, his body, saliva, nasal mucus, and sweat are pure. However, if at the time of becoming a Muslim an intrinsic impurity is on his body, it must be removed and that part of his body must be washed; and if the intrinsic impurity is removed before he becomes a Muslim, then based on obligatory precaution, that part of his body must be washed."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 205",
          url: "https://www.sistani.org/english/book/48/2147/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "purityestablished",
    topicId: "mutahhirat",
    subject: {
      en: "How purity is established"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person is certain or confident that an impure object has become pure, or two dutiful (ʿādil) people testify to it having become pure and their testimony concerns the reason for it having become pure, then the object is pure; for example, they testify that an item of clothing that had become impure with urine has been washed twice. The same applies if a person who is in possession of an impure object says that it has become pure, and he is not suspected to be someone whose word in this case cannot be accepted; or, if a Muslim washes an impure object with the intention of making it pure, even if it is not known whether he has washed it properly or not."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 221",
          url: "https://www.sistani.org/english/book/48/2151/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "goldsilverutensils",
    topicId: "mutahhirat",
    subject: {
      en: "Gold and silver utensils"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Eating and drinking from gold or silver utensils are unlawful. In fact, based on obligatory precaution, using these utensils in general is unlawful. However, there is no problem in using them for decorating a room and suchlike, or keeping them, although the recommended precautionary measure is not to [decorate with them and/or keep them]. The same applies to making gold and silver utensils or buying and selling them for decoration or keeping.",
          ur: "سونے اورچاندی کے برتنوں میں کھاناپینابلکہ احتیاط واجب کی بناپر ان کوکسی طرح بھی استعمال کرناحرام ہے لیکن ان سے کمرہ وغیرہ سجانے یاانہیں اپنے پاس رکھنے میں کوئی حرج نہیں اگر چہ ان کاترک کردینااحوط ہے اورسجاوٹ یاقبضے میں رکھنے کے لئے سونے اورچاندی کے برتن بنانے اوران کی خریدوفروخت کرنے کابھی یہی حکم ہے۔"
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 227",
          url: "https://www.sistani.org/english/book/48/2153/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (227)",
          url: "https://www.sistani.org/urdu/book/61/3629/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ]
  },
  {
    id: "wuduobligatoryacts",
    topicId: "wudu",
    subject: {
      en: "The obligatory acts of wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.",
          ur: "وضومیں واجب ہے کہ چہرہ اوردونوں ہاتھ دھوئے جائیں اورسر کے اگلے حصے اوردونوں پاؤں کے سامنے والے حصے کامسح کیاجائے۔"
        },
        hukm: "wajib",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 235",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (235)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduface",
    topicId: "wudu",
    subject: {
      en: "The area of the face to be washed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The length of the face that must be washed is the area from the top of the forehead where the hair grows to the bottom of the chin; and the breadth of the face that must be washed is the area that is covered by the tip of the middle finger to the tip of the thumb. If even a small amount of this area is not washed, the wuḍūʾ is invalid; and if one is not certain of having washed this area completely, he must also wash a little extra around this area to be certain.",
          ur: "چہرے کولمبائی میں پیشانی کے اوپراس جگہ سے لے کرجہاں سر کے بال اگتے ہیں ٹھوڑی کے آخری کنارے تک دھوناضروری ہے اورچوڑائی میں بیچ کی انگلی اور انگوٹھے کے پھیلاؤمیں جتنی جگہ آجائے اسے دھوناضروری ہے۔ اگراس مقدار کا ذرا سا حصہ بھی چھوٹ جائے تووضوباطل ہے اور اگر انسان کویہ یقین نہ ہوکہ ضروری حصہ پورا دھل گیاہے تویقین کرنے کے لئے تھوڑاتھوڑاادھرادھر سے دھونابھی ضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 236",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (236)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wududirection",
    topicId: "wudu",
    subject: {
      en: "Washing from top to bottom"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The direction in which one must wash the arms is from top to bottom [i.e. in a direction towards the fingertips]. The same applies, based on obligatory precaution, to washing the face [i.e. it must be washed in a direction towards the chin]. If a person washes from bottom to top, the wuḍūʾ is invalid.",
          ur: "احتیاط لازم کی بناپرضروری ہے کہ ہاتھوں اوراسی طرح چہرے کو اوپر سے نیچے کی طرف دھویاجائے۔ اگرنیچے سے اوپرکی طرف دھوئے جائیں تووضو باطل ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 242",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (242)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "wuduarms",
    topicId: "wudu",
    subject: {
      en: "Washing the arms"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After washing the face, one must wash his right arm from the elbow to the tips of the fingers, and he must then proceed to wash his left arm in the same way.",
          ur: "چہرہ دھونے کے بعدپہلے دایاں ہاتھ اورپھربایاں ہاتھ کہنی سے انگلیوں کے سروں تک دھوناچاہئے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 244",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (244)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduwashingcount",
    topicId: "wudu",
    subject: {
      en: "How many times to wash"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In wuḍūʾ, washing the face and arms once is obligatory, twice recommended, and three times or more unlawful. The first washing is complete when one pours – with the intention (qaṣd) of performing wuḍūʾ – an amount of water onto the face or arms that covers them completely, such that there is no need to take any further measures to ensure that the water has reached the required area. Therefore, if, for example, one pours water ten times onto his face until the water covers his face completely, and he does this with the intention of the first wash, there is no problem [i.e. the first wash will be deemed to have taken place correctly]. Until he does not make the intention of performing wuḍūʾ and washing his face, for example, the first wash is not deemed to have taken place. Therefore, he can pour water onto his entire face a number of times and on the last time he pours water, he can make the intention of a wuḍūʾ washing. However, the validity of such an intention for the second washing is problematic, and the obligatory precaution is that one must not pour water onto his face and arms more than one time after the first washing, even if it is not with the intention of performing wuḍūʾ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 247",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "I have been told that one can pour only two handfuls of water on the face during wuḍū’, and a third one will invalidate the wuḍū’, is that correct?",
          ur: "کسی نے مجھے کہا ہے کہ وضو کے دوران چہرے پر صرف دو چلو پانی ڈالا جائے اور تیسرا چلو پانی ڈالنے سے وضو باطل ہوجاتاہے ، کیا یہ صحیح ہے؟"
        },
        text: {
          en: "Washing wuḍū’ parts is obligatory for the first time and permissible for the second time. But it is not said in shar‘ to wash it for the third time. The criterion in determining each time is people’s opinion. If somebody does not know the people’s opinion in this regard, the criterion is one’s intention.",
          ur: "وضو میں اعضاء کا پہلی مرتبہ دھونا واجب، دوسری مرتبہ جائز اور تیسری مرتبہ جائز نہیں ہے لیکن ہر مرتبہ کی تعیین کا معیار خود انسان کا ارادہ اور قصد ہے پس اگر پہلی مرتبہ کے قصد سے چند دفعہ پانی ڈالے تو کوئی حرج نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 101",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 102",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "wuduhead",
    topicId: "wudu",
    subject: {
      en: "Wiping the head"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After washing both arms, one must wipe the front part of his head with the wetness of the water that has remained on his hand. And the recommended precaution is that one should wipe with the palm of his right hand and wipe from top to bottom [i.e. in a direction towards his forehead].",
          ur: "دونوں ہاتھ دھونے کے بعدسرکے اگلے حصے کامسح وضوکے پانی کی اس تری سے کرناچاہئے جوہاتھوں کولگی رہ گئی ہواوراحتیاط مستحب یہ ہے کہ مسح دائیں ہاتھ سے کیاجائے جواوپرسے نیچے کی طرف ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 248",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (248)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ]
  },
  {
    id: "wuduheadarea",
    topicId: "wudu",
    subject: {
      en: "The area of the head to be wiped"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The area that must be wiped is the front quarter of the head, i.e. the quarter immediately above the forehead. It is sufficient to wipe any part of this area and to any extent, although the recommended precaution is that the length of the wiping should be at least the length of one finger, and the width of the wiping should be at least the width of three fingers joined together.",
          ur: "سرکے چارحصوں میں سے پیشانی سے ملاہواایک حصہ وہ مقام ہے جہاں مسح کرناچاہئے۔اس حصے میں جہاں بھی اورجس اندازسے بھی مسح کریں کافی ہے۔ اگرچہ احتیاط مستحب یہ ہے کہ طول میں ایک انگلی کی لمبائی کے لگ بھگ اورعرض میں تین ملی ہوئی انگلیوں کے لگ بھگ جگہ پرمسح کیاجائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 249",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (249)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In wiping the head, is it sufficient to make the hair wet or is it obligatory that the moisture from the hand reaches the skin of the head, as well?",
          ur: "کیا سر کے مسح میں بالوں کا تر ہوجانا کافی ہے یا تری کا سر کی جلد تک پہچانا ضروری ہے ؟"
        },
        text: {
          en: "One may do mash of the head on the upper part of scalp or its hair. However, if the hair of another part of the head is collected on the upper part or the hair of upper part of the head is so long that now it is on the shoulder or face, it is not enough to pass wet hand on it. Rather, one must part the hair to do mash on the upper part of the scalp or the base of the hair.",
          ur: "سر کا مسح جلد پر یاسر کے اگلے حصے کے بالوں پر کیا جا سکتا ہے لیکن اگرسرکے دوسرے حصوں کے بال اگلے حصے پرآگئے ہوں یا سرکے اگلے حصے کے بال اتنے لمبے ہوں کہ چہرے یا کندھوں پر آجائیں تو ان پر مسح کرنا کافی نہیں ہے اور ضروری ہے کہ مانگ نکال کر جلد یا بالوں کی جڑوں پر مسح کرے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 124",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 125",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wudufeet",
    topicId: "wudu",
    subject: {
      en: "Wiping the feet"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After wiping the head, one must wipe the upper part of the feet with the wetness of the wuḍūʾ water that has remained on his hands. The area that must be wiped is from the tip of one of the toes to the ankle; and based on obligatory precaution, wiping the feet up to the raised part in the middle of the foot [before the ankle] will not suffice. And the recommended precaution is that one should wipe the right foot with the right hand and the left foot with the left hand.",
          ur: "سرکے مسح کے بعدوضوکے پانی کی اس تری سے جوہاتھوں میں باقی ہوپاؤں کی کسی ایک انگلی سے لے کرپاؤں کے جوڑتک مسح کرناضروری ہے اور احتیاط واجب کی بنا پر پیر کے اوپری حصہ کی ابھری ہوئی جگہ تک مسح کافی نہیں ہے اوراحتیاط مستحب یہ ہے کہ دائیں پیرکادائیں ہاتھ سے اوربائیں پیرکابائیں ہاتھ سے مسح کیا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 251",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (251)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "For some time I was not wiping the tips of my toes while performing the wiping in wuḍū’. I was only wiping the upper surface of the foot and part of the toes. Is this wiping valid? In case of invalidity, is it obligatory for me to repeat the prayers that I have performed with such wuḍū’?",
          ur: "کچھ عرصہ تک میں نے پاؤں کا مسح، انگلیوں کے سرے سے نہیں کیا ، بلکہ انگلیوں کے کچھ حصے اور پاؤں کے اوپر والے حصے پر مسح کرتارہاہوں، کیا ایسا مسح صحیح ہے ؟ اور اگر صحیح نہیں ہے تو جو نمازیں پڑھ چکاہوں ، کیا ان کی قضا واجب ہے یا نہیں ؟"
        },
        text: {
          en: "If the tips of the toes are not covered in the wiping process, the wuḍū’ is invalid and it is obligatory to repeat all the prayers offered with such a wuḍū’. But in case that one knew the ruling and probably he was wiping the tips of the toes during wiping, the wuḍū’s and the prayers offered with them are ruled to be correct.",
          ur: "اگر مسح پاؤں کی انگلیوں کے سرے سے نہ ہو اہو تو وضو باطل ہے اور نمازوں کی قضا واجب ہے لیکن اگر شک ہو کہ پاؤں کا مسح ، انگلیوں کے سرے سے کیا کرتا تھا یا نہیں تو اگر مسئلہ جانتا تھا اور اسے احتمال ہو کہ شاید انگلیوں کے سرے سے مسح کرتا رہا ہو تو وضو اور پڑھی گئی نمازیں صحیح ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 104",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 105",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wudusocks",
    topicId: "wudu",
    subject: {
      en: "Wiping over socks or shoes"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Wiping performed on socks or shoes is invalid. However, if one is unable to remove his socks or shoes on account of severe cold, or fear of thieves or predatory animals etc., then the obligatory precaution is that after he has wiped on his shoes or socks, he must also perform tayammum. If it is a matter of taqiyyah, it is sufficient if he only wipes over his socks or shoes."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 258",
          url: "https://www.sistani.org/english/book/48/2154/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "My feet are affected with paralysis and I walk with the help of medical shoes and crutches. It is not possible for me to take off the shoes for wuḍū’. Please explain my shar‘ī duty concerning the wiping of the feet.",
          ur: "میرے دونوں پاؤں مفلوج ہوچکے ہیں اور میں طبی جوتوں اور بیسا کھیوں کے ساتھ چلتاہوں ۔ وضو کرتے وقت کسی بھی صورت میں میرے لئے جوتوں کا اتارنا ممکن نہیں ہے لذا بتائیے پاؤں کے مسح کے سلسلے میں میری شرعی ذمہ داری کیا ہے ؟"
        },
        text: {
          en: "If removing the shoes for wiping the feet is so difficult for you, wiping over the shoes is sufficient and valid.",
          ur: "اگر پیروں پر مسح کرنے کیلئے جوتوں کا اتارنا آپ کیلئے سخت دشوار ہے تو جوتے پر ہی مسح کرلینا کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 119",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 120",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduimmersive",
    topicId: "wudu",
    subject: {
      en: "Immersive wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Immersive wuḍūʾ means that one immerses his face and arms in water with the intention of performing wuḍūʾ. And what is apparent (ẓāhir) is that there is no problem in wiping the head and feet with the wetness of the hands that were washed by immersion, although this goes against precaution.",
          ur: "ارتماسی وضویہ ہے کہ انسان چہرے اورہاتھوں کووضوکی نیت سے پانی میں ڈبودے۔بظاہر ارتماسی طریقے سے دھلے ہوئے ہاتھ کی تری سے مسح کرنے میں کوئی حرج نہیں ہے، لیکن ایساکرناخلاف احتیاط ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 260",
          url: "https://www.sistani.org/english/book/48/2155/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (260)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In doing wuḍū’ by immersion, is it permissible to submerge the face and the hands into the water more than two times?",
          ur: "کیا ارتماسی وضو میں چہرے اور ہاتھوں کو صرف دو مرتبہ پانی میں ڈبونا جائز ہے یا اس سے زیادہ بھی ڈبویا جاسکتاہے؟"
        },
        text: {
          en: "For wuḍū’ by immersion one may submerge the face and the hands only twice into the water. It is obligatory for the first time, permissible for the second time, and impermissible for more than that. Regarding the hands, in the given wuḍū’, one should intend washing for wuḍū’ when bringing them out of water in order to make it possible to use their wuḍū’ water for wiping.",
          ur: "صرف دو مرتبہ ڈبویا جاسکتاہے پہلی مرتبہ ڈبونا واجب ہے اور دوسری مرتبہ جائز ہے اور اس سے زیادہ جائز نہیں ہے لیکن ضروری ہے کہ ارتماسی وضو میں وضو کیلئے ہاتھوں کے دھونے کی نیت اس وقت کرے جب انہیں پانی سے نکال رہا ہو تا کہ مسح آبِ وضو کے ساتھ انجام دے سکے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 102",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 103",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduwaterimpure",
    topicId: "wudu",
    subject: {
      en: "Wuḍūʾ with impure or mixed water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Wuḍūʾ performed with impure or mixed water is invalid, even if one did not know at the time that it was impure or mixed, or he had forgotten about it; and if one has performed prayers with that wuḍūʾ, he must perform them again with a valid wuḍūʾ.",
          ur: "نجس یامضاف پانی سے وضوکرناباطل ہے خواہ وضوکرنے والاشخص اس کے نجس یامضاف ہونے کے بارے میں علم نہ رکھتاہویابھول گیاہوکہ یہ نجس یا مضاف پانی ہے۔لہٰذااگروہ ایسے پانی سے وضوکرکے نماز پڑھ چکاہوتوصحیح وضوکرکے دوبارہ نمازپڑھناضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 264",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (264)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduusurpedwater",
    topicId: "wudu",
    subject: {
      en: "Wuḍūʾ with usurped water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Performing wuḍūʾ with usurped (ghaṣbī) water, or with water about which it is not known if its owner consents to its use or not, is unlawful and invalid. Furthermore, if wuḍūʾ water drips from one’s face or arms onto a usurped place, or if the place in which one performs wuḍūʾ is usurped, in the event that he cannot perform wuḍūʾ in any other place, his responsibility (taklīf) is to perform tayammum; and if he can perform wuḍūʾ in another place, it is necessary for him to perform wuḍūʾ in that other place. However, in the event that he performs wuḍūʾ in the usurped place, thus committing a sin, his wuḍūʾ is still valid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 266",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "wuduintention",
    topicId: "wudu",
    subject: {
      en: "The intention (niyyah) of wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is not necessary for one to actually utter the intention (niyyah) of performing wuḍūʾ or feel it in his heart; rather, it is sufficient if he performs all the acts of wuḍūʾ in compliance with the command of Allah the Exalted.",
          ur: "وضوکی نیت زبان سے یادل میں کرناضروری نہیں بلکہ اگرایک شخص وضو کے تمام افعال اللہ تعالیٰ کے حکم پرعمل کرنے کی نیت سے بجالائے توکافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 281",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (281)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is wuḍū’ by itself mustaḥabb? And is it valid to perform wuḍū’ for the sake of nearness to Allah before the time of prayer arrives and then to offer the prayer with that wuḍū’?",
          ur: "کیا وضو بذات خود مستحب ہے ؟ اور اگر نماز کا وقت داخل ہونے سے پہلے قصد قربت کے ساتھ وضو کرلیا جائے تو کیا اس کے ساتھ نماز پڑھی جاسکتی ہے ؟"
        },
        text: {
          en: "Doing wuḍū’ for the sake of being in a state of purity is mustaḥabb and preferable in Islamic law and it is permissible to perform prayer with a mustaḥabb wuḍū’.",
          ur: "شرعی نقطہ نظر سے طہارت و پاکیزگی کیلئے وضو کرنا مستحب ہے اور مستحبی وضو کے ساتھ نماز پڑھنا جائز ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 121",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 122",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wudusequence",
    topicId: "wudu",
    subject: {
      en: "Sequence (tartīb) of wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "wuḍūʾ must be performed in the sequence (tartīb) mentioned earlier, i.e. first the face must be washed, then the right arm, and then the left arm; following that, the head must be wiped and then the feet. And based on obligatory precaution, one must wipe the left foot after the right foot."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Conditions of wuḍūʾ — 7th condition*",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "wudusuccession",
    topicId: "wudu",
    subject: {
      en: "Close succession (muwālāh)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If there is a gap in between the acts of wuḍūʾ to the extent that the acts of wuḍūʾ cannot be commonly regarded as being performed in close succession, the wuḍūʾ is invalid. However, this does not apply if a legitimate excuse (ʿudhr) arises; for example, one forgets that he is performing wuḍūʾ, or the water runs out. In fact, when one wants to wash or wipe a place, if the moisture on all the places he has already washed or wiped has dried up, the wuḍūʾ is invalid. If only the moisture on the place that comes before the area he wants to wash or wipe has dried up – for example, when he wants to wash his left arm, the moisture on his right arm has dried up but his face is still wet – then his wuḍūʾ is valid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 282",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the rule concerning an interval of time, which may separate the wiping and / or the washing of different body parts during wuḍū’ or ghusl?",
          ur: "وضو یا غسل میں اعضا ء کے دھونے کے درمیان فاصلہ کرنا کیا حکم رکھتاہے ؟"
        },
        text: {
          en: "There is no problem in an interval time — i.e. not observing succession — during the ghusl. However, wuḍū’ will be invalid if there is a delay in completing it to the extent that previously washed or wiped body parts dry up.",
          ur: "غسل میں اعضا کے درمیان فاصلہ کرنا ( عدم موالات) اشکال نہیں رکھتا لیکن وضو میں اگر اتنا فاصلہ کرے کہ پہلے والے اعضاء خشک ہوجائیں تو وضو باطل ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 126",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 127",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduobstruction",
    topicId: "wudu",
    subject: {
      en: "Obstructions such as nail polish"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "there must not be an obstruction for water to reach the parts of the body on which wuḍūʾ is performed.",
          ur: "وضوکے اعضاء تک پانی پہنچنے میں کوئی رکاوٹ نہ ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Conditions of wuḍūʾ — 11th condition",
          url: "https://www.sistani.org/english/book/48/8295/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "(گیارہویں شرط)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Some women claim that fingernail polish does not create a hindrance for the wuḍū’ and that it is permissible to do wiping over transparent socks. What is your opinion?",
          ur: "بعض عورتیں کہتی ہیں ناخن پالش ، وضو سے رکاوٹ نہیں بنتی ۔ نیز باریک جوراب پر مسح کرنا بھی جائز ہے کیا یہ صحیح ہے ؟"
        },
        text: {
          en: "If the fingernail polish has a substance that prevents water from reaching the nails, the wuḍū’ is void, and wiping performed on socks is incorrect, however transparent they may be.",
          ur: "اگر اس پالش کی اپنی تہ ہو تو وہ پانی کے ناخن تک پہنچنے سے رکاوٹ ہے اور وضو باطل ہے اور جوراب پر مسح صحیح نہیں ہے چاہے وہ کتنا ہی باریک ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 113",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 114",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wududoubtvoid",
    topicId: "wudu",
    subject: {
      en: "Doubt whether wuḍūʾ has become void"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone doubts whether his wuḍūʾ has become void or not, he must treat it as still being valid. However, if after urinating one does not perform istibrāʾ and performs wuḍūʾ, and after performing wuḍūʾ some fluid is discharged about which he does not know if it is urine or something else, his wuḍūʾ is void.",
          ur: "اگرکسی شخص کوشک ہوکہ اس کاوضو باطل ہواہے یانہیں تواسے یہ سمجھنا چاہئے کہ اس کاوضوباقی ہے، لیکن اگراس نے پیشاب کرنے کے بعداستبراء کئے بغیروضوکرلیاہواوروضوکے بعداس کے مخرج پیشاب سے ایسی رطوبت خارج ہو جس کے بارے میں وہ یہ نہ جانتاہوکہ پیشاب ہے یاکوئی اورچیزتواس کاوضوباطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 299",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (299)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "How could a person who is always doubtful about the validity of his wuḍū’ go to the masjid, pray, read the Noble Qur’an, and visit the shrine of the Infallibles (a.)?",
          ur: "جو شخص ہمیشہ اپنے وضو میں شک کرتاہے وہ کیسے مسجد میں داخل ہو کر نماز پڑھ سکتاہے ، قرآن کریم کی تلاوت کرسکتاہے اور ائمہ معصومین کے مرقد کی زیارت کرسکتاہے ؟"
        },
        text: {
          en: "No attention should be paid to doubt concerning state of purity after the performance of wuḍū’. And it is permissible for one to offer prayer and read the Noble Qur’an, etc. as long as one is not certain that his wuḍū’ has been invalidated.",
          ur: "وضو کرلینے کے بعد طہارت کی بقا میں شک قابل اعتنا نہیں ہے اور جب تک وضو ٹوٹنے کا یقین نہ ہوجائے اسکے ساتھ نماز پڑھ سکتاہے اور تلاوت و زیارت کرسکتاہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 122",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 123",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wududoubtperformed",
    topicId: "wudu",
    subject: {
      en: "Doubt whether wuḍūʾ was performed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person doubts whether he has performed wuḍūʾ or not, he must [deem that he has not and] perform wuḍūʾ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 300",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "",
          ur: "اصل وضو میں شک (یعنی شک کرے کہ وضو کیا ہے یا نہیں)\nنماز سے پہلے ہوتو وضو کرنا چاہئے\nنماز کے دوران ہوتو اس کی نماز باطل ہے اور دوبارہ وضو کرکے دوبارہ نماز پڑھے\nنماز کے بعد (شک کرے کہ وضو کے ساتھ نماز پڑھی ہے یا نہیں) تو جو نماز پڑھی ہے وہ صحیح ہے لیکن بعد والی نمازوں کے لئے وضو کرنا چاہئے"
        },
        basis: "fatwa",
        source: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو میں شک (اصل وضو)",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        urSource: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو میں شک (اصل وضو)",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        verification: "A",
        urduOnly: true,
        persianSource: {
          title: "رساله آموزشی",
          reference: "درس 16 — احکام وضو، 3 (الف)",
          url: "https://www.leader.ir/fa/book/137/1?sn=29552"
        },
        note: "Khamenei's official text for this is in Urdu only: his practical treatise (Risāla-yi Āmūzishī) in its official Urdu translation, with no official English translation (decision P19). Compared with his Q&A, the 2023 Rules and the Persian original (Risāla-yi Āmūzishī): no conflict found."
      }
    ]
  },
  {
    id: "wuduunaware",
    topicId: "wudu",
    subject: {
      en: "Finding out afterwards that one's wuḍūʾ was invalid"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If during or after prayers one learns that his wuḍūʾ or ghusl was invalid, or that he started performing prayers without wuḍūʾ or ghusl, he must perform the prayer again with wuḍūʾ or ghusl; and if the time for the prayer has expired, he must make it up."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 1251",
          url: "https://www.sistani.org/english/book/48/2263/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "",
          ur: "1۔ جو شخص اپنا وضو باطل ہونے کے بارے میں جاہل ہو اور وضو کے بعد متوجہ ہوجائے تو واجب ہے کہ وضو سے مشروط اعمال کے لئے دوبارہ وضو کرے اور باطل وضو کے ساتھ نماز پڑھی ہے تو اس کو بھی دوبارہ پڑھنا واجب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو کے احکام، 1",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        urSource: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو کے احکام، 1",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        verification: "A",
        urduOnly: true,
        persianSource: {
          title: "رساله آموزشی",
          reference: "درس 16 — احکام وضو، 1",
          url: "https://www.leader.ir/fa/book/137/1?sn=29552"
        },
        note: "Khamenei's official text for this is in Urdu only: his practical treatise (Risāla-yi Āmūzishī) in its official Urdu translation, with no official English translation (decision P19). Compared with his Q&A, the 2023 Rules and the Persian original (Risāla-yi Āmūzishī): no conflict found. Compared with his Q&A, Q 136 (س 137): the same ruling."
      }
    ]
  },
  {
    id: "wuduexcessive",
    topicId: "wudu",
    subject: {
      en: "A person who doubts excessively about wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who frequently doubts about the acts of wuḍūʾ and its conditions – such as the water being pure and not being usurped – must not heed his doubts.",
          ur: "اگرکوئی شخص وضوکے افعال اورشرائط مثلاً پانی کے پاک ہونے یا غصبی نہ ہونے کے بارے میں بہت زیادہ شک کرے تواسے چاہئے کہ اپنے شک کی پروا نہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 298",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (298)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "",
          ur: "2۔ جو شخص وضو کے افعال اور شرائط مثلا پانی کا پاک ہونا اور غصبی نہ ہونا میں زیادہ شک کرتا ہے اس کو چاہئے کہ اپنے شک پر اعتناء نہ کرے"
        },
        basis: "fatwa",
        source: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو کے احکام، 2",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        urSource: {
          title: "احکام آموزشی",
          reference: "سبق 16 — وضو کے احکام، 2",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        verification: "A",
        urduOnly: true,
        persianSource: {
          title: "رساله آموزشی",
          reference: "درس 16 — احکام وضو، 2",
          url: "https://www.leader.ir/fa/book/137/1?sn=29552"
        },
        note: "Khamenei's official text for this is in Urdu only: his practical treatise (Risāla-yi Āmūzishī) in its official Urdu translation, with no official English translation (decision P19). Compared with his Q&A, the 2023 Rules and the Persian original (Risāla-yi Āmūzishī): no conflict found."
      }
    ]
  },
  {
    id: "wududoubtafterprayer",
    topicId: "wudu",
    subject: {
      en: "Doubt after prayers about wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person doubts after prayers whether he had performed wuḍūʾ or not, his prayers are valid but he must perform wuḍūʾ for subsequent prayers.",
          ur: "اگرکسی شخص کونماز پڑھنے کے بعدشک ہوکہ اس نے وضوکیاتھا یا نہیں تو اس کی نماز صحیح ہے لیکن آئندہ نمازوں کےلئے وضو کرنا ضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 303",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (303)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wududoubtduring",
    topicId: "wudu",
    subject: {
      en: "Doubt during prayers whether wuḍūʾ was performed"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person doubts during prayers whether or not he had performed wuḍūʾ, then based on obligatory precaution, he must perform wuḍūʾ and perform the prayer again.",
          ur: "اگرکسی شخص کونماز کے دوران شک ہوکہ آیااس نے وضو کیا تھا یا نہیں تو (احتیاط واجب کی بناء پر) وضو کرے اور دوبارہ نماز پڑھے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 304",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (304)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "wuduorderunknown",
    topicId: "wudu",
    subject: {
      en: "Knowing both wuḍūʾ and an invalidator, not which came first"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone knows he has performed wuḍūʾ and also knows that he has done something that invalidates wuḍūʾ – for example, he has urinated – but he does not know which one was first [i.e. he does not know whether he performed wuḍūʾ and then urinated, for example, or he urinated and then performed wuḍūʾ], then in the event that he has this doubt before prayers, he must perform wuḍūʾ for those prayers. If he has this doubt during prayers, he must break his prayer and perform wuḍūʾ. And if he has this doubt after prayers, the prayer he performed is valid but he must perform wuḍūʾ for subsequent prayers.",
          ur: "جس شخص کومعلوم ہوکہ اس نے وضوکیاہے اوراس سے حدث بھی واقع ہوگیاہے( مثلاً اس نے پیشاب کیاہے) لیکن اسے یہ معلوم نہ ہوکہ کون سی بات پہلے واقع ہوئی ہے اگریہ صورت نماز سے پہلے پیش آئے تواسے چاہئے کہ وضوکرے اوراگرنماز کے دوران پیش آئے تونمازتوڑکروضوکرناضروری ہے اوراگرنماز کے بعدپیش آئے تو جو نمازوہ پڑھ چکاہے وہ صحیح ہے البتہ دوسری نمازوں کے لئے وضوکرناضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 301",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (301)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduvoidtime",
    topicId: "wudu",
    subject: {
      en: "Finding wuḍūʾ void after prayers, not knowing when"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person realises after prayers that his wuḍūʾ has become void but doubts whether his wuḍūʾ became void before or after prayers, the prayers performed by him are valid.",
          ur: "اگرکوئی شخص نمازکے بعدیہ سمجھے کہ اس کاوضوباطل ہوگیاتھا، لیکن شک ہو کہ اس کاوضو نماز سے پہلے باطل ہواتھایابعدمیں توجونمازپڑھ چکاہے وہ صحیح ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 305",
          url: "https://www.sistani.org/english/book/48/2157/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (305)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduwhenwajib",
    topicId: "wudu",
    subject: {
      en: "When wuḍūʾ is obligatory"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is obligatory to perform wuḍūʾ for six things:\n1. for obligatory prayers – except the funeral prayer (ṣalāt al‑mayyit) – and for recommended prayers;\n2. for a sajdah and tashahhud that have been forgotten if between them and the prayer one has done something that invalidates wuḍūʾ; for example, he has urinated. It is not obligatory, however, to perform wuḍūʾ for the two prostrations for inadvertence (sajdatā al‑sahw);\n3. for the obligatory circumambulation (ṭawāf) of the Kaʿbah that is part of hajj or ʿumrah;\n4. if one had made a vow (nadhr) or a covenant (ʿahd) or had taken an oath (qasam) that he would perform wuḍūʾ;\n5. if one had made a vow that, for example, he would kiss the writing of the Qur’an;\n6. for washing a copy of the Qur’an that has become impure or for taking it out from a lavatory and such places, in the event that he is obliged to touch the writing of the Qur’an with his hand or with some other part of his body. However, in the event that the delay that would be caused by performing wuḍūʾ would result in further disrespect to the Qur’an, one must take the Qur’an out from the lavatory and such places – or wash it if it has become impure – without performing wuḍūʾ."
        },
        hukm: "wajib",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 315",
          url: "https://www.sistani.org/english/book/48/2158/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "touchingquran",
    topicId: "wudu",
    subject: {
      en: "Touching the writing of the Qur'an"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Touching the writing of the Qur’an – i.e. making a part of the body come into contact with the writing of the Qur’an – for someone who does not have wuḍūʾ is unlawful. However, if the Qur’an is translated into another language, then touching the translation is not a problem.",
          ur: "جوشخص باوضو نہ ہواس کے لئے قرآن مجیدکے الفاظ کوچھونایعنی اپنے بدن کاکوئی حصہ قرآن مجید کے الفاظ سے لگاناحرام ہے، لیکن اگرقرآن مجید کافارسی زبان یاکسی اور زبان میں ترجمہ کیاگیاہوتواسے چھونے میں کوئی اشکال نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 316",
          url: "https://www.sistani.org/english/book/48/2158/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (316)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is the prohibition of touching the words of the Noble Qur’an without purity limited to the case where they are in the sacred scripture, or is it ḥarām, although they are found in other books, tableaux, walls, etc.?",
          ur: "قرآن کریم کی تحریر کو بغیر وضو کے جو چھونا حرام ہے تو کیا یہ صرف اس تحریر کے ساتھ مختص ہے جو قرآن کریم میں ہو یا اس قرآنی تحریر کو بھی چھونا حرام ہے جو کسی دوسری کتاب، اخبار، رسالے ، سائن بورڈ اور دیوارو غیرہ پر ہو۔"
        },
        text: {
          en: "It is not limited to the sacred scripture. Rather, it also includes the Qur’anic words and verses written in other books, newspapers, magazines, tableaux, etc.",
          ur: "قرآن کریم کے حروف اور آیات کو بغیر وضو کے چھونا حرام ہے خواہ یہ قرآن کریم میں ہوں یا کسی دوسری کتاب، اخبار، رسالے اور سائن بورڈ و غیرہ پر ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 153",
          url: "https://www.leader.ir/en/book/32/1?sn=5246"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 154",
          url: "https://www.leader.ir/ur/book/106/1?sn=11377"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "wuduinvalidators",
    topicId: "wudu",
    subject: {
      en: "Things that invalidate wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Seven things invalidate wuḍūʾ:\n1. urinating; and apparently included in the ruling of urinating is the similar moisture that comes out after urinating and before performing istibrāʾ;\n2. defecating;\n3. passing wind of the stomach and the intestine from the anus;\n4. sleeping, which means that simultaneously one’s eyes do not see and one’s ears do not hear; however, if one’s eyes do not see but his ears hear, his wuḍūʾ does not become invalid;\n5. things that cause one to lose his mind, such as insanity, intoxication, and unconsciousness;\n6. istiḥāḍah of a woman, which will be discussed later;\n7. janābah; and based on recommended precaution, all things for which one must perform ghusl.",
          ur: "سات چیزیں وضوکوباطل کردیتی ہیں :\n(اول:) پیشاب اورمشکوک رطوبت جو انسان سے پیشاب کے بعد اور استبراء کے پہلے نکلتی ہے وہ ظاہراً پیشاب کے ضمن میں ہے ۔\n(دوم:) پاخانہ\n(سوم:) معدے اورآنتوں کی ہواجو مقعد سے خارج ہوتی ہے۔\n(چہارم:) نیندجس کی وجہ سے نہ آنکھیں دیکھ سکیں اور نہ کان سن سکیں ، لیکن اگرآنکھیں نہ دیکھ رہی ہوں لیکن کان سن رہے ہوں تووضوباطل نہیں ہوتا۔\n(پنجم:) ایسی حالت جن میں عقل زائل ہوجاتی ہو مثلاًدیوانگی، مستی یابے ہوشی۔\n(ششم:) عورتوں کا استحاضہ جس کاذکربعدمیں آئے گا۔\n(ہفتم:) جنابت بلکہ احتیاط مستحب کی بناپرہروہ کام جس کے لئے غسل کرناضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 322",
          url: "https://www.sistani.org/english/book/48/2159/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (322)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "issue",
        text: {
          en: "",
          ur: "1۔ پیشاب نکلنا\n2۔ پاخانہ نکلنا\n3۔ معدہ یا انتڑیوں سے ہوا نکلنا\n4۔ اس طرح نیند آنا کہ آنکھ نہ دیکھے اور کان نہ سنے\n5۔ وہ چیزیں جو عقل کو زائل کرتی ہیں مثلا دیوانگی، مستی اور بے ہوشی\n6۔ عورتوں کا استحاضہ\n7۔ ہر وہ چیز جو غسل کا باعث بنتی ہے مثلا جنابت، حیض اور مس میت"
        },
        basis: "fatwa",
        source: {
          title: "احکام آموزشی",
          reference: "سبق 16 — مبطلات وضو",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        urSource: {
          title: "احکام آموزشی",
          reference: "سبق 16 — مبطلات وضو",
          url: "https://www.leader.ir/ur/book/201/1?sn=32120"
        },
        verification: "A",
        urduOnly: true,
        persianSource: {
          title: "رساله آموزشی",
          reference: "درس 16 — مبطلات وضو",
          url: "https://www.leader.ir/fa/book/137/1?sn=29551"
        },
        note: "Khamenei's official text for this is in Urdu only: his practical treatise (Risāla-yi Āmūzishī) in its official Urdu translation, with no official English translation (decision P19). Compared with his Q&A, the 2023 Rules and the Persian original (Risāla-yi Āmūzishī): no conflict found. His English books and his Q&A have no list of invalidators; his Q&A (Q 92, س 93) agrees that madhī, wadhī and wadī do not invalidate wuḍūʾ."
      }
    ]
  },
  {
    id: "jabirauncovered",
    topicId: "wudu",
    subject: {
      en: "Wounds and fractures (jabīrah): uncovered"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a wound, boil, or broken bone is on one’s face or arms, and it is uncovered, and pouring water over it is harmful, then the area around the wound or boil must be washed from top to bottom in the manner that was explained regarding wuḍūʾ. If drawing a wet hand over it is not harmful, it is better that one draw a wet hand over it, place a pure cloth over it, and then draw a wet hand over the cloth as well. As for the case of a broken bone, it is necessary to perform tayammum [instead of jabīrah wuḍūʾ].",
          ur: "اگرکسی شخص کے چہرے اورہاتھوں پرزخم یاپھوڑاہویااس کی ہڈی ٹوٹی ہوئی ہواور اس کامنہ کھلاہواوراس پرپانی ڈالنانقصان دہ ہو تواسے زخم یاپھوڑے کے آس پاس کاحصہ اس طرح اوپرسے نیچے جیسا(وضوکے بارے میں بتایا گیاہے) اور بہتریہ ہے کہ اگراس پرتر ہاتھ کھینچنا نقصان دہ نہ ہوتوترہاتھ اس پرکھینچے اوراس کے بعدپاک کپڑااس پرڈال دے اور گیلا ہاتھ اس کپڑے پربھی کھینچے۔البتہ اگر ہڈی ٹوٹی ہوئی ہوتوتیمم کرنالازم ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 324",
          url: "https://www.sistani.org/english/book/48/2160/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (324)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the duty of someone who has a wound or a fracture in one of his body parts involved in wuḍū’?",
          ur: "جس شخص کے اعضاء وضو میں سے کوئی عضو ٹوٹا ہوا ہو یا اس پر زخم ہو تو اسکی ذمہ داری کیا ہے ؟"
        },
        text: {
          en: "If the wound or the fracture is not dressed and it is not harmful to wash it with water, it should be washed. However, if washing it is harmful, the surrounding area is to be washed and it is based on obligatory caution to wipe it with wet hand if it is not harmful.",
          ur: "جو عضو ٹوٹا ہوا ہے یا اس پر زخم ہے اگر وہ اوپر سے کھلا ہوا ہو اور اس کیلئے پانی نقصان دہ نہ ہو تو اسے دھونا ضروری ہے اور اگر اسے دھونا نقصان دہ ہو تو اسکی اطراف کو دھوئے اور احتیاط یہ ہے کہ اگر اس پر تر ہاتھ پھیرنے میں نقصان نہ ہو تو اس پر تر ہاتھ پھیرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 134",
          url: "https://www.leader.ir/en/book/32/1?sn=5142"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 135",
          url: "https://www.leader.ir/ur/book/106/1?sn=11376"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "jabiracovered",
    topicId: "wudu",
    subject: {
      en: "Wounds and fractures (jabīrah): covered"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a wound, boil, or broken bone that is covered is on the face or arms, in the event that it is harmful to uncover and pour water over it, one must wash as much of the area around it as possible. And based on obligatory precaution, one must also wipe over the jabīrah.",
          ur: "اگرکسی شخص کازخم یاپھوڑایاٹوٹی ہوئی ہڈی جوکسی چیزسے بندھی ہوئی ہواس کے چہرے یاہاتھوں پرہواوراس کاکھولنااوراس پرپانی ڈالنامضرہوتوضروری ہے کہ آس پاس کے جتنے حصے کودھوناممکن ہواسے دھوئے اور(احتیاط واجب کی بناء پر) جبیرہ پرمسح کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 327",
          url: "https://www.sistani.org/english/book/48/2160/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (327)",
          url: "https://www.sistani.org/urdu/book/61/3630/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "becomingjunub",
    topicId: "ghusl",
    subject: {
      en: "How one becomes junub"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A person becomes junub in two ways:\n1. sexual intercourse;\n2. ejaculation of semen, whether he is asleep or awake, and whether it is a little or a lot, with or without lust, voluntarily or involuntarily."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 344",
          url: "https://www.sistani.org/english/book/48/2162/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "If penetration of only the glans occurs with no ejaculation of semen and the woman has not reached orgasm, is ghusl obligatory for her, him, or both?",
          ur: "اگر حشفہ(ختنہ گاہ) کی مقدار تک دخول ہو لیکن منی خارج نہ ہو اور عورت بھی لذت کے آخری مرحلے تک نہ پہنچے تو کیا غسل جنابت صرف عورت پر واجب ہے یا صرف مرد پر یا دونوں پر ؟"
        },
        text: {
          en: "If penetration occurs, even of the glans only, ghusl will be obligatory for both of them.",
          ur: "دخول کی صورت میں اگر چہ حشفہ کی مقدا ر ہی ہو دونوں پر غسل واجب ہوجاتاہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 169",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 170",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "semensigns",
    topicId: "ghusl",
    subject: {
      en: "Signs of semen"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If some fluid is discharged by a man who is not sick and that fluid has one of the three characteristics mentioned in the previous ruling, but the man does not know whether it had any of the other characteristics, he is not considered junub and performing ghusl is not obligatory for him.",
          ur: "اگرکسی ایسے شخص کے مخرج پیشاب سے جوبیمار نہ ہوکوئی ایسا پانی خارج ہوجس میں ان تین علامات میں سے جن کاذکراوپر والے مسئلہ میں کیاگیا ہے ایک علامت موجود ہواور اسے یہ علم نہ ہو کہ باقی علامات بھی اس میں موجود ہیں یانہیں تو اگر اس پانی کے خارج ہونے سے پہلے اس نے وضو کیاہوا ہوتوضروری ہے کہ اسی وضو کو کافی سمجھے اور اگروضو نہیں کیاتھاتوصرف وضو کرناکافی ہے اوراس پرغسل کرنالازم نہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 346",
          url: "https://www.sistani.org/english/book/48/2162/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (346)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "When is a discharge from a male considered to be semen?",
          ur: "کس صورت میں مرد سے خارج ہونے والی رطوبت پر منی ہونے کا حکم لگایا جاسکتاہے ؟"
        },
        text: {
          en: "For a healthy man, when it is accompanied by sexual excitement, weakness of the body and spurt, it is subject to the rule of semen.",
          ur: "وہ مرد جو تندرست ہو جب  اس سے شہوت کے ساتھ نکلے، بدن میں سستی آجائے اور اچھل کر نکلے تو اس پر منی کا حکم لگے گا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 176",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 177",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "womenjanabah",
    topicId: "ghusl",
    subject: {
      en: "Janābah for women"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In respect of women’s nocturnal emission, when does ghusl become obligatory for them? Is the discharge that comes out at the time of caressing and foreplay considered manī? And is it obligatory for them to perform ghusl despite the fact that they do not have an orgasm or do not feel weakness in the body? In general, when do women become junub without intercourse?",
          ur: "کس صورت میں عورت پر احتلام کی وجہ سے غسل جنابت واجب ہوتاہے ؟ اپنے شوہر کے ساتھ خوش فعلی کے وقت جو رطوبت عورت سے خارج ہوتی ہے کیا وہ منی کے حکم میں ہے ؟ کیا بغیراسکے کہ عورت کا بدن سست ہو اور وہ لذت کے انتہائی مرحلے تک پہنچے اس پر غسل واجب ہوجاتاہے ؟ بطور کلی مباشرت کے بغیر عورت کیسے مجنب ہوتی ہے ؟"
        },
        text: {
          en: "When a woman reaches orgasm and a fluid is discharged from her, she becomes junub and ghusl of janābah becomes obligatory for her. But if she doubts whether she reached such a stage or not or whether the discharge came out or not, ghusl would not be obligatory for her.",
          ur: "اگرعورت لذت کے آخری مرحلے تک پہنچ جائے اور اسی حالت میں اس سے کوئی رطوبت خارج ہوجائے تو وہ مجنب ہوجائے گی اور اس پر غسل واجب ہوگا لیکن اگر اسے شک ہو کہ لذت کے آخری مرحلے تک پہنچی ہے یا نہیں یا شک ہو کہ کوئی رطوبت خارج ہوئی ہے یا نہیں تو غسل واجب نہیں ہے ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 170",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 171",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "junubunlawful",
    topicId: "ghusl",
    subject: {
      en: "Things unlawful for a junub"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Five things are unlawful for a junub:\n1. touching the writing of the Qur’an or the name of Allah the Exalted with any part of the body as per the details that were mentioned in the section on wuḍūʾ;\n2. entering Masjid al-Ḥarām and the Mosque of the Prophet (Ṣ), even to the extent of entering from one door and exiting from another;\n3. staying in other mosques; and similarly, based on obligatory precaution, staying in the shrines of the Infallible Imams (ʿA). However, there is no problem if a junub passes through a mosque; for example, by entering from one door and exiting from another;\n4. entering a mosque to take something from it; and similarly, based on obligatory precaution, placing something in it even if he does not enter the mosque himself [but places something in it from outside];\n5. reciting any of the verses for which sajdah is obligatory. These verses are found in four chapters (surahs) of the Qur’an:\na. Sūrat al-Sajdah (Chapter 32), verse 15;\nb. Sūrat Fuṣṣilat (Chapter 41), verse 37;\nc. Sūrat al-Najm (Chapter 53), verse 62;\nd. Sūrat al-ʿAlaq (Chapter 96), verse 19."
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 354",
          url: "https://www.sistani.org/english/book/48/2163/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is it ḥarām for the junub person to recite those Qur’anic chapters with obligatory prostration?",
          ur: "کیا مجنب پر ان سورتوں کا پڑھنا حرام ہے جن میں واجب سجدہ ہے ؟"
        },
        text: {
          en: "Among the acts prohibited for a junub person is the recitation of these specific verses that require prostration, but it is no problem for him to recite the other verses of the same chapter.\n(1) When the fast is void by obligatory caution, the person is required to keep fasting and to make up for it in qaḍā’ later on.",
          ur: "مجنب کیلئے جو کام حرام ہیں ان میں سے ایک ان سورتوں کی سجدہ والی آیات کا پڑھنا ہے لیکن ان سورتوں کی دیگر آیات پڑھنے میں اشکال نہیں ہے ۔\nجن صورتوں میں احتیاط واجب کی بناپر روزہ باطل ہوتا ہے، ضروری ہے کہ مکلف روزہ رکھے اور قضا بھی بجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 198",
          url: "https://www.leader.ir/en/book/32/1?sn=5248"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 199",
          url: "https://www.leader.ir/ur/book/106/1?sn=11379"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "ghusljanabahobligatory",
    topicId: "ghusl",
    subject: {
      en: "When ghusl for janābah is obligatory"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The ghusl for janābah is obligatory for obligatory prayers and suchlike, but it is not necessary for ṣalāt al‑mayyit, sajdatā al‑sahw, the prostration for offering thanks (sajdat al‑shukr), and for the obligatory prostrations of the Qur’an.",
          ur: "غسل جنابت واجب نماز پڑھنے کے لئے اورایسی دوسری عبادات کے لئے واجب ہوجاتاہے، لیکن نماز میت، سجدئہ سہو، سجدئہ شکراورقرآن مجید کے واجب سجدوں کے لئے غسل جنابت ضروری نہیں ہے۔"
        },
        hukm: "wajib",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 356",
          url: "https://www.sistani.org/english/book/48/2165/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (356)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghusltypes",
    topicId: "ghusl",
    subject: {
      en: "Sequential and immersive ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Two types of ghusls for janābah can be performed: sequential (tartībī) and immersive (irtimāsī)."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 359",
          url: "https://www.sistani.org/english/book/48/2165/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "ghusltartibi",
    topicId: "ghusl",
    subject: {
      en: "Sequential (tartībī) ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In sequential ghusl, one must – based on obligatory precaution – first wash with the intention of ghusl the entire head and neck and then the entire body with the intention of ghusl; and it is better to first wash the right side of the body, then the left. In the event that one intentionally or due to being negligent in learning the laws of ghusl does not wash the entire head and neck before washing the body, then based on obligatory precaution, his ghusl is invalid. Furthermore, based on obligatory precaution, when performing ghusl, it is not sufficient to make the intention of ghusl when moving the head, neck, or body while they are already under the flow of water; rather, the part that one wants to perform ghusl on – in the event that it is already under the flow of water – must be taken out from under the flow of water and then washed with the intention of ghusl.",
          ur: "ترتیبی غسل میں ( احتیاط لازم کی بناپر)غسل کی نیت سے پہلے پوراسر اور گردن اوربعدمیں پورابدن دھوناضروری ہے اوربہتریہ ہے کہ بدن کوپہلے دائیں طرف سے اور بعدمیں بائیں طرف سے دھوئے اور اگر عمداً یا احکام غسل سمجھنے میں کوتاہی کی بناء پر سر و گردن کے دھونے کو بدن کے دھونے پر مقدم نہ کرے تو احتیاط لازم کی بنا پر اس کا غسل باطل ہے اور اسی طرح( احتیاط لازم کی بنا پر )غسل کرنے میں یہ کافی نہیں ہے کہ سر یا گردن یابدن جس وقت پانی کے اندر ہو انھیں غسل کی نیت کے ساتھ حرکت دےلہٰذا اگر بدن کے جس حصے کو غسل دینا چاہتا ہے اور وہ پانی کے اندر ہوتو اسے باہر لائے اور پھر نیت غسل کرکے اسے دھولے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 360",
          url: "https://www.sistani.org/english/book/48/2166/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (360)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is it sufficient in the ghusl of janābah to observe the order between the head and the other parts of the body, or is the observance of order necessary in washing the two sides as well?",
          ur: "کیا غسل جنابت میں یہ ترتیب کافی ہے کہ پہلے سر دھوئیں اور اس کے بعد جسم کے باقی اعضاء کو، یا یہ کہ جسم کی دونوں اطراف میں بھی ترتیب ضروری ہے؟"
        },
        text: {
          en: "It is necessary, based on obligatory caution, to observe the order between the two sides by washing the right side before the left one.",
          ur: "بنابر احتیاط واجب دونوں اطراف کے درمیان ترتیب ضروری ہے اور یہ کہ پہلے جسم کا دایاں حصہ دھوئے پھر بایاں حصہ۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 190",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 191",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "ghuslirtimasi",
    topicId: "ghusl",
    subject: {
      en: "Instantaneous immersive ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In instantaneous immersive ghusl, water must cover the entire body in one go. However, it is not necessary for the entire body to be out of the water before starting the ghusl; rather, it is sufficient if part of the body is out of the water and the person goes under the water completely with the intention of performing ghusl."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 366",
          url: "https://www.sistani.org/english/book/48/2167/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ]
  },
  {
    id: "ghuslgradual",
    topicId: "ghusl",
    subject: {
      en: "Gradual immersive ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In gradual immersive ghusl, one must gradually – but in a way that can be commonly considered one single action – immerse his body in water with the intention of ghusl. In this type of ghusl, it is necessary for each part of the body to be out of the water before it is washed.",
          ur: "غسل ارتماسی تدریجی میں ضروری ہے کہ غسل کی نیت سے ایک دفعہ بدن کو دھونے کاخیال رکھتے ہوئے اس طرح سےجسے عرف میں ایک شمار کیا جائے آہستہ آہستہ پانی میں غوطہ لگائے۔ اس غسل میں ضروری ہے کہ بدن کاہرحصہ غسل کرنے سے پہلے پانی سے باہر ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 367",
          url: "https://www.sistani.org/english/book/48/2167/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (367)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslwholebody",
    topicId: "ghusl",
    subject: {
      en: "Washing the whole outer body"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If in ghusl any part of the outer area of the body is left unwashed, the ghusl is invalid. However, washing inside the ears, nose, and whatever is considered an inner part of the body is not obligatory.",
          ur: "غسل میں بدن کا ظاہری حصہ بغیر دھوئے رہ جائے توغسل باطل ہے، لیکن کان اور ناک کے اندرونی حصوں کااورہراس چیزکادھوناجوباطن شمار ہوتی ہو واجب نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 373",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (373)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In the janābah ghusl, is it necessary that water flows over the body?",
          ur: "آپ کی نظر میں غسل جنابت میں کیا پانی کا بدن پر جاری ہونا شرط ہے؟"
        },
        text: {
          en: "The standard is the real meaning of washing the body with the intention of ghusl and the flowing of water over it is not a condition.",
          ur: "معیار یہ ہے کہ اس پر غسل کے قصد سے بدن کا دھونا صادق آ جائے، پانی کا جاری ہونا شرط نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 188",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 189",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslobstruction",
    topicId: "ghusl",
    subject: {
      en: "Obstructions to water in ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Anything that is an obstacle for water to reach the body must be removed; if one performs ghusl before becoming confident that the obstacle has been removed, the ghusl is invalid.",
          ur: "جوچیزبدن تک پانی پہنچنے میں مانع ہوضروری ہے کہ انسان اسے ہٹا دے اوراگراس سے پیشترکہ اسے یقین ہوجائے کہ وہ چیزہٹ گئی ہے غسل کرے تواس کا غسل باطل ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 376",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (376)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In some cases it is observed that after ghusl there remain traces of soap or chalk around the fingernails and toenails that were not visible in the bathroom; however, after coming out from the bathroom the whiteness of soap becomes visible. Some people do ghusl and wuḍū’ without knowing this rule or paying attention to it. What is one’s duty in such cases, as it is uncertain whether water has reached the skin under the white trace or not?",
          ur: "بعض موقعوں پر غسل کے بعد ہاتھ یا پیر کے ناخن کے اطراف میں چونے یا صابن کا اثر دکھائی دیتاہے جو غسل کے دوران حمام میں نظر نہیں آتا لیکن حمام سے نکلنے اور دقت کرنے کے بعد انکی سفیدی نظر آتی ہے ، اس کا حکم کیا ہے ؟ جبکہ بعض افراد غسل اور وضو کے وقت اس مسئلہ سے بے خبر ہوتے ہیں یا اس کی طرف توجہ نہیں رکھتے اور چونے یا صابن کا اثر موجود ہونے کی صورت میں اس کے نیچے پانی کے پہنچنے کا یقین نہیں ہوتا؟"
        },
        text: {
          en: "The mere presence of a layer of chalk or soap, that becomes visible after the body dries up, does not harm the validity of wuḍū’ or ghusl, except when it makes an obstacle that prevents water from reaching the skin.",
          ur: "صرف صابن یا چونے کے اثر کا موجود ہونا کہ جو اعضاء کے خشک ہونے کے بعد دکھائی دے، وضو یا غسل کو باطل نہیں کرتا مگر یہ کہ اسکی ایسی تہ ہو جو جلد تک پانی پہنچنے میں رکاوٹ بنے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 177",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 178",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslhair",
    topicId: "ghusl",
    subject: {
      en: "Hair in ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "In ghusl, short hair that is considered part of the body must be washed. It is not obligatory to wash long hair. In fact, if one makes water reach the skin in a way that the hair does not become wet, the ghusl is valid. However, if it is not possible for water to reach the skin without the hair becoming wet, then one must wash the hair in a way that water reaches the body.",
          ur: "غسل میں ان چھوٹے چھوٹے بالوں کوجوبدن کاجزشمار ہوتے ہیں دھوناضروری ہے اورلمبے بالوں کادھوناواجب نہیں ہے بلکہ اگرپانی کوجلدتک اس طرح پہنچائے کہ لمبے بال ترنہ ہوں تو غسل صحیح ہے، لیکن انہیں دھوئے بغیرجلدتک پانی پہنچاناممکن نہ ہوتوانہیں بھی دھوناضروری ہے تاکہ پانی بدن تک پہنچ جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 378",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (378)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is it obligatory for women to wash all the hair during ghusl? And if water does not reach all the hair in ghusl does it make the ghusl invalid, even if one knows that water has reached the entire scalp?",
          ur: "کیا عورت پر غسل میں تمام بالوں کا دھونا واجب ہے؟ اور اگر غسل میں تمام بالوں تک پانی نہ پہنچے تو کیا غسل باطل ہے؟ جبکہ یہ معلوم ہو کہ سر کی تمام جلد تک پانی پہنچ چکا ہے؟"
        },
        text: {
          en: "It is an obligatory caution to wash the whole hair.",
          ur: "احتیاط واجب یہ ہے کہ تمام بالوں کو دھوئے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 192",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 193",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ],
    differsBetweenMaraji: true
  },
  {
    id: "ghusldoubt",
    topicId: "ghusl",
    subject: {
      en: "Doubt about ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who doubts whether or not he has performed ghusl must perform it. However, if after performing ghusl, when the ghusl would commonly be considered finished, one doubts whether or not part of his head and neck or body has been washed, then in case he habitually performs the acts of ghusl in close succession and knows that he has washed most parts of his body, he must not heed his doubt."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 383*",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "I took a bath with the intention of performing an obligatory ghusl, and after leaving the bathroom I doubted whether I observed the order in making ghusl or not. As I thought the mere intention of sequence is sufficient, I did not repeat the ghusl. Now, I wonder if I should perform the qaḍā’ of all the prayers offered thereafter?",
          ur: "میں نے ایک واجب غسل کی بجا آوری کے ارادے سے غسل کیا، حمام سے نکلنے کے بعد مجھے شک ہوگیا کہ میں نے ترتیب کی رعایت کی ہے یا نہیں اور چونکہ مجھے احتمال تھا کہ صرف ترتیب کی نیت ہی کافی ہے لہذا میں نے غسل کا اعادہ نہیں کیا اب میں اس مسئلہ میں پریشان ہوں، کیا مجھ پر تمام نمازوں کی قضا واجب ہے؟"
        },
        text: {
          en: "As per the given case, you have no duty. Yet, if you become certain that your ghusl was invalid, it is obligatory for you to repeat all the prayers in qaḍā’.",
          ur: "مذکورہ صورت میں آپ کے ذمے کچھ نہیں ہے لیکن اگر آپ کو غسل کے باطل ہونے کا یقین ہے تو آپ پر تمام نمازوں کی قضا واجب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 196",
          url: "https://www.leader.ir/en/book/32/1?sn=5248"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 197",
          url: "https://www.leader.ir/ur/book/106/1?sn=11379"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghusleventduring",
    topicId: "ghusl",
    subject: {
      en: "Something invalidating wuḍūʾ during ghusl"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If while one is performing ghusl he has a minor occurrence (al‑ḥadath al‑aṣghar) – for example, he urinates – it is not necessary for him to stop performing the ghusl and start another ghusl [all over again]; rather, he can complete his ghusl but based on obligatory precaution, he will require wuḍūʾ [for performing acts that require wuḍūʾ]. However, if [one has a minor occurrence while performing a sequential ghusl and] he changes from performing a sequential ghusl to an immersive one, or [if one has a minor occurrence while performing an immersive ghusl and he changes from performing] an immersive ghusl to a sequential one, then it is not necessary for him also to perform wuḍūʾ.",
          ur: "اگرغسل کے دوران کسی شخص سے حدث اصغرسرزدہوجائے،مثلاً پیشاب کردے تواس غسل کوترک کرکے نئے سرے سے غسل کرناضروری نہیں ہے بلکہ وہ اپنے اس غسل کومکمل کرسکتاہے اس صورت میں ( احتیاط لازم کی بناپر)وضوکرنابھی ضروری ہے۔لیکن اگروہ شخص غسل ترتیبی سے غسل ارتماسی کی طرف یا غسل ارتماسی سے غسل ترتیبی کی طرف پلٹ جائے تو وضو کرنا ضروری نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 384",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (384)",
          url: "https://www.sistani.org/urdu/book/61/3631/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "During ghusl of janābah a wuḍū’ invalidator occurred. Is it obligatory to repeat ghusl or to finish it and to do wuḍū’?",
          ur: "اگر غسل جنابت کے درمیان حدث اصغر صادر ہوجائے تو کیا اس پر از سر نو غسل واجب ہے یا غسل مکمل کرنے کے بعد وہ وضو کرے گا؟"
        },
        text: {
          en: "It is not obligatory to repeat the ghusl and it does not affect the correctness of the ghusl. Rather, one should complete his ghusl. However, it does not remove the necessity of doing wuḍū’ for prayers and other acts that require wuḍū’.",
          ur: "از سر نو غسل کرنا واجب نہیں ہے اور حدث اصغر کا غسل کی صحت پرکوئی اثر نہیں پڑتا لیکن یہ غسل اس کی نماز اور ان اعمال کے لئے وضو سے کافی نہیں ہے جن میں حدث اصغر سے طہارت شرط ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 184",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 185",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslseveral",
    topicId: "ghusl",
    subject: {
      en: "Several obligatory ghusls at once"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who must perform a number of obligatory ghusls can perform one ghusl with the intention of all of them. Similarly, if he makes the intention of one of the ghusls, it is sufficient for the others [and he does not have to make separate intentions]."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 387",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "When there are several mustaḥabb or obligatory ghusls to be performed, is performing one sufficient for all the rest?",
          ur: "جس کے ذمے کئی مستحب یا واجب غسل ہوں تو کیا ایک ہی غسل بقیہ کے لئے کافی ہوگا؟"
        },
        text: {
          en: "If one performs one ghusl with the intention of performing all of them, it is sufficient. However, if one of them is ghusl of janābah and the intention is made to perform it, it suffices for all other ghusls, although caution is to make the intention for all of them.",
          ur: "اگرسب کی نیت سے ایک غسل بجالائے تو وہ سب کیلئے کافی ہے۔ اور اگر ان میں غسل جنابت بھی ہو اور اسی کا قصد کیا جائے تو وہ بقیہ غسلوں کیلئے کافی ہوگا، اگر چہ احتیاط یہ ہے کہ ان سب کی نیت کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 186",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 187",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslreplaceswudu",
    topicId: "ghusl",
    subject: {
      en: "Ghusl for janābah and wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Someone who has performed the ghusl for janābah must not perform wuḍūʾ for prayers. He can perform prayers without performing wuḍūʾ after other obligatory ghusls as well, except the ghusl for medium istiḥāḍah. Furthermore, [he can perform prayers without performing wuḍūʾ] with recommended ghusls – which will be discussed in Ruling 633 – although the recommended precaution is that [if he has performed a recommended ghusl], he should also perform wuḍūʾ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 389",
          url: "https://www.sistani.org/english/book/48/2168/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Do the ghusls other than ghusl of janābah relieve one of making wuḍū’?",
          ur: "غسل جنابت کے علاوہ کیا دیگرغسل بھی وضو سے کفایت کرتے ہیں؟"
        },
        text: {
          en: "They do not replace wuḍū’.",
          ur: "کفایت نہیں کرتے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 187",
          url: "https://www.leader.ir/en/book/32/1?sn=5247"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 188",
          url: "https://www.leader.ir/ur/book/106/1?sn=11378"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "ghuslmassmayyit",
    topicId: "ghusl",
    subject: {
      en: "Ghusl for touching a corpse (mass al-mayyit)"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone touches – i.e. makes part of his body come into contact with – the body of a dead person after it has become cold but before it has been given ghusl, he must perform the ghusl for touching a corpse, irrespective of whether he touches it while he is asleep or awake, voluntarily or involuntarily. Even if one’s nail or bone touches a nail or bone of the corpse, he must perform this ghusl. However, if one touches a dead animal, performing ghusl is not obligatory for him.",
          ur: "اگرکوئی شخص کسی ایسے مردہ انسان کے بدن کوچھوئے جو ٹھنڈاہو چکا ہو اورجسے غسل نہ دیا گیاہویعنی اپنے بدن کاکوئی حصہ اس سے مس کرے تواسے چاہئے کہ غسل مس میت کرے خواہ اس نے نیندکی حالت میں مردے کابدن چھواہویابیداری کے عالم میں اورخواہ ارادی طورپرچھواہویاغیرارادی طورپر حتیٰ اگراس کاناخن یاہڈی مردے کے ناخن یاہڈی سے چھوجائے تب بھی اسے چاہئے کہ غسل کرے لیکن اگر مردہ حیوان کوچھوئے تواس پرغسل واجب نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 510",
          url: "https://www.sistani.org/english/book/48/2182/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (510)",
          url: "https://www.sistani.org/urdu/book/61/3633/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "istihadablood",
    topicId: "haydistihadanifas",
    subject: {
      en: "Signs of istiḥāḍah blood"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Most of the time, the blood of istiḥāḍah is yellow in colour, cold, comes out without pressure or a burning sensation, and is not thick. However, it is possible, sometimes, for it to be black or red, warm, thick, and to come out with pressure and a burning sensation.",
          ur: "خون استحاضہ زیادہ ترزرد رنگ کااورٹھنڈاہوتاہے اور فشار اور جلن کے بغیر خارج ہوتاہے اورگاڑھابھی نہیں ہوتالیکن ممکن ہے کہ کبھی سیاہ یاسرخ اورگرم اور گاڑھاہواورفشار اور سوزش کے ساتھ خارج ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 390",
          url: "https://www.sistani.org/english/book/48/2169/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (390)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "istihadatypes",
    topicId: "haydistihadanifas",
    subject: {
      en: "The three types of istiḥāḍah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are three types of istiḥāḍah: slight (qalīlah), medium (mutawassiṭah), and excessive (kathīrah).\nSlight istiḥāḍah is when the blood only stains a piece of cotton [or the top layer of a sanitary pad/another absorbent item] and does not seep into it.\nMedium istiḥāḍah is when the blood seeps into a piece of cotton [or top layer of a sanitary pad/another absorbent item] that a woman would normally use to absorb the discharge of blood – albeit into only one side of it – but it does not reach the bottom of it.\nExcessive istiḥāḍah is when the blood soaks a piece of cotton [or sanitary pad/another absorbent item] and reaches the bottom of it.",
          ur: "استحاضہ تین قسم کاہوتاہے: قلیلہ، متوسطہ اور کثیرہ۔\nاستحاضۂ قلیلہ: یہ ہے کہ خون صرف اس روئی کے اوپروالے حصہ کوآلودہ کرے جو عورت اپنی شرم گاہ میں رکھے اوراس روئی کے اندرتک سرایت نہ کرے۔\nاستحاضۂ متوسطہ: یہ ہے کہ خون روئی کے اندرتک چلاجائے اگرچہ اس کے ایک کونے تک ہی ہو، لیکن روئی سے اس کپڑے تک نہ پہنچے جو عورتیں عموماً خون روکنے کے لئے باندھتی ہیں ۔\nاستحاضۂ کثیرہ: یہ ہے کہ خون روئی سے تجاوز کرکے کپڑے تک پہنچ جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 391",
          url: "https://www.sistani.org/english/book/48/2169/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (391)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "istihadaslight",
    topicId: "haydistihadanifas",
    subject: {
      en: "Slight istiḥāḍah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "For slight istiḥāḍah, a woman must perform one wuḍūʾ for every prayer and she must wash the outside of the vagina with water if there is blood there. And based on recommended precaution, she should purify the piece of cotton [or sanitary pad/another absorbent item] with water or change it for every prayer.",
          ur: "استحاضۂ قلیلہ میں ہرنماز کے لئے علیٰحدہ وضوکرناضروری ہے اور( احتیاط مستحب کی بناپر)روئی کودھولے یااسے تبدیل کردے اور اگرشرم گاہ کے ظاہری حصے پر خون ہوتواسے بھی دھوناضروری ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 392",
          url: "https://www.sistani.org/english/book/48/2170/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (392)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      }
    ],
    sensitive: true
  },
  {
    id: "istihadamedium",
    topicId: "haydistihadanifas",
    subject: {
      en: "Medium istiḥāḍah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "For medium istiḥāḍah, a woman must, based on obligatory precaution, perform one ghusl daily for her prayers, and she must do the things that were mentioned in the previous ruling with regard to slight istiḥāḍah. Therefore, if she experiences medium istiḥāḍah before or during morning (ṣubḥ) prayers, she must perform ghusl for ṣubḥ prayers based on obligatory precaution. If she intentionally or forgetfully does not perform ghusl for ṣubḥ prayers, she must perform ghusl for midday (ẓuhr) and afternoon (ʿaṣr) prayers. And if she does not perform ghusl for ẓuhr and ʿaṣr prayers, she must perform ghusl before prayers after sunset (maghrib) and evening (ʿishāʾ) prayers, whether the bleeding has stopped or not.",
          ur: "استحاضۂ متوسطہ میں ( احتیاط لازم کی بناپر)ضروری ہے کہ عورت اپنی نمازوں کے لئے روزانہ ایک غسل کرے اوریہ بھی ضروری ہے استحاضۂ قلیلہ کے وہ افعال سرانجام دے جوسابقہ مسئلہ میں بیان ہوچکے ہیں چنانچہ اگرصبح کی نماز سے پہلے یا نماز کے دوران عورت کواستحاضہ آجائے تو صبح کی نماز کے لئے غسل کرناضروری ہے۔ اگر جان بوجھ کریابھول کرصبح کی نماز کے لئے غسل نہ کرے توظہراورعصر کی نماز کے لئے غسل کرناضروری ہے اوراگرنماز ظہراورعصرکے لئے غسل نہ کرے تونماز مغرب وعشاء سے پہلے غسل کرناضروری ہے خواہ خون آرہاہویابندہوچکاہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 393*",
          url: "https://www.sistani.org/english/book/48/2170/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (393)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A",
        note: "Marked * (revised) in the 4th edition. The Urdu text was compared and matches in substance. Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ],
    sensitive: true
  },
  {
    id: "istihadaexcessive",
    topicId: "haydistihadanifas",
    subject: {
      en: "Excessive istiḥāḍah"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "For excessive istiḥāḍah, a woman must, based on obligatory precaution, change or purify with water the piece of cotton [or sanitary pad/another absorbent item]. It is also necessary for her to perform one ghusl for ṣubḥ prayers, one for ẓuhr and ʿaṣr prayers, and one for maghrib and ʿishāʾ prayers. Furthermore, she must not delay between ẓuhr and ʿaṣr prayers nor between maghrib and ʿishāʾ prayers; if she delays between them, she must perform ghusl again for ʿaṣr and ʿishāʾ prayers.\nAll of this applies when blood continuously soaks the piece of cotton [or sanitary pad/another absorbent item] and reaches the bottom of it. However, in the event that there is a delay in the blood soaking the piece of cotton [or sanitary pad/another absorbent item] and reaching the bottom of it to the extent that the woman can perform one or more prayers in that time, the obligatory precaution is that whenever the blood soaks the piece of cotton [or sanitary pad/another absorbent item] and reaches the bottom of it, she must change or purify it with water and perform ghusl. Therefore, if a woman performs ghusl and, for example, she performs ẓuhr prayers but before ʿaṣr prayers or during ʿaṣr prayers blood soaks the piece of cotton [or sanitary pad/another absorbent item] and reaches the bottom of it, then again, she must perform ghusl for ʿaṣr prayers based on obligatory precaution. However, in the event that the delay is to the extent that in that time, the woman can perform two or more prayers – for example, she can perform maghrib and ʿishāʾ prayers before blood reaches the bottom of it again – then for those prayers [i.e. maghrib and ʿishāʾ], it is not necessary for her to perform another ghusl. In each case, for excessive istiḥāḍah, ghusl suffices in place of wuḍūʾ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 394*",
          url: "https://www.sistani.org/english/book/48/2170/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ],
    sensitive: true
  },
  {
    id: "haydblood",
    topicId: "haydistihadanifas",
    subject: {
      en: "Signs of ḥayḍ blood"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Most of the time, the blood of ḥayḍ is thick and warm, its colour is black or red, and it comes out with a little pressure and a burning sensation.",
          ur: "حیض کاخون عموماً گاڑھااورگرم ہوتاہے اوراس کارنگ سیاہ یاسرخ ہوتا ہے۔ وہ اچھل کراورتھوڑی سی جلن کے ساتھ خارج ہوتاہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 432",
          url: "https://www.sistani.org/english/book/48/2171/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (432)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydduration",
    topicId: "haydistihadanifas",
    subject: {
      en: "Minimum and maximum duration of ḥayḍ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Ḥayḍ cannot last for less than three days or more than ten days; if bleeding lasts for even a little less than three days, it is not ḥayḍ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 438",
          url: "https://www.sistani.org/english/book/48/2171/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "A woman who has had regular monthly periods of seven days, for example, has a discharge for twelve days as a result of using a contraceptive device. Is the discharge after the seventh day to be considered menstruation, or is it istiḥāḍah?",
          ur: "ایک عورت کی ماہانہ عادت معین تھی جیسے ایک ہفتہ لیکن پھر اسے مانع حمل چھلہ (loop) رکھوانے کے سبب ہر ماہ ١٢ روز خون آنے لگا تو کیا یہ سات روز سے زیادہ آنے والا خون حیض ہو گا یا استحاضہ؟"
        },
        text: {
          en: "If the bleeding does not stop after the tenth day, the blood on the days of the regular monthly period is ruled as menses, and the remaining days of bleeding as istiḥāḍah.",
          ur: "اگر دس دن تک خون بند نہ ہو تو اس کی عادت کے ایام حیض شمار ہوں گے اور باقی استحاضہ۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 220",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 221",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydunlawful",
    topicId: "haydistihadanifas",
    subject: {
      en: "Things unlawful for a ḥāʾiḍ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Certain things are unlawful for a ḥāʾiḍ:\n1. to perform those ritual acts of worship that must be performed with wuḍūʾ, ghusl, or tayammum – such as prayers – if she does so with the intention of performing a valid act. However, there is no problem if she performs ritual acts of worship for which wuḍūʾ, ghusl, or tayammum is not necessary, such as ṣalāt al‑mayyit;\n2. all the things that are unlawful for a junub, as mentioned in the rules of janābah;\n3. vaginal intercourse, which is unlawful for both the man and the woman even if the penis penetrates only to the point of circumcision and the man does not ejaculate. In fact, the obligatory precaution is that the penis must not penetrate even less than the point of circumcision. This law does not apply to anal intercourse; however, based on obligatory precaution, anal intercourse with a woman without her consent – whether she is ḥāʾiḍ or not – is not permitted."
        },
        hukm: "haram",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 448",
          url: "https://www.sistani.org/english/book/48/2172/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is it permissible for a menstruating woman or for a woman in ‘puerperium’ to enter the shrines of the Imams’ descendants (a.)?",
          ur: "کیا حیض یا نفاس والی عورت، ائمہ (علیہم السلام)کی اولاد کے مقبروں میں داخل ہو سکتی ہے؟"
        },
        text: {
          en: "It is permissible.",
          ur: "ہوسکتی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 221",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 222",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydghusl",
    topicId: "haydistihadanifas",
    subject: {
      en: "Ghusl after ḥayḍ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "After a woman’s ḥayḍ has stopped, it is obligatory for her to perform ghusl for prayers and for other ritual acts of worship that must be performed with wuḍūʾ, ghusl, or tayammum. The ghusl for ḥayḍ is performed in the same way as the ghusl for janābah, and the ghusl for ḥayḍ suffices in place of wuḍūʾ, although it is recommended to also perform wuḍūʾ before performing ghusl.",
          ur: "عورت کے حیض سے پاک ہوجانے کے بعداس پرواجب ہے کہ نماز اوردوسری عبادات کے لئے جووضو، غسل یاتیمم کرکے بجالانا چاہئے غسل کرے اور اس کا طریقہ غسل جنابت کی طرح ہے اوروضو سے کفایت کرے گا اور بہتر یہ ہے کہ غسل سے پہلے وضو بھی کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 456",
          url: "https://www.sistani.org/english/book/48/2172/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (456)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydprayers",
    topicId: "haydistihadanifas",
    subject: {
      en: "Prayers missed during ḥayḍ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "A woman does not have to make up those prayers that she did not perform while she was in the state of ḥayḍ; however, she does have to make up those fasts of the month of Ramadan that she did not keep while she was in the state of ḥayḍ. Similarly, based on obligatory precaution, she must make up any fasts that were obligatory for her at a particular time on account of a vow and which she did not keep while she was in the state of ḥayḍ.",
          ur: "جونمازیں عورت نے حیض کی حالت میں نہ پڑھی ہوں ان کی قضا نہیں لیکن رمضان کے وہ روزے جو حیض کی حالت میں نہ رکھے ہوں ضروری ہے کہ ان کی قضا کرے اوراسی طرح (احتیاط لازم کی بناپر) جوروزے منت کی وجہ سے معین دنوں میں واجب ہوئے ہوں اوراس نے حیض کی حالت میں وہ روزے نہ رکھے ہوں تو ضروری ہے کہ ان کی قضاکرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 459",
          url: "https://www.sistani.org/english/book/48/2172/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (459)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ],
    sensitive: true
  },
  {
    id: "haydfast",
    topicId: "haydistihadanifas",
    subject: {
      en: "Ḥayḍ during an obligatory fast"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the duty of a woman whose menses start while she is observing a fast to fulfill a nadhr of fasting on the very day?",
          ur: "جس عورت نے کسی معین دن کے روزے کی نذر کی ہو پھر اس دن اسے روزہ کی حالت میں حیض آ جائے تو اس کا فریضہ کیاہے؟"
        },
        text: {
          en: "Her fast is nullified by the start of menses, even if they cover only a part of the day of the fast, and it is obligatory for her to make the fast up after being cleansed.",
          ur: "حیض آنے سے اس کا روزہ باطل ہو جائے گا چاہے وہ دن کے کسی ایک حصے میں آئے اور پاک ہونے کے بعد اس پر روزہ کی قضا واجب ہے؟"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 216",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 217",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydpostponing",
    topicId: "haydistihadanifas",
    subject: {
      en: "Postponing ḥayḍ with medication"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the rule concerning postponement of menses by using medicines for the purpose of fasting the month of Ramadan?",
          ur: "روزے رکھنے کے لئے دوا کے ذریعہ ماہانہ عادت کو بند کرنے کا کیا حکم ہے؟"
        },
        text: {
          en: "There is no objection to it.",
          ur: "اس میں کوئی حرج نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 218",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 219",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydpregnancy",
    topicId: "haydistihadanifas",
    subject: {
      en: "Bleeding during pregnancy"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is possible for a pregnant woman and a breastfeeding woman to menstruate. The ruling of a pregnant woman and a non-pregnant woman is the same except that if a pregnant woman who has a habit of time experiences bleeding with the attributes of ḥayḍ after the passing of twenty days from the first day of her habit, it is necessary for her, based on obligatory precaution, to do the things that a mustaḥāḍah must do and refrain from doing the things that are unlawful for a ḥāʾiḍ to do."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 435",
          url: "https://www.sistani.org/english/book/48/2171/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "If slight bleeding occurs during pregnancy, though it does not result in miscarriage, is it obligatory for a woman to perform the ghusl? What is her duty?",
          ur: "اگر حمل کے دوران عورت کو تھوڑا سا خون آ جائے لیکن اس کا حمل ساقط نہ ہو تو کیا اس پر غسل واجب ہے یا نہیں؟ اور اس کی ذمہ داری کیا ہے؟"
        },
        text: {
          en: "Any blood discharged during pregnancy and either possesses the properties and conditions of menstruation or it happens at the time of her usual period is considered as menses provided that it continues — even it is only internal bleeding — for three days. Otherwise it is ruled to be istiḥāḍah.",
          ur: "اثناء حمل میں عورت جو خون دیکھتی ہے اگر اس میں حیض کی صفات اور شرائط ہیں یا وہ حیض کی عادت کے زمانے میں آئے او رتین دن تک چلتارہے اگر چہ اندرہی رہے تو وہ حیض ہے ورنہ استحاضہ ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 219",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 220",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydcategories",
    topicId: "haydistihadanifas",
    subject: {
      en: "The six categories of women in ḥayḍ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "There are six categories of women in menstruation:\n1. a woman with a habit of time and duration: this is a woman who on two consecutive months starts her period at a fixed time, and the number of days on which she has her period is the same in each of the two months. For example, in two consecutive months she experiences bleeding from the first of the month until the seventh;\n2. a woman with a habit of time: this is a woman who on two consecutive months starts her period at a fixed time but the number of days on which she has her period is not the same in each of the two months. For example, in two consecutive months she experiences bleeding on the first of the month, but in the first month her bleeding stops on the seventh day and in the second month it stops on the eighth day;\n3. a woman with a habit of duration: this is a woman who has her period for the same number of days on two consecutive months but the time when her bleeding starts in each of the two months is not the same. For example, in the first month she experiences bleeding from the fifth to the tenth of the month and in the second month from the twelfth to the seventeenth;\n4. a woman with a disordered habit (muḍṭaribah): this is a woman who, for several months, experiences a period but does not have a fixed habit with regard to this [neither of time nor duration], or her habit has been disturbed and she has not yet formed a new habit;\n5. a menarcheal woman (mubtadiʾah): this is a woman who experiences bleeding for the first time;\n6. a forgetful woman (nāsiyah): this is a woman who has forgotten the habit of her period.\nSpecific rules apply to each of these categories, which will be discussed in the following rulings."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 468",
          url: "https://www.sistani.org/english/book/48/2173/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ],
    sensitive: true
  },
  {
    id: "haydspotting",
    topicId: "haydistihadanifas",
    subject: {
      en: "Spotting after becoming clean"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the rule pertaining to spotting seen by a woman after she is convinced that she has become cleansed, and is certain that the spot neither possesses the properties of blood nor that of blood mixed with water?",
          ur: "اس رنگ یا دھبے کا کیا حکم ہے جو عورت اپنی پاکی کے یقین کے بعد دیکھتی ہے جبکہ یہ معلوم ہے کہ نہ اس میں خون کی علامات ہیں اور نہ ہی پانی ملے خون کی؟"
        },
        text: {
          en: "If it is not blood, it does not fall under the category of menstruation. But if it is blood, even in the form of yellow spotting, and does not exceed ten days – by one day, it is meant a day, as perceived by common view, i.e. from sunrise to sunset - of the period, all these sorts of spotting are considered menses. Determining the nature of the liquid rests with the woman.",
          ur: "اگر وہ خون نہیں ہے تو اس پر حیض کا حکم نہیں لگے گا لیکن اگر خون ہے اور اس نے دس دن سے تجاوز نہیں کیا تو وہ حیض کا حکم رکھتا ہے اگر چہ وہ زرد رنگ کے داغ کی صورت میں ہی ہو اور موضوع کو تشخیص دینا عورت کا کام ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 217",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 218",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "haydcontraceptive",
    topicId: "haydistihadanifas",
    subject: {
      en: "Spotting with contraceptive pills"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "One of the methods of preventing unwanted births is the use of contraceptive pills, and women who take these pills get blood spots during and outside their menstrual time. What is the rule applicable to these spots?",
          ur: "ناخواستہ بچوں کی ولادت سے اجتناب کے لئے مانع حمل طریقوں میں سے ایک طریقہ، دواؤں کا استعمال ہے، اور جو عورتیں ان دواؤں کو استعمال کرتی ہیں وہ ماہانہ عادت کے ایام اور ان کے علاوہ دوسرے دنوں میں بھی خون کے داغ دھبے دیکھتی ہیں ان کا کیا حکم ہے؟"
        },
        text: {
          en: "If these spots do not possess the criteria mentioned in Islamic law for menstruation, they are not considered menses. Rather the rules of istiḥāḍah apply to them.",
          ur: "اگر ان داغ دھبوں میں شریعت میں بیان کردہ حیض کی شرطیں نہیں پائی جاتیں تو وہ حیض کے حکم میں نہیں ہیں، بلکہ ان پر استحاضہ کا حکم لگایا جائے گا۔\n. دن کے تعیین میں ملاک عرف ہےکہ جو سورج کے طلوع ہونے سے  غروب تک ہوگا."
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 224",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 225",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "nifasdefinition",
    topicId: "haydistihadanifas",
    subject: {
      en: "What nifās is"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "From the time the first part of a baby’s body comes out of its mother’s womb, the bleeding that a woman experiences for ten days is the bleeding of nifās, on condition that it can be called ‘the bleeding of childbirth’. A woman in the state of nifās is called a ‘nufasāʾ’."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 497",
          url: "https://www.sistani.org/english/book/48/2181/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Is a woman who has undergone abortion curettage categorized as having ‘puerperium’ or not?",
          ur: "جو عورت حمل ضائع کراتی ہے کیا وہ نفاس کی حالت میں ہے یا نہیں؟"
        },
        text: {
          en: "The discharge of blood after miscarriage, even when the fetus is just a clot-like structure, is ruled to be ‘puerperium’.",
          ur: "بچہ ساقط ہونے کے بعد، خواہ وہ لوتھڑا ہی ہو، اگر عورت خون دیکھتی ہے تو اس پر نفاس کا حکم جاری ہوگا۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 222",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 223",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "nifasduration",
    topicId: "haydistihadanifas",
    subject: {
      en: "Duration of nifās"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "It is possible that the blood of nifās lasts no longer than a moment; however, it is not considered to be nifās if the blood continues for more than ten days.",
          ur: "یہ ہوسکتاہے کہ خون نفاس ایک لحظہ سے زیادہ نہ آئے، اور دس دن سے زیادہ نہیں آتا۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 500",
          url: "https://www.sistani.org/english/book/48/2181/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (500)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "nifasrulings",
    topicId: "haydistihadanifas",
    subject: {
      en: "Rulings that apply in nifās"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The things that are obligatory for a ḥāʾiḍ are also obligatory for a nufasāʾ. And based on obligatory precaution, the following are unlawful for a nufasāʾ: entering a mosque (however, merely passing through a mosque is permitted), staying in a mosque, passing through the ‘Two Mosques’ (i.e. Masjid al-Ḥarām and the Mosque of the Prophet (Ṣ)), reciting the verses that have obligatory sajdah, and touching the writing of the Qur’an and the name of Allah the Exalted."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 502",
          url: "https://www.sistani.org/english/book/48/2181/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      }
    ],
    sensitive: true
  },
  {
    id: "menopause",
    topicId: "haydistihadanifas",
    subject: {
      en: "Bleeding after menopause"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The bleeding that women above the age of sixty experience is not ruled to be ḥayḍ; however, a woman can experience ḥayḍ between the age of fifty and sixty, although the recommended precaution is that women who are not Qurayshi (sayyidah) and who experience bleeding which would previously have been ruled to be ḥayḍ [i.e. had they experienced it before the age of fifty, it would have been ruled to be ḥayḍ], should refrain from doing the things that are unlawful for a ḥāʾiḍ to do and perform the duties of a mustaḥāḍah.",
          ur: "وہ خون جوعورتوں کوساٹھ برس پورے کرنے کے بعدآتاہے حیض کا حکم نہیں رکھتا۔ لیکن احتیاط مستحب یہ ہے کہ وہ عورتیں جو غیر قریشی (غیر سیدہ) ہیں وہ پچاس سے ساٹھ سال عمر کے دوران خون اس طرح دیکھیں کہ اگر وہ پچاس سال سے پہلے خون دیکھتیں تو وہ خون یقیناً حیض کا حکم رکھتا تو وہ مستحاضہ والے افعال بجالائیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 433",
          url: "https://www.sistani.org/english/book/48/2171/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (433)",
          url: "https://www.sistani.org/urdu/book/61/3632/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "To which category does the blood discharged after ‘menopause’ belong? What is the shar‘ī duty of such a woman?",
          ur: "اس خون کا کیا حکم ہے جسے عورت یائسہ ہونے کے بعد دیکھتی ہے؟ اور اس کا شرعی فریضہ کیا ہے؟"
        },
        text: {
          en: "It is ruled as istiḥāḍah.",
          ur: "استحاضہ کے حکم میں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 223",
          url: "https://www.leader.ir/en/book/32/1?sn=5250"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 224",
          url: "https://www.leader.ir/ur/book/106/1?sn=11381"
        },
        verification: "A"
      }
    ],
    sensitive: true
  },
  {
    id: "tayammumnoaccess",
    topicId: "tayammum",
    subject: {
      en: "No access to water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person does not have access to water on account of old age, weakness, fear of a thief or an animal and suchlike, or on account of not having the means to draw water out from a well, he must perform tayammum.",
          ur: "اگرکوئی شخص بڑھاپے یاکمزوری کی وجہ سے یاچورڈاکواورجانور وغیرہ کے خوف سے یا کنویں سے پانی نکالنے کے وسائل میسرنہ ہونے کی وجہ سے پانی حاصل نہ کرسکے تواسے چاہئے کہ تیمم کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 653",
          url: "https://www.sistani.org/english/book/48/2197/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (653)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumharm",
    topicId: "tayammum",
    subject: {
      en: "When using water is harmful"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If using water would result in a person dying, or it would make him ill, inflict him with some defect, prolong an illness he has, or make his illness worse or difficult to treat, then in all these cases, he must perform tayammum. However, if one can reduce the harm of using water – for example, by heating it – he must do so and thereby perform wuḍūʾ or ghusl as required.",
          ur: "اگرکسی شخص کوپانی استعمال کرنے سے اپنی جان جانے یا بدن میں کوئی عیب یامرض پیداہونے یاموجودہ مرض کے طولانی یاشدیدہوجانے یاعلاج شرم گاہمیں دشواری پیداہونے کاخوف ہوتواسے چاہئے کہ تیمم کرے۔ لیکن اگرپانی کے ضرر کوکسی طریقے سے دورکرسکتاہو، مثلاً یہ کہ پانی کوگرم کرنے سے ضرردور ہوسکتا ہوتو پانی گرم کرکے وضو کرے اورجن مقامات میں غسل کرناضروری ہوتوغسل کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 658",
          url: "https://www.sistani.org/english/book/48/2198/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (658)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "I am suffering from a skin disease i.e. the skin dries up whenever I take a bath or even wash my hands or face. Accordingly, I am forced to apply oil to my skin and that creates difficulty when doing wuḍū’, especially when doing it for the morning prayer. Is it permissible for me to do tayammum instead of wuḍū’, for morning prayers?",
          ur: "میں جلد کی ایسی بیماری میں مبتلا ہوں کہ جب بھی نہاتا ہوں تو میری کھال خشک ہونے لگتی ہے بلکہ اگر صرف چہرے اور ہاتھوں کو دھوتا ہوں تو بھی ایسا ہوتا ہے، اس لئے اپنی جلد پر تیل ملنے پر مجبورہوں، لہذا مجھے وضو کرنے میں بہت زحمت ہوتی ہے اور صبح کی نماز کے لئے وضو کرنا میرے لئے بہت دشوار ہے تو کیا میں صبح کی نماز کے لئے وضو کے بدلے تیمم کر سکتا ہوں؟"
        },
        text: {
          en: "If using water is harmful for you, it is incorrect to do wuḍū’, and you should do tayammum instead. But if doing wuḍū’ is not harmful and the mentioned oil does not prevent water from reaching the skin of the body parts involved in wuḍū’, you should perform wuḍū’. Also, if the oil acts as a barrier between water and skin and you can clean the oil, do wuḍū’, and apply the oil again, tayammum will not be accepted from you.",
          ur: "اگر آپ کے لئے پانی کا استعمال مضر ہے تو وضو صحیح نہیں ہے اور اس کے بدلے تیمم کریں اور اگر مضر نہیں ہے اور یہ تیل پانی کے اعضاء وضو تک پہنچنے سے مانع نہ ہو تو وضو ضروری ہے اور اگر مانع ہو لیکن یہ ممکن ہو کہ تیل صاف کرکے وضو کرلیا جائے اور پھر تیل مل لیا جائے تو بھی تیمم کی نوبت نہیں آئیگی۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 212",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 213",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumhardship",
    topicId: "tayammum",
    subject: {
      en: "Hardship in using water"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If procuring water or using it causes someone hardship or excessive difficulty that cannot normally be endured, he can perform tayammum. However, if he endures it and performs wuḍūʾ or ghusl, his wuḍūʾ or ghusl is valid."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 662",
          url: "https://www.sistani.org/english/book/48/2199/"
        },
        verification: "A",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "We live in a cold area where there is no bathroom or any place for bathing. At times we wake up in a state of janābah before the morning adhān during the blessed month of Ramadan. As it is shameful for youths to get up at midnight before the eyes of the people and to take a bath with the water of a water-skin or a pool, and water is also cold at that time, what is our duty concerning fasting on the next day in such a condition? Is tayammum permissible? And what is the rule if one were not to fast for not having performed the ghusl?",
          ur: "ہم ایسے سرد علاقے میں رہتے ہیں جہاں حمام نہیں ہے اور نہ ہی کوئی ایسی جگہ ہے جہاں غسل کر سکیں اور رمضان کے مہینے میں اذان سے پہلے حالت جنابت میں بیدار ہوں تو چونکہ جوانوں کا نصف شب میں لوگوں کے سامنے مشک یا ٹینکی کے پانی سے غسل کرنا معیوب ہے، اس کے علاوہ اس وقت پانی بھی ٹھنڈا ہوتا ہے، اس حالت میں اگلے دن کے روزہ کا کیا حکم ہے؟ کیا تیمم جائز ہے اور غسل نہ کرنے کی صورت میں روزہ نہ رکھنے کا کیا حکم ہے؟"
        },
        text: {
          en: "Sole difficulty of an act or that one is embarrassed to do it in front of people’s eyes is not a shar‘ī excuse. Rather, one is obliged to take ghusl in any manner that he can, as long as it does not involve hardship on the mukallaf or harm. In case it is harmful or unbearably difficult, he can perform tayammum instead. If he does tayammum instead of ghusl before the fajr adhān, his fast is valid, and if he does not do tayammum, his fast would be invalid; but it is obligatory for him anyway to refrain from eating and drinking throughout the day.",
          ur: "صرف مشقت یا لوگوں کی نظروں میں کسی کام کا معیوب ہونا شرعی طور پر عذر نہیں بن سکتا، بلکہ جب تک انسان کے لئے ضرر یا حرج نہ ہو اس وقت تک جس طرح بھی ممکن ہو اس پر غسل کرنا واجب ہے اور حرج یا ضرر کی صورت میں تیمم کرنا واجب ہے، پس اگر وہ فجر سے پہلے تیمم کر لیتا ہے تواس کا روزہ صحیح ہے اور اگر تیمم ترک کر دے تو اس کا روزہ باطل ہے، لیکن اس پر واجب ہے کہ تمام دن روزے کو باطل کرنے والے کاموں سے اجتنا ب کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 214",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 215",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumshorttime",
    topicId: "tayammum",
    subject: {
      en: "Shortage of time"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Whenever the time remaining [to perform prayers within their prescribed time] is so little that if one were to perform wuḍūʾ or ghusl he would have to perform the entire prayer or part of it after its time, he must perform tayammum.",
          ur: "جب وقت اتناتنگ ہوکہ اگرایک شخص وضویاغسل کرے توساری نماز یا اس کاکچھ حصہ وقت کے بعدپڑھاجاسکے توضروری ہے کہ تیمم کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 667",
          url: "https://www.sistani.org/english/book/48/2202/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (667)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "A person prays with tayammum due to shortness of time, and after completing the prayer he comes to know that there was enough time to do wuḍū’. What is the rule concerning his prayer?",
          ur: "ایک شخص وقت کم ہونے کی بنا پر تیمم سے نماز پڑھ لیتا ہے اور فارغ ہونے کے بعد اس پر یہ بات آشکار ہوتی ہے کہ وضو کرنے کا وقت تھا، اس کی نماز کا کیا حکم ہے؟"
        },
        text: {
          en: "It is obligatory for him to repeat that prayer.",
          ur: "اس پر اس نماز کا اعادہ واجب ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 213",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 214",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumsurfaces",
    topicId: "tayammum",
    subject: {
      en: "What tayammum may be performed on"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Performing tayammum with soil, pebbles, a clod of earth, and stone is valid. However, the recommended precaution is that if it is possible to perform tayammum with soil, one should not perform it with any other thing; and if soil is not available, [the recommended precaution is to perform tayammum] with fine sand that is very soft, such that it can be called ‘soil’; and if that is not possible, with a clod of earth; and if that is not possible, with pebbles; and in the event that pebbles and a clod of earth are not available, one must perform tayammum with a stone.",
          ur: "مٹی، ریت، ڈھیلے اورپتھرپرتیمم کرناصحیح ہے لیکن احتیاط مستحب یہ ہے کہ اگرمٹی میسرہوتوکسی دوسری چیزپرتیمم نہ کیاجائے اوراگرمٹی نہ ہوتو بہت نرم ریت کہ جسے مٹی کہا جائے یاڈھیلے پر اور ڈھیلا بھی نہ ہوتوپھرروڑی یاپتھرپرتیمم کیاجائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 673",
          url: "https://www.sistani.org/english/book/48/2203/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (673)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "What is the ruling of doing tayammum on gypsum, limestone, their baked pieces and bricks?",
          ur: "پکے ہوئے چونے ،پکی ہوئی آہک، انکے پتھروں اور اینٹ پر تیمم کرنے کا کیا حکم ہے ؟"
        },
        text: {
          en: "Tayammum is correct on anything that is considered to be from the earth, such as gypsum and limestone. It is not unlikely that tayammum on plaster, lime, bricks and the like are also valid.",
          ur: "ہر وہ چیز جسے زمین سے شمار کیا جائے جیسے چونے اور آہک کے پتھر ان پر تیمم کرنا صحیح ہے اور بعید نہیں ہے کہ پکے ہوئے چونے، پکی ہوئی آہک اور اینٹ وغیرہ پر بھی تیمم صحیح ہو۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 209",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 210",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumgypsum",
    topicId: "tayammum",
    subject: {
      en: "Gypsum and limestone"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Tayammum performed with gypsum or limestone is valid. Similarly, tayammum performed with dust that gathers on carpets, clothing, and similar things is also valid provided that its quantity is such that it can commonly be considered to be very fine soil, although the recommended precaution is that if alternatives are available, one should not perform tayammum with dust. Similarly, based on recommended precaution, if alternatives are available, one should not perform tayammum with gypsum and limestone that have been baked, nor with brick that has been baked, nor with mineral stones such as agate (ʿaqīq).",
          ur: "جپسم اورچونے کے پتھرپرتیمم کرناصحیح ہے نیزاس گرد وغبارپرجو قالین،کپڑے اوران جیسی دوسری چیزوں پرجمع ہوجاتاہے اگرعرف عام میں اسے نرم خاک شمار کیاجاتاہوتواس پرتیمم صحیح ہے۔ اگرچہ احتیاط مستحب یہ ہے کہ اختیارکی حالت میں اس پرتیمم نہ کرے۔ اسی طرح احتیاط مستحب کی بناپر اختیار کی حالت میں پکے جپسم اور چونے پر اور پکی ہوئی اینٹ اوردوسرے معدنی پتھرمثلاً عقیق پرتیمم نہ کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 674",
          url: "https://www.sistani.org/english/book/48/2203/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (674)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A",
        note: "Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "In performing tayammum on things upon which tayammum is valid, such as soil, plaster of Paris, stone, and rock, is it all right to do it when they are fixed on a wall, or is it necessary that they be on the ground?",
          ur: "وہ چیزیں جن پر تیمم صحیح ہے، جیسے مٹی، چونا اور پتھر و غیرہ، اگر یہ دیوار پر چپکی ہوں تو کیا ان پر تیمم صحیح ہے؟ یا ان کا سطح زمین پر ہونا ضروری ہے؟"
        },
        text: {
          en: "It is not a condition for the validity of tayammum that they should be on the ground.",
          ur: "تیمم کے صحیح ہونے میں ان کا سطح زمین پر ہونا شرط نہیں ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 199",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 200",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumpure",
    topicId: "tayammum",
    subject: {
      en: "The surface must be pure"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The thing with which a person performs tayammum must be pure (ṭāhir); and based on obligatory precaution, it must also be commonly considered clean, meaning that it must not be tainted with anything that causes disgust. If one does not have a pure thing with which tayammum can be validly performed, then performing prayers at that time is not obligatory for him; however, he must make up that prayer; and it is better that he also perform the prayer within its time except if the situation has reached the point whereby he must perform tayammum with a dusty carpet or similar thing. If it is impure, the obligatory precaution is that he must perform tayammum with it, perform the prayer, and make up the prayer afterwards.",
          ur: "جس چیزپرانسان تیمم کرے اس کا شرعاًپاک ہوناضروری ہے( احتیاط واجب کی بناء پر)عرف میں بھی پاک سمجھا جائے یعنی کسی ایسی چیز سے آلودہ نہ ہو جو بیزاری کا سبب ہو اور اگر اس کے پاس کوئی ایسی پاک چیزنہ ہو جس پرتیمم کرناصحیح ہوتواس پرنمازواجب نہیں لیکن ضروری ہے کہ اس کی قضا بجالائے اوربہتریہ ہے کہ وقت میں بھی نماز پڑھے مگر یہ کہ ایسے موقع پر کوئی گرد آلود قالین یا اس کی جیسی چیز تک تیمم کرنے کی نوبت آجائے کہ اگر نجس ہوتو احتیاط واجب یہ ہےکہ اس سے تیمم کرکے نماز پڑھے اور بعد میں قضا بھی بجالائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 681",
          url: "https://www.sistani.org/english/book/48/2203/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (681)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "You have stated that things on which we can do tayammum should be pure. Is it obligatory for body parts involved in tayammum — i.e. forehead and back of the hands — to be pure as well?",
          ur: "آپ نے فرمایا ہے جس چیز پر تیمم کیا جائے اس کا پاک ہونا ضروری ہے کیا اعضاء تیمم (پیشانی اور ہاتھوں کی پشت) کا پاک ہونا بھی ضروری ہے ؟"
        },
        text: {
          en: "It is based on caution that, whenever possible, forehead and the back of the hands should be pure. If one could not purify them, he would perform it without purification, although it is not remote that it is not necessary for them to be pure in any case.",
          ur: "احتیاط یہ ہے کہ ممکنہ صورت میں پیشانی اور ہاتھوں کی پشت پاک ہو اور اگر انہیں پاک کرنا ممکن نہ ہو تو اسکے بغیر ہی تیمم کرلے اگر چہ بعید نہیں ہے کہ ہر صورت میں طہارت شرط نہ ہو۔"
        },
        basis: "ihtiyat_unspecified",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 210",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 211",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumobligatory",
    topicId: "tayammum",
    subject: {
      en: "The obligatory acts of tayammum"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Three things are obligatory when performing tayammum in place of wuḍūʾ or ghusl:\n1. striking or placing the palms of both hands on something with which tayammum can be validly performed; and based on obligatory precaution, the striking of both palms must be done simultaneously;\n2. wiping the palms of both hands over the entire forehead – and based on obligatory precaution, over the two sides of the forehead as well – from the place where the hair of the head grows to the eyebrows and above the nose; and the recommended precaution is that the palms should be wiped over the eyebrows as well;\n3. wiping the palm of the left hand over the whole of the back of the right hand from the wrist to the fingertips, and wiping the palm of the right hand over the whole of the back of the left hand from the wrist to the fingertips; and the obligatory precaution is that that the order mentioned above must be observed [i.e. first the back of the right hand must be wiped, then the back of the left].\nIt is necessary that tayammum be performed with the intention of attaining proximity to Allah, just as was mentioned with regard to performing wuḍūʾ."
        },
        hukm: "wajib",
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 689",
          url: "https://www.sistani.org/english/book/48/2204/"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording. Part of this ruling is stated as a recommended precaution; see the wording.",
        urduNote: "The Urdu text of this ruling is held back until a person has checked it against the English (the automated comparison found a difference in numbers or negation)."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "How can we perform tayammum? Is there any difference between the method of tayammum done instead of wuḍū’ and that done instead of ghusl?",
          ur: "تیمم کا طریقہ کیا ہے؟ آیا غسل اور وضو کے بدلے تیمم میں کوئی فرق ہے؟"
        },
        text: {
          en: "Tayammum should be done as follows: First, one makes the intention. Then, the entire palms of the two hands are hit at the same time on something on which tayammum is correct and they are passed together over the entire forehead and both sides of it from the hair line to the eyebrows and the upper part of the nose. Thereafter the left palm is passed over the back of the entire right hand and the right palm over the back of the entire left hand. Also, based on obligatory caution, one should hit both palms, again, on something on which tayammum is correct and then to rub the left palm over the back of the entire right hand and the right palm over the back of the entire left hand. The same procedure is followed whether tayammum is to be done instead of wuḍū’ or ghusl.",
          ur: "تیمم کا طریقہ یہ ہے کہ نیت کرنے کے بعد دونوں ہاتھوں کی پوری ہتھیلی کو ایک ساتھ اس چیز پر مارے جس پر تیمم صحیح ہو پھر دونوں ہاتھوں کی ہتھیلوں کو ایک ساتھ  پوری پیشانی پر بالوں کے اگنے کی جگہ سے ابرو اور ناک کے اوپر والے حصے تک اور پیشانی کے دونوں اطراف پر پھیرے، پھر بائیں ہاتھ کی ہتھیلی کو دائیں ہاتھ کی پوری پشت پر اور دائیں ہاتھ کی ہتھیلی کو بائیں ہاتھ کی پوری پشت پر پھیرے اور احتیاط واجب یہ ہے کہ دوبارہ ہاتھوں کو ایسی چیز پر  مارے جس پر تیمم صحیح ہو اور پھر بائیں ہاتھ کی ہتھیلی کو دائیں ہاتھ کی پشت پر اور دائیں ہاتھ کی ہتھیلی کو بائیں ہاتھ کی پشت پر پھیرے  خواہ تیمم وضو کے بدلے ہو یا غسل کے بدلے۔ لذا غسل اور وضو کے تیمم میں کوئی فرق نهیں هے."
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 208",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 209",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "tayammumcomplete",
    topicId: "tayammum",
    subject: {
      en: "Wiping the whole forehead and hands"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If a person fails to wipe even a small area of his forehead or the back of his hands, his tayammum is invalid, irrespective of whether he fails to wipe the area intentionally, or because he did not know the ruling or had forgotten to wipe it. However, it is not necessary to be very particular either, and it is sufficient if it can be said that the entire forehead and back of the hands have been wiped.",
          ur: "اگرایک شخص پیشانی یاہاتھوں کی پشت کے ذراسے حصے کا بھی مسح نہ کرے تو اس کاتیمم باطل ہے قطع نظراس سے کہ اس نے عمداً مسح نہ کیاہویامسئلہ نہ جانتا ہویامسئلہ بھول گیاہولیکن بال کی کھال نکالنے کی ضرورت بھی نہیں ۔ اگریہ کہاجاسکے کہ تمام پیشانی اورہاتھوں کامسح ہوگیاہے تواتناہی کافی ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 691",
          url: "https://www.sistani.org/english/book/48/2205/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (691)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumdirection",
    topicId: "tayammum",
    subject: {
      en: "Direction and succession in tayammum"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "Based on obligatory precaution, the forehead and the back of the hands must be wiped from top to bottom [i.e. the forehead must be wiped in a direction towards the eyebrows and above the nose, and the back of the hands must be wiped in a direction towards the fingertips]. These actions must be performed one after the other; if there is a delay between performing them such that it cannot be said that one is performing tayammum, then the tayammum is invalid.",
          ur: "تیمم کرنے والے کوپیشانی اورہاتھوں کی پشت کامسح (احتیاط کی بناپر) اوپرسے نیچے کی جانب کرناضروری ہے اوریہ افعال ایک دوسرے سے متصل ہونے چاہئیں اوراگران افعال کے درمیان اتنافاصلہ دے کہ لوگ یہ نہ کہیں کہ تیمم کررہاہے تو تیمم باطل ہے۔"
        },
        basis: "ihtiyat_wajib",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 693",
          url: "https://www.sistani.org/english/book/48/2205/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (693)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumexcuseends",
    topicId: "tayammum",
    subject: {
      en: "When the excuse ends"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone performs tayammum because he did not have water or some other legitimate excuse, then once that excuse expires, his tayammum becomes void.",
          ur: "اگرکوئی شخص پانی نہ ملنے کی وجہ سے یاکسی اورعذرکی بناپرتیمم کرے تو عذرکے ختم ہوجانے کے بعداس کاتیمم باطل ہوجاتاہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 708",
          url: "https://www.sistani.org/english/book/48/2205/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (708)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "One who cannot find water, or one for whom using water is harmful, performs tayammum instead of the ghusl of janābah. Is it permissible for him to enter a masjid and attend congregational prayer? What about reciting the Holy Qur’an?",
          ur: "جس شخص کے پاس پانی نہ ہو یا اس کے لئے پانی کا استعمال مضر ہو اور وہ غسل جنابت کے بدلے تیمم کر لے تو کیا وہ مسجد میں داخل ہوکر نماز جماعت میں شریک ہو سکتاہے؟ اور اس کے قرآن کریم پڑھنے کا حکم کیا ہے؟"
        },
        text: {
          en: "As long as the excuse permitting tayammum is not removed and the tayammum remains valid, he is allowed to perform all the acts for which purity is required.",
          ur: "جب تک تیمم کو جائز کرنے والا عذر باقی ہے اور اس کا تیمم باطل نہیں ہوا اس وقت تک وہ ان تمام اعمال کو انجام دے سکتا ہے جن میں طہارت شرط ہے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 203",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 204",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammuminvalidators",
    topicId: "tayammum",
    subject: {
      en: "What invalidates tayammum"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "The things that invalidate wuḍūʾ also invalidate tayammum performed in place of wuḍūʾ. The things that invalidate ghusl also invalidate tayammum performed in place of ghusl.",
          ur: "جوچیزیں وضو کوباطل کرتی ہیں وہ وضو کے بدلے کئے ہوئے تیمم کو بھی باطل کرتی ہیں اورجوچیزیں غسل کوباطل کرتی ہیں وہ غسل کے بدلے کئے ہوئے تیمم کو بھی باطل کرتی ہیں ۔"
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 709",
          url: "https://www.sistani.org/english/book/48/2205/"
        },
        urSource: {
          title: "توضیح المسائل",
          reference: "مسئلہ (709)",
          url: "https://www.sistani.org/urdu/book/61/3636/"
        },
        verification: "A"
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "One becomes junub (e.g. after ejaculation) and there is no access to the bath and the state of janābah remains for several days. Then, if he prayed with tayammum instead of ghusl and thereafter a wuḍū’ invalidator happened, is he obliged to perform again tayammum instead of ghusl for the later prayers? Or is the first tayammum enough for janābah and it is obligatory to do wuḍū’ or tayammum for the following prayers due to the occurrence of wuḍū’ invalidator?",
          ur: "اگر میں مجنب ہوجاؤں اور میرے لئے حمام جانا ممکن نہ ہو اور جنابت کی یہ حالت چند روز تک باقی رہے، اور میں غسل کے بدلے میں تیمم کرکے نماز پڑھ لوں اسکے بعد مجھ سے حدث اصغر سرزد ہوجائے تو کیا بعد والی نماز کیلئے دوبارہ غسل کے بدلے تیمم کروں یا نہیں بلکہ جنابت کی جہت سے وہی پہلا تیمم کافی ہے اور بعد والی نمازوں کیلئے حدث اصغر کی خاطر وضو یا تیمم واجب ہے ؟"
        },
        text: {
          en: "When a junub person performs a valid tayammum as a substitute for the ghusl of janābah and a wuḍū’ invalidator occurs later, then as long as the excuse of performing tayammum instead of ghusl is existing it is of obligatory caution for him to perform tayammum instead of ghusl for every act that requires being in a state of purity and then to do wuḍū’, as well,. If he is excused from wuḍū’, he is to perform another tayammum instead of wuḍū’.",
          ur: "جب مجنب شخص غسل جنابت کے بدلے صحیح تیمم کر لے اور اس تیمم کے بعد اگر اس سے حدث اصغر سرزد ہو جائے تو جب تک تیمم کو جائز قرا ردینے والا شرعی عذر باقی ہے بنابر احتیاط واجب جن اعمال میں طہارت شرط ہے ان کیلئے غسل کے بدلے تیمم کرے اور پھر وضو بھی کرے اور اگر وضو بھی نہ کرسکتاہو تو ایک دوسرا تیمم وضو کے بدلے کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 200",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 201",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A",
        note: "Part of this ruling is stated as an obligatory precaution; see the wording."
      }
    ]
  },
  {
    id: "tayammuminsteadofghusl",
    topicId: "tayammum",
    subject: {
      en: "Tayammum in place of ghusl and wuḍūʾ"
    },
    rulings: [
      {
        marjaId: "sistani",
        format: "issue",
        text: {
          en: "If someone performs tayammum in place of the ghusl for janābah, it is not necessary for them to perform wuḍūʾ for prayers. Similarly, [it is not necessary for them to perform wuḍūʾ for prayers] if the tayammum is in place of other ghusls – except the ghusl for medium istiḥāḍah – although in such a case, the recommended precaution is that they should perform wuḍūʾ as well; and if they cannot perform wuḍūʾ, they should perform another tayammum in place of wuḍūʾ."
        },
        basis: "fatwa",
        source: {
          title: "Islamic Laws (4th edition)",
          reference: "Ruling 712*",
          url: "https://www.sistani.org/english/book/48/2205/"
        },
        verification: "A",
        urduEditionLag: true,
        urduNote: "The official Urdu edition has the pre-revision wording of this ruling.",
        note: "Marked * (revised) in the 4th edition. The official Urdu توضیح المسائل still has the earlier wording, so only the revised English is shown (decision P6). Part of this ruling is stated as a recommended precaution; see the wording."
      },
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "Do the rules of ghusl apply to tayammum performed as a substitute for ghusl in the sense that it is permissible to enter a masjid with it?",
          ur: "غسل کے بدلے کئے جانے والے تیمم کے بعد کیا وہ سب امور انجام پا سکتے ہیں جو غسل کے بعد انجام دیے جا سکتے ہیں یعنی کیا تیمم کر کے مسجد میں داخل ہونا جائز ہے؟"
        },
        text: {
          en: "As long as tayammum is not invalidated and the excuse for not performing ghusl exists, all shar‘ī effects of ghusl apply to tayammum performed as a substitute for it, except when it is performed due to shortness of time.",
          ur: "جب تک تییم کے مجوز باقی ہو اور اسکا تییم باطل نہیں ہوا ہو،غسل کے بعد جتنے شرعی امور انجام دئے جا سکتے ہیں وہ اس کے عوض کئے جانے والے تیمم کے بعد بھی جائز ہیں،مگر یہ کہ غسل کے بدلے میں تیمم تنگی وقت کی وجہ سے کیا جائے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 201",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 202",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A"
      }
    ]
  },
  {
    id: "tayammumneither",
    topicId: "tayammum",
    subject: {
      en: "When neither wuḍūʾ nor tayammum is possible"
    },
    rulings: [
      {
        marjaId: "khamenei",
        format: "qa",
        question: {
          en: "If one is not able to perform wuḍū’ and tayammum is not possible either, what is his duty?",
          ur: "اگر انسان کیلئے نہ وضو ممکن ہو اور نہ تیمم تو اسکی شرعی ذمہ داری کیا ہے ؟"
        },
        text: {
          en: "If he is neither able to perform wuḍū’ for prayer nor tayammum, he should offer his prayer, as per caution, within its specific time without them and make it up in qaḍā’ with wuḍū’ or tayammum later on.",
          ur: "بنابر احتیاط وقت کے اندر بغیر وضو اور تیمم کے نماز پڑھے اور پھر بعد میں وضو یا تیمم کے ساتھ اسکی قضا کرے۔"
        },
        basis: "fatwa",
        source: {
          title: "Practical Laws of Islam",
          reference: "Q 211",
          url: "https://www.leader.ir/en/book/32/1?sn=5249"
        },
        urSource: {
          title: "استفتاآت کے جوابات",
          reference: "س 212",
          url: "https://www.leader.ir/ur/book/106/1?sn=11380"
        },
        verification: "A",
        note: "Part of this answer says 'caution' without stating whether it is obligatory or recommended (decision P5)."
      }
    ]
  }
];
