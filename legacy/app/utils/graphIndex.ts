// Knowledge Graph — read-only, in-memory traversal index (Phase 10 of
// quranic_knowledge_platform_phased_plan.md). This is an ADAPTER over the
// 9 existing datasets, not a rewrite: it reads their already-existing
// relationship fields and builds a queryable index. The 9 datasets remain
// the sole source of truth and are never modified by this file.
//
// ============================================================
// ARCHITECTURE — stored vs. derived_reverse (approved Phase 10 decision)
// ============================================================
// Every edge is tagged `direction: "stored"` (the source dataset
// physically declares this relationship) or `direction: "derived_reverse"`
// (the index computed it by inverting a stored edge — no dataset
// declares it in that direction). A derived_reverse edge is NEVER
// presented as though its target dataset explicitly declared it; its
// `basis` is copied read-only from the originating stored edge, never
// re-derived from the reverse-direction entity's own fields (which could
// be a different, stronger claim than the original actually supports).
//
// ============================================================
// CRITICAL — PersonRelationship is never auto-reversed
// ============================================================
// Person→Person, Community→Person, and Place→Person edges come from the
// existing `PersonRelationship[]` arrays (`relationships` field, reused
// verbatim across Persons/Peoples/Places since Phase 1-3). Each direction
// of a family/associative relationship is INDEPENDENTLY hand-authored in
// this codebase already (see e.g. Ibrahim's "ismail: father" and
// Isma'il's own separate "ibrahim: son" entries) — inverting one
// mechanically would either duplicate an existing independently-graded
// entry or fabricate a claim with invented source/verification metadata
// the dataset never stated. This builder tags every such edge
// `relationship: "family_relation"` and categorically excludes it from
// reverse-derivation, regardless of whether a stored reverse exists.
//
// ============================================================
// DEDUPLICATION — the Event <-> Sign special case
// ============================================================
// Events already declare `signIds` (Phase 8) and Signs already declare
// `eventIds` (Phase 7) — this ONE relationship is already physically
// reciprocal in the data. Both directions are extracted as their own
// `stored` edges (Event->Sign via signIds, Sign->Event via eventIds).
// The general reverse-derivation pass checks, for every stored edge
// (A->B), whether a stored edge already exists for (B->A) — for ANY
// relationship type — before deriving a reverse; if one already exists,
// no derived_reverse edge is added, preventing a duplicate.
import { QURAN_PERSONS, type QuranPerson, type PersonRelationship } from "~/data/quranPersons";
import { QURAN_COMMUNITIES, type QuranCommunity } from "~/data/quranPeoples";
import { QURAN_PLACES, type QuranPlace } from "~/data/quranPlaces";
import { QURAN_STORIES, type QuranStory } from "~/data/quranStories";
import { QURAN_THEMES, type QuranTheme } from "~/data/quranThemes";
import { QURAN_DUAS, type QuranDua } from "~/data/quranDuas";
import { QURAN_EVENTS, type QuranEvent } from "~/data/quranEvents";
import { QURAN_SIGNS, type QuranSign } from "~/data/quranSigns";
import { QURAN_COMMANDS, type QuranCommand } from "~/data/quranCommands";

export type EntityModule =
  | "persons"
  | "peoples"
  | "places"
  | "stories"
  | "themes"
  | "duas"
  | "events"
  | "signs"
  | "commands";

const ENTITY_MODULES: EntityModule[] = [
  "persons", "peoples", "places", "stories", "themes", "duas", "events", "signs", "commands",
];

export type EntityRef = {
  module: EntityModule;
  id: string;
};

/** Controlled relationship vocabulary — every value corresponds to an
 * actual field/semantic already present in the 9 datasets (see this
 * file's own audit trail); nothing here is invented for the graph. */
export type RelationshipType =
  | "features_person" // entity's account involves this Person
  | "features_community" // entity's account involves this Peoples & Nations community
  | "occurred_at" // entity is associated with / located at this Place
  | "narrated_in" // entity is part of / expressed within this Story's narrative
  | "illustrates_theme" // entity is a concrete instance of this Theme
  | "expressed_in_dua" // entity connects to this specific Dua
  | "concerns_event" // this Sign/Command relates to a specific Event occurrence
  | "occurred_as_sign" // this Event is also catalogued as a Sign/Miracle
  | "related_entity" // same-module cross-reference (Story<->Story, Theme<->Theme, Event<->Event, Place<->Place)
  | "family_relation"; // the existing PersonRelationship.relationshipType (father, spouse, opponent, ...) — never auto-reversed

