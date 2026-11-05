// Phase 17A: the one Prisma client of a server instance, created on first use (never at import, so a route that does not need the
// database never opens a connection). Prisma 7 talks to PostgreSQL through the `pg` driver adapter.
//   - DATABASE_URL (and DATABASE_CA_CERT, the Aiven project CA as PEM text) are read from the environment at request time, never
//     through runtimeConfig: a value given to runtimeConfig at build time is written into the build output.
//   - The pool options, including TLS, come from `poolConfig` (server/utils/dbConfig.ts): max 1 connection per serverless instance (the
//     Aiven free plan allows 20 and has no pooler), connect and idle timeouts, and the CA when it is set.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { poolConfig } from "./dbConfig";

let client: PrismaClient | null = null;

/** True when this server has a database to talk to. */
export const hasDatabase = (): boolean => Boolean(process.env.DATABASE_URL);

/** The shared client. Throws when DATABASE_URL is not set (callers check `hasDatabase()` first) or the CA is not PEM text. */
export function useDb(): PrismaClient {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = new PrismaClient({ adapter: new PrismaPg(poolConfig(url, process.env.DATABASE_CA_CERT || undefined)) });
  return client;
}
