// AlAdhan calculation-method params per fiqh, shared by the prayer store
// (daily timings) and the Islamic calendar page, so both stay consistent
// when the user switches method in Settings.
//
// sunni: method 2 = Islamic Society of North America (ISNA) — unchanged default.
// jafari: method 0 = Shia Ithna-Ashari (Leva Institute, Qum), school 0,
// midnightMode 1 = Jafari midnight (mid-sunset to Fajr).
export const FIQH_PARAMS = {
  sunni: { method: 2 },
  jafari: { method: 0, school: 0, midnightMode: 1 },
};

export const FIQH_OPTIONS = [
  { value: "sunni", title: "Sunni", subtitle: "ISNA calculation method" },
  {
    value: "jafari",
    title: "Shia (Ja'fari)",
    subtitle: "Shia Ithna-Ashari — Leva Institute, Qum",
  },
];
