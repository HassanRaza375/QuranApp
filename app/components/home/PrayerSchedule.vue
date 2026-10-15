<script setup lang="ts">
// "View today's prayer schedule": the five prayers, the next one highlighted, plus where the times come from and how
// fresh they are. No "Update now" here (Prayer page and Settings only, Phase 5).
import { useOnline } from "@vueuse/core";
import { formatClock12, lastUpdatedText } from "~/lib/prayerClock";
import { PRAYERS } from "~/lib/prayerMonth";

const open = ref(false);
const online = useOnline();
const { location, asking, requestDevice } = useLocation();
const prayer = usePrayerTimes();

const updated = computed(() => (prayer.record.value ? lastUpdatedText(prayer.record.value.fetchedAt, new Date(prayer.now.value)) : ""));
const method = computed(() => prayer.record.value?.methodName ?? "");

const note = computed(() => {
  if (prayer.status.value !== "ready") return "";
  if (prayer.refreshing.value && online.value) return "Updating… the saved times stay in use until the new ones arrive.";
  if (!online.value) return `You’re offline, so the saved times are still in use. Last updated ${updated.value}.`;
  if (prayer.failure.value) return `Couldn’t refresh the times (${prayer.failure.value.reason}). The saved times are still in use. Last updated ${updated.value}.`;
  return `Last updated ${updated.value}.`;
});

async function setLocation() {
  if (await requestDevice()) await prayer.load();
}
</script>

<template>
  <section aria-label="Prayer schedule" class="mt-3">
    <button
      type="button"
      class="inline-flex min-h-11 items-center text-[12.5px] text-brand md:min-h-8"
      :aria-expanded="open"
      aria-controls="prayer-schedule-panel"
      data-testid="schedule-toggle"
      @click="open = !open"
    >
      View today’s prayer schedule ›
    </button>

    <div v-show="open" id="prayer-schedule-panel" class="mt-1" data-testid="schedule-panel">
      <template v-if="!location">
        <p class="text-[13px] text-ink-2">Set your location to see today’s prayer times.</p>
        <Button variant="outline" class="mt-2 min-h-11 md:min-h-8" :disabled="asking" @click="setLocation">{{ asking ? "Asking…" : "Set location" }}</Button>
      </template>

      <template v-else-if="prayer.status.value === 'loading'">
        <div class="grid grid-cols-5 gap-2" aria-busy="true"><Skeleton v-for="p in PRAYERS" :key="p" class="h-14" /></div>
      </template>

      <template v-else-if="prayer.status.value === 'failed'">
        <p class="text-[13px] text-ink-2" data-testid="schedule-failed">
          {{ prayer.failure.value?.kind === "offline" ? "Needs a connection once to load prayer times." : `Couldn’t load prayer times (${prayer.failure.value?.reason}).` }}
        </p>
        <Button variant="outline" class="mt-2 min-h-11 md:min-h-8" @click="prayer.load()">Try again</Button>
      </template>

      <template v-else-if="prayer.today.value">
        <ul class="grid grid-cols-5 gap-1.5 md:gap-2" data-testid="prayer-chips">
          <li
            v-for="p in PRAYERS"
            :key="p"
            class="rounded-lg border px-1 py-2 text-center text-[11px] md:text-[12.5px]"
            :class="prayer.next.value?.name === p && !prayer.next.value.isTomorrow ? 'border-primary bg-primary text-primary-foreground' : 'bg-surface'"
            :data-testid="`chip-${p}`"
            :aria-current="prayer.next.value?.name === p && !prayer.next.value.isTomorrow ? 'true' : undefined"
          >
            <span class="mb-0.5 block font-medium">{{ p }}</span>
            {{ formatClock12(prayer.today.value.timings[p]) }}
          </li>
        </ul>
        <p v-if="method" class="mt-2 text-[12px] text-ink-2" data-testid="schedule-method">Times follow: {{ method }}.</p>
        <p class="mt-1 text-[12px] text-ink-2" role="status" data-testid="schedule-note">{{ note }}</p>
      </template>

      <p v-else class="text-[13px] text-ink-2">Loading today’s times…</p>
    </div>
  </section>
</template>
