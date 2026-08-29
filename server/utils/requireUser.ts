import type { H3Event } from 'h3'
import type { User } from '@supabase/supabase-js'
import type { AuthUser } from '../../types/auth'

interface ResolvedSession {
  user: User
  accessToken: string
}

export async function resolveSession(event: H3Event): Promise<ResolvedSession | null> {
  const accessToken = getAccessToken(event)
  const refreshToken = getRefreshToken(event)
  const rememberMe = isRememberMe(event)
  const anon = createAnonClient()

  if (accessToken) {
    const { data, error } = await anon.auth.getUser(accessToken)
    if (data.user && !error) {
      return { user: data.user, accessToken }
    }
  }

  if (refreshToken) {
    const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken })
    if (data.session && data.user && !error) {
      setSessionCookies(event, data.session, rememberMe)
      return { user: data.user, accessToken: data.session.access_token }
    }
  }

  return null
}

export async function loadAuthUser(accessToken: string, user: User): Promise<AuthUser> {
  const client = createUserClient(accessToken)
  const { data, error } = await client
    .from('profiles')
    .select('credits, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load profile' })
  }

  if (data) {
    return {
      id: user.id,
      email: data.email,
      credits: data.credits,
    }
  }

  const admin = createAdminClient()
  const email = user.email ?? ''
  const { data: created, error: insertError } = await admin
    .from('profiles')
    .insert({ id: user.id, email, credits: 0 })
    .select('credits, email')
    .single()

  if (insertError || !created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create profile' })
  }

  return {
    id: user.id,
    email: created.email,
    credits: created.credits,
  }
}

export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return null
  const session = await resolveSession(event)
  if (!session) return null
  return loadAuthUser(session.accessToken, session.user)
}

export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export async function requireUserSession(event: H3Event) {
  if (!isSupabaseConfigured()) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase is not configured' })
  }

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const authUser = await loadAuthUser(session.accessToken, session.user)
  return { ...session, authUser }
}
