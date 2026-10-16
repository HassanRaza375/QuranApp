<script setup lang="ts">
// Prayer & Qibla (prototype d-page-prayer / m-page-prayer): two tabs that are two routes (the legacy /prayerTime and
// /qibla-direction), one component. The tabs are links, so each has its own URL, back button and bookmark.
export type PrayerTab = "times" | "qibla";
const props = defineProps<{ tab: PrayerTab }>();

useSeoMeta({
  title: () => (props.tab === "qibla" ? "Qibla direction · Quran App" : "Prayer times · Quran App"),
  description: () => (props.tab === "qibla" ? "Find the Qibla direction from your location." : "Prayer times calculated for your location, for the Sunni and Ja’fari methods."),
});

const TABS: { id: PrayerTab; label: string; to: string }[] = [
  { id: "times", label: "Prayer times", to: "/prayerTime" },
  { id: "qibla", label: "Qibla", to: "/qibla-direction" },
];
</script>

<template>
  <section>
    <h1 class="font-serif text-[28px] font-medium">Prayer &amp; Qibla</h1>
    <p class="mt-1 text-[14px] text-ink-2">Times and direction for your location.</p>

    <nav aria-label="Prayer and Qibla views" class="mt-4 flex border-b" data-testid="prayer-tabs">
      <NuxtLink
        v-for="t in TABS"
        :key="t.id"
        :to="t.to"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="t.id === tab ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="t.id === tab ? 'page' : undefined"
        :data-testid="`tab-${t.id}`"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>

    <div class="mt-5">
      <PrayerTimesPanel v-if="tab === 'times'" />
      <PrayerQiblaPanel v-else />
    </div>
  </section>
</template>
