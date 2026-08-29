<script setup lang="ts">
const mobileMenuOpen = ref(false)
const { navLinks, scrollToSection } = useSiteNavigation()
const { triggerUpload } = useUploadTrigger()
const { user, logout } = useAuth()
const loggingOut = ref(false)

function goToSection(id: string) {
  scrollToSection(id)
  mobileMenuOpen.value = false
}

function onUploadClick() {
  triggerUpload()
  mobileMenuOpen.value = false
}

async function onLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  mobileMenuOpen.value = false
  try {
    await logout()
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex h-16 items-center justify-between gap-3">
        <NuxtLink
          to="/#hero"
          class="flex min-w-0 shrink items-center gap-2"
          @click.prevent="goToSection('hero')"
        >
          <img src="/images/logo.avif" alt="GoGoSpace" class="h-9 w-auto shrink-0 sm:h-10" />
          <span class="truncate text-lg font-semibold tracking-tight sm:text-xl">
            GoGo<span class="text-primary">Space</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">
          <a
            v-for="link in navLinks"
            :key="link.id"
            :href="'#' + link.id"
            class="text-sm xl:text-base text-muted-foreground transition-colors hover:text-foreground"
            @click.prevent="scrollToSection(link.id)"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="hidden items-center gap-2 sm:gap-3 md:flex">
          <template v-if="user">
            <NuxtLink
              to="/dashboard"
              class="btn-outline rounded-md px-3 py-2 text-sm font-medium sm:px-5 sm:py-2.5 sm:text-base"
            >
              Dashboard
            </NuxtLink>
            <button
              type="button"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4 sm:py-2.5 sm:text-base"
              :disabled="loggingOut"
              @click="onLogout"
            >
              {{ loggingOut ? 'Signing out…' : 'Log out' }}
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="btn-outline rounded-md px-3 py-2 text-sm font-medium sm:px-5 sm:py-2.5 sm:text-base"
            >
              Login
            </NuxtLink>
            <button
              class="btn-primary rounded-md px-3 py-2 text-sm font-medium sm:px-5 sm:py-2.5 sm:text-base"
              @click="onUploadClick"
            >
              <span class="hidden sm:inline">Upload photo</span>
              <span class="sm:hidden">Upload</span>
            </button>
          </template>
        </div>

        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground md:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mobile-menu border-t border-border/60 md:hidden" :class="{ open: mobileMenuOpen }">
        <nav class="flex flex-col gap-1 py-3">
          <a
            v-for="link in navLinks"
            :key="link.id"
            :href="'#' + link.id"
            class="rounded-md px-3 py-2.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click.prevent="goToSection(link.id)"
          >
            {{ link.label }}
          </a>
        </nav>
        <div class="flex flex-col gap-2 border-t border-border/60 py-3">
          <template v-if="user">
            <NuxtLink
              to="/dashboard"
              class="btn-outline w-full rounded-md px-4 py-2.5 text-center text-base font-medium"
              @click="mobileMenuOpen = false"
            >
              Dashboard
            </NuxtLink>
            <button
              type="button"
              class="w-full rounded-md px-4 py-2.5 text-center text-base font-medium text-muted-foreground"
              :disabled="loggingOut"
              @click="onLogout"
            >
              {{ loggingOut ? 'Signing out…' : 'Log out' }}
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="btn-outline w-full rounded-md px-4 py-2.5 text-center text-base font-medium"
              @click="mobileMenuOpen = false"
            >
              Login
            </NuxtLink>
            <button class="btn-primary w-full rounded-md px-4 py-2.5 text-base font-medium" @click="onUploadClick">
              Upload photo
            </button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
