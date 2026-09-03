<script setup lang="ts">
import type { Generation, GenerationGenerateResponse } from '~/types/generation'
import { SCAN_REDIRECT_DELAY } from '~/composables/useSpaceScanAnimation'

definePageMeta({
  layout: 'default',
  ssr: false,
})

useHead({
  title: 'Space Scan',
})

const POLL_MS = 2000
const POLL_ATTEMPTS = 90

const router = useRouter()
const route = useRoute()
const { job, start } = useGenerationJob()
const { user, fetchUser } = useAuth()
const { session, isPreview } = usePreviewSession()

const isRefine = computed(
  () => job.value?.kind === 'refine' || route.query.refine === '1' || route.query.refine === 'true',
)

const generationId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

const styleFromQuery = computed(() => {
  const style = route.query.style
  return typeof style === 'string' ? style : ''
})

const { data, error: loadError } = await useFetch<{ generation: Generation }>(
  () => `/api/generations/${generationId.value}`,
  {
    immediate: Boolean(!isPreview.value && user.value && generationId.value),
    watch: false,
  },
)

if (!isPreview.value) {
  if (!user.value) {
    await navigateTo('/')
  } else if (!generationId.value || loadError.value || !data.value?.generation?.originalUrl) {
    await navigateTo('/dashboard/new')
  }
}

const scanImage = computed(() => {
  if (isPreview.value) return session.value?.imageDataUrl || ''
  if (isRefine.value) {
    return (
      job.value?.previewUrl ||
      data.value?.generation.resultUrl ||
      data.value?.generation.originalUrl ||
      ''
    )
  }
  return data.value?.generation.originalUrl || ''
})

const apiSettled = ref(false)
const apiFailed = ref(false)
const errorMessage = ref('')
const scanMode = computed(() => (isPreview.value ? 'preview' : 'live'))

function finishAndRedirect() {
  const target = isPreview.value ? '/unlock' : `/dashboard/${generationId.value}`
  setTimeout(() => router.push(target), SCAN_REDIRECT_DELAY)
}

const {
  beamProgress,
  generatePercent,
  displayPercent,
  edgeCanvas,
  edgesReady,
  potential,
  start: startScan,
  stop: stopScan,
  finish,
  prepareEdges,
} = useSpaceScanAnimation({
  mode: scanMode,
  failed: apiFailed,
  settled: apiSettled,
  onComplete: finishAndRedirect,
})

