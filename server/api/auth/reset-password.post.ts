import { MIN_PASSWORD_LENGTH } from '../../../utils/password'
import type { AuthUser } from '../../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ tokenHash?: string; password?: string }>(event)
  const tokenHash = String(body?.tokenHash ?? '').trim()
  const password = String(body?.password ?? '')

  if (!tokenHash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This reset link is invalid or has expired',
    })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    })
  }

  const anon = createAnonClient()
  const { data, error } = await anon.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  })

  if (error || !data.user?.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This reset link is invalid or has expired',
    })
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
    password,
  })

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to update password',
    })
  }

  const email = data.user.email
  if (email) {
    const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError && signedIn.session && signedIn.user) {
      setSessionCookies(event, signedIn.session, false)
      const user: AuthUser = await loadAuthUser(signedIn.session.access_token, signedIn.user)
      return { user, loggedIn: true }
    }
  }

  return { user: null, loggedIn: false }
})
