<script setup lang="ts">
// The admin panel's one view: "All users". A super admin signs in (their own account, the same sign-in as everyone's) and the table loads from
// /api/admin/users. It shows who exists and how much each has synced, never anything a user synced. Read only: there is nothing here to change.
import AccountAuthForm from "~/components/account/AuthForm.vue";
import { account, reconnect, signOut, startAccount } from "~/lib/sync/runtime";

interface Row {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  hasPhoto: boolean;
  createdAt: string;
  providers: string[];
  sessions: number;
  syncRecords: number;
  syncBytes: number;
}

const rows = ref<Row[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = 50;
const state = ref<"idle" | "loading" | "ready" | "denied" | "error">("idle");
const mode = ref<"signin" | "signup">("signin");

async function load() {
  state.value = "loading";
  try {
    const res = await fetch(`/api/admin/users?page=${page.value}&perPage=${perPage}`, { credentials: "same-origin", headers: { accept: "application/json" } });
    if (res.status === 401 || res.status === 404) {
      state.value = "denied";
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { users: Row[]; total: number };
    rows.value = j.users;
    total.value = j.total;
    state.value = "ready";
  } catch {
    state.value = "error";
  }
}

onMounted(async () => {
  await startAccount();
  if (account.phase === "signedIn") await load();
});
watch(() => account.phase, (p) => p === "signedIn" && void load());
watch(page, () => void load());

const pages = computed(() => Math.max(1, Math.ceil(total.value / perPage)));
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
const kb = (n: number) => (n ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : "0");
</script>

<template>
  <section class="mx-auto max-w-5xl" data-testid="admin-page">
    <h1 v-if="state !== 'denied'" class="font-serif text-[28px] font-medium">All users</h1>

    <p v-if="account.phase === 'loading'" class="mt-3 text-[14px] text-ink-2" role="status">Loading…</p>
    <p v-else-if="account.phase === 'unavailable'" class="mt-3 text-[14px]" role="status">
      Can’t reach the server right now. <button type="button" class="text-brand underline" @click="reconnect">Try again</button>
    </p>

    <template v-else-if="account.phase === 'signedOut'">
      <p class="mt-2 text-[14px] text-ink-2">Sign in with your admin account.</p>
      <AccountAuthForm class="mt-4" mode="signin" :signup-allowed="false" @mode="(m) => (mode = m)" />
    </template>

    <template v-else-if="account.phase === 'signedIn'">
      <!-- not a super admin: exactly what any address that is not a page shows (the server answered 404), plus a way out -->
      <div v-if="state === 'denied'" data-testid="admin-denied">
        <h1 class="font-serif text-[28px] font-medium">Page not found</h1>
        <p class="mt-2 text-[15px] text-ink-2">There is no page at this address.</p>
        <Button variant="outline" class="mt-3 min-h-11 md:min-h-9" @click="signOut">Sign out</Button>
      </div>
      <p v-else-if="state === 'error'" class="mt-3 text-[14px]" role="status">Couldn’t load the list. <button type="button" class="text-brand underline" @click="load">Try again</button></p>
      <p v-else-if="state === 'loading' || state === 'idle'" class="mt-3 text-[14px] text-ink-2" role="status">Loading…</p>
      <template v-else>
        <div class="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p class="text-[13.5px] text-ink-2" data-testid="admin-total">{{ total }} {{ total === 1 ? "user" : "users" }}</p>
          <Button variant="outline" class="min-h-11 md:min-h-9" @click="signOut">Sign out</Button>
        </div>
        <div class="mt-3 overflow-x-auto rounded-[10px] border">
          <table class="w-full min-w-[720px] text-left text-[13.5px]" data-testid="admin-table">
            <caption class="sr-only">All users, newest first</caption>
            <thead class="border-b bg-sunken text-[12px] uppercase tracking-wide text-ink-2">
              <tr>
                <th scope="col" class="px-3 py-2">Name</th>
                <th scope="col" class="px-3 py-2">Email</th>
                <th scope="col" class="px-3 py-2">Role</th>
                <th scope="col" class="px-3 py-2">Sign-in</th>
                <th scope="col" class="px-3 py-2">Joined</th>
                <th scope="col" class="px-3 py-2 text-right">Synced</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in rows" :key="u.id" class="border-b last:border-b-0" data-testid="admin-row">
                <td class="px-3 py-2">{{ u.name }}</td>
                <td class="px-3 py-2">{{ u.email }}<span v-if="!u.emailVerified" class="ml-1 text-[12px] text-ink-2">(unconfirmed)</span></td>
                <td class="px-3 py-2">{{ u.role === "superadmin" ? "Super admin" : "User" }}</td>
                <td class="px-3 py-2">{{ u.providers.map((p) => (p === "credential" ? "Email" : p === "google" ? "Google" : p)).join(", ") || "none" }}</td>
                <td class="px-3 py-2 whitespace-nowrap">{{ when(u.createdAt) }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">{{ u.syncRecords }} · {{ kb(u.syncBytes) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav v-if="pages > 1" class="mt-3 flex items-center justify-between" aria-label="Pages">
          <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="page <= 1" @click="page--">Previous</Button>
          <span class="text-[13px] text-ink-2">Page {{ page }} of {{ pages }}</span>
          <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="page >= pages" @click="page++">Next</Button>
        </nav>
        <p class="mt-3 text-[12px] text-ink-2">View only. This list shows who has an account and how much each has synced, never what they synced.</p>
      </template>
    </template>
  </section>
</template>
