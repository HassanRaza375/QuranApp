// Islamic calendar events, keyed by Hijri month/day. This is a *calculated
// reference*, not a religious ruling — exact observance (especially
// Ramadan/Eid start, which depend on moon sighting) can differ by a day
// depending on local authority. Keep Ramadan's own start-date override in
// useRamadan.ts in sync with the "Start of Ramadan" entry below.
//
// `tradition` lets a caller filter/prioritize by the app's existing
// prayer.fiqh setting ("sunni" | "jafari") instead of picking one audience
// as the app's default identity:
//   - "shared": observed (though not always identically) across both
//   - "sunni" / "jafari": specific to that tradition, or dated differently
//     between them (e.g. Mawlid al-Nabi)
//
// Scope note: this is a *first, conservative pass* — it includes only dates
// I'm confident are well-established and largely uncontested across
// mainstream sources. A dedicated Twelve Imams calendar (several of their
// martyrdom dates have real, competing traditions — see the design
// discussion this was built from) is intentionally deferred to a follow-up
// pass so contested dates get sourced properly instead of guessed.
export const ISLAMIC_EVENTS = [
  { month: 1, day: 1, name: "Islamic New Year", category: "major", tradition: "shared", icon: "mdi-calendar-star" },
  {
    month: 1,
    day: 9,
    name: "Tasua",
    category: "shia-occasion",
    tradition: "jafari",
    icon: "mdi-star-four-points-outline",
    dateNote: "The eve of Ashura, commemorating the day before the Battle of Karbala.",
  },
  {
    month: 1,
    day: 10,
    name: "Ashura",
    category: "major",
    tradition: "shared",
    icon: "mdi-star-four-points-outline",
    dateNote:
      "Observed differently across traditions: a recommended fasting day in Sunni practice, and a day of mourning for the martyrdom of Imam Husayn at Karbala in Shia practice.",
  },
  {
    month: 2,
    day: 20,
    name: "Arbaeen",
    category: "shia-occasion",
    tradition: "jafari",
    icon: "mdi-walk",
    dateNote: "40 days after Ashura, marking the end of the mourning period for Imam Husayn.",
  },
  { month: 3, day: 12, name: "Mawlid al-Nabi", category: "birth", tradition: "sunni", icon: "mdi-star-crescent" },
  {
    month: 3,
    day: 17,
    name: "Mawlid al-Nabi & Imam Ja'far al-Sadiq",
    category: "birth",
    tradition: "jafari",
    icon: "mdi-star-crescent",
    dateNote: "Shia tradition observes the Prophet's birth on this date, shared with Imam Ja'far al-Sadiq's birthday.",
  },
  { month: 7, day: 27, name: "Isra and Mi'raj", category: "major", tradition: "sunni", icon: "mdi-star-crescent" },
  {
    month: 7,
    day: 27,
    name: "Mab'ath — Prophet's Commissioning",
    category: "major",
    tradition: "jafari",
    icon: "mdi-star-crescent",
    dateNote: "Commemorates the Prophet's first revelation and commissioning as Messenger.",
  },
  { month: 8, day: 3, name: "Birth of Imam Husayn", category: "birth", tradition: "jafari", icon: "mdi-star-four-points-outline" },
  { month: 8, day: 4, name: "Birth of Abbas ibn Ali", category: "birth", tradition: "jafari", icon: "mdi-star-four-points-outline" },
  {
    month: 8,
    day: 5,
    name: "Birth of Imam Ali Zayn al-Abidin",
    category: "birth",
    tradition: "jafari",
    icon: "mdi-star-four-points-outline",
  },
  {
    // Listed before the shared Bara'at entry below so it wins the
    // same-priority tie-break for Jafari users — this specific date is
    // observed primarily as Imam Mahdi's birth in Shia practice, more so
    // than the general Bara'at framing.
    month: 8,
    day: 15,
    name: "Birth of Imam Muhammad al-Mahdi",
    category: "major",
    tradition: "jafari",
    icon: "mdi-star-four-points-outline",
    dateNote: "One of the most widely celebrated dates in the Shia calendar.",
  },
  {
    month: 8,
    day: 15,
    name: "Laylat al-Bara'at",
    category: "major",
    tradition: "shared",
    icon: "mdi-star-four-points-outline",
    dateNote: "The night of the middle of Sha'ban, widely observed as a night of forgiveness.",
  },
  { month: 9, day: 1, name: "Start of Ramadan", category: "major", tradition: "shared", icon: "mdi-moon-waning-crescent" },
  { month: 9, day: 10, name: "Death of Khadijah", category: "remembrance", tradition: "shared", icon: "mdi-flower-outline" },
  {
    month: 9,
    day: 15,
    name: "Birth of Imam Hasan al-Mujtaba",
    category: "birth",
    tradition: "jafari",
    icon: "mdi-star-four-points-outline",
  },
  {
    month: 9,
    day: 19,
    name: "Imam Ali Struck in Prayer",
    category: "martyrdom",
    tradition: "jafari",
    icon: "mdi-sword",
    dateNote: "Imam Ali was struck while praying in the mosque of Kufa; he was martyred two days later.",
  },
  { month: 9, day: 21, name: "Martyrdom of Imam Ali", category: "martyrdom", tradition: "jafari", icon: "mdi-sword" },
  { month: 9, day: 21, name: "Laylat al-Qadr (possible night)", category: "major", tradition: "shared", icon: "mdi-star-four-points-outline" },
  { month: 9, day: 23, name: "Laylat al-Qadr (possible night)", category: "major", tradition: "shared", icon: "mdi-star-four-points-outline" },
  { month: 9, day: 25, name: "Laylat al-Qadr (possible night)", category: "major", tradition: "shared", icon: "mdi-star-four-points-outline" },
  { month: 9, day: 27, name: "Laylat al-Qadr (possible night)", category: "major", tradition: "shared", icon: "mdi-star-four-points-outline" },
  { month: 9, day: 29, name: "Laylat al-Qadr (possible night)", category: "major", tradition: "shared", icon: "mdi-star-four-points-outline" },
  { month: 10, day: 1, name: "Eid al-Fitr", category: "major", tradition: "shared", icon: "mdi-party-popper" },
  { month: 12, day: 8, name: "Start of Hajj (Yawm al-Tarwiyah)", category: "major", tradition: "shared", icon: "mdi-kaaba" },
  { month: 12, day: 9, name: "Day of Arafah", category: "major", tradition: "shared", icon: "mdi-mountain" },
  { month: 12, day: 10, name: "Eid al-Adha", category: "major", tradition: "shared", icon: "mdi-party-popper" },
  {
    month: 12,
    day: 18,
    name: "Eid al-Ghadir",
    category: "major",
    tradition: "jafari",
    icon: "mdi-hand-heart",
    dateNote: "Commemorates the Prophet's declaration at Ghadir Khumm.",
  },
  { month: 12, day: 24, name: "Eid al-Mubahala", category: "shia-occasion", tradition: "jafari", icon: "mdi-hand-heart" },
];

