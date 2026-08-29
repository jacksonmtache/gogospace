import type { Generation } from '~/types/generation'
import type { GenerationRow } from '../../utils/designs'

export default defineEventHandler(async (event): Promise<{ generations: Generation[] }> => {
  const { accessToken, authUser } = await requireUserSession(event)
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('generations')
    .select(GENERATION_COLUMNS)
    .eq('user_id', authUser.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load generations' })
  }

  const generations = await Promise.all(
    ((data ?? []) as GenerationRow[]).map((row) => toGeneration(row, accessToken)),
  )

  return { generations }
})
