<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Forgot Password — GoGoSpace',
})
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
        <form class="space-y-5" @submit.prevent>
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <button type="submit" class="btn-primary w-full rounded-lg px-6 py-3 text-base font-medium">
            Send reset link
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
