<script setup lang="ts">
// The edit panel for one item (a bottom sheet on mobile, a side sheet on desktop): note (autosaved 600 ms after typing stops and on
// close), tags, collections, Open, Remove from Saved / Save this ayah too, Delete note. Closing mid-typing never loses text.
import { useMediaQuery } from "@vueuse/core";
import { isSaved, NOTE_MAX, TAG_MAX } from "~/lib/library";
import { agoText, OPENS_TODAY, TYPE_LABEL } from "~/lib/libraryItems";

const props = defineProps<{ itemKey: string | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useLibraryStore();
const isDesktop = useMediaQuery("(min-width: 768px)");

const open = computed({
  get: () => props.itemKey !== null,
  set: (v) => {
    if (!v) close();
  },
});
const item = computed(() => (props.itemKey ? store.describe(props.itemKey) : null));
const meta = computed(() => (props.itemKey ? store.meta(props.itemKey) : null));
const saved = computed(() => (props.itemKey ? isSaved(store.lib, props.itemKey) : false));

const note = ref("");
const status = ref<"" | "saving" | "saved">("");
const error = ref("");
const tag = ref("");
const newName = ref("");
const addingCollection = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
let loadedKey: string | null = null;

watch(
  () => props.itemKey,
  (k, old) => {
    if (old && old !== k) flush(old);
    loadedKey = k;
    note.value = k ? store.meta(k).note : "";
    status.value = "";
    error.value = "";
    tag.value = "";
    addingCollection.value = false;
  },
  { immediate: true },
);

function flush(key = loadedKey) {
  clearTimeout(timer);
  timer = undefined;
  if (!key || store.meta(key).note === note.value) return;
  const r = store.setNote(key, note.value);
  error.value = r?.error ?? "";
  status.value = r ? "" : "saved";
}
function onInput() {
  status.value = "saving";
  clearTimeout(timer);
  const key = loadedKey;
  timer = setTimeout(() => flush(key), 600);
}
function close() {
  flush();
  emit("close");
}
onBeforeUnmount(() => flush());

function addTag() {
  if (!props.itemKey) return;
  const r = store.addTag(props.itemKey, tag.value);
  error.value = r?.error ?? "";
  if (!r) tag.value = "";
}
function createCollection() {
  if (!props.itemKey) return;
  const c = store.createCollection(newName.value);
  if ("error" in c) {
    error.value = c.error;
    return;
  }
  store.toggleCollection(props.itemKey, c.id);
  newName.value = "";
  addingCollection.value = false;
  error.value = "";
}
function removeItem() {
  if (!props.itemKey || !item.value) return;
  flush();
  store.remove([props.itemKey], `Removed ${item.value.title} from Saved`);
  emit("close");
}
function saveToo() {
  if (props.itemKey) store.save(props.itemKey);
}
function deleteNote() {
  if (!props.itemKey) return;
  clearTimeout(timer);
  note.value = "";
  store.deleteNote(props.itemKey);
  status.value = "";
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[420px] md:max-w-none" data-testid="edit-sheet">
      <template v-if="item && meta">
        <SheetHeader class="p-0 pr-10">
          <SheetTitle class="text-[17px]">{{ item.title }}</SheetTitle>
          <SheetDescription class="text-[13px]" data-testid="edit-sub">{{ TYPE_LABEL[item.type] }} · {{ saved ? agoText(store.lib.addedAt[item.key], new Date()) : "Note only, not in Saved" }}</SheetDescription>
        </SheetHeader>

        <div class="space-y-5">
          <div>
            <label for="note-text" class="text-[13px] font-medium">Note</label>
            <textarea id="note-text" v-model="note" rows="4" :maxlength="NOTE_MAX" class="mt-1 w-full rounded-md border bg-background p-2 text-[14.5px]" data-testid="edit-note" @input="onInput" @blur="flush()" />
            <p class="min-h-5 text-[12px] text-ink-2" role="status" data-testid="edit-status">{{ status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "" }}</p>
          </div>

          <div>
            <p id="tags-label" class="text-[13px] font-medium">Tags</p>
            <ul class="mt-1 flex flex-wrap gap-1.5" aria-labelledby="tags-label">
              <li v-for="t in meta.tags" :key="t" class="inline-flex items-center rounded-full bg-muted pl-2.5 text-[12.5px]" data-testid="edit-tag">
                #{{ t }}
                <button type="button" class="inline-flex size-11 items-center justify-center md:size-7" :aria-label="`Remove tag ${t}`" data-testid="edit-tag-remove" @click="store.removeTag(item.key, t)"><Icon name="lucide:x" size="13" /></button>
              </li>
            </ul>
            <form class="mt-2 flex gap-2" @submit.prevent="addTag">
              <Input v-model="tag" aria-label="New tag" placeholder="Add a tag" :maxlength="TAG_MAX + 1" autocomplete="off" class="!h-11 flex-1 md:!h-9" data-testid="edit-tag-input" />
              <Button type="submit" variant="outline" class="min-h-11 md:min-h-9" data-testid="edit-tag-add">Add</Button>
            </form>
          </div>

          <div>
            <p id="coll-label" class="text-[13px] font-medium">Collections</p>
            <ul class="mt-1 flex flex-wrap gap-1.5" aria-labelledby="coll-label">
              <li v-for="c in store.lib.collections" :key="c.id">
                <button type="button" class="min-h-11 rounded-full border px-3 text-[13px] md:min-h-8" :class="meta.collectionIds.includes(c.id) ? 'border-brand bg-accent text-brand' : ''" :aria-pressed="meta.collectionIds.includes(c.id)" data-testid="edit-collection" @click="store.toggleCollection(item.key, c.id)">{{ c.name }}</button>
              </li>
            </ul>
            <Button v-if="!addingCollection" variant="ghost" class="mt-1 min-h-11 gap-2 px-2 md:min-h-8" data-testid="edit-collection-new" @click="addingCollection = true"><Icon name="lucide:plus" size="15" />New collection</Button>
            <form v-else class="mt-2 flex gap-2" @submit.prevent="createCollection">
              <Input v-model="newName" aria-label="New collection name" placeholder="Collection name" maxlength="60" class="!h-11 flex-1 md:!h-9" data-testid="edit-collection-name" />
              <Button type="submit" variant="outline" class="min-h-11 md:min-h-9" data-testid="edit-collection-create">Create</Button>
            </form>
          </div>

          <p v-if="error" class="text-[13px] text-destructive" role="alert" data-testid="edit-error">{{ error }}</p>

          <div class="flex flex-wrap gap-2 border-t pt-4">
            <Button v-if="item.href" as-child variant="outline" class="min-h-11 md:min-h-9"><NuxtLink :to="item.href" data-testid="edit-open" @click="close">Open{{ OPENS_TODAY[item.type] ? "" : " (not rebuilt yet)" }}</NuxtLink></Button>
            <Button v-if="saved" variant="outline" class="min-h-11 md:min-h-9" data-testid="edit-remove" @click="removeItem">Remove from Saved</Button>
            <Button v-else-if="item.ayah" variant="outline" class="min-h-11 md:min-h-9" data-testid="edit-save-too" @click="saveToo">Save this ayah too</Button>
            <Button v-if="meta.note.trim()" variant="ghost" class="min-h-11 md:min-h-9" data-testid="edit-delete-note" @click="deleteNote">Delete note</Button>
          </div>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
