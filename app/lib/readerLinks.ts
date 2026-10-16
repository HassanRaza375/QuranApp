// Where a listing row opens. The readers are separate phases: the surah reader is Phase 4, the Juz reader follows it and
// the per-page reader is Phase 9. Until a reader exists its route shows the "not rebuilt yet" page, so the listing says so
// above the list instead of pretending, and a test follows every link to a page that exists. When a phase ships its reader,
// flip the matching flag here; nothing else changes.
export const READERS_READY = { surah: false, juz: false, page: false } as const;

export const surahHref = (surah: number, ayah?: number) => (ayah ? `/surah/${surah}#ayah-${ayah}` : `/surah/${surah}`);
/** A juz opens at its first ayah (the legacy `/juz/<n>` route is a full-juz reader and arrives later). */
export const juzHref = (surah: number, ayah: number) => surahHref(surah, ayah);
export const pageHref = (page: number) => `/per-page-read?page=${page}`;

export const readersPending = () => !(READERS_READY.surah && READERS_READY.juz && READERS_READY.page);
