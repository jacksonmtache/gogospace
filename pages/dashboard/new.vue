<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'New Project — GoGoSpace',
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">New Project</h1>
      <p class="mt-1 text-base text-muted-foreground sm:text-lg">
        Upload a photo of your space to start a new design.
      </p>
    </header>

    <div class="mt-8 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center sm:mt-10 sm:p-12">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <p class="mt-4 text-base font-medium text-foreground sm:text-lg">Drop your room photo here</p>
      <p class="mt-1 text-sm text-muted-foreground sm:text-base">or click to browse files</p>
      <NuxtLink
        to="/design"
        class="btn-primary mt-6 inline-flex rounded-lg px-6 py-3 text-base font-medium"
      >
        Upload photo
      </NuxtLink>
    </div>
  </div>
</template>
