// Phase 17F: the user's own optional profile photo, on Cloudinary. The server signs every upload (there is no unsigned preset), fixes the public id to
// `avatars/<userId>` (so one user cannot overwrite another's), allows only jpg, png and webp, and crops to a 256 px square on arrival. Size cannot be
// signed: the page checks about 2 MB, and the signed upload preset's limit in the Cloudinary console is the second layer.
// With no Cloudinary variables nothing here runs: the routes answer 503 "not configured" and the Account area keeps the geometric default.
import { v2 as cloudinary } from "cloudinary";

type Env = Record<string, string | undefined>;

export interface CloudinaryKeys {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** The three variables, or the single CLOUDINARY_URL (`cloudinary://key:secret@cloud`). Null when neither is complete. */
export function cloudinaryKeys(env: Env = process.env): CloudinaryKeys | null {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) return { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET };
  if (env.CLOUDINARY_URL) {
    try {
      const u = new URL(env.CLOUDINARY_URL);
      if (u.protocol === "cloudinary:" && u.username && u.password && u.hostname) return { cloudName: u.hostname, apiKey: decodeURIComponent(u.username), apiSecret: decodeURIComponent(u.password) };
    } catch {
      /* not a URL */
    }
  }
  return null;
}

export const AVATAR_FORMATS = "jpg,png,webp";
export const AVATAR_TRANSFORMATION = "c_fill,h_256,w_256";
export const avatarPublicId = (userId: string): string => `avatars/${userId}`;

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  /** the fields that were signed: the browser must send exactly these, with `file`, `api_key`, `timestamp` and `signature` */
  fields: Record<string, string>;
}

/** The parameters the browser uploads with, signed. Pure apart from the clock (passed in). Throws when Cloudinary is not configured. */
export function signAvatarUpload(userId: string, now: number, env: Env = process.env): SignedUpload {
  const keys = cloudinaryKeys(env);
  if (!keys) throw new Error("not_configured");
  const timestamp = Math.floor(now / 1000);
  const fields = {
    allowed_formats: AVATAR_FORMATS,
    invalidate: "true",
    overwrite: "true",
    public_id: avatarPublicId(userId),
    timestamp: String(timestamp),
    transformation: AVATAR_TRANSFORMATION,
  };
  const signature = cloudinary.utils.api_sign_request(fields, keys.apiSecret);
  return { cloudName: keys.cloudName, apiKey: keys.apiKey, timestamp, signature, fields };
}

function configure(keys: CloudinaryKeys) {
  cloudinary.config({ cloud_name: keys.cloudName, api_key: keys.apiKey, api_secret: keys.apiSecret, secure: true });
}

/** Removes the photo. A user with no photo, or a server with no Cloudinary keys, is a no-op: deleting an account must never fail because of the photo. */
export async function destroyAvatar(publicId: string | null | undefined, env: Env = process.env): Promise<void> {
  const keys = cloudinaryKeys(env);
  if (!publicId || !keys) return;
  configure(keys);
  await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" }).catch((e: unknown) => console.error("avatar removal failed:", (e as { message?: string })?.message ?? "unknown"));
}

/** Asks Cloudinary for the stored version of the user's photo, so a client cannot claim a version that does not exist. Null when there is none. */
export async function storedAvatarVersion(userId: string, env: Env = process.env): Promise<number | null> {
  const keys = cloudinaryKeys(env);
  if (!keys) return null;
  configure(keys);
  try {
    const r = (await cloudinary.api.resource(avatarPublicId(userId), { resource_type: "image" })) as { version?: number };
    return typeof r.version === "number" ? r.version : null;
  } catch {
    return null;
  }
}

/** The delivery URL of a stored photo (the version is part of the URL, so a new photo is a new address and caches never go stale). */
export const avatarUrl = (cloudName: string, userId: string, version: number): string =>
  `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${avatarPublicId(userId)}`;
