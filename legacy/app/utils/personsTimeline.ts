// Pure Prophetic Timeline logic (prophets-quran-feature.md §15). Kept
// dependency-free like the other app/utils/persons*.ts helpers.
//
// The main line is prophets with a known chronology.order, sorted ascending.
// Everyone else is attached as an expandable "branch" off whichever mainline
// prophet's OWN `relationships[]` names them (spec §15: "prevents the main
// timeline from becoming visually overloaded"). Branches are read from the
// prophet's outgoing relationships only, not inferred from the other
// person's relationships pointing back — a relationship's `relationshipType`
// (e.g. "father") is directional, and guessing its inverse ("son") for the
// reverse case is exactly the kind of unverified inference the feature spec
// prohibits (§3, §14). When a relationship matters from both sides (see
// Isa <-> Maryam in the seed dataset), it's recorded explicitly on both
// persons' `relationships[]` — same discipline as every other dataset fact
// here, not something this function should paper over automatically.
//
// Anyone left over (no chronology.order AND not named in any mainline
// prophet's relationships) is surfaced separately as "unlinked" rather than
// fabricating a placement for them.
import type { PersonRelationship, QuranPerson } from "~/data/quranPersons";

export type TimelineBranch = PersonRelationship;

export interface TimelineNode {
  person: QuranPerson;
  branches: TimelineBranch[];
}

export interface Timeline {
  mainline: TimelineNode[];
  unlinked: QuranPerson[];
}

const isMainline = (p: QuranPerson) => p.primaryCategory === "prophet" && p.chronology?.order != null;

const branchesForProphet = (prophet: QuranPerson, mainlineIds: Set<string>): TimelineBranch[] =>
  (prophet.relationships ?? []).filter((rel) => !mainlineIds.has(rel.personId));

export const buildTimeline = (persons: QuranPerson[]): Timeline => {
  const mainlinePersons = persons
    .filter(isMainline)
    .sort((a, b) => (a.chronology!.order as number) - (b.chronology!.order as number));
  const mainlineIds = new Set(mainlinePersons.map((p) => p.id));

  const branchedIds = new Set<string>();
  const mainline: TimelineNode[] = mainlinePersons.map((person) => {
    const branches = branchesForProphet(person, mainlineIds);
    branches.forEach((b) => branchedIds.add(b.personId));
    return { person, branches };
  });

  const unlinked = persons.filter((p) => !mainlineIds.has(p.id) && !branchedIds.has(p.id));

  return { mainline, unlinked };
};
