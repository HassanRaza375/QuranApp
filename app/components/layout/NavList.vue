<script setup lang="ts">
// The grouped navigation, shared by the desktop sidebar and the mobile drawer.
import { NAV, NAV_FOOTER, isActive } from "~/lib/nav";

const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const prefs = usePreferencesStore();
const groups = computed(() => NAV.filter((g) => !g.optional || prefs.prefs[g.optional]));
const linkClass = "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-ink-2 hover:bg-accent hover:text-foreground md:min-h-10";
</script>

<template>
  <nav aria-label="Main" class="flex flex-col gap-6 text-[13.5px]">
    <div v-for="g in groups" :key="g.id">
      <p class="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2">{{ g.label }}</p>
      <ul>
        <li v-for="i in g.items" :key="i.to">
          <NuxtLink
            :to="i.to"
            :class="[linkClass, isActive(i.to, route.path) ? 'bg-accent font-medium text-foreground' : '']"
            :aria-current="isActive(i.to, route.path) ? 'page' : undefined"
            @click="emit('navigate')"
          >
            <span v-if="isActive(i.to, route.path)" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
            <Icon :name="i.icon" size="18" />{{ i.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <ul class="border-t pt-4">
      <li v-for="i in NAV_FOOTER" :key="i.to">
        <NuxtLink
          :to="i.to"
          :class="[linkClass, isActive(i.to, route.path) ? 'bg-accent font-medium text-foreground' : '']"
          :aria-current="isActive(i.to, route.path) ? 'page' : undefined"
          @click="emit('navigate')"
        >
          <span v-if="isActive(i.to, route.path)" class="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand" aria-hidden="true" />
          <Icon :name="i.icon" size="18" />{{ i.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
