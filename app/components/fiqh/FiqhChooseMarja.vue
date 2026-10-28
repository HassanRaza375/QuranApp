<script setup lang="ts">
// /fiqh/choose-marja: whose rulings to follow, and the reading language. Stored on the legacy record `quran:fiqh-prefs:v1` ({marjaId, lang}); Settings changes the same record.
useSeoMeta({ title: "Choose your marja' · Daily Fiqh · Quran App", description: "Choose whose rulings Daily Fiqh shows." });
const router = useRouter();
</script>

<template>
  <section class="mx-auto max-w-4xl" data-testid="fiqh-choose">
    <div class="text-[13px] text-ink-2"><NuxtLink to="/fiqh" class="underline">Daily Fiqh</NuxtLink></div>
    <h1 class="mt-2 font-serif text-[28px] font-medium md:text-[34px]">Choose your marja'</h1>
    <p class="mt-1 max-w-xl text-[15px] text-ink-2">Choose whose rulings to follow. Rulings are shown for one marja' at a time; nothing from another marja' is ever shown in his place.</p>
    <div class="mt-5"><FiqhMarjaChoices @chosen="router.push('/fiqh')" /></div>
    <h2 class="mt-8 text-[17px] font-medium">Reading language</h2>
    <p class="mb-3 mt-1 max-w-xl text-[13.5px] text-ink-2">Urdu shows only where the marja's own official Urdu book has the ruling. The app does not translate rulings. With “Both”, each language shows its own book and number.</p>
    <FiqhLangSwitch />
    <div class="mt-4"><FiqhNotices review-label /></div>
  </section>
</template>
