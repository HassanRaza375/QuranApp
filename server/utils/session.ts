// Phase 17: what every account, sync, avatar and admin route does first. The flag is read at request time (a route answers 404 while sync is off, as if
// it did not exist), the database must be configured (503 otherwise), and the user comes from the session cookie, never from the request body.
import type { EventHandlerRequest, EventHandlerResponse, H3Event } from "h3";
import { createError, isError, setHeader, setResponseStatus } from "h3";
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

/**
 * Every account, sync, avatar and admin route is wrapped in this. A refusal thrown by a guard (404 while the flag is off, 401, 429 ...) is answered as JSON
 * whatever the request accepts: h3 would otherwise answer a browser navigation (Accept: text/html) with an HTML error page, and an /api/ address must never
 * answer HTML (e2e/apiServiceWorker.spec.ts).
 */
export function apiHandler<T extends EventHandlerRequest = EventHandlerRequest, R extends EventHandlerResponse = EventHandlerResponse>(fn: (event: H3Event<T>) => R | Promise<R>) {
  return defineEventHandler<T>(async (event) => {
    try {
      return await fn(event);
    } catch (e) {
      if (!isError(e)) throw e;
      setResponseStatus(event, e.statusCode);
      setHeader(event, "content-type", "application/json; charset=utf-8");
      setHeader(event, "cache-control", "no-store");
      return (e.data as object | undefined) ?? { error: "error" };
    }
  });
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
