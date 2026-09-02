<script setup lang="ts">
import type { PlanId } from '~/utils/plans'
import type { PaymentRecord } from '~/types/payment'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const route = useRoute()
const { user, changePassword, fetchUser } = useAuth()
const { startCheckout } = useCheckout()

const editingAccount = computed(() => route.query.edit === 'account')
const editingCredits = computed(() => route.query.edit === 'credits')
const editingHistory = computed(() => route.query.edit === 'history')
const checkoutSuccess = computed(() => route.query.checkout === 'success')

useHead({
  title: computed(() => {
    if (editingAccount.value) return 'Edit account — GoGoSpace'
    if (editingCredits.value) return 'Buy credits — GoGoSpace'
    if (editingHistory.value) return 'Payment history — GoGoSpace'
    return 'Payments & Settings — GoGoSpace'
  }),
})

const currentPassword = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const pending = ref(false)

const selectedPlan = ref<PlanId>('popular')
const checkoutPending = ref(false)
const checkoutError = ref('')
const plans = CREDIT_PLANS
const activePlan = computed(() => getPlan(selectedPlan.value)!)

const payments = ref<PaymentRecord[]>([])
const historyPending = ref(false)
const historyError = ref('')

const settingsSections = [
  {
    id: 'history',
    title: 'Payment history',
    description: 'View past purchases and download receipts.',
    action: 'View history',
  },
  {
    id: 'credits',
    title: 'Buy credits',
    description: 'Top up your account to generate more designs.',
    action: 'Buy credits',
  },
  {
    id: 'account',
    title: 'Account',
    description: 'View your email and change your password.',
    action: 'Edit account',
  },
]

function resetPasswordForm() {
  currentPassword.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  pending.value = false
}

function openSection(id: string) {
  resetPasswordForm()
  successMessage.value = ''
  checkoutError.value = ''
  return navigateTo({ path: '/dashboard/settings', query: { edit: id } })
}

function closeSection() {
  resetPasswordForm()
  checkoutError.value = ''
  return navigateTo('/dashboard/settings')
}

function onSectionAction(id: string) {
  openSection(id)
}

async function onChangePassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    errorMessage.value = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    return
  }

  pending.value = true
  try {
    await changePassword(currentPassword.value, password.value)
    resetPasswordForm()
    successMessage.value = 'Password updated.'
  } catch (error: unknown) {
    errorMessage.value = apiErrorMessage(error, 'Unable to update password')
  } finally {
    pending.value = false
  }
}

async function onBuyCredits() {
  checkoutError.value = ''
  checkoutPending.value = true
  try {
    await startCheckout(selectedPlan.value, 'settings')
  } catch (error: unknown) {
    checkoutError.value = apiErrorMessage(error, 'Unable to start checkout')
    checkoutPending.value = false
  }
}

async function loadHistory() {
  historyError.value = ''
  historyPending.value = true
  try {
    const data = await $fetch<{ payments: PaymentRecord[] }>('/api/payments', {
      credentials: 'include',
    })
    payments.value = data.payments
  } catch (error: unknown) {
    historyError.value = apiErrorMessage(error, 'Unable to load payment history')
  } finally {
    historyPending.value = false
  }
}

function formatPaymentDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function paymentStatusLabel(status: PaymentRecord['status']) {
  if (status === 'credited' || status === 'paid') return 'Paid'
  if (status === 'failed') return 'Failed'
  return 'Pending'
}

watch(editingHistory, (active) => {
  if (active) loadHistory()
}, { immediate: true })

