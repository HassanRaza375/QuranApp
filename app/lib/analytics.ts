// Vercel Web Analytics, only on the hosted app (nuxt.config.ts sets `vercelAnalytics` from the VERCEL build variable, so a local build, a test run and a
// self-hosted copy never load it). What leaves the device is a page view: the page's path, the referrer, a country, and the device and browser type. Pure.
//
// What this file guarantees, whatever Vercel's script is given:
//   - nothing after a "?" or "#" is ever sent (a search is `/search?q=…`, and what someone searched for is sensitive: docs/PLAN.md, storage inventory);
//   - the admin page is never counted;
//   - a browser that says "Do Not Track" is not counted at all, and an offline one does not try.

/** A page view or event as Vercel's script describes it. */
export interface AnalyticsEvent {
  type: string;
  url: string;
}

const ADMIN = /^\/admin(\/|$)/;

/** `beforeSend` for Vercel's script: the event with its address cut to origin and path, or null to drop it. */
export function analyticsBeforeSend<T extends AnalyticsEvent>(event: T): T | null {
  let u: URL;
  try {
    u = new URL(event.url, "https://placeholder.invalid");
  } catch {
    return null; // an address that cannot be read is not sent
  }
  if (ADMIN.test(u.pathname)) return null;
  const absolute = /^https?:\/\//i.test(event.url);
  return { ...event, url: absolute ? `${u.origin}${u.pathname}` : u.pathname };
}

/** Should the script be loaded at all in this browser? */
export function analyticsAllowed(nav: { doNotTrack?: string | null; onLine?: boolean } | undefined): boolean {
  if (!nav) return false;
  if (nav.doNotTrack === "1" || nav.doNotTrack === "yes") return false;
  if (nav.onLine === false) return false; // offline: the script could not load, and the app works without it
  return true;
}
