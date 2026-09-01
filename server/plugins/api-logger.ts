import { isTestEnv } from '~/utils/env'

function isApiPath(path: string) {
  return path === '/api' || path.startsWith('/api/')
}

export default defineNitroPlugin((nitroApp) => {
  if (!isTestEnv()) return

  nitroApp.hooks.hook('request', (event) => {
    if (!isApiPath(event.path)) return
    event.context.apiStartedAt = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    if (!isApiPath(event.path)) return

    const status = getResponseStatus(event)
    const startedAt = Number(event.context.apiStartedAt || 0)
    const durationMs = startedAt ? Date.now() - startedAt : undefined
    const line = `[api] ${event.method} ${event.path} ${status}${durationMs != null ? ` ${durationMs}ms` : ''}`

    if (status >= 400) {
      console.error(line)
    } else {
      console.log(line)
    }
  })

  nitroApp.hooks.hook('error', (error, { event }) => {
    if (!event?.path || !isApiPath(event.path)) return

    const err = error as { statusCode?: number; statusMessage?: string; message?: string; data?: unknown }
    console.error(`[api error] ${event.method} ${event.path}`, {
      statusCode: err.statusCode,
      statusMessage: err.statusMessage || err.message,
      data: err.data,
    })
  })
})
