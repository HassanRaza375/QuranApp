<script setup lang="ts">
// Collections: a list with counts and a two-title preview, New collection, open (the Saved view filtered by it), delete with Undo.
import { collectionMembers } from "~/lib/library";

const emit = defineEmits<{ open: [id: string] }>();
const store = useLibraryStore();
const adding = ref(false);
const name = ref("");
const error = ref("");

const rows = computed(() =>
  store.lib.collections.map((c) => {
    const members = collectionMembers(store.lib, c.id);
    return { c, count: members.length, preview: members.slice(0, 2).map((k) => store.describe(k).title) };
  }),
);

function create() {
  const r = store.createCollection(name.value);
  if ("error" in r) {
    error.value = r.error;
    return;
  }
  error.value = "";
  name.value = "";
  adding.value = false;
}
</script>

<template>
  <div>
    <Button v-if="!adding" variant="outline" class="min-h-11 gap-2 md:min-h-8" data-testid="collection-new" @click="adding = true"><Icon name="lucide:plus" size="16" />New collection</Button>
    <form v-else class="space-y-2" @submit.prevent="create">
      <label for="collection-name" class="text-[13px] font-medium">Collection name</label>
      <div class="flex gap-2">
        <Input id="collection-name" v-model="name" autocomplete="off" maxlength="60" class="!h-11 flex-1 md:!h-9" :aria-invalid="!!error" aria-describedby="collection-error" data-testid="collection-name" />
        <Button type="submit" class="min-h-11 md:min-h-9" data-testid="collection-create">Create</Button>
        <Button type="button" variant="ghost" class="min-h-11 md:min-h-9" @click="adding = false; error = ''; name = ''">Cancel</Button>
      </div>
      <p id="collection-error" class="text-[12.5px] text-destructive" role="alert" data-testid="collection-error">{{ error }}</p>
    </form>

    <ul v-if="rows.length" class="mt-4">
      <li v-for="r in rows" :key="r.c.id" class="flex items-center gap-2 border-b py-3" data-testid="collection-row">
        <button type="button" class="min-h-11 min-w-0 flex-1 text-left" :data-collection="r.c.id" data-testid="collection-open" @click="emit('open', r.c.id)">
          <span class="block text-[15px] font-medium">{{ r.c.name }}</span>
          <span class="block text-[12.5px] text-ink-2">{{ r.count }} {{ r.count === 1 ? "item" : "items" }}<template v-if="r.preview.length"> · {{ r.preview.join(", ") }}</template></span>
        </button>
        <Button variant="ghost" class="size-11 shrink-0 md:size-9" :aria-label="`Delete collection ${r.c.name}`" data-testid="collection-delete" @click="store.deleteCollection(r.c.id)"><Icon name="lucide:trash-2" size="16" /></Button>
      </li>
    </ul>
    <div v-else-if="!adding" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="no-collections">
      <p class="text-[15px]">No collections yet. Collections group saved items.</p>
    </div>
  </div>
</template>
