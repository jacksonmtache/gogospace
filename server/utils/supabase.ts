import { createClient, type User } from '@supabase/supabase-js'

function readSupabaseConfig() {
  const config = useRuntimeConfig()
  return {
    url: String(config.supabaseUrl || ''),
    anonKey: String(config.supabaseAnonKey || ''),
    serviceRoleKey: String(config.supabaseServiceRoleKey || ''),
  }
}

export function isSupabaseConfigured() {
  const { url, anonKey } = readSupabaseConfig()
  return Boolean(url && anonKey)
}

function getSupabaseConfig() {
  const config = readSupabaseConfig()
  if (!config.url || !config.anonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured. Set NUXT_SUPABASE_URL and NUXT_SUPABASE_ANON_KEY.',
    })
  }
  return config
}

export function createAnonClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig()
  if (!serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase service role is not configured. Set NUXT_SUPABASE_SERVICE_ROLE_KEY.',
    })
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createUserClient(accessToken: string) {
  const { url, anonKey } = getSupabaseConfig()
  return createClient(url, anonKey, {
    accessToken: async () => accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type { User }