export type EdgeDirection = "stored" | "derived_reverse";

export type GraphEdge = {
  from: EntityRef;
  to: EntityRef;
  relationship: RelationshipType;
  direction: EdgeDirection;
  /** Read-only provenance copied from the originating stored edge's
   * source entity (its own sourceBasis/conceptualBasis/identificationBasis
   * field, or the specific PersonRelationship's own sourceType +
   * verificationStatus for family_relation edges). Never re-derived from
   * the reverse-direction entity, and never upgraded in authority when
   * copied onto a derived_reverse edge. */
  basis?: string;
};

export type GraphIndex = {
  nodes: Map<string, EntityRef>;
  edgesByNode: Map<string, GraphEdge[]>;
};

export interface GraphValidationIssue {
  message: string;
}

const key = (ref: EntityRef): string => `${ref.module}:${ref.id}`;

const isValidModule = (m: string): m is EntityModule => (ENTITY_MODULES as string[]).includes(m);

/** Best-effort, generic provenance extraction — tries the common
 * entity-level source-basis field names used across the 9 datasets, in
 * order, without hardcoding a per-module branch for each. Returns
 * undefined (not a guess) when no such field exists on this entity type
 * (e.g. Stories carries no entity-level sourceBasis — only per-lesson
 * `basis` — so Story-sourced edges legitimately have no `basis`). */
const genericBasis = (entity: Record<string, unknown>): string | undefined => {
  const candidates = ["sourceBasis", "conceptualBasis", "identificationBasis"];
  for (const field of candidates) {
    const value = entity[field];
    if (typeof value === "string") return value;
  }
  return undefined;
};

const familyRelationBasis = (rel: PersonRelationship): string =>
  `${rel.relationshipType} — ${rel.sourceType}, ${rel.verificationStatus}`;

type RawEdge = {
  fromModule: EntityModule;
  fromId: string;
  toModule: EntityModule;
  toId: string;
  relationship: RelationshipType;
  basis?: string;
};

const relationshipForTarget = (fromModule: EntityModule, toModule: EntityModule): RelationshipType => {
  if (fromModule === toModule) return "related_entity";
  switch (toModule) {
    case "persons":
      return "features_person";
    case "peoples":
      return "features_community";
    case "places":
      return "occurred_at";
    case "stories":
      return "narrated_in";
    case "themes":
      return "illustrates_theme";
    case "duas":
      return "expressed_in_dua";
    case "events":
      return "concerns_event";
    case "signs":
      return "occurred_as_sign";
    default:
      return "related_entity";
  }
};

const pushEdge = (
  out: RawEdge[],
  fromModule: EntityModule,
  fromId: string,
  toModule: EntityModule,
  toId: string | undefined,
  basis: string | undefined,
  issues: GraphValidationIssue[]
) => {
  if (!toId) return;
  if (fromModule === toModule && fromId === toId) {
    issues.push({ message: `self-link rejected: ${fromModule}:${fromId} -> itself` });
    return;
  }
  out.push({
    fromModule,
    fromId,
    toModule,
    toId,
    relationship: relationshipForTarget(fromModule, toModule),
    basis,
  });
};

const pushIdArray = (
  out: RawEdge[],
  fromModule: EntityModule,
  fromId: string,
  toModule: EntityModule,
  ids: string[] | undefined,
  basis: string | undefined,
  issues: GraphValidationIssue[]
) => {
  if (!ids?.length) return;
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({ message: `duplicate id "${id}" within a relationship array on ${fromModule}:${fromId} -> ${toModule}` });
      continue;
    }
    seen.add(id);
    pushEdge(out, fromModule, fromId, toModule, id, basis, issues);
  }
};

const pushFamilyRelations = (
  out: RawEdge[],
  fromModule: EntityModule,
  fromId: string,
  relationships: PersonRelationship[] | undefined,
  issues: GraphValidationIssue[]
) => {
  if (!relationships?.length) return;
  for (const rel of relationships) {
    if (!rel.personId) continue;
    if (fromModule === "persons" && rel.personId === fromId) {
      issues.push({ message: `self-link rejected: persons:${fromId} -> itself (family_relation)` });
      continue;
    }
    out.push({
      fromModule,
      fromId,
      toModule: "persons",
      toId: rel.personId,
      relationship: "family_relation",
      basis: familyRelationBasis(rel),
    });
  }
};

