// Prisma 7 CLI configuration (Phase 17A). Prisma 7 does not load .env itself; Node's own loader does it here, for the developer's
// `prisma migrate` commands only, and never overrides a variable that is already set. `prisma generate` needs no database, so a
// missing DATABASE_URL is allowed (a clean `npm ci` on Vercel or in a test runs generate in postinstall without one).
import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile();
} catch {
  /* no .env: fine */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
