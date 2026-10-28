<script setup lang="ts">
// "Practise anything, no grading" (Phase 14): any surah and any ayahs, not only the ones in My surahs. Words are hidden to recite and slips are shown,
// and nothing at all is recorded: not the schedule, not tricky words, not the session. A side panel on a computer, a bottom sheet on a phone.
import { useMediaQuery } from "@vueuse/core";
import { SURAH_ROWS } from "~/data/quranMeta.generated";

const open = defineModel<boolean>("open", { required: true });
const isDesktop = useMediaQuery("(min-width: 768px)");
const surahNo = ref(1);
const from = ref(1);
const to = ref(1);
const total = computed(() => SURAH_ROWS[surahNo.value - 1]!.ayahs);
const ok = computed(() => Number.isInteger(from.value) && Number.isInteger(to.value) && from.value >= 1 && to.value <= total.value && from.value <= to.value);

watch(surahNo, () => {
  from.value = 1;
  to.value = Math.min(total.value, 10);
});
watch(open, (v) => {
  if (!v) return;
  from.value = 1;
  to.value = Math.min(total.value, 10);
});
const query = computed(() => ({ mode: "free", surah: String(surahNo.value), from: String(from.value), to: String(to.value) }));
const inputCls = "mt-1.5 h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]";
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-5 md:max-h-none md:w-[440px] md:max-w-none" data-testid="hifz-practice-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Practise anything</SheetTitle>
        <SheetDescription class="text-[13px]">Recite from memory. Nothing is graded and nothing is saved: your schedule and your tricky words stay as they are.</SheetDescription>
      </SheetHeader>
      <label class="block text-[13px] font-medium">Surah
        <select v-model.number="surahNo" :class="inputCls" data-testid="hifz-practice-surah">
          <option v-for="r in SURAH_ROWS" :key="r.n" :value="r.n">{{ r.n }}. {{ r.name }}</option>
        </select>
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block text-[13px] font-medium">From ayah
          <input v-model.number="from" type="number" inputmode="numeric" min="1" :max="total" :class="inputCls" data-testid="hifz-practice-from" />
        </label>
        <label class="block text-[13px] font-medium">To ayah
          <input v-model.number="to" type="number" inputmode="numeric" min="1" :max="total" :class="inputCls" data-testid="hifz-practice-to" />
        </label>
      </div>
      <p v-if="!ok" class="text-[13px] text-weak" role="status">{{ SURAH_ROWS[surahNo - 1]!.name }} has {{ total }} ayahs. Choose a start that is not after the end.</p>
      <Button as-child class="h-[54px] min-h-[54px] w-full text-[16px]" :class="ok ? '' : 'pointer-events-none opacity-50'">
        <NuxtLink :to="{ path: '/hifz/session', query }" :aria-disabled="!ok" :tabindex="ok ? undefined : -1" data-testid="hifz-practice-start" @click="open = false">Start practising</NuxtLink>
      </Button>
    </SheetContent>
  </Sheet>
</template>
