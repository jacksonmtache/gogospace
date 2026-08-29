<script setup lang="ts">
import type { Generation } from '~/types/generation'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const route = useRoute()
const id = computed(() => String(route.params.id || ''))

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.value)) {
  await navigateTo('/dashboard')
}

const { data, error } = await useFetch<{ generation: Generation }>(
  () => `/api/generations/${id.value}`,
  { watch: [id] },
)

const generation = computed(() => data.value?.generation)
const styleName = computed(() => getDesignStyle(generation.value?.style || '')?.name || 'Design')

useHead({
  title: computed(() => `${styleName.value} — GoGoSpace`),
})

if (error.value || !generation.value) {
  await navigateTo('/dashboard')
}

if (generation.value?.status === 'generating' || generation.value?.status === 'uploaded') {
  await navigateTo(`/scan?id=${id.value}&style=${generation.value.style || ''}`)
}

if (generation.value?.status !== 'completed' || !generation.value.originalUrl || !generation.value.resultUrl) {
  await navigateTo('/dashboard/new')
}

const downloading = ref<'original' | 'result' | null>(null)

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

async function download(kind: 'original' | 'result') {
  const url = kind === 'original' ? generation.value?.originalUrl : generation.value?.resultUrl
  if (!url || downloading.value) return
  downloading.value = kind
  try {
    const filename =
      kind === 'original'
        ? 'gogospace-original.jpg'
        : `gogospace-${slug(styleName.value)}.jpg`
    await downloadImage(url, filename)
  } finally {
    downloading.value = null
  }
}
</script>

<template>
  <div v-if="generation?.originalUrl && generation.resultUrl">
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
          {{ styleName }} redesign
        </h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          Click an image to download it.
        </p>
      </div>

      <button
        type="button"
        class="group relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:h-24 sm:w-36"
        :disabled="downloading === 'original'"
        @click="download('original')"
      >
        <img
          :src="generation.originalUrl"
          alt="Original photo"
          class="h-full w-full object-cover"
        />
        <span
          class="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent pb-1.5 text-[10px] font-medium text-white sm:text-xs"
        >
          Original
        </span>
      </button>
    </header>

    <button
      type="button"
      class="group relative mt-6 block w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:mt-8"
      :disabled="downloading === 'result'"
      @click="download('result')"
    >
      <img
        :src="generation.resultUrl"
        :alt="`${styleName} redesign`"
        class="w-full h-auto"
      />
      <span
        class="pointer-events-none absolute right-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:right-4 sm:top-4 sm:text-sm"
      >
        Download
      </span>
    </button>
  </div>
</template>
