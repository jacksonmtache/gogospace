import type { GenerationGenerateResponse } from '~/types/generation'
import { apiErrorMessage } from '~/utils/apiError'

type GenerationJobKind = 'generate' | 'refine'

interface GenerationJob {
  id: string
  kind: GenerationJobKind
  style: string
  previewUrl: string
  promise: Promise<GenerationGenerateResponse>
  result: GenerationGenerateResponse | null
  error: string | null
}

export function useGenerationJob() {
  const job = useState<GenerationJob | null>('generation:job', () => null)
  const { user, fetchUser } = useAuth()

  function attach(
    id: string,
    kind: GenerationJobKind,
    style: string,
    request: Promise<GenerationGenerateResponse>,
    previewUrl = '',
  ) {
    const promise = request
      .then(async (result) => {
        if (job.value?.id === id && job.value.kind === kind) {
          job.value.result = result
        }
        if (user.value) {
          user.value = { ...user.value, credits: result.credits }
        }
        await fetchUser()
        return result
      })
      .catch((error: unknown) => {
        if (job.value?.id === id && job.value.kind === kind) {
          job.value.error = apiErrorMessage(error, kind === 'refine' ? 'Refine failed' : 'Generation failed')
        }
        throw error
      })

    job.value = {
      id,
      kind,
      style,
      previewUrl,
      promise,
      result: null,
      error: null,
    }

    return promise
  }

  function start(id: string, style: string) {
    if (job.value?.id === id && job.value.kind === 'generate' && !job.value.error) {
      return job.value.promise
    }

    return attach(
      id,
      'generate',
      style,
      $fetch<GenerationGenerateResponse>(`/api/generations/${id}/generate`, {
        method: 'POST',
        body: { style },
      }),
    )
  }

  function startRefine(id: string, instruction: string, style = '', previewUrl = '') {
    return attach(
      id,
      'refine',
      style,
      $fetch<GenerationGenerateResponse>(`/api/generations/${id}/refine`, {
        method: 'POST',
        body: { instruction },
      }),
      previewUrl,
    )
  }

  return { job, start, startRefine }
}