/** Extracts every STORED edge declared by the 9 datasets. This is the
 * only function that knows each dataset's own field names — everything
 * downstream works generically off the resulting RawEdge list. */
const extractStoredEdges = (issues: GraphValidationIssue[]): RawEdge[] => {
  const out: RawEdge[] = [];

  for (const p of QURAN_PERSONS as QuranPerson[]) {
    pushFamilyRelations(out, "persons", p.id, p.relationships, issues);
  }

  for (const c of QURAN_COMMUNITIES as QuranCommunity[]) {
    pushFamilyRelations(out, "peoples", c.id, c.relationships, issues);
    pushIdArray(out, "peoples", c.id, "places", c.relatedPlaceIds, genericBasis(c), issues);
  }

  for (const pl of QURAN_PLACES as QuranPlace[]) {
    pushFamilyRelations(out, "places", pl.id, pl.relationships, issues);
    pushIdArray(out, "places", pl.id, "peoples", pl.associatedCommunityIds, genericBasis(pl), issues);
    pushIdArray(out, "places", pl.id, "places", pl.relatedPlaceIds, genericBasis(pl), issues);
  }

  for (const s of QURAN_STORIES as QuranStory[]) {
    const basis = genericBasis(s);
    pushIdArray(out, "stories", s.id, "persons", s.personIds, basis, issues);
    pushIdArray(out, "stories", s.id, "peoples", s.communityIds, basis, issues);
    pushIdArray(out, "stories", s.id, "places", s.placeIds, basis, issues);
    pushIdArray(out, "stories", s.id, "stories", s.relatedStoryIds, basis, issues);
  }

  for (const t of QURAN_THEMES as QuranTheme[]) {
    const basis = genericBasis(t);
    pushIdArray(out, "themes", t.id, "stories", t.storyIds, basis, issues);
    pushIdArray(out, "themes", t.id, "persons", t.personIds, basis, issues);
    pushIdArray(out, "themes", t.id, "peoples", t.communityIds, basis, issues);
    pushIdArray(out, "themes", t.id, "places", t.placeIds, basis, issues);
    pushIdArray(out, "themes", t.id, "themes", t.relatedThemeIds, basis, issues);
  }

  for (const d of QURAN_DUAS as QuranDua[]) {
    const basis = genericBasis(d);
    pushEdge(out, "duas", d.id, "persons", d.personId, basis, issues);
    pushEdge(out, "duas", d.id, "stories", d.storyId, basis, issues);
    pushIdArray(out, "duas", d.id, "themes", d.themeIds, basis, issues);
    pushIdArray(out, "duas", d.id, "peoples", d.communityIds, basis, issues);
    pushIdArray(out, "duas", d.id, "places", d.placeIds, basis, issues);
  }

  for (const e of QURAN_EVENTS as QuranEvent[]) {
    const basis = genericBasis(e);
    pushIdArray(out, "events", e.id, "persons", e.personIds, basis, issues);
    pushIdArray(out, "events", e.id, "peoples", e.communityIds, basis, issues);
    pushIdArray(out, "events", e.id, "places", e.placeIds, basis, issues);
    pushIdArray(out, "events", e.id, "stories", e.storyIds, basis, issues);
    pushIdArray(out, "events", e.id, "themes", e.themeIds, basis, issues);
    pushIdArray(out, "events", e.id, "duas", e.duaIds, basis, issues);
    pushIdArray(out, "events", e.id, "events", e.relatedEventIds, basis, issues);
    pushIdArray(out, "events", e.id, "signs", e.signIds, basis, issues);
    if (e.relativeChronology?.duringPersonId) {
      pushEdge(out, "events", e.id, "persons", e.relativeChronology.duringPersonId, basis, issues);
    }
    if (e.relativeChronology?.beforeEventId) {
      pushEdge(out, "events", e.id, "events", e.relativeChronology.beforeEventId, basis, issues);
    }
    if (e.relativeChronology?.afterEventId) {
      pushEdge(out, "events", e.id, "events", e.relativeChronology.afterEventId, basis, issues);
    }
  }

  for (const s of QURAN_SIGNS as QuranSign[]) {
    const basis = genericBasis(s);
    pushIdArray(out, "signs", s.id, "persons", s.personIds, basis, issues);
    pushIdArray(out, "signs", s.id, "peoples", s.communityIds, basis, issues);
    pushIdArray(out, "signs", s.id, "places", s.placeIds, basis, issues);
    pushIdArray(out, "signs", s.id, "stories", s.storyIds, basis, issues);
    pushIdArray(out, "signs", s.id, "themes", s.themeIds, basis, issues);
    pushIdArray(out, "signs", s.id, "duas", s.duaIds, basis, issues);
    pushIdArray(out, "signs", s.id, "events", s.eventIds, basis, issues);
  }

  for (const c of QURAN_COMMANDS as QuranCommand[]) {
    const basis = genericBasis(c);
    pushIdArray(out, "commands", c.id, "persons", c.personIds, basis, issues);
    pushIdArray(out, "commands", c.id, "peoples", c.communityIds, basis, issues);
    pushIdArray(out, "commands", c.id, "places", c.placeIds, basis, issues);
    pushIdArray(out, "commands", c.id, "stories", c.storyIds, basis, issues);
    pushIdArray(out, "commands", c.id, "events", c.eventIds, basis, issues);
    pushIdArray(out, "commands", c.id, "signs", c.signIds, basis, issues);
    pushIdArray(out, "commands", c.id, "themes", c.themeIds, basis, issues);
    pushIdArray(out, "commands", c.id, "duas", c.duaIds, basis, issues);
  }

  return out;
};

