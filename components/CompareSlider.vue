<script setup lang="ts">
const props = defineProps<{
  beforeSrc: string
  afterSrc: string
  beforeAlt?: string
  afterAlt?: string
}>()

const comparePosition = ref(50)
const compareContainer = ref<HTMLElement | null>(null)
const compareContainerWidth = ref(0)
let isDraggingCompare = false

function getPointerX(e: MouseEvent | TouchEvent) {
  if ('touches' in e && e.touches.length) return e.touches[0].clientX
  if ('changedTouches' in e && e.changedTouches.length) return e.changedTouches[0].clientX
  return (e as MouseEvent).clientX
}

function updateComparePosition(clientX: number) {
  if (!compareContainer.value) return
  const rect = compareContainer.value.getBoundingClientRect()
  const x = clientX - rect.left
  comparePosition.value = Math.min(100, Math.max(0, (x / rect.width) * 100))
}

function startDrag() {
  isDraggingCompare = true
}

function onComparePointerDown(e: MouseEvent | TouchEvent) {
  isDraggingCompare = true
  updateComparePosition(getPointerX(e))
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingCompare) return
  updateComparePosition(getPointerX(e))
}

function onPointerUp() {
  isDraggingCompare = false
}

function updateContainerWidth() {
  if (compareContainer.value) {
    compareContainerWidth.value = compareContainer.value.offsetWidth
  }
}

onMounted(() => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('touchend', onPointerUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onPointerUp)
})
</script>

<template>
  <div
    ref="compareContainer"
    class="compare-slider aspect-[4/3] bg-muted sm:aspect-[16/10]"
    @mousedown.prevent="onComparePointerDown"
    @touchstart.prevent="onComparePointerDown"
  >
    <img
      :src="props.afterSrc"
      :alt="props.afterAlt || 'AI designed room'"
      class="absolute inset-0 h-full w-full object-cover"
      draggable="false"
      @load="updateContainerWidth"
    />
    <div class="absolute inset-0 overflow-hidden" :style="{ width: comparePosition + '%' }">
      <img
        :src="props.beforeSrc"
        :alt="props.beforeAlt || 'Original room'"
        class="h-full object-cover"
        :style="{ width: compareContainerWidth + 'px', maxWidth: 'none' }"
        draggable="false"
        @load="updateContainerWidth"
      />
    </div>
    <div
      class="compare-handle"
      :style="{ left: comparePosition + '%' }"
      @mousedown.stop.prevent="startDrag"
      @touchstart.stop.prevent="startDrag"
    />
    <div
      class="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-base"
    >
      Original
    </div>
    <div
      class="pointer-events-none absolute bottom-2 right-2 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:right-4 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-base"
    >
      AI Design
    </div>
  </div>
</template>
