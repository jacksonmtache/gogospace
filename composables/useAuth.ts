import type { AuthUser } from '~/types/auth'

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)

  async function fetchUser() {
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ user: AuthUser }>('/api/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
    return user.value
  }

  async function login(email: string, password: string, rememberMe = false) {
    const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password, rememberMe },
    })
    user.value = data.user
    ready.value = true
    return data.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    ready.value = true
  }

  return { user, ready, fetchUser, login, logout }
}
