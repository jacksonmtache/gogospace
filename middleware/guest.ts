export default defineNuxtRouteMiddleware(async () => {
  const { user, ready, fetchUser } = useAuth()
  if (!ready.value) await fetchUser()
  if (user.value) {
    return navigateTo('/dashboard')
  }
})
