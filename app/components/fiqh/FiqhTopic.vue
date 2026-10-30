<script setup lang="ts">
// /fiqh/<category>/<topic> (prototype `pgTopic`, with the legacy sections): the topic, the chosen marja's rulings, the Qur'anic basis (only ayahs whose own text names the act),
// the collapsed panels, where to pay (a link to his own site only), related topics, terms and the sources on the page. What each ruling shows is decided by lib/fiqh/visibility.ts.
import type { Ruling } from "@legacy/data/wajibat/types";
import { PANEL_META } from "@legacy/utils/wajibatLabels";
import { addBookmark, bookmarkAddedAt, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { getCategoryById, getDecisionTreeById, getGlossaryTermById, getProcedureById, getRulingById, getTopicById, loadCategory } from "~/lib/fiqh/data";
import { cacheLoadedChunks } from "~/lib/fiqh/offline";
import { entryOf, MARJA_SHORT, visibleTo } from "~/lib/fiqh/visibility";
import type { KPassage } from "~/lib/knowledge/types";

const route = useRoute();
const { marja, marjaId, lang } = useFiqh();
const undo = useUndoToast();

const topic = computed(() => {
  const t = getTopicById(String(route.params.topic));
  return t && t.categoryId === String(route.params.category) ? t : undefined;
});
const category = computed(() => (topic.value ? getCategoryById(topic.value.categoryId) : undefined));
useSeoMeta({ title: () => (topic.value ? `${topic.value.title.en} · Daily Fiqh · Quran App` : "Daily Fiqh · Quran App"), description: () => topic.value?.summary.text.en });

// ---------------------------------------------------------------- the category's data
const state = ref<"loading" | "ready" | "failed">("loading");
async function load() {
  state.value = "loading";
  try {
    await loadCategory(String(route.params.category));
    state.value = "ready";
    void cacheLoadedChunks();
  } catch {
    state.value = "failed";
  }
}
onMounted(load);

// ---------------------------------------------------------------- the rulings this reader sees
const rulings = computed<Ruling[]>(() => (state.value === "ready" && topic.value ? topic.value.rulingIds.map((id) => getRulingById(id)).filter((r): r is Ruling => !!r && visibleTo(r, marjaId.value)) : []));
const mainRulings = computed(() => rulings.value.filter((r) => !r.sensitive && !r.panel));
const sensitive = computed(() => rulings.value.filter((r) => r.sensitive));
const panels = computed(() =>
  Object.entries(PANEL_META)
    .map(([id, meta]) => ({ id, heading: meta.heading, list: rulings.value.filter((r) => r.panel === id) }))
    .filter((p) => p.list.length),
);
// nothing from this marja' in the topic (for example zakat for Khamenei): one notice instead of a card per ruling. Never another marja's text.
const nothingForMarja = computed(() => {
  const m = marja.value;
  return !!m && rulings.value.length > 0 && rulings.value.every((r) => !entryOf(r, m.id) && !(r.seeAlso ?? []).some((s) => s.marjaId === m.id));
});
const SHOW_FIRST = 10;
const showAll = ref(false);
const shownMain = computed(() => (showAll.value ? mainRulings.value : mainRulings.value.slice(0, SHOW_FIRST)));
// a deep link (#rulingId, from search) opens the whole list and scrolls to the ruling
watch([state, marjaId], async () => {
  if (state.value !== "ready" || !marjaId.value || !route.hash) return;
  if (mainRulings.value.findIndex((r) => `#${r.id}` === route.hash) >= SHOW_FIRST) showAll.value = true;
  await nextTick();
  document.querySelector(route.hash)?.scrollIntoView({ block: "start" });
});

// ---------------------------------------------------------------- Qur'anic basis
const basis = computed<KPassage[]>(() =>
  (topic.value?.quranicBasis ?? []).map((q, i) => ({ id: `qb-${i}`, surah: q.surahNumber, from: q.ayahNumber ?? q.ayahStart ?? 1, to: q.ayahNumber ?? q.ayahEnd ?? q.ayahStart ?? 1 })),
);
const notesFor = (p: KPassage) => (topic.value?.quranicBasisNotes ?? []).filter((n) => n.surahNumber === p.surah && n.ayahNumber >= p.from && n.ayahNumber <= p.to);

// ---------------------------------------------------------------- the rest
// the chosen marja's guided procedures (never another marja's)
const procedures = computed(() => (state.value === "ready" && marja.value ? (topic.value?.procedureIds ?? []).map((id) => getProcedureById(id)).filter((x) => !!x && x.marjaId === marja.value!.id) : []));
// the chosen marja's helpers (never another marja's). No scholar has signed off their paths (owner decision, 2026-10-28: not required); every one says "Not scholar-reviewed".
const helpers = computed(() => (state.value === "ready" && marja.value ? (topic.value?.decisionTreeIds ?? []).map((id) => getDecisionTreeById(id)).filter((t) => !!t && t.marjaId === marja.value!.id) : []));
// a helper's "Open the full ruling" opens the whole list first (the ruling may be past the first ten)
provide("fiqh-open-ruling", async (id: string) => {
  showAll.value = true;
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ block: "start" });
});
const related = computed(() => (topic.value?.relatedTopicIds ?? []).map((id) => getTopicById(id)).filter((t) => !!t));
const terms = computed(() => (topic.value?.glossaryIds ?? []).map((id) => getGlossaryTermById(id)).filter((g) => !!g));
const sources = computed(() => {
  const m = marja.value;
  if (!m) return [];
  const rows = new Map<string, { title: string; url: string; urdu: boolean; refs: string[] }>();
  const add = (s: { title: string; url: string; reference: string } | undefined, urdu: boolean) => {
    if (!s) return;
    const row = rows.get(s.title) ?? { title: s.title, url: s.url, urdu, refs: [] };
    if (!row.refs.includes(s.reference)) row.refs.push(s.reference);
    rows.set(s.title, row);
  };
  for (const r of rulings.value) {
    const e = entryOf(r, m.id);
    if (!e) continue;
    add(e.source, false);
    if (lang.value !== "en") add(e.urSource, true);
  }
  return [...rows.values()];
});

