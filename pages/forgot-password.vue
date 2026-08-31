<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

useHead({
  title: 'Forgot Password — GoGoSpace',
})

const { requestPasswordReset } = useAuth()

const email = ref('')
const errorMessage = ref('')
const pending = ref(false)
const sent = ref(false)

async function onSubmit() {
  errorMessage.value = ''
  pending.value = true
  try {
    await requestPasswordReset(email.value)
    sent.value = true
  } catch (error: unknown) {
    errorMessage.value = apiErrorMessage(error, 'Unable to send reset email')
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
          Forgot your password?
        </h1>
        <p class="mt-3 text-base text-muted-foreground sm:text-lg">
          Enter the email associated with your account and we'll send you a link to reset your password.
        </p>
      </header>

      <div class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:mt-10 sm:p-8">
        <div v-if="sent" class="space-y-3 text-center">
          <h2 class="text-lg font-semibold text-foreground">Check your email</h2>
          <p class="text-sm text-muted-foreground sm:text-base">
            If an account exists for <span class="font-medium text-foreground">{{ email }}</span>, we sent a reset link.
            It expires in 1 hour.
          </p>
        </div>

        <form v-else class="space-y-5" @submit.prevent="onSubmit">
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

          <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full rounded-lg px-6 py-3 text-base font-medium disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="pending"
          >
            {{ pending ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>
      </div>

      <p class="mt-6 text-center text-sm text-muted-foreground sm:text-base">
        Remember your password?
        <NuxtLink to="/login" class="font-medium text-primary hover:underline">Back to log in</NuxtLink>
      </p>
    </div>
  </section>
</template>
