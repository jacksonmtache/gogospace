<script setup lang="ts">
import type { PlanId } from '~/utils/plans'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Unlock Your Designs',
})

const { session } = usePreviewSession()
const { startCheckout } = useCheckout()
const selectedPlan = ref<PlanId>('popular')
const previewStyleName = ref('')
const checkoutPending = ref(false)
const checkoutError = ref('')

onMounted(() => {
  previewStyleName.value = getDesignStyle(session.value?.style || '')?.name || ''
})

const plans = CREDIT_PLANS
const activePlan = computed(() => getPlan(selectedPlan.value)!)

async function onUnlock() {
  checkoutError.value = ''
  checkoutPending.value = true
  try {
    await startCheckout(selectedPlan.value, 'unlock')
  } catch (error: unknown) {
    checkoutError.value = apiErrorMessage(error, 'Unable to start checkout')
    checkoutPending.value = false
  }
}
</script>

<template>
  <section class="unlock-page section-padding pt-20 sm:pt-24">
    <div class="mx-auto max-w-lg px-4 sm:px-6">
      <header class="text-center">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Generation complete
        </span>

        <h1 class="mt-5 text-2xl font-bold uppercase tracking-[0.15em] text-primary sm:mt-6 sm:text-3xl">
          Unlock your designs
        </h1>
        <p class="mt-2 text-base text-muted-foreground sm:text-lg">
          {{
            previewStyleName
              ? `We generated 1 ${previewStyleName} style for your space`
              : 'We generated 1 style for your space'
          }}
        </p>

        <div class="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:text-base">
          <div class="flex gap-0.5">
            <span v-for="n in 5" :key="n" class="text-primary">★</span>
          </div>
          <span class="font-medium text-foreground">4.8</span>
          <span>·</span>
          <span>231 spaces transformed</span>
        </div>
      </header>

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

      <p v-if="checkoutError" class="mt-4 text-center text-sm text-red-600" role="alert">
        {{ checkoutError }}
      </p>

      <button
        type="button"
        class="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70 sm:mt-8 sm:py-4 sm:text-lg"
        :disabled="checkoutPending"
        @click="onUnlock"
      >
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        {{ checkoutPending ? 'Redirecting to Stripe…' : `Unlock designs · ${activePlan.price}` }}
      </button>

      <div class="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <p class="text-center text-xs text-muted-foreground sm:text-sm">
          *You will be redirected to secure Stripe checkout
        </p>
        <img
          src="/images/credit-cards-stripe.png"
          alt="Stripe, Visa, Mastercard, American Express, UnionPay"
          class="h-6 w-auto object-contain opacity-80 sm:h-7"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.unlock-page {
  background-image:
    radial-gradient(circle at 50% 0%, rgb(4 77 180 / 0.08), transparent 55%),
    radial-gradient(circle, rgb(4 77 180 / 0.1) 1px, transparent 1px);
  background-size: auto, 18px 18px;
  min-height: calc(100vh - 4rem);
}
</style>
