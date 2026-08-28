<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border py-8 sm:py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:gap-6 sm:text-left">
        <div class="flex items-center gap-2.5">
          <img src="/images/logo.avif" alt="GoGoSpace" class="h-9 w-auto" />
          <span class="text-lg font-semibold">GoGo<span class="text-primary">Space</span></span>
        </div>
        <p class="text-base text-muted-foreground">&copy; {{ currentYear }} GoGoSpace. All rights reserved.</p>
        <div class="flex gap-6 text-base text-muted-foreground">
          <NuxtLink to="/policy" class="hover:text-foreground">Privacy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-foreground">Terms</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-foreground">Contact</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
