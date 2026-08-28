<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Log in — GoGoSpace',
})
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

          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label for="password" class="text-sm font-medium text-foreground">Password</label>
              <NuxtLink to="/forgot-password" class="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </NuxtLink>
            </div>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <label class="flex items-center gap-2.5">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span class="text-sm text-muted-foreground sm:text-base">Remember me</span>
          </label>

          <button type="submit" class="btn-primary w-full rounded-lg px-6 py-3 text-base font-medium">
            Log in
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
