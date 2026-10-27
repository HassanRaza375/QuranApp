// Decision B3: the "show unreviewed helpers" dev flag must never reach production. nuxt.config.ts calls
// this while loading, so a production build (NODE_ENV=production, which `nuxt build` sets, or
// VERCEL_ENV=production) fails as soon as NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS is on.
export const SHOW_UNREVIEWED_ENV = "NUXT_PUBLIC_WAJIBAT_SHOW_UNREVIEWED_HELPERS";

export const showUnreviewedHelpersRequested = (env: Record<string, string | undefined>): boolean =>
  /^(1|true|yes|on)$/i.test((env[SHOW_UNREVIEWED_ENV] ?? "").trim());

export const assertNoUnreviewedHelpersInProduction = (env: Record<string, string | undefined>): void => {
  const production = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  if (production && showUnreviewedHelpersRequested(env)) {
    throw new Error(
      `${SHOW_UNREVIEWED_ENV} is on in a production build. The Wajibat decision helpers are shown only when every path is marked reviewed; ` +
        "unset this variable (it is a local development flag and must never be set on Vercel)."
    );
  }
};
