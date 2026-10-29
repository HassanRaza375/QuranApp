<script setup lang="ts">
// Log reading from a printed mushaf (prototype `goal-log`): how many ayahs, added to today. Undo takes exactly those back.
import { useMediaQuery } from "@vueuse/core";

const open = defineModel<boolean>("open", { required: true });
const store = useGoalsStore();
const undo = useUndoToast();
const isDesktop = useMediaQuery("(min-width: 768px)");
const count = ref(5);
const ok = computed(() => Number.isInteger(count.value) && count.value >= 1 && count.value <= 6236);
watch(open, (v) => v && (count.value = 5));
const step = (d: number) => (count.value = Math.max(1, Math.floor(Number(count.value) || 1) + d));

function save() {
  if (!ok.value) return;
  const n = count.value;
  const undoLog = store.logManual(n);
  if (!undoLog) return;
  open.value = false;
  undo.withUndo(`Added ${n} ${n === 1 ? "ayah" : "ayahs"} to today.`, undoLog);
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-5 md:max-h-none md:w-[400px] md:max-w-none" data-testid="goals-log-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Log reading from a mushaf</SheetTitle>
        <SheetDescription class="text-[13px]">For reading from a printed mushaf. It counts toward today.</SheetDescription>
      </SheetHeader>
      <div>
        <label for="goals-log-n" class="block text-[13px] font-medium">Ayahs read</label>
        <div class="mt-1.5 inline-flex items-center overflow-hidden rounded-lg border bg-surface">
          <button type="button" class="grid size-11 place-items-center hover:bg-sunken md:size-9" aria-label="Less" @click="step(-1)"><Icon name="lucide:minus" size="16" /></button>
          <input id="goals-log-n" v-model.number="count" type="number" inputmode="numeric" min="1" class="h-11 w-16 border-x bg-transparent text-center tabular-nums outline-none md:h-9" data-testid="goals-log-n" />
          <button type="button" class="grid size-11 place-items-center hover:bg-sunken md:size-9" aria-label="More" @click="step(1)"><Icon name="lucide:plus" size="16" /></button>
        </div>
      </div>
      <Button class="h-12 min-h-12 w-full" :disabled="!ok" data-testid="goals-log-add" @click="save">Add to today</Button>
    </SheetContent>
  </Sheet>
</template>
