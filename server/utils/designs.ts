import type { Generation, GenerationStatus } from '~/types/generation'

export const DESIGNS_BUCKET = 'designs'
export const SIGNED_URL_TTL_SECONDS = 60 * 60

export interface GenerationRow {
  id: string
  user_id: string
  style: string | null
  aspect_ratio: string
  original_path: string
  result_path: string | null
  status: GenerationStatus
  error: string | null
  created_at: string
  updated_at: string
}

export function originalObjectPath(userId: string, generationId: string, ext: string) {
  return `${userId}/${generationId}/original.${ext}`
}

export function resultObjectPath(userId: string, generationId: string, ext: string) {
  return `${userId}/${generationId}/result.${ext}`
}

export async function createSignedUrl(_accessToken: string, path: string | null) {
  if (!path) return null

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(DESIGNS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create image URL' })
  }

  return data.signedUrl
}

export async function toGeneration(
  row: GenerationRow,
  accessToken: string,
  options: { includeResult?: boolean } = {},
): Promise<Generation> {
  const includeResult = options.includeResult ?? row.status === 'completed'
  const [originalUrl, resultUrl] = await Promise.all([
    createSignedUrl(accessToken, row.original_path),
    includeResult ? createSignedUrl(accessToken, row.result_path) : Promise.resolve(null),
  ])

  return {
    id: row.id,
    style: row.style,
    aspectRatio: row.aspect_ratio,
    status: row.status,
    originalUrl,
    resultUrl,
    error: row.error,
    createdAt: row.created_at,
  }
}

export async function uploadDesignObject(
  _accessToken: string,
  path: string,
  body: Buffer,
  contentType: string,
) {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(DESIGNS_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  })
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store image' })
  }
}

export async function downloadDesignObject(_accessToken: string, path: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(DESIGNS_BUCKET).download(path)
  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load original image' })
  }
  return data
}

export const GENERATION_COLUMNS =
  'id, user_id, style, aspect_ratio, original_path, result_path, status, error, created_at, updated_at'
