<script setup lang="ts">
// Notes: every item with a note (saved or not), grouped by surah for ayahs and "Other" for the rest, newest edit first in a group.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { metaOf } from "~/lib/library";
import { normalize } from "~/lib/listingSearch";

const emit = defineEmits<{ edit: [key: string]; "new-note": [] }>();
const store = useLibraryStore();
const query = ref("");

const groups = computed(() => {
  const q = normalize(query.value);
  const out = new Map<string, { label: string; order: number; keys: string[] }>();
  for (const key of store.notes) {
    const m = metaOf(store.lib, key);
    const item = store.describe(key);
    if (q && !normalize(`${item.title} ${m.note} ${m.tags.join(" ")}`).includes(q)) continue;
    const surah = item.ayah?.surah;
    const id = surah ? `s${surah}` : "other";
    if (!out.has(id)) out.set(id, { label: surah ? (SURAH_ROWS[surah - 1]?.name ?? `Surah ${surah}`) : "Other", order: surah ?? 999, keys: [] });
    out.get(id)!.keys.push(key);
  }
  for (const g of out.values()) g.keys.sort((a, b) => metaOf(store.lib, b).updatedAt - metaOf(store.lib, a).updatedAt || a.localeCompare(b));
  return [...out.values()].sort((a, b) => a.order - b.order);
});
</script>

<template>
  <div>
    <div class="flex gap-2">
      <Input v-model="query" type="search" autocomplete="off" placeholder="Search notes and tags" aria-label="Search notes" class="!h-11 flex-1 md:!h-9" data-testid="notes-search" />
      <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" data-testid="new-note-open" @click="emit('new-note')"><Icon name="lucide:plus" size="16" />New note</Button>
    </div>
    <div v-if="groups.length" class="mt-2">
      <section v-for="g in groups" :key="g.label" data-testid="notes-group">
        <h2 class="mt-4 text-[13px] font-medium uppercase tracking-wide text-ink-2">{{ g.label }}</h2>
        <ul>
          <li v-for="k in g.keys" :key="k" class="border-b" data-testid="note-row">
            <button type="button" class="block min-h-11 w-full py-3 text-left" :data-key="k" data-testid="note-open" @click="emit('edit', k)">
              <span class="block text-[14.5px] font-medium">{{ store.describe(k).title }}<span v-if="!store.lib.bookmarks.includes(k)" class="ml-2 text-[12px] font-normal text-ink-2">not in Saved</span></span>
              <span class="mt-0.5 line-clamp-3 block whitespace-pre-line text-[13.5px]">{{ metaOf(store.lib, k).note }}</span>
              <span v-if="metaOf(store.lib, k).tags.length" class="mt-1 block text-[12px] text-ink-2">{{ metaOf(store.lib, k).tags.map((t) => `#${t}`).join(" ") }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
    <div v-else-if="query.trim()" class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="notes-no-match">
      <p class="text-[15px]">Nothing matches your search.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" @click="query = ''">Clear</Button>
    </div>
    <div v-else class="mt-4 rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="no-notes">
      <p class="text-[15px]">No notes yet. Add one from the more menu on a saved item, or write one for any ayah with New note.</p>
    </div>
  </div>
</template>
