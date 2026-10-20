<script setup lang="ts">
// "Get ready": the real settings behind Ramadan, each with a link to change it. No claim about practice, only what is set.
import { methodName } from "~/lib/calcMethods";
import { adjustNote } from "~/lib/hijriAdjust";

const prefs = usePreferencesStore();
const prayer = usePrayerTimes();
const method = computed(() => prayer.record.value?.methodName || methodName(prefs.prefs.fiqh === "jafari" ? prefs.prefs.calc.jafariMethod : prefs.prefs.calc.sunniMethod));
const rows = computed(() => [
  { id: "method", label: "Fiqh and calculation method", value: `${prefs.prefs.fiqh === "jafari" ? "Ja’fari" : "Sunni"} · ${method.value}`, to: "/settings?section=prayer", cta: "Change" },
  { id: "hijri", label: "Hijri date adjustment", value: prefs.prefs.hijriAdjust ? adjustNote(prefs.prefs.hijriAdjust) : "None (0 days)", to: "/settings?section=prayer", cta: "Adjust" },
  { id: "alerts", label: "Prayer alerts", value: prefs.prefs.notifications.enabled ? "On" : "Off", to: "/settings?section=notifications", cta: prefs.prefs.notifications.enabled ? "Manage" : "Turn on" },
]);
</script>

<template>
  <section aria-labelledby="ready-h" data-testid="get-ready">
    <h2 id="ready-h" class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Get ready</h2>
    <ul class="mt-2 rounded-[10px] border">
      <li v-for="r in rows" :key="r.id" class="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" :data-testid="`ready-${r.id}`">
        <div class="min-w-0 flex-1">
          <p class="text-[14.5px]">{{ r.label }}</p>
          <p class="text-[12.5px] text-ink-2" data-testid="ready-value">{{ r.value }}</p>
        </div>
        <NuxtLink :to="r.to" class="inline-flex min-h-11 items-center text-[13.5px] text-brand underline md:min-h-9" data-testid="ready-link">{{ r.cta }}</NuxtLink>
      </li>
    </ul>
  </section>
</template>
