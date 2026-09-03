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

const { user } = useAuth()
const { startRefine } = useGenerationJob()

const { data, error } = await useFetch<{ generation: Generation }>(
  () => `/api/generations/${id.value}`,
  {
    watch: [id],
    getCachedData: () => undefined,
  },
)

const generation = computed(() => data.value?.generation)
const styleName = computed(() => getDesignStyle(generation.value?.style || '')?.name || 'Design')

useHead({
  title: computed(() => styleName.value),
})

if (error.value || !generation.value) {
  await navigateTo('/dashboard')
}

if (generation.value?.status === 'generating' || generation.value?.status === 'uploaded') {
  const refineQuery = generation.value.status === 'generating' && generation.value.resultUrl ? '&refine=1' : ''
  await navigateTo(`/scan?id=${id.value}&style=${generation.value.style || ''}${refineQuery}`)
}

if (generation.value?.status !== 'completed' || !generation.value.originalUrl || !generation.value.resultUrl) {
  await navigateTo('/dashboard/new')
}

const downloading = ref<'original' | 'result' | null>(null)
const instruction = ref('')
const refining = ref(false)
const refineError = ref('')
const selectedPath = ref('')
const MAX_INSTRUCTION = 1000

const creditsLeft = computed(() => user.value?.credits ?? 0)
const instructionTrimmed = computed(() => instruction.value.trim())
const versions = computed(() => generation.value?.versions ?? [])
const selectedVersion = computed(
  () => versions.value.find((item) => item.path === selectedPath.value) || versions.value.at(-1) || null,
)
const selectedUrl = computed(() => selectedVersion.value?.url || generation.value?.resultUrl || '')
const canRefine = computed(
  () =>
    creditsLeft.value >= 1 &&
    instructionTrimmed.value.length > 0 &&
    instructionTrimmed.value.length <= MAX_INSTRUCTION &&
    !refining.value,
)

watch(
  versions,
  (list) => {
    if (!list.length) return
    if (!list.some((item) => item.path === selectedPath.value)) {
      selectedPath.value = list[list.length - 1].path
    }
  },
  { immediate: true },
)

function versionLabel(index: number) {
  return index === 0 ? 'First design' : `Refine ${index}`
}

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

async function onRefine() {
  if (!canRefine.value || !id.value) return
  refining.value = true
  refineError.value = ''
  startRefine(
    id.value,
    instructionTrimmed.value,
    generation.value?.style || '',
    generation.value?.resultUrl || selectedUrl.value,
  )
  await navigateTo(`/scan?id=${id.value}&style=${generation.value?.style || ''}&refine=1`)
}

async function download(kind: 'original' | 'result') {
  const url = kind === 'original' ? generation.value?.originalUrl : selectedUrl.value
  if (!url || downloading.value) return
  downloading.value = kind
  try {
    const filename =
      kind === 'original'
        ? 'gogospace-original.jpg'
        : `gogospace-${slug(styleName.value)}${selectedVersion.value && versions.value.length > 1 ? `-v${versions.value.indexOf(selectedVersion.value) + 1}` : ''}.jpg`
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
        :src="selectedUrl"
        :alt="`${styleName} redesign`"
        class="w-full h-auto"
      />
      <span
        class="pointer-events-none absolute right-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:right-4 sm:top-4 sm:text-sm"
      >
        Download
      </span>
    </button>

    <div v-if="versions.length > 1" class="mt-4">
      <p class="text-sm font-medium text-foreground sm:text-base">Version history</p>
      <p class="mt-1 text-sm text-muted-foreground">
        Previous designs stay here. Click one to view or download it.
      </p>
      <div class="mt-3 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="(version, index) in versions"
          :key="version.path"
          type="button"
          class="group w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-card text-left shadow-sm sm:w-28"
          :class="
            selectedPath === version.path
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/40'
          "
          @click="selectedPath = version.path"
        >
          <img :src="version.url" :alt="versionLabel(index)" class="h-20 w-full object-cover sm:h-24" />
          <span class="block truncate px-2 py-1.5 text-[11px] font-medium text-foreground sm:text-xs">
            {{ versionLabel(index) }}
          </span>
        </button>
      </div>
      <p v-if="selectedVersion?.instruction" class="mt-2 text-sm text-muted-foreground">
        “{{ selectedVersion.instruction }}”
      </p>
    </div>

    <form class="mt-6 sm:mt-8" @submit.prevent="onRefine">
      <label for="refine-instruction" class="block text-sm font-medium text-foreground sm:text-base">
        Fine-tune this design
      </label>
      <p class="mt-1 text-sm text-muted-foreground">
        Describe the change you want. This uses 1 credit.
      </p>
      <textarea
        id="refine-instruction"
        v-model="instruction"
        rows="3"
        :maxlength="MAX_INSTRUCTION"
        placeholder="e.g. Make the sofa navy blue and add warmer lighting"
        class="mt-3 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-ring transition-shadow focus:ring-2"
      />
      <div class="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
        <span>{{ instruction.length }}/{{ MAX_INSTRUCTION }}</span>
      </div>

      <button
        type="submit"
        class="btn-primary mt-4 flex w-full max-w-sm items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-base font-semibold sm:py-4 sm:text-lg disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!canRefine"
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
        <span>{{ refining ? 'Starting…' : 'Refine' }}</span>
        <span class="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-medium">1 credit</span>
      </button>

      <p v-if="creditsLeft < 1" class="mt-4 max-w-sm text-sm text-red-600">
        You need 1 credit to refine this design.
        <NuxtLink to="/dashboard/settings" class="font-medium underline underline-offset-2">Buy credits</NuxtLink>
      </p>
      <p v-else-if="refineError" class="mt-4 max-w-sm text-sm text-red-600">
        {{ refineError }}
      </p>
    </form>
  </div>
</template>
