// Phase 17C: what the server accepts and what the client sends. One entry per namespace: its category (the three toggles), how two devices' edits of one
// record are merged, and the Zod schema of its payload. Shared by the server routes and the browser, so it has no Nuxt imports (Vitest runs it).
//
// Payloads of the legacy objects (goals, Hifz states, reminders, collections, notes) use `looseObject`: the fields that the app relies on are checked, and
// every other field is kept as it is, because a rollback to the legacy app must still read what sync wrote (CLAUDE.md rule 4).
import { z } from "zod";

export type Category = "library" | "progress" | "settings";
/** how two devices' edits of one record are combined (see merge.ts) */
export type MergeKind = "lww" | "presence" | "words" | "story" | "tasbeeh" | "dayLog" | "activity";

export interface NamespaceDef {
  category: Category | "account";
  merge: MergeKind;
  schema: z.ZodType;
  /** an extra check on the record key (for example 1 to 114 for a surah) */
  key?: (key: string) => boolean;
}

const int = z.number().int().min(0);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ayahKey = z.string().regex(/^\d{1,3}:\d{1,3}$/);
const text = (max: number) => z.string().max(max);
const inRange = (lo: number, hi: number) => (k: string) => /^\d{1,3}$/.test(k) && Number(k) >= lo && Number(k) <= hi;
const isDate = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);

const goalTypes = ["finish-by-date", "ayahs-per-day", "pages-per-day", "juz-per-week", "custom"] as const;
const goalStatuses = ["active", "paused", "completed", "abandoned"] as const;

export const NAMESPACES: Record<string, NamespaceDef> = {
  // ---- Library
  "library.item": { category: "library", merge: "presence", schema: z.strictObject({ addedAt: int }) },
  "library.meta": { category: "library", merge: "lww", schema: z.looseObject({ note: text(10_000), tags: z.array(text(50)).max(50), collectionIds: z.array(text(100)).max(100), updatedAt: z.number() }) },
  "library.collection": { category: "library", merge: "presence", schema: z.looseObject({ id: text(100), name: z.string().min(1).max(80), description: text(500), createdAt: z.number() }) },
  "library.rest": { category: "library", merge: "lww", schema: z.record(z.string(), z.json()) },
  // ---- Progress
  "progress.lastRead": { category: "progress", merge: "lww", schema: z.looseObject({ surahNo: z.number().int().min(1).max(114), ayahNo: z.number().int().min(1), updatedAt: z.number() }) },
  "progress.readSurah": { category: "progress", merge: "presence", schema: z.looseObject({ completedAt: z.number() }), key: inRange(1, 114) },
  "progress.pin": { category: "progress", merge: "presence", schema: z.looseObject({}), key: (k) => k === "reading" || k === "page" },
  "progress.goal": { category: "progress", merge: "presence", schema: z.looseObject({ id: text(100), type: z.enum(goalTypes), status: z.enum(goalStatuses) }) },
  "progress.goalActive": { category: "progress", merge: "lww", schema: z.strictObject({ id: z.string().max(100).nullable() }) },
  "progress.goalLog": { category: "progress", merge: "dayLog", schema: z.strictObject({ ayahs: z.array(ayahKey).max(6236) }), key: isDate },
  "progress.hifzTarget": { category: "progress", merge: "presence", schema: z.looseObject({ id: text(100) }) },
  "progress.hifzAyah": { category: "progress", merge: "presence", schema: z.looseObject({ key: text(120) }) },
  "progress.hifzJoin": { category: "progress", merge: "presence", schema: z.looseObject({ key: text(120) }) },
  "progress.hifzActivity": { category: "progress", merge: "activity", schema: z.looseObject({ date }), key: isDate },
  "progress.hifzWords": { category: "progress", merge: "words", schema: z.record(z.string(), z.looseObject({})), key: (k) => ayahKey.safeParse(k).success },
  "progress.tasbeeh": { category: "progress", merge: "tasbeeh", schema: z.looseObject({ count: int, target: int, cycles: int, lifetime: int.optional() }) },
  "progress.story": { category: "progress", merge: "story", schema: z.looseObject({ chapter: int, read: z.array(int).max(2000), updatedAt: z.number().optional() }) },
  "progress.personStudy": { category: "progress", merge: "lww", schema: z.looseObject({}) },
  "progress.ramadanStart": { category: "progress", merge: "lww", schema: z.strictObject({ startOverride: date.nullable() }), key: (k) => k === "singleton" },
  "progress.fast": { category: "progress", merge: "lww", schema: z.strictObject({ status: z.enum(["fasted", "missed", "planned"]) }), key: isDate },
  "progress.reminder": { category: "progress", merge: "presence", schema: z.looseObject({ id: text(100), title: text(500), date: text(40) }) },
  // ---- Settings: one record per setting, `{ raw }` for a key the legacy app stores as a plain string, `{ v }` for a JSON value
  settings: { category: "settings", merge: "lww", schema: z.union([z.strictObject({ raw: text(200) }), z.strictObject({ v: z.json() })]) },
  // ---- the toggles belong to the account, so every device follows them
  "account.categories": { category: "account", merge: "lww", schema: z.strictObject({ library: z.boolean(), progress: z.boolean(), settings: z.boolean() }), key: (k) => k === "singleton" },
};

export const NAMESPACE_NAMES = Object.keys(NAMESPACES);

export const LIMITS = {
  recordBytes: 16 * 1024,
  requestBytes: 256 * 1024,
  requestOps: 500,
  userBytes: 5 * 1024 * 1024,
  keyLength: 128,
  pullLimit: 500,
  pushesPerMinute: 30,
  pullsPerMinute: 60,
} as const;

export type ValidationFailure = "namespace" | "key" | "payload" | "size";

/** The size a payload counts for (its JSON, in bytes). */
export const payloadBytes = (payload: unknown): number => (payload == null ? 0 : new TextEncoder().encode(JSON.stringify(payload)).length);

/** Checks one op's namespace, key and payload (a null payload is a tombstone). Null when it is acceptable, else the reason. */
export function validateOp(namespace: string, recordKey: string, payload: unknown): ValidationFailure | null {
  const def = NAMESPACES[namespace];
  if (!def || !Object.prototype.hasOwnProperty.call(NAMESPACES, namespace)) return "namespace";
  if (typeof recordKey !== "string" || !recordKey.length || recordKey.length > LIMITS.keyLength) return "key";
  if (def.key && !def.key(recordKey)) return "key";
  if (payload === null) return null;
  if (!def.schema.safeParse(payload).success) return "payload";
  if (payloadBytes(payload) > LIMITS.recordBytes) return "size";
  return null;
}

export const categoryOf = (namespace: string): Category | "account" | null => NAMESPACES[namespace]?.category ?? null;
