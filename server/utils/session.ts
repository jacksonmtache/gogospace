import type { H3Event } from 'h3'
import type { Session } from '@supabase/supabase-js'

export const ACCESS_COOKIE = 'sb-access-token'
export const REFRESH_COOKIE = 'sb-refresh-token'
export const REMEMBER_COOKIE = 'sb-remember'

const THIRTY_DAYS = 60 * 60 * 24 * 30

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}

export function getAccessToken(event: H3Event) {
  return getCookie(event, ACCESS_COOKIE) || null
}

export function getRefreshToken(event: H3Event) {
  return getCookie(event, REFRESH_COOKIE) || null
}

export function isRememberMe(event: H3Event) {
  return getCookie(event, REMEMBER_COOKIE) === '1'
}

export function setSessionCookies(event: H3Event, session: Session, rememberMe = false) {
  const base = baseCookieOptions()
  const maxAge = rememberMe ? THIRTY_DAYS : undefined

  setCookie(event, ACCESS_COOKIE, session.access_token, { ...base, maxAge })
  setCookie(event, REFRESH_COOKIE, session.refresh_token, { ...base, maxAge })
  setCookie(event, REMEMBER_COOKIE, rememberMe ? '1' : '0', { ...base, maxAge })
}

export function clearSessionCookies(event: H3Event) {
  const opts = { path: '/' }
  deleteCookie(event, ACCESS_COOKIE, opts)
  deleteCookie(event, REFRESH_COOKIE, opts)
  deleteCookie(event, REMEMBER_COOKIE, opts)
}
