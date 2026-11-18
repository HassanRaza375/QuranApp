// Phase 17B: Better Auth's options, built from the environment and nothing else, so a unit test can check each security-relevant choice on the
// returned object (tests/authConfig.test.ts) without a database. The library, the database adapter and the mailer are passed in.
//
// The choices, and why (docs/phases/phase-17-plan.md, section c):
//   - Rate limiting is on everywhere and stored in the database: the default memory store does not suit serverless.
//   - Cookies are httpOnly, SameSite=Lax and Secure on https. The session is never in web storage.
//   - Google fills `user.image` by default; this app never imports the Google photo (DECISIONS.md, Phase 17), so the profile mapping sets it to null.
//   - `role` and the avatar fields cannot be set by a request (`input: false`).
//   - Trusted origins are listed exactly: this deployment, its branch URL, and localhost. Never a bare `*.vercel.app`.
//   - Email verification is required only when a mailer exists; without one, accounts are not linked automatically.
import type { BetterAuthOptions } from "better-auth";
import type { Mail, Mailer } from "./mailer";

type Env = Record<string, string | undefined>;

const LOCAL_PORTS = [3000, 3001, 3011, 3012, 3013];

export interface AuthUrls {
  baseURL: string;
  trustedOrigins: string[];
}

/** The address this server answers on, and the origins it trusts. `BETTER_AUTH_URL` wins; then Vercel's own variables; then localhost. */
export function authUrls(env: Env): AuthUrls {
  const origins = new Set<string>();
  const add = (v: string | undefined) => {
    if (!v) return;
    const u = v.startsWith("http") ? v : `https://${v}`;
    origins.add(u.replace(/\/+$/, ""));
  };
  let base = env.BETTER_AUTH_URL ? env.BETTER_AUTH_URL.replace(/\/+$/, "") : "";
  if (!base && env.VERCEL) {
    base = env.VERCEL_ENV === "production" ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL}` : `https://${env.VERCEL_URL}`;
  }
  if (!base) base = `http://localhost:${env.PORT || 3001}`;
  add(base);
  if (env.VERCEL) {
    add(env.VERCEL_BRANCH_URL);
    add(env.VERCEL_URL);
    if (env.VERCEL_ENV === "production") add(env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (!env.VERCEL) for (const p of LOCAL_PORTS) add(`http://localhost:${p}`);
  return { baseURL: base, trustedOrigins: [...origins] };
}

export interface GoogleKeys {
  clientId: string;
  clientSecret: string;
}
export const googleKeys = (env: Env): GoogleKeys | null => (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } : null);

/** The Google profile, mapped to the fields the app keeps. No `image`: the user's own photo is chosen in the Account area (17F), never imported. */
export const mapGoogleProfile = (): { image: null } => ({ image: null });

export interface AuthDeps {
  database: BetterAuthOptions["database"];
  mailer: Mailer | null;
  /** called before an account is deleted (17F removes the user's photo) */
  beforeDelete?: (user: { id: string; avatarPublicId?: string | null }) => Promise<void>;
}

export function authOptions(env: Env, deps: AuthDeps): BetterAuthOptions {
  const { baseURL, trustedOrigins } = authUrls(env);
  const secure = baseURL.startsWith("https://");
  const google = googleKeys(env);
  const mailer = deps.mailer;
  const send = (mail: Mail) => (mailer ? mailer(mail) : Promise.resolve());
  return {
    appName: "Quran App",
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: deps.database,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: Boolean(mailer),
      ...(mailer
        ? {
            sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) =>
              send({ to: user.email, subject: "Reset your Quran App password", text: `Use this link to choose a new password:\n${url}\n\nIf you did not ask for this, ignore this message.` }),
          }
        : {}),
    },
    ...(mailer
      ? {
          emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) =>
              send({ to: user.email, subject: "Confirm your Quran App email", text: `Use this link to confirm your email address:\n${url}\n\nIf you did not create an account, ignore this message.` }),
          },
        }
      : {}),
    ...(google ? { socialProviders: { google: { ...google, mapProfileToUser: mapGoogleProfile } } } : {}),
    account: { accountLinking: { enabled: Boolean(mailer) } },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "user", input: false },
        avatarPublicId: { type: "string", required: false, input: false },
        avatarVersion: { type: "number", required: false, input: false },
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user: { id: string; avatarPublicId?: string | null }) => void (await deps.beforeDelete?.(user)),
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 10,
      max: 100,
      customRules: { "/sign-in/email": { window: 10, max: 5 }, "/sign-up/email": { window: 60, max: 10 } },
    },
    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure },
    },
  };
}
