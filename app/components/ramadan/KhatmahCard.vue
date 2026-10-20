<script setup lang="ts">
// The Ramadan Khatmah, read-only until Reading goals (Phase 15): it shows an existing goal labelled "Ramadan Khatmah" (its target and today's
// ayah count from the daily log the reader writes) and links to where you stopped reading. No goal can be created here yet.
import { localDateKey } from "~/lib/dates";
import { GOALS_KEY } from "~/lib/goalLog";
import { formatShortDate } from "~/lib/ramadanText";
import { continueReadingHref } from "~/lib/resume";
import { getJSON } from "~/lib/storage";

const KHATMAH_LABEL = "Ramadan Khatmah";
interface Goal {
  label?: unknown;
  status?: unknown;
  dailyAyahTarget?: unknown;
  targetDate?: unknown;
}
const goal = ref<{ target: number; targetDate: string | null; today: number } | null>(null);
const readHref = ref<string | null>(null);
onMounted(() => {
  const raw = getJSON<unknown>(GOALS_KEY, null) as { goals?: Goal[]; dailyLog?: Record<string, unknown> } | null;
  const g = Array.isArray(raw?.goals) ? raw.goals.find((x) => x && x.label === KHATMAH_LABEL && x.status === "active") : undefined;
  if (g && typeof g.dailyAyahTarget === "number" && g.dailyAyahTarget > 0) {
    const log = raw?.dailyLog?.[localDateKey(new Date())];
    goal.value = { target: Math.round(g.dailyAyahTarget), targetDate: typeof g.targetDate === "string" ? g.targetDate : null, today: Array.isArray(log) ? log.length : 0 };
  }
  readHref.value = continueReadingHref(getJSON<unknown>("quran:reading-progress:v1", null));
});
</script>

<template>
  <section aria-labelledby="khatmah-h" class="rounded-[10px] border p-4" data-testid="khatmah">
    <h2 id="khatmah-h" class="text-[15px] font-medium">Ramadan Khatmah</h2>
    <template v-if="goal">
      <p class="mt-1 text-[14.5px]" data-testid="khatmah-today">{{ goal.today }} of {{ goal.target }} ayahs today</p>
      <p v-if="goal.targetDate" class="text-[12.5px] text-ink-2" data-testid="khatmah-target">Aiming to finish by {{ formatShortDate(goal.targetDate) }}.</p>
    </template>
    <p v-else class="mt-1 text-[13.5px] text-ink-2" data-testid="khatmah-none">No Ramadan Khatmah has been planned. Planning a reading goal arrives with Reading goals in a later phase.</p>
    <Button as-child variant="outline" class="mt-3 min-h-11 md:min-h-9"><NuxtLink :to="readHref ?? '/surah/1'" data-testid="khatmah-read">{{ readHref ? "Continue reading" : "Start reading" }}</NuxtLink></Button>
  </section>
</template>
