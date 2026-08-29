export default defineEventHandler(async (event) => {
  const accessToken = getAccessToken(event)

  if (accessToken) {
    const client = createUserClient(accessToken)
    await client.auth.signOut().catch(() => {})
  }

  clearSessionCookies(event)
  return { ok: true }
})
