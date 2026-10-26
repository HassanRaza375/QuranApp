<script setup lang="ts">
// The strip across the knowledge modules (prototype `ktabs`): one link per module whose pages exist, the current one marked.
import { KNOWLEDGE_READY, MODULE_ORDER, MODULES } from "~/lib/knowledge/modules";
import type { KnowledgeModuleId } from "~/lib/knowledge/types";

defineProps<{ current: KnowledgeModuleId }>();
const tabs = MODULE_ORDER.filter((m) => KNOWLEDGE_READY[m]).map((m) => MODULES[m]);
</script>

<template>
  <nav class="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 md:mx-0 md:px-0" aria-label="Knowledge base" data-testid="knowledge-tabs">
    <NuxtLink
      v-for="m in tabs"
      :key="m.id"
      :to="m.route"
      class="inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-[14px] text-ink-2 hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:font-medium aria-[current=page]:text-foreground"
      :aria-current="m.id === current ? 'page' : undefined"
      :data-testid="`ktab-${m.id}`"
    >
      <Icon :name="m.icon" size="16" />{{ m.title }}
    </NuxtLink>
  </nav>
</template>
