import { MIN_PASSWORD_LENGTH } from '../../../utils/password'
import type { AuthUser } from '../../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ sessionId?: string; password?: string }>(event)
  const sessionId = String(body?.sessionId ?? '').trim()
  const password = String(body?.password ?? '')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkout session',
    })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    })
  }

  const fulfilled = await fulfillCheckoutSession(sessionId)
  if (fulfilled.accountExists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An account already exists for this email. Please log in.',
    })
  }

  const email = fulfilled.email
  const admin = createAdminClient()
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (created.error || !created.data.user) {
    const alreadyExists =
      created.error?.status === 422 ||
      /already been registered|already exists/i.test(created.error?.message || '')

    if (alreadyExists) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An account already exists for this email. Please log in.',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to create account',
    })
  }

  const userId = created.data.user.id
  const { error: profileError } = await admin.from('profiles').upsert(
    { id: userId, email, credits: 0 },
    { onConflict: 'id' },
  )

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to create account profile',
    })
  }

  await claimPaymentCredits(sessionId, userId)

  const anon = createAnonClient()
  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signedIn.session || !signedIn.user) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Account created. Please log in to continue.',
    })
  }

  setSessionCookies(event, signedIn.session, false)
  const user: AuthUser = await loadAuthUser(signedIn.session.access_token, signedIn.user)
  return { user }
})
