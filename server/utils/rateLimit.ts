// Phase 17C: a fixed-window counter in the database (the `RateLimit` table Better Auth also uses), for the sync routes. In one statement: start a new
// window when the old one has ended, else count up; so two requests at once cannot both slip under the limit.
import { useDb } from "./db";

/** true when this request is allowed. `key` is for example `sync:push:<userId>`. */
export async function allowRequest(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const rows = await useDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest") VALUES (${key}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN ${now} - "RateLimit"."lastRequest" > ${windowMs} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN ${now} - "RateLimit"."lastRequest" > ${windowMs} THEN ${now} ELSE "RateLimit"."lastRequest" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? 1) <= max;
}
