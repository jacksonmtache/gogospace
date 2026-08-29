import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'test@gogospace.com'
const PASSWORD = 'jackson123'
const CREDITS = 100

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

async function findUserByEmail(admin, email) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  loadEnv()

  const url = process.env.NUXT_SUPABASE_URL
  const serviceRoleKey = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error('Missing NUXT_SUPABASE_URL or NUXT_SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let userId
  const created = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })

  if (created.error) {
    const alreadyExists =
      created.error.status === 422 ||
      /already been registered|already exists/i.test(created.error.message)

    if (!alreadyExists) {
      throw created.error
    }

    const existing = await findUserByEmail(admin, EMAIL)
    if (!existing) {
      throw new Error(`User ${EMAIL} already exists but could not be loaded`)
    }
    userId = existing.id
    console.log(`User already exists (${userId}), updating credits to ${CREDITS}`)
  } else {
    userId = created.data.user.id
    console.log(`Created user ${EMAIL} (${userId})`)
  }

  const { error: upsertError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: EMAIL,
      credits: CREDITS,
    },
    { onConflict: 'id' },
  )

  if (upsertError) throw upsertError

  console.log(`Profile ready: ${EMAIL} has ${CREDITS} credits`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
