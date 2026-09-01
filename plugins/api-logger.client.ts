import type { $Fetch, FetchRequest } from 'ofetch'
import { isTestEnv } from '~/utils/env'

function requestUrl(request: FetchRequest) {
  if (typeof request === 'string') return request
  if (request instanceof URL) return request.href
  if (request instanceof Request) return request.url
  return String(request)
}

function isBackendApiRequest(request: FetchRequest) {
  const url = requestUrl(request)
  if (url.startsWith('/api/') || url === '/api') return true
  try {
    return new URL(url, window.location.origin).pathname.startsWith('/api/')
  } catch {
    return url.includes('/api/')
  }
}

export default defineNuxtPlugin({
  enforce: 'pre',
  setup() {
    if (!isTestEnv()) return

    const original = globalThis.$fetch
    const wrapped = ((request: FetchRequest, options?: Parameters<$Fetch>[1]) => {
      if (!isBackendApiRequest(request)) {
        return original(request, options as never)
      }

      const method = String(options?.method || (request instanceof Request ? request.method : 'GET')).toUpperCase()
      const url = requestUrl(request)
      console.log('[api]', method, url)

      return original(request, options as never).catch((error: unknown) => {
        const err = error as {
          status?: number
          statusCode?: number
          data?: unknown
          statusMessage?: string
          message?: string
        }
        console.error('[api error]', method, url, {
          status: err.status || err.statusCode,
          statusMessage: err.statusMessage || err.message,
          data: err.data,
        })
        throw error
      })
    }) as typeof original

    globalThis.$fetch = Object.assign(wrapped, original)
  },
})
