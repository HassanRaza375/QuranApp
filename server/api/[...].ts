// Phase 17A: an /api/ address that no route serves is a JSON 404, never the app shell. With ssr:false the page renderer otherwise
// answers every unmatched path, /api/ included, with the SPA HTML and status 200 (found by e2e/apiServiceWorker.spec.ts), which a
// client reading JSON would take for an answer. Every named route (and Better Auth's /api/auth/[...all] in 17B) is more specific and wins.
export default defineEventHandler((event) => {
  setResponseStatus(event, 404);
  return { error: "not_found" };
});
