const USER_NOT_FOUND = /not (found|registered)|unable to find|user not found/i

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email ?? '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid email is required',
    })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) {
    if (!USER_NOT_FOUND.test(error.message)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to start password reset',
      })
    }
    return { ok: true }
  }

  const tokenHash = data?.properties?.hashed_token
  if (tokenHash) {
    const resetUrl = `${getSiteUrl(event)}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`
    await sendPasswordResetEmail(email, resetUrl)
  }

  return { ok: true }
})
