<script setup lang="ts">
// /juz/<n> is the legacy full-juz reader; the revamp opens the surah reader at the juz's first ayah instead (DECISIONS.md, Phase 15), the same place the
// Juz tab sends you. 1 to 30 replaces this URL (Back does not bounce); anything else goes to the Juz tab. No request: the starts are bundled (level A).
import { juzTarget } from "~/lib/juzRedirect";

definePageMeta({ middleware: (to) => navigateTo(juzTarget(to.params.id), { replace: true }) });
useSeoMeta({ robots: "noindex, follow" });
</script>

<template>
  <p class="py-10 text-center text-[14px] text-ink-2" role="status">Opening the reader…</p>
</template>
