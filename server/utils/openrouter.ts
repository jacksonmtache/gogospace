import { buildStylePrompt } from '~/utils/designStyles'
import type { GrokAspectRatio } from './aspectRatio'

const OPENROUTER_IMAGES_URL = 'https://openrouter.ai/api/v1/images'
const OPENROUTER_MODEL = 'x-ai/grok-imagine-image-2.0'
const OPENROUTER_TIMEOUT_MS = 120_000

interface OpenRouterImageItem {
  b64_json?: string
  media_type?: string
}

interface OpenRouterImageResponse {
  data?: OpenRouterImageItem[]
  error?: { message?: string }
}

function mimeToExt(mediaType: string) {
  if (mediaType === 'image/jpeg') return 'jpg'
  if (mediaType === 'image/webp') return 'webp'
  return 'png'
}

export async function generateStyledImage(options: {
  styleId: string
  aspectRatio: GrokAspectRatio
  originalBytes: Buffer
  originalMime: string
}) {
  const config = useRuntimeConfig()
  const apiKey = String(config.openrouterApiKey || '')
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenRouter is not configured. Set NUXT_OPENROUTER_API_KEY.',
    })
  }

  const dataUrl = `data:${options.originalMime};base64,${options.originalBytes.toString('base64')}`

  const payload = {
    model: OPENROUTER_MODEL,
    prompt: buildStylePrompt(options.styleId),
    n: 1,
    aspect_ratio: options.aspectRatio,
    resolution: '2K',
    input_references: [
      {
        type: 'image_url',
        image_url: { url: dataUrl },
      },
    ],
  }

  let response = await fetch(OPENROUTER_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
  })

  let result = (await response.json()) as OpenRouterImageResponse

  if (!response.ok && response.status === 400 && payload.resolution) {
    delete (payload as { resolution?: string }).resolution
    response = await fetch(OPENROUTER_IMAGES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    })
    result = (await response.json()) as OpenRouterImageResponse
  }

  if (!response.ok) {
    const message = result.error?.message || `OpenRouter request failed (${response.status})`
    throw createError({ statusCode: 502, statusMessage: message })
  }

  const image = result.data?.[0]
  if (!image?.b64_json) {
    throw createError({ statusCode: 502, statusMessage: 'OpenRouter returned no image' })
  }

  const mediaType = image.media_type || 'image/png'
  const bytes = Buffer.from(image.b64_json, 'base64')

  return {
    bytes,
    contentType: mediaType,
    ext: mimeToExt(mediaType),
  }
}
