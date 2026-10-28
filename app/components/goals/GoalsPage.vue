<script setup lang="ts">
// Reading goals (Phase 15; prototype `pgGoals`): Today (the count, the amount when there is one, where to read next), the whole Qur'an as 30 juz, the last
// 7 days, and the other goals. Offline level A: everything is read from this device. No streak, no "behind", no points: a day you read less is just a day.
// Counts come from the reader (an ayah counts after it has been on screen for about 1.5 s) and from "Log reading from a mushaf".
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { PASSED_LINE, STATUS_LABEL, typeLabel, type Goal } from "~/lib/goals/model";
import { formatShortDate } from "~/lib/ramadanText";
import { surahHref } from "~/lib/readerLinks";

const store = useGoalsStore();
const undo = useUndoToast();
const newOpen = ref(false);
const logOpen = ref(false);
onMounted(() => store.load());

const main = computed(() => store.main);
const amount = computed(() => (store.ask?.kind === "amount" ? store.ask.ayahs : null));
const passed = computed(() => store.ask?.kind === "passed");
const nextRow = computed(() => (store.next ? { ...store.next, name: SURAH_ROWS[store.next.surah - 1]!.name, href: surahHref(store.next.surah, store.next.ayah) } : null));
const readHref = computed(() => (store.position && nextRow.value ? nextRow.value.href : "/surah/1"));
const barPct = computed(() => (amount.value ? Math.min(100, Math.round((store.readToday / Math.max(1, amount.value)) * 100)) : 0));
const lede = computed(() => (main.value ? `${main.value.label}${main.value.targetDate ? ` · finish by ${formatShortDate(main.value.targetDate)}` : ""}` : "Plan your reading, or just read: your place is always saved."));
const placeLine = computed(() => `${(store.position ?? 0).toLocaleString("en-GB")} of 6,236 ayahs · ${store.juz.done} juz complete`);
const ICON: Record<Goal["status"], string> = { active: "lucide:target", paused: "lucide:pause", completed: "lucide:check", abandoned: "lucide:circle-slash" };

function pause(g: Goal) {
  const back = store.pause(g.id);
  if (back) undo.withUndo(`Paused “${g.label}”.`, back);
}
function resume(g: Goal) {
  const back = store.makeMain(g.id);
  if (back) undo.withUndo("Goal resumed. It’s now your main goal.", back);
}
function remove(g: Goal) {
  const back = store.remove(g.id);
  if (back) undo.withUndo(`Removed “${g.label}”.`, back);
}
</script>

