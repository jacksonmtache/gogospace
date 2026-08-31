export default defineEventHandler(async (event) => {
  const accessToken = getAccessToken(event)
  clearSessionCookies(event)

  if (accessToken) {
    try {
      const client = createUserClient(accessToken)
      await Promise.race([
        client.auth.signOut().catch(() => {}),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ])
    } catch {
      // Cookies are already cleared.
    }
  }

  return { ok: true }
})
