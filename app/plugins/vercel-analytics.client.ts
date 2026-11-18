// Vercel Web Analytics (hosted app only). It is the same function the `@vercel/analytics` Nuxt module would call, wrapped so that the page address is cut to its
// path, the admin page is never counted, and Do Not Track and offline browsers are left alone (app/lib/analytics.ts). With `vercelAnalytics` false (every
// build that is not made on Vercel) this does nothing: no script, no request. Turn Web Analytics on in the Vercel project (Analytics tab) or the script 404s.
import { injectAnalytics } from "@vercel/analytics/nuxt/runtime";
import { analyticsAllowed, analyticsBeforeSend } from "~/lib/analytics";

export default defineNuxtPlugin(() => {
  if (!useRuntimeConfig().public.vercelAnalytics) return;
  const nav = navigator as Navigator & { doNotTrack?: string | null };
  if (!analyticsAllowed({ doNotTrack: nav.doNotTrack ?? (window as Window & { doNotTrack?: string }).doNotTrack, onLine: nav.onLine })) return;
  injectAnalytics({ beforeSend: analyticsBeforeSend });
});
