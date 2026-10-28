<script setup lang="ts">
// The legacy page's filters, behind one button: which edition to search in (ten, in four groups), one surah, one juz, saved ayahs only.
// Every change applies at once to the page behind. A side panel on desktop, a bottom sheet on mobile.
import { useMediaQuery } from "@vueuse/core";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { DEFAULT_EDITION, EDITION_GROUPS, editionsIn, isEditionGroup, type EditionGroup } from "~/lib/searchEditions";
import { activeFilterCount, type SearchState } from "~/lib/searchQuery";

const props = defineProps<{ open: boolean; state: SearchState }>();
const emit = defineEmits<{ close: []; change: [patch: Partial<SearchState>]; reset: [] }>();
const isDesktop = useMediaQuery("(min-width: 768px)");
const model = computed({ get: () => props.open, set: (v) => !v && emit("close") });
const active = computed(() => activeFilterCount(props.state));
const groupOptions = EDITION_GROUPS.map((g) => ({ value: g.value, label: g.label }));
const editionOptions = computed(() => editionsIn(props.state.group).map((e) => ({ value: e.id, label: e.title })));
const juz = Array.from({ length: 30 }, (_, i) => i + 1);

const setGroup = (v: string) => {
  if (isEditionGroup(v)) emit("change", { group: v as EditionGroup, edition: DEFAULT_EDITION[v] });
};
const asNumber = (v: string): number | null => (v ? Number(v) : null);
const selectClass = "h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]";
</script>

<template>
  <Sheet v-model:open="model">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[420px] md:max-w-none" data-testid="filters-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Filters</SheetTitle>
        <SheetDescription class="text-[13px]">Narrow the ayah search. Changes apply as you make them.</SheetDescription>
      </SheetHeader>

      <div class="space-y-5">
        <div>
          <p id="f-group" class="mb-1.5 text-[13px] font-medium">Search in</p>
          <SettingsSegmentedControl :model-value="state.group" :options="groupOptions" label="Search in" labelledby="f-group" data-testid="filter-group" @update:model-value="setGroup" />
        </div>

        <div>
          <p id="f-edition" class="mb-1.5 text-[13px] font-medium">Edition</p>
          <SettingsSegmentedControl :model-value="state.edition" :options="editionOptions" label="Edition" labelledby="f-edition" data-testid="filter-edition" @update:model-value="(v) => emit('change', { edition: v })" />
          <p v-if="state.group === 'tafsir'" class="mt-1.5 text-[12.5px] text-ink-2" data-testid="filter-tafsir-note">Sunni tafsir sources, Arabic only.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block text-[13px] font-medium">Surah
            <select :value="state.surah ?? ''" :class="[selectClass, 'mt-1.5 font-normal']" data-testid="filter-surah" @change="(e) => emit('change', { surah: asNumber((e.target as HTMLSelectElement).value) })">
              <option value="">All surahs</option>
              <option v-for="s in SURAH_ROWS" :key="s.n" :value="s.n">{{ s.n }}. {{ s.name }}</option>
            </select>
          </label>
          <label class="block text-[13px] font-medium">Juz
            <select :value="state.juz ?? ''" :class="[selectClass, 'mt-1.5 font-normal']" data-testid="filter-juz" @change="(e) => emit('change', { juz: asNumber((e.target as HTMLSelectElement).value) })">
              <option value="">All juz</option>
              <option v-for="j in juz" :key="j" :value="j">Juz {{ j }}</option>
            </select>
          </label>
        </div>

        <label class="flex min-h-11 items-center justify-between gap-3 text-[14px]">
          <span id="f-saved">Saved ayahs only</span>
          <Switch :model-value="state.bookmarked" aria-labelledby="f-saved" data-testid="filter-bookmarked" @update:model-value="(v) => emit('change', { bookmarked: !!v })" />
        </label>
      </div>

      <div class="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" class="min-h-11 md:min-h-8" :disabled="!active" data-testid="filters-reset" @click="emit('reset')">Reset filters</Button>
        <Button class="min-h-11 md:min-h-8" data-testid="filters-done" @click="emit('close')">Done</Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
