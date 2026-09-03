<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Reset Password',
})

const route = useRoute()
const { resetPassword } = useAuth()

const tokenHash = computed(() => String(route.query.token_hash || '').trim())
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const pending = ref(false)

const hasToken = computed(() => Boolean(tokenHash.value))

async function onSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    errorMessage.value = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    return
  }

  pending.value = true
  try {
    const result = await resetPassword(tokenHash.value, password.value)
    if (result.loggedIn) {
      await navigateTo('/dashboard')
      return
    }
    await navigateTo({ path: '/login', query: { reset: 'success' } })
  } catch (error: unknown) {
    errorMessage.value = apiErrorMessage(error, 'Unable to reset password')
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
          Choose a new password
        </h1>
        <p class="mt-3 text-base text-muted-foreground sm:text-lg">
          Enter a new password for your GoGoSpace account.
        </p>
      </header>

      <div class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:mt-10 sm:p-8">
        <div v-if="!hasToken" class="space-y-3 text-center">
          <p class="text-sm text-muted-foreground sm:text-base">
            This reset link is invalid or has expired. Request a new one to continue.
          </p>
          <NuxtLink to="/forgot-password" class="inline-block font-medium text-primary hover:underline">
            Request a new reset link
          </NuxtLink>
        </div>

        <form v-else class="space-y-5" @submit.prevent="onSubmit">
          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-foreground">New password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              :minlength="MIN_PASSWORD_LENGTH"
              placeholder="••••••••"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <div>
            <label for="confirm-password" class="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              :minlength="MIN_PASSWORD_LENGTH"
              placeholder="••••••••"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full rounded-lg px-6 py-3 text-base font-medium disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="pending"
          >
            {{ pending ? 'Updating…' : 'Update password' }}
          </button>
        </form>
      </div>

      <p class="mt-6 text-center text-sm text-muted-foreground sm:text-base">
        <NuxtLink to="/login" class="font-medium text-primary hover:underline">Back to log in</NuxtLink>
      </p>
    </div>
  </section>
</template>
