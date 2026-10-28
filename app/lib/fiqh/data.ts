// The app's one door to the Daily Fiqh data: the legacy `runtime.ts` (vendored, unmodified). The small core (categories, topics, glossary, the one-line ruling index,
// the maraji') comes with it; a category's ruling text is its own chunk, loaded by `loadCategory(id)`. Never import `@legacy/data/wajibat/index` from app code: it is the
// whole dataset in one chunk (the tests use it).
export * from "@legacy/data/wajibat/runtime";
