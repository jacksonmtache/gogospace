<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

useHead({
  title: 'Log in',
})

import { FetchError } from 'ofetch'

const { login } = useAuth()
const route = useRoute()

const email = ref(String(route.query.email || '').trim())
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref('')
const pending = ref(false)
const successMessage = computed(() => {
  if (route.query.paid === '1') {
    return 'Credits were added to your account. Log in to continue.'
  }
  if (route.query.reset === 'success') {
    return 'Password updated. Log in with your new password.'
  }
  return ''
})

function toLoginError(error: unknown) {
  if (error instanceof FetchError) {
    return (
      error.data?.statusMessage ||
      error.data?.message ||
      error.statusMessage ||
      'Invalid email or password'
    )
  }
  return 'Invalid email or password'
}

async function onSubmit() {
  errorMessage.value = ''
  pending.value = true
  try {
    await login(email.value, password.value, rememberMe.value)
    await navigateTo('/dashboard')
  } catch (error: unknown) {
    errorMessage.value = toLoginError(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="section-padding pt-24 sm:pt-28">
    <div class="mx-auto w-full max-w-md px-4 sm:px-6">
      <header class="text-center">
        <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p class="mt-3 text-base text-muted-foreground sm:text-lg">
          Log in to access your designs and continue transforming your space.
        </p>
      </header>

      <div class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:mt-10 sm:p-8">
        <form class="space-y-5" @submit.prevent="onSubmit">
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label for="password" class="text-sm font-medium text-foreground">Password</label>
              <NuxtLink to="/forgot-password" class="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </NuxtLink>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <label class="flex items-center gap-2.5">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span class="text-sm text-muted-foreground sm:text-base">Remember me</span>
          </label>

          <p v-if="successMessage && !errorMessage" class="text-sm text-primary" role="status">
            {{ successMessage }}
          </p>

          <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full rounded-lg px-6 py-3 text-center text-base font-medium disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="pending"
          >
            {{ pending ? 'Logging in…' : 'Log in' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
