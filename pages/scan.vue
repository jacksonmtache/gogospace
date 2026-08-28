<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Space Scan — GoGoSpace',
})

const EDGE_THRESHOLD = 115
const EDGE_ALPHA = 70
const MAX_PROCESS_WIDTH = 400
const SCAN_DURATION = 4500
const SCAN_REDIRECT_DELAY = 600

const router = useRouter()

// Layout placeholder — replace with uploaded image from route/state later
const uploadedImage = '/images/original.avif'

const scanProgress = ref(0)
const edgeCanvas = ref<HTMLCanvasElement | null>(null)
const edgesReady = ref(false)

const potentialTarget = Math.floor(Math.random() * 11) + 90
const potential = computed(() =>
  Math.round(90 + (scanProgress.value / 100) * (potentialTarget - 90)),
)

let scanTimer: ReturnType<typeof setInterval> | null = null

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
      const { data } = ctx.getImageData(0, 0, width, height)

      const gray = new Float32Array(width * height)
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4
        gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
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

function startScan() {
  const interval = 30
  const step = (100 / SCAN_DURATION) * interval

  scanTimer = setInterval(() => {
    scanProgress.value = Math.min(100, scanProgress.value + step)
    if (scanProgress.value >= 100 && scanTimer) {
      clearInterval(scanTimer)
      scanTimer = null
      setTimeout(() => router.push('/unlock'), SCAN_REDIRECT_DELAY)
    }
  }, interval)
}

onMounted(async () => {
  if (edgeCanvas.value) {
    try {
      await buildEdgeMap(uploadedImage, edgeCanvas.value)
      edgesReady.value = true
    } catch {
      edgesReady.value = false
    }
  }
  startScan()
})

onUnmounted(() => {
  if (scanTimer) clearInterval(scanTimer)
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
          Assessing design potential...
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
              :style="{ clipPath: `inset(0 0 ${100 - scanProgress}% 0)` }"
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
              :style="{ top: `${scanProgress}%` }"
            />
          </div>
        </div>
      </div>

      <div class="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:mt-10">
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
            <p class="mt-1 text-2xl font-bold text-primary sm:text-3xl">{{ potential }}</p>
          </div>
        </div>

        <div class="h-1.5 bg-muted">
          <div
            class="h-full bg-primary transition-[width] duration-150 ease-linear"
            :style="{ width: `${scanProgress}%` }"
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