onMounted(async () => {
  const sessionId = String(route.query.session_id || '').trim()
  if (sessionId) {
    try {
      await $fetch('/api/checkout/session', { query: { session_id: sessionId } })
    } catch (error) {
      console.error('Failed to confirm checkout session', error)
    }
  }
  if (checkoutSuccess.value || sessionId) {
    await fetchUser()
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <template v-if="editingAccount">
      <header>
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base"
          @click="closeSection"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to settings
        </button>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Edit account</h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          View your email and change your password.
        </p>
      </header>

      <div class="mt-8 space-y-4 sm:mt-10">
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 class="font-semibold text-foreground">Email</h2>
          <p class="mt-1 text-sm text-muted-foreground sm:text-base">
            This is the email you use to log in.
          </p>
          <input
            id="account-email"
            type="email"
            :value="user?.email || ''"
            readonly
            autocomplete="username"
            class="mt-4 w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-base text-muted-foreground outline-none"
          />
        </div>

        <form class="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" @submit.prevent="onChangePassword">
          <h2 class="font-semibold text-foreground">Change password</h2>
          <p class="mt-1 text-sm text-muted-foreground sm:text-base">
            Enter your current password, then choose a new one.
          </p>

          <div class="mt-5 space-y-5">
            <div>
              <label for="current-password" class="mb-2 block text-sm font-medium text-foreground">
                Current password
              </label>
              <input
                id="current-password"
                v-model="currentPassword"
                type="password"
                autocomplete="current-password"
                required
                placeholder="••••••••"
                class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>

            <div>
              <label for="new-password" class="mb-2 block text-sm font-medium text-foreground">
                New password
              </label>
              <input
                id="new-password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
                :minlength="MIN_PASSWORD_LENGTH"
                placeholder="••••••••"
                class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>

            <div>
              <label for="confirm-password" class="mb-2 block text-sm font-medium text-foreground">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                :minlength="MIN_PASSWORD_LENGTH"
                placeholder="••••••••"
                class="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>

            <p v-if="successMessage && !errorMessage" class="text-sm text-primary" role="status">
              {{ successMessage }}
            </p>

            <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
              :disabled="pending"
            >
              {{ pending ? 'Updating…' : 'Update password' }}
            </button>
          </div>
        </form>
      </div>
    </template>

    <template v-else-if="editingCredits">
      <header>
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base"
          @click="closeSection"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to settings
        </button>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Buy credits</h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          You have {{ user?.credits ?? 0 }} credit{{ (user?.credits ?? 0) === 1 ? '' : 's' }}. Choose a pack to top up.
        </p>
      </header>

      <p
        v-if="checkoutSuccess"
        class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:text-base"
        role="status"
      >
        Payment successful. Credits have been added to your account.
      </p>

      <div class="mt-8 space-y-3 sm:mt-10">
        <button
          v-for="plan in plans"
          :key="plan.id"
          type="button"
          class="relative w-full rounded-xl border-2 p-4 text-left transition-all sm:p-5"
          :class="
            selectedPlan === plan.id
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border bg-card hover:border-primary/30'
          "
          @click="selectedPlan = plan.id"
        >
          <span
            v-if="plan.badge"
            class="absolute -top-2.5 right-4 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs"
          >
            {{ plan.badge }}
          </span>

          <div class="flex items-center gap-3 sm:gap-4">
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6"
              :class="selectedPlan === plan.id ? 'border-primary' : 'border-muted-foreground/40'"
            >
              <span
                v-if="selectedPlan === plan.id"
                class="h-2.5 w-2.5 rounded-full bg-primary sm:h-3 sm:w-3"
              />
            </span>

            <div class="min-w-0 flex-1">
              <p
                class="text-base font-bold sm:text-lg"
                :class="selectedPlan === plan.id ? 'text-primary' : 'text-foreground'"
              >
                {{ plan.title }}
              </p>
              <p
                class="mt-0.5 text-sm sm:text-base"
                :class="selectedPlan === plan.id ? 'text-primary/80' : 'text-muted-foreground'"
              >
                {{ plan.description }}
              </p>
            </div>

            <p
              class="shrink-0 text-base font-bold sm:text-lg"
              :class="selectedPlan === plan.id ? 'text-primary' : 'text-foreground'"
            >
              {{ plan.price }}
            </p>
          </div>
        </button>
      </div>

      <p v-if="checkoutError" class="mt-4 text-sm text-red-600" role="alert">
        {{ checkoutError }}
      </p>

      <button
        type="button"
        class="btn-primary mt-6 flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70 sm:mt-8"
        :disabled="checkoutPending"
        @click="onBuyCredits"
      >
        {{ checkoutPending ? 'Redirecting to Stripe…' : `Buy credits · ${activePlan.price}` }}
      </button>

      <p class="mt-4 text-center text-xs text-muted-foreground sm:text-sm">
        You will be redirected to secure Stripe checkout.
      </p>
    </template>

    <template v-else-if="editingHistory">
      <header>
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base"
          @click="closeSection"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to settings
        </button>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Payment history</h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          Past purchases and receipts for this account.
        </p>
      </header>

      <p v-if="historyPending" class="mt-8 text-sm text-muted-foreground sm:text-base">
        Loading payment history…
      </p>
      <p v-else-if="historyError" class="mt-8 text-sm text-red-600 sm:text-base" role="alert">
        {{ historyError }}
      </p>
      <p v-else-if="payments.length === 0" class="mt-8 text-sm text-muted-foreground sm:text-base">
        No purchases yet.
      </p>
      <div v-else class="mt-8 space-y-3 sm:mt-10">
        <article
          v-for="payment in payments"
          :key="payment.id"
          class="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="font-semibold text-foreground">
                {{ getPlan(payment.planId)?.title || payment.planId }}
              </h2>
              <p class="mt-1 text-sm text-muted-foreground sm:text-base">
                {{ formatPaymentDate(payment.createdAt) }}
                ·
                {{ payment.credits }} credit{{ payment.credits === 1 ? '' : 's' }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-foreground">
                {{ formatUsd(payment.amountCents, payment.currency) }}
              </p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ paymentStatusLabel(payment.status) }}
              </p>
            </div>
          </div>
          <a
            v-if="payment.receiptUrl"
            :href="payment.receiptUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 inline-block text-sm font-medium text-primary hover:underline sm:text-base"
          >
            View receipt
          </a>
        </article>
      </div>
    </template>

    <template v-else>
      <header>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Payments & Settings</h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          Manage your billing and account preferences.
        </p>
      </header>

      <p
        v-if="checkoutSuccess"
        class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:text-base"
        role="status"
      >
        Payment successful. Credits have been added to your account.
      </p>

      <div class="mt-8 space-y-4 sm:mt-10">
        <div
          v-for="section in settingsSections"
          :key="section.id"
          class="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 class="font-semibold text-foreground">{{ section.title }}</h2>
            <p class="mt-1 text-sm text-muted-foreground sm:text-base">{{ section.description }}</p>
          </div>
          <button
            type="button"
            class="btn-outline shrink-0 rounded-lg px-4 py-2 text-sm font-medium sm:text-base"
            @click="onSectionAction(section.id)"
          >
            {{ section.action }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