async function pollUntilDone() {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const { generation } = await $fetch<{ generation: Generation }>(
      `/api/generations/${generationId.value}`,
    )
    if (generation.status === 'completed') {
      await fetchUser()
      return { generation, credits: 0 } as GenerationGenerateResponse
    }
    if (generation.status === 'failed') {
      throw new Error(generation.error || 'Generation failed')
    }
    if (generation.status === 'uploaded') {
      const style = styleFromQuery.value || generation.style
      if (!style) throw new Error('Choose a style to start generating')
      return start(generationId.value, style)
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  throw new Error('Generation timed out. Please try again.')
}

async function waitForGeneration() {
  const current = data.value?.generation

  try {
    if (job.value?.id === generationId.value) {
      await job.value.promise
      if (job.value.error) throw new Error(job.value.error)
      return true
    }

    if (current?.status === 'completed') return true

    if (current?.status === 'generating') {
      await pollUntilDone()
      return true
    }

    const style = styleFromQuery.value || current?.style
    if (!style) {
      await navigateTo(`/design?id=${generationId.value}`)
      return false
    }

    await start(generationId.value, style)
    return true
  } catch (error) {
    if (apiStatusCode(error) === 409) {
      await pollUntilDone()
      return true
    }
    throw error
  }
}

onMounted(async () => {
  await prepareEdges(scanImage.value)
  startScan()

  if (isPreview.value) return

  try {
    const done = await waitForGeneration()
    if (!done) return
    apiSettled.value = true
    finish()
  } catch (error) {
    apiFailed.value = true
    stopScan()
    errorMessage.value = apiErrorMessage(error, 'Generation failed')
    await fetchUser()
  }
})
</script>

<template>
  <section class="scan-page section-padding pt-20 sm:pt-24">
    <div class="mx-auto max-w-lg px-4 sm:px-6">
      <header class="text-center">
        <h1 class="text-2xl font-bold uppercase tracking-[0.2em] text-primary sm:text-3xl">
          Space Scan
        </h1>
        <p class="mt-2 text-base text-muted-foreground sm:text-lg">
          {{ errorMessage ? 'Scan interrupted' : `AI ${isRefine ? 'refining' : 'generating'} ${displayPercent}%` }}
        </p>
      </header>

      <div class="relative mx-auto mt-8 w-full max-w-[240px] sm:mt-10 sm:max-w-[280px]">
        <div class="scan-frame overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-1 shadow-lg">
          <div class="scan-grid relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
            <img
              :src="scanImage"
              alt="Scanning your space"
              class="absolute inset-0 h-full w-full object-cover opacity-35 saturate-50"
            />

            <div
              class="absolute inset-0 overflow-hidden"
              :style="{ clipPath: `inset(0 0 ${100 - beamProgress}% 0)` }"
            >
              <img
                :src="scanImage"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 h-full w-full object-cover opacity-90"
              />
              <canvas
                ref="edgeCanvas"
                class="scan-edge-canvas pointer-events-none absolute inset-0 h-full w-full opacity-80"
                :class="{ 'opacity-0': !edgesReady }"
              />
            </div>

            <div class="scan-grid-overlay pointer-events-none absolute inset-0" />

            <div class="pointer-events-none absolute inset-2">
              <span class="scan-corner scan-corner-tl" />
              <span class="scan-corner scan-corner-tr" />
              <span class="scan-corner scan-corner-bl" />
              <span class="scan-corner scan-corner-br" />
            </div>

            <div
              class="scan-beam pointer-events-none absolute left-0 right-0"
              :style="{ top: `${beamProgress}%` }"
            />
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center sm:mt-10">
        <p class="text-sm font-medium text-red-700 sm:text-base">{{ errorMessage }}</p>
        <div class="mt-4 flex justify-center gap-3">
          <NuxtLink
            v-if="isPreview"
            to="/design"
            class="btn-outline rounded-lg px-4 py-2 text-sm font-medium"
          >
            Choose style
          </NuxtLink>
          <NuxtLink
            v-else-if="isRefine"
            :to="`/dashboard/${generationId}`"
            class="btn-outline rounded-lg px-4 py-2 text-sm font-medium"
          >
            Back to project
          </NuxtLink>
          <NuxtLink
            v-else
            :to="`/design?id=${generationId}`"
            class="btn-outline rounded-lg px-4 py-2 text-sm font-medium"
          >
            Choose style
          </NuxtLink>
          <NuxtLink
            :to="isPreview ? '/' : '/dashboard/new'"
            class="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {{ isPreview ? 'Upload photo' : 'New photo' }}
          </NuxtLink>
        </div>
      </div>

      <div v-else class="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:mt-10">
        <div class="grid grid-cols-3 divide-x divide-border">
          <div class="px-3 py-5 text-center sm:px-4 sm:py-6">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">Space</p>
            <p class="mt-1 text-2xl font-bold text-primary sm:text-3xl">1</p>
          </div>
          <div class="px-3 py-5 text-center sm:px-4 sm:py-6">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">Styles</p>
            <p class="mt-1 text-2xl font-bold text-primary sm:text-3xl">1</p>
          </div>
          <div class="px-3 py-5 text-center sm:px-4 sm:py-6">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">Potential</p>
            <p class="mt-1 text-2xl font-bold text-primary sm:text-3xl">{{ Math.round(potential) }}</p>
          </div>
        </div>

        <div class="h-1.5 bg-muted">
          <div
            class="h-full bg-primary transition-[width] duration-150 ease-linear"
            :style="{ width: `${generatePercent}%` }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scan-page {
  background-image:
    radial-gradient(circle at 50% 0%, rgb(4 77 180 / 0.08), transparent 55%),
    radial-gradient(circle, rgb(4 77 180 / 0.12) 1px, transparent 1px);
  background-size: auto, 18px 18px;
  min-height: calc(100vh - 4rem);
}

.scan-grid-overlay {
  background-image:
    linear-gradient(rgb(4 77 180 / 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgb(4 77 180 / 0.12) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.7;
}

.scan-edge-canvas {
  object-fit: cover;
}

.scan-beam {
  height: 3px;
  margin-top: -1.5px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(96 165 250 / 0.4) 15%,
    rgb(59 130 246) 50%,
    rgb(96 165 250 / 0.4) 85%,
    transparent
  );
  box-shadow:
    0 0 12px 2px rgb(59 130 246 / 0.7),
    0 0 24px 4px rgb(59 130 246 / 0.35);
}

.scan-beam::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgb(59 130 246);
  box-shadow: 0 0 8px 2px rgb(59 130 246 / 0.8);
}

.scan-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: white;
  border-style: solid;
  filter: drop-shadow(0 0 2px rgb(4 77 180 / 0.5));
}

.scan-corner-tl {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}

.scan-corner-tr {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
}

.scan-corner-bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
}

.scan-corner-br {
  bottom: 0;
  right: 0;
  border-width: 0 2px 2px 0;
}
</style>
