<script setup lang="ts">
import type { CheckoutSessionView } from '~/types/payment'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Complete your purchase — GoGoSpace',
})

const route = useRoute()
const { registerFromCheckout } = useAuth()

const sessionId = computed(() => String(route.query.session_id || '').trim())
const checkout = ref<CheckoutSessionView | null>(null)
const loading = ref(Boolean(String(route.query.session_id || '').trim()))
const loadError = ref(
  String(route.query.session_id || '').trim()
    ? ''
    : 'This checkout link is missing. If you already paid, check the email you used in Stripe.',
)
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const pending = ref(false)

async function loadSession() {
  loadError.value = ''
  checkout.value = null

  if (!sessionId.value) {
    loadError.value = 'This checkout link is missing. If you already paid, check the email you used in Stripe.'
    loading.value = false
    return
  }

  loading.value = true
  try {
    checkout.value = await $fetch<CheckoutSessionView>('/api/checkout/session', {
      query: { session_id: sessionId.value },
    })
  } catch (error: unknown) {
    loadError.value = apiErrorMessage(error, 'Unable to confirm this payment')
  } finally {
    loading.value = false
  }
}

async function onCreateAccount() {
  errorMessage.value = ''

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
    await registerFromCheckout(sessionId.value, password.value)
    await navigateTo('/dashboard')
  } catch (error: unknown) {
    errorMessage.value = apiErrorMessage(error, 'Unable to create account')
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  if (sessionId.value) loadSession()
})
</script>

<template>
  <section class="section-padding pt-24 sm:pt-28">
    <div class="mx-auto w-full max-w-md px-4 sm:px-6">
      <header class="text-center">
        <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Payment successful
        </h1>
        <p class="mt-3 text-base text-muted-foreground sm:text-lg">
          {{
            checkout
              ? `${checkout.credits} credit${checkout.credits === 1 ? '' : 's'} from ${checkout.planTitle}`
              : 'Confirming your Stripe payment.'
          }}
        </p>
      </header>

      <div class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:mt-10 sm:p-8">
        <p v-if="loading" class="text-center text-sm text-muted-foreground sm:text-base">
          Confirming your payment…
        </p>

        <div v-else-if="loadError" class="space-y-3 text-center">
          <p class="text-sm text-red-600 sm:text-base" role="alert">{{ loadError }}</p>
          <NuxtLink to="/unlock" class="inline-block font-medium text-primary hover:underline">
            Back to plans
          </NuxtLink>
        </div>

        <div v-else-if="checkout?.accountExists" class="space-y-5">
          <p class="text-sm text-muted-foreground sm:text-base">
            Credits were added to
            <span class="font-medium text-foreground">{{ checkout.email }}</span>.
            Log in to start generating designs.
          </p>
          <NuxtLink
            :to="{ path: '/login', query: { email: checkout.email, paid: '1' } }"
            class="btn-primary flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-medium"
          >
            Log in
          </NuxtLink>
        </div>

        <form v-else-if="checkout" class="space-y-5" @submit.prevent="onCreateAccount">
          <p class="text-sm text-muted-foreground sm:text-base">
            Create an account for
            <span class="font-medium text-foreground">{{ checkout.email }}</span>
            to claim your credits.
          </p>

          <div>
            <label for="checkout-email" class="mb-2 block text-sm font-medium text-foreground">Email</label>
            <input
              id="checkout-email"
              type="email"
              :value="checkout.email"
              readonly
              autocomplete="username"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-base text-muted-foreground outline-none"
            />
          </div>

          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-foreground">Password</label>
            <input
              id="password"
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
            <label for="confirm-password" class="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
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

          <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full rounded-lg px-6 py-3 text-base font-medium disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="pending"
          >
            {{ pending ? 'Creating account…' : 'Create account' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
