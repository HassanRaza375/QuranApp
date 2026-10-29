<script setup lang="ts">
// New goal (Phase 15; prototype `sheetGoal`): four kinds, an amount or a day, and a live line saying how many ayahs a day that is and when you would
// finish. A side panel on a computer, a bottom sheet on a phone (it is a form). Starting a goal pauses the main one (said so on the button's note, and
// Undo is offered). No reading-time estimate: the prototype's minutes were invented. "Before Ramadan" comes from the calendar service with your
// Hijri adjustment, or is not offered.
import { useMediaQuery } from "@vueuse/core";
import { addDaysKey, daysBetweenKeys } from "~/lib/dayKeys";
import { AYAHS_PER_JUZ, OFFERED_TYPES, TOTAL_AYAHS, type GoalType } from "~/lib/goals/model";
import { previewDaily, problemWith, type NewGoal } from "~/lib/goals/store";
import { adjustedStart, findRamadan, RAMADAN } from "~/lib/hijriMonths";
import { formatLongDate } from "~/lib/ramadanText";
import { getHijriMonth, hijriDeps } from "~/services/hijri.service";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ initialType?: GoalType }>();
const store = useGoalsStore();
const prefs = usePreferencesStore();
const undo = useUndoToast();
const isDesktop = useMediaQuery("(min-width: 768px)");

const type = ref<GoalType>("finish-by-date");
const amount = ref(20);
const target = ref("");
const eve = ref<string | null>(null);

const DEFAULT_AMOUNT: Partial<Record<GoalType, number>> = { "ayahs-per-day": 20, "pages-per-day": 2, "juz-per-week": 1 };
const today = computed(() => store.today);
const isDate = computed(() => type.value === "finish-by-date");
const goal = computed<NewGoal>(() => (isDate.value ? { type: type.value, targetDate: target.value } : { type: type.value, amount: amount.value }));
const problem = computed(() => problemWith(goal.value, today.value));
const daily = computed(() => previewDaily(goal.value, { today: today.value, position: store.position }));
const finish = computed(() => {
  if (daily.value === null) return null;
  if (isDate.value) return target.value;
  return addDaysKey(today.value, Math.ceil((TOTAL_AYAHS - (store.position ?? 0)) / daily.value));
});
const unit = computed(() => (type.value === "pages-per-day" ? "Pages a day" : type.value === "juz-per-week" ? "Juz a week" : "Ayahs a day"));
const hint = computed(() => (type.value === "pages-per-day" ? `About ${(TOTAL_AYAHS / 604).toFixed(1)} ayahs a page.` : type.value === "juz-per-week" ? `About ${Math.round(AYAHS_PER_JUZ)} ayahs a juz.` : ""));

const chips = computed(() => {
  const y = Number(today.value.slice(0, 4));
  const endOfYear = `${y}-12-31` > today.value ? `${y}-12-31` : `${y + 1}-12-31`;
  const list: Array<{ id: string; label: string; date: string }> = [];
  if (eve.value && eve.value > today.value) list.push({ id: "ramadan", label: "Before Ramadan", date: eve.value });
  list.push({ id: "year", label: "End of year", date: endOfYear }, { id: "30", label: "In 30 days", date: addDaysKey(today.value, 30) });
  return list;
});

async function findEve() {
  eve.value = null;
  try {
    const deps = hijriDeps();
    const out = await findRamadan(today.value, async (y) => {
      const r = await getHijriMonth(deps, y, RAMADAN);
      return r.status === "ok" ? r.record : null;
    });
    if (out.status === "found") eve.value = addDaysKey(adjustedStart(out.record, prefs.prefs.hijriAdjust), -1);
  } catch {
    eve.value = null; // the chip is simply not offered
  }
}

watch(open, (v) => {
  if (!v) return;
  store.load();
  type.value = props.initialType ?? "finish-by-date";
  amount.value = DEFAULT_AMOUNT[type.value] ?? 20;
  target.value = addDaysKey(today.value, 30);
  void findEve();
});
function pick(t: GoalType) {
  type.value = t;
  amount.value = DEFAULT_AMOUNT[t] ?? amount.value;
}
const step = (d: number) => (amount.value = Math.max(1, Math.floor(Number(amount.value) || 1) + d));

