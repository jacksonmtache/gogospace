import type { Generation, GenerationStatus, GenerationVersion } from '~/types/generation'

export const DESIGNS_BUCKET = 'designs'
export const SIGNED_URL_TTL_SECONDS = 60 * 60

export interface ResultHistoryItem {
  path: string
  instruction: string | null
  created_at: string
}

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

export function resultObjectPath(userId: string, generationId: string, ext: string, suffix = '') {
  const name = suffix ? `result-${suffix}` : 'result'
  return `${userId}/${generationId}/${name}.${ext}`
}

export function resultSortKey(path: string) {
  const name = path.split('/').pop() || ''
  const stamped = name.match(/^result-(\d+)\./)
  if (stamped) return Number(stamped[1])
  return 0
}

export function makeHistoryItem(
  path: string,
  instruction: string | null = null,
  createdAt = new Date().toISOString(),
): ResultHistoryItem {
  return { path, instruction, created_at: createdAt }
}

function sortHistory(items: ResultHistoryItem[]) {
  return [...items].sort((a, b) => {
    const key = resultSortKey(a.path) - resultSortKey(b.path)
    if (key !== 0) return key
    return a.created_at.localeCompare(b.created_at)
  })
}

export async function listStoredResultPaths(userId: string, generationId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(DESIGNS_BUCKET).list(`${userId}/${generationId}`, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load design history' })
  }

  return (data ?? []).flatMap((file) => {
    if (!/^result(?:-|\.)/.test(file.name)) return []
    const timestamp = file.name.match(/^result-(\d+)\./)?.[1]
    return [
      {
        path: `${userId}/${generationId}/${file.name}`,
        created_at: timestamp
          ? new Date(Number(timestamp)).toISOString()
          : file.created_at || file.updated_at || new Date(0).toISOString(),
      },
    ]
  })
}

export function mergeResultHistory(row: GenerationRow, stored: { path: string; created_at: string }[] = []) {
  const byPath = new Map<string, ResultHistoryItem>()

  for (const file of stored) {
    byPath.set(file.path, makeHistoryItem(file.path, null, file.created_at))
  }

  if (row.result_path && !byPath.has(row.result_path)) {
    byPath.set(row.result_path, makeHistoryItem(row.result_path, null, row.updated_at || row.created_at))
  }

  return sortHistory([...byPath.values()])
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

async function createSignedUrls(paths: string[]) {
  if (!paths.length) return new Map<string, string>()

  const unique = [...new Set(paths)]
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(DESIGNS_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create image URL' })
  }

  const urls = new Map<string, string>()
  for (let i = 0; i < unique.length; i++) {
    const item = data[i]
    const url = item?.signedUrl
    if (url && !item.error) {
      urls.set(unique[i], url)
      if (item.path) urls.set(item.path, url)
    }
  }
  return urls
}

export async function toGeneration(
  row: GenerationRow,
  accessToken: string,
  options: { includeResult?: boolean; includeVersions?: boolean } = {},
): Promise<Generation> {
  const includeResult = options.includeResult ?? row.status === 'completed'
  const includeVersions = options.includeVersions ?? false

  let history: ResultHistoryItem[] = []
  if (includeVersions) {
    const stored = await listStoredResultPaths(row.user_id, row.id)
    history = mergeResultHistory(row, stored)
  } else if (includeResult && row.result_path) {
    history = [makeHistoryItem(row.result_path, null, row.updated_at || row.created_at)]
  }

  const resultPath = row.result_path || history.at(-1)?.path || null
  const pathsToSign = [
    row.original_path,
    ...(includeResult && resultPath ? [resultPath] : []),
    ...(includeVersions ? history.map((item) => item.path) : []),
  ]

  const signed = await createSignedUrls(pathsToSign)
  async function urlFor(path: string | null) {
    if (!path) return null
    return signed.get(path) || (await createSignedUrl(accessToken, path))
  }

  const originalUrl = await urlFor(row.original_path)
  const resultUrl = includeResult ? await urlFor(resultPath) : null

  const versions: GenerationVersion[] = []
  if (includeVersions) {
    for (const item of history) {
      const url = await urlFor(item.path)
      if (!url) continue
      versions.push({
        path: item.path,
        url,
        instruction: item.instruction,
        createdAt: item.created_at,
      })
    }
  } else if (resultUrl && resultPath) {
    versions.push({
      path: resultPath,
      url: resultUrl,
      instruction: null,
      createdAt: row.updated_at || row.created_at,
    })
  }

  return {
    id: row.id,
    style: row.style,
    aspectRatio: row.aspect_ratio,
    status: row.status,
    originalUrl,
    resultUrl,
    versions,
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
