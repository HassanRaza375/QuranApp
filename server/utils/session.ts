// Phase 17: what every account, sync, avatar and admin route does first. The flag is read at request time (a route answers 404 while sync is off, as if
// it did not exist), the database must be configured (503 otherwise), and the user comes from the session cookie, never from the request body.
import type { H3Event } from "h3";
import { createError } from "h3";
import { isSyncOn } from "../../app/lib/sync/flag";
import { useAuth } from "./auth";
import { hasDatabase } from "./db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarPublicId?: string | null;
  avatarVersion?: number | null;
}

export const syncOn = (event: H3Event): boolean => isSyncOn(useRuntimeConfig(event).public.syncEnabled);

/** 404 while the flag is off; 503 with no database. Call first in every route that is part of Account & Sync. */
export function requireEnabled(event: H3Event): void {
  if (!syncOn(event)) throw createError({ statusCode: 404, statusMessage: "Not found", data: { error: "not_found" } });
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: "Unavailable", data: { error: "unavailable" } });
}

/** The signed-in user, or 401. */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  requireEnabled(event);
  const session = await useAuth().api.getSession({ headers: event.headers });
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: "Unauthorized", data: { error: "unauthorized" } });
  return session.user as unknown as SessionUser;
}

/** The signed-in super admin, or 401 (no session) / 404 (a session that is not a super admin: the page's existence is not confirmed). */
export async function requireSuperAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event);
  if (user.role !== "superadmin") throw createError({ statusCode: 404, statusMessage: "Not found", data: { error: "not_found" } });
  return user;
}