function save() {
  if (problem.value) return;
  const made = store.create(goal.value);
  if (!made) return;
  open.value = false;
  undo.withUndo(made.paused ? "Goal started. Your previous goal is paused." : "Goal started.", made.undo);
}
const inputCls = "h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]";
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-5 md:max-h-none md:w-[440px] md:max-w-none" data-testid="goals-new-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">New goal</SheetTitle>
        <SheetDescription class="text-[13px]">Your reading in the reader is counted for you. Everything stays on this device.</SheetDescription>
      </SheetHeader>

      <fieldset>
        <legend class="sr-only">Kind of goal</legend>
        <div class="grid grid-cols-2 gap-2" data-testid="goals-types">
          <label v-for="t in OFFERED_TYPES" :key="t.type" class="relative block min-h-[76px] cursor-pointer rounded-[10px] border p-3 has-[:checked]:border-brand has-[:checked]:shadow-[inset_0_0_0_1px_var(--accent)] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
            <input type="radio" name="goal-type" class="sr-only" :value="t.type" :checked="type === t.type" :data-testid="`goals-type-${t.type}`" @change="pick(t.type)" />
            <span class="block text-[14px] font-medium">{{ t.title }}</span>
            <span class="mt-0.5 block text-[12.5px] text-ink-2">{{ t.hint }}</span>
          </label>
        </div>
      </fieldset>

      <div v-if="isDate">
        <p class="text-[13px] font-medium">Finish by</p>
        <div class="my-2 flex flex-wrap gap-2" role="group" aria-label="Quick dates">
          <button v-for="c in chips" :key="c.id" type="button" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13px] md:min-h-9" :class="target === c.date ? 'border-brand bg-accent text-brand' : ''" :aria-pressed="target === c.date" :data-testid="`goals-chip-${c.id}`" @click="target = c.date">{{ c.label }}</button>
        </div>
        <label class="block text-[13px] font-medium"><span class="sr-only">Finish by (date)</span>
          <input v-model="target" type="date" :min="addDaysKey(today, 1)" :class="inputCls" data-testid="goals-date" />
        </label>
      </div>
      <div v-else>
        <label for="goals-amount" class="block text-[13px] font-medium">{{ unit }}</label>
        <div class="mt-1.5 inline-flex items-center overflow-hidden rounded-lg border bg-surface">
          <button type="button" class="grid size-11 place-items-center hover:bg-sunken md:size-9" aria-label="Less" data-testid="goals-less" @click="step(-1)"><Icon name="lucide:minus" size="16" /></button>
          <input id="goals-amount" v-model.number="amount" type="number" inputmode="numeric" min="1" class="h-11 w-16 border-x bg-transparent text-center tabular-nums outline-none md:h-9" data-testid="goals-amount" />
          <button type="button" class="grid size-11 place-items-center hover:bg-sunken md:size-9" aria-label="More" data-testid="goals-more" @click="step(1)"><Icon name="lucide:plus" size="16" /></button>
        </div>
        <p v-if="hint" class="mt-1.5 text-[12.5px] text-ink-2">{{ hint }}</p>
      </div>

      <p v-if="problem" class="text-[13px] text-weak" role="status" data-testid="goals-problem">{{ problem }}</p>
      <div v-else class="rounded-[10px] bg-accent p-4" aria-live="polite" data-testid="goals-preview">
        <b class="font-serif text-[30px] font-medium leading-none text-brand tabular-nums" data-testid="goals-preview-n">{{ daily }}</b> <span class="text-[15px]">ayahs a day</span>
        <p v-if="finish" class="mt-1 text-[13px] text-ink-2" data-testid="goals-preview-finish">{{ isDate ? "You would finish on" : "You would finish around" }} {{ formatLongDate(finish) }}{{ isDate ? `, in ${daysBetweenKeys(today, finish)} days` : "" }}.</p>
        <p v-if="store.position" class="mt-1 text-[12.5px] text-ink-2">Counted from where you are in the reader.</p>
      </div>

      <div class="mt-auto">
        <Button class="h-12 min-h-12 w-full" :disabled="!!problem" data-testid="goals-start" @click="save">Start this goal</Button>
        <p v-if="store.main" class="mt-2 text-[12.5px] text-ink-2" data-testid="goals-pause-note">Your current goal, “{{ store.main.label }}”, is paused, not deleted.</p>
      </div>
    </SheetContent>
  </Sheet>
</template>
