<script setup lang="ts">
import type { Generation } from '~/types/generation'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'Past Projects — GoGoSpace',
})

const { data, error, pending } = await useFetch<{ generations: Generation[] }>('/api/generations')

const projects = computed(() => data.value?.generations ?? [])

function styleName(style: string | null) {
  return getDesignStyle(style || '')?.name || 'Design'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <header>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Past Projects</h1>
      <p class="mt-1 text-base text-muted-foreground sm:text-lg">
        All your generated space designs in one place.
      </p>
    </header>

    <p v-if="error" class="mt-8 text-sm text-red-600 sm:text-base">
      Could not load your projects. Refresh to try again.
    </p>

    <div v-else-if="pending && !projects.length" class="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      <div v-for="n in 3" :key="n" class="h-64 animate-pulse rounded-xl bg-muted" />
    </div>

    <div
      v-else-if="!projects.length"
      class="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"
    >
      <p class="text-base font-medium text-foreground sm:text-lg">No designs yet</p>
      <p class="mt-1 text-sm text-muted-foreground sm:text-base">
        Upload a room photo to generate your first redesign.
      </p>
      <NuxtLink
        to="/dashboard/new"
        class="btn-primary mt-6 inline-flex rounded-lg px-6 py-3 text-base font-medium"
      >
        New project
      </NuxtLink>
    </div>

    <div v-else class="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/dashboard/${project.id}`"
        class="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="aspect-[4/3] overflow-hidden bg-muted">
          <img
            v-if="project.resultUrl"
            :src="project.resultUrl"
            :alt="`${styleName(project.style)} redesign`"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div class="p-4">
          <h2 class="font-semibold text-foreground">{{ styleName(project.style) }} redesign</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ styleName(project.style) }} · {{ formatDate(project.createdAt) }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
