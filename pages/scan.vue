<script setup lang="ts">
import type { Generation, GenerationGenerateResponse } from '~/types/generation'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({
  title: 'Space Scan — GoGoSpace',
})

const EDGE_THRESHOLD = 115
const EDGE_ALPHA = 70
const MAX_PROCESS_WIDTH = 400
const BEAM_DURATION = 4500
const GENERATE_DURATION = 40_000
const POTENTIAL_DURATION = 700
const HOLD_AT = 95 + Math.floor(Math.random() * 4)
const SCAN_REDIRECT_DELAY = 400
const POLL_MS = 2000
const POLL_ATTEMPTS = 90

const router = useRouter()
const route = useRoute()
const { job, start } = useGenerationJob()
const { fetchUser } = useAuth()

const generationId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

const styleFromQuery = computed(() => {
  const style = route.query.style
  return typeof style === 'string' ? style : ''
})

if (!generationId.value) {
  await navigateTo('/dashboard/new')
}

const { data, error: loadError } = await useFetch<{ generation: Generation }>(
  () => `/api/generations/${generationId.value}`,
)

if (loadError.value || !data.value?.generation?.originalUrl) {
  await navigateTo('/dashboard/new')
}

const uploadedImage = computed(() => data.value?.generation.originalUrl || '')
const beamProgress = ref(0)
const generatePercent = ref(0)
const edgeCanvas = ref<HTMLCanvasElement | null>(null)
const edgesReady = ref(false)
const apiSettled = ref(false)
const apiFailed = ref(false)
const errorMessage = ref('')
const potentialTarget = Math.floor(Math.random() * 11) + 90
const potential = ref(0)
const displayPercent = computed(() => Math.round(generatePercent.value))

let beamTimer: ReturnType<typeof setInterval> | null = null
let generateTimer: ReturnType<typeof setInterval> | null = null
let potentialTimer: ReturnType<typeof setInterval> | null = null

function buildEdgeMap(imageSrc: string, canvas: HTMLCanvasElement) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(1, MAX_PROCESS_WIDTH / img.naturalWidth)
      const width = Math.round(img.naturalWidth * scale)
      const height = Math.round(img.naturalHeight * scale)

      const offscreen = document.createElement('canvas')
      offscreen.width = width
      offscreen.height = height
      const ctx = offscreen.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const { data: pixels } = ctx.getImageData(0, 0, width, height)

      const gray = new Float32Array(width * height)
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4
        gray[i] = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]
      }

      const edges = new Uint8Array(width * height)
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = y * width + x
          const gx =
            -gray[i - width - 1] +
            gray[i - width + 1] -
            2 * gray[i - 1] +
            2 * gray[i + 1] -
            gray[i + width - 1] +
            gray[i + width + 1]
          const gy =
            -gray[i - width - 1] -
            2 * gray[i - width] -
            gray[i - width + 1] +
            gray[i + width - 1] +
            2 * gray[i + width] +
            gray[i + width + 1]
          const magnitude = Math.hypot(gx, gy)
          edges[i] = magnitude > EDGE_THRESHOLD ? 255 : 0
        }
      }

      canvas.width = width
      canvas.height = height
      const out = canvas.getContext('2d')
      if (!out) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      const outData = out.createImageData(width, height)
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4
        if (edges[i]) {
          outData.data[idx] = 59
          outData.data[idx + 1] = 130
          outData.data[idx + 2] = 246
          outData.data[idx + 3] = EDGE_ALPHA
        }
      }
      out.putImageData(outData, 0, 0)
      resolve()
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageSrc
  })
}

function stopScan() {
  if (beamTimer) {
    clearInterval(beamTimer)
    beamTimer = null
  }
  if (generateTimer) {
    clearInterval(generateTimer)
    generateTimer = null
  }
  if (potentialTimer) {
    clearInterval(potentialTimer)
    potentialTimer = null
  }
}

let finished = false

function finishAndRedirect() {
  if (finished || apiFailed.value) return
  finished = true
  stopScan()
  generatePercent.value = 100
  setTimeout(() => router.push(`/dashboard/${generationId.value}`), SCAN_REDIRECT_DELAY)
}

function startScan() {
  const interval = 30
  const beamStep = (100 / BEAM_DURATION) * interval
  const generateStep = (HOLD_AT / GENERATE_DURATION) * interval

  beamTimer = setInterval(() => {
    if (apiFailed.value) return
    beamProgress.value += beamStep
    if (beamProgress.value >= 100) beamProgress.value = 0
  }, interval)

  generateTimer = setInterval(() => {
    if (apiFailed.value) {
      stopScan()
      return
    }

    if (generatePercent.value < HOLD_AT) {
      generatePercent.value = Math.min(HOLD_AT, generatePercent.value + generateStep)
    }

    if (apiSettled.value) {
      finishAndRedirect()
    }
  }, interval)

  const potentialRange = potentialTarget
  if (potentialRange > 0) {
    const potentialStep = (potentialRange / POTENTIAL_DURATION) * interval
    potentialTimer = setInterval(() => {
      potential.value = Math.min(potentialTarget, potential.value + potentialStep)
      if (potential.value >= potentialTarget && potentialTimer) {
        potential.value = potentialTarget
        clearInterval(potentialTimer)
        potentialTimer = null
      }
    }, interval)
  }
}

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
  if (current?.status === 'completed') return true

  try {
    if (job.value?.id === generationId.value) {
      await job.value.promise
      if (job.value.error) throw new Error(job.value.error)
      return true
    }

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
  if (edgeCanvas.value && uploadedImage.value) {
    try {
      await buildEdgeMap(uploadedImage.value, edgeCanvas.value)
      edgesReady.value = true
    } catch {
      edgesReady.value = false
    }
  }

  startScan()

  try {
    const done = await waitForGeneration()
    if (!done) return
    apiSettled.value = true
    finishAndRedirect()
  } catch (error) {
    apiFailed.value = true
    stopScan()
    errorMessage.value = apiErrorMessage(error, 'Generation failed')
    await fetchUser()
  }
})

onUnmounted(() => {
  stopScan()
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
          {{ errorMessage ? 'Scan interrupted' : `AI generating ${displayPercent}%` }}
        </p>
      </header>

      <div class="relative mx-auto mt-8 w-full max-w-[240px] sm:mt-10 sm:max-w-[280px]">
        <div class="scan-frame overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-1 shadow-lg">
          <div class="scan-grid relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
            <img
              :src="uploadedImage"
              alt="Scanning your space"
              class="absolute inset-0 h-full w-full object-cover opacity-35 saturate-50"
            />

            <div
              class="absolute inset-0 overflow-hidden"
              :style="{ clipPath: `inset(0 0 ${100 - beamProgress}% 0)` }"
            >
              <img
                :src="uploadedImage"
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
            :to="`/design?id=${generationId}`"
            class="btn-outline rounded-lg px-4 py-2 text-sm font-medium"
          >
            Choose style
          </NuxtLink>
          <NuxtLink to="/dashboard/new" class="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
            New photo
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
