<script setup lang="ts">
// The Account area (screens 01 to 06): signed out → sign in or create an account; signed in → who you are, what syncs, sign out, remove synced data, delete
// account. Everything here is optional: the app works the same without an account. Removing something offers Undo; only deleting the account asks for a typed word.
import { toast } from "vue-sonner";
import { CATEGORIES } from "~/lib/sync/categories";
import {
  account,
  avatarSrc,
  chooseCategories,
  deleteAccount,
  loadUsage,
  reconnect,
  removeAvatar,
  removeSyncedData,
  setCategory,
  signOut,
  startAccount,
  syncNow,
} from "~/lib/sync/runtime";
import type { Category } from "~/lib/sync/namespaces";

const route = useRoute();
const mode = ref<"signin" | "signup">(route.query.mode === "signup" ? "signup" : "signin");
const showForm = ref(route.query.mode === "signup" || route.query.mode === "signin");
const photo = ref(false);

onMounted(async () => {
  await startAccount();
  if (account.phase === "signedIn") void loadUsage();
});
watch(() => account.phase, (p) => p === "signedIn" && void loadUsage());

const LABELS: Record<Category, { title: string; text: string }> = {
  library: { title: "Library", text: "Saved ayahs, surahs and study items, your notes, tags and collections." },
  progress: { title: "Progress", text: "Where you stopped, surahs marked as read, reading goals, Hifz, Tasbeeh, story progress, Ramadan fasting log and reminders. Your fasting log is personal religious data." },
  settings: { title: "Settings", text: "Your preferences, including your Sunni or Ja’fari choice and marja’, theme, text and audio options. Never your saved place or notification permission." },
};

// a first choice: all off until the person turns them on (screen 04)
const draft = reactive<Record<Category, boolean>>({ library: true, progress: true, settings: true });
const chosen = computed(() => account.choice !== null);
const avatar = computed(() => avatarSrc(account.user, account.config?.avatar?.cloudName));
const syncText = computed(() => {
  if (account.sync.phase === "syncing") return "Syncing…";
  if (account.sync.phase === "unavailable") return "Can’t reach the server right now. Your changes are kept on this device and will sync later.";
  if (!account.choice || !Object.values(account.choice).some(Boolean)) return "Nothing is syncing yet.";
  return account.sync.lastSyncedAt ? `Last synced ${new Date(account.sync.lastSyncedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.` : "Waiting for the first sync.";
});
const usageText = computed(() => {
  const u = account.sync.usage;
  return u ? `${u.records} synced ${u.records === 1 ? "record" : "records"}, ${(u.bytes / 1024).toFixed(u.bytes < 10240 ? 1 : 0)} KB of ${Math.round(u.limitBytes / 1048576)} MB.` : "";
});

async function onToggle(c: Category, on: boolean) {
  await setCategory(c, on);
}
async function startSync() {
  await chooseCategories({ library: draft.library, progress: draft.progress, settings: draft.settings });
}

async function onRemoveSynced() {
  const before = account.choice;
  if (!(await removeSyncedData())) return;
  toast("Removed your synced data from the server. This device keeps its own.", {
    duration: 8000,
    action: {
      label: "Undo",
      onClick: async () => {
        if (before) await chooseCategories(before);
        void syncNow();
      },
    },
  });
}

// ---- delete account: a typed word, because it cannot be undone
const deleting = ref(false);
const typed = ref("");
const delPassword = ref("");
async function onDelete() {
  if (typed.value.trim().toLowerCase() !== "delete") return;
  if (await deleteAccount(delPassword.value || undefined)) {
    deleting.value = false;
    typed.value = "";
    delPassword.value = "";
    toast("Your account and its synced data were deleted. This device keeps what it has.");
  }
}
async function onSignOut() {
  await signOut();
  toast("Signed out. This device keeps its data.");
}
</script>

