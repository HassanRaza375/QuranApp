// The Foundation check page (`/foundation`) is a Phase 0 test fixture: browser tests and the dev smoke exercise the shell's pieces on it. It is part of the
// build used for testing (a local build, `npm run verify`) and is left out of the build Vercel makes (Vercel sets `VERCEL`), so it never ships to users.
export const shipsTestPages = (env: Record<string, string | undefined>): boolean => !env.VERCEL;
export const TEST_ONLY_ROUTES = ["/foundation"];
