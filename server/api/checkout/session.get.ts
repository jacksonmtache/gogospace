import type { CheckoutSessionView } from '../../../types/payment'

export default defineEventHandler(async (event) => {
  const sessionId = String(getQuery(event).session_id || '').trim()
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkout session',
    })
  }

  const fulfilled = await fulfillCheckoutSession(sessionId, event)
  const view: CheckoutSessionView = {
    email: fulfilled.email,
    credits: fulfilled.credits,
    planId: fulfilled.planId,
    planTitle: fulfilled.planTitle,
    amountCents: fulfilled.amountCents,
    accountExists: fulfilled.accountExists,
    status: fulfilled.status,
    creditsGranted: fulfilled.creditsGranted,
  }

  return view
})
