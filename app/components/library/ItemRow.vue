<script setup lang="ts">
// One saved (or note-only) item. In select mode the row is a real checkbox with the item's name. The Arabic text, when there is
// any, comes from the device or one small request, and only once the row is on screen.
import { useIntersectionObserver } from "@vueuse/core";
import type { Item } from "~/lib/libraryItems";
import { TYPE_LABEL } from "~/lib/libraryItems";
import type { Collection, ItemMeta } from "~/lib/library";

const props = defineProps<{
  item: Item;
  meta: ItemMeta;
  collections: Collection[];
  saved: boolean;
  ago: string;
  selecting: boolean;
  selected: boolean;
}>();
const emit = defineEmits<{ edit: []; select: [on: boolean] }>();

const snippets = useAyahSnippets();
const root = ref<HTMLElement | null>(null);
const seen = ref(false);
if (props.item.ayah) {
  const { stop } = useIntersectionObserver(root, ([e]) => {
    if (e?.isIntersecting && !seen.value) {
      seen.value = true;
      snippets.request(props.item.ayah!.surah, props.item.ayah!.ayah);
      stop();
    }
  });
}
const snippet = computed(() => (props.item.ayah ? snippets.get(props.item.ayah.surah, props.item.ayah.ayah) : undefined));
const retry = () => props.item.ayah && snippets.request(props.item.ayah.surah, props.item.ayah.ayah, true);
const memberOf = computed(() => props.collections.filter((c) => props.meta.collectionIds.includes(c.id)));
const detail = computed(() => [TYPE_LABEL[props.item.type], props.item.detail, props.saved ? props.ago : "Note only, not in Saved"].filter(Boolean).join(" · "));
</script>

<template>
  <li ref="root" class="library-row border-b py-3" :data-key="item.key" data-testid="library-row">
    <div class="flex items-start gap-2">
      <label v-if="selecting" class="-ml-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9">
        <input type="checkbox" class="size-5 accent-[var(--brand)]" :checked="selected" :aria-label="`Select ${item.title}`" data-testid="row-check" @change="emit('select', ($event.target as HTMLInputElement).checked)" />
      </label>
      <div class="min-w-0 flex-1">
        <p v-if="item.ayah && snippet && snippet !== 'loading' && snippet.state === 'text'" class="ar line-clamp-2 text-right" lang="ar" dir="rtl" data-testid="row-snippet">{{ snippet.text }}</p>
        <div v-else-if="item.ayah && snippet === 'loading'" class="h-6 w-2/3 animate-pulse rounded bg-muted" data-testid="row-snippet-loading" aria-hidden="true" />
        <p v-else-if="item.ayah && snippet" class="text-[12.5px] text-ink-2" data-testid="row-snippet-missing">
          Text appears once you are online or have opened this surah.
          <button v-if="snippet.state === 'failed'" type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-0" data-testid="row-retry" @click="retry">Try again</button>
        </p>
        <p class="mt-1 text-[15px] font-medium">
          <NuxtLink v-if="item.href && !selecting" :to="item.href" class="hover:underline" data-testid="row-open">{{ item.title }}</NuxtLink>
          <span v-else>{{ item.title }}</span>
          <span v-if="item.arabicName" class="ar ml-2 align-middle text-[18px]" lang="ar" dir="rtl">{{ item.arabicName }}</span>
        </p>
        <p class="mt-0.5 text-[12.5px] text-ink-2" data-testid="row-detail">{{ detail }}</p>
        <p v-if="meta.note.trim()" class="mt-1 line-clamp-2 whitespace-pre-line text-[13.5px]" data-testid="row-note">{{ meta.note }}</p>
        <ul v-if="memberOf.length || meta.tags.length" class="mt-1.5 flex flex-wrap gap-1.5" aria-label="Collections and tags">
          <li v-for="c in memberOf" :key="c.id" class="rounded-full border px-2.5 py-0.5 text-[12px]" data-testid="row-collection">{{ c.name }}</li>
          <li v-for="t in meta.tags" :key="t" class="rounded-full bg-muted px-2.5 py-0.5 text-[12px]" data-testid="row-tag">#{{ t }}</li>
        </ul>
      </div>
      <Button v-if="!selecting" variant="ghost" class="size-11 shrink-0 md:size-9" :aria-label="`Edit ${item.title}`" data-testid="row-more" @click="emit('edit')">
        <Icon name="lucide:ellipsis" size="18" />
      </Button>
    </div>
  </li>
</template>

<style scoped>
.library-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 96px;
}
</style>
