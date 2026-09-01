interface PreviewSession {
  imageDataUrl: string
  style: string
}

let clientSession: PreviewSession | null = null

export function usePreviewSession() {
  const session = ref<PreviewSession | null>(import.meta.client ? clientSession : null)
  const { user } = useAuth()

  const isPreview = computed(() => Boolean(session.value?.imageDataUrl) && !user.value)

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result)
          return
        }
        reject(new Error('Could not read that photo.'))
      }
      reader.onerror = () => reject(new Error('Could not read that photo.'))
      reader.readAsDataURL(file)
    })
  }

  async function begin(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      throw new Error(validationError)
    }

    const imageDataUrl = await readFileAsDataUrl(file)
    clientSession = {
      imageDataUrl,
      style: 'minimalist',
    }
    session.value = clientSession
  }

  function setStyle(style: string) {
    if (!clientSession) return
    clientSession = { ...clientSession, style }
    session.value = clientSession
  }

  function clear() {
    clientSession = null
    session.value = null
  }

  return {
    session,
    isPreview,
    begin,
    setStyle,
    clear,
  }
}
