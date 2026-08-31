<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const route = useRoute()
const { user, changePassword } = useAuth()

const editingAccount = computed(() => route.query.edit === 'account')

useHead({
  title: computed(() =>
    editingAccount.value ? 'Edit account — GoGoSpace' : 'Payments & Settings — GoGoSpace',
  ),
})

const currentPassword = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const pending = ref(false)

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

function openAccount() {
  resetPasswordForm()
  successMessage.value = ''
  return navigateTo({ path: '/dashboard/settings', query: { edit: 'account' } })
}

function closeAccount() {
  resetPasswordForm()
  return navigateTo('/dashboard/settings')
}

function onSectionAction(id: string) {
  if (id === 'account') openAccount()
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
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <template v-if="editingAccount">
      <header>
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base"
          @click="closeAccount"
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

    <template v-else>
      <header>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Payments & Settings</h1>
        <p class="mt-1 text-base text-muted-foreground sm:text-lg">
          Manage your billing and account preferences.
        </p>
      </header>

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
