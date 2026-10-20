<script setup lang="ts">
// One person (prototype d-page-person / m-page-person): the header, three tabs (Story, Passages, Family & notes; ?tab=), Save, and the
// resume banner. Everything shown comes from the legacy person record. The tab you are on is written into the legacy study record
// (`quran:persons-study:v1`) using its own six section ids, so Home and the Library read it unchanged.
import { SECTION_LABELS } from "@legacy/utils/personStudy";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, bookmarkAddedAt, BOOKMARKS_KEY, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { categoryLabel, chronologyInfo, displayName, PERSON_TABS, personById, personKey, sectionForTab, statusLabel, tabForSection, tabFromQuery, type PersonTab } from "~/lib/people";
import { readStudy, recordSection } from "~/lib/peopleStudy";

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const undo = useUndoToast();

const person = computed(() => personById(props.id));
useSeoMeta({ title: () => (person.value ? `${person.value.name} · Prophets & People · Quran App` : "Person not found · Quran App"), description: () => person.value?.shortDescription });

const tab = computed<PersonTab>(() => tabFromQuery(route.query.tab));
const saved = ref(false);
const resume = ref<{ tab: PersonTab; label: string; href: string | null } | null>(null);
const relatedTouched = ref(false);

function refresh() {
  if (!person.value) return;
  saved.value = hasBookmark(personKey(person.value.id));
}
function loadResume() {
  resume.value = null;
  const p = person.value;
  if (!p || !saved.value) return;
  const s = readStudy(p.id);
  if (!s || (s.lastSection === "overview" && !s.lastSurahNo)) return; // nothing meaningful to resume yet
  const section = (SECTION_LABELS as Record<string, string>)[s.lastSection] ?? s.lastSection;
  const name = s.lastSurahNo ? SURAH_ROWS[s.lastSurahNo - 1]?.name : undefined;
  resume.value = { tab: tabForSection(s.lastSection), label: s.lastSurahNo && name ? `${section}, ${name} ${s.lastSurahNo}:${s.lastAyahNo}` : section, href: s.lastSurahNo && s.lastAyahNo ? `/surah/${s.lastSurahNo}#ayah-${s.lastAyahNo}` : null };
}

const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === BOOKMARKS_KEY) refresh();
};
onMounted(() => {
  refresh();
  loadResume(); // before this visit overwrites the study record
  if (person.value) recordSection(person.value.id, sectionForTab(tab.value));
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => window.removeEventListener("storage", onStorage));

watch(
  () => props.id,
  () => {
    refresh();
    loadResume();
    relatedTouched.value = false;
    if (person.value) recordSection(person.value.id, sectionForTab(tab.value));
  },
);

function setTab(t: PersonTab) {
  if (!person.value || t === tab.value) return;
  void router.replace({ query: t === "story" ? {} : { tab: t } });
  recordSection(person.value.id, sectionForTab(t, relatedTouched.value ? "surah" : null));
}
function onRelatedView() {
  relatedTouched.value = true;
  if (person.value) recordSection(person.value.id, "related-passages");
}

function toggleSaved() {
  const p = person.value;
  if (!p) return;
  const key = personKey(p.id);
  if (saved.value) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refresh();
    resume.value = null;
    undo.withUndo(`Removed ${displayName(p)} from saved`, () => {
      addBookmark(key, when);
      refresh();
    });
  } else {
    addBookmark(key);
    refresh();
  }
}

const chron = computed(() => (person.value ? chronologyInfo(person.value) : null));
</script>

<template>
  <section v-if="person" data-testid="person-page">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <NuxtLink to="/persons" class="inline-flex min-h-11 items-center gap-1 text-[14px] text-brand md:min-h-9" data-testid="person-back"><Icon name="lucide:chevron-left" size="16" />Prophets &amp; People</NuxtLink>
      <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="person-save" @click="toggleSaved">
        <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" /></svg>
        {{ saved ? "Saved" : "Save" }}
      </Button>
    </div>

    <div v-if="resume" class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-accent/40 px-3 py-2 text-[13.5px]" data-testid="resume-banner">
      <span>Resume where you left off: {{ resume.label }}</span>
      <span class="flex gap-1">
        <Button size="sm" class="min-h-11 md:min-h-8" data-testid="resume-go" @click="setTab(resume.tab); resume = null">Resume</Button>
        <Button size="sm" variant="ghost" class="min-h-11 md:min-h-8" aria-label="Dismiss" data-testid="resume-dismiss" @click="resume = null"><Icon name="lucide:x" size="15" /></Button>
      </span>
    </div>

    <header class="mt-4">
      <p class="text-[34px] leading-[1.8]" style="font-family: var(--font-arabic); text-align: left" lang="ar" dir="rtl" data-testid="person-arabic">{{ person.arabicName }}</p>
      <h1 class="mt-1 font-serif text-[28px] font-medium" data-testid="person-name">
        {{ person.name }}
        <span v-if="person.honorific?.arabic" class="ml-2 align-middle text-[22px] text-ink-2" style="font-family: var(--font-arabic)" lang="ar" dir="rtl" data-testid="person-honorific">{{ person.honorific.arabic }}</span>
      </h1>
      <p v-if="person.alternateNames?.length" class="mt-0.5 text-[13.5px] text-ink-2" data-testid="person-alternates">Also known as: {{ person.alternateNames.join(", ") }}</p>
      <ul class="mt-2 flex flex-wrap gap-1.5" aria-label="About this entry">
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-category">{{ categoryLabel(person.primaryCategory) }}</li>
        <li v-if="person.entityType === 'group'" class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-group">Group, not individually named</li>
        <li v-if="statusLabel(person)" class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-status">{{ statusLabel(person) }}</li>
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-mentions">{{ person.directMentions.length }} direct mentions</li>
        <li class="rounded-full border px-2.5 py-0.5 text-[12.5px]" data-testid="chip-passages">{{ person.relatedPassages.length }} related passages</li>
        <li v-if="chron" class="rounded-full border px-2.5 py-0.5 text-[12.5px]" :class="chron.dashed ? 'border-dashed' : ''" data-testid="chip-chronology">{{ chron.text }}</li>
      </ul>
    </header>

    <nav aria-label="Person sections" class="mt-5 flex border-b" data-testid="person-tabs">
      <button
        v-for="t in PERSON_TABS"
        :key="t.id"
        type="button"
        class="-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-[14px] md:min-h-10"
        :class="t.id === tab ? 'border-brand font-medium text-foreground' : 'border-transparent text-ink-2 hover:text-foreground'"
        :aria-current="t.id === tab ? 'page' : undefined"
        :data-testid="`tab-${t.id}`"
        @click="setTab(t.id)"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="mt-4">
      <PeopleStoryTab v-if="tab === 'story'" :person="person" />
      <PeoplePassagesTab v-else-if="tab === 'passages'" :person="person" @related-view="onRelatedView" />
      <PeopleFamilyTab v-else :person="person" />
    </div>
  </section>

  <section v-else data-testid="person-missing">
    <h1 class="font-serif text-[24px] font-medium">Person not found</h1>
    <p class="mt-2 text-ink-2">There is no entry for “{{ id }}”.</p>
    <p class="mt-4"><NuxtLink class="text-brand underline" to="/persons">Back to Prophets &amp; People</NuxtLink></p>
  </section>
</template>
