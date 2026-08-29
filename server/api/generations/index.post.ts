import { randomUUID } from 'node:crypto'
import { imageSize } from 'image-size'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  extensionForImageType,
  isAllowedImageType,
} from '~/utils/imageUpload'
import type { GenerationUploadResponse } from '~/types/generation'
import type { GenerationRow } from '../../utils/designs'

export default defineEventHandler(async (event): Promise<GenerationUploadResponse> => {
  const { accessToken, authUser } = await requireUserSession(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'image' && part.data && part.filename)

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'An image file is required' })
  }

  const contentType = (file.type || '').toLowerCase()
  if (!isAllowedImageType(contentType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported image type. Use ${ALLOWED_IMAGE_TYPES.join(', ')}.`,
    })
  }

  if (file.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 8 MB or smaller.' })
  }

  let width = 0
  let height = 0
  try {
    const size = imageSize(new Uint8Array(file.data))
    width = size.width || 0
    height = size.height || 0
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Could not read image dimensions' })
  }

  if (!width || !height) {
    throw createError({ statusCode: 400, statusMessage: 'Could not read image dimensions' })
  }

  const aspectRatio = closestGrokAspectRatio(width, height)
  const generationId = randomUUID()
  const ext = extensionForImageType(contentType)
  const originalPath = originalObjectPath(authUser.id, generationId, ext)

  await uploadDesignObject(accessToken, originalPath, Buffer.from(file.data), contentType)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('generations')
    .insert({
      id: generationId,
      user_id: authUser.id,
      aspect_ratio: aspectRatio,
      original_path: originalPath,
      status: 'uploaded',
    })
    .select(GENERATION_COLUMNS)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save generation' })
  }

  const generation = await toGeneration(data as GenerationRow, accessToken)

  return {
    generation,
    credits: authUser.credits,
  }
})
