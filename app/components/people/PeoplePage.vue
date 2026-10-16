<script setup lang="ts">
// Prophets & People (prototype d-page-people / m-page-people): the directory and the Timeline, as two links (one URL each).
// All of it comes from the bundled legacy data, so it works offline. See docs/phases/phase-07a-people.md.
defineProps<{ view: "browse" | "timeline" }>();
useSeoMeta({ title: "Prophets & People of the Qur’an · Quran App", description: "Browse the prophets and people mentioned in the Qur’an, with their references and relationships." });
const TABS = [
  { id: "browse", label: "Browse people", to: "/persons" },
  { id: "timeline", label: "Timeline", to: "/persons/timeline" },
];
</script>

<template>
  <section>
    <h1 class="font-serif text-[28px] font-medium">Prophets &amp; People of the Qur’an</h1>
    <p class="mt-1 text-[14px] text-ink-2">Explore the prophets and people mentioned in the Qur’an, their references, stories and relationships.</p>
    <nav aria-label="People views" class="mt-4 flex border-b" data-testid="people-tabs">
      <NuxtLink
        v-for="t in TABS"
        :key="t.id"
        :to="t.to"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="t.id === view ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="t.id === view ? 'page' : undefined"
        :data-testid="`tab-${t.id}`"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>
    <div class="mt-4">
      <PeopleDirectory v-if="view === 'browse'" />
      <PeopleTimeline v-else />
    </div>
  </section>
</template>
