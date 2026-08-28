const uploadTrigger = ref<(() => void) | null>(null)

export function useUploadTrigger() {
  function registerUploadTrigger(fn: () => void) {
    uploadTrigger.value = fn
  }

  function unregisterUploadTrigger() {
    uploadTrigger.value = null
  }

  function triggerUpload() {
    if (uploadTrigger.value) {
      uploadTrigger.value()
      return
    }

    const router = useRouter()
    router.push({ path: '/', hash: '#hero' })
  }

  return {
    registerUploadTrigger,
    unregisterUploadTrigger,
    triggerUpload,
  }
}
