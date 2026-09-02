export type PlanId = 'basic' | 'popular' | 'premium'

export interface CreditPlan {
  id: PlanId
  title: string
  description: string
  price: string
  priceValue: number
  amountCents: number
  credits: number
  badge?: string
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'basic',
    title: '1 design',
    description: 'One-time purchase.',
    price: 'US$3.99',
    priceValue: 3.99,
    amountCents: 399,
    credits: 1,
  },
  {
    id: 'popular',
    title: '20 designs / refinements',
    description: 'Compare different styles and refine your designs.',
    price: 'US$9.99',
    priceValue: 9.99,
    amountCents: 999,
    credits: 20,
    badge: 'Most popular',
  },
  {
    id: 'premium',
    title: '60 designs / refinements',
    description: 'Explore every possibility and refine until it feels right.',
    price: 'US$19.99',
    priceValue: 19.99,
    amountCents: 1999,
    credits: 60,
  },
]

export function isPlanId(value: string): value is PlanId {
  return CREDIT_PLANS.some((plan) => plan.id === value)
}

export function getPlan(id: string): CreditPlan | undefined {
  return CREDIT_PLANS.find((plan) => plan.id === id)
}

export function formatUsd(amountCents: number, currency = 'usd') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `US$${(amountCents / 100).toFixed(2)}`
  }
}
