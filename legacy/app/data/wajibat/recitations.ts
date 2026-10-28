// Recitations shown separately from `MarjaRuling.text` (decision P12) — used
// where the Arabic is sourced from a *different* official book than the
// ruling text itself (e.g. Sistani's English "Islamic Laws" shows a dhikr
// only as an image, but his official Urdu "Tawzih al-Masa'il" has it as
// real text). Never typed from memory: `arabic` is a verbatim copy of
// `source`, checked letter by letter.
import type { Recitation } from "./types";

export const WAJIBAT_RECITATIONS: Recitation[] = [
  {
    id: "rukudhikrarabic",
    marjaId: "sistani",
    arabic: "سُبْحَانَ رَبِّیَ الْعَظِیْمِ وَبِحَمْدِہٖ",
    transliteration: "subḥāna rabbiyal ʿaẓīmi wa biḥamdih",
    source: {
      title: "توضیح المسائل (Tawzih al-Masa'il)",
      reference: "مسئلہ (1014)",
      url: "https://www.sistani.org/urdu/book/61/3637/",
    },
    note: "English Islamic Laws (4th ed.), Ruling 1014, shows this dhikr only as an image (/files-new/book-photo/48/ruku.png); the Arabic here is taken from the official Urdu edition's text instead of being retyped from the image.",
  },
  {
    id: "sajdahdhikrarabic",
    marjaId: "sistani",
    arabic: "سُبْحَانَ رَبِّیَ الْاَعْلیٰ وَبِحَمْدِہٖ",
    transliteration: "subḥāna rabbiyal aʿlā wa biḥamdih",
    source: {
      title: "توضیح المسائل (Tawzih al-Masa'il)",
      reference: "مسئلہ (1035)",
      url: "https://www.sistani.org/urdu/book/61/3637/",
    },
    note: "English Islamic Laws (4th ed.), Ruling 1035, shows this dhikr only as an image; the Arabic here is taken from the official Urdu edition's text instead of being retyped from the image.",
  },
];
