<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const id = typeof route.query.id === 'string' ? route.query.id : ''

await navigateTo(id ? `/dashboard/${id}` : '/dashboard', { redirectCode: 301 })
</script>

<template>
  <div />
</template>
