import type { PlanId } from '../utils/plans'

export type PaymentStatus = 'pending' | 'paid' | 'credited' | 'failed'

export interface PaymentRecord {
  id: string
  stripeCheckoutSessionId: string
  email: string
  planId: string
  credits: number
  amountCents: number
  currency: string
  status: PaymentStatus
  receiptUrl: string | null
  createdAt: string
}

export interface CheckoutSessionView {
  email: string
  credits: number
  planId: PlanId | string
  planTitle: string
  amountCents: number
  accountExists: boolean
  status: PaymentStatus
  creditsGranted: boolean
}
