export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'stripe-signature')
  const rawBody = await readRawBody(event)

  if (!signature || !rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe webhook payload',
    })
  }

  let stripeEvent
  try {
    stripeEvent = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    )
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Stripe signature',
    })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as { id?: string; payment_status?: string | null }
    if (session.id && session.payment_status === 'paid') {
      await fulfillCheckoutSession(session.id)
    }
  }

  return { received: true }
})