const MODULE_LOOKUPS: Record<EntityModule, (id: string) => unknown> = {
  persons: (id) => (QURAN_PERSONS as QuranPerson[]).find((p) => p.id === id),
  peoples: (id) => (QURAN_COMMUNITIES as QuranCommunity[]).find((c) => c.id === id),
  places: (id) => (QURAN_PLACES as QuranPlace[]).find((p) => p.id === id),
  stories: (id) => (QURAN_STORIES as QuranStory[]).find((s) => s.id === id),
  themes: (id) => (QURAN_THEMES as QuranTheme[]).find((t) => t.id === id),
  duas: (id) => (QURAN_DUAS as QuranDua[]).find((d) => d.id === id),
  events: (id) => (QURAN_EVENTS as QuranEvent[]).find((e) => e.id === id),
  signs: (id) => (QURAN_SIGNS as QuranSign[]).find((s) => s.id === id),
  commands: (id) => (QURAN_COMMANDS as QuranCommand[]).find((c) => c.id === id),
};

let cachedIndex: { index: GraphIndex; issues: GraphValidationIssue[] } | null = null;

export const buildGraphIndex = (): { index: GraphIndex; issues: GraphValidationIssue[] } => {
  const issues: GraphValidationIssue[] = [];
  const nodes = new Map<string, EntityRef>();

  for (const module of ENTITY_MODULES) {
    const lookup = MODULE_LOOKUPS[module];
    const arrays: Record<EntityModule, unknown[]> = {
      persons: QURAN_PERSONS, peoples: QURAN_COMMUNITIES, places: QURAN_PLACES,
      stories: QURAN_STORIES, themes: QURAN_THEMES, duas: QURAN_DUAS,
      events: QURAN_EVENTS, signs: QURAN_SIGNS, commands: QURAN_COMMANDS,
    };
    for (const entity of arrays[module] as { id: string }[]) {
      const ref: EntityRef = { module, id: entity.id };
      const k = key(ref);
      if (nodes.has(k)) {
        issues.push({ message: `duplicate node key "${k}"` });
        continue;
      }
      nodes.set(k, ref);
      if (!lookup(entity.id)) {
        issues.push({ message: `node "${k}" failed self-lookup — inconsistent dataset` });
      }
    }
  }

  const rawEdges = extractStoredEdges(issues);

  // Validate every raw edge's endpoints and module names before turning
  // them into graph edges — invalid references are reported, not
  // silently dropped.
  const validEdges: RawEdge[] = [];
  for (const re of rawEdges) {
    if (!isValidModule(re.fromModule) || !isValidModule(re.toModule)) {
      issues.push({ message: `invalid module in edge ${re.fromModule}:${re.fromId} -> ${re.toModule}:${re.toId}` });
      continue;
    }
    const fromKey = `${re.fromModule}:${re.fromId}`;
    const toKey = `${re.toModule}:${re.toId}`;
    if (!nodes.has(fromKey)) {
      issues.push({ message: `edge source does not resolve: "${fromKey}"` });
      continue;
    }
    if (!nodes.has(toKey)) {
      issues.push({ message: `edge target does not resolve: "${toKey}" (referenced from ${fromKey})` });
      continue;
    }
    validEdges.push(re);
  }

  // Build the stored-edge set, keyed by (fromKey, toKey, relationship) to
  // detect exact duplicate edges, and separately keyed by (fromKey,
  // toKey) to drive reverse-derivation dedup regardless of relationship
  // label (this is what prevents Event<->Sign from getting a duplicated
  // third/fourth edge).
  const edgesByNode = new Map<string, GraphEdge[]>();
  const exactEdgeSeen = new Set<string>();
  const storedPairSeen = new Set<string>();

  const addEdge = (edge: GraphEdge) => {
    const fromKey = key(edge.from);
    const list = edgesByNode.get(fromKey) ?? [];
    list.push(edge);
    edgesByNode.set(fromKey, list);
  };

  for (const re of validEdges) {
    const from: EntityRef = { module: re.fromModule, id: re.fromId };
    const to: EntityRef = { module: re.toModule, id: re.toId };
    const fromKey = key(from);
    const toKey = key(to);
    // basis is part of the dedup key, not just (from,to,relationship): two
    // PersonRelationship entries between the same pair with different
    // relationshipType/sourceType (e.g. Abu Lahab -> Muhammad: "opponent"
    // per the Qur'an, AND separately "other" per tradition) are distinct,
    // independently-graded claims, not duplicates — collapsing them on
    // relationship type alone would silently drop real data. A true
    // duplicate (identical from/to/relationship/basis, e.g. an event's
    // relativeChronology.duringPersonId repeating someone already in its
    // own personIds with the same entity-level basis) still collapses
    // correctly, since basis matches too in that case.
    const exactId = `${fromKey}|${toKey}|${re.relationship}|${re.basis ?? ""}`;
    if (exactEdgeSeen.has(exactId)) {
      issues.push({ message: `duplicate edge suppressed: ${exactId}` });
      continue;
    }
    exactEdgeSeen.add(exactId);
    storedPairSeen.add(`${fromKey}|${toKey}`);
    addEdge({ from, to, relationship: re.relationship, direction: "stored", basis: re.basis });
  }

  // Reverse-derivation pass — skip family_relation entirely, and skip
  // any pair that already has a stored edge in that reverse direction
  // (the Event<->Sign case, and any future case shaped the same way).
  for (const re of validEdges) {
    if (re.relationship === "family_relation") continue;
    const from: EntityRef = { module: re.fromModule, id: re.fromId };
    const to: EntityRef = { module: re.toModule, id: re.toId };
    const fromKey = key(from);
    const toKey = key(to);
    const reversePairId = `${toKey}|${fromKey}`;
    if (storedPairSeen.has(reversePairId)) continue; // already stored in that direction
    addEdge({ from: to, to: from, relationship: re.relationship, direction: "derived_reverse", basis: re.basis });
  }

  const index: GraphIndex = { nodes, edgesByNode };
  return { index, issues };
};