<template>
  <div data-testid="account-panel" class="space-y-6">
    <p v-if="account.phase === 'loading'" class="text-[14px] text-ink-2" role="status" data-testid="account-loading">Checking your account…</p>

    <div v-else-if="account.phase === 'unavailable'" class="rounded-[10px] border border-dashed px-4 py-5" data-testid="account-unavailable">
      <p class="text-[14.5px]" role="status">Can’t reach the server right now. The app works as usual, and you can sign in later.</p>
      <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" @click="reconnect">Try again</Button>
    </div>

    <p v-else-if="account.phase === 'off'" class="text-[14px] text-ink-2" data-testid="account-off">Accounts are not available on this server.</p>

    <!-- signed out -->
    <template v-else-if="account.phase === 'signedOut'">
      <div data-testid="account-signed-out">
        <p class="max-w-[560px] text-[15px] leading-relaxed">
          An account is optional. With one, you can keep your Library, progress and settings in step across your devices. Without one, everything stays on this device, as it does now.
        </p>
        <div v-if="!showForm" class="mt-4 flex flex-wrap gap-2">
          <Button class="min-h-11" data-testid="account-signin" @click="((mode = 'signin'), (showForm = true))">Sign in</Button>
          <Button variant="outline" class="min-h-11" data-testid="account-signup" @click="((mode = 'signup'), (showForm = true))">Create account</Button>
        </div>
        <AccountAuthForm v-else class="mt-4" :mode="mode" @mode="(m) => (mode = m)" />
      </div>
    </template>

    <!-- signed in -->
    <template v-else-if="account.user">
      <section class="flex items-center gap-3" aria-label="Your account" data-testid="account-signed-in">
        <AccountAvatar :name="account.user.name" :src="avatar" :size="56" />
        <div class="min-w-0">
          <p class="truncate text-[16px] font-medium" data-testid="account-name">{{ account.user.name }}</p>
          <p class="truncate text-[13px] text-ink-2" data-testid="account-email">{{ account.user.email }}</p>
        </div>
      </section>

      <section v-if="account.config?.avatar" aria-label="Profile photo">
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="photo-change" @click="photo = true">{{ avatar ? "Change photo" : "Add a photo" }}</Button>
          <Button v-if="avatar" variant="outline" class="min-h-11 md:min-h-9" data-testid="photo-remove" @click="removeAvatar()">Remove photo</Button>
        </div>
        <p class="mt-1 text-[12px] text-ink-2">Only you see your photo. It is never used in Qur’an or study content.</p>
        <AccountPhotoSheet v-if="photo" @close="photo = false" />
      </section>

      <section aria-labelledby="sync-title" data-testid="account-sync">
        <h3 id="sync-title" class="font-serif text-[20px] font-medium">What syncs</h3>
        <p class="mt-1 text-[13px] text-ink-2" role="status" data-testid="sync-status">{{ syncText }}</p>

        <template v-if="!chosen">
          <p class="mt-3 max-w-[560px] text-[14px]" data-testid="sync-choose">Choose what to keep in step across your devices. Nothing syncs until you start.</p>
          <ul class="mt-2 divide-y border-y">
            <li v-for="c in CATEGORIES" :key="c" class="flex items-start justify-between gap-4 py-3">
              <div class="min-w-0"><p :id="`draft-${c}`" class="text-[15px] font-medium">{{ LABELS[c].title }}</p><p class="text-[13px] text-ink-2">{{ LABELS[c].text }}</p></div>
              <Switch :model-value="draft[c]" :aria-labelledby="`draft-${c}`" :data-testid="`draft-${c}`" @update:model-value="(v) => (draft[c] = !!v)" />
            </li>
          </ul>
          <Button class="mt-3 min-h-11" data-testid="sync-start" @click="startSync">Start syncing</Button>
        </template>

        <ul v-else class="mt-2 divide-y border-y">
          <li v-for="c in CATEGORIES" :key="c" class="flex items-start justify-between gap-4 py-3">
            <div class="min-w-0"><p :id="`cat-${c}`" class="text-[15px] font-medium">{{ LABELS[c].title }}</p><p class="text-[13px] text-ink-2">{{ LABELS[c].text }}</p></div>
            <Switch :model-value="account.choice?.[c] ?? false" :aria-labelledby="`cat-${c}`" :data-testid="`sync-${c}`" @update:model-value="(v) => onToggle(c, !!v)" />
          </li>
        </ul>
        <p v-if="usageText" class="mt-2 text-[12px] text-ink-2" data-testid="sync-usage">{{ usageText }}</p>
        <Button v-if="chosen" variant="outline" class="mt-3 min-h-11 md:min-h-9" data-testid="sync-now" @click="syncNow">Sync now</Button>
      </section>

      <p v-if="account.error" class="text-[13.5px] text-destructive" role="status" data-testid="account-error">{{ account.error }}</p>

      <section class="space-y-2 border-t pt-4" aria-label="Account actions">
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="account-signout" @click="onSignOut">Sign out</Button>
          <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="account-remove-synced" @click="onRemoveSynced">Remove synced data</Button>
        </div>
        <p class="max-w-[560px] text-[12.5px] text-ink-2">Signing out keeps everything on this device. Removing synced data deletes your copy on the server and stops syncing; this device keeps its own.</p>

        <div class="pt-2">
          <Button v-if="!deleting" variant="outline" class="min-h-11 text-destructive md:min-h-9" data-testid="account-delete" @click="deleting = true">Delete account</Button>
          <form v-else class="max-w-[420px] space-y-2 rounded-[10px] border border-destructive/40 p-4" data-testid="delete-form" @submit.prevent="onDelete">
            <p class="text-[14px]">This deletes your account and everything synced to it, for good. This device keeps its own data.</p>
            <label for="del-type" class="block text-[13px] text-ink-2">Type <b>delete</b> to confirm</label>
            <Input id="del-type" v-model="typed" autocomplete="off" class="min-h-11" data-testid="delete-type" />
            <label for="del-pass" class="block text-[13px] text-ink-2">Your password (if you use one)</label>
            <Input id="del-pass" v-model="delPassword" type="password" autocomplete="current-password" class="min-h-11" data-testid="delete-password" />
            <div class="flex gap-2 pt-1">
              <Button type="submit" variant="destructive" class="min-h-11 md:min-h-9" :disabled="typed.trim().toLowerCase() !== 'delete' || account.busy" data-testid="delete-confirm">Delete my account</Button>
              <Button type="button" variant="outline" class="min-h-11 md:min-h-9" @click="((deleting = false), (typed = ''), (delPassword = ''))">Cancel</Button>
            </div>
          </form>
        </div>
      </section>
    </template>
  </div>
</template>
