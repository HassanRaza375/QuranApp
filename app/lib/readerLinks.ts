// Where a listing row opens. Every reader exists now: the surah reader (Phase 4A; a juz row opens it at the juz's first ayah) and the
// per-page reader (Phase 9A). The "not rebuilt yet" flags and the listing's notice are gone with the last of them; a test follows every
// link to a page that renders.
export const READERS_READY = { surah: true, juz: true } as const;

export const surahHref = (surah: number, ayah?: number) => (ayah ? `/surah/${surah}#ayah-${ayah}` : `/surah/${surah}`);
/** A juz opens at its first ayah (the legacy `/juz/<n>` route is a full-juz reader and arrives later). */
export const juzHref = (surah: number, ayah: number) => surahHref(surah, ayah);
export const pageHref = (page: number) => `/per-page-read?page=${page}`;

