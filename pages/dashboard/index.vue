<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'Past Projects — GoGoSpace',
})

const projects = [
  {
    id: 1,
    title: 'Living room redesign',
    style: 'Minimalist',
    image: '/images/minimalist.avif',
    date: 'Aug 28, 2026',
  },
  {
    id: 2,
    title: 'Bedroom concept',
    style: 'Japandi',
    image: '/images/howtouse3.avif',
    date: 'Aug 25, 2026',
  },
  {
    id: 3,
    title: 'Kitchen refresh',
    style: 'Scandinavian',
    image: '/images/howtouse2.avif',
    date: 'Aug 20, 2026',
  },
  {
    id: 4,
    title: 'Home office',
    style: 'Industrial',
    image: '/images/original.avif',
    date: 'Aug 15, 2026',
  },
]
</script>

<template>
  <div>
    <header>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Past Projects</h1>
      <p class="mt-1 text-base text-muted-foreground sm:text-lg">
        All your generated space designs in one place.
      </p>
    </header>

    <div class="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      <article
        v-for="project in projects"
        :key="project.id"
        class="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="aspect-[4/3] overflow-hidden bg-muted">
          <img
            :src="project.image"
            :alt="project.title"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div class="p-4">
          <h2 class="font-semibold text-foreground">{{ project.title }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ project.style }} · {{ project.date }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
