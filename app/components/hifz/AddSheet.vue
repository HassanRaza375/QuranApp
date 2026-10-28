<script setup lang="ts">
// Add a surah (Phase 14; prototype `addSheet`): the surah, how fast (Gentle 1, Steady 2, Faster 3 new ayahs a day), and what that means in weeks.
// The whole surah by default; "Choose ayahs" opens From and To (the legacy allowed a range). A side panel on a computer, a bottom sheet on a phone
// (it is a form, not a menu). A surah that is already in My surahs cannot be added twice.
import { useMediaQuery } from "@vueuse/core";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { weeksFor } from "~/lib/hifz/store";

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ added: [name: string, id: string] }>();
const store = useHifzStore();
const isDesktop = useMediaQuery("(min-width: 768px)");

const PACES = [
  { id: "gentle", label: "Gentle", perDay: 1, note: "1 new ayah a day" },
  { id: "steady", label: "Steady", perDay: 2, note: "2 a day" },
  { id: "faster", label: "Faster", perDay: 3, note: "3 a day" },
] as const;

const surahNo = ref(1);
const pace = ref<(typeof PACES)[number]["id"]>("steady");
const range = ref(false);
const from = ref(1);
const to = ref(1);

const row = computed(() => SURAH_ROWS[surahNo.value - 1]!);
const total = computed(() => row.value.ayahs);
const perDay = computed(() => PACES.find((p) => p.id === pace.value)!.perDay);
const startAyah = computed(() => (range.value ? from.value : 1));
const endAyah = computed(() => (range.value ? to.value : total.value));
const count = computed(() => endAyah.value - startAyah.value + 1);
const rangeOk = computed(() => !range.value || (Number.isInteger(from.value) && Number.isInteger(to.value) && from.value >= 1 && to.value <= total.value && from.value <= to.value));
const taken = computed(() => store.surahs.some((t) => t.surahNo === surahNo.value));
const weeks = computed(() => weeksFor(count.value, perDay.value));

watch(surahNo, () => {
  from.value = 1;
  to.value = total.value;
});
watch(open, (v) => {
  if (!v) return;
  surahNo.value = SURAH_ROWS.find((r) => !store.surahs.some((t) => t.surahNo === r.n))?.n ?? 1; // the first surah not added yet
  pace.value = "steady";
  range.value = false;
  from.value = 1;
  to.value = total.value;
});

function save() {
  if (taken.value || !rangeOk.value) return;
  const t = store.addSurah({ surahNo: surahNo.value, startAyah: startAyah.value, endAyah: endAyah.value, perDay: perDay.value });
  open.value = false;
  emit("added", row.value.name, t.id);
}
const inputCls = "mt-1.5 h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]";
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-5 md:max-h-none md:w-[440px] md:max-w-none" data-testid="hifz-add-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Add a surah</SheetTitle>
        <SheetDescription class="text-[13px]">You learn a few ayahs at a time and come back to them. Everything stays on this device.</SheetDescription>
      </SheetHeader>

      <label class="block text-[13px] font-medium">Surah
        <select v-model.number="surahNo" :class="inputCls" data-testid="hifz-add-surah">
          <option v-for="r in SURAH_ROWS" :key="r.n" :value="r.n">{{ r.n }}. {{ r.name }}</option>
        </select>
      </label>
      <p v-if="taken" class="text-[13px] text-ink-2" role="status" data-testid="hifz-add-taken">{{ row.name }} is already in My surahs.</p>

      <div v-if="!range" class="-mt-2">
        <button type="button" class="min-h-11 text-[13px] text-brand underline underline-offset-2 md:min-h-9" data-testid="hifz-add-range" @click="range = true">Choose ayahs</button>
      </div>
      <div v-else class="grid grid-cols-2 gap-3" data-testid="hifz-add-ayahs">
        <label class="block text-[13px] font-medium">From ayah
          <input v-model.number="from" type="number" inputmode="numeric" min="1" :max="total" :class="inputCls" data-testid="hifz-add-from" />
        </label>
        <label class="block text-[13px] font-medium">To ayah
          <input v-model.number="to" type="number" inputmode="numeric" min="1" :max="total" :class="inputCls" data-testid="hifz-add-to" />
        </label>
        <p v-if="!rangeOk" class="col-span-2 text-[13px] text-weak" role="status">{{ row.name }} has {{ total }} ayahs. Choose a start that is not after the end.</p>
        <div class="col-span-2 -mt-1"><button type="button" class="min-h-11 text-[13px] text-brand underline underline-offset-2 md:min-h-9" data-testid="hifz-add-whole" @click="range = false">Use the whole surah</button></div>
      </div>

      <fieldset>
        <legend class="text-[13px] font-medium">How fast</legend>
        <div class="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="How fast">
          <button
            v-for="p in PACES"
            :key="p.id"
            type="button"
            role="radio"
            :aria-checked="pace === p.id"
            class="min-h-11 rounded-[10px] border px-3 py-2.5 text-left"
            :class="pace === p.id ? 'border-brand shadow-[inset_0_0_0_1px_var(--accent)]' : ''"
            :data-testid="`hifz-pace-${p.id}`"
            @click="pace = p.id"
          >
            <span class="block text-[14px] font-medium">{{ p.label }}</span>
            <span class="block text-[12.5px] text-ink-2">{{ p.note }}</span>
          </button>
        </div>
      </fieldset>
      <p class="text-[13px] text-ink-2" data-testid="hifz-add-weeks">
        At {{ perDay }} a day, {{ range ? `ayahs ${startAyah} to ${endAyah}` : `all ${total} ayahs` }} of {{ row.name }} are started in about {{ weeks }} {{ weeks === 1 ? "week" : "weeks" }}. You can change this any time.
      </p>

      <Button class="h-[54px] min-h-[54px] w-full text-[16px]" :disabled="taken || !rangeOk" data-testid="hifz-add-save" @click="save">Add {{ row.name }}</Button>
    </SheetContent>
  </Sheet>
</template>
