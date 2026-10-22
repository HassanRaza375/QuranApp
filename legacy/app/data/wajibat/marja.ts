// The three maraji' covered by Module 18 (decision Q1). Books and URLs were
// verified reachable on 2026-09-25 — see wajibat_decisions.md "Phase 0
// findings" for the full source table and what could not be reached.
import type { Marja, MarjaId } from "./types";

export const MARAJI: Marja[] = [
  {
    id: "sistani",
    name: { en: "Ayatullah al-Sayyid Ali al-Husayni al-Sistani", ur: "آیت اللہ سید علی حسینی سیستانی" },
    officialSite: "https://www.sistani.org",
    status: "active",
    books: [
      {
        title: "Islamic Laws",
        lang: "en",
        edition: "4th edition (based on the 36th Persian edition, 2021)",
        url: "https://www.sistani.org/english/book/48/",
        pdfUrl: "https://www.sistani.org/files-new/book-pdf/english-islamic-laws-4th-edition.pdf",
        numbering: "Ruling n (revised rulings marked *)",
      },
      {
        title: "توضیح المسائل",
        lang: "ur",
        url: "https://www.sistani.org/urdu/book/61/",
        pdfUrl: "https://www.sistani.org/files-new/book-pdf/urdu-tozih.pdf",
        numbering: "مسئلہ (n)",
      },
    ],
  },
  {
    id: "khamenei",
    name: { en: "Ayatullah al-Sayyid Ali Khamenei", ur: "آیت اللہ سید علی خامنہ ای" },
    officialSite: "https://www.leader.ir",
    status: "active",
    books: [
      {
        title: "Practical Laws of Islam",
        lang: "en",
        url: "https://www.leader.ir/en/book/32/Practical-Laws-of-Islam",
        numbering: "Q n (questions and answers)",
      },
      {
        title: "The Rules on Prayer & Fasting 2023",
        lang: "en",
        edition: "2023",
        url: "https://www.leader.ir/en/book/241?sn=32516",
        numbering: "n. (numbered rulings) — preferred for salat and sawm (decision P2)",
      },
      {
        title: "استفتاآت کے جوابات",
        lang: "ur",
        url: "https://www.leader.ir/ur/book/106/",
        numbering: "س n (numbering differs from the English book after the Taqlid chapter)",
      },
    ],
  },
  {
    id: "makarem",
    name: { en: "Ayatullah Naser Makarem Shirazi", ur: "آیت اللہ ناصر مکارم شیرازی" },
    officialSite: "https://makarem.ir",
    // Decision P1: his risala is not reachable from the build environment. He stays
    // selectable; every ruling shows "rulings being added" until the user
    // provides the book in docs/sources/. Never falls back to another marja'.
    status: "pending-sources",
    books: [
      {
        title: "Practical Laws of Islam (Tauḍiḥ al-Masāil)",
        lang: "en",
        edition: "updated edition announced 2016-12-10",
        url: "https://www.makarem.ir/news/en/News/Details/400955/",
        numbering: "not yet confirmed",
      },
    ],
  },
];

export const getMarjaById = (id: string | null | undefined): Marja | undefined =>
  MARAJI.find((m) => m.id === id);

export const isMarjaId = (id: unknown): id is MarjaId =>
  typeof id === "string" && MARAJI.some((m) => m.id === id);
