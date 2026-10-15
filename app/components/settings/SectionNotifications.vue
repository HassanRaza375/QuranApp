<script setup lang="ts">
// Prayer reminders. The honest limit is one fixed sentence: reminders only appear while the app is open.
// Turning the switch on asks the browser for permission in that tap; a refusal is explained inline (never `alert()`).
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { needsHomeScreenHint, notificationPermission, requestNotificationPermission, showNotificationNow, type PermissionState } from "~/lib/notifyBrowser";
import { NOTIFY_LIMIT_SENTENCE, REMINDER_OFFSETS } from "~/lib/notifySchedule";
import { PRAYERS } from "~/lib/prayerMonth";

const store = usePreferencesStore();
const cfg = computed(() => store.prefs.notifications);

const permission = ref<PermissionState>("default");
const refreshPermission = () => {
  permission.value = notificationPermission();
};
onMounted(() => {
  refreshPermission();
  window.addEventListener("focus", refreshPermission);
  document.addEventListener("visibilitychange", refreshPermission);
  // Where the browser announces permission changes, follow them (Safari does not, so focus and visibility also refresh).
  navigator.permissions?.query({ name: "notifications" as PermissionName }).then((s) => (s.onchange = refreshPermission)).catch(() => undefined);
});
onBeforeUnmount(() => {
  window.removeEventListener("focus", refreshPermission);
  document.removeEventListener("visibilitychange", refreshPermission);
});

const permissionText = computed(
  () =>
    ({
      granted: "Allowed",
      denied: "Blocked",
      default: "Not asked yet",
      unsupported: "Not available in this browser",
    })[permission.value],
);
const message = ref("");
const homeScreenHint = ref(false);
onMounted(() => (homeScreenHint.value = needsHomeScreenHint()));

async function onToggle(on: boolean) {
  message.value = "";
  if (!on) return store.set("notifications", { ...cfg.value, enabled: false });
  let state = notificationPermission();
  if (state === "default") state = await requestNotificationPermission();
  refreshPermission();
  if (state === "granted") return store.set("notifications", { ...cfg.value, enabled: true });
  store.set("notifications", { ...cfg.value, enabled: false });
  message.value =
    state === "denied"
      ? "Notifications are blocked for this site. Allow them in your browser’s site settings, then turn this on again."
      : state === "unsupported"
        ? "This browser cannot show notifications."
        : "Notifications were not allowed, so reminders are off.";
}

const togglePrayer = (p: (typeof PRAYERS)[number]) => store.set("notifications", { ...cfg.value, prayers: { ...cfg.value.prayers, [p]: !cfg.value.prayers[p] } });

const offsets: MenuOption[] = REMINDER_OFFSETS.map((m) => ({ value: String(m), label: m === 0 ? "At prayer time" : `${m} minutes before` }));

const testMessage = ref("");
async function sendTest() {
  testMessage.value = "";
  const ok = await showNotificationNow({ title: "Test notification", body: "Prayer reminders are working on this device.", tag: "test-notification" });
  testMessage.value = ok ? "Test notification sent." : "Could not show a notification. Check that notifications are allowed for this site.";
}
</script>

<template>
  <div>
    <SettingsGroup>
      <SettingsRow inline label="Prayer notifications" :desc="NOTIFY_LIMIT_SENTENCE">
        <template #default="{ labelId }">
          <Switch :model-value="cfg.enabled" :aria-labelledby="labelId" data-testid="notify-switch" @update:model-value="(v) => onToggle(!!v)" />
        </template>
        <template #extra>
          <span class="mt-1 block text-[12.5px] text-ink-2" data-testid="notify-permission">Browser permission: {{ permissionText }}.</span>
          <span v-if="cfg.enabled && permission === 'denied'" class="mt-1 block text-[12.5px] text-destructive" data-testid="notify-revoked">
            Notifications are now blocked for this site, so no reminders will appear. Allow them in your browser’s site settings.
          </span>
        </template>
      </SettingsRow>
    </SettingsGroup>
    <SettingsStatus v-if="message" tone="warn" data-testid="notify-message">{{ message }}</SettingsStatus>
    <SettingsStatus v-if="homeScreenHint" data-testid="notify-home-screen">On iPhone and iPad, web notifications work only for a web app added to the Home Screen.</SettingsStatus>

    <div class="mt-4">
      <SettingsGroup :dim="!cfg.enabled || permission === 'denied'">
        <SettingsRow label="Notify me for" desc="Choose which prayers send a reminder." stack>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Prayers to be reminded of">
            <Button
              v-for="p in PRAYERS"
              :key="p"
              type="button"
              variant="outline"
              class="min-h-11 gap-1.5 rounded-full px-4 md:min-h-9"
              :class="cfg.prayers[p] ? 'border-primary bg-accent text-foreground' : ''"
              :aria-pressed="cfg.prayers[p]"
              :disabled="!cfg.enabled"
              :data-testid="`notify-${p}`"
              @click="togglePrayer(p)"
            >
              <Icon v-if="cfg.prayers[p]" name="lucide:check" size="14" />{{ p }}
            </Button>
          </div>
        </SettingsRow>
        <SettingsRow label="Reminder time">
          <ResponsiveMenu :model-value="String(cfg.offset)" :options="offsets" label="Reminder time" @update:model-value="(v) => store.set('notifications', { ...cfg, offset: Number(v) })" />
        </SettingsRow>
        <SettingsRow label="Test notification" desc="Check that alerts reach this device.">
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="permission !== 'granted'" data-testid="notify-test" @click="sendTest">
            <Icon name="lucide:bell" size="15" />Send test
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </div>
    <SettingsStatus v-if="testMessage" data-testid="notify-test-message">{{ testMessage }}</SettingsStatus>
  </div>
</template>
