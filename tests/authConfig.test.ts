// Phase 17B and F: Better Auth's options (every security-relevant choice is read off the returned object), the mailer choice, the Cloudinary signature, and a scan
// that every account, sync, avatar and admin route starts with its guard. No database, no network, no real credential.
import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { describe, expect, it } from "vitest";
import { authOptions, authUrls, googleKeys, mapGoogleProfile } from "../server/utils/authConfig";
import { AVATAR_FORMATS, avatarPublicId, avatarUrl, cloudinaryKeys, destroyAvatar, signAvatarUpload } from "../server/utils/avatar";
import { getMailer, mailerKind } from "../server/utils/mailer";

const ROOT = path.resolve(__dirname, "..");
const db = {} as never;
const mailer = async () => undefined;

describe("authUrls", () => {
  it("BETTER_AUTH_URL wins and is trusted, with localhost on the dev ports", () => {
    const u = authUrls({ BETTER_AUTH_URL: "https://quran.example/" });
    expect(u.baseURL).toBe("https://quran.example");
    expect(u.trustedOrigins).toContain("https://quran.example");
    expect(u.trustedOrigins).toContain("http://localhost:3001");
  });
  it("on Vercel production: the production address; trusted origins are exact, never a wildcard", () => {
    const u = authUrls({ VERCEL: "1", VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "quran-app-znfc.vercel.app", VERCEL_URL: "quran-abc123.vercel.app" });
    expect(u.baseURL).toBe("https://quran-app-znfc.vercel.app");
    expect(u.trustedOrigins).toEqual(expect.arrayContaining(["https://quran-app-znfc.vercel.app", "https://quran-abc123.vercel.app"]));
    expect(u.trustedOrigins.some((o) => o.includes("*"))).toBe(false);
    expect(u.trustedOrigins.some((o) => o.includes("localhost"))).toBe(false); // no localhost in a deployment
  });
  it("on a Vercel preview: that deployment's own address and its branch address", () => {
    const u = authUrls({ VERCEL: "1", VERCEL_ENV: "preview", VERCEL_URL: "quran-abc123-team.vercel.app", VERCEL_BRANCH_URL: "quran-git-x-team.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "quran-app-znfc.vercel.app" });
    expect(u.baseURL).toBe("https://quran-abc123-team.vercel.app");
    expect(u.trustedOrigins).toEqual(expect.arrayContaining(["https://quran-abc123-team.vercel.app", "https://quran-git-x-team.vercel.app"]));
    expect(u.trustedOrigins).not.toContain("https://quran-app-znfc.vercel.app");
  });
  it("locally: localhost on the port", () => {
    expect(authUrls({ PORT: "3015" }).baseURL).toBe("http://localhost:3015");
    expect(authUrls({}).baseURL).toBe("http://localhost:3001");
  });
});

describe("authOptions", () => {
  const base = { BETTER_AUTH_SECRET: "x".repeat(32), BETTER_AUTH_URL: "https://quran.example" };
  const o = authOptions(base, { database: db, mailer: null });
  const withMail = authOptions(base, { database: db, mailer });

  it("limits requests, stored in the database (the memory store does not suit serverless), on everywhere", () => {
    expect(o.rateLimit).toMatchObject({ enabled: true, storage: "database" });
    expect(o.rateLimit!.customRules!["/sign-in/email"]).toMatchObject({ max: 5 });
    expect(o.rateLimit!.customRules!["/sign-up/email"]).toBeTruthy();
  });
  it("cookies are httpOnly, SameSite=Lax and Secure on https", () => {
    expect(o.advanced!.defaultCookieAttributes).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true });
    expect(o.advanced!.useSecureCookies).toBe(true);
    expect(authOptions({ ...base, BETTER_AUTH_URL: "http://localhost:3001" }, { database: db, mailer: null }).advanced!.defaultCookieAttributes).toMatchObject({ httpOnly: true, secure: false });
  });
  it("passwords are 8 to 128 characters", () => {
    expect(o.emailAndPassword).toMatchObject({ enabled: true, minPasswordLength: 8, maxPasswordLength: 128 });
  });
  it("a request cannot set the role or the photo fields", () => {
    const f = o.user!.additionalFields as Record<string, { input?: boolean; defaultValue?: unknown }>;
    expect(f.role).toMatchObject({ input: false, defaultValue: "user" });
    expect(f.avatarPublicId!.input).toBe(false);
    expect(f.avatarVersion!.input).toBe(false);
  });
  it("account deletion is on", () => {
    expect(o.user!.deleteUser!.enabled).toBe(true);
  });
  it("the Google photo is never imported: the profile mapping sets the image to null", () => {
    expect(mapGoogleProfile()).toEqual({ image: null });
    const g = authOptions({ ...base, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }, { database: db, mailer: null });
    const mapped = g.socialProviders!.google!.mapProfileToUser!({ name: "N", email: "e@x.y", picture: "https://lh3.googleusercontent.com/a/photo" } as never) as { image?: unknown };
    expect(mapped.image).toBeNull();
    expect(JSON.stringify(mapped)).not.toContain("googleusercontent");
  });
  it("Google is offered only when both keys are set", () => {
    expect(o.socialProviders).toBeUndefined();
    expect(googleKeys({ GOOGLE_CLIENT_ID: "a" })).toBeNull();
    expect(googleKeys({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" })).toEqual({ clientId: "a", clientSecret: "b" });
  });
  it("email verification and reset exist only with a mailer; without one accounts are not linked automatically", () => {
    expect(o.emailAndPassword!.requireEmailVerification).toBe(false);
    expect(o.emailAndPassword!.sendResetPassword).toBeUndefined();
    expect(o.emailVerification).toBeUndefined();
    expect(o.account!.accountLinking!.enabled).toBe(false);
    expect(withMail.emailAndPassword!.requireEmailVerification).toBe(true);
    expect(withMail.emailAndPassword!.sendResetPassword).toBeTypeOf("function");
    expect(withMail.emailVerification!.sendOnSignUp).toBe(true);
    expect(withMail.account!.accountLinking!.enabled).toBe(true);
  });
  it("the secret is read from the environment, never written in the code", () => {
    expect(o.secret).toBe(base.BETTER_AUTH_SECRET);
    const src = fs.readFileSync(path.join(ROOT, "server/utils/authConfig.ts"), "utf8");
    expect(src).not.toMatch(/secret:\s*["'`][^"'`]{8,}/);
  });
});

describe("mailer", () => {
  it("chooses Resend, SMTP or nothing from the variables", () => {
    expect(mailerKind({})).toBeNull();
    expect(mailerKind({ RESEND_API_KEY: "k" })).toBeNull(); // needs a from address
    expect(mailerKind({ RESEND_API_KEY: "k", EMAIL_FROM: "a@b.c" })).toBe("resend");
    expect(mailerKind({ SMTP_HOST: "h", SMTP_USER: "u", SMTP_PASS: "p", EMAIL_FROM: "a@b.c" })).toBe("smtp");
    expect(getMailer({})).toBeNull();
    expect(getMailer({ RESEND_API_KEY: "k", EMAIL_FROM: "a@b.c" })).toBeTypeOf("function");
  });
});

describe("avatar (Cloudinary)", () => {
  const env = { CLOUDINARY_CLOUD_NAME: "democloud", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "s3cret-for-tests" };
  it("reads the three variables or the single URL; incomplete is none", () => {
    expect(cloudinaryKeys(env)).toEqual({ cloudName: "democloud", apiKey: "123456", apiSecret: "s3cret-for-tests" });
    expect(cloudinaryKeys({ CLOUDINARY_URL: "cloudinary://key:sec@mycloud" })).toEqual({ cloudName: "mycloud", apiKey: "key", apiSecret: "sec" });
    expect(cloudinaryKeys({ CLOUDINARY_CLOUD_NAME: "x" })).toBeNull();
    expect(cloudinaryKeys({ CLOUDINARY_URL: "https://nope" })).toBeNull();
    expect(cloudinaryKeys({})).toBeNull();
  });
  it("signs exactly the fields it returns, with the user's own public id, jpg/png/webp only, and a 256 px square", () => {
    const now = 1_800_000_000_000;
    const s = signAvatarUpload("user-42", now, env);
    expect(s.fields).toEqual({
      allowed_formats: AVATAR_FORMATS,
      invalidate: "true",
      overwrite: "true",
      public_id: "avatars/user-42",
      timestamp: String(now / 1000),
      transformation: "c_fill,h_256,w_256",
    });
    expect(AVATAR_FORMATS).toBe("jpg,png,webp");
    expect(s.signature).toBe(cloudinary.utils.api_sign_request(s.fields, env.CLOUDINARY_API_SECRET));
    expect(s.signature).not.toBe(cloudinary.utils.api_sign_request({ ...s.fields, public_id: "avatars/someone-else" }, env.CLOUDINARY_API_SECRET));
    expect(JSON.stringify(s)).not.toContain(env.CLOUDINARY_API_SECRET); // the secret never leaves the server
    expect(s.apiKey).toBe("123456");
  });
  it("one user cannot be given another's public id", () => {
    expect(signAvatarUpload("a", 1000, env).fields.public_id).toBe(avatarPublicId("a"));
    expect(signAvatarUpload("b", 1000, env).fields.public_id).toBe(avatarPublicId("b"));
  });
  it("without keys it refuses to sign, and removing a photo (or one that is not there) never throws", async () => {
    expect(() => signAvatarUpload("u", 1, {})).toThrow("not_configured");
    await expect(destroyAvatar("avatars/u", {})).resolves.toBeUndefined();
    await expect(destroyAvatar(null, env)).resolves.toBeUndefined();
  });
  it("the delivery address carries the version, so a new photo is a new address", () => {
    expect(avatarUrl("democloud", "u1", 7)).toBe("https://res.cloudinary.com/democloud/image/upload/v7/avatars/u1");
  });
});

describe("every account, sync, avatar and admin route starts with its guard", () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (/\.ts$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const guarded = ["sync", "avatar", "admin", "account", "auth"].flatMap((d) => walk(path.join(ROOT, "server/api", d)));
  it("finds the routes", () => {
    expect(guarded.length).toBeGreaterThanOrEqual(10);
  });
  for (const file of guarded) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    it(`${rel} calls requireUser, requireSuperAdmin or requireEnabled before anything else`, () => {
      const src = fs.readFileSync(file, "utf8");
      const body = src.slice(src.indexOf("apiHandler("));
      expect(src, "wrapped so a refusal is always JSON").toMatch(/export default apiHandler\(/);
      const first = body.search(/requireUser\(|requireSuperAdmin\(|requireEnabled\(/);
      expect(first, "no guard").toBeGreaterThan(-1);
      // nothing that reads the request or the database comes before the guard
      const before = body.slice(0, first);
      expect(before).not.toMatch(/readBody|getQuery|useDb|prismaSyncRepo|useAuth/);
    });
  }
  it("the admin route needs a super admin, and no other route reads another user's id from the request", () => {
    expect(fs.readFileSync(path.join(ROOT, "server/api/admin/users.get.ts"), "utf8")).toContain("requireSuperAdmin(event)");
    for (const f of guarded.filter((f) => /api[\\/](sync|avatar)/.test(f))) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/body\.userId|query\.userId|q\.userId|params\.userId/);
      expect(src, f).toMatch(/user\.id/);
    }
  });
});
