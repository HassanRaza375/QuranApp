<script setup lang="ts">
// Live data from another part of the app on a Daily Fiqh topic: today's prayer times, today's dawn and maghrib for the fast, or a link to the Qibla tool. The times are the Prayer Times feature's own,
// shown as they are: nothing is recomputed here, and this panel makes no request (it shows what the Prayer Times feature has already loaded in this visit, or says to open it).
import { formatClock12 } from "~/lib/prayerClock";

defineProps<{ tool: "prayertimes" | "qibla" | "sawm" }>();
const KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"] as const;
const LABELS: Record<(typeof KEYS)[number], string> = { Fajr: "Ṣubḥ (Fajr)", Sunrise: "Sunrise", Dhuhr: "Ẓuhr", Asr: "ʿAṣr", Maghrib: "Maghrib", Isha: "ʿIshāʾ", Midnight: "Midnight" };
const SAWM_KEYS = ["Fajr", "Maghrib"] as const;
const SAWM_LABELS = { Fajr: "Dawn (Ṣubḥ / Fajr)", Maghrib: "Maghrib" };

const prayer = usePrayerTimes();
const prefs = usePreferencesStore();
const timings = computed(() => prayer.today.value?.timings ?? null);
const isJafari = computed(() => prefs.prefs.fiqh === "jafari");
const clock = (k: string) => (timings.value && (timings.value as Record<string, string | undefined>)[k] ? formatClock12((timings.value as Record<string, string>)[k]!) : "—");
</script>

<template>
  <section class="mt-6 rounded-[10px] border px-4 py-4" data-testid="fiqh-live" :data-tool="tool">
    <template v-if="tool === 'prayertimes' || tool === 'sawm'">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="flex flex-1 items-center gap-2 text-[15px] font-medium"><Icon :name="tool === 'sawm' ? 'lucide:moon' : 'lucide:clock'" size="17" />{{ tool === "sawm" ? "Today's dawn and maghrib" : "Today's prayer times" }}</h2>
        <NuxtLink to="/prayerTime" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13px] hover:bg-accent md:min-h-9">Prayer Times</NuxtLink>
        <NuxtLink v-if="tool === 'sawm'" to="/ramadan" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13px] hover:bg-accent md:min-h-9">Ramadan fasting log</NuxtLink>
      </div>
      <ul v-if="timings" class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2" :aria-label="tool === 'sawm' ? 'Today\'s dawn and maghrib times' : 'Today\'s prayer times'" data-testid="live-times">
        <li v-for="k in tool === 'sawm' ? SAWM_KEYS : KEYS" :key="k" class="flex flex-col justify-between"><span class="text-[12px] text-ink-2">{{ tool === "sawm" ? SAWM_LABELS[k as keyof typeof SAWM_LABELS] : LABELS[k] }}</span><span class="text-[15px] font-medium tabular-nums">{{ clock(k) }}</span></li>
      </ul>
      <p v-else class="mt-2 text-[13.5px] text-ink-2" data-testid="live-none">Open Prayer Times to load today's times for your location.</p>
      <p v-if="timings && !isJafari" class="mt-2 text-[12.5px] text-ink-2" data-testid="live-sunni">These times use your current calculation method (Sunni). For Ja'fari times, switch the method in Settings.</p>
      <p v-if="tool === 'prayertimes'" class="mt-1.5 text-[12.5px] text-ink-2">From the app's Prayer Times feature (AlAdhan). The rulings below set out when each prayer may be performed.</p>
      <p v-else class="mt-1.5 text-[12.5px] text-ink-2">From the app's Prayer Times feature (AlAdhan), shown as they are. The rulings below say when the fast begins and ends; this panel does not decide it. Your fasts are logged in the Ramadan page, not here.</p>
    </template>
    <div v-else class="flex flex-wrap items-center gap-2">
      <h2 class="flex flex-1 items-center gap-2 text-[15px] font-medium"><Icon name="lucide:compass" size="17" />Find the qibla from your location</h2>
      <NuxtLink to="/qibla-direction" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13px] hover:bg-accent md:min-h-9">Qibla tool</NuxtLink>
    </div>
  </section>
</template>
