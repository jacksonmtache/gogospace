import type { AuthUser } from '~/types/auth'

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)

  async function fetchUser() {
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ user: AuthUser }>('/api/auth/me', {
        credentials: 'include',
      })
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
      credentials: 'include',
      body: { email, password, rememberMe },
    })
    user.value = data.user
    ready.value = true
    return data.user
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      user.value = null
      ready.value = true
    }
  }

  async function requestPasswordReset(email: string) {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async function resetPassword(tokenHash: string, password: string) {
    const data = await $fetch<{ user: AuthUser | null; loggedIn: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      credentials: 'include',
      body: { tokenHash, password },
    })
    if (data.user) {
      user.value = data.user
      ready.value = true
    }
    return data
  }

  async function changePassword(currentPassword: string, password: string) {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'include',
      body: { currentPassword, password },
    })
  }

  async function registerFromCheckout(sessionId: string, password: string) {
    const data = await $fetch<{ user: AuthUser }>('/api/auth/register-from-checkout', {
      method: 'POST',
      credentials: 'include',
      body: { sessionId, password },
    })
    user.value = data.user
    ready.value = true
    return data.user
  }

  return {
    user,
    ready,
    fetchUser,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    registerFromCheckout,
  }
}
