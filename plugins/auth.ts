export default defineNuxtPlugin(async () => {
  const { ready, fetchUser } = useAuth()
  if (ready.value) return
  await fetchUser()
})
