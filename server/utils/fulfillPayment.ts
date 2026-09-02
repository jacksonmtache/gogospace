import type { H3Event } from 'h3'
import type { StripeCheckoutSession } from './stripe'
import type { PaymentStatus } from '../../types/payment'
import { formatUsd, getPlan, isPlanId } from '../../utils/plans'

interface PaymentRow {
  id: string
  stripe_checkout_session_id: string
  stripe_payment_intent_id: string | null
  email: string
  user_id: string | null
  plan_id: string
  credits: number
  amount_cents: number
  currency: string
  status: PaymentStatus
  credits_granted_at: string | null
  admin_notified_at: string | null
  customer_notified_at: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export interface FulfilledPayment {
  email: string
  planId: string
  planTitle: string
  credits: number
  amountCents: number
  status: PaymentStatus
  creditsGranted: boolean
  accountExists: boolean
}

async function loadPayment(sessionId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payments')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load payment' })
  }

  return (data as PaymentRow | null) || null
}

async function ensurePaymentRow(session: StripeCheckoutSession): Promise<PaymentRow> {
  const planId = String(session.metadata?.planId || '')
  const plan = getPlan(planId)
  if (!plan || !isPlanId(planId)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown payment plan' })
  }

  const email = getCheckoutEmail(session)
  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Checkout is missing a customer email' })
  }

  const userIdFromMeta = String(session.metadata?.userId || '').trim() || null
  const paymentIntentId = getPaymentIntentId(session)
  const receiptUrl = getReceiptUrl(session)
  const amountCents = session.amount_total ?? plan.amountCents
  const currency = (session.currency || 'usd').toLowerCase()

  const existing = await loadPayment(session.id)
  if (existing) {
    const patch: Record<string, string | null> = {}
    if (!existing.receipt_url && receiptUrl) patch.receipt_url = receiptUrl
    if (!existing.stripe_payment_intent_id && paymentIntentId) {
      patch.stripe_payment_intent_id = paymentIntentId
    }
    if (!existing.email && email) patch.email = email

    if (Object.keys(patch).length === 0) return existing

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('payments')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return existing
    return (data as PaymentRow) || existing
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payments')
    .insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      email,
      user_id: userIdFromMeta,
      plan_id: plan.id,
      credits: plan.credits,
      amount_cents: amountCents,
      currency,
      status: 'paid',
      receipt_url: receiptUrl,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      const raced = await loadPayment(session.id)
      if (raced) return raced
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to record payment' })
  }

  return data as PaymentRow
}

async function notifyCustomer(
  payment: PaymentRow,
  options: { accountExists: boolean; siteUrl: string },
) {
  if (payment.customer_notified_at) return

  const siteUrl = options.siteUrl.replace(/\/$/, '')
  if (!siteUrl) {
    console.error('NUXT_PUBLIC_SITE_URL is not set; skipping payment success email')
    return
  }

  const plan = getPlan(payment.plan_id)
  const sent = await sendPaymentSuccessCustomerEmail({
    to: payment.email,
    planTitle: plan?.title || payment.plan_id,
    credits: payment.credits,
    amountLabel: formatUsd(payment.amount_cents, payment.currency),
    accountExists: options.accountExists,
    claimUrl: `${siteUrl}/checkout/complete?session_id=${encodeURIComponent(payment.stripe_checkout_session_id)}`,
    loginUrl: `${siteUrl}/login?email=${encodeURIComponent(payment.email)}&paid=1`,
  })

  if (!sent) return

  const admin = createAdminClient()
  await admin
    .from('payments')
    .update({ customer_notified_at: new Date().toISOString() })
    .eq('id', payment.id)
    .is('customer_notified_at', null)
}

async function notifyAdmin(payment: PaymentRow) {
  if (payment.admin_notified_at) return

  const plan = getPlan(payment.plan_id)
  const sent = await sendPaymentSuccessAdminEmail({
    payerEmail: payment.email,
    planTitle: plan?.title || payment.plan_id,
    credits: payment.credits,
    amountLabel: formatUsd(payment.amount_cents, payment.currency),
  })

  if (!sent) return

  const admin = createAdminClient()
  await admin
    .from('payments')
    .update({ admin_notified_at: new Date().toISOString() })
    .eq('id', payment.id)
    .is('admin_notified_at', null)
}

async function toView(payment: PaymentRow, accountExists: boolean): Promise<FulfilledPayment> {
  const plan = getPlan(payment.plan_id)
  return {
    email: payment.email,
    planId: payment.plan_id,
    planTitle: plan?.title || payment.plan_id,
    credits: payment.credits,
    amountCents: payment.amount_cents,
    status: payment.status,
    creditsGranted: Boolean(payment.credits_granted_at),
    accountExists,
  }
}

export async function fulfillCheckoutSession(
  sessionId: string,
  event?: H3Event,
): Promise<FulfilledPayment> {
  const session = await retrievePaidCheckoutSession(sessionId)
  const payment = await ensurePaymentRow(session)
  const email = payment.email
  const userIdFromMeta = String(session.metadata?.userId || '').trim() || null
  const existingUserId = userIdFromMeta || (await findProfileIdByEmail(email))

  if (existingUserId && !payment.credits_granted_at) {
    try {
      await claimPaymentCredits(session.id, existingUserId)
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0
      if (statusCode !== 409) throw error
    }
  }

  const latest = (await loadPayment(session.id)) || payment
  const accountExists = Boolean(latest.user_id || existingUserId || (await findProfileIdByEmail(email)))
  const siteUrl = event
    ? getSiteUrl(event)
    : String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')

  await notifyCustomer(latest, { accountExists, siteUrl })
  await notifyAdmin(latest)

  return toView(latest, accountExists)
}
