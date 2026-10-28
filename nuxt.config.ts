import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { legacyBridge, LEGACY_APP, LEGACY_ROOT } from "./build/legacyBridge";
import { NO_FLASH_SCRIPT } from "./app/lib/noFlashScript";
import { injectPublicMeta } from "./app/lib/publicMeta";

// Revamp of the Quran App UI: Nuxt 4 SPA + shadcn-vue + Tailwind v4. See docs/PLAN.md and
// docs/phases/phase-00-foundation.md for why each setting is here.
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  // SPA by default (one precached shell makes every route work offline). Only a few public pages are prerendered.
  ssr: false,
  devtools: { enabled: false },
  // The legacy app uses 3000. (`npm run dev -- --port N` still overrides it.)
  devServer: { port: 3001 },

  modules: ["shadcn-nuxt", "@nuxt/icon", "@pinia/nuxt", "@vite-pwa/nuxt", "@nuxt/eslint"],
  css: ["~/assets/css/tailwind.css"],
  shadcn: { prefix: "", componentDir: "@/components/ui" },

  // Pure legacy code (data JSON/TS, utils) is imported from the vendored snapshot in ./legacy (read-only, see legacy/README.md):
  // `@legacy/utils/...` is `legacy/app/utils/...`. The dev server may serve it; nothing outside this repo is allowed.
  alias: { "@legacy": LEGACY_APP },
  vite: {
    plugins: [tailwindcss(), legacyBridge()],
    server: { fs: { allow: [fileURLToPath(new URL(".", import.meta.url)), LEGACY_ROOT] } },
  },

  // Icons are Lucide, bundled into the app: nothing is fetched from api.iconify.design at runtime (offline rule).
  // `scan` also reads app/lib (the nav lists icon names there); `fallbackToApi: false` makes a missing icon render
  // nothing instead of calling a CDN, and e2e/foundation.spec.ts fails if any request leaves the origin.
  icon: {
    serverBundle: "local",
    fallbackToApi: false,
    clientBundle: { scan: { globInclude: ["app/**/*.{vue,ts}"], globExclude: ["node_modules", "dist", "build", ".*"] }, sizeLimitKb: 256 },
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "Quran App",
      meta: [
        { charset: "utf-8" },
        // No `maximum-scale`: pinch-zoom stays available (the legacy app disabled it).
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#F3F1EA" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon2.png" },
        { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
      ],
      // Sets the theme class and the accessibility flags before first paint (no flash).
      script: [{ innerHTML: NO_FLASH_SCRIPT, tagPosition: "head", tagPriority: "critical" }],
    },
  },

  // Public pages that get real <head> tags for link previews. Everything else is the SPA shell.
  // Spike result (docs/phases/phase-00-foundation.md): with ssr:false the prerendered HTML is the generic shell, and
  // per-route SSR (routeRules ssr:true) is either ignored (global ssr:false) or fails on "/" (global ssr:true plus an
  // ssr:false catch-all). So the three routes are prerendered as the SPA shell and this hook writes each one's own
  // <title>, description and Open Graph tags into its HTML.
  nitro: {
    prerender: { routes: ["/", "/about", "/surah-listing"], crawlLinks: false },
    hooks: {
      "prerender:generate"(route) {
        if (route.contents && typeof route.contents === "string") route.contents = injectPublicMeta(route.route, route.contents);
      },
    },
  },

  runtimeConfig: {
    public: {
      quranApiBase: process.env.QURAN_API_BASE || "https://quranapi.pages.dev/api",
      // must be https:// (see the README CORS gotcha)
      quranApiBase2: process.env.QURAN_API_BASE2 || "https://api.alquran.cloud/v1",
    },
  },

  // PWA: matches the legacy app on purpose, so the new service worker replaces the old one at cutover.
  //   same file name (sw.js), same scope ("/"), same manifest identity (no `id`, start_url "/", scope "/"),
  //   same registerType ("prompt"), same runtime cache names.
  pwa: {
    registerType: "prompt",
    injectRegister: "auto",
    manifest: {
      name: "Quran App",
      short_name: "Quran App",
      description:
        "Read, listen to and reflect on the Quran — surahs, translations, audio recitations, prayer times, qibla direction and tasbeeh counter.",
      theme_color: "#F3F1EA",
      background_color: "#F3F1EA",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      scope: "/",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      // Every navigation falls back to the precached SPA shell, except API routes.
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          // Immutable Quran text/translation/tafsir/reciter list (same rule and cache name as the legacy app)
          urlPattern: ({ url }) => url.hostname.includes("quranapi.pages.dev"),
          handler: "CacheFirst",
          options: {
            cacheName: "quran-api-cache",
            expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ request, url }) => request.destination === "audio" || /\.(mp3|ogg|wav)$/i.test(url.pathname),
          handler: "CacheFirst",
          options: {
            cacheName: "quran-audio-cache",
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },
});
