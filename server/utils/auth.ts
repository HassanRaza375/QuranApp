// Phase 17B: the one Better Auth instance of a server instance, made on first use (never at import), over the one Prisma client.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { authOptions } from "./authConfig";
import { destroyAvatar } from "./avatar";
import { useDb } from "./db";
import { getMailer } from "./mailer";

let instance: ReturnType<typeof create> | null = null;

function create() {
  return betterAuth(
    authOptions(process.env, {
      database: prismaAdapter(useDb(), { provider: "postgresql" }),
      mailer: getMailer(process.env),
      beforeDelete: async (user) => destroyAvatar(user.avatarPublicId),
    }),
  );
}

export const useAuth = () => (instance ??= create());
