// Everything Home reads from the legacy storage keys (read-only), in one place: new versus returning, the two
// resume rows, today's goal, the Hifz tile. Nothing here writes.
import { goalToday, type GoalToday } from "~/lib/goalToday";
import { localDateKey } from "~/lib/dates";
import { latestStudy, readingRow, type ReadingRow } from "~/lib/resume";
import { latestProgress, newerOf, readAllProgress } from "~/lib/storyProgress";
import { todayKey } from "~/lib/hifz/engine";
import { practiceCount } from "~/lib/hifz/queue";
import { loadHifz } from "~/lib/hifz/store";
import { getJSON } from "~/lib/storage";
import { detectUserState, HISTORY_KEYS, type UserState } from "~/lib/userState";

export interface StudyRow {
  /** which source this row is from: the latest person study or the latest story progress (whichever is newer) */
  kind: "person" | "story";
  /** the person id, or the story id */
  personId: string;
  /** the second line of Home's row: the person's name, or "Chapter 3 of 4" */
  name: string;
  /** the first line after "You were reading:": the section, or the story title */
  sectionLabel: string;
  /** one line for the Library's Story slot */
  line: string;
  href: string;
  updatedAt: number;
}

export interface HomeState {
  user: UserState;
  reading: ReadingRow | null;
  study: StudyRow | null;
  goal: GoalToday | null;
  hifz: "none" | "has-data";
  /** how many ayahs are in today's Hifz plan (0 when nothing is due, or no Hifz data) */
  hifzDue: number;
}

/** Today's Hifz plan size; a damaged record is 0, never an error on Home. */
function hifzDue(): number {
  try {
    return practiceCount(loadHifz().data, todayKey());
  } catch {
    return 0;
  }
}

export const useHomeState = () => {
  const state = useState<HomeState | null>("home-state", () => null);

  async function load() {
    const read = (k: string) => getJSON<unknown>(k, null);
    const user = detectUserState(read);
    const { AYAH_LENGTHS } = await import("~/data/ayahLengths.generated");
    const reading = readingRow(read(HISTORY_KEYS.readingProgress), AYAH_LENGTHS.map((s) => s.length));

    let person: StudyRow | null = null;
    const latest = latestStudy(read(HISTORY_KEYS.personsStudy));
    if (latest) {
      // The people dataset and the section names are only loaded when there is something to resume.
      const [{ QURAN_PERSONS }, { SECTION_LABELS }] = await Promise.all([import("@legacy/data/quranPersons"), import("@legacy/utils/personStudy")]);
      const found = QURAN_PERSONS.find((p) => p.id === latest.personId);
      if (found) {
        const section = (SECTION_LABELS as Record<string, string>)[latest.lastSection] ?? latest.lastSection;
        person = { kind: "person", personId: found.id, name: found.name, sectionLabel: section, line: `${found.name}: ${section}`, href: `/persons/${found.id}`, updatedAt: latest.updatedAt };
      }
    }

    // Story progress (new, `quran:story-progress:v1`): only the story data is loaded, and only when there is progress.
    let story: StudyRow | null = null;
    const progress = readAllProgress();
    if (Object.keys(progress).length) {
      const { storyById, chaptersOf } = await import("~/lib/stories");
      const best = latestProgress(progress, (id) => {
        const s = storyById(id);
        return s ? chaptersOf(s).length : undefined;
      });
      if (best) {
        const s = storyById(best.id)!;
        const finished = best.progress.chapter >= best.total;
        const where = finished ? "Finished" : `Chapter ${best.progress.chapter + 1} of ${best.total}`;
        story = { kind: "story", personId: best.id, name: where, sectionLabel: s.title, line: `${s.title}: ${where}`, href: `/stories/${best.id}${finished ? "?chapter=end" : best.progress.chapter === 0 ? "" : `?chapter=${best.progress.chapter + 1}`}`, updatedAt: best.progress.updatedAt };
      }
    }
    const study = newerOf(person, story)?.value ?? null;

    state.value = {
      user,
      reading,
      study,
      goal: goalToday(read(HISTORY_KEYS.readingGoals), localDateKey(new Date()), read(HISTORY_KEYS.readingProgress)),
      hifz: user.has.hifz ? "has-data" : "none",
      hifzDue: user.has.hifz ? hifzDue() : 0,
    };
  }

  return { state, load };
};
