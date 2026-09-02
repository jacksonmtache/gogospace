export function useCheckout() {
  async function startCheckout(planId: string, source: 'unlock' | 'settings') {
    const data = await $fetch<{ url: string }>('/api/stripe/checkout', {
      method: 'POST',
      credentials: 'include',
      body: { planId, source },
    })

    if (!data.url) {
      throw new Error('Checkout is unavailable')
    }

    await navigateTo(data.url, { external: true })
  }

  return { startCheckout }
}
