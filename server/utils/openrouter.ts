import { buildStylePrompt, getDesignStyle } from '~/utils/designStyles'
import { isTestEnv } from '~/utils/env'
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

export async function generateImageFromReference(options: {
  prompt: string
  aspectRatio: GrokAspectRatio
  referenceBytes: Buffer
  referenceMime: string
}) {
  const config = useRuntimeConfig()
  const apiKey = String(config.openrouterApiKey || '')
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenRouter is not configured. Set NUXT_OPENROUTER_API_KEY.',
    })
  }

  const dataUrl = `data:${options.referenceMime};base64,${options.referenceBytes.toString('base64')}`

  const payload = {
    model: OPENROUTER_MODEL,
    prompt: options.prompt,
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

  if (isTestEnv()) {
    console.log('[api] OpenRouter POST', OPENROUTER_IMAGES_URL, {
      model: payload.model,
      prompt: payload.prompt,
      aspect_ratio: payload.aspect_ratio,
      resolution: payload.resolution,
      hasReference: Boolean(payload.input_references?.length),
    })
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
    if (isTestEnv()) {
      console.error('[api error] OpenRouter', {
        status: response.status,
        error: result.error,
        retryingWithoutResolution: true,
      })
    }
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
    if (isTestEnv()) {
      console.error('[api error] OpenRouter', {
        status: response.status,
        error: result.error,
        message,
      })
    }
    throw createError({ statusCode: 502, statusMessage: message })
  }

  if (isTestEnv()) {
    console.log('[api] OpenRouter response', {
      status: response.status,
      hasImage: Boolean(result.data?.[0]?.b64_json),
      mediaType: result.data?.[0]?.media_type || null,
    })
  }

  const image = result.data?.[0]
  if (!image?.b64_json) {
    if (isTestEnv()) {
      console.error('[api error] OpenRouter returned no image', {
        status: response.status,
        error: result.error,
      })
    }
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

export async function generateStyledImage(options: {
  styleId: string
  aspectRatio: GrokAspectRatio
  originalBytes: Buffer
  originalMime: string
}) {
  return generateImageFromReference({
    prompt: buildStylePrompt(options.styleId),
    aspectRatio: options.aspectRatio,
    referenceBytes: options.originalBytes,
    referenceMime: options.originalMime,
  })
}

export function buildRefinePrompt(instruction: string, styleId: string | null) {
  const style = styleId ? getDesignStyle(styleId) : null
  const styleHint = style ? ` Keep the ${style.name} interior style.` : ''

  return [
    'Photorealistic edit of this interior photograph.',
    `Apply this change: ${instruction}`,
    styleHint.trim(),
    'Keep the same room layout, camera angle, architecture, and proportions.',
    'Do not change the structure of the space.',
    'High-end architectural photography, realistic materials and lighting.',
  ]
    .filter(Boolean)
    .join(' ')
}
