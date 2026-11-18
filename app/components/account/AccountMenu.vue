<script setup lang="ts">
// The quiet header entry (screen 07): only with sync on. Signed out: Sign in / Create account. Signed in: your picture opens Account and Sign out.
// It never shows a badge, a count or a nudge.
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { account, avatarSrc, signOut, startAccount } from "~/lib/sync/runtime";

onMounted(() => void startAccount());
const router = useRouter();
const options = computed<MenuOption[]>(() =>
  account.phase === "signedIn"
    ? [
        { value: "account", label: "Account", icon: "lucide:user" },
        { value: "signout", label: "Sign out", icon: "lucide:log-out" },
      ]
    : [
        { value: "signin", label: "Sign in", icon: "lucide:log-in" },
        { value: "signup", label: "Create account", icon: "lucide:user-plus" },
      ],
);
const visible = computed(() => account.phase === "signedIn" || account.phase === "signedOut" || account.phase === "unavailable");
async function pick(v: string) {
  if (v === "signout") return void (await signOut());
  await router.push({ path: "/settings", query: { section: "account", ...(v === "signin" || v === "signup" ? { mode: v } : {}) } });
}
</script>

<template>
  <ResponsiveMenu v-if="visible" model-value="" :options="options" label="Account" title="Account" @update:model-value="pick">
    <template #trigger>
      <Button variant="ghost" size="icon" class="size-11 md:size-9" aria-label="Account" data-testid="account-menu">
        <AccountAvatar v-if="account.phase === 'signedIn' && account.user" :name="account.user.name" :src="avatarSrc(account.user, account.config?.avatar?.cloudName)" :size="28" />
        <Icon v-else name="lucide:user" size="18" />
      </Button>
    </template>
  </ResponsiveMenu>
</template>
