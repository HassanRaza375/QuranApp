<script setup lang="ts">
// The grouped navigation, shared by the desktop sidebar and the mobile drawer.
// One row per destination; groups collapse (Read open by default); "Continue reading" shows only with progress.
import { HOME_ITEM, NAV, NAV_FOOTER, groupForPath, isActive } from "~/lib/nav";
import { continueReadingHref } from "~/lib/resume";
import { getJSON } from "~/lib/storage";

const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const prefs = usePreferencesStore();
const groups = computed(() => NAV.filter((g) => !g.optional || prefs.prefs[g.optional]));

const { open, load, set, reveal } = useNavOpen();
const continueHref = ref<string | null>(null);
const refreshContinue = () => {
  continueHref.value = continueReadingHref(getJSON<unknown>("quran:reading-progress:v1", null));
};
onMounted(() => {
  load();
  reveal(groupForPath(route.path));
  refreshContinue();
});
watch(
  () => route.path,
  (p) => {
    reveal(groupForPath(p));
    refreshContinue();
  },
);

const row = "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-ink-2 hover:bg-accent hover:text-foreground md:min-h-10";
const rowActive = "bg-accent font-medium text-foreground";
</script>

<template>
  <nav aria-label="Main" class="flex flex-col gap-1 text-[13.5px]">
    <ul>
      <li>
        <NuxtLink :to="HOME_ITEM.to" :class="[row, isActive(HOME_ITEM.to, route.path) ? rowActive : '']" :aria-current="isActive(HOME_ITEM.to, route.path) ? 'page' : undefined" @click="emit('navigate')">
          <span v-if="isActive(HOME_ITEM.to, route.path)" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
          <Icon :name="HOME_ITEM.icon" size="16" :class="isActive(HOME_ITEM.to, route.path) ? 'text-brand' : 'text-ink-2'" />{{ HOME_ITEM.label }}
        </NuxtLink>
      </li>
      <li v-if="continueHref">
        <NuxtLink :to="continueHref" :class="row" data-testid="continue-reading" @click="emit('navigate')">
          <Icon name="lucide:book-marked" size="16" class="text-ink-2" />Continue reading
        </NuxtLink>
      </li>
    </ul>

    <Collapsible v-for="g in groups" :key="g.id" :open="!!open[g.id]" class="mt-3" @update:open="(v: boolean) => set(g.id, v)">
      <CollapsibleTrigger as-child>
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-2 hover:bg-accent md:min-h-8"
          :data-testid="`group-${g.id}`"
        >
          {{ g.label }}
          <Icon name="lucide:chevron-down" size="14" class="transition-transform" :class="open[g.id] ? 'rotate-180' : ''" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul>
          <li v-for="i in g.items" :key="i.to">
            <NuxtLink :to="i.to" :class="[row, isActive(i.to, route.path) ? rowActive : '']" :aria-current="isActive(i.to, route.path) ? 'page' : undefined" @click="emit('navigate')">
              <span v-if="isActive(i.to, route.path)" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
              <Icon :name="i.icon" size="16" :class="isActive(i.to, route.path) ? 'text-brand' : 'text-ink-2'" />{{ i.label }}
            </NuxtLink>
          </li>
        </ul>
      </CollapsibleContent>
    </Collapsible>

    <ul class="mt-3 border-t pt-3">
      <li v-for="i in NAV_FOOTER" :key="i.to">
        <NuxtLink :to="i.to" :class="[row, isActive(i.to, route.path) ? rowActive : '']" :aria-current="isActive(i.to, route.path) ? 'page' : undefined" @click="emit('navigate')">
          <span v-if="isActive(i.to, route.path)" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
          <Icon :name="i.icon" size="16" :class="isActive(i.to, route.path) ? 'text-brand' : 'text-ink-2'" />{{ i.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
