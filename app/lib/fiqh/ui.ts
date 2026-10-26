// The few Urdu and Arabic words of the Daily Fiqh controls (the name of the language, "question", "answer", the placeholder). The app's code holds no Arabic-script text, so they are
// built from code points (the same rule as the rest of the app). They are labels of the interface, not religious content.
const word = (...codes: number[]) => String.fromCodePoint(...codes);
export const URDU = word(0x627, 0x631, 0x62f, 0x648); // the language's name, in its own script
export const ARABIC_LANG = word(0x639, 0x631, 0x628, 0x6cc);
export const QUESTION_UR = word(0x633, 0x648, 0x627, 0x644);
export const ANSWER_UR = word(0x62c, 0x648, 0x627, 0x628);
