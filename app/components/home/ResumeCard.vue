<script setup lang="ts">
// "Pick up where you left off" (returning) or "Get started" (new). Each row decides for itself from its own data.
// Row 2 is whichever is newer: the latest story progress (a story chapter) or the Prophets & People study state.
const { state } = useHomeState();

const readingRow = computed(() => {
  const r = state.value?.reading;
  return r
    ? { icon: "lucide:book-open", title: r.title, meta: r.meta, cta: "Continue reading", to: r.href, kind: "reading" }
    : { icon: "lucide:book-open", title: "Start reading", meta: "Begin your first reading session", cta: "Start reading", to: "/surah/1", kind: "start" };
});
const studyRow = computed(() => {
  const s = state.value?.study;
  return s
    ? { icon: s.kind === "story" ? "lucide:scroll-text" : "lucide:users", title: `You were reading: ${s.sectionLabel}`, meta: s.name, cta: "Continue", to: s.href, kind: "study" }
    : { icon: "lucide:users", title: "Explore Prophets & People", meta: "See how Qur’anic figures’ stories are told", cta: "Explore", to: "/persons", kind: "explore" };
});
const hasHistory = computed(() => !!state.value?.reading || !!state.value?.study);
const rows = computed(() => [readingRow.value, studyRow.value]);
</script>

<template>
  <section aria-labelledby="resume-title" class="mb-4 rounded-[10px] border border-l-[3px] border-l-brand bg-surface px-4 py-4 md:px-6" data-testid="resume-card">
    <template v-if="!state">
      <Skeleton class="mb-4 h-3 w-40" />
      <Skeleton class="mb-3 h-12 w-full" />
      <Skeleton class="h-12 w-full" />
    </template>
    <template v-else>
      <h2 id="resume-title" class="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-2" data-testid="resume-title">
        {{ hasHistory ? "Pick up where you left off" : "Get started" }}
      </h2>
      <ul>
        <li v-for="r in rows" :key="r.kind" class="flex items-center gap-4 border-t py-3 first:border-t-0" :data-testid="`resume-${r.kind}`">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-brand" aria-hidden="true"><Icon :name="r.icon" size="18" /></span>
          <div class="min-w-0 flex-1">
            <p class="font-serif text-[16px] font-medium leading-snug">{{ r.title }}</p>
            <p class="mt-0.5 text-[12.5px] text-ink-2">{{ r.meta }}</p>
          </div>
          <NuxtLink
            :to="r.to"
            class="inline-flex min-h-11 shrink-0 items-center rounded-md bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90 md:min-h-8"
          >
            {{ r.cta }}
          </NuxtLink>
        </li>
      </ul>
    </template>
  </section>
</template>
