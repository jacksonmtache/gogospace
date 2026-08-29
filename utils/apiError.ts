export function apiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (!error || typeof error !== 'object') return fallback

  const err = error as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }

  return err.data?.statusMessage || err.data?.message || err.statusMessage || err.message || fallback
}

export function apiStatusCode(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const err = error as { statusCode?: number; status?: number; data?: { statusCode?: number } }
  return err.statusCode || err.status || err.data?.statusCode || null
}
