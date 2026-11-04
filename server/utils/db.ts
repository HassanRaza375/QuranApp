// Phase 17A: the one Prisma client of a server instance, created on first use (never at import, so a route that does not need the
// database never opens a connection). Prisma 7 talks to PostgreSQL through the `pg` driver adapter.
//   - DATABASE_URL is read from the environment at request time, never through runtimeConfig: a value given to runtimeConfig at build
//     time is written into the build output.
//   - max: 1 per serverless instance (the Aiven free plan allows 20 connections and has no pooler); a short idle timeout gives the
//     connection back; `pg` has no connect timeout of its own, so a powered-off database would otherwise hang the request.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export const POOL = { max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000 } as const;

let client: PrismaClient | null = null;

/** True when this server has a database to talk to. */
export const hasDatabase = (): boolean => Boolean(process.env.DATABASE_URL);

/** The shared client. Throws when DATABASE_URL is not set (callers check `hasDatabase()` first). */
export function useDb(): PrismaClient {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  client = new PrismaClient({ adapter: new PrismaPg({ connectionString, ...POOL }) });
  return client;
}
