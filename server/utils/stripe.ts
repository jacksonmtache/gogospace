import Stripe from 'stripe'

export interface StripeCheckoutSession {
  id: string
  object?: string
  payment_status: string | null
  customer_email?: string | null
  customer_details?: { email?: string | null } | null
  payment_intent?: string | StripePaymentIntent | null
  metadata?: Record<string, string> | null
  amount_total?: number | null
  currency?: string | null
}

interface StripePaymentIntent {
  id: string
  latest_charge?: string | { receipt_url?: string | null } | null
}

export function getStripe() {
  const secretKey = String(useRuntimeConfig().stripeSecretKey || '')
  if (!secretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe is not configured. Set NUXT_STRIPE_SECRET_KEY.',
    })
  }
  return new Stripe(secretKey)
}

export function getStripeWebhookSecret() {
  const secret = String(useRuntimeConfig().stripeWebhookSecret || '')
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe webhook secret is not configured. Set NUXT_STRIPE_WEBHOOK_SECRET.',
    })
  }
  return secret
}

export function getCheckoutEmail(session: StripeCheckoutSession) {
  return String(session.customer_details?.email || session.customer_email || '')
    .trim()
    .toLowerCase()
}

export function getPaymentIntentId(session: StripeCheckoutSession) {
  const intent = session.payment_intent
  if (!intent) return null
  return typeof intent === 'string' ? intent : intent.id
}

export function getReceiptUrl(session: StripeCheckoutSession) {
  const intent = session.payment_intent
  if (!intent || typeof intent === 'string') return null
  const charge = intent.latest_charge
  if (!charge || typeof charge === 'string') return null
  return charge.receipt_url || null
}

export async function retrievePaidCheckoutSession(sessionId: string) {
  const stripe = getStripe()
  const session = (await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.latest_charge'],
  })) as StripeCheckoutSession

  if (session.payment_status !== 'paid') {
    throw createError({
      statusCode: 400,
      statusMessage: 'This checkout session is not paid',
    })
  }

  return session
}
