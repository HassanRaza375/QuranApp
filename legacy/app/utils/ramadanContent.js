// Static, non-authoritative Ramadan content: a small rotating dua list and
// Laylat al-Qadr background. Kept as plain data (not a scholarly ruling)
// per the roadmap doc's "don't imply app-generated religious authority" rule.

export const RAMADAN_DUAS = [
  {
    id: 1,
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    translation: "O Allah, You are Most Forgiving, and You love forgiveness; so forgive me.",
    reference: "Tirmidhi — recommended for the last ten nights",
  },
  {
    id: 2,
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    reference: "Qur'an 2:201",
  },
  {
    id: 3,
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ",
    translation: "O Allah, bless us in Rajab and Sha'ban, and let us reach Ramadan.",
    reference: "Traditional supplication for the arrival of Ramadan",
  },
  {
    id: 4,
    arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ",
    translation: "The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.",
    reference: "Abu Dawud — said at Iftar",
  },
  {
    id: 5,
    arabic: "اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ",
    translation: "O Allah, I fasted for You, I believe in You, I put my trust in You, and I break my fast with Your provision.",
    reference: "Abu Dawud — said at Iftar",
  },
];

// Odd-numbered nights of the last ten days, expressed as the Hijri day
// number they fall on (21st night = eve leading into day 21, etc.).
export const LAYLAT_AL_QADR_NIGHTS = [21, 23, 25, 27, 29];

export const RAMADAN_GOAL_LABEL = "Ramadan Khatmah";

export const LAYLAT_AL_QADR_NOTE =
  "Laylat al-Qadr is traditionally sought on one of the odd-numbered nights of the last ten days of Ramadan " +
  "— most commonly the 27th. The exact night isn't specified, and the Hijri day shown here is calculated, not " +
  "locally announced, so treat this as an estimate and check with your local mosque or authority.";
