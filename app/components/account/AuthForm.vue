<script setup lang="ts">
// Sign in and create account (screens 02 and 03). Email and password always; Google only when the server has its keys; "Forgot password" only when the
// server can send email. Labels are real <label>s, every control is at least 44px on a phone, errors are read out (role="status").
import { account, requestReset, signIn, signInWithGoogle, signUp } from "~/lib/sync/runtime";

const props = withDefaults(defineProps<{ mode: "signin" | "signup"; signupAllowed?: boolean }>(), { signupAllowed: true });
const emit = defineEmits<{ mode: [value: "signin" | "signup"]; done: [] }>();

const name = ref("");
const email = ref("");
const password = ref("");
const show = ref(false);
const note = ref("");
const forgot = ref(false);

const signup = computed(() => props.mode === "signup");
const valid = computed(() => /^[^@\s]+@[^@\s]+$/.test(email.value.trim()) && password.value.length >= 8 && (!signup.value || name.value.trim().length > 0));

async function submit() {
  note.value = "";
  if (forgot.value) {
    const ok = await requestReset(email.value.trim());
    if (ok) note.value = "If that address has an account, we have sent a link to choose a new password.";
    return;
  }
  const ok = signup.value ? await signUp(name.value.trim(), email.value.trim(), password.value) : await signIn(email.value.trim(), password.value);
  if (ok) {
    password.value = "";
    if (signup.value && account.config?.email.verification) note.value = "Check your email for a link to confirm your address.";
    emit("done");
  }
}
</script>

<template>
  <form class="max-w-[420px] space-y-3" novalidate data-testid="auth-form" @submit.prevent="submit">
    <h3 class="font-serif text-[20px] font-medium">{{ forgot ? "Reset your password" : signup ? "Create account" : "Sign in" }}</h3>

    <Button v-if="account.config?.google && !forgot" type="button" variant="outline" class="min-h-11 w-full justify-center gap-2" data-testid="auth-google" @click="signInWithGoogle">
      <img src="/google-g.svg" alt="" width="18" height="18" />Continue with Google
    </Button>
    <p v-if="account.config?.google && !forgot" class="text-center text-[12px] text-ink-2">or with email</p>

    <div v-if="signup && !forgot">
      <label for="auth-name" class="mb-1 block text-[13px] text-ink-2">Name</label>
      <Input id="auth-name" v-model="name" type="text" autocomplete="name" class="min-h-11" data-testid="auth-name" />
    </div>
    <div>
      <label for="auth-email" class="mb-1 block text-[13px] text-ink-2">Email</label>
      <Input id="auth-email" v-model="email" type="email" inputmode="email" autocomplete="email" class="min-h-11" data-testid="auth-email" />
    </div>
    <div v-if="!forgot">
      <label for="auth-password" class="mb-1 block text-[13px] text-ink-2">Password</label>
      <div class="flex gap-2">
        <Input id="auth-password" v-model="password" :type="show ? 'text' : 'password'" :autocomplete="signup ? 'new-password' : 'current-password'" class="min-h-11" aria-describedby="auth-password-hint" data-testid="auth-password" />
        <Button type="button" variant="outline" class="min-h-11 shrink-0" :aria-pressed="show" data-testid="auth-show" @click="show = !show">{{ show ? "Hide" : "Show" }}</Button>
      </div>
      <p id="auth-password-hint" class="mt-1 text-[12px] text-ink-2">{{ signup ? "8 to 128 characters." : "" }}</p>
    </div>

    <p v-if="account.error" class="text-[13.5px] text-destructive" role="status" data-testid="auth-error">{{ account.error }}</p>
    <p v-if="note" class="text-[13.5px]" role="status" data-testid="auth-note">{{ note }}</p>

    <Button type="submit" class="min-h-11 w-full" :disabled="account.busy || (forgot ? !/^[^@\s]+@[^@\s]+$/.test(email.trim()) : !valid)" data-testid="auth-submit">
      {{ account.busy ? "One moment…" : forgot ? "Send the link" : signup ? "Create account" : "Sign in" }}
    </Button>

    <div class="flex flex-wrap items-center gap-x-4 text-[13px]">
      <button v-if="!forgot && (signupAllowed || signup)" type="button" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" data-testid="auth-switch" @click="emit('mode', signup ? 'signin' : 'signup')">
        {{ signup ? "I already have an account" : "Create an account" }}
      </button>
      <button v-if="!signup && !forgot && account.config?.email.reset" type="button" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" data-testid="auth-forgot" @click="forgot = true">Forgot password?</button>
      <button v-if="forgot" type="button" class="inline-flex min-h-11 items-center text-brand underline underline-offset-2" @click="forgot = false">Back to sign in</button>
    </div>
    <p v-if="!account.config?.email.reset && !signup && !forgot" class="text-[12px] text-ink-2">This server can’t send email, so a forgotten password can’t be reset here.</p>
  </form>
</template>
