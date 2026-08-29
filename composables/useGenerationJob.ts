import type { GenerationGenerateResponse } from '~/types/generation'
import { apiErrorMessage } from '~/utils/apiError'

interface GenerationJob {
  id: string
  style: string
  promise: Promise<GenerationGenerateResponse>
  result: GenerationGenerateResponse | null
  error: string | null
}

export function useGenerationJob() {
  const job = useState<GenerationJob | null>('generation:job', () => null)
  const { user, fetchUser } = useAuth()

  function start(id: string, style: string) {
    if (job.value?.id === id && !job.value.error) {
      return job.value.promise
    }

    const promise = $fetch<GenerationGenerateResponse>(`/api/generations/${id}/generate`, {
      method: 'POST',
      body: { style },
    })
      .then(async (result) => {
        if (job.value?.id === id) {
          job.value.result = result
        }
        if (user.value) {
          user.value = { ...user.value, credits: result.credits }
        }
        await fetchUser()
        return result
      })
      .catch((error: unknown) => {
        if (job.value?.id === id) {
          job.value.error = apiErrorMessage(error, 'Generation failed')
        }
        throw error
      })

    job.value = {
      id,
      style,
      promise,
      result: null,
      error: null,
    }

    return promise
  }

  return { job, start }
}
