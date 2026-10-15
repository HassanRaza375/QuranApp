<script setup lang="ts">
// Ayah of the day. Scripture is not boxed in a card: the ayah sits on the page with a hairline divider below.
import { translationFor } from "~/lib/ayahOfDay";

const store = usePreferencesStore();
const { status, entry, saved, load, toggleSaved, setSaved } = useAyahOfDay();
const undo = useUndoToast();

const data = computed(() => entry.value?.data ?? null);
const tr = computed(() => (data.value ? translationFor(data.value, store.prefs.translationLang) : null));
const reference = computed(() => (data.value ? `${data.value.surah_name_en || `Surah ${data.value.surah_number}`} ${data.value.surah_number}:${data.value.ayah_number}` : ""));
const href = computed(() => (data.value ? `/surah/${data.value.surah_number}#ayah-${data.value.ayah_number}` : "/"));
const staleDate = computed(() => {
  const d = entry.value?.localDate ?? entry.value?.date;
  if (!d) return "";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
});

const onSave = () => {
  const result = toggleSaved();
  if (result === "added") undo.withUndo("Saved to your Library", () => setSaved(false));
  else if (result === "removed") undo.withUndo("Removed from your Library", () => setSaved(true));
};

const onShare = async () => {
  if (!data.value || !tr.value) return;
  const url = `${window.location.origin}${href.value}`;
  const text = `${data.value.arabic}\n\n${tr.value.text}\n\n${reference.value}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "Ayah of the day", text, url });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) undo.info("Could not open the share sheet");
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    undo.info("Copied to the clipboard");
  } catch {
    undo.info("Could not copy. Select the text and copy it by hand.");
  }
};

onMounted(load);
defineExpose({ load });
</script>

<template>
  <section aria-labelledby="ayah-label" class="mb-8" data-testid="ayah-of-day">
    <p id="ayah-label" class="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-2">Ayah of the day</p>

    <div v-if="status === 'loading'" class="min-h-[170px] space-y-4" aria-busy="true">
      <Skeleton class="ml-auto h-9 w-3/4" />
      <Skeleton class="h-5 w-2/3" />
      <span class="sr-only">Loading today’s ayah</span>
    </div>

    <template v-else-if="data && tr">
      <p v-if="status === 'stale'" class="mb-3 rounded-md bg-sunken px-3 py-2 text-[13px] text-ink-2" data-testid="ayah-stale">
        This is the last saved ayah{{ staleDate ? ` (${staleDate})` : "" }}. Today’s ayah needs a connection.
        <button type="button" class="ml-1 text-brand underline" @click="load">Try again</button>
      </p>
      <p class="ar text-right" lang="ar" dir="rtl" data-testid="ayah-arabic">{{ data.arabic }}</p>
      <p
        class="mt-2 font-serif text-[18px] italic leading-relaxed text-ink-2 md:text-[19px]"
        :class="tr.rtl ? 'ur not-italic' : ''"
        :lang="tr.lang === 'english' ? 'en' : tr.lang === 'urdu' ? 'ur' : tr.lang === 'bengali' ? 'bn' : 'ar'"
        :dir="tr.rtl ? 'rtl' : 'ltr'"
        data-testid="ayah-translation"
      >
        {{ tr.text }}
      </p>
      <div class="mt-3 flex items-center justify-between border-t pt-2.5">
        <NuxtLink :to="href" class="text-[12.5px] text-ink-2 underline-offset-2 hover:underline" data-testid="ayah-ref">{{ reference }}</NuxtLink>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" class="size-11 text-ink-2 md:size-8" aria-label="Share this ayah" @click="onShare">
            <Icon name="lucide:share-2" size="16" />
          </Button>
          <Button variant="ghost" size="icon" class="size-11 text-ink-2 md:size-8" :aria-label="saved ? 'Remove this ayah from your Library' : 'Save this ayah to your Library'" :aria-pressed="saved" @click="onSave">
            <Icon name="lucide:star" size="16" :class="saved ? 'fill-current text-brand' : ''" />
          </Button>
        </div>
      </div>
    </template>

    <div v-else class="rounded-lg border bg-sunken px-4 py-5" data-testid="ayah-unavailable">
      <p class="text-[14px]">Today’s ayah needs a connection once.</p>
      <p class="mt-1 text-[13px] text-ink-2">It is kept for offline use after it loads.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-8" @click="load">Try again</Button>
    </div>
  </section>
</template>
