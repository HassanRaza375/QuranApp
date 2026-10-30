// Taharat (§6.2) step-by-step procedures — Phase 2.
// Step titles are app-written labels; each `instruction` is a verbatim excerpt
// of the ruling in `rulingId` for the same marja' (the validator checks this).
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
import type { Procedure } from "../types";

export const TAHARAT_PROCEDURES: Procedure[] = [
  {
    id: "wudusistani",
    topicId: "wudu",
    marjaId: "sistani",
    title: {
      en: "How to perform wuḍūʾ"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "It is not necessary for one to actually utter the intention (niyyah) of performing wuḍūʾ or feel it in his heart; rather, it is sufficient if he performs all the acts of wuḍūʾ in compliance with the command of Allah the Exalted."
        },
        rulingId: "wuduintention"
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Wash the face"
        },
        instruction: {
          en: "The length of the face that must be washed is the area from the top of the forehead where the hair grows to the bottom of the chin; and the breadth of the face that must be washed is the area that is covered by the tip of the middle finger to the tip of the thumb."
        },
        rulingId: "wuduface",
        hukm: "wajib",
        note: "Marked wājib because Ruling 235 states: “In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.”"
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Wash the right arm"
        },
        instruction: {
          en: "After washing the face, one must wash his right arm from the elbow to the tips of the fingers,"
        },
        rulingId: "wuduarms",
        hukm: "wajib",
        note: "Marked wājib because Ruling 235 states: “In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.”"
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Wash the left arm"
        },
        instruction: {
          en: "and he must then proceed to wash his left arm in the same way."
        },
        rulingId: "wuduarms",
        hukm: "wajib",
        note: "Marked wājib because Ruling 235 states: “In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.”"
      },
      {
        id: "s5",
        order: 5,
        title: {
          en: "Wipe the head"
        },
        instruction: {
          en: "After washing both arms, one must wipe the front part of his head with the wetness of the water that has remained on his hand."
        },
        rulingId: "wuduhead",
        hukm: "wajib",
        note: "Marked wājib because Ruling 235 states: “In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.”"
      },
      {
        id: "s6",
        order: 6,
        title: {
          en: "Wipe the feet"
        },
        instruction: {
          en: "After wiping the head, one must wipe the upper part of the feet with the wetness of the wuḍūʾ water that has remained on his hands. The area that must be wiped is from the tip of one of the toes to the ankle; and based on obligatory precaution, wiping the feet up to the raised part in the middle of the foot [before the ankle] will not suffice."
        },
        rulingId: "wudufeet",
        hukm: "wajib",
        note: "Marked wājib because Ruling 235 states: “In wuḍūʾ, it is obligatory to wash (ghasl) the face and arms, and to wipe (masḥ) the front part of the head and upper part of the feet.”"
      },
      {
        id: "s7",
        order: 7,
        title: {
          en: "Keep the order: right foot before left"
        },
        instruction: {
          en: "And based on obligatory precaution, one must wipe the left foot after the right foot."
        },
        rulingId: "wudusequence"
      }
    ]
  },
  {
    id: "ghusltartibisistani",
    topicId: "ghusl",
    marjaId: "sistani",
    title: {
      en: "How to perform sequential (tartībī) ghusl"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Wash the head and neck"
        },
        instruction: {
          en: "In sequential ghusl, one must – based on obligatory precaution – first wash with the intention of ghusl the entire head and neck"
        },
        rulingId: "ghusltartibi"
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Wash the rest of the body"
        },
        instruction: {
          en: "and then the entire body with the intention of ghusl; and it is better to first wash the right side of the body, then the left."
        },
        rulingId: "ghusltartibi"
      }
    ]
  },
  {
    id: "ghuslirtimasisistani",
    topicId: "ghusl",
    marjaId: "sistani",
    title: {
      en: "How to perform immersive (irtimāsī) ghusl"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Go completely under the water with the intention of ghusl"
        },
        instruction: {
          en: "In instantaneous immersive ghusl, water must cover the entire body in one go. However, it is not necessary for the entire body to be out of the water before starting the ghusl; rather, it is sufficient if part of the body is out of the water and the person goes under the water completely with the intention of performing ghusl."
        },
        rulingId: "ghuslirtimasi"
      }
    ]
  },
  {
    id: "tayammumsistani",
    topicId: "tayammum",
    marjaId: "sistani",
    title: {
      en: "How to perform tayammum"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Strike both palms on the surface"
        },
        instruction: {
          en: "1. striking or placing the palms of both hands on something with which tayammum can be validly performed; and based on obligatory precaution, the striking of both palms must be done simultaneously;"
        },
        rulingId: "tayammumobligatory",
        hukm: "wajib"
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Wipe the forehead"
        },
        instruction: {
          en: "2. wiping the palms of both hands over the entire forehead – and based on obligatory precaution, over the two sides of the forehead as well – from the place where the hair of the head grows to the eyebrows and above the nose; and the recommended precaution is that the palms should be wiped over the eyebrows as well;"
        },
        rulingId: "tayammumobligatory",
        hukm: "wajib"
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Wipe the backs of the hands"
        },
        instruction: {
          en: "3. wiping the palm of the left hand over the whole of the back of the right hand from the wrist to the fingertips, and wiping the palm of the right hand over the whole of the back of the left hand from the wrist to the fingertips; and the obligatory precaution is that that the order mentioned above must be observed [i.e. first the back of the right hand must be wiped, then the back of the left]."
        },
        rulingId: "tayammumobligatory",
        hukm: "wajib"
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Intention of attaining proximity to Allah"
        },
        instruction: {
          en: "It is necessary that tayammum be performed with the intention of attaining proximity to Allah, just as was mentioned with regard to performing wuḍūʾ."
        },
        rulingId: "tayammumobligatory"
      }
    ]
  },
  {
    id: "tayammumkhamenei",
    topicId: "tayammum",
    marjaId: "khamenei",
    title: {
      en: "How to perform tayammum"
    },
    steps: [
      {
        id: "s1",
        order: 1,
        title: {
          en: "Intention"
        },
        instruction: {
          en: "First, one makes the intention."
        },
        rulingId: "tayammumobligatory"
      },
      {
        id: "s2",
        order: 2,
        title: {
          en: "Strike both palms and wipe the forehead"
        },
        instruction: {
          en: "Then, the entire palms of the two hands are hit at the same time on something on which tayammum is correct and they are passed together over the entire forehead and both sides of it from the hair line to the eyebrows and the upper part of the nose."
        },
        rulingId: "tayammumobligatory"
      },
      {
        id: "s3",
        order: 3,
        title: {
          en: "Wipe the backs of the hands"
        },
        instruction: {
          en: "Thereafter the left palm is passed over the back of the entire right hand and the right palm over the back of the entire left hand."
        },
        rulingId: "tayammumobligatory"
      },
      {
        id: "s4",
        order: 4,
        title: {
          en: "Strike again and wipe the backs of the hands (obligatory caution)"
        },
        instruction: {
          en: "Also, based on obligatory caution, one should hit both palms, again, on something on which tayammum is correct and then to rub the left palm over the back of the entire right hand and the right palm over the back of the entire left hand."
        },
        rulingId: "tayammumobligatory"
      }
    ]
  }
];