// ---------------------------------------------------------------- Save (the legacy bookmark key `fiqh:<topic id>`), with Undo
const key = computed(() => `fiqh:${topic.value?.id}`);
const saved = ref(false);
onMounted(() => (saved.value = hasBookmark(key.value)));
function toggleSave() {
  const name = topic.value!.title.en;
  if (saved.value) {
    const when = bookmarkAddedAt(key.value);
    removeBookmark(key.value);
    saved.value = false;
    undo.withUndo(`Removed ${name} from saved`, () => {
      addBookmark(key.value, when);
      saved.value = true;
    });
  } else {
    addBookmark(key.value);
    saved.value = true;
    undo.withUndo(`Saved ${name}`, () => {
      removeBookmark(key.value);
      saved.value = false;
    });
  }
}
</script>

<template>
  <section v-if="topic && category" class="mx-auto max-w-3xl" data-testid="fiqh-topic" :data-topic="topic.id">
    <div class="flex items-center gap-2 text-[13px] text-ink-2">
      <NuxtLink to="/fiqh" class="underline">Daily Fiqh</NuxtLink><span aria-hidden="true">·</span><NuxtLink :to="`/fiqh/${category.id}`" class="underline" data-testid="fiqh-back">{{ category.title.en }}</NuxtLink>
      <span class="flex-1" />
      <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="fiqh-save" @click="toggleSave"><Icon name="lucide:star" size="16" />{{ saved ? "Saved" : "Save" }}</Button>
    </div>
    <div class="mt-2 flex flex-col-reverse gap-x-6 gap-y-1 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0 flex-1">
        <h1 class="font-serif text-[28px] font-medium md:text-[34px]" data-testid="fiqh-topic-title">{{ topic.title.en }}</h1>
        <p v-if="topic.title.ur" class="text-[18px] text-ink-2" lang="ur" dir="rtl" style="text-align: left">{{ topic.title.ur }}</p>
      </div>
      <p v-if="topic.arabicTerm" class="ar !text-[34px] !leading-[1.8] max-md:!text-left" lang="ar" dir="rtl">{{ topic.arabicTerm }}</p>
    </div>

    <div class="mt-3"><FiqhNotices review-label /></div>
    <div v-if="marja" class="mt-4 flex flex-col gap-3 md:flex-row md:items-center"><div class="min-w-0 md:flex-1"><FiqhMarjaBar /></div><FiqhLangSwitch class="self-start" /></div>

    <FiqhLivePanel v-if="topic.liveTool" :tool="topic.liveTool" />

    <!-- app-written overview: labelled as such, never a ruling -->
    <section class="mt-8" aria-labelledby="fiqh-overview" data-testid="fiqh-overview">
      <h2 id="fiqh-overview" class="text-[17px] font-medium">Overview</h2>
      <p class="mt-2 max-w-2xl text-[15px]">{{ topic.summary.text.en }}</p>
      <p v-if="topic.summary.text.ur" class="ur mt-1 max-w-2xl" lang="ur" dir="rtl">{{ topic.summary.text.ur }}</p>
      <p class="mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[12px] text-ink-2">Written by the app, not a ruling</p>
      <div v-for="(e, i) in topic.explanations ?? []" :key="i" class="mt-4">
        <h3 class="text-[14.5px] font-medium">{{ e.heading.en }}</h3>
        <p class="mt-1 max-w-2xl whitespace-pre-line text-[15px]">{{ e.body.text.en }}</p>
      </div>
    </section>

    <section v-if="basis.length" class="mt-8" aria-labelledby="fiqh-quran" data-testid="fiqh-quran">
      <h2 id="fiqh-quran" class="text-[17px] font-medium">Qur'anic basis</h2>
      <p class="mt-1 max-w-2xl text-[13.5px] text-ink-2">Ayahs whose own words name this act. They are shown for study alongside the rulings; how the act is performed is set out in your marja's rulings below.</p>
      <ul class="mt-1">
        <template v-for="p in basis" :key="p.id">
          <KnowledgePassage :passage="p" />
          <li v-for="(n, i) in notesFor(p)" :key="`${p.id}-${i}`" class="mb-3 rounded-[10px] border border-dashed px-3.5 py-3 text-[13.5px]" role="note" data-testid="fiqh-basis-note">
            <p><b class="font-medium">Explanation · written by the app, not a ruling:</b> {{ n.note.text.en }}</p>
            <p class="mt-1.5 text-[15px]" :lang="n.quote.lang" dir="rtl">«{{ n.quote.text }}»</p>
            <p class="mt-1 text-[12.5px] text-ink-2">{{ n.source.title }}, {{ n.source.reference }} · <a v-for="(u, j) in n.source.urls" :key="u" :href="u" target="_blank" rel="noopener noreferrer" class="mr-2 underline">copy {{ j + 1 }}</a></p>
          </li>
        </template>
      </ul>
    </section>

    <section v-if="marja && helpers.length" class="mt-8" aria-labelledby="fiqh-helper" data-testid="fiqh-helpers">
      <h2 id="fiqh-helper" class="text-[17px] font-medium">Find your answer</h2>
      <FiqhHelper v-for="h in helpers" :key="h!.id" :tree="h!" :marja="marja" />
    </section>

    <section class="mt-8" aria-labelledby="fiqh-rulings" data-testid="fiqh-rulings">
      <h2 id="fiqh-rulings" class="flex items-baseline gap-3 text-[17px] font-medium">Rulings<span v-if="state === 'ready' && marja && mainRulings.length" class="text-[13px] font-normal tabular-nums text-ink-2" data-testid="fiqh-ruling-count">{{ mainRulings.length }}</span></h2>

      <div v-if="!marja" class="mt-3 rounded-[10px] border px-4 py-5" data-testid="fiqh-gate">
        <p class="mb-3 text-[14.5px]">Choose your marja' to see the rulings on this topic. You'll only see his rulings.</p>
        <FiqhMarjaChoices />
      </div>
      <p v-else-if="state === 'loading'" class="mt-3 text-[13.5px] text-ink-2" role="status">Loading the rulings…</p>
      <p v-else-if="state === 'failed'" class="mt-3 rounded-[10px] border border-dashed px-4 py-3 text-[13.5px]" role="status" data-testid="fiqh-topic-unavailable">
        This topic’s rulings aren’t on your device yet. Connect to load them.
        <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-8" @click="load">Try again</button>
      </p>
      <template v-else>
        <p v-if="!topic.rulingIds.length" class="mt-3 text-[14px] text-ink-2" data-testid="fiqh-overview-only">This topic is an overview and has no rulings of its own. The rulings are in the related topics below.</p>
        <p v-else-if="nothingForMarja" class="mt-3 rounded-[10px] border border-dashed px-4 py-3 text-[14px]" data-testid="fiqh-nothing-for-marja">
          Not added yet for {{ MARJA_SHORT[marja.id] }}. Refer to his risala.
          <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="ml-1 underline">Official website</a>
        </p>
        <template v-else>
          <FiqhRulingCard v-for="r in shownMain" :key="r.id" :ruling="r" :marja="marja" :lang="lang" />
          <button v-if="!showAll && mainRulings.length > SHOW_FIRST" type="button" class="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] md:min-h-9" data-testid="fiqh-show-all" @click="showAll = true"><Icon name="lucide:chevron-down" size="14" />Show all {{ mainRulings.length }} rulings</button>
          <Collapsible v-for="p in panels" :key="p.id" class="mt-5 rounded-[10px] border" data-testid="fiqh-panel">
            <CollapsibleTrigger class="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[14.5px] font-medium">{{ p.heading }}<span class="flex-1" /><span class="text-[13px] font-normal tabular-nums text-ink-2">{{ p.list.length }}</span><Icon name="lucide:chevron-down" size="16" /></CollapsibleTrigger>
            <CollapsibleContent class="px-4"><FiqhRulingCard v-for="r in p.list" :key="r.id" :ruling="r" :marja="marja" :lang="lang" /></CollapsibleContent>
          </Collapsible>
          <Collapsible v-if="sensitive.length" class="mt-5 rounded-[10px] border" data-testid="fiqh-sensitive">
            <CollapsibleTrigger class="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[14.5px] font-medium">Rulings specific to women<span class="flex-1" /><span class="text-[13px] font-normal tabular-nums text-ink-2">{{ sensitive.length }}</span><Icon name="lucide:chevron-down" size="16" /></CollapsibleTrigger>
            <CollapsibleContent class="px-4"><FiqhRulingCard v-for="r in sensitive" :key="r.id" :ruling="r" :marja="marja" :lang="lang" /></CollapsibleContent>
          </Collapsible>
        </template>
      </template>
    </section>

    <!-- where to pay: the marja's own official site and nothing else (legacy decision G3) -->
    <section v-if="marja && topic.payLink" class="mt-8" aria-labelledby="fiqh-pay" data-testid="fiqh-pay">
      <h2 id="fiqh-pay" class="text-[17px] font-medium">Where and how to pay</h2>
      <div class="mt-2 rounded-[10px] border px-4 py-3.5 text-[14.5px]">
        <p>This app does not collect or hold payments and does not list offices, representatives or bank accounts. For where and how to pay, please see {{ marja.name.en }}'s own official website.</p>
        <a :href="marja.officialSite" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex min-h-11 items-center underline md:min-h-8">{{ marja.officialSite.replace(/^https?:\/\//, "") }}</a>
      </div>
    </section>

    <section v-if="marja && state === 'ready' && topic.procedureIds?.length" class="mt-8" aria-labelledby="fiqh-steps" data-testid="fiqh-steps">
      <h2 id="fiqh-steps" class="text-[17px] font-medium">Step by step</h2>
      <template v-if="procedures.length"><FiqhProcedure v-for="x in procedures" :key="x!.id" :procedure="x!" :marja="marja" /></template>
      <p v-else class="mt-2 rounded-[10px] border border-dashed px-4 py-3 text-[14px]" data-testid="fiqh-steps-none">Not added yet for {{ MARJA_SHORT[marja.id] }}. Refer to his risala. The rulings above still apply.</p>
    </section>

    <section v-if="related.length" class="mt-8" data-testid="fiqh-related">
      <h2 class="text-[17px] font-medium">Related topics</h2>
      <ul class="mt-2 flex flex-wrap gap-1.5"><li v-for="t in related" :key="t!.id"><NuxtLink :to="`/fiqh/${t!.categoryId}/${t!.id}`" class="inline-flex min-h-11 items-center rounded-full border px-3.5 text-[13.5px] hover:bg-accent md:min-h-9">{{ t!.title.en }}</NuxtLink></li></ul>
    </section>

    <section v-if="terms.length" class="mt-8" data-testid="fiqh-terms">
      <h2 class="text-[17px] font-medium">Terms used</h2>
      <dl class="mt-2 divide-y">
        <div v-for="g in terms" :key="g!.id" class="grid gap-x-4 py-2.5 sm:grid-cols-[10rem_1fr]">
          <dt class="text-[14.5px] font-medium"><NuxtLink :to="{ path: '/fiqh/glossary', hash: `#${g!.id}` }" class="underline">{{ g!.term }}</NuxtLink></dt>
          <dd class="text-[14.5px] text-ink-2">{{ g!.definition.en }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="marja && sources.length" class="mt-8" data-testid="fiqh-sources">
      <h2 class="text-[17px] font-medium">Sources on this page</h2>
      <ul class="mt-2 space-y-1.5 text-[14px]">
        <li v-for="s in sources" :key="s.url + s.title"><a :href="s.url" target="_blank" rel="noopener noreferrer" class="underline" :lang="s.urdu ? 'ur' : undefined">{{ s.title }}</a> — {{ s.refs.join(", ") }}</li>
      </ul>
      <p class="mt-2 text-[12.5px] text-ink-2">Texts last checked against the official websites on {{ topic.lastSourceCheck }}.</p>
    </section>

    <FiqhDisclaimer :marja="marja" />
  </section>

  <section v-else class="mx-auto max-w-2xl" data-testid="fiqh-topic-missing">
    <h1 class="font-serif text-[26px] font-medium">No such topic</h1>
    <p class="mt-2 text-[14.5px] text-ink-2">There is no topic called “{{ route.params.topic }}” in this section.</p>
    <p class="mt-3"><NuxtLink to="/fiqh" class="text-brand underline">Back to Daily Fiqh</NuxtLink></p>
  </section>
</template>