const getIndex = (): { index: GraphIndex; issues: GraphValidationIssue[] } => {
  if (!cachedIndex) cachedIndex = buildGraphIndex();
  return cachedIndex;
};

/** Resolves a compound {module}:{id} reference to its underlying dataset
 * entity — a thin wrapper over the 9 existing get{X}ById functions. */
export const getEntity = (ref: EntityRef): unknown | undefined => {
  const lookup = MODULE_LOOKUPS[ref.module];
  return lookup ? lookup(ref.id) : undefined;
};

/** All edges (stored + derived_reverse) touching this entity, optionally
 * filtered to one relationship type. */
export const getRelatedEntities = (ref: EntityRef, relationshipType?: RelationshipType): GraphEdge[] => {
  const { index } = getIndex();
  const edges = index.edgesByNode.get(key(ref)) ?? [];
  return relationshipType ? edges.filter((e) => e.relationship === relationshipType) : edges;
};

/** All edges touching this entity whose OTHER end belongs to the given
 * target module — the primary function the UI's grouped-by-module
 * "Related Entities" section uses. */
export const getNeighborsByType = (ref: EntityRef, targetModule: EntityModule): GraphEdge[] =>
  getRelatedEntities(ref).filter((e) => e.to.module === targetModule);

export const __resetGraphIndexForTests = () => {
  cachedIndex = null;
};
