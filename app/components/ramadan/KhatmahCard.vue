<script setup lang="ts">
// The Ramadan Khatmah (Phase 15): a reading goal labelled "Ramadan Khatmah", finishing on the last day of Ramadan as this page shows it (the Hijri
// adjustment applied). With none planned there is one button, "Plan a Ramadan Khatmah", which makes that goal (the same goal the legacy app made) and
// pauses the main goal, with Undo. The amount for today is worked out the same way as on the Reading goals page and on Home.
import { PASSED_LINE, KHATMAH_LABEL, todayFor, positionOf, type Goal } from "~/lib/goals/model";
import { previewDaily } from "~/lib/goals/store";
import { localDateKey } from "~/lib/dates";
import { addDaysKey } from "~/lib/dayKeys";
import { GOALS_KEY } from "~/lib/goalLog";
import { formatShortDate } from "~/lib/ramadanText";
import { continueReadingHref } from "~/lib/resume";
import { getJSON } from "~/lib/storage";

const store = useGoalsStore();
const undo = useUndoToast();
const { plan } = useRamadan();
const goal = ref<{ amount: number | null; targetDate: string | null; today: number } | null>(null);
const readHref = ref<string | null>(null);
const today = ref(localDateKey(new Date()));

function read() {
  today.value = localDateKey(new Date());
  const progress = getJSON<unknown>("quran:reading-progress:v1", null);
  const raw = getJSON<unknown>(GOALS_KEY, null) as { goals?: Array<Partial<Goal>>; dailyLog?: Record<string, unknown> } | null;
  const g = Array.isArray(raw?.goals) ? raw.goals.find((x) => x && x.label === KHATMAH_LABEL && x.status === "active") : undefined;
  if (g && typeof g.dailyAyahTarget === "number" && g.dailyAyahTarget > 0) {
    const log = raw?.dailyLog?.[today.value];
    const ask = todayFor({ type: g.type ?? "custom", targetDate: typeof g.targetDate === "string" ? g.targetDate : null, startAbsoluteAyah: typeof g.startAbsoluteAyah === "number" ? g.startAbsoluteAyah : 0, dailyAyahTarget: g.dailyAyahTarget } as Goal, positionOf(progress), today.value);
    goal.value = { amount: ask.kind === "amount" ? ask.ayahs : null, targetDate: typeof g.targetDate === "string" ? g.targetDate : null, today: Array.isArray(log) ? log.length : 0 };
  } else goal.value = null;
  readHref.value = continueReadingHref(progress);
}
onMounted(read);

/** The last day of Ramadan as this page shows it. */
const lastDay = computed(() => (plan.value.start ? addDaysKey(plan.value.start, (plan.value.length ?? 30) - 1) : null));
const canPlan = computed(() => !!lastDay.value && lastDay.value > today.value && plan.value.state !== "over");
const perDay = computed(() => (canPlan.value ? previewDaily({ type: "finish-by-date", targetDate: lastDay.value }, { today: today.value, position: positionOf(getJSON<unknown>("quran:reading-progress:v1", null)) }) : null));

function planIt() {
  if (!canPlan.value) return;
  const made = store.create({ type: "finish-by-date", targetDate: lastDay.value, label: KHATMAH_LABEL });
  if (!made) return;
  read();
  undo.withUndo(made.paused ? "Ramadan Khatmah planned. Your previous goal is paused." : "Ramadan Khatmah planned.", () => {
    made.undo();
    read();
  });
}
</script>

<template>
  <section aria-labelledby="khatmah-h" class="rounded-[10px] border p-4" data-testid="khatmah">
    <h2 id="khatmah-h" class="text-[15px] font-medium">Ramadan Khatmah</h2>
    <template v-if="goal">
      <p v-if="goal.amount" class="mt-1 text-[14.5px]" data-testid="khatmah-today">{{ goal.today }} of {{ goal.amount }} ayahs today</p>
      <p v-else class="mt-1 text-[14.5px]" data-testid="khatmah-today">{{ goal.today }} {{ goal.today === 1 ? "ayah" : "ayahs" }} today. {{ PASSED_LINE }}</p>
      <p v-if="goal.targetDate" class="text-[12.5px] text-ink-2" data-testid="khatmah-target">Aiming to finish by {{ formatShortDate(goal.targetDate) }}.</p>
    </template>
    <template v-else>
      <p class="mt-1 text-[13.5px] text-ink-2" data-testid="khatmah-none">No Ramadan Khatmah has been planned.<template v-if="perDay"> Reading {{ perDay }} ayahs a day from where you are would finish it by {{ formatShortDate(lastDay!) }}.</template></p>
    </template>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button v-if="!goal && canPlan" class="min-h-11 md:min-h-9" data-testid="khatmah-plan" @click="planIt">Plan a Ramadan Khatmah</Button>
      <Button as-child variant="outline" class="min-h-11 md:min-h-9"><NuxtLink :to="readHref ?? '/surah/1'" data-testid="khatmah-read">{{ readHref ? "Continue reading" : "Start reading" }}</NuxtLink></Button>
      <Button as-child variant="ghost" class="min-h-11 md:min-h-9"><NuxtLink to="/goals" data-testid="khatmah-goals">Reading goals</NuxtLink></Button>
    </div>
  </section>
</template>
