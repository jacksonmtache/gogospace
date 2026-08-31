export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
    openrouterApiKey: '',
    resendApiKey: '',
    resendFromEmail: 'GoGoSpace <noreply@gogospace.com>',
    public: {
      siteUrl: '',
    },
  },
  nitro: {
    maxRequestSize: 10 * 1024 * 1024,
  },
  app: {
    head: {
      title: 'GoGoSpace — AI Interior Design',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap',
        },
      ],
    },
  },
})
