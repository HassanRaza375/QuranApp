// The editions the ayah search can look in. These are the identifiers of the upstream search API (alquran.cloud) and the names the legacy
// page offered, the same ten in the same four groups; tests/searchEditions.test.ts compares them with the vendored legacy list. The text
// of a result and the name of its edition come from the response itself, never from this file.
//
// The default English edition is the legacy one (Pickthall). The reader's own English text is not any of the API's English editions
// (checked 2026-10-22, docs/DECISIONS.md), so no result may be labelled with the reader's translator; every result names its own edition.

export type EditionGroup = "english" | "urdu" | "arabic" | "tafsir";

export interface SearchEdition {
  id: string;
  title: string;
  group: EditionGroup;
}

export const EDITION_GROUPS: ReadonlyArray<{ value: EditionGroup; label: string }> = [
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
  { value: "arabic", label: "Arabic (Quran text)" },
  { value: "tafsir", label: "Arabic Tafsir" },
];

export const SEARCH_EDITIONS: ReadonlyArray<SearchEdition> = [
  { id: "en.pickthall", title: "Pickthall", group: "english" },
  { id: "en.yusufali", title: "Yusuf Ali", group: "english" },
  { id: "en.asad", title: "Muhammad Asad", group: "english" },
  { id: "ur.jalandhry", title: "Jalandhry", group: "urdu" },
  { id: "ur.maududi", title: "Maududi", group: "urdu" },
  { id: "quran-simple", title: "Arabic Quran Text", group: "arabic" },
  { id: "ar.muyassar", title: "Tafsir Muyassar", group: "tafsir" },
  { id: "ar.jalalayn", title: "Tafsir Al-Jalalayn", group: "tafsir" },
  { id: "ar.qurtubi", title: "Tafsir Al-Qurtubi", group: "tafsir" },
  { id: "ar.baghawi", title: "Tafsir Al-Baghawi", group: "tafsir" },
];

export const DEFAULT_GROUP: EditionGroup = "english";
/** The first edition of each group, as in the legacy page (changing the group picked its first edition). */
export const DEFAULT_EDITION: Record<EditionGroup, string> = { english: "en.pickthall", urdu: "ur.jalandhry", arabic: "quran-simple", tafsir: "ar.muyassar" };

export const editionsIn = (group: EditionGroup): SearchEdition[] => SEARCH_EDITIONS.filter((e) => e.group === group);
export const editionById = (id: string): SearchEdition | undefined => SEARCH_EDITIONS.find((e) => e.id === id);
export const isEditionGroup = (v: unknown): v is EditionGroup => EDITION_GROUPS.some((g) => g.value === v);
/** Arabic, Urdu and tafsir text runs right to left. */
export const isRtlGroup = (g: EditionGroup): boolean => g !== "english";

/** How the Ayahs group names the edition it searched: "English: Pickthall", "Urdu: Jalandhry", "Arabic: Quran text", "Tafsir: Muyassar". */
export function editionLabel(id: string): string | undefined {
  const e = editionById(id);
  if (!e) return undefined;
  if (e.group === "english") return `English: ${e.title}`;
  if (e.group === "urdu") return `Urdu: ${e.title}`;
  if (e.group === "arabic") return "Arabic: Quran text";
  return `Tafsir: ${e.title.replace(/^Tafsir /, "")}`;
}
