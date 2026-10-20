<script setup lang="ts">
// "Your reminders": the legacy list (`quran:reminders:v1`), shown here so the bell does something you can see. A reminder is an item in this
// list; no alert is sent. Upcoming first, then past ones that are not done. Done hides it (as in the legacy list); delete has Undo.
import { expectedText } from "~/lib/islamicEvents";

const events = useEvents();
const undo = useUndoToast();
const upcoming = computed(() => events.lists.value.upcoming);
const overdue = computed(() => events.lists.value.overdue);
const any = computed(() => upcoming.value.length + overdue.value.length > 0);

function remove(id: string, title: string) {
  const back = events.deleteReminder(id);
  if (back) undo.withUndo(`Removed the reminder for ${title}`, back);
}
</script>

<template>
  <section aria-labelledby="rem-h" class="mt-8" data-testid="reminders">
    <h2 id="rem-h" class="text-[15px] font-medium">Your reminders</h2>
    <p class="mt-0.5 text-[12.5px] text-ink-2" data-testid="reminders-note">Saved to your list. No alert is sent. The date is the one shown when you saved it.</p>
    <p v-if="!any" class="mt-2 text-[14px] text-ink-2" data-testid="reminders-empty">No reminders yet. Use the bell on an event to save one.</p>
    <ul v-else class="mt-2">
      <li v-for="r in [...upcoming, ...overdue]" :key="r.id" class="flex items-center gap-2 border-b py-2" :data-testid="r.date < events.todayKey.value ? 'reminder-overdue' : 'reminder-upcoming'" data-reminder>
        <label class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <input type="checkbox" class="size-5 accent-[var(--brand)]" :aria-label="`Mark the reminder for ${r.title} as done`" data-testid="reminder-done" @change="events.markDone(r.id, true)" />
        </label>
        <div class="min-w-0 flex-1">
          <p class="text-[14.5px]" data-testid="reminder-title">{{ r.title }}</p>
          <p class="text-[12.5px] text-ink-2" data-testid="reminder-date">{{ expectedText(r.date) }}<template v-if="r.date < events.todayKey.value"> · past</template></p>
        </div>
        <Button variant="ghost" class="size-11 shrink-0 md:size-9" :aria-label="`Delete the reminder for ${r.title}`" data-testid="reminder-delete" @click="remove(r.id, r.title)"><Icon name="lucide:trash-2" size="16" /></Button>
      </li>
    </ul>
  </section>
</template>
