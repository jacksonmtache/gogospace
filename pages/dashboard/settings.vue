<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'Payments & Settings — GoGoSpace',
})

const settingsSections = [
  {
    title: 'Payment history',
    description: 'View past purchases and download receipts.',
    action: 'View history',
  },
  {
    title: 'Buy credits',
    description: 'Top up your account to generate more designs.',
    action: 'Buy credits',
  },
  {
    title: 'Account',
    description: 'Update your email, password, and notification preferences.',
    action: 'Edit account',
  },
]
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Payments & Settings</h1>
      <p class="mt-1 text-base text-muted-foreground sm:text-lg">
        Manage your billing and account preferences.
      </p>
    </header>

    <div class="mt-8 space-y-4 sm:mt-10">
      <div
        v-for="section in settingsSections"
        :key="section.title"
        class="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <div>
          <h2 class="font-semibold text-foreground">{{ section.title }}</h2>
          <p class="mt-1 text-sm text-muted-foreground sm:text-base">{{ section.description }}</p>
        </div>
        <button type="button" class="btn-outline shrink-0 rounded-lg px-4 py-2 text-sm font-medium sm:text-base">
          {{ section.action }}
        </button>
      </div>
    </div>
  </div>
</template>
