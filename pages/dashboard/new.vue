<script setup lang="ts">
import type { GenerationUploadResponse } from '~/types/generation'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'New Project — GoGoSpace',
})

const { user } = useAuth()
const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const errorMessage = ref('')

const accept = 'image/jpeg,image/png,image/webp'

function openPicker() {
  if (uploading.value) return
  fileInput.value?.click()
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (!uploading.value) dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await uploadFile(file)
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await uploadFile(file)
}

async function uploadFile(file: File) {
  const validationError = validateImageFile(file)
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  uploading.value = true
  errorMessage.value = ''

  try {
    const form = new FormData()
    form.append('image', file)
    const data = await $fetch<GenerationUploadResponse>('/api/generations', {
      method: 'POST',
      body: form,
    })
    await navigateTo(`/design?id=${data.generation.id}`)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Could not upload that photo. Try again.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">New Project</h1>
      <p class="mt-1 text-base text-muted-foreground sm:text-lg">
        Upload a photo of your space to start a new design.
      </p>
    </header>

    <p v-if="(user?.credits ?? 0) < 1" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:text-base">
      You need 1 credit to generate a design.
      <NuxtLink to="/dashboard/settings" class="font-medium underline underline-offset-2">Buy credits</NuxtLink>
    </p>

    <button
      type="button"
      class="mt-8 w-full rounded-2xl border-2 border-dashed bg-card p-8 text-center transition-colors sm:mt-10 sm:p-12"
      :class="
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40'
      "
      :disabled="uploading"
      @click="openPicker"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <p class="mt-4 text-base font-medium text-foreground sm:text-lg">
        {{ uploading ? 'Uploading…' : 'Drop your room photo here' }}
      </p>
      <p class="mt-1 text-sm text-muted-foreground sm:text-base">
        JPEG, PNG, or WebP · up to 8 MB
      </p>
      <span
        class="btn-primary mt-6 inline-flex rounded-lg px-6 py-3 text-base font-medium"
        :class="{ 'pointer-events-none opacity-70': uploading }"
      >
        {{ uploading ? 'Uploading…' : 'Upload photo' }}
      </span>
    </button>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onFileChange"
    />

    <p v-if="errorMessage" class="mt-4 text-center text-sm text-red-600 sm:text-base">
      {{ errorMessage }}
    </p>
  </div>
</template>
