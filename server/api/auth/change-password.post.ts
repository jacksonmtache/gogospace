import { MIN_PASSWORD_LENGTH } from '../../../utils/password'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody<{ currentPassword?: string; password?: string }>(event)
  const currentPassword = String(body?.currentPassword ?? '')
  const password = String(body?.password ?? '')

  if (!currentPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is required',
    })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    })
  }

  if (password === currentPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from your current password',
    })
  }

  const email = session.authUser.email
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unable to update password',
    })
  }

  const anon = createAnonClient()
  const { error: verifyError } = await anon.auth.signInWithPassword({
    email,
    password: currentPassword,
  })

  if (verifyError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is incorrect',
    })
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin.auth.admin.updateUserById(session.authUser.id, {
    password,
  })

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to update password',
    })
  }

  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInError && signedIn.session) {
    setSessionCookies(event, signedIn.session, isRememberMe(event))
  }

  return { ok: true }
})
