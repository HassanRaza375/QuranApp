// Everything Home reads from the legacy storage keys (read-only), in one place: new versus returning, the two
// resume rows, today's goal, the Hifz tile. Nothing here writes.
import { goalToday, type GoalToday } from "~/lib/goalToday";
import { localDateKey } from "~/lib/dates";
import { latestStudy, readingRow, type ReadingRow } from "~/lib/resume";
import { getJSON } from "~/lib/storage";
import { detectUserState, HISTORY_KEYS, type UserState } from "~/lib/userState";

export interface StudyRow {
  personId: string;
  name: string;
  sectionLabel: string;
  href: string;
}

export interface HomeState {
  user: UserState;
  reading: ReadingRow | null;
  study: StudyRow | null;
  goal: GoalToday | null;
  hifz: "none" | "has-data";
}

export const useHomeState = () => {
  const state = useState<HomeState | null>("home-state", () => null);

  async function load() {
    const read = (k: string) => getJSON<unknown>(k, null);
    const user = detectUserState(read);
    const { AYAH_LENGTHS } = await import("~/data/ayahLengths.generated");
    const reading = readingRow(read(HISTORY_KEYS.readingProgress), AYAH_LENGTHS.map((s) => s.length));

    let study: StudyRow | null = null;
    const latest = latestStudy(read(HISTORY_KEYS.personsStudy));
    if (latest) {
      // The people dataset and the section names are only loaded when there is something to resume.
      const [{ QURAN_PERSONS }, { SECTION_LABELS }] = await Promise.all([import("@legacy/data/quranPersons"), import("@legacy/utils/personStudy")]);
      const person = QURAN_PERSONS.find((p) => p.id === latest.personId);
      if (person) {
        study = {
          personId: person.id,
          name: person.name,
          sectionLabel: (SECTION_LABELS as Record<string, string>)[latest.lastSection] ?? latest.lastSection,
          href: `/persons/${person.id}`,
        };
      }
    }

    state.value = {
      user,
      reading,
      study,
      goal: goalToday(read(HISTORY_KEYS.readingGoals), localDateKey(new Date())),
      hifz: user.has.hifz ? "has-data" : "none",
    };
  }

  return { state, load };
};
