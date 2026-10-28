<script setup lang="ts">
// Add a reminder (Phase 15; prototype `sheetRem`): a title, a day, and "Repeat every year" on the same Hijri date (the default) or the same Gregorian date.
// A reminder is an item in your list: nothing is scheduled and no alert is sent. The Hijri date of the chosen day comes from the calendar service's
// saved days; when the day is not among them the Hijri choice says so and the Gregorian one is used.
import { useMediaQuery } from "@vueuse/core";
import type { ReminderRepeat } from "~/lib/reminders";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ defaultDate: string; defaultTitle: string; hijriOf: (date: string) => { month: number; day: number } | null }>();
const emit = defineEmits<{ save: [value: { title: string; date: string; repeat: ReminderRepeat | null }] }>();
const isDesktop = useMediaQuery("(min-width: 768px)");

const title = ref("");
const date = ref("");
const repeats = ref(false);
const by = ref<"hijri" | "gregorian">("hijri");
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const hijri = computed(() => (DAY.test(date.value) ? props.hijriOf(date.value) : null));
const ok = computed(() => title.value.trim().length > 0 && DAY.test(date.value));

watch(open, (v) => {
  if (!v) return;
  title.value = props.defaultTitle;
  date.value = props.defaultDate;
  repeats.value = false;
  by.value = "hijri";
});
watch(hijri, (h) => {
  if (!h && by.value === "hijri") by.value = "gregorian";
});

function save() {
  if (!ok.value) return;
  const repeat: ReminderRepeat | null = !repeats.value ? null : by.value === "hijri" && hijri.value ? { by: "hijri", month: hijri.value.month, day: hijri.value.day } : { by: "gregorian" };
  emit("save", { title: title.value.trim(), date: date.value, repeat });
  open.value = false;
}
const inputCls = "mt-1.5 h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]";
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-5 md:max-h-none md:w-[420px] md:max-w-none" data-testid="cal-reminder-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Add reminder</SheetTitle>
        <SheetDescription class="text-[13px]">Saved to your list on this device. No alert is sent.</SheetDescription>
      </SheetHeader>
      <label class="block text-[13px] font-medium">Title
        <input v-model="title" type="text" maxlength="120" placeholder="e.g. Fast on Monday" :class="inputCls" data-testid="cal-rem-title" @keydown.enter.prevent="save" />
      </label>
      <label class="block text-[13px] font-medium">Date
        <input v-model="date" type="date" :class="inputCls" data-testid="cal-rem-date" />
      </label>
      <div class="flex min-h-11 items-center gap-3">
        <label id="cal-rem-repeat-l" class="flex-1 text-[14px]">Repeat every year</label>
        <Switch :model-value="repeats" aria-labelledby="cal-rem-repeat-l" data-testid="cal-rem-repeat" @update:model-value="repeats = !!$event" />
      </div>
      <fieldset v-if="repeats" class="-mt-2" data-testid="cal-rem-by">
        <legend class="sr-only">Repeat on</legend>
        <label class="flex min-h-11 items-start gap-3 py-2 text-[14px]" :class="hijri ? '' : 'opacity-60'">
          <input v-model="by" type="radio" name="cal-rem-by" value="hijri" :disabled="!hijri" class="mt-1 size-4 accent-[var(--accent)]" data-testid="cal-rem-by-hijri" />
          <span>By Hijri date<span class="block text-[12.5px] text-ink-2" data-testid="cal-rem-by-hijri-note">{{ hijri ? "The same day of the same Hijri month each year." : "The Hijri date of that day is not saved on this device yet." }}</span></span>
        </label>
        <label class="flex min-h-11 items-start gap-3 py-2 text-[14px]">
          <input v-model="by" type="radio" name="cal-rem-by" value="gregorian" class="mt-1 size-4 accent-[var(--accent)]" data-testid="cal-rem-by-gregorian" />
          <span>By Gregorian date<span class="block text-[12.5px] text-ink-2">The same day of the same month each year.</span></span>
        </label>
      </fieldset>
      <Button class="mt-auto h-12 min-h-12 w-full" :disabled="!ok" data-testid="cal-rem-save" @click="save">Add reminder</Button>
    </SheetContent>
  </Sheet>
</template>
