import { getPlan } from '../../../utils/plans'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ planId?: string; source?: string }>(event)
  const plan = getPlan(String(body?.planId || ''))

  if (!plan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please choose a valid plan',
    })
  }

  const user = await getAuthUser(event)
  const source = body?.source === 'settings' ? 'settings' : 'unlock'
  const siteUrl = getSiteUrl(event)

  const successUrl = user
    ? `${siteUrl}/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    : `${siteUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`

  const cancelUrl =
    user && source === 'settings'
      ? `${siteUrl}/dashboard/settings?edit=credits`
      : `${siteUrl}/unlock`

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    ...(user
      ? {
          customer_email: user.email,
          client_reference_id: user.id,
        }
      : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: plan.amountCents,
          product_data: {
            name: `GoGoSpace — ${plan.title}`,
            description: plan.description,
          },
        },
      },
    ],
    metadata: {
      planId: plan.id,
      credits: String(plan.credits),
      ...(user ? { userId: user.id } : {}),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to start Stripe checkout',
    })
  }

  return { url: session.url }
})