// Used purely to pick one representative event for compact UI (the
// dashboard chip) when more than one lands on the same day — the calendar
// page always shows every match, not just the top one. Martyrdom days rank
// above general "major" ones deliberately: a day like 21 Ramadan is both a
// possible Laylat al-Qadr night (one of five recurring candidates) *and*
// the martyrdom of Imam Ali (a single, singularly significant day) — the
// latter is the more specific, identifying event for that date.
const CATEGORY_PRIORITY = { martyrdom: 0, major: 1, birth: 2, "shia-occasion": 3, remembrance: 4 };

/** All events matching a Hijri date, optionally filtered to a fiqh
 * ("sunni" | "jafari") — "shared" events always pass the filter. */
export const getIslamicEvents = (hijriMonth, hijriDay, fiqh = null) =>
  ISLAMIC_EVENTS.filter(
    (e) => e.month === hijriMonth && e.day === hijriDay && (!fiqh || e.tradition === "shared" || e.tradition === fiqh)
  );

/** A single representative event for compact UI (e.g. a dashboard chip),
 * picked by category priority when more than one event lands on the same day. */
export const getPrimaryIslamicEvent = (hijriMonth, hijriDay, fiqh = null) => {
  const matches = getIslamicEvents(hijriMonth, hijriDay, fiqh);
  if (!matches.length) return null;
  return [...matches].sort((a, b) => (CATEGORY_PRIORITY[a.category] ?? 9) - (CATEGORY_PRIORITY[b.category] ?? 9))[0];
};