<template>
  <section class="mx-auto max-w-[760px]" data-testid="goals-page">
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="font-serif text-[28px] font-medium leading-tight md:text-[32px]">Reading goals</h1>
        <p class="mt-1 text-[14.5px] text-ink-2" data-testid="goals-lede">{{ lede }}</p>
      </div>
      <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="goals-new" @click="newOpen = true"><Icon name="lucide:plus" size="16" />New goal</Button>
    </div>

    <div v-if="!store.loaded" class="mt-6 space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <template v-else>
      <!-- no main goal -->
      <div v-if="!main" class="mt-6 rounded-2xl border bg-surface p-6 text-center" data-testid="goals-empty">
        <h2 class="font-serif text-[24px] font-medium">Plan your reading</h2>
        <p class="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-2">Choose a daily amount, or a day to finish by. Your reading in the reader is counted for you, and nothing is sent anywhere.</p>
        <div class="mt-5 flex flex-wrap justify-center gap-2.5">
          <Button class="h-12 min-h-12 px-8" data-testid="goals-new-first" @click="newOpen = true">Start a goal</Button>
          <Button as-child variant="outline" class="h-12 min-h-12"><NuxtLink :to="readHref" data-testid="goals-read">{{ store.position ? "Continue reading" : "Start reading" }}</NuxtLink></Button>
        </div>
        <p v-if="store.readToday" class="mt-4 text-[13px] text-ink-2" data-testid="goals-count-only">{{ store.readToday }} {{ store.readToday === 1 ? "ayah" : "ayahs" }} read today.</p>
      </div>

      <!-- today -->
      <div v-else class="mt-6 rounded-2xl border bg-surface p-5 md:p-6" data-testid="goals-today">
        <div class="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div class="min-w-0 flex-1">
            <div class="text-[13px] text-ink-2">Today</div>
            <div class="font-serif text-[44px] font-medium leading-none tabular-nums" data-testid="goals-count">
              {{ store.readToday }}
              <span class="font-sans text-[18px] font-normal text-ink-2" data-testid="goals-of">{{ amount ? `of ${amount} ayahs` : store.readToday === 1 ? "ayah read" : "ayahs read" }}</span>
            </div>
          </div>
          <div v-if="nextRow">
            <div class="text-[13px] text-ink-2">Next up</div>
            <NuxtLink :to="nextRow.href" class="inline-flex min-h-11 items-center font-serif text-[18px] text-brand underline-offset-2 hover:underline md:min-h-9" data-testid="goals-next">{{ nextRow.name }} {{ nextRow.surah }}:{{ nextRow.ayah }}</NuxtLink>
          </div>
        </div>
        <div v-if="amount" class="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" :aria-valuenow="barPct" aria-valuemin="0" aria-valuemax="100" aria-label="Today’s reading" data-testid="goals-bar"><div class="h-full bg-brand transition-all" :style="{ width: `${barPct}%` }" /></div>
        <p v-if="passed" class="mt-4 text-[14.5px]" role="status" data-testid="goals-passed">{{ PASSED_LINE }}</p>
        <div class="mt-5 flex flex-wrap gap-2.5">
          <Button as-child class="min-h-11"><NuxtLink :to="readHref" data-testid="goals-read"><Icon name="lucide:book-open" size="16" />{{ store.position ? "Continue reading" : "Start reading" }}</NuxtLink></Button>
          <Button v-if="passed" variant="outline" class="min-h-11" data-testid="goals-new-date" @click="newOpen = true">Choose a new date</Button>
          <Button variant="outline" class="min-h-11" data-testid="goals-log" @click="logOpen = true"><Icon name="lucide:plus" size="16" />Log reading from a mushaf</Button>
        </div>
        <p class="mt-4 text-[12.5px] text-ink-2">Ayahs count once they have been on screen for about a second and a half.</p>
        <div class="mt-2 flex flex-wrap gap-x-4 text-[13px]">
          <button type="button" class="inline-flex min-h-11 items-center text-ink-2 underline underline-offset-2 md:min-h-9" data-testid="goals-pause" @click="pause(main)">Pause this goal</button>
          <button type="button" class="inline-flex min-h-11 items-center text-ink-2 underline underline-offset-2 md:min-h-9" data-testid="goals-remove" @click="remove(main)">Remove this goal</button>
        </div>
      </div>

      <!-- through the Qur'an -->
      <section class="mt-8" aria-labelledby="goals-through-h" data-testid="goals-through">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id="goals-through-h" class="font-serif text-[20px] font-medium">Through the Qur’an</h2>
          <span class="text-[13px] text-ink-2 tabular-nums" data-testid="goals-place">{{ placeLine }}</span>
        </div>
        <GoalsJuzLine :cells="store.juz.cells" :done="store.juz.done" />
        <p v-if="!store.position" class="mt-3 text-[13px] text-ink-2">Open a surah in the reader and your place is saved here.</p>
        <p v-if="main?.type === 'finish-by-date' && amount && main.targetDate" class="mt-3 text-[13px] text-ink-2" data-testid="goals-keeps">{{ amount }} ayahs a day from here keeps your date.</p>
        <p v-if="store.average" class="mt-1 text-[13px] text-ink-2" data-testid="goals-average">Your last 7 days: {{ store.average }} ayahs a day on average.</p>
      </section>

      <!-- this week -->
      <section v-if="main" class="mt-8" aria-labelledby="goals-week-h">
        <h2 id="goals-week-h" class="mb-3 font-serif text-[20px] font-medium">This week</h2>
        <GoalsWeekBars :bars="store.week" :line="amount" />
        <p class="mt-3 text-[13px] text-ink-2">{{ main.type === "finish-by-date" ? "Days you read less are simply days; the daily amount is worked out again from where you are, to keep your date." : "Days you read less are simply days." }}</p>
      </section>

      <!-- other goals -->
      <section v-if="store.others.length" class="mt-8" aria-labelledby="goals-other-h" data-testid="goals-other">
        <h2 id="goals-other-h" class="mb-2 font-serif text-[20px] font-medium">Other goals</h2>
        <ul class="divide-y border-y">
          <li v-for="g in store.others" :key="g.id" class="flex items-center gap-3 py-3" data-testid="goals-other-row" :data-status="g.status">
            <Icon :name="ICON[g.status]" size="18" class="shrink-0 text-ink-2" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-medium">{{ g.label }}</p>
              <p class="text-[12.5px] text-ink-2">{{ STATUS_LABEL[g.status] }} · {{ typeLabel(g) }}</p>
            </div>
            <Button v-if="g.status !== 'completed'" variant="outline" class="min-h-11 md:min-h-9" :data-testid="`goals-resume-${g.id}`" @click="resume(g)">{{ g.status === "active" ? "Make main" : "Resume" }}</Button>
            <button type="button" class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-sunken md:size-9" :aria-label="`Remove ${g.label}`" data-testid="goals-other-remove" @click="remove(g)"><Icon name="lucide:trash-2" size="16" /></button>
          </li>
        </ul>
      </section>
    </template>

    <GoalsNewGoalSheet v-model:open="newOpen" />
    <GoalsLogSheet v-model:open="logOpen" />
  </section>
</template>
