<script setup lang="ts">
// The schedule: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha. "Latest" is the most recent start time that has passed and "Next" the
// next one to come: neither says when a prayer time ends. The bell toggles that prayer in the SAME record Settings writes
// (the legacy `prayerSettings.enabledPrayers`); with notifications off or blocked it links to Settings instead.
import { notificationPermission } from "~/lib/notifyBrowser";
import { formatClock12 } from "~/lib/prayerClock";
import type { PrayerName } from "~/lib/prayerMonth";
import type { ScheduleRow } from "~/lib/prayerRows";

defineProps<{ rows: ScheduleRow[] }>();
const store = usePreferencesStore();
const cfg = computed(() => store.prefs.notifications);
const permission = ref<ReturnType<typeof notificationPermission>>("default");
const refresh = () => (permission.value = notificationPermission());
onMounted(() => {
  refresh();
  document.addEventListener("visibilitychange", refresh);
});
onBeforeUnmount(() => document.removeEventListener("visibilitychange", refresh));

const live = computed(() => cfg.value.enabled && permission.value === "granted");
const toggle = (p: PrayerName) => store.set("notifications", { ...cfg.value, prayers: { ...cfg.value.prayers, [p]: !cfg.value.prayers[p] } });
const anyOn = computed(() => live.value && Object.values(cfg.value.prayers).some(Boolean));
const why = computed(() => (!cfg.value.enabled ? "Turn on prayer notifications in Settings" : permission.value === "denied" ? "Notifications are blocked for this site. Allow them in your browser, then check Settings" : "Allow notifications in Settings"));
</script>

<template>
  <div class="mt-3">
    <ul class="divide-y rounded-[10px] border bg-surface" data-testid="schedule-list">
      <li
        v-for="r in rows"
        :key="r.key"
        class="flex min-h-14 items-center gap-3 px-4 py-2"
        :class="[r.status === 'past' ? 'text-ink-2' : '', r.status === 'next' ? 'bg-accent' : '']"
        :data-testid="`row-${r.key}`"
        :data-status="r.status"
      >
        <span class="min-w-0 flex-1">
          <span class="text-[15px]" :class="r.isPrayer ? 'font-medium' : ''">{{ r.key }}</span>
          <span v-if="r.note" class="ml-2 text-[12px] text-ink-2" data-testid="jumuah">{{ r.note }}</span>
          <span v-if="r.status === 'latest'" class="ml-2 rounded-full border px-2 py-0.5 text-[11px]" data-testid="tag-latest">Latest</span>
          <span v-else-if="r.status === 'next'" class="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground" data-testid="tag-next">Next</span>
        </span>
        <span class="text-[15px] tabular-nums" data-testid="row-time">{{ formatClock12(r.time) }}</span>
        <template v-if="r.isPrayer">
          <button
            v-if="live"
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-full hover:bg-sunken md:size-9"
            :class="cfg.prayers[r.key as PrayerName] ? 'text-brand' : 'text-ink-2'"
            :aria-pressed="cfg.prayers[r.key as PrayerName]"
            :aria-label="`Notification for ${r.key}: ${cfg.prayers[r.key as PrayerName] ? 'on' : 'off'}`"
            data-testid="bell"
            @click="toggle(r.key as PrayerName)"
          >
            <Icon :name="cfg.prayers[r.key as PrayerName] ? 'lucide:bell-ring' : 'lucide:bell'" size="18" />
          </button>
          <NuxtLink
            v-else
            to="/settings?section=notifications"
            class="inline-flex size-11 items-center justify-center rounded-full text-ink-2 opacity-70 hover:bg-sunken md:size-9"
            :aria-label="`Notification for ${r.key}: off. ${why}`"
            :title="why"
            data-testid="bell-settings"
          >
            <Icon name="lucide:bell-off" size="18" />
          </NuxtLink>
        </template>
        <span v-else class="inline-block size-11 md:size-9" aria-hidden="true" />
      </li>
    </ul>
    <p v-if="anyOn" class="mt-2 text-[12.5px] text-ink-2" data-testid="reminder-note">Reminders only appear while Quran App is open.</p>
    <p v-if="!live" class="mt-2 text-[12.5px] text-ink-2" data-testid="bell-hint">{{ why }}.</p>
  </div>
</template>
