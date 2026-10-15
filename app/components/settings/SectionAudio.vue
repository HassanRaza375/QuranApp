<script setup lang="ts">
// Audio: reciter, playback speed, auto-play, Wi-Fi-only downloads.
import recitersJson from "@legacy/assets/data/reciters.json";
import type { Segment } from "./SegmentedControl.vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";

const store = usePreferencesStore();
const p = computed(() => store.prefs);

const reciters: MenuOption[] = [{ value: "", label: "Not set (the player's default)" }, ...(recitersJson as { reciter: string }[]).map((r) => ({ value: r.reciter, label: r.reciter }))];
const speeds: Segment[] = [0.75, 1, 1.25, 1.5, 2].map((s) => ({ value: String(s), label: `${s}×` }));

// The legacy Settings stores only the reciter's name; the player finds the audio URL for each surah by that name.
const onReciter = (name: string) => store.set("reciter", name ? { reciter: name } : null);

// Wi-Fi only can be honoured only where the browser reports the connection type (Chrome on Android). Elsewhere the
// setting would do nothing, so the row is greyed with the reason.
const connectionKnown = ref(false);
onMounted(() => {
  const c = (navigator as unknown as { connection?: { type?: string } }).connection;
  connectionKnown.value = typeof c?.type === "string";
});
</script>

<template>
  <SettingsGroup>
    <SettingsRow label="Preferred reciter" desc="Used when you press play anywhere in the app.">
      <ResponsiveMenu :model-value="(p.reciter?.reciter as string | undefined) ?? ''" :options="reciters" label="Preferred reciter" @update:model-value="onReciter" />
    </SettingsRow>
    <SettingsRow label="Playback speed">
      <template #default="{ labelId }">
        <SettingsSegmentedControl :model-value="String(p.playbackRate)" :options="speeds" label="Playback speed" :labelledby="labelId" @update:model-value="(v) => store.set('playbackRate', Number(v))" />
      </template>
    </SettingsRow>
    <SettingsRow inline label="Auto-play the next surah" desc="Keep playing when a surah finishes.">
      <template #default="{ labelId }">
        <Switch :model-value="p.autoplay" :aria-labelledby="labelId" @update:model-value="(v) => store.set('autoplay', !!v)" />
      </template>
    </SettingsRow>
    <div :class="connectionKnown ? '' : 'opacity-60'" data-testid="wifi-row">
      <SettingsRow inline label="Download on Wi-Fi only" desc="Avoid using mobile data for offline audio.">
        <template #default="{ labelId }">
          <Switch :model-value="p.wifiOnly" :disabled="!connectionKnown" :aria-labelledby="labelId" @update:model-value="(v) => store.set('wifiOnly', !!v)" />
        </template>
        <template #extra>
          <span v-if="!connectionKnown" class="mt-1 block text-[12.5px] text-ink-2" data-testid="wifi-note">
            This browser does not tell the app whether you are on Wi-Fi, so downloads cannot be limited to Wi-Fi here. Chrome on Android does.
          </span>
        </template>
      </SettingsRow>
    </div>
  </SettingsGroup>
</template>
