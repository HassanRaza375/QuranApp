<script setup lang="ts">
// Connected / Referenced by: links grouped by module. A link opens only where the target's page exists; otherwise the name is plain text.
import type { LinkGroup } from "~/lib/knowledge/graph";

defineProps<{ groups: LinkGroup[]; testid: string }>();
</script>

<template>
  <div class="space-y-3" :data-testid="testid">
    <div v-for="g in groups" :key="g.module" :data-testid="`${testid}-${g.module}`">
      <h3 class="text-[13px] font-medium text-ink-2">{{ g.label }}</h3>
      <ul class="mt-1.5 flex flex-wrap gap-1.5">
        <li v-for="i in g.items" :key="i.id">
          <NuxtLink v-if="i.href" :to="i.href" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13.5px] hover:bg-accent md:min-h-9" data-testid="k-link">{{ i.name }}</NuxtLink>
          <span v-else class="inline-flex min-h-9 items-center rounded-full border border-dashed px-3.5 text-[13.5px] text-ink-2" data-testid="k-link-plain">{{ i.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
