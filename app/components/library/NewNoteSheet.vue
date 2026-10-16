<script setup lang="ts">
// New note for any ayah reference ("2:255"). The reference is checked against the real ayah counts; a note is required; an ayah that
// already has a note opens that note instead of creating a second one.
import { useMediaQuery } from "@vueuse/core";
import { NOTE_MAX } from "~/lib/library";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; open: [key: string] }>();
const store = useLibraryStore();
const isDesktop = useMediaQuery("(min-width: 768px)");
const undo = useUndoToast();

const ref_ = ref("");
const text = ref("");
const error = ref("");
const model = computed({ get: () => props.open, set: (v) => !v && emit("close") });
watch(() => props.open, (o) => {
  if (o) {
    ref_.value = "";
    text.value = "";
    error.value = "";
  }
});

function submit() {
  const r = store.newNote(ref_.value, text.value);
  if ("error" in r) {
    error.value = r.error;
    return;
  }
  emit("close");
  if (r.existing) {
    undo.info("That ayah already has a note. Opening it.");
    emit("open", r.key);
  } else undo.info("Note added.");
}
</script>

<template>
  <Sheet v-model:open="model">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[420px] md:max-w-none" data-testid="new-note-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">New note</SheetTitle>
        <SheetDescription class="text-[13px]">Write a note for any ayah, saved or not.</SheetDescription>
      </SheetHeader>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="nn-ref" class="text-[13px] font-medium">Ayah (surah:ayah, like 2:255)</label>
          <Input id="nn-ref" v-model="ref_" inputmode="text" autocomplete="off" class="mt-1 !h-11 md:!h-9" :aria-invalid="!!error" aria-describedby="nn-error" data-testid="new-note-ref" />
        </div>
        <div>
          <label for="nn-text" class="text-[13px] font-medium">Note</label>
          <textarea id="nn-text" v-model="text" rows="4" :maxlength="NOTE_MAX" class="mt-1 w-full rounded-md border bg-background p-2 text-[14.5px]" data-testid="new-note-text" />
        </div>
        <p id="nn-error" class="min-h-5 text-[13px] text-destructive" role="alert" data-testid="new-note-error">{{ error }}</p>
        <Button type="submit" class="min-h-11 md:min-h-9" data-testid="new-note-save">Save note</Button>
      </form>
    </SheetContent>
  </Sheet>
</template>
