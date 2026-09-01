import type { MaybeRefOrGetter, Ref } from 'vue'

const EDGE_THRESHOLD = 115
const EDGE_ALPHA = 70
const MAX_PROCESS_WIDTH = 400
const BEAM_DURATION = 4500
const LIVE_DURATION = 40_000
const PREVIEW_DURATION = 5_000
const POTENTIAL_DURATION = 700
const TICK_MS = 30

export const SCAN_REDIRECT_DELAY = 400

export type SpaceScanMode = 'live' | 'preview'

interface SpaceScanAnimationOptions {
  mode: MaybeRefOrGetter<SpaceScanMode>
  failed: Ref<boolean>
  settled: Ref<boolean>
  onComplete: () => void
}

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

export function useSpaceScanAnimation(options: SpaceScanAnimationOptions) {
  const beamProgress = ref(0)
  const generatePercent = ref(0)
  const edgeCanvas = ref<HTMLCanvasElement | null>(null)
  const edgesReady = ref(false)
  const potential = ref(0)
  const potentialTarget = Math.floor(Math.random() * 11) + 90
  const liveHoldAt = 95 + Math.floor(Math.random() * 4)
  const displayPercent = computed(() => Math.round(generatePercent.value))

  const isPreview = computed(() => toValue(options.mode) === 'preview')
  const holdAt = computed(() => (isPreview.value ? 100 : liveHoldAt))
  const duration = computed(() => (isPreview.value ? PREVIEW_DURATION : LIVE_DURATION))

  let beamTimer: ReturnType<typeof setInterval> | null = null
  let generateTimer: ReturnType<typeof setInterval> | null = null
  let potentialTimer: ReturnType<typeof setInterval> | null = null
  let finished = false

  function stop() {
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

  function finish() {
    if (finished || options.failed.value) return
    finished = true
    stop()
    generatePercent.value = 100
    options.onComplete()
  }

  function start() {
    const interval = TICK_MS
    const beamStep = (100 / BEAM_DURATION) * interval
    const generateStep = (holdAt.value / duration.value) * interval

    beamTimer = setInterval(() => {
      if (options.failed.value) return
      beamProgress.value += beamStep
      if (beamProgress.value >= 100) beamProgress.value = 0
    }, interval)

    generateTimer = setInterval(() => {
      if (options.failed.value) {
        stop()
        return
      }

      if (generatePercent.value < holdAt.value) {
        generatePercent.value = Math.min(holdAt.value, generatePercent.value + generateStep)
      }

      if (isPreview.value) {
        if (generatePercent.value >= holdAt.value) finish()
      } else if (options.settled.value) {
        finish()
      }
    }, interval)

    if (potentialTarget > 0) {
      const potentialStep = (potentialTarget / POTENTIAL_DURATION) * interval
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

  async function prepareEdges(imageSrc: string) {
    if (!edgeCanvas.value || !imageSrc) return
    try {
      await buildEdgeMap(imageSrc, edgeCanvas.value)
      edgesReady.value = true
    } catch {
      edgesReady.value = false
    }
  }

  onUnmounted(stop)

  return {
    beamProgress,
    generatePercent,
    displayPercent,
    edgeCanvas,
    edgesReady,
    potential,
    start,
    stop,
    finish,
    prepareEdges,
  }
}
