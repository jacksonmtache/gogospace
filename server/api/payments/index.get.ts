import type { PaymentRecord } from '../../types/payment'

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireUserSession(event)
  const client = createUserClient(accessToken)
  const { data, error } = await client
    .from('payments')
    .select(
      'id, stripe_checkout_session_id, email, plan_id, credits, amount_cents, currency, status, receipt_url, created_at',
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load payment history', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load payment history',
    })
  }

  const payments: PaymentRecord[] = (data || []).map((row) => ({
    id: row.id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    email: row.email,
    planId: row.plan_id,
    credits: row.credits,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    receiptUrl: row.receipt_url,
    createdAt: row.created_at,
  }))

  return { payments }
})
