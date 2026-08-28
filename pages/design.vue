<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Choose Style — GoGoSpace',
})

// Layout placeholder — replace with uploaded image from route/state later
const uploadedImage = '/images/original.avif'
const selectedStyle = ref('minimalist')

const designStyles = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M4 12h16"/></svg>',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/></svg>',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg>',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M4 9h16M6 9v12h12V9"/></svg>',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.8 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z"/></svg>',
  },
  {
    id: 'muji',
    name: 'Japanese Muji',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M4 8h16M4 12h16M4 16h16"/></svg>',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21c4-4 7-7.5 7-11a7 7 0 10-14 0c0 3.5 3 7 7 11z"/></svg>',
  },
  {
    id: 'mid-century',
    name: 'Mid-century',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5v14M7 7l10 10M17 7L7 17"/></svg>',
  },
]
</script>

<template>
  <section class="section-padding pt-20 sm:pt-24">
    <div class="mx-auto max-w-2xl px-4 sm:px-6">
      <!-- Uploaded image -->
      <div class="flex justify-center">
        <div class="relative h-24 w-32 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:h-28 sm:w-36">
          <img
            :src="uploadedImage"
            alt="Your uploaded space"
            class="h-full w-full object-cover"
          />
          <div
            class="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs"
          >
            Your photo
          </div>
        </div>
      </div>

      <!-- Style picker -->
      <div class="mt-6 sm:mt-8">
        <div class="text-center">
          <h1 class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Choose a design style
          </h1>
          <p class="mt-2 text-base text-muted-foreground sm:text-lg">
            Select the look you want for your space.
          </p>
        </div>

        <div class="mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:gap-3">
          <button
            v-for="style in designStyles"
            :key="style.id"
            type="button"
            class="flex flex-col items-center gap-1 rounded-lg border-2 bg-card px-1.5 py-2 text-center shadow-sm transition-all sm:gap-1.5 sm:px-2 sm:py-2.5"
            :class="
              selectedStyle === style.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40'
            "
            @click="selectedStyle = style.id"
          >
            <div
              class="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground sm:h-7 sm:w-7"
              :class="selectedStyle === style.id ? 'bg-primary/10 text-primary' : 'bg-muted'"
              v-html="style.icon"
            />
            <span class="text-[11px] font-medium leading-tight text-foreground sm:text-xs">
              {{ style.name }}
            </span>
          </button>
        </div>
      </div>

      <!-- Start action -->
      <div class="mt-8 border-t border-border pt-8 sm:mt-10">
        <button
          type="button"
          class="btn-primary mx-auto flex w-full max-w-sm items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-base font-semibold sm:py-4 sm:text-lg"
        >
          <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="#EAB308" stroke="#CA8A04" stroke-width="1" />
            <path
              d="M12 8.5c-1.5 0-2.5.75-2.5 1.75S10.5 12 12 12s2.5.75 2.5 1.75S13.5 15.5 12 15.5M12 7v1.5M12 15.5V17"
              stroke="#A16207"
              stroke-width="1.25"
              stroke-linecap="round"
            />
          </svg>
          <span>Start</span>
          <span class="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-medium">1 coin</span>
        </button>

        <p class="mx-auto mt-4 max-w-sm text-center text-sm text-muted-foreground">
          Make sure your space is clearly visible
        </p>
      </div>
    </div>
  </section>
</template>
