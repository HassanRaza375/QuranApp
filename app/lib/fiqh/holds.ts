// Rulings held behind a "Refer to his risala" pointer on top of the ones the legacy data already holds (`referToRisala`, `englishWithheld`).
//
// The legacy app's automated cross-language check left 66 rows (57 rulings, all Khamenei's) as "needs-human": the English and the Urdu differ in a number or a
// negation and there is no Persian original to decide with, so the legacy showed them as they were. You decided (2026-10-26) that this app holds them behind the
// pointer until a person has decided. The list is the set of (ruling, marja') pairs of those rows in the vendored fixture
// (legacy/tests/fixtures/wajibatMismatchDecisions.json); tests/fiqhData.test.ts fails if this list and the fixture ever disagree, so a decision recorded in the legacy
// data (a row that stops being "needs-human") shows up as a failing test and a deliberate edit here, never silently. Derived data, not typed religious content.
export const NEEDS_HUMAN_HOLDS: readonly string[] = [
  "asphalt|khamenei", "birddroppings|khamenei", "bleedingbeforenine|khamenei",
  "dogpig|khamenei", "followingthealam|khamenei", "ghusleventduring|khamenei",
  "haydduration|khamenei", "haydpregnancy|khamenei", "ihtiyatwajib|khamenei",
  "importedleather|khamenei", "impuritytransfer|khamenei", "istibradoubt|khamenei",
  "khqa337|khamenei", "khqa360|khamenei", "khqa364|khamenei",
  "khqa372|khamenei", "khqa382|khamenei", "khqa443|khamenei",
  "khqa454|khamenei", "khqa455|khamenei", "khqa456|khamenei",
  "khqa487|khamenei", "khqa498|khamenei", "khqa503|khamenei",
  "khqa515|khamenei", "khqa517|khamenei", "khqa518|khamenei",
  "khqa521|khamenei", "khqa536|khamenei", "khqa563|khamenei",
  "khqa574|khamenei", "khqa631|khamenei", "khqa637|khamenei",
  "khqa638|khamenei", "khqa741|khamenei", "khqa743|khamenei",
  "khqa749|khamenei", "khqa751|khamenei", "khqa758|khamenei",
  "khqa760|khamenei", "khqa764|khamenei", "khqa793|khamenei",
  "khqa809|khamenei", "khqa813|khamenei", "khqa834|khamenei",
  "khqa836|khamenei", "khqa841|khamenei", "kq288|khamenei",
  "learningrulings|khamenei", "personsrejecting|khamenei", "personsunknown|khamenei",
  "qiblaeffortqa|khamenei", "qiblanomeansqa|khamenei", "tayammuminvalidators|khamenei",
  "wuduimmersive|khamenei", "wuduobstruction|khamenei", "wudusocks|khamenei",
];

const SET = new Set(NEEDS_HUMAN_HOLDS);
export const isNeedsHumanHold = (rulingId: string, marjaId: string): boolean => SET.has(`${rulingId}|${marjaId}`);
