<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { scrollToSection } = useSiteNavigation()

useHead({
  title: 'Contact',
})

const contactChannels = [
  {
    title: 'General inquiries',
    description: 'Questions about GoGoSpace, your account, or how the Service works.',
    email: 'hello@gogospace.com',
  },
  {
    title: 'Privacy & data requests',
    description: 'Access, correction, or deletion requests related to your personal data.',
    email: 'privacy@gogospace.com',
  },
  {
    title: 'Partnerships',
    description: 'Business development, press, and collaboration opportunities.',
    email: 'partners@gogospace.com',
  },
]
</script>

<template>
  <section class="section-padding pt-24 sm:pt-28">
    <div class="mx-auto max-w-3xl px-4 sm:px-6">
      <header class="text-center">
        <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Contact Us
        </h1>
        <p class="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
          Have a question or feedback? Reach out and we'll get back to you within 1–2 business days.
        </p>
      </header>

      <div class="mt-10 grid gap-5 sm:mt-14 sm:gap-6">
        <div
          v-for="channel in contactChannels"
          :key="channel.title"
          class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <h2 class="text-lg font-semibold text-foreground sm:text-xl">{{ channel.title }}</h2>
          <p class="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {{ channel.description }}
          </p>
          <a
            :href="`mailto:${channel.email}`"
            class="mt-4 inline-block text-base font-medium text-primary hover:underline sm:text-lg"
          >
            {{ channel.email }}
          </a>
        </div>
      </div>

      <div class="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-center sm:mt-12 sm:p-8">
        <p class="text-base text-muted-foreground sm:text-lg">
          Looking for quick answers? Check the
          <button
            type="button"
            class="font-medium text-primary hover:underline"
            @click="scrollToSection('faq')"
          >
            FAQ
          </button>
          on our homepage.
        </p>
      </div>
    </div>
  </section>
</template>
